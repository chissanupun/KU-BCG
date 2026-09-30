# OWL validation report (checklist 1.2.5)

Generated: 2026-09-30T03:18:23+00:00
Ontology: `ontology/bcg-education.ttl`

| Check | Result |
|---|---|
| TBox structure | PASS |
| Domain/range conformance | PASS |
| OWL 2 RL consistency | PASS |

## TBox

14 classes, 23 object properties, 3 datatype properties, 2 disjointness axioms.

No structural issues.

## Domain/range conformance

3071 individuals, 4888 property assertions.

| Property | Assertions |
|---|---|
| about | 625 |
| affiliatedWith | 62 |
| authored | 3023 |
| connectsViaValueChain | 1 |
| enhancesGrowthOf | 1 |
| expandsEconomicsPerspectiveOf | 1 |
| hasExpertise | 34 |
| hasKeyword | 999 |
| hasPillar | 12 |
| inDepartment | 62 |
| integratesSpecies | 3 |
| involvesFaculty | 18 |
| isEntryPointFor | 1 |
| isFeedstockOf | 1 |
| isKeywordOf | 2 |
| isLaunchingNodeFor | 1 |
| mechanismOf | 4 |
| mitigatesCarbonVia | 4 |
| partOf | 21 |
| pollutesVia | 2 |
| providesRawMaterialTo | 1 |
| requires | 1 |
| teaches | 9 |

Every relationship endpoint lies inside its property's domain and range.

## Reasoner

owlrl 7.6.2 (OWL 2 RL closure): 14913 asserted triples, 31704 after closure.

No inconsistency: no disjoint-class clash, no owl:Nothing member, no functional-property conflict.

Note: HermiT/Pellet need a JVM, so the reasoner is owlrl (OWL 2 RL profile: subclass, disjointness, domain/range, functional property). The one construct outside RL, a union class used as a superclass (KeywordOrConcept, TopicOrResource, ResearchOrDocument), is covered by the closed-world conformance check.
