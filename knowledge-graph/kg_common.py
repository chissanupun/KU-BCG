"""Shared paths, Neo4j connection and graph vocabulary for the BCG knowledge graph."""

from __future__ import annotations

import json
import os
import re
from pathlib import Path

from neo4j import Driver, GraphDatabase

ROOT = Path(__file__).resolve().parent
ES_DIR = ROOT.parent / "elastic-search"
DATA_DIR = ES_DIR / "data"
SEED_FILE = ES_DIR / "seed-data.json"
ONTOLOGY_FILE = ROOT / "ontology" / "bcg-education.ttl"
REPORT_DIR = ROOT / "reports"

ONTOLOGY_NS = "https://phumpanya.ku.ac.th/ontology/bcg-education#"

# The four pilot faculties, keyed by Thai name without the "คณะ" prefix.
FACULTIES = {
    "วนศาสตร์": "Forestry",
    "เกษตร": "Agriculture",
    "อุตสาหกรรมเกษตร": "Agro-Industry",
    "ประมง": "Fisheries",
}

SOURCES = ("KU_Forest", "KUKR", "KU_MOOC")

CONCEPT_LABELS = ("Topic", "Faculty", "BCGPillar", "Course", "Keyword", "Concept")
INSTANCE_LABELS = ("Research", "Document", "Author", "Department")
DATA_LABELS = CONCEPT_LABELS + INSTANCE_LABELS

RELATIONSHIP_TYPE = re.compile(r"^[A-Za-z][A-Za-z0-9]*$")


def driver() -> Driver:
    return GraphDatabase.driver(
        os.environ.get("NEO4J_URI", "bolt://localhost:7687"),
        auth=(
            os.environ.get("NEO4J_USER", "neo4j"),
            os.environ.get("NEO4J_PASSWORD", "phumpanya-dev"),
        ),
    )


def load_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def load_seed() -> dict:
    return load_json(SEED_FILE)


def load_documents() -> list[dict]:
    return [hit["_source"] for hit in load_json(DATA_DIR / "all_docs.json")["hits"]["hits"]]


def load_researchers() -> list[dict]:
    path = DATA_DIR / "ku-forest-faculty-researchers.json"
    return load_json(path) if path.exists() else []


def keyword_key(term: str) -> str:
    return re.sub(r"[\s_]+", " ", term.strip()).casefold()


def faculty_key(name: str) -> str | None:
    cleaned = name.strip().removeprefix("Faculty_").removeprefix("คณะ").strip()
    return cleaned if cleaned in FACULTIES else None


def rel_type(name: str) -> str:
    if not RELATIONSHIP_TYPE.match(name):
        raise ValueError(f"Unsafe relationship type: {name!r}")
    return name
