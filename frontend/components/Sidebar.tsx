"use client";

import { useEffect, useState, useMemo } from "react";
import { useStore } from "../store/useStore";
import { getSessions, createSession, deleteSession } from "../services/api";
import { Plus, MessageSquare, Settings, User, Share2, Brain, Activity, Target, Zap, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar() {
  const { 
    sessions, 
    activeSessionId, 
    setActiveSessionId, 
    addSession, 
    removeSession, 
    setSessions, 
    user, 
    viewMode, 
    setViewMode,
    messages 
  } = useStore();
  
  const [collapsed, setCollapsed] = useState(false);

  const stats = useMemo(() => {
    if (!activeSessionId) return { tokens: 0, cost: 0 };
    const sessionMessages = messages[activeSessionId] || [];
    return sessionMessages.reduce((acc, msg) => ({
      tokens: acc.tokens + (msg.tokens_used || 0),
      cost: acc.cost + (msg.cost || 0)
    }), { tokens: 0, cost: 0 });
  }, [activeSessionId, messages]);

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm("Delete this session and all its cognitive links?")) {
      try {
        const res = await deleteSession(sessionId);
        if (res.success) {
          removeSession(sessionId);
        }
      } catch (err) {
        console.error("Failed to delete session", err);
      }
    }
  };
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;
    async function fetchSessions() {
      try {
        const res = await getSessions();
        if (!isMounted) return;
        if (res.success && res.data && Array.isArray(res.data)) {
          setSessions(res.data);
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
      if (res?.success && res?.data) {
        const data = res.data as any;
        const newSession: any = {
          id: data.session_id || data.id || Date.now().toString(),
          name: data.task || data.name || `Session ${sessions.length + 1}`,
          status: data.status || "idle",
          createdAt: data.created_at || data.createdAt || new Date().toISOString(),
        };
        addSession(newSession);
      }
    } catch (err) {
      console.error("Critical error in handleNewSession:", err);
    }
  };

  return (
    <motion.div 
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      className="relative flex flex-col h-full glass-panel border-r border-white/5 z-50 transition-all duration-500 ease-in-out"
    >
      {/* COLLAPSE TOGGLE */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-10 w-6 h-6 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all z-[60]"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* HEADER: OPERATIONAL HUB */}
      <div className="p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <Brain size={20} className="text-cyan-500" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Command Center</span>
              <span className="text-[8px] font-bold text-zinc-500 uppercase">AI Orchestra V5</span>
            </div>
          )}
        </div>

        {/* MODE SWITCHER */}
        {!collapsed && (
          <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setViewMode('chat')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${viewMode === 'chat' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <MessageSquare size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Stream</span>
            </button>
            <button 
              onClick={() => setViewMode('graph')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${viewMode === 'graph' ? 'bg-cyan-500/10 text-cyan-500 shadow-lg border border-cyan-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Activity size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Cortex</span>
            </button>
          </div>
        )}

        <button 
          onClick={handleNewSession}
          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${collapsed ? 'justify-center' : ''} bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 hover:text-white group`}
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" />
          {!collapsed && <span className="text-xs font-bold uppercase tracking-tight">Initiate Sequence</span>}
        </button>
      </div>

      {/* BODY: SESSION NAVIGATION */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2 os-scrollbar pb-10">
        {!collapsed && <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-2 mb-2">Active Nodes</div>}
        
        {sessions.map((session) => {
          const isActive = activeSessionId === session.id;
          return (
            <div key={session.id} className="relative group">
              <button
                onClick={() => setActiveSessionId(session.id)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_20px_-5px_rgba(6,182,212,0.15)]' : 'hover:bg-white/5 border border-transparent'}`}
              >
                <div className="relative shrink-0">
                  <Target size={16} className={isActive ? 'text-cyan-500' : 'text-zinc-600 group-hover:text-zinc-400'} />
                  {session.status === "running" && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 neural-pulse border border-zinc-900"></span>
                  )}
                </div>
                
                {!collapsed && (
                  <div className="flex flex-col items-start overflow-hidden pr-6">
                    <span className={`text-xs font-bold truncate w-full ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                      {session.name}
                    </span>
                    <span className="text-[8px] font-mono text-zinc-700 uppercase tracking-tighter">
                      {session.id.slice(-8)}
                    </span>
                  </div>
                )}
              </button>

              {!collapsed && (
                <button
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all z-10"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* FOOTER: SYSTEM STATUS & METRICS */}
      <div className="p-4 border-t border-white/5 space-y-4">
        {!collapsed && stats.tokens > 0 && (
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-zinc-900/30 border border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Neural Load</span>
              <span className="text-[10px] font-mono text-cyan-500 font-bold">{stats.tokens.toLocaleString()} <span className="text-[8px] text-zinc-700">TKN</span></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Compute Cost</span>
              <span className="text-[10px] font-mono text-emerald-500 font-bold">${stats.cost.toFixed(4)}</span>
            </div>
          </div>
        )}

        {!collapsed ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              {user.name.charAt(0)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-white truncate">{user.name}</span>
              <span className="text-[8px] text-zinc-600 uppercase font-black truncate tracking-widest">Operator</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-2">
             <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <Settings size={14} className="text-zinc-500" />
             </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
