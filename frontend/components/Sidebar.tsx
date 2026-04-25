"use client";

import { useEffect } from "react";
import { useStore } from "../store/useStore";
import { getSessions, createSession } from "../services/api";
import { Plus, MessageSquare, Settings, User, Share2 } from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  const { sessions, activeSessionId, setActiveSessionId, addSession, setSessions } = useStore();

  useEffect(() => {
    async function fetchSessions() {
      try {
        const { data } = await getSessions();
        if (data && Array.isArray(data)) {
          setSessions(data);
        }
      } catch (err) {
        console.error("Failed to load sessions", err);
      }
    }
    fetchSessions();
  }, [setSessions]);

  const handleNewSession = async () => {
    try {
      const { data } = await createSession();
      // data ideally contains the session object matching schema
      const newSession: any = {
        id: data.session_id || Date.now().toString(),
        name: data.task || data.name || `Session ${sessions.length + 1}`,
        status: data.status || "idle",
        createdAt: data.created_at || new Date().toISOString(),
      };
      addSession(newSession);
    } catch (err) {
      console.error("Failed to create session", err);
      // Fallback
      addSession({
        id: Date.now().toString(),
        name: `Session ${sessions.length + 1}`,
        status: "idle",
        createdAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="w-64 bg-[#0a0a0a] border-r border-zinc-800/50 flex flex-col h-full shrink-0">
      <div className="p-4 flex items-center justify-between">
        <button 
          onClick={handleNewSession}
          className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 scrollbar-hide py-2">
        <Link href="/graph" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 mb-2">
          <Share2 size={16} className="text-zinc-500" />
          <div className="text-sm font-medium">Cognitive Graph</div>
        </Link>
        <div className="text-xs font-semibold text-zinc-500 px-2 py-2">Recent Sessions</div>
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => setActiveSessionId(session.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
              activeSessionId === session.id
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
            }`}
          >
            <MessageSquare size={16} className={activeSessionId === session.id ? "text-zinc-200" : "text-zinc-500"} />
            <div className="truncate text-sm flex-1">
              {session.name}
            </div>
            {session.status === "running" && (
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-pulse"></span>
            )}
          </button>
        ))}
        
        {sessions.length === 0 && (
          <div className="px-3 py-2 text-zinc-600 text-xs">
            No history.
          </div>
        )}
      </div>

      <div className="p-3 border-t border-zinc-800/50 mb-2 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors text-sm">
          <Settings size={18} />
          Settings
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors text-sm">
          <User size={18} />
          Profile
        </button>
      </div>
    </div>
  );
}
