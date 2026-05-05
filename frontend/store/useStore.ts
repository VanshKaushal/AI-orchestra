import { create } from "zustand";
import { Message, Session, GlobalState, SessionState, WatchdogLog } from "../types";

export interface AppState {
  sessions: Session[];
  activeSessionId: string | null;
  messages: Record<string, Message[]>;
  currentModels: Record<string, string>;
  globalState: GlobalState;
  sessionStates: Record<string, SessionState>;
  watchdogLogs: WatchdogLog[];
  isThinking: Record<string, boolean>;
  user: { name: string; email: string; avatar?: string };

  // Actions
  setUser: (user: { name: string; email: string; avatar?: string }) => void;
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  setActiveSessionId: (id: string) => void;
  removeSession: (id: string) => void;
  setSessionStatus: (id: string, status: Session["status"]) => void;
  setIsThinking: (id: string, thinking: boolean) => void;
  
  addMessage: (sessionId: string, message: Message) => void;
  setMessages: (sessionId: string, messages: Message[]) => void;
  
  switchModel: (sessionId: string, model: string) => void;
  
  setGlobalState: (state: GlobalState) => void;
  updateSessionState: (sessionId: string, state: Partial<SessionState>) => void;
  
  addWatchdogLog: (log: WatchdogLog) => void;
}

export const useStore = create<AppState>((set) => ({
  sessions: [],
  activeSessionId: null,
  messages: {},
  currentModels: {},
  globalState: { goal: "", progress: "", tasks: [] },
  sessionStates: {},
  watchdogLogs: [],
  isThinking: {},
  user: { name: "Vansh Kaushal", email: "vansh@orchestra.ai" },

  setUser: (user) => set({ user }),
  setSessions: (sessions) => set({ 
    sessions: sessions.map((s: any) => ({
      id: s.session_id || s.id,
      name: s.task || s.name || "Untitled Session",
      status: s.status || "idle",
      createdAt: s.created_at || s.createdAt || new Date().toISOString()
    }))
  }),
  addSession: (session) => set((state) => ({ 
    sessions: [...state.sessions, session],
    messages: { ...state.messages, [session.id]: [] },
    currentModels: { ...state.currentModels, [session.id]: "OpenAI" },
    activeSessionId: session.id
  })),
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  removeSession: (id) => set((state) => ({
    sessions: state.sessions.filter(s => s.id !== id),
    activeSessionId: state.activeSessionId === id ? (state.sessions[0]?.id || null) : state.activeSessionId
  })),
  setSessionStatus: (id, status) => set((state) => ({
    sessions: state.sessions.map(s => s.id === id ? { ...s, status } : s)
  })),
  setIsThinking: (id, thinking) => set((state) => ({
    isThinking: { ...state.isThinking, [id]: thinking }
  })),

  addMessage: (sessionId, message) => set((state) => {
    const sessionMessages = state.messages[sessionId] || [];
    
    // 1. Deduplication: Check if message with same ID already exists
    const exists = message.id && sessionMessages.some(m => m.id === message.id);
    if (exists) {
      // If it exists, update existing message and skip adding a duplicate
      return {
        messages: {
          ...state.messages,
          [sessionId]: sessionMessages.map(m => m.id === message.id ? { ...m, ...message } : m)
        }
      };
    }
    
    // 2. Add New Message with History Limit (100)
    const newMessages = [...sessionMessages, message].slice(-100);
    
    return {
      messages: {
        ...state.messages,
        [sessionId]: newMessages
      }
    };
  }),
  setMessages: (sessionId, messages) => set((state) => ({
    messages: {
      ...state.messages,
      [sessionId]: messages.slice(-100)
    }
  })),

  switchModel: (sessionId, model) => set((state) => ({
    currentModels: {
      ...state.currentModels,
      [sessionId]: model
    }
  })),

  setGlobalState: (globalState) => set({ globalState }),
  updateSessionState: (sessionId, stateUpdate) => set((state) => ({
    sessionStates: {
      ...state.sessionStates,
      [sessionId]: { ...(state.sessionStates[sessionId] || {}), ...stateUpdate } as SessionState
    }
  })),

  addWatchdogLog: (log) => set((state) => ({
    watchdogLogs: [log, ...state.watchdogLogs].slice(0, 100) // keep last 100 logs
  })),
}));
