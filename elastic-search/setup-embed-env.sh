#!/usr/bin/env bash
# Isolated Python env for embed_to_qdrant.py + embed_server.py
# Avoid conda base + Python 3.13 torch mismatch.
set -euo pipefail

cd "$(dirname "$0")"

PY="${PYTHON_BIN:-}"
if [[ -z "$PY" ]]; then
  for candidate in python3.12 python3.11 python3; do
    if command -v "$candidate" >/dev/null 2>&1; then
      ver="$("$candidate" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')"
      major="${ver%%.*}"
      minor="${ver#*.}"
      if [[ "$major" -eq 3 && "$minor" -le 12 ]]; then
        PY="$candidate"
        break
      fi
    fi
  done
fi

if [[ -z "$PY" ]]; then
  echo "Need Python 3.11 or 3.12 (torch unstable on 3.13+ with conda)."
  echo "Install: brew install python@3.12"
  exit 1
fi

echo "Using: $PY ($("$PY" --version))"

"$PY" -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r requirements-qdrant.txt

echo ""
echo "Done. Activate:"
echo "  source .venv/bin/activate"
echo "Or run directly:"
echo "  .venv/bin/python embed_to_qdrant.py"
echo "  .venv/bin/python embed_server.py"
