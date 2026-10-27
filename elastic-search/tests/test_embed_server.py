import importlib
import sys
import types

import pytest
from fastapi.testclient import TestClient


class Vec(list):
    def tolist(self):
        return list(self)


class FakeModel:
    instances = []

    def __init__(self, name):
        self.name = name
        self.calls = []
        FakeModel.instances.append(self)

    def encode(self, text, normalize_embeddings):
        self.calls.append((text, normalize_embeddings))
        return Vec([0.1] * 384)


stub = types.ModuleType("sentence_transformers")
stub.SentenceTransformer = FakeModel
sys.modules["sentence_transformers"] = stub

import embed_server  # noqa: E402

client = TestClient(embed_server.app)


def test_model_built_once_with_model_name():
    assert [m.name for m in FakeModel.instances] == [embed_server.MODEL_NAME]


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "model": "paraphrase-multilingual-MiniLM-L12-v2", "dim": 384}


def test_embed_strips_text_and_normalizes():
    r = client.post("/embed", json={"text": "  ชีวมวล  "})
    assert r.status_code == 200
    body = r.json()
    assert body["dim"] == 384 and len(body["vector"]) == 384
    assert embed_server._model.calls[-1] == ("ชีวมวล", True)


def test_embed_blank_text_422():
    r = client.post("/embed", json={"text": "   "})
    assert r.status_code == 422
    assert r.json()["detail"] == "text must not be empty"


@pytest.mark.parametrize("payload", [{}, {"text": 123}])
def test_embed_invalid_payload_422(payload):
    assert client.post("/embed", json=payload).status_code == 422


def test_port_default_and_env(monkeypatch):
    assert embed_server.PORT == 8765
    monkeypatch.setenv("PORT", "9000")
    importlib.reload(embed_server)
    assert embed_server.PORT == 9000
