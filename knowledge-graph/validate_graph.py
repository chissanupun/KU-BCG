"""Check the Neo4j knowledge graph against checklist items 1.2.1-1.2.4.

Usage:
    python validate_graph.py                # graph checks only
    python validate_graph.py --check-urls   # also HTTP-check every source URL

Writes reports/graph-validation.json and reports/graph-validation.md.
"""

from __future__ import annotations

import argparse
import json
import re
import urllib.error
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

from build_graph import build_model
from kg_common import CONCEPT_LABELS, DATA_LABELS, FACULTIES, REPORT_DIR, SOURCES, driver, load_seed

EXACT_COUNTS = {"Topic": 6, "Faculty": 4, "BCGPillar": 3, "Course": 6}
MINIMUM_COUNTS = {"Keyword": 23, "Research": 50, "Document": 5, "Author": 10}
REQUIRED_PREDICATES = ("isFeedstockOf", "mitigatesCarbonVia", "enhancesGrowthOf", "integratesSpecies")
LABEL_SOURCE = {"Research": "KU_Forest", "Document": "KUKR", "Course": "KU_MOOC"}
CARBON_TOPIC_UID = "topic:4"
TRAVERSAL_THRESHOLD = 0.80


def check_node_counts(session) -> dict:
    counts = {r["label"]: r["n"] for r in session.run(
        "UNWIND $labels AS label CALL (label) { MATCH (n) WHERE label IN labels(n) RETURN count(n) AS n } "
        "RETURN label, n", labels=list(DATA_LABELS))}
    rows = []
    for label, expected in EXACT_COUNTS.items():
        rows.append({"label": label, "rule": f"= {expected}", "actual": counts.get(label, 0),
                     "pass": counts.get(label, 0) == expected})
    for label, minimum in MINIMUM_COUNTS.items():
        rows.append({"label": label, "rule": f">= {minimum}", "actual": counts.get(label, 0),
                     "pass": counts.get(label, 0) >= minimum})

    wrong_source = {r["label"]: r["n"] for r in session.run(
        "UNWIND $pairs AS p CALL (p) { MATCH (n) WHERE p.label IN labels(n) AND n.source <> p.source "
        "RETURN count(n) AS n } RETURN p.label AS label, n",
        pairs=[{"label": k, "source": v} for k, v in LABEL_SOURCE.items()])}
    core = sum(counts.get(label, 0) for label in EXACT_COUNTS)
    return {
        "counts": counts,
        "rows": rows,
        "core_total": core,
        "wrong_source": wrong_source,
        "pass": all(r["pass"] for r in rows) and core == 19 and not any(wrong_source.values()),
    }


def check_predicates(session) -> dict:
    seed = load_seed()
    expected_pairs = sorted({(t["id"], rel["predicate"]) for t in seed["topics"] for rel in t["relations"]})
    present = {(r["topic_id"], r["predicate"]): r["n"] for r in session.run(
        "MATCH ()-[r]->() WHERE r.origin = 'seed' RETURN r.topic_id AS topic_id, type(r) AS predicate, count(r) AS n")}
    predicate_types = sorted({p for _, p in present})
    pair_rows = [{"topic_id": t, "predicate": p, "triples": present.get((t, p), 0)} for t, p in expected_pairs]
    covered = sum(1 for row in pair_rows if row["triples"] > 0)
    topics = sorted(t["id"] for t in seed["topics"])
    full_matrix = sum(1 for t in topics for p in predicate_types if present.get((t, p)))
    missing_required = [p for p in REQUIRED_PREDICATES if p not in predicate_types]
    return {
        "predicate_types": predicate_types,
        "pair_rows": pair_rows,
        "seed_pairs_covered": covered,
        "seed_pairs_total": len(expected_pairs),
        "full_matrix_covered": full_matrix,
        "full_matrix_total": len(topics) * len(predicate_types),
        "missing_required": missing_required,
        "pass": len(predicate_types) >= 6 and covered == len(expected_pairs) and not missing_required,
    }


