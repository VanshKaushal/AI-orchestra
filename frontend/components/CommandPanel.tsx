"use client";

import { Terminal, Rocket, CheckSquare, Zap, Shield } from "lucide-react";
import { runCommand } from "../services/api";

export default function CommandPanel() {
  const handleCommand = async (cmd: string) => {
    const res = await runCommand(cmd);
    if (res.success && res.data) {
      console.log("Command Success:", res.data);
    } else {
      console.error("Command Failed:", res.error);
    }
  };

  return (
    <div className="p-6 bg-black/40 border-t border-white/5">
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => handleCommand("diagnose")}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all active:scale-95 group"
        >
          <Shield size={14} className="group-hover:text-cyan-500 transition-colors" />
          <span className="text-[10px] font-black uppercase tracking-widest">Diagnose</span>
        </button>

        <button 
          onClick={() => handleCommand("optimize")}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-500 transition-all active:scale-95"
        >
          <Zap size={14} fill="currentColor" />
          <span className="text-[10px] font-black uppercase tracking-widest">Optimize</span>
        </button>
      </div>
    </div>
  );
}
