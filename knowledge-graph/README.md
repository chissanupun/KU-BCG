# BCG knowledge graph (checklist 1.2)

Builds a Neo4j graph from the three KU sources (KU Forest research, KUKR documents,
KU MOOC courses) plus the six seed topics, models it with an OWL 2 ontology, and
produces the evidence reports for checklist items 1.2.1 to 1.2.5.

## Setup

```bash
# from KU-BCG/
docker compose -f docker-compose.neo4j.yml up -d      # Neo4j 5.26 + n10s, http://localhost:7474

cd knowledge-graph
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

Connection defaults: `bolt://localhost:7687`, user `neo4j`, password `phumpanya-dev`.
Override with `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` (and `NEO4J_PASSWORD` for compose).

## Run

```bash
.venv/bin/python build_graph.py                  # incremental; --reset wipes the database first
.venv/bin/python validate_graph.py --check-urls  # 1.2.1 - 1.2.4
.venv/bin/python validate_owl.py --self-test     # 1.2.5 consistency
.venv/bin/python compute_ioc.py                  # 1.2.5 IOC, once experts fill ioc/ioc-form.csv
```

Reports are written to `reports/` as Markdown and JSON.

Inputs, all under `../elastic-search/`:

| File | Used for |
|---|---|
| `seed-data.json` | topics, faculties, pillars, keywords, courses, seed triples |
| `data/all_docs.json` | KU Forest research and KUKR documents |
| `data/ku-forest-faculty-researchers.json` | author affiliation, department, expertise |

## Incremental updates

Every node stores a `content_hash` (sha256 of its properties and outgoing edges).
A rebuild rewrites only nodes whose hash changed and deletes nodes no longer in the
sources, so a rerun with unchanged data writes nothing.

## Ontology

`ontology/bcg-education.ttl` (namespace `https://phumpanya.ku.ac.th/ontology/bcg-education#`)
declares one class per Neo4j label and one object property per relationship type,
with domain, range and disjointness axioms. `build_graph.py` imports it into Neo4j
through n10s (`n10s.onto.import.inline`).

`validate_owl.py` checks the ontology structure, checks every relationship against
its property's domain and range, and runs an OWL 2 RL closure (owlrl) over the
ontology plus the whole graph to detect inconsistencies. `--self-test` injects a
disjoint-class clash and a domain violation to show both are caught.

## IOC (expert validation)

```bash
.venv/bin/python compute_ioc.py --template   # regenerate ioc/ioc-form.csv from the ontology
```

The form lists 55 items: classes, object properties, disjointness axioms and the 19
seed triples. Three experts rate each item in `expert_1..3`:

- `+1`: congruent with BCG cross-disciplinary knowledge
- `0`: unsure
- `-1`: not congruent

IOC per item is the mean rating. An item passes at 0.60 or above, and the ontology
passes when every item does. Items below the threshold are listed with the experts'
comments for revision. `--template` refuses to overwrite a form that already exists
unless `--force` is given.
