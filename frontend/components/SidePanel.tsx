"use client";

import { useStore } from "../store/useStore";
import StatePanel from "./StatePanel";
import WatchdogFeed from "./WatchdogFeed";
import CommandPanel from "./CommandPanel";
import { motion, AnimatePresence } from "framer-motion";
import { X, Activity, Zap } from "lucide-react";

interface SidePanelProps {
  activePanel: string | null;
  setActivePanel: (panel: string | null) => void;
  selectedNode?: any;
}

export default function SidePanel({ activePanel, setActivePanel, selectedNode }: SidePanelProps) {
  const isOpen = activePanel !== null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 w-full md:w-96 h-full z-[100] glass-panel border-l border-white/5 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#020203]/90">
            <div className="flex items-center gap-3">
              <Zap size={16} className="text-cyan-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-white">
                  {selectedNode ? "Node Analysis" : "System Status"}
                </span>
                <span className="text-[8px] font-bold text-zinc-500 uppercase">Neural Stream v5.0</span>
              </div>
            </div>
            <button 
              onClick={() => setActivePanel(null)}
              className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto os-scrollbar">
              <StatePanel selectedNode={selectedNode} />
            </div>
            
            <div className="shrink-0 flex flex-col border-t border-white/5 bg-black/20">
              <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
                <Activity size={14} className="text-zinc-600" />
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Global Watchdog</span>
              </div>
              <WatchdogFeed />
              <CommandPanel />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