def check_carbon_hub(session) -> dict:
    linked = [r["name"] for r in session.run(
        "MATCH (f:Faculty)-[:mitigatesCarbonVia]->(t:Topic {uid: $uid}) RETURN DISTINCT f.name AS name ORDER BY name",
        uid=CARBON_TOPIC_UID)]

    whole = list(session.run(
        "MATCH (n) WHERE any(l IN labels(n) WHERE l IN $labels) "
        "RETURN n.uid AS uid, n.name AS name, labels(n)[0] AS label, COUNT { (n)--() } AS degree "
        "ORDER BY degree DESC, uid", labels=list(DATA_LABELS)))
    concept = list(session.run(
        "MATCH (n) WHERE any(l IN labels(n) WHERE l IN $labels) "
        "RETURN n.uid AS uid, n.name AS name, labels(n)[0] AS label, "
        "COUNT { (n)--(m) WHERE any(l IN labels(m) WHERE l IN $labels) } AS degree "
        "ORDER BY degree DESC, uid", labels=list(CONCEPT_LABELS)))

    def summarize(rows):
        ranked = [dict(r) for r in rows]
        carbon = next(r for r in ranked if r["uid"] == CARBON_TOPIC_UID)
        top = ranked[0]["degree"]
        return {
            "top": ranked[:5],
            "carbon_degree": carbon["degree"],
            "carbon_rank": 1 + sum(1 for r in ranked if r["degree"] > carbon["degree"]),
            "is_highest": carbon["degree"] == top and sum(1 for r in ranked if r["degree"] == top) == 1,
        }

    concept_summary = summarize(concept)
    whole_summary = summarize(whole)
    all_faculties = sorted(linked) == sorted(FACULTIES)
    return {
        "faculties_via_mitigatesCarbonVia": linked,
        "all_four_faculties": all_faculties,
        "concept_layer": concept_summary,
        "whole_graph": whole_summary,
        "pass": all_faculties and concept_summary["is_highest"],
    }


def check_traversal(session) -> dict:
    rows = [dict(r) for r in session.run(
        """
        MATCH (r) WHERE r:Research OR r:Document OR r:Course
        UNWIND $sources AS target
        WITH r, target WHERE r.source <> target
        WITH r, target,
             EXISTS { MATCH (r)-[:about|teaches]->(:Topic)<-[:about|teaches]-(x) WHERE x.source = target } AS via_topic,
             EXISTS { MATCH (r)-[:hasKeyword]->(:Keyword)<-[:hasKeyword]-(x) WHERE x.source = target } AS via_keyword
        RETURN r.source AS source, target, count(*) AS total,
               sum(CASE WHEN via_topic OR via_keyword THEN 1 ELSE 0 END) AS ok,
               sum(CASE WHEN via_topic THEN 1 ELSE 0 END) AS ok_topic,
               sum(CASE WHEN via_keyword THEN 1 ELSE 0 END) AS ok_keyword
        ORDER BY source, target
        """, sources=list(SOURCES))]
    total = sum(r["total"] for r in rows)
    ok = sum(r["ok"] for r in rows)

    failures = [dict(r) for r in session.run(
        """
        MATCH (r) WHERE r:Research OR r:Document OR r:Course
        UNWIND $sources AS target
        WITH r, target WHERE r.source <> target
          AND NOT EXISTS { MATCH (r)-[:about|teaches]->(:Topic)<-[:about|teaches]-(x) WHERE x.source = target }
          AND NOT EXISTS { MATCH (r)-[:hasKeyword]->(:Keyword)<-[:hasKeyword]-(x) WHERE x.source = target }
        RETURN r.source AS source, target, r.topic_ids AS topic_ids, count(*) AS n
        ORDER BY n DESC
        """, sources=list(SOURCES))]

    author_bridges = session.run(
        "MATCH (a:Author)-[:authored]->(:Research) WHERE EXISTS { (a)-[:authored]->(:Document) } "
        "RETURN count(DISTINCT a) AS n").single()["n"]
    return {
        "rows": rows,
        "total": total,
        "ok": ok,
        "rate": ok / total if total else 0.0,
        "failures": failures,
        "author_bridges": author_bridges,
    }


