# KU-BCG Elasticsearch Search System

Semantic search system for Kasetsart University Bio-Circular-Green (BCG) Economy research.
Scrapes 3 KU data sources, indexes into Elasticsearch, and exposes a JSON search API.

---

## Data Sources

| Source | Docs | Description |
|---|---|---|
| **KUKR** | 403 | KU academic library catalog — research papers, theses, books |
| **KU Forest** | 203 | KU research registry — projects, journal articles, IP, awards |
| **KU MOOC** | 6 | KU e-learning platform — BCG-relevant online courses |
| **Relations** | 19 | Semantic knowledge graph triples (subject → predicate → object) |

**Total: 612 documents + 19 relations**

### KUKR (`https://kukr.lib.ku.ac.th`)
- Library catalog search API
- 13 BCG keywords (EN + TH), up to ~30 results per keyword
- Requires session cookie capture via browser (modal dismissal), then pure HTTP fetch for pagination
- Known server-side pagination bug: 49/50 bibid overlap between pages (unfixable)

### KU Forest (`https://kuforest.ku.ac.th`)
- ASP.NET WebForms research registry
- 23 keywords, up to 3 pages per keyword (~10 results/page)
- Must run standalone — parallel browser instances cause DNS failures
- Fields: title, year, PI, co-PI, funding source, doc type

### KU MOOC (`https://kumooc.ku.th`)
- 6 seed courses from `elastic-search/seed-data.json`
- Fields: title, abstract, instructor, course code, category

---

## Search API

```
GET /api/search?q=<query>&topic=<topic_id>&source=<KU_Forest|KUKR|KU_MOOC>
```

Returns results grouped by source + semantic relations.

```json
{
  "total": 42,
  "by_source": {
    "KU_Forest": [...],
    "KUKR": [...],
    "KU_MOOC": [...]
  },
  "relations": [...]
}
```

---

## Elasticsearch Indices

| Index | Purpose |
|---|---|
| `ku_bcg_documents` | All 612 scraped documents |
| `ku_bcg_relations` | 19 semantic knowledge graph triples |

ES running on `localhost:9200` (Docker).

---

## Data Files

```
elastic-search/data/
├── all_docs.json          # All 612 documents (1.5MB)
├── all_relations.json     # 19 semantic relations
└── results/               # Per-keyword result JSONs (24 files)
    ├── biomass.json
    ├── chitosan.json
    ├── water_quality.json
    └── ...
```

---

## Scrapers

```
elastic-search/scrapers/
├── kukr.ts       # KUKR — browser session + pure fetch pagination
├── ku-forest.ts  # KU Forest — Playwright, ASP.NET __doPostBack pagination
└── ku-mooc.ts    # KU MOOC — Playwright, seed URLs only
```

### Run scrapers

```bash
# Full ingest (KUKR + KU MOOC, parallel)
./node_modules/.bin/tsx elastic-search/ingest.ts

# KU Forest only (must run standalone)
./node_modules/.bin/tsx elastic-search/ingest-forest.ts

# Setup/reset ES indices
./node_modules/.bin/tsx elastic-search/setup-index.ts
```

---

## Stack

- **Next.js** (App Router, TypeScript) — API route only
- **Elasticsearch 8.13** — Docker, port 9200
- **Playwright** — headless Chromium for scraping
- **Thai analyzer** — custom ES analyzer for Thai text search
