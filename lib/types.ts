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
