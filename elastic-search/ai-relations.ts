/** Turns the relation drafts an AI proposed (data/ai-proposals.json) into rows for ku_bcg_relations, marked origin "ai_suggested". */

export interface Proposal {
  subject: string; subject_type: string; subject_url?: string;
  predicate: string; object: string; object_type: string; object_url?: string;
  topic_id: string; origin: string; confidence: number; reason_th: string;
}
export interface Concept { id: string; name_th: string; name_en: string; topic_id: string }
export interface AiRelation {
  subject: string; predicate: string; object: string; topic_id: string; origin: 'ai_suggested';
  confidence: number; reason_th: string; source_doc_url?: string; target_doc_url?: string;
}
export interface Context {
  topics: { id: string; name_th: string; name_en: string; faculties: string[] }[];
  docs: { title: string; url: string }[];
  concepts: Concept[];
  predicates: string[];
  /** Relations already in ku_bcg_relations: their entity names are valid concepts and their triples are not repeated. */
  curated: { subject: string; predicate: string; object: string }[];
}

type Side = { name: string; url?: string };

/** Entities are named the way the curated relations name them: topic = English name, faculty = Faculty_x, research/course = document title. */
function resolve(type: string, name: string, url: string | undefined, ctx: Context, known: Set<string>): Side | string {
  if (type === 'topic') { const t = ctx.topics.find((x) => x.name_th === name || x.name_en === name); return t ? { name: t.name_en } : `unknown topic "${name}"`; }
  if (type === 'faculty') return ctx.topics.some((t) => t.faculties.map((f) => `Faculty_${f}`).includes(name)) ? { name } : `unknown faculty "${name}"`;
  if (type === 'research' || type === 'course') {
    const doc = url ? ctx.docs.find((d) => d.url === url) : ctx.docs.find((d) => d.title === name);
    return doc ? { name: doc.title, url: doc.url } : `no document for ${type} "${name}"`;
  }
  if (type === 'concept') return known.has(name) ? { name } : `unknown concept "${name}"`;
  return `unknown entity type "${type}"`;
}

export function toRelations(proposals: Proposal[], ctx: Context): { relations: AiRelation[]; dropped: { reason: string; proposal: Proposal }[] } {
  const known = new Set([...ctx.concepts.map((c) => c.id), ...ctx.curated.flatMap((r) => [r.subject, r.object])]);
  const seen = new Set(ctx.curated.map((r) => `${r.subject}|${r.predicate}|${r.object}`));
  const relations: AiRelation[] = [];
  const dropped: { reason: string; proposal: Proposal }[] = [];
  for (const p of proposals) {
    const from = resolve(p.subject_type, p.subject, p.subject_url, ctx, known);
    const to = resolve(p.object_type, p.object, p.object_url, ctx, known);
    const why =
      p.origin !== 'ai_suggested' ? 'origin is not ai_suggested' :
      !ctx.predicates.includes(p.predicate) ? `unknown predicate ${p.predicate}` :
      !(p.confidence >= 0 && p.confidence <= 1) ? 'confidence outside 0..1' :
      typeof from === 'string' ? from : typeof to === 'string' ? to :
      from.name === to.name ? 'subject and object are the same' :
      seen.has(`${from.name}|${p.predicate}|${to.name}`) ? 'already exists' : '';
    if (why || typeof from === 'string' || typeof to === 'string') { dropped.push({ reason: why, proposal: p }); continue; }
    seen.add(`${from.name}|${p.predicate}|${to.name}`);
    relations.push({
      subject: from.name, predicate: p.predicate, object: to.name, topic_id: p.topic_id, origin: 'ai_suggested',
      confidence: p.confidence, reason_th: p.reason_th,
      ...(from.url && { source_doc_url: from.url }), ...(to.url && { target_doc_url: to.url }),
    });
  }
  return { relations, dropped };
}
