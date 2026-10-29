export type User = {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  role: "admin" | "student" | "researcher" | "teacher" | null;
  /** True until the current privacy notice version is accepted (contract C4). */
  consent_required: boolean;
  avatar_url: string | null;
  profile_completed_at: string | null;
  faculty: string | null;
  department: string | null;
  student_id: string | null;
  employee_id: string | null;
  research_affiliation: string | null;
  created_at: string;
  updated_at: string;
};

export type Overview = {
  intro?: string;
  analogy?: string;
  research_basis?: string;
  expert?: string;
};

export type GraphNode = {
  label: string;
  color: string;
  type: "topic" | "faculty" | "course" | "bcg_pillar";
};

export type GraphEdge = {
  from: string;
  to: string;
  type: string;
};

export type KnowledgeGraph = {
  center: GraphNode;
  description?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type LearningModule = {
  title: string;
  hours: string;
  desc: string;
  /** Source document link. Absent on LLM-synthesized modules, which have no single source. */
  url?: string;
  /** Per-document fields the topic detail page renders. Absent on synthesized modules. */
  abstract?: string;
  authors?: string[];
  year?: string;
  source?: string;
  keywords?: string[];
  /**
   * KU Forest project details, all Thai. That source publishes no abstract, so
   * these are the only body content its documents have. Absent elsewhere.
   */
  category?: string;
  project_nature?: string;
  budget_year?: string;
  funding?: string;
  department?: string;
};

export type LearningPhase = {
  name: string;
  intro?: string;
  modules: LearningModule[];
};

export type LearningPath = {
  estimated_hours: string;
  subtitle?: string;
  phases: LearningPhase[];
};

export type EvidenceItem = {
  title: string;
  source: "KUKR" | "KU_Forest" | "KU_MOOC" | "UNKNOWN";
  url: string;
  snippet?: string;
};

export type GraphRagMeta = {
  reason?: string;
  calls: number;
  models?: { router?: string; sub?: string; synth?: string };
  docs_retrieved?: number;
  relations_retrieved?: number;
};

export type GraphRagResult = {
  title: string;
  overview: Overview;
  knowledge_graph: KnowledgeGraph;
  learning_path: LearningPath;
  evidence: EvidenceItem[];
  tier?: "basic" | "intermediate" | "advanced";
  /** Contract C1. Absent on results stored before the backend shipped it. */
  tags?: { bcg_pillars: string[]; faculties: string[] };
  /** Contract C2, on `data.result` of both POST /api/search and GET /api/search/history/{id}. Absent means ready. */
  status?: "pending" | "ready";
  _meta?: GraphRagMeta;
};

export type SearchHistory = {
  id: number;
  user_id: number;
  query: string;
  result: GraphRagResult | null;
  created_at: string;
  updated_at: string;
};

/** One personalized recommendation from GET /api/smart-picks. */
export type SmartPick = {
  title: string;
  /** Real document facts — year · topic · keyword count. */
  info: string;
  source: string;
  /** 0–100, relative to the strongest candidate in this response. */
  match: number;
  /** Why this was recommended, citing the signal that fired. */
  reasons: string[];
  keywords: string[];
  url: string;
  /** Search term that re-runs this pick as a roadmap. */
  query: string;
};

export type SmartPicks = {
  headline: string;
  /** How the whole set was derived — shown in the info box. */
  reason: string;
  generated_at: string;
  items: SmartPick[];
};

/** One completed module, addressed the same way a card links to its detail page. */
export type CompletedModule = { phase: number; card: number };

/**
 * GET/PUT /api/search/history/{id}/progress — completion state of one roadmap.
 * `total` counts the modules in the stored result, so `percent` is server-derived.
 */
export type LearningProgressState = {
  completed: CompletedModule[];
  completed_count: number;
  total: number;
  percent: number;
};

/** GET /api/search/recent — sidebar list. Max 10, newest first. */
export type RecentSearch = {
  id: number;
  query: string;
  created_at: string;
};

/** GET /api/search/history/{id} — replays a cached result without re-running the pipeline. */
export type SearchHistoryDetail = {
  id: number;
  query: string;
  tab: "overview" | "graph" | "learning";
  result: GraphRagResult | null;
  created_at: string;
};
