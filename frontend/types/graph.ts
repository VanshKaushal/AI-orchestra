export type NodeType = 
  | "user_prompt"
  | "ai_response"
  | "topic"
  | "concept"
  | "entity"
  | "tool_usage"
  | "session"
  | "memory"
  | "external_knowledge"
  | "code"
  | "file"
  | "url"
  | "error"
  | "insight"
  | "goal" // Keep for backward compatibility
  | "task" // Keep for backward compatibility
  | "decision" // Keep for backward compatibility
  | "llm" // Keep for backward compatibility
  | "response" // Keep for backward compatibility
  | "model"; // Keep for backward compatibility

export type GraphNode = {
  id: string;
  label: string;
  type: NodeType;
  importance: number; // 0 to 1
  relevanceScore?: number; // Semantic relevance
  centrality?: number; // Graph centrality
  cluster?: number;
  metadata?: Record<string, any>;
  count?: number; // frequency of appearance
  timestamp?: string; // for temporal evolution
  embedding?: number[]; // for semantic positioning
  session_id?: string; // to separate session knowledge
};

export type GraphEdge = {
  source: string;
  target: string;
  weight?: number; // Thickness/Strength
  type?: string; // Semantic relationship type
  strength?: number; // 0 to 1
  label?: string;
  animated?: boolean; // For directional flow
};

export type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

