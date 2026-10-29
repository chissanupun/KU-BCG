/**
 * The six pilot KG topics (acceptance gate 1.1.1) and the pilot faculties the backend maps each one to
 * (config/bcg_topics.php in ku-phumpanya). The faculties differ per topic; together they cover all four.
 */
export const TOPICS = [
  { query: "ชีวมวลและพลังงานทดแทน", faculties: ["เกษตร", "อุตสาหกรรมเกษตร", "วนศาสตร์"] },
  { query: "ไคโตซานและบรรจุภัณฑ์ชีวภาพ", faculties: ["ประมง", "อุตสาหกรรมเกษตร", "เกษตร"] },
  { query: "Microplastics", faculties: ["ประมง", "อุตสาหกรรมเกษตร", "เกษตร"] },
  { query: "Carbon Footprint", faculties: ["วนศาสตร์", "เกษตร", "อุตสาหกรรมเกษตร", "ประมง"] },
  { query: "การเพาะเลี้ยงสัตว์น้ำที่ยั่งยืน", faculties: ["ประมง", "อุตสาหกรรมเกษตร"] },
  { query: "วนเกษตร", faculties: ["วนศาสตร์", "เกษตร", "ประมง"] },
];
