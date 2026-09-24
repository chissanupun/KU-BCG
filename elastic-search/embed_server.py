#!/usr/bin/env python3
"""
Minimal embedding server — used by Laravel QdrantRetriever to embed queries.

POST /embed  { "text": "ชีวมวลคืออะไร" }
             → { "vector": [...384 floats...], "dim": 384 }

GET  /health → { "status": "ok", "model": "..." }

Usage:
    pip install -r requirements-qdrant.txt
    python embed_server.py           # default port 8765
    PORT=9000 python embed_server.py
"""

from __future__ import annotations

import os

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"
PORT = int(os.getenv("PORT", "8765"))

print(f"Loading model: {MODEL_NAME} ...")
_model = SentenceTransformer(MODEL_NAME)
print("Model ready.")

app = FastAPI(title="KU Phumpanya Embed Server", version="1.0.0")


class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    vector: list[float]
    dim: int


@app.post("/embed", response_model=EmbedResponse)
def embed(req: EmbedRequest) -> EmbedResponse:
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="text must not be empty")
    vec: list[float] = _model.encode(text, normalize_embeddings=True).tolist()
    return EmbedResponse(vector=vec, dim=len(vec))


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model": MODEL_NAME, "dim": 384}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)
