#!/usr/bin/env python3
"""
Embed KU BCG documents + relations → Qdrant vector database.

Model : paraphrase-multilingual-MiniLM-L12-v2 (384-dim, Thai + EN)
Source: data/all_docs.json      (612 docs from KUKR / KU Forest / KU MOOC)
        data/all_relations.json (19 semantic triples)

Usage:
    # local Qdrant (Docker)
    python embed_to_qdrant.py

    # Qdrant Cloud
    QDRANT_HOST=https://xxx.qdrant.io QDRANT_API_KEY=<key> python embed_to_qdrant.py
"""

from __future__ import annotations

import json
import os
import uuid
from pathlib import Path

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams
from sentence_transformers import SentenceTransformer

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
QDRANT_HOST = os.getenv("QDRANT_HOST", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")
COLLECTION_DOCS = os.getenv("QDRANT_COLLECTION_DOCS", "ku_phumpanya_docs")
COLLECTION_RELATIONS = os.getenv("QDRANT_COLLECTION_RELATIONS", "ku_phumpanya_relations")

MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"
VECTOR_DIM = 384
BATCH_SIZE = 64
MAX_TEXT_CHARS = 512

DATA_DIR = Path(__file__).parent / "data"


# ---------------------------------------------------------------------------
# Text builders
# ---------------------------------------------------------------------------
def build_doc_text(doc: dict) -> str:
    parts = [
        doc.get("title", ""),
        doc.get("abstract", ""),
        " ".join(doc.get("topic_names_th", [])),
        " ".join(doc.get("topic_names_en", [])),
        " ".join(doc.get("keywords", [])[:15]),
        " ".join(doc.get("bcg_pillars", [])),
    ]
    return " ".join(p for p in parts if p).strip()[:MAX_TEXT_CHARS]


def build_relation_text(rel: dict) -> str:
    return (
        f"{rel.get('subject', '')} {rel.get('predicate', '')} {rel.get('object', '')}"
    ).strip()


# ---------------------------------------------------------------------------
# Loaders
# ---------------------------------------------------------------------------
def load_docs() -> list[tuple[str, dict, str]]:
    path = DATA_DIR / "all_docs.json"
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    out = []
    for hit in data["hits"]["hits"]:
        es_id: str = hit["_id"]
        src: dict = hit["_source"]
        out.append((es_id, src, build_doc_text(src)))
    return out


def load_relations() -> list[tuple[str, dict, str]]:
    path = DATA_DIR / "all_relations.json"
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    out = []
    for hit in data["hits"]["hits"]:
        es_id: str = hit["_id"]
        src: dict = hit["_source"]
        out.append((es_id, src, build_relation_text(src)))
    return out


# ---------------------------------------------------------------------------
# Qdrant helpers
# ---------------------------------------------------------------------------
def ensure_collection(client: QdrantClient, name: str, dim: int) -> None:
    existing = {c.name for c in client.get_collections().collections}
    if name not in existing:
        client.create_collection(
            collection_name=name,
            # Named vector matching the collection name (as created in Qdrant UI)
            vectors_config={name: VectorParams(size=dim, distance=Distance.COSINE)},
        )
        print(f"  Created collection: {name}")
    else:
        print(f"  Collection exists:  {name}")


def upload_batches(
    client: QdrantClient,
    collection: str,
    points: list[PointStruct],
) -> None:
    for i in range(0, len(points), BATCH_SIZE):
        batch = points[i : i + BATCH_SIZE]
        client.upsert(collection_name=collection, points=batch)
        done = min(i + BATCH_SIZE, len(points))
        print(f"    {done}/{len(points)} uploaded")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    print(f"Loading model: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)

    client_kwargs: dict = {"url": QDRANT_HOST}
    if QDRANT_API_KEY:
        client_kwargs["api_key"] = QDRANT_API_KEY
    client = QdrantClient(**client_kwargs)
    print(f"Connected to Qdrant: {QDRANT_HOST}\n")

    # -----------------------------------------------------------------------
    # Documents
    # -----------------------------------------------------------------------
    docs = load_docs()
    print(f"Embedding {len(docs)} documents...")
    texts = [t for _, _, t in docs]
    vectors = model.encode(
        texts,
        batch_size=BATCH_SIZE,
        show_progress_bar=True,
        normalize_embeddings=True,
    )

    ensure_collection(client, COLLECTION_DOCS, VECTOR_DIM)
    doc_points = [
        PointStruct(
            id=str(uuid.uuid5(uuid.NAMESPACE_DNS, es_id)),
            vector={COLLECTION_DOCS: vec.tolist()},
            payload=src,
        )
        for (es_id, src, _), vec in zip(docs, vectors)
    ]
    print(f"Uploading {len(doc_points)} doc vectors to '{COLLECTION_DOCS}'...")
    upload_batches(client, COLLECTION_DOCS, doc_points)

    # -----------------------------------------------------------------------
    # Relations
    # -----------------------------------------------------------------------
    relations = load_relations()
    print(f"\nEmbedding {len(relations)} relations...")
    rel_texts = [t for _, _, t in relations]
    rel_vectors = model.encode(
        rel_texts,
        batch_size=BATCH_SIZE,
        show_progress_bar=True,
        normalize_embeddings=True,
    )

    ensure_collection(client, COLLECTION_RELATIONS, VECTOR_DIM)
    rel_points = [
        PointStruct(
            id=str(uuid.uuid5(uuid.NAMESPACE_DNS, es_id)),
            vector={COLLECTION_RELATIONS: vec.tolist()},
            payload=src,
        )
        for (es_id, src, _), vec in zip(relations, rel_vectors)
    ]
    print(f"Uploading {len(rel_points)} relation vectors to '{COLLECTION_RELATIONS}'...")
    upload_batches(client, COLLECTION_RELATIONS, rel_points)

    # -----------------------------------------------------------------------
    # Summary
    # -----------------------------------------------------------------------
    print("\n✓ Done")
    print(f"  {COLLECTION_DOCS}      : {len(doc_points)} vectors (dim={VECTOR_DIM})")
    print(f"  {COLLECTION_RELATIONS}: {len(rel_points)} vectors (dim={VECTOR_DIM})")


if __name__ == "__main__":
    main()
