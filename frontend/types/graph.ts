export type GraphNode = {
  id: string;
  label: string;
  type: "goal" | "task" | "decision" | "insight" | "session" | "llm" | "response" | "model";
  importance: number; // MUST ALWAYS EXIST
  cluster?: number;
  metadata?: Record<string, any>;
  count?: number;
};

export type GraphEdge = {
  source: string;
  target: string;
  weight?: number;
  type?: string;
};

export type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};
