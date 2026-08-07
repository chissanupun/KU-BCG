export type User = {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  role: "admin" | "student" | "researcher" | "teacher" | null;
  google_id: string | null;
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
  sub_queries?: string[];
  timing?: { retrieval_ms?: number; synthesis_ms?: number };
};

export type GraphRagResult = {
  title: string;
  overview: Overview;
  knowledge_graph: KnowledgeGraph;
  learning_path: LearningPath;
  evidence: EvidenceItem[];
  tier?: "basic" | "intermediate" | "advanced";
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

export type AdminMetric = {
  value: number;
  delta_pct: number | null;
};

export type AdminStats = {
  period: { from: string; to: string };
  total_searches: AdminMetric;
  active_users: AdminMetric;
  avg_latency_ms: AdminMetric;
  zero_result_rate: AdminMetric;
};

export type AdminAnalytics = {
  period: { from: string; to: string };
  search_volume_trend: { date: string; count: number }[];
  top_topics: { query: string; count: number }[];
  role_breakdown: { role: string; count: number }[];
  top_nodes: { label: string; count: number }[];
};

export type AdminSearchLog = {
  id: number;
  user_id: number;
  query: string;
  status: "success" | "zero_results" | "error";
  query_type: string | null;
  role_snapshot: string | null;
  faculty_snapshot: string | null;
  total_latency_ms: number | null;
  total_nodes_found: number | null;
  metrics: {
    top_node_labels?: string[];
    decomposed_queries?: string[];
    nodes_breakdown?: Record<string, number>;
    error_message?: string | null;
  } | null;
  created_at: string;
  user?: { id: number; name: string; email: string; role: string } | null;
};

export type AdminSearchLogPage = {
  data: AdminSearchLog[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  role: "admin" | "student" | "researcher" | "teacher";
  faculty: string;
  department: string;
  student_id?: string;
  employee_id?: string;
  research_affiliation?: string;
};
