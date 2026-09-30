"""Checklist 1.2.5: Index of Item-Objective Congruence (IOC) for the BCG ontology.

Each expert rates every ontology item against the objective "this element correctly
models BCG cross-disciplinary knowledge for the KU pilot faculties":
    +1  congruent      0  unsure      -1  not congruent
IOC per item = sum of ratings / number of experts (Rovinelli & Hambleton, 1977).
An item passes at IOC >= 0.60; the ontology passes when every item does.

Usage:
    python compute_ioc.py --template          # write ioc/ioc-form.csv for the experts
    python compute_ioc.py                     # score ioc/ioc-form.csv once filled in
    python compute_ioc.py --scores other.csv  # score a different file
"""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path

from rdflib import OWL, RDF, RDFS, Graph, URIRef
from rdflib.collection import Collection

from kg_common import ONTOLOGY_FILE, REPORT_DIR, ROOT, load_seed

FORM_FILE = ROOT / "ioc" / "ioc-form.csv"
THRESHOLD = 0.60
MIN_EXPERTS = 3
VALID_RATINGS = {"-1": -1, "0": 0, "+1": 1, "1": 1}
UNION_HELPERS = {"TopicOrResource", "ResearchOrDocument", "KeywordOrConcept"}
FIELDS = ["item_id", "section", "element", "statement_th", "statement_en",
          "expert_1", "expert_2", "expert_3", "comment"]


def local(term) -> str:
    return str(term).rsplit("#", 1)[-1]


def label(g: Graph, term, lang: str) -> str:
    for value in g.objects(term, RDFS.label):
        if getattr(value, "language", None) == lang:
            return str(value)
    return local(term)


def class_phrase(g: Graph, cls, lang: str) -> str:
    for equivalent in g.objects(cls, OWL.equivalentClass):
        for head in g.objects(equivalent, OWL.unionOf):
            joiner = " หรือ " if lang == "th" else " or "
            return joiner.join(label(g, c, lang) for c in Collection(g, head))
    return label(g, cls, lang)


def build_items() -> list[dict]:
    g = Graph()
    g.parse(ONTOLOGY_FILE, format="turtle")
    items: list[dict] = []

    classes = sorted((c for c in g.subjects(RDF.type, OWL.Class)
                      if isinstance(c, URIRef) and local(c) not in UNION_HELPERS), key=local)
    for cls in classes:
        parent = g.value(cls, RDFS.subClassOf)
        comment = g.value(cls, RDFS.comment)
        th = f"คลาส \"{label(g, cls, 'th')}\""
        en = f"Class \"{label(g, cls, 'en')}\""
        if parent is not None:
            th += f" เป็นคลาสย่อยของ \"{label(g, parent, 'th')}\""
            en += f" is a subclass of \"{label(g, parent, 'en')}\""
        if comment is not None:
            en += f" — {comment}"
        items.append({"section": "A. Class", "element": local(cls), "statement_th": th, "statement_en": en})

    props = sorted(g.subjects(RDF.type, OWL.ObjectProperty), key=local)
    for prop in props:
        domain, range_ = g.value(prop, RDFS.domain), g.value(prop, RDFS.range)
        items.append({
            "section": "B. Object property",
            "element": local(prop),
            "statement_th": f"{class_phrase(g, domain, 'th')} —[{local(prop)}]→ {class_phrase(g, range_, 'th')}",
            "statement_en": f"{class_phrase(g, domain, 'en')} —[{label(g, prop, 'en')}]→ {class_phrase(g, range_, 'en')}",
        })

    for index, axiom in enumerate(g.subjects(RDF.type, OWL.AllDisjointClasses), start=1):
        members = list(Collection(g, g.value(axiom, OWL.members)))
        items.append({
            "section": "C. Disjointness",
            "element": f"AllDisjointClasses_{index}",
            "statement_th": "ไม่มีสิ่งใดเป็นสมาชิกของคลาสเหล่านี้พร้อมกันเกิน 1 คลาส: "
                            + ", ".join(label(g, m, "th") for m in members),
            "statement_en": "No individual belongs to more than one of: "
                            + ", ".join(label(g, m, "en") for m in members),
        })

    for topic in load_seed()["topics"]:
        for relation in topic["relations"]:
            triple = f"({relation['subject']}) —[{relation['predicate']}]→ ({relation['object']})"
            items.append({
                "section": "D. Seed triple",
                "element": relation["predicate"],
                "statement_th": f"หัวข้อ {topic['id']} {topic['name_th']}: {triple}",
                "statement_en": f"Topic {topic['id']} {topic['name_en']}: {triple}",
            })

    for number, item in enumerate(items, start=1):
        item["item_id"] = f"I{number:02d}"
    return items


