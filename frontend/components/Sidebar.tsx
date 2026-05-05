"use client";

import { useEffect } from "react";
import { useStore } from "../store/useStore";
import { getSessions, createSession } from "../services/api";
import { Plus, MessageSquare, Settings, User, Share2 } from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  const { sessions, activeSessionId, setActiveSessionId, addSession, setSessions, user } = useStore();

  useEffect(() => {
    let isMounted = true;
    async function fetchSessions() {
      try {
        const res = await getSessions();
        if (!isMounted) return;
        
        if (res.success && res.data && Array.isArray(res.data)) {
          setSessions(res.data);
        } else {
          console.warn("Sessions fetch was not successful or returned no data", res.error);
        }
      } catch (err) {
        console.error("Failed to load sessions", err);
      }
    }
    fetchSessions();
    return () => { isMounted = false; };
  }, [setSessions]);

  const handleNewSession = async () => {
    try {
      const res = await createSession();
      
      // Defensive check for res.data
      const data = res.data;
      if (!res.success || !data) {
        console.error("Failed to create session on backend:", res.error);
        // Fallback to local session creation if backend fails
        addSession({
          id: `local-${Date.now()}`,
          name: `Session ${sessions.length + 1} (Offline)`,
          status: "idle",
          createdAt: new Date().toISOString(),
        });
        return;
      }

      const newSession: any = {
        id: data.session_id || Date.now().toString(),
        name: data.task || data.name || `Session ${sessions.length + 1}`,
        status: data.status || "idle",
        createdAt: data.created_at || new Date().toISOString(),
      };
      addSession(newSession);
    } catch (err) {
      console.error("Critical error in handleNewSession:", err);
      // Fallback
      addSession({
        id: `err-${Date.now()}`,
        name: `Session ${sessions.length + 1} (Error)`,
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
        <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="text-sm font-semibold text-zinc-100 truncate">{user.name}</div>
            <div className="text-[11px] text-zinc-500 truncate">{user.email}</div>
          </div>
        </div>

        <button className="w-full flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors text-sm">
          <Settings size={18} />
          Settings
        </button>
      </div>
    </div>
  );
}
