import json
import math
import os
import urllib.request

import pytest

URL = os.getenv("EMBED_URL")
pytestmark = pytest.mark.skipif(not URL, reason="set EMBED_URL to run against a live embed server")


def _call(path, body=None):
    req = urllib.request.Request(
        URL + path,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def test_health():
    assert _call("/health")["status"] == "ok"


def test_embed_thai_is_384d_unit_norm():
    body = _call("/embed", {"text": "ชีวมวลคืออะไร"})
    assert body["dim"] == 384 and len(body["vector"]) == 384
    assert abs(math.sqrt(sum(x * x for x in body["vector"])) - 1) < 1e-3