def write_template(path: Path, force: bool) -> None:
    if path.exists() and not force:
        raise SystemExit(f"{path} already exists (it may hold expert ratings); pass --force to overwrite.")
    path.parent.mkdir(parents=True, exist_ok=True)
    items = build_items()
    # utf-8-sig so Excel opens the Thai text correctly.
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        for item in items:
            writer.writerow({field: item.get(field, "") for field in FIELDS})
    print(f"Wrote {len(items)} items to {path}")


def read_scores(path: Path) -> tuple[list[str], list[dict], list[str]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    experts = [c for c in (rows[0].keys() if rows else []) if c.startswith("expert_")]
    problems = []
    if len(experts) < MIN_EXPERTS:
        problems.append(f"need at least {MIN_EXPERTS} expert_* columns, found {len(experts)}")
    for row in rows:
        for expert in experts:
            raw = (row.get(expert) or "").strip()
            if raw not in VALID_RATINGS:
                problems.append(f"{row['item_id']} {expert}: {raw or '<blank>'} (expected -1, 0 or +1)")
    return experts, rows, problems


def score(experts: list[str], rows: list[dict]) -> dict:
    items = []
    for row in rows:
        ratings = [VALID_RATINGS[row[e].strip()] for e in experts]
        ioc = sum(ratings) / len(ratings)
        items.append({"item_id": row["item_id"], "section": row["section"], "element": row["element"],
                      "ratings": ratings, "ioc": round(ioc, 2), "pass": ioc >= THRESHOLD,
                      "comment": row.get("comment", "")})
    sections: dict[str, list[float]] = {}
    for item in items:
        sections.setdefault(item["section"], []).append(item["ioc"])
    return {
        "experts": len(experts),
        "items": items,
        "mean_ioc": round(sum(i["ioc"] for i in items) / len(items), 2),
        "min_ioc": min(i["ioc"] for i in items),
        "by_section": {s: round(sum(v) / len(v), 2) for s, v in sections.items()},
        "failing": [i for i in items if not i["pass"]],
    }


def render_markdown(result: dict) -> str:
    verdict = "PASS" if result["pass"] else "FAIL"
    lines = [
        "# IOC report (checklist 1.2.5)",
        "",
        f"Generated: {result['generated_at']}",
        f"Experts: {result['experts']}. Items: {len(result['items'])}. Threshold: IOC >= {THRESHOLD:.2f} per item.",
        "",
        f"**{verdict}**: mean IOC {result['mean_ioc']:.2f}, minimum {result['min_ioc']:.2f}, "
        f"{len(result['failing'])} items below threshold.",
        "",
        "| Section | Mean IOC |",
        "|---|---|",
        *[f"| {s} | {v:.2f} |" for s, v in result["by_section"].items()],
        "",
        "| Item | Section | Element | Ratings | IOC | Result |",
        "|---|---|---|---|---|---|",
    ]
    lines += [f"| {i['item_id']} | {i['section']} | {i['element']} | {' '.join(f'{r:+d}' for r in i['ratings'])} "
              f"| {i['ioc']:.2f} | {'pass' if i['pass'] else 'revise'} |" for i in result["items"]]
    if result["failing"]:
        lines += ["", "## Items to revise", ""]
        lines += [f"- {i['item_id']} {i['element']}: {i['comment'] or 'no comment'}" for i in result["failing"]]
    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--template", action="store_true", help="write a blank expert form")
    parser.add_argument("--force", action="store_true", help="overwrite an existing form with --template")
    parser.add_argument("--scores", type=Path, default=FORM_FILE, help="filled-in form to score")
    args = parser.parse_args()

    if args.template:
        write_template(args.scores, args.force)
        return
    if not args.scores.exists():
        raise SystemExit(f"{args.scores} not found; run with --template first.")

    experts, rows, problems = read_scores(args.scores)
    if problems:
        print(f"IOC not computed: form incomplete ({len(problems)} problems).")
        for problem in problems[:20]:
            print(f"- {problem}")
        raise SystemExit(2)

    result = score(experts, rows)
    result["generated_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    result["pass"] = not result["failing"]
    REPORT_DIR.mkdir(exist_ok=True)
    (REPORT_DIR / "ioc.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    markdown = render_markdown(result)
    (REPORT_DIR / "ioc.md").write_text(markdown, encoding="utf-8")
    print(markdown)
    raise SystemExit(0 if result["pass"] else 1)


if __name__ == "__main__":
    main()