def check_broken_links(session, check_urls: bool) -> dict:
    model = build_model()
    model_edges = len(model.edges)
    dangling_model_edges = [
        f"{e.type}: {e.start} -> {e.end}" for e in model.edges
        if e.start not in model.nodes or e.end not in model.nodes
    ]
    graph_edges = session.run(
        "MATCH (a)-[r]->(b) WHERE any(l IN labels(a) WHERE l IN $labels) "
        "AND any(l IN labels(b) WHERE l IN $labels) RETURN count(r) AS n", labels=list(DATA_LABELS)).single()["n"]
    missing_url = [dict(r) for r in session.run(
        "MATCH (n) WHERE (n:Research OR n:Document OR n:Course) "
        "AND (n.url IS NULL OR NOT n.url STARTS WITH 'http') RETURN n.uid AS uid, n.name AS name")]

    result = {
        "unresolved_references": model.unresolved,
        "dangling_model_edges": dangling_model_edges,
        "model_edges": model_edges,
        "graph_edges": graph_edges,
        "missing_url": missing_url,
        "http": None,
    }
    if check_urls:
        urls = sorted({r["url"] for r in session.run(
            "MATCH (n) WHERE n:Research OR n:Document OR n:Course RETURN DISTINCT n.url AS url") if r["url"]})
        result["http"] = check_http(urls)
    broken_http = result["http"]["broken"] if result["http"] else []
    result["pass"] = not (model.unresolved or dangling_model_edges or missing_url or broken_http) \
        and model_edges == graph_edges
    return result


def fetch_status(url: str) -> tuple[str, int | str]:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (phumpanya-link-check)"})
    for attempt in range(2):
        try:
            with urllib.request.urlopen(request, timeout=25) as response:
                # KUKR is an SPA: only the server-rendered og:title proves the record exists.
                if "kukr.lib.ku.ac.th" in url:
                    body = response.read().decode("utf-8", "replace")
                    if not re.search(r'og:title"\s*content="[^"]+"', body):
                        return url, "no-record"
                return url, response.status
        except urllib.error.HTTPError as exc:
            return url, exc.code
        except Exception as exc:  # timeouts / DNS: retry once, then report.
            if attempt == 1:
                return url, type(exc).__name__
    return url, "unknown"


def check_http(urls: list[str]) -> dict:
    with ThreadPoolExecutor(max_workers=12) as pool:
        statuses = dict(pool.map(fetch_status, urls))
    broken = [{"url": u, "status": s} for u, s in statuses.items() if not (isinstance(s, int) and s < 400)]
    by_status = defaultdict(int)
    for status in statuses.values():
        by_status[str(status)] += 1
    return {"checked": len(urls), "by_status": dict(by_status), "broken": broken}


