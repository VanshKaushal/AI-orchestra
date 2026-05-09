"use client";

import { useStore } from "../store/useStore";
import { Terminal, CheckCircle, AlertTriangle, Info, Play, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WatchdogFeed() {
  const { watchdogLogs } = useStore();

  const getIcon = (type: string) => {
    switch(type) {
      case "decision": return <CheckCircle size={12} className="text-emerald-500" />;
      case "error": return <AlertTriangle size={12} className="text-red-500" />;
      case "action": return <Play size={12} className="text-cyan-500" />;
      default: return <Info size={12} className="text-zinc-600" />;
    }
  };

  return (
    <div className="h-48 flex flex-col shrink-0 bg-black/20 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 font-mono no-scrollbar flex flex-col-reverse">
        <AnimatePresence initial={false}>
          {watchdogLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-10 gap-3">
              <Activity size={24} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Monitoring Stream</span>
            </div>
          ) : (
            watchdogLogs.map((log) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 py-1.5 group transition-all"
              >
                <div className="text-zinc-800 shrink-0 select-none text-[9px] font-black tabular-nums">
                  {new Date(log.timestamp).toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                </div>
                <div className="shrink-0 mt-0.5">
                  {getIcon(log.type)}
                </div>
                <div className="text-zinc-500 group-hover:text-zinc-300 transition-colors text-[10px] leading-relaxed break-words">
                  <span className="text-zinc-700 font-bold mr-1 uppercase">ORCH:</span>
                  {log.message}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
