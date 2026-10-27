"""
Gate 1.2.1-1.2.2: import KG Seed Data + indexed docs into Neo4j.
Reads seed-data.json (topics/faculties/pillars/courses) + data/all_docs.json
(612 KUKR+KU_Forest+KU_MOOC docs, ES dump format) + data/all_relations.json
(19 hand-curated triples), emits a single .cypher script.

Research/Document nodes are keyed by the ES _id, so shared or search URLs
no longer merge edges between docs.

Node labels: Topic, Faculty, BcgPillar, Course, Keyword, Research (KU_Forest),
Document (KUKR), Author.

ponytail: relation triples only cover the 19 seed pairs (isKeywordOf/
isEntryPointFor) — 1.2.2's isFeedstockOf/mitigatesCarbonVia/etc predicates
need new domain triples authored by hand, not generated from existing data.
Run this first, add domain relations in a second pass.
"""
import json
from pathlib import Path

BASE = Path(__file__).parent
seed = json.loads((BASE / "seed-data.json").read_text())
docs = json.loads((BASE / "data/all_docs.json").read_text())["hits"]["hits"]
rels = json.loads((BASE / "data/all_relations.json").read_text())["hits"]["hits"]

PILOT_FACULTIES = ["เกษตร", "ประมง", "วนศาสตร์", "อุตสาหกรรมเกษตร"]


def esc(s: str) -> str:
    return str(s).replace("\\", "\\\\").replace("'", "\\'")


lines = [
    "MATCH (n) DETACH DELETE n;",
    "CREATE CONSTRAINT research_id IF NOT EXISTS FOR (n:Research) REQUIRE n.id IS UNIQUE;",
    "CREATE CONSTRAINT document_id IF NOT EXISTS FOR (n:Document) REQUIRE n.id IS UNIQUE;",
]

# --- core nodes ---
for t in seed["topics"]:
    lines.append(
        f"CREATE (:Topic {{id: '{esc(t['id'])}', name_th: '{esc(t['name_th'])}', "
        f"name_en: '{esc(t['name_en'])}'}});"
    )

for f in PILOT_FACULTIES:
    lines.append(f"CREATE (:Faculty {{name: '{esc(f)}'}});")

for p in ["Bio", "Circular", "Green"]:
    lines.append(f"CREATE (:BcgPillar {{name: '{esc(p)}'}});")

for c in seed["ku_mooc_courses"]:
    lines.append(
        f"CREATE (:Course {{code: '{esc(c['code'])}', name: '{esc(c['name'])}', "
        f"url: '{esc(c['url'])}'}});"
    )

# topic <-> pillar / faculty / course edges
for t in seed["topics"]:
    for p in t.get("bcg_pillars", []):
        lines.append(
            f"MATCH (t:Topic {{id:'{esc(t['id'])}'}}), (p:BcgPillar {{name:'{esc(p)}'}}) "
            "MERGE (t)-[:HAS_BCG_PILLAR]->(p);"
        )
    for f in t.get("faculties", []):
        if f in PILOT_FACULTIES:
            lines.append(
                f"MATCH (t:Topic {{id:'{esc(t['id'])}'}}), (f:Faculty {{name:'{esc(f)}'}}) "
                "MERGE (t)-[:RELATES_TO_FACULTY]->(f);"
            )
for c in seed["ku_mooc_courses"]:
    for tid in c.get("topic_ids", []):
        lines.append(
            f"MATCH (c:Course {{code:'{esc(c['code'])}'}}), (t:Topic {{id:'{esc(tid)}'}}) "
            "MERGE (c)-[:OFFERED_FOR_TOPIC]->(t);"
        )

# --- keywords (dedup across topics) ---
keywords = set()
for t in seed["topics"]:
    keywords.update(t.get("keywords_en", []))
    keywords.update(t.get("keywords_th", []))
for kw in keywords:
    lines.append(f"CREATE (:Keyword {{name: '{esc(kw)}'}});")
for t in seed["topics"]:
    for kw in t.get("keywords_en", []) + t.get("keywords_th", []):
        lines.append(
            f"MATCH (t:Topic {{id:'{esc(t['id'])}'}}), (k:Keyword {{name:'{esc(kw)}'}}) "
            "MERGE (t)-[:HAS_KEYWORD]->(k);"
        )

# --- research (KU_Forest) / document (KUKR) nodes ---
authors = set()
SOURCE_LABEL = {"KU_Forest": "Research", "KUKR": "Document"}
for hit in docs:
    src = hit["_source"]
    label = SOURCE_LABEL.get(src.get("source"))
    if not label:
        continue  # KU_MOOC docs already covered by Course nodes
    doc_id = hit["_id"]
    title = src.get("title", "")
    url = src.get("url", "")
    year = src.get("year", "")
    lines.append(
        f"CREATE (:{label} {{id: '{esc(doc_id)}', title: '{esc(title)}', url: '{esc(url)}', year: '{esc(year)}'}});"
    )
    for tid in src.get("topic_ids", []):
        lines.append(
            f"MATCH (d:{label} {{id:'{esc(doc_id)}'}}), (t:Topic {{id:'{esc(tid)}'}}) "
            "MERGE (d)-[:BELONGS_TO_TOPIC]->(t);"
        )
    for p in src.get("bcg_pillars", []):
        lines.append(
            f"MATCH (d:{label} {{id:'{esc(doc_id)}'}}), (p:BcgPillar {{name:'{esc(p)}'}}) "
            "MERGE (d)-[:TAGGED_BCG]->(p);"
        )
    for kw in src.get("keywords", []):
        lines.append(
            f"MERGE (k:Keyword {{name: '{esc(kw)}'}});"
        )
        lines.append(
            f"MATCH (d:{label} {{id:'{esc(doc_id)}'}}), (k:Keyword {{name:'{esc(kw)}'}}) "
            "MERGE (d)-[:HAS_KEYWORD]->(k);"
        )
    for a in src.get("authors", []):
        authors.add(a)
        lines.append(
            f"MATCH (d:{label} {{id:'{esc(doc_id)}'}}) MERGE (a:Author {{name:'{esc(a)}'}}) "
            "MERGE (d)-[:WRITTEN_BY]->(a);"
        )

# --- 19 seed relation triples (isKeywordOf / isEntryPointFor) ---
for hit in rels:
    r = hit["_source"]
    subj, pred, obj = r["subject"], r["predicate"], r["object"]
    lines.append(f"MERGE (s:Entity {{name: '{esc(subj)}'}});")
    lines.append(f"MERGE (o:Entity {{name: '{esc(obj)}'}});")
    lines.append(
        f"MATCH (s:Entity {{name:'{esc(subj)}'}}), (o:Entity {{name:'{esc(obj)}'}}) "
        f"MERGE (s)-[:{pred}]->(o);"
    )

out = BASE / "neo4j_import.cypher"
out.write_text("\n".join(lines) + "\n")
print(f"wrote {len(lines)} statements -> {out}")
print(f"unique keywords: {len(keywords)}, unique authors: {len(authors)}")
research_n = sum(1 for h in docs if h["_source"].get("source") == "KU_Forest")
doc_n = sum(1 for h in docs if h["_source"].get("source") == "KUKR")
print(f"research nodes: {research_n}, document nodes: {doc_n}")
