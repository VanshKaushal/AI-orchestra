"use client";

import { useEffect } from "react";
import { useStore } from "../store/useStore";
import { FolderGit2, ShieldAlert, Cpu, ListTodo, Activity, Terminal, Zap } from "lucide-react";
import { getState } from "../services/api";
import { useStateExplorer } from "../hooks/useStateExplorer";
import { motion } from "framer-motion";

export default function StatePanel({ selectedNode }: { selectedNode?: any }) {
  const { globalState, sessionStates, activeSessionId, setGlobalState, messages } = useStore();
  const { goal, progress, logs } = useStateExplorer(activeSessionId || "");

  useEffect(() => {
    let mounted = true;
    async function fetchState() {
      const res = await getState();
      if (!mounted) return;
      if (res.success && res.data) {
        setGlobalState(res.data);
      }
    }
    fetchState();
    return () => { mounted = false; };
  }, [setGlobalState]);

  const activeSessionState = activeSessionId ? sessionStates[activeSessionId] : null;

  return (
    <div className="flex flex-col h-full bg-[#020203]/80 backdrop-blur-3xl os-scrollbar overflow-y-auto">
      <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#020203]/90 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Activity size={16} className="text-emerald-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-white">
              {selectedNode ? "Component Metadata" : "Live Insights"}
            </span>
            <span className="text-[8px] font-bold text-zinc-500 uppercase">Fidelity: High</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8 pb-20">
        {/* SELECTED NODE INSPECTION */}
        {selectedNode ? (
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Zap size={14} className="text-cyan-500" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Node Properties</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-6">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-zinc-600 uppercase">Identity</span>
                <span className="text-sm font-bold text-white">{selectedNode.label || selectedNode.id}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-zinc-600 uppercase">Type</span>
                <span className="text-[10px] font-mono text-cyan-500 uppercase">{selectedNode.type}</span>
              </div>
              <div className="space-y-2">
                <span className="text-[8px] font-black text-zinc-600 uppercase">Attributes</span>
                <pre className="text-[10px] font-mono text-zinc-400 bg-black/40 p-3 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
                  {(() => {
                    try {
                      // Only stringify metadata or basic properties to avoid circular refs from Three.js
                      const displayData = selectedNode.metadata || {
                        id: selectedNode.id,
                        label: selectedNode.label,
                        type: selectedNode.type
                      };
                      return JSON.stringify(displayData, null, 2);
                    } catch (e) {
                      return "Error serializing node metadata";
                    }
                  })()}
                </pre>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* GLOBAL GOAL SECTION */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <ShieldAlert size={14} className="text-zinc-600" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Global Objective</span>
              </div>
              <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="text-xs text-zinc-300 leading-relaxed italic">
                  "{goal || "Standby: Orchestrator awaiting objective..."}"
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[8px] font-bold text-zinc-600 uppercase">Neural Convergence</span>
                    <span className="text-[10px] font-mono text-emerald-500">{progress}%</span>
                  </div>
                  <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden flex border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] h-full"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* SESSION CONTEXT & TELEMETRY */}
            {activeSessionId && (
              <>
                <section className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Cpu size={14} className="text-zinc-600" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Cognitive Context</span>
                  </div>
                  <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-black/40 space-y-4">
                    <pre className="text-[10px] font-mono text-cyan-500/80 leading-relaxed max-h-60 overflow-y-auto no-scrollbar">
                      {JSON.stringify(activeSessionState?.context || {}, null, 2)}
                    </pre>
                    
                    <div className="pt-4 border-t border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Neural Load</span>
                        <span className="text-xs font-black text-white tabular-nums">
                          {(() => {
                            const sessionMsgs = messages[activeSessionId] || [];
                            const totalTokens = sessionMsgs.reduce((acc, m) => acc + (m.tokens_used || 0), 0);
                            return totalTokens.toLocaleString();
                          })()} <span className="text-[9px] text-zinc-700">TKN</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Estimated Cost</span>
                        <span className="text-xs font-black text-emerald-500 tabular-nums">
                          ${(() => {
                            const sessionMsgs = messages[activeSessionId] || [];
                            const totalCost = sessionMsgs.reduce((acc, m) => acc + (m.cost || 0), 0);
                            return totalCost.toFixed(4);
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}
          </>
        )}

        {/* LIVE SYSTEM LOGS (Always visible if not inspecting node, or maybe both?) */}
        {!selectedNode && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Terminal size={14} className="text-zinc-600" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Execution Stream</span>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-white/5 space-y-2 max-h-60 overflow-y-auto no-scrollbar">
              {logs.length > 0 ? (
                logs.map((log, i) => (
                  <div key={i} className="flex gap-3 text-[9px] font-mono leading-relaxed group">
                    <span className="text-zinc-800 font-bold">{i.toString().padStart(3, '0')}</span>
                    <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors">{log}</span>
                  </div>
                ))
              ) : (
                <div className="text-[9px] text-zinc-700 italic text-center py-4">No active execution logs</div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
