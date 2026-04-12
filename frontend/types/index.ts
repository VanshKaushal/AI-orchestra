export type Role = "user" | "assistant" | "system";

export interface Message {
  id: string;
  session_id: string;
  role: Role;
  content: string;
  timestamp: number;
  modelUsed?: string;
  isSending?: boolean;
}

export interface Session {
  id: string;
  name: string;
  status: "idle" | "running" | "error";
  createdAt: string;
}

export interface GlobalState {
  goal: string;
  progress: string;
  tasks: any[];
}

export interface SessionState {
  context: Record<string, any>;
  activeModel: string;
  tokensUsed: number;
}

export interface WatchdogLog {
  id: string;
  timestamp: string;
  message: string;
  type: "info" | "decision" | "error" | "action";
}
