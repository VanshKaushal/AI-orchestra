"use client";

import { useStore } from "../store/useStore";
import { Brain, Settings, User, Activity, Search, Command } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  rightPanelOpen?: boolean;
  setRightPanelOpen?: (val: boolean) => void;
  activePanel?: string | null;
  setActivePanel?: (panel: string | null) => void;
}

export default function Header({ rightPanelOpen, setRightPanelOpen, activePanel, setActivePanel }: HeaderProps) {
  return (
    <header className="p-6 flex items-center justify-between pointer-events-auto w-full">
      <div className="flex items-center gap-4">
        <div className="glass-panel px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
          <Brain size={16} className="text-cyan-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Orchestra OS</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="glass-panel px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3 focus-within:border-white/20 transition-colors">
          <Search size={14} className="text-zinc-500" />
          <input 
            placeholder="Search semantic memory..." 
            className="bg-transparent border-none focus:ring-0 outline-none text-xs w-48 text-zinc-300 placeholder:text-zinc-600"
          />
          <kbd className="text-[8px] bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-500">⌘K</kbd>
        </div>
        
        <button 
          onClick={() => setActivePanel?.("state")}
          className="glass-panel p-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white transition-all active:scale-95"
        >
          <Activity size={18} />
        </button>
      </div>
    </header>
  );
}
