# Knowledge Graph Validation (Checklist 1.2.1-1.2.4)

Generated: 2026-09-30T03:18:23+00:00

| Item | Result |
|---|---|
| 1.2.1 Node counts | PASS |
| 1.2.2 Predicate coverage | PASS |
| 1.2.3 Carbon Footprint hub | PASS |
| 1.2.4 Cross-source traversal | PASS (93.4%, threshold 80%) |
| 1.2.4 Broken links | PASS |

## 1.2.1 Node counts

| Label | Rule | Actual | Result |
|---|---|---|---|
| Topic | = 6 | 6 | PASS |
| Faculty | = 4 | 4 | PASS |
| BCGPillar | = 3 | 3 | PASS |
| Course | = 6 | 6 | PASS |
| Keyword | >= 23 | 42 | PASS |
| Research | >= 50 | 203 | PASS |
| Document | >= 5 | 403 | PASS |
| Author | >= 10 | 2370 | PASS |

Core nodes (Topic + Faculty + BCGPillar + Course): 19 (required 19).
Nodes with wrong source tag: {'Research': 0, 'Document': 0, 'Course': 0}.
Other labels: Concept 13, Department 21.

## 1.2.2 Predicate coverage

Predicate types: 13 (required >= 6): connectsViaValueChain, enhancesGrowthOf, expandsEconomicsPerspectiveOf, integratesSpecies, isEntryPointFor, isFeedstockOf, isKeywordOf, isLaunchingNodeFor, mechanismOf, mitigatesCarbonVia, pollutesVia, providesRawMaterialTo, requires.
Seed-defined (topic, predicate) pairs with >= 1 triple: 12/12.
Strict matrix (every predicate x every topic): 13/78 (informational; many pairs have no meaning, e.g. mitigatesCarbonVia in Chitosan).
Missing required predicates: none.

| Topic | Predicate | Triples |
|---|---|---|
| 1 | isEntryPointFor | 1 |
| 1 | isKeywordOf | 2 |
| 2 | isFeedstockOf | 1 |
| 2 | providesRawMaterialTo | 1 |
| 3 | expandsEconomicsPerspectiveOf | 1 |
| 3 | isLaunchingNodeFor | 1 |
| 3 | pollutesVia | 2 |
| 4 | mitigatesCarbonVia | 4 |
| 5 | connectsViaValueChain | 1 |
| 5 | enhancesGrowthOf | 1 |
| 5 | requires | 1 |
| 6 | integratesSpecies | 3 |

## 1.2.3 Carbon Footprint connector hub

Faculties linked via mitigatesCarbonVia: ประมง, วนศาสตร์, อุตสาหกรรมเกษตร, เกษตร (PASS).

Concept layer (Topic, Faculty, BCGPillar, Course, Keyword, Concept): Carbon Footprint degree 24, rank 1 (PASS).

| Rank | Node | Label | Degree |
|---|---|---|---|
| 1 | Carbon Footprint & Carbon Neutrality | Topic | 24 |
| 2 | Biomass & Bioenergy | Topic | 15 |
| 3 | Microplastics & Water Quality | Topic | 14 |
| 4 | Agroforestry & Biodiversity | Topic | 14 |
| 5 | Sustainable Aquaculture & Probiotics | Topic | 13 |

Whole graph (includes Author, Department, Document, Research): Carbon Footprint degree 82, rank 7 (FAIL).

| Rank | Node | Label | Degree |
|---|---|---|---|
| 1 | Biomass & Bioenergy | Topic | 170 |
| 2 | Agroforestry & Biodiversity | Topic | 133 |
| 3 | Microplastics & Water Quality | Topic | 118 |
| 4 | Biomass | Keyword | 117 |
| 5 | Sustainable Aquaculture & Probiotics | Topic | 113 |

## 1.2.4 Cross-source traversal

A test case is one resource node and one other source. It passes when a path resource -> shared Topic or shared Keyword -> resource of the target source exists.

| From | To | Cases | Pass | Via topic | Via keyword |
|---|---|---|---|---|---|
| KUKR | KU_Forest | 403 | 403 | 403 | 239 |
| KUKR | KU_MOOC | 403 | 351 | 351 | 0 |
| KU_Forest | KUKR | 203 | 203 | 203 | 185 |
| KU_Forest | KU_MOOC | 203 | 174 | 174 | 0 |
| KU_MOOC | KUKR | 6 | 6 | 6 | 0 |
| KU_MOOC | KU_Forest | 6 | 6 | 6 | 0 |

Total: 1143/1224 = 93.4%.
Authors bridging KU Forest research and KUKR documents: 16.

Failing groups:

- KUKR -> KU_MOOC, topic_ids ['2']: 52
- KU_Forest -> KU_MOOC, topic_ids ['2']: 29

## 1.2.4 Broken links

Unresolved source references: 0.
Model edges with missing endpoint: 0.
Edges in model vs Neo4j: 4888 vs 4888.
Resource nodes without a valid URL: 0.
HTTP check: not run (use --check-urls).
