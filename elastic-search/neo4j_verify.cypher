// Gate checks for ก.ย. 2569 Neo4j acceptance criteria (Phase1_Acceptance_KUPhumpanya.pdf 1.2.x)

// 1.2.1 core + volume node counts
MATCH (n) RETURN labels(n)[0] AS label, count(*) AS cnt ORDER BY cnt DESC;

// 1.2.2 predicate type coverage (excluding structural import edges)
MATCH ()-[r]->()
WHERE NOT type(r) IN ['HAS_KEYWORD','WRITTEN_BY','TAGGED_BCG','BELONGS_TO_TOPIC','RELATES_TO_FACULTY','HAS_BCG_PILLAR','OFFERED_FOR_TOPIC']
RETURN type(r) AS predicate, count(*) AS cnt ORDER BY cnt DESC;

// 1.2.3 Carbon Footprint connector hub: must reach all 4 pilot faculties via mitigatesCarbonVia
// and have the highest degree among domain Entity nodes.
MATCH (cf:Entity {name:'CarbonFootprint'})<-[:mitigatesCarbonVia]-(f)
RETURN f.name;
MATCH (e:Entity)-[r]-() RETURN e.name AS entity, count(r) AS degree ORDER BY degree DESC LIMIT 5;

// 1.2.4a broken links: any Research/Document/Course node without a valid http(s) url
MATCH (n) WHERE n:Research OR n:Document OR n:Course
WITH n, coalesce(n.url,'') AS u
WHERE u = '' OR NOT u STARTS WITH 'http'
RETURN labels(n)[0] AS label, count(*) AS broken;

// 1.2.4c per-item links: distinct ids vs distinct urls, and remaining keyword-search urls
MATCH (r:Research) RETURN count(r) AS research, count(DISTINCT r.id) AS ids, count(DISTINCT r.url) AS urls,
       sum(CASE WHEN r.url CONTAINS 'Search.aspx' THEN 1 ELSE 0 END) AS search_urls;

// 1.2.4b cross-source traversal: % of topics reachable from all 3 sources
MATCH (t:Topic)
OPTIONAL MATCH (t)<-[:BELONGS_TO_TOPIC]-(r:Research)
OPTIONAL MATCH (t)<-[:BELONGS_TO_TOPIC]-(d:Document)
OPTIONAL MATCH (t)<-[:OFFERED_FOR_TOPIC]-(c:Course)
WITH t, count(DISTINCT r) AS rn, count(DISTINCT d) AS dn, count(DISTINCT c) AS cn
RETURN count(t) AS total_topics,
       sum(CASE WHEN rn>0 AND dn>0 AND cn>0 THEN 1 ELSE 0 END) AS full_triangle_topics;
