"""Checklist 1.2.5: validate the BCG ontology and the Neo4j graph against it.

Three layers of checking:
  1. TBox structure  - every property has a domain/range, every referenced class is
                       declared, every Neo4j label / relationship type is in the ontology.
  2. ABox conformance - every relationship's endpoints fall inside the property's
                       declared domain and range (union classes and subclasses expanded).
                       OWL is open-world, so a reasoner would silently *infer* a type for a
                       misplaced endpoint; this closed-world check catches that instead.
  3. OWL 2 RL reasoning - the ontology plus the graph as individuals is closed with owlrl;
                       any inconsistency (disjoint-class clash, owl:Nothing member,
                       functional-property conflict) is reported.

Usage:
    python validate_owl.py              # validate ontology + current Neo4j graph
    python validate_owl.py --self-test  # also prove the checks catch injected faults
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from datetime import datetime, timezone
from urllib.parse import quote

import owlrl
from owlrl.Namespaces import ERRNS
from rdflib import OWL, RDF, RDFS, XSD, Graph, Literal, Namespace, URIRef
from rdflib.collection import Collection

from kg_common import DATA_LABELS, ONTOLOGY_FILE, ONTOLOGY_NS, REPORT_DIR, driver

NS = Namespace(ONTOLOGY_NS)
IND = Namespace(ONTOLOGY_NS.rstrip("#") + "/individual/")
BUILTIN_CLASSES = {OWL.Thing, OWL.Nothing, RDFS.Literal}


def load_tbox() -> Graph:
    g = Graph()
    g.parse(ONTOLOGY_FILE, format="turtle")
    return g


def members(g: Graph, head) -> list:
    return list(Collection(g, head))


# ----------------------------------------------------------------- TBox

def check_tbox(g: Graph, labels: set[str], rel_types: set[str]) -> dict:
    classes = set(g.subjects(RDF.type, OWL.Class))
    named_classes = {c for c in classes if isinstance(c, URIRef)}
    object_props = set(g.subjects(RDF.type, OWL.ObjectProperty))
    data_props = set(g.subjects(RDF.type, OWL.DatatypeProperty))

    issues: list[str] = []
    for prop in sorted(object_props):
        for axis in (RDFS.domain, RDFS.range):
            if g.value(prop, axis) is None:
                issues.append(f"object property {local(prop)} has no {local(axis)}")
    for prop in sorted(data_props):
        if g.value(prop, RDFS.range) is None:
            issues.append(f"datatype property {local(prop)} has no range")

    referenced = set()
    for prop in object_props:
        referenced.update(o for o in g.objects(prop, RDFS.domain))
        referenced.update(o for o in g.objects(prop, RDFS.range))
    for prop in data_props:
        referenced.update(o for o in g.objects(prop, RDFS.domain))
    referenced.update(g.objects(None, RDFS.subClassOf))
    for head in g.objects(None, OWL.members):
        referenced.update(members(g, head))
    for head in g.objects(None, OWL.unionOf):
        referenced.update(members(g, head))
    for cls in sorted(c for c in referenced if isinstance(c, URIRef)):
        if cls not in named_classes and cls not in BUILTIN_CLASSES:
            issues.append(f"class {local(cls)} is referenced but not declared")

    for label in sorted(labels):
        if NS[label] not in named_classes:
            issues.append(f"Neo4j label {label} has no ontology class")
    for rel in sorted(rel_types):
        if NS[rel] not in object_props:
            issues.append(f"Neo4j relationship {rel} has no ontology object property")

    return {
        "classes": len(named_classes),
        "object_properties": len(object_props),
        "datatype_properties": len(data_props),
        "disjointness_axioms": len(set(g.subjects(RDF.type, OWL.AllDisjointClasses))),
        "issues": issues,
        "pass": not issues,
    }


# ------------------------------------------------------------ class expansion

def class_extension(g: Graph) -> dict[URIRef, set[URIRef]]:
    """Map each named class to the set of named classes whose members it contains."""
    extension: dict[URIRef, set[URIRef]] = defaultdict(set)
    named = {c for c in g.subjects(RDF.type, OWL.Class) if isinstance(c, URIRef)}
    for cls in named:
        extension[cls].add(cls)
    for sub, sup in g.subject_objects(RDFS.subClassOf):
        extension[sup].add(sub)
    for cls, equivalent in g.subject_objects(OWL.equivalentClass):
        for head in g.objects(equivalent, OWL.unionOf):
            extension[cls].update(members(g, head))

    changed = True
    while changed:
        changed = False
        for cls, covered in extension.items():
            closure = set(covered)
            for inner in covered:
                closure |= extension.get(inner, set())
            if closure != covered:
                extension[cls] = closure
                changed = True
    return extension


# ----------------------------------------------------------------- ABox

def fetch_graph() -> tuple[list[dict], list[dict]]:
    with driver() as drv, drv.session() as session:
        nodes = [dict(r) for r in session.run(
            "MATCH (n) WHERE n.uid IS NOT NULL AND any(l IN labels(n) WHERE l IN $labels) "
            "RETURN n.uid AS uid, [l IN labels(n) WHERE l IN $labels] AS labels, "
            "n.name AS name, n.url AS url, n.source AS source",
            labels=list(DATA_LABELS),
        )]
        edges = [dict(r) for r in session.run(
            "MATCH (a)-[r]->(b) WHERE a.uid IS NOT NULL AND b.uid IS NOT NULL "
            "RETURN a.uid AS start, type(r) AS type, b.uid AS end"
        )]
    return nodes, edges


def individual(uid: str) -> URIRef:
    return IND[quote(uid, safe="")]


def check_conformance(g: Graph, nodes: list[dict], edges: list[dict]) -> dict:
    extension = class_extension(g)
    types = {n["uid"]: {NS[label] for label in n["labels"]} for n in nodes}
    violations: list[dict] = []
    per_property: dict[str, int] = defaultdict(int)

    for edge in edges:
        prop = NS[edge["type"]]
        per_property[edge["type"]] += 1
        for axis, uid in ((RDFS.domain, edge["start"]), (RDFS.range, edge["end"])):
            expected = g.value(prop, axis)
            if expected is None:
                continue
            allowed = extension.get(expected, {expected})
            if not types.get(uid, set()) & allowed:
                violations.append({
                    "edge": f"({edge['start']})-[:{edge['type']}]->({edge['end']})",
                    "axis": local(axis),
                    "expected": local(expected),
                    "actual": sorted(local(t) for t in types.get(uid, set())) or ["<untyped>"],
                })

    multi_typed = [n["uid"] for n in nodes if len(n["labels"]) > 1]
    return {
        "individuals": len(nodes),
        "property_assertions": len(edges),
        "per_property": dict(sorted(per_property.items())),
        "multi_typed_nodes": multi_typed,
        "violations": violations,
        "pass": not violations,
    }


def abox(nodes: list[dict], edges: list[dict]) -> Graph:
    g = Graph()
    for node in nodes:
        ind = individual(node["uid"])
        g.add((ind, RDF.type, OWL.NamedIndividual))
        for label in node["labels"]:
            g.add((ind, RDF.type, NS[label]))
        if node.get("name"):
            g.add((ind, NS.name, Literal(node["name"], datatype=XSD.string)))
        if node.get("url"):
            g.add((ind, NS.url, Literal(node["url"], datatype=XSD.anyURI)))
    for edge in edges:
        g.add((individual(edge["start"]), NS[edge["type"]], individual(edge["end"])))
    return g


def check_reasoner(tbox: Graph, data: Graph) -> dict:
    g = Graph()
    for triple in tbox:
        g.add(triple)
    for triple in data:
        g.add(triple)
    asserted = len(g)
    owlrl.DeductiveClosure(owlrl.OWLRL_Semantics, axiomatic_triples=False, datatype_axioms=False).expand(g)
    errors = sorted(str(m) for m in g.objects(None, ERRNS.error))
    nothing = sorted(str(s) for s in g.subjects(RDF.type, OWL.Nothing))
    return {
        "reasoner": f"owlrl {owlrl.__version__} (OWL 2 RL closure)",
        "asserted_triples": asserted,
        "closure_triples": len(g),
        "inconsistencies": errors,
        "owl_nothing_members": nothing,
        "pass": not errors and not nothing,
    }


# ------------------------------------------------------------ self-test

def self_test(tbox: Graph, nodes: list[dict], edges: list[dict]) -> dict:
    """Inject known faults and confirm each check reports them."""
    faculty = next(n for n in nodes if "Faculty" in n["labels"])
    keyword = next(n for n in nodes if "Keyword" in n["labels"])

    clash_nodes = [dict(faculty, labels=["Faculty", "Topic"]) if n is faculty else n for n in nodes]
    clash = check_reasoner(tbox, abox(clash_nodes, edges))

    bad_edge = {"start": faculty["uid"], "type": "isFeedstockOf", "end": keyword["uid"]}
    misplaced = check_conformance(tbox, nodes, [*edges, bad_edge])

    return {
        "disjoint_clash_detected": not clash["pass"],
        "disjoint_clash_messages": clash["inconsistencies"][:3],
        "domain_violation_detected": not misplaced["pass"],
        "domain_violation_example": misplaced["violations"][:1],
        "pass": (not clash["pass"]) and (not misplaced["pass"]),
    }


# -------------------------------------------------------------- report

def local(term) -> str:
    text = str(term)
    return text.rsplit("#", 1)[-1] if "#" in text else text.rsplit("/", 1)[-1]


def render_markdown(report: dict) -> str:
    tbox, conf, reason = report["tbox"], report["conformance"], report["reasoner"]
    lines = [
        "# OWL validation report (checklist 1.2.5)",
        "",
        f"Generated: {report['generated_at']}",
        f"Ontology: `{report['ontology']}`",
        "",
        "| Check | Result |",
        "|---|---|",
        f"| TBox structure | {'PASS' if tbox['pass'] else 'FAIL'} |",
        f"| Domain/range conformance | {'PASS' if conf['pass'] else 'FAIL'} |",
        f"| OWL 2 RL consistency | {'PASS' if reason['pass'] else 'FAIL'} |",
    ]
    if report.get("self_test"):
        lines.append(f"| Self-test (injected faults caught) | {'PASS' if report['self_test']['pass'] else 'FAIL'} |")
    lines += [
        "",
        "## TBox",
        "",
        f"{tbox['classes']} classes, {tbox['object_properties']} object properties, "
        f"{tbox['datatype_properties']} datatype properties, {tbox['disjointness_axioms']} disjointness axioms.",
        "",
    ]
    lines += [f"- {i}" for i in tbox["issues"]] or ["No structural issues."]
    lines += [
        "",
        "## Domain/range conformance",
        "",
        f"{conf['individuals']} individuals, {conf['property_assertions']} property assertions.",
        "",
        "| Property | Assertions |",
        "|---|---|",
    ]
    lines += [f"| {p} | {n} |" for p, n in conf["per_property"].items()]
    lines.append("")
    if conf["violations"]:
        lines.append(f"{len(conf['violations'])} violations (first 30):")
        lines += [f"- {v['edge']}: {v['axis']} expects {v['expected']}, got {', '.join(v['actual'])}"
                  for v in conf["violations"][:30]]
    else:
        lines.append("Every relationship endpoint lies inside its property's domain and range.")
    lines += [
        "",
        "## Reasoner",
        "",
        f"{reason['reasoner']}: {reason['asserted_triples']} asserted triples, "
        f"{reason['closure_triples']} after closure.",
        "",
    ]
    if reason["inconsistencies"] or reason["owl_nothing_members"]:
        lines += [f"- {m}" for m in reason["inconsistencies"][:30]]
        lines += [f"- owl:Nothing member: {m}" for m in reason["owl_nothing_members"][:30]]
    else:
        lines.append("No inconsistency: no disjoint-class clash, no owl:Nothing member, no functional-property conflict.")
    if report.get("self_test"):
        st = report["self_test"]
        lines += [
            "",
            "## Self-test",
            "",
            f"- Faculty individual also typed Topic (disjoint classes): detected = {st['disjoint_clash_detected']}",
            f"- Faculty as subject of isFeedstockOf (domain KeywordOrConcept): detected = {st['domain_violation_detected']}",
        ]
    lines += [
        "",
        "Note: HermiT/Pellet need a JVM, so the reasoner is owlrl (OWL 2 RL profile: subclass, disjointness, "
        "domain/range, functional property). The one construct outside RL, a union class used as a superclass "
        "(KeywordOrConcept, TopicOrResource, ResearchOrDocument), is covered by the closed-world conformance check.",
    ]
    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--self-test", action="store_true", help="also verify that injected faults are detected")
    args = parser.parse_args()

    tbox = load_tbox()
    nodes, edges = fetch_graph()
    labels = {label for n in nodes for label in n["labels"]}
    rel_types = {e["type"] for e in edges}

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "ontology": str(ONTOLOGY_FILE.relative_to(ONTOLOGY_FILE.parents[1])),
        "tbox": check_tbox(tbox, labels, rel_types),
        "conformance": check_conformance(tbox, nodes, edges),
        "reasoner": check_reasoner(tbox, abox(nodes, edges)),
    }
    if args.self_test:
        report["self_test"] = self_test(tbox, nodes, edges)
    report["pass"] = all(report[k]["pass"] for k in ("tbox", "conformance", "reasoner", *(["self_test"] if args.self_test else [])))

    REPORT_DIR.mkdir(exist_ok=True)
    (REPORT_DIR / "owl-validation.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    markdown = render_markdown(report)
    (REPORT_DIR / "owl-validation.md").write_text(markdown, encoding="utf-8")
    print(markdown)
    raise SystemExit(0 if report["pass"] else 1)


if __name__ == "__main__":
    main()
