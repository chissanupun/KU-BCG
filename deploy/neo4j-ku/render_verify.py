"""Run each query in neo4j_verify.cypher and print the results as Markdown.

The `//` comment lines above a query become its heading, so the report follows the
gate checks exactly as written in the verify file.

Usage: python render_verify.py path/to/neo4j_verify.cypher > neo4j-verify.md
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from neo4j import GraphDatabase


def blocks(text: str) -> list[tuple[list[str], str]]:
    """Split the file into (comment lines, query) pairs."""
    result, comments, query = [], [], []
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("//"):
            comments.append(stripped.lstrip("/ "))
        elif stripped:
            query.append(line)
            if stripped.endswith(";"):
                result.append((comments, "\n".join(query).rstrip(";")))
                comments, query = [], []
    if query:
        result.append((comments, "\n".join(query)))
    return result


def cell(value) -> str:
    if isinstance(value, list):
        value = ", ".join(map(str, value))
    return str(value).replace("|", "\\|")


def main() -> None:
    path = Path(sys.argv[1])
    driver = GraphDatabase.driver(
        os.environ["NEO4J_URI"], auth=(os.environ["NEO4J_USER"], os.environ["NEO4J_PASSWORD"])
    )
    out = [
        "# Neo4j gate verification",
        "",
        f"Generated: {datetime.now(timezone.utc).isoformat(timespec='seconds')}",
        f"Queries: `elastic-search/{path.name}`",
    ]
    heading = "Query"
    with driver, driver.session() as session:
        for comments, query in blocks(path.read_text(encoding="utf-8")):
            if comments:
                heading = next((c for c in comments if c.startswith("1.2")), comments[0])
                out += ["", f"## {heading}", ""]
                out += [c for c in comments if c != heading]
            out += ["", "```cypher", query, "```", ""]
            result = session.run(query)
            keys = result.keys()
            rows = [record.values() for record in result]
            if not rows:
                out.append("_No rows._")
                continue
            out.append("| " + " | ".join(keys) + " |")
            out.append("|" + "---|" * len(keys))
            out += ["| " + " | ".join(cell(v) for v in row) + " |" for row in rows]
    print("\n".join(out))


if __name__ == "__main__":
    main()
