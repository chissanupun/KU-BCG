"""Build the BCG knowledge graph in Neo4j from KU Forest, KUKR and KU MOOC.

Usage:
    python build_graph.py            # incremental: only changed records are rewritten
    python build_graph.py --reset    # wipe the database first

Node and relationship names follow ontology/bcg-education.ttl so the graph can be
checked against the OWL model (validate_owl.py).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import defaultdict
from dataclasses import dataclass, field

from rdflib import OWL, RDF, RDFS, Graph, URIRef

from kg_common import (
    CONCEPT_LABELS,
    DATA_LABELS,
    FACULTIES,
    INSTANCE_LABELS,
    ONTOLOGY_FILE,
    driver,
    faculty_key,
    keyword_key,
    load_documents,
    load_researchers,
    load_seed,
    rel_type,
)

ACADEMIC_PREFIX = re.compile(
    r"^(ศาสตราจารย์|รองศาสตราจารย์|ผู้ช่วยศาสตราจารย์|อาจารย์|ดร\.?|Dr\.?|Prof\.?|"
    r"Assoc\.?\s*Prof\.?|Asst\.?\s*Prof\.?)\s*",
    re.IGNORECASE,
)

# Seed triples name the carbon-mitigating sector, not the faculty.
CARBON_SECTOR_FACULTY = {
    "forest": "วนศาสตร์",
    "agriculture": "เกษตร",
    "industry": "อุตสาหกรรมเกษตร",
    "fishery": "ประมง",
}

COURSE_CODE = re.compile(r"^kumooc\d+$", re.IGNORECASE)


@dataclass
class Node:
    label: str
    uid: str
    props: dict = field(default_factory=dict)


@dataclass
class Edge:
    type: str
    start: str
    end: str
    props: dict = field(default_factory=dict)


@dataclass
class GraphModel:
    nodes: dict[str, Node] = field(default_factory=dict)
    edges: list[Edge] = field(default_factory=list)
    unresolved: list[str] = field(default_factory=list)

    def node(self, label: str, uid: str, **props) -> str:
        existing = self.nodes.get(uid)
        if existing is None:
            self.nodes[uid] = Node(label, uid, props)
        else:
            for key, value in props.items():
                existing.props.setdefault(key, value)
        return uid

    def edge(self, type_: str, start: str, end: str, **props) -> None:
        self.edges.append(Edge(rel_type(type_), start, end, props))


def clean_author(raw: str) -> str | None:
    name = re.sub(r"\s+", " ", raw).strip()
    previous = None
    while previous != name:
        previous = name
        name = ACADEMIC_PREFIX.sub("", name).strip()
    if len(name) < 4 or " " not in name:
        return None
    if not re.search(r"[A-Za-z\u0E01-\u0E2E]", name):
        return None
    return name


def author_uid(name: str) -> str:
    return "author:" + name.casefold()


def slug(term: str) -> str:
    return re.sub(r"[^\w]+", "_", term.strip().casefold()).strip("_")


def digest(*parts: str) -> str:
    return hashlib.sha1("|".join(parts).encode("utf-8")).hexdigest()[:16]


def build_model() -> GraphModel:
    seed = load_seed()
    docs = load_documents()
    researchers = load_researchers()
    g = GraphModel()

    for thai, english in FACULTIES.items():
        g.node("Faculty", f"faculty:{thai}", name=thai, name_en=english)

    topic_ids = set()
    keywords: dict[str, str] = {}

    def keyword(term: str) -> str:
        key = keyword_key(term)
        keywords.setdefault(key, term.strip())
        return g.node("Keyword", f"keyword:{key}", name=keywords[key], key=key)

    for topic in seed["topics"]:
        tid = topic["id"]
        topic_ids.add(tid)
        topic_uid = g.node(
            "Topic",
            f"topic:{tid}",
            topic_id=tid,
            name=topic["name_en"],
            name_th=topic["name_th"],
            anchor_concept=topic["anchor_concept"],
        )
        for pillar in topic["bcg_pillars"]:
            g.edge("hasPillar", topic_uid, g.node("BCGPillar", f"pillar:{pillar}", name=pillar))
        for faculty in topic["faculties"]:
            key = faculty_key(faculty)
            if key is None:
                g.unresolved.append(f"topic {tid}: unknown faculty {faculty!r}")
                continue
            g.edge("involvesFaculty", topic_uid, f"faculty:{key}")
        terms = (
            topic["keywords_en"]
            + topic["keywords_th"]
            + topic.get("ku_forest_keywords", [])
            + topic.get("kukr_keywords", [])
        )
        for kw_uid in dict.fromkeys(keyword(term) for term in terms):
            g.edge("hasKeyword", topic_uid, kw_uid)

    for entry in seed.get("ku_forest_search_urls", []):
        kw_uid = keyword(entry["keyword"])
        for tid in entry["topic_ids"]:
            g.edge("hasKeyword", f"topic:{tid}", kw_uid)

    # Keep topic->keyword edges unique after merging seed lists.
    g.edges = list({(e.type, e.start, e.end): e for e in g.edges}.values())

    courses_by_url: dict[str, str] = {}
    course_codes = set()
    for course in seed["ku_mooc_courses"]:
        code = course["code"].lower()
        course_codes.add(code)
        uid = g.node(
            "Course",
            f"course:{code}",
            code=code,
            name=course["name"],
            url=course["url"],
            source="KU_MOOC",
            category=course.get("category", ""),
            topic_ids=sorted(course["topic_ids"]),
        )
        courses_by_url[course["url"]] = uid

    def resolve(term: str, topic_id: str) -> str:
        fac = faculty_key(term)
        if term.startswith("Faculty_") and fac:
            return f"faculty:{fac}"
        if COURSE_CODE.match(term):
            code = term.lower()
            if code not in course_codes:
                g.unresolved.append(f"topic {topic_id}: unknown course {term!r}")
            return f"course:{code}"
        if keyword_key(term) in keywords:
            return f"keyword:{keyword_key(term)}"
        return g.node("Concept", f"concept:{slug(term)}", name=term)

    for topic in seed["topics"]:
        tid = topic["id"]
        for triple in topic["relations"]:
            predicate = triple["predicate"]
            if predicate == "mitigatesCarbonVia":
                faculty = CARBON_SECTOR_FACULTY.get(triple["subject"].casefold())
                if faculty is None:
                    g.unresolved.append(f"topic {tid}: unknown carbon sector {triple['subject']!r}")
                    continue
                mechanism = resolve(triple["object"], tid)
                g.edge(predicate, f"faculty:{faculty}", f"topic:{tid}",
                       topic_id=tid, via=triple["object"], origin="seed")
                g.edge("mechanismOf", mechanism, f"topic:{tid}", topic_id=tid, origin="seed")
                continue
            g.edge(predicate, resolve(triple["subject"], tid), resolve(triple["object"], tid),
                   topic_id=tid, origin="seed")

    resources: dict[str, dict] = {
        uid: {"label": "Course", "topics": set(g.nodes[uid].props["topic_ids"]), "keywords": set(),
              "authors": set(), "props": {}}
        for uid in courses_by_url.values()
    }
    for doc in docs:
        source = doc.get("source")
        if source == "KU_MOOC":
            uid = courses_by_url.get(doc.get("url", ""))
            if uid is None:
                g.unresolved.append(f"KU_MOOC doc not in seed courses: {doc.get('url')}")
                continue
            record = resources[uid]
            g.nodes[uid].props["title"] = doc.get("title", "")
        elif source == "KU_Forest":
            authors = sorted(filter(None, (clean_author(a) for a in doc.get("authors") or [])))
            uid = "research:" + digest(doc.get("title", ""), str(doc.get("year", "")), *authors)
            record = resources.setdefault(uid, {"label": "Research", "topics": set(), "keywords": set(),
                                                "authors": set(), "props": {}})
            record["props"].update(
                name=doc.get("title", ""),
                url=doc.get("url", ""),
                source=source,
                output_type=doc.get("doc_type", ""),
                year=str(doc.get("year", "")),
            )
        elif source == "KUKR":
            url = doc.get("url", "")
            bibid = re.search(r"/KUKR/(?:Search/detail|Detail/info)/(\d+)$", url)
            uid = "document:" + (bibid.group(1) if bibid else digest(url, doc.get("title", "")))
            record = resources.setdefault(uid, {"label": "Document", "topics": set(), "keywords": set(),
                                                "authors": set(), "props": {}})
            record["props"].update(
                name=doc.get("title", ""),
                url=url,
                source=source,
                output_type=doc.get("doc_type", ""),
                year=str(doc.get("year", "")),
            )
        else:
            g.unresolved.append(f"unknown source {source!r}")
            continue

        for tid in doc.get("topic_ids") or []:
            if tid in topic_ids:
                record["topics"].add(tid)
            else:
                g.unresolved.append(f"{uid}: unknown topic_id {tid!r}")
        for term in [doc.get("search_keyword") or ""] + list(doc.get("keywords") or []):
            if term and keyword_key(term) in keywords:
                record["keywords"].add(keyword_key(term))
        if record["label"] != "Course":
            record["authors"].update(filter(None, (clean_author(a) for a in doc.get("authors") or [])))

    for uid, record in resources.items():
        if record["label"] != "Course":
            g.node(record["label"], uid, **record["props"])
        g.nodes[uid].props["topic_ids"] = sorted(record["topics"])
        topic_rel = "teaches" if record["label"] == "Course" else "about"
        for tid in sorted(record["topics"]):
            g.edge(topic_rel, uid, f"topic:{tid}")
        for key in sorted(record["keywords"]):
            g.edge("hasKeyword", uid, f"keyword:{key}")
        for name in sorted(record["authors"]):
            g.edge("authored", g.node("Author", author_uid(name), name=name), uid)

    for person in researchers:
        name = clean_author(person.get("name_th", ""))
        fac = faculty_key(person.get("faculty", ""))
        if name is None or fac is None:
            continue
        uid = g.node("Author", author_uid(name), name=name)
        g.nodes[uid].props.update(
            position=person.get("position", ""),
            profile_url=person.get("url", ""),
            person_id=person.get("person_id", ""),
        )
        g.edge("affiliatedWith", uid, f"faculty:{fac}")
        department = (person.get("department") or "").strip()
        if department:
            dep_uid = g.node("Department", f"department:{fac}:{department}", name=department)
            g.edge("inDepartment", uid, dep_uid)
            g.edge("partOf", dep_uid, f"faculty:{fac}")
        for term in person.get("expertise") or []:
            if keyword_key(term) in keywords:
                g.edge("hasExpertise", uid, f"keyword:{keyword_key(term)}")

    g.edges = list({(e.type, e.start, e.end, json.dumps(e.props, sort_keys=True)): e
                    for e in g.edges}.values())
    return g


def content_hash(node: Node, outgoing: list[Edge]) -> str:
    payload = {
        "label": node.label,
        "props": node.props,
        "out": sorted((e.type, e.end, json.dumps(e.props, sort_keys=True)) for e in outgoing),
    }
    return hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def import_ontology(session) -> str:
    ttl = ONTOLOGY_FILE.read_text(encoding="utf-8")
    try:
        session.run("CREATE CONSTRAINT n10s_unique_uri IF NOT EXISTS FOR (r:Resource) REQUIRE r.uri IS UNIQUE")
        if not list(session.run("CALL n10s.graphconfig.show()")):
            session.run("CALL n10s.graphconfig.init({handleVocabUris: 'IGNORE'})")
        result = session.run("CALL n10s.onto.import.inline($ttl, 'Turtle')", ttl=ttl).single()
        return f"n10s: {result['terminationStatus']} ({result['triplesLoaded']} triples)"
    except Exception as exc:  # n10s missing or graph config locked: fall back to rdflib.
        fallback_reason = str(exc).splitlines()[0]

    onto = Graph().parse(data=ttl, format="turtle")
    classes = [str(c) for c in onto.subjects(RDF.type, OWL.Class) if isinstance(c, URIRef)]
    props = [str(p) for p in onto.subjects(RDF.type, OWL.ObjectProperty) if isinstance(p, URIRef)]
    session.run("UNWIND $uris AS uri MERGE (c:OntologyClass {uri: uri}) SET c.name = split(uri, '#')[1]",
                uris=classes)
    session.run("UNWIND $uris AS uri MERGE (p:OntologyProperty {uri: uri}) SET p.name = split(uri, '#')[1]",
                uris=props)
    for sub, sup in onto.subject_objects(RDFS.subClassOf):
        session.run(
            "MATCH (a:OntologyClass {uri: $a}), (b:OntologyClass {uri: $b}) MERGE (a)-[:SCO]->(b)",
            a=str(sub), b=str(sup),
        )
    return f"rdflib fallback ({len(classes)} classes, {len(props)} properties); n10s unavailable: {fallback_reason}"


def write_graph(g: GraphModel, reset: bool) -> dict:
    stats = {"written": defaultdict(int), "unchanged": defaultdict(int), "deleted": 0}
    outgoing: dict[str, list[Edge]] = defaultdict(list)
    for edge in g.edges:
        outgoing[edge.start].append(edge)

    with driver() as drv, drv.session() as session:
        if reset:
            session.run("MATCH (n) DETACH DELETE n")
        for label in DATA_LABELS:
            session.run(f"CREATE CONSTRAINT {label.lower()}_uid IF NOT EXISTS FOR (n:{label}) REQUIRE n.uid IS UNIQUE")
        stats["ontology"] = import_ontology(session)

        # One transaction: a node's content_hash must never be stored without its edges,
        # or an interrupted run would leave the next incremental run skipping them.
        tx = session.begin_transaction()
        write_data(tx, g, outgoing, stats)
        tx.commit()
    return stats


def write_data(tx, g: GraphModel, outgoing: dict[str, list[Edge]], stats: dict) -> None:
    existing = {r["uid"]: r["hash"] for r in tx.run(
        "MATCH (n) WHERE n.uid IS NOT NULL RETURN n.uid AS uid, n.content_hash AS hash")}

    changed: dict[str, list[dict]] = defaultdict(list)
    for node in g.nodes.values():
        h = content_hash(node, outgoing[node.uid])
        if existing.get(node.uid) == h:
            stats["unchanged"][node.label] += 1
            continue
        changed[node.label].append({"uid": node.uid, "props": {**node.props, "content_hash": h}})
        stats["written"][node.label] += 1

    stale = [uid for uid in existing if uid not in g.nodes]
    if stale:
        tx.run("UNWIND $uids AS uid MATCH (n {uid: uid}) DETACH DELETE n", uids=stale)
        stats["deleted"] = len(stale)

    for label, rows in changed.items():
        tx.run(
            f"UNWIND $rows AS row MERGE (n:{label} {{uid: row.uid}}) SET n = row.props, n.uid = row.uid",
            rows=rows,
        )

    changed_uids = {row["uid"] for rows in changed.values() for row in rows}
    tx.run("UNWIND $uids AS uid MATCH (n {uid: uid})-[r]->() DELETE r", uids=list(changed_uids))

    by_type: dict[str, list[dict]] = defaultdict(list)
    for edge in g.edges:
        if edge.start in changed_uids:
            by_type[edge.type].append({"start": edge.start, "end": edge.end, "props": edge.props})
    for type_, rows in by_type.items():
        tx.run(
            f"UNWIND $rows AS row MATCH (a {{uid: row.start}}), (b {{uid: row.end}}) "
            f"CREATE (a)-[r:{rel_type(type_)}]->(b) SET r = row.props",
            rows=rows,
        )
    stats["edges_written"] = sum(len(rows) for rows in by_type.values())


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reset", action="store_true", help="delete all nodes before import")
    args = parser.parse_args()

    g = build_model()
    counts = defaultdict(int)
    for node in g.nodes.values():
        counts[node.label] += 1

    stats = write_graph(g, args.reset)
    print("model nodes:", dict(counts), "edges:", len(g.edges))
    print("ontology:", stats["ontology"])
    print("written:", dict(stats["written"]), "unchanged:", dict(stats["unchanged"]),
          "deleted:", stats["deleted"], "edges written:", stats["edges_written"])
    if g.unresolved:
        print(f"unresolved references ({len(g.unresolved)}):")
        for item in g.unresolved:
            print("  -", item)
    concept_or_instance = set(CONCEPT_LABELS) | set(INSTANCE_LABELS)
    assert set(counts) <= concept_or_instance, f"unexpected labels: {set(counts) - concept_or_instance}"


if __name__ == "__main__":
    main()
