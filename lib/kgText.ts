import courseTitles from "./courseTitles.json";

/** Plain-Thai wording for the knowledge graph: the backend sends relation names and slugs meant for developers. */

export const TYPE_LABELS: Record<string, string> = {
  topic: "หัวข้อ",
  bcg_pillar: "เสาหลัก BCG",
  faculty: "คณะ",
  course: "คอร์ส",
};

/** One phrase per relation in ku_bcg_relations, plus the ones the backend or the Non-Degree import add. */
export const PREDICATE_TH: Record<string, string> = {
  mitigatesCarbonVia: "ช่วยลดคาร์บอนผ่าน",
  integratesSpecies: "ผสมผสานเข้ากับ",
  isKeywordOf: "เป็นคำสำคัญของ",
  pollutesVia: "ก่อมลพิษผ่าน",
  isEntryPointFor: "เป็นคอร์สเริ่มต้นสำหรับ",
  isFeedstockOf: "เป็นวัตถุดิบของ",
  providesRawMaterialTo: "ส่งวัตถุดิบให้",
  isLaunchingNodeFor: "เป็นคอร์สปูพื้นฐานให้",
  expandsEconomicsPerspectiveOf: "ขยายมุมมองด้านเศรษฐศาสตร์ของ",
  enhancesGrowthOf: "ช่วยเพิ่มการเติบโตของ",
  requires: "ต้องอาศัย",
  connectsViaValueChain: "เชื่อมโยงกันผ่านห่วงโซ่คุณค่ากับ",
  relatedTo: "เกี่ยวข้องกับ",
  studiedBy: "มีการศึกษาโดย",
  isCourseFor: "เป็นชุดวิชาสำหรับ",
};
const UNKNOWN_PREDICATE = "เกี่ยวข้องกับ";

const LABEL_TH: Record<string, string> = {
  forest: "ป่าไม้",
  agriculture: "เกษตรกรรม",
  industry: "อุตสาหกรรม",
  fishery: "ประมง",
  carbon_stock: "คาร์บอนที่สะสมไว้",
  emission_reduction: "การลดการปล่อยก๊าซ",
  LCA: "การประเมินวัฏจักรชีวิต (LCA)",
  blue_carbon: "บลูคาร์บอน",
  water_quality: "คุณภาพน้ำ",
  packaging: "บรรจุภัณฑ์",
  agricultural_plastic: "พลาสติกการเกษตร",
  biodegradable_packaging: "บรรจุภัณฑ์ย่อยสลายได้",
  Biomass: "ชีวมวล",
  Chitosan: "ไคโตซาน",
  Probiotic: "โพรไบโอติก",
  Agroforestry: "วนเกษตร",
  tree_species: "ชนิดไม้ยืนต้น",
  crop_species: "ชนิดพืชเกษตร",
  aquatic_species_mangrove: "สัตว์น้ำและป่าชายเลน",
  carbon_footprint_learners: "ผู้เรียนเรื่องคาร์บอนฟุตพริ้นท์",
  microplastics_learners: "ผู้เรียนเรื่องไมโครพลาสติก",
  microplastics_problem: "ปัญหาไมโครพลาสติก",
};

const PILLAR_TH: Record<string, string> = { green: "เศรษฐกิจสีเขียว", bio: "เศรษฐกิจชีวภาพ", circular: "เศรษฐกิจหมุนเวียน" };

const COURSE_TITLES: Record<string, string> = courseTitles;

export function humanLabel(label: string): string {
  if (!label) return "";
  if (LABEL_TH[label]) return LABEL_TH[label];
  const faculty = label.match(/^Faculty_(.+)$/);
  if (faculty) return `คณะ${faculty[1]}`;
  const pillar = label.match(/^bcg_(.+)$/i);
  if (pillar) return PILLAR_TH[pillar[1].toLowerCase()] ?? label.replace(/_/g, " ");
  if (/^kumooc\d+$/i.test(label)) return COURSE_TITLES[label] ?? `คอร์ส ${label}`;
  return label.replace(/_/g, " ").trim() || label;
}

export const predicateText = (type?: string) => PREDICATE_TH[type ?? ""] ?? UNKNOWN_PREDICATE;

export const edgeSentence = (from: string, type: string | undefined, to: string) =>
  `${humanLabel(from)} ${predicateText(type)} ${humanLabel(to)}`;

export function graphSummary(center: string, otherNodes: number, edges: number): string {
  const name = humanLabel(center);
  if (otherNodes === 0) return `${name} ยังไม่มีเรื่องที่เชื่อมโยง`;
  return `${name} เชื่อมโยงกับ ${otherNodes} เรื่อง${edges > 0 ? ` ผ่าน ${edges} ความสัมพันธ์` : ""}`;
}

/** The backend's description is an English debug string ("GraphRAG subgraph ..."); only Thai text is shown as is. */
export const pickDescription = (backend: string | undefined, summary: string) =>
  backend && /[ก-๙]/.test(backend) ? backend : summary;