def render_markdown(report: dict) -> str:
    def mark(ok: bool) -> str:
        return "PASS" if ok else "FAIL"

    nodes, preds, hub, trav, links = (report[k] for k in ("nodes", "predicates", "carbon_hub", "traversal", "links"))
    lines = [
        "# Knowledge Graph Validation (Checklist 1.2.1-1.2.4)",
        "",
        f"Generated: {report['generated_at']}",
        "",
        "| Item | Result |",
        "|---|---|",
        f"| 1.2.1 Node counts | {mark(nodes['pass'])} |",
        f"| 1.2.2 Predicate coverage | {mark(preds['pass'])} |",
        f"| 1.2.3 Carbon Footprint hub | {mark(hub['pass'])} |",
        f"| 1.2.4 Cross-source traversal | {mark(trav['pass'])} ({trav['rate']:.1%}, threshold 80%) |",
        f"| 1.2.4 Broken links | {mark(links['pass'])} |",
        "",
        "## 1.2.1 Node counts",
        "",
        "| Label | Rule | Actual | Result |",
        "|---|---|---|---|",
    ]
    lines += [f"| {r['label']} | {r['rule']} | {r['actual']} | {mark(r['pass'])} |" for r in nodes["rows"]]
    lines += [
        "",
        f"Core nodes (Topic + Faculty + BCGPillar + Course): {nodes['core_total']} (required 19).",
        f"Nodes with wrong source tag: {nodes['wrong_source']}.",
        f"Other labels: Concept {nodes['counts'].get('Concept', 0)}, Department {nodes['counts'].get('Department', 0)}.",
        "",
        "## 1.2.2 Predicate coverage",
        "",
        f"Predicate types: {len(preds['predicate_types'])} (required >= 6): {', '.join(preds['predicate_types'])}.",
        f"Seed-defined (topic, predicate) pairs with >= 1 triple: {preds['seed_pairs_covered']}/{preds['seed_pairs_total']}.",
        f"Strict matrix (every predicate x every topic): {preds['full_matrix_covered']}/{preds['full_matrix_total']} "
        "(informational; many pairs have no meaning, e.g. mitigatesCarbonVia in Chitosan).",
        f"Missing required predicates: {preds['missing_required'] or 'none'}.",
        "",
        "| Topic | Predicate | Triples |",
        "|---|---|---|",
    ]
    lines += [f"| {r['topic_id']} | {r['predicate']} | {r['triples']} |" for r in preds["pair_rows"]]
    lines += [
        "",
        "## 1.2.3 Carbon Footprint connector hub",
        "",
        f"Faculties linked via mitigatesCarbonVia: {', '.join(hub['faculties_via_mitigatesCarbonVia'])} "
        f"({mark(hub['all_four_faculties'])}).",
        "",
        f"Concept layer ({', '.join(CONCEPT_LABELS)}): Carbon Footprint degree "
        f"{hub['concept_layer']['carbon_degree']}, rank {hub['concept_layer']['carbon_rank']} "
        f"({mark(hub['concept_layer']['is_highest'])}).",
        "",
        "| Rank | Node | Label | Degree |",
        "|---|---|---|---|",
    ]
    lines += [f"| {i} | {r['name']} | {r['label']} | {r['degree']} |"
              for i, r in enumerate(hub["concept_layer"]["top"], 1)]
    lines += [
        "",
        f"Whole graph (includes {', '.join(sorted(set(DATA_LABELS) - set(CONCEPT_LABELS)))}): Carbon Footprint degree "
        f"{hub['whole_graph']['carbon_degree']}, rank {hub['whole_graph']['carbon_rank']} "
        f"({mark(hub['whole_graph']['is_highest'])}).",
        "",
        "| Rank | Node | Label | Degree |",
        "|---|---|---|---|",
    ]
    lines += [f"| {i} | {r['name']} | {r['label']} | {r['degree']} |"
              for i, r in enumerate(hub["whole_graph"]["top"], 1)]
    lines += [
        "",
        "## 1.2.4 Cross-source traversal",
        "",
        "A test case is one resource node and one other source. It passes when a path "
        "resource -> shared Topic or shared Keyword -> resource of the target source exists.",
        "",
        "| From | To | Cases | Pass | Via topic | Via keyword |",
        "|---|---|---|---|---|---|",
    ]
    lines += [f"| {r['source']} | {r['target']} | {r['total']} | {r['ok']} | {r['ok_topic']} | {r['ok_keyword']} |"
              for r in trav["rows"]]
    lines += [
        "",
        f"Total: {trav['ok']}/{trav['total']} = {trav['rate']:.1%}.",
        f"Authors bridging KU Forest research and KUKR documents: {trav['author_bridges']}.",
        "",
        "Failing groups:",
        "",
    ]
    lines += [f"- {f['source']} -> {f['target']}, topic_ids {f['topic_ids']}: {f['n']}" for f in trav["failures"]] \
        or ["- none"]
    lines += [
        "",
        "## 1.2.4 Broken links",
        "",
        f"Unresolved source references: {len(links['unresolved_references'])}.",
        f"Model edges with missing endpoint: {len(links['dangling_model_edges'])}.",
        f"Edges in model vs Neo4j: {links['model_edges']} vs {links['graph_edges']}.",
        f"Resource nodes without a valid URL: {len(links['missing_url'])}.",
    ]
    if links["http"]:
        lines += [
            f"HTTP check: {links['http']['checked']} URLs, status counts {links['http']['by_status']}, "
            f"broken {len(links['http']['broken'])}.",
        ]
        lines += [f"- {b['url']} ({b['status']})" for b in links["http"]["broken"][:30]]
    else:
        lines.append("HTTP check: not run (use --check-urls).")
    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check-urls", action="store_true", help="HTTP-check every resource URL")
    args = parser.parse_args()

    with driver() as drv, drv.session() as session:
        report = {
            "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "nodes": check_node_counts(session),
            "predicates": check_predicates(session),
            "carbon_hub": check_carbon_hub(session),
            "traversal": check_traversal(session),
            "links": check_broken_links(session, args.check_urls),
        }
    report["traversal"]["pass"] = report["traversal"]["rate"] >= TRAVERSAL_THRESHOLD

    REPORT_DIR.mkdir(exist_ok=True)
    (REPORT_DIR / "graph-validation.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    markdown = render_markdown(report)
    (REPORT_DIR / "graph-validation.md").write_text(markdown, encoding="utf-8")
    print(markdown)
    raise SystemExit(0 if all(report[k]["pass"] for k in ("nodes", "predicates", "carbon_hub", "traversal", "links")) else 1)


if __name__ == "__main__":
    main()
