import { useStore } from "../store/useStore";
import { Terminal, CheckCircle, AlertTriangle, Info, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WatchdogFeed() {
  const { watchdogLogs } = useStore();

  const getIcon = (type: string) => {
    switch(type) {
      case "decision": return <CheckCircle size={14} className="text-emerald-500" />;
      case "error": return <AlertTriangle size={14} className="text-red-500" />;
      case "action": return <Play size={14} className="text-blue-500" />;
      default: return <Info size={14} className="text-zinc-500" />;
    }
  };

  return (
    <div className="h-64 flex flex-col shrink-0 border-b border-zinc-800">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2 text-xs font-semibold text-zinc-200 tracking-wide bg-zinc-900 top-0 sticky z-10 shadow-sm">
        <Terminal size={16} className="text-zinc-500" />
        Watchdog Logs
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] flex flex-col-reverse bg-zinc-950/30">
        <AnimatePresence>
          {watchdogLogs.length === 0 ? (
            <div className="text-center text-zinc-600 py-8 flex flex-col items-center gap-2">
              <Terminal size={24} className="opacity-20" />
              <span>Monitoring system events...</span>
            </div>
          ) : (
            watchdogLogs.map((log) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-3 py-2 px-3 hover:bg-zinc-800/80 rounded-lg transition-colors group mb-1 border border-transparent hover:border-zinc-700/50"
              >
                <div className="text-zinc-600 shrink-0 select-none font-medium">
                  [{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]
                </div>
                <div className="shrink-0 mt-0.5">
                  {getIcon(log.type)}
                </div>
                <div className="text-zinc-300 break-words leading-relaxed">
                  <span className="font-semibold text-zinc-500 mr-2">SYS:</span>
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
