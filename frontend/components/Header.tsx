import { useStore } from "../store/useStore";
import { BrainCircuit, PanelRightClose, PanelRightOpen, HeartPulse, Settings, User } from "lucide-react";
import ModelSwitcher from "./ModelSwitcher";
import Link from "next/link";

interface HeaderProps {
  rightPanelOpen?: boolean;
  setRightPanelOpen?: (val: boolean) => void;
  activePanel?: string | null;
  setActivePanel?: (panel: string | null) => void;
}

export default function Header({ rightPanelOpen, setRightPanelOpen, activePanel, setActivePanel }: HeaderProps) {
  const { activeSessionId } = useStore();

  return (
    <header className="h-[60px] bg-[#0a0a0a] flex items-center justify-between px-6 shrink-0 z-10 w-full relative border-b border-zinc-800/50">
      <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-100">
          <BrainCircuit size={18} />
        </div>
        <h1 className="text-zinc-100 font-semibold text-[15px] tracking-wide">
          Orchestra <span className="text-zinc-500 font-normal">OS</span>
        </h1>
      </Link>

      <div className="flex items-center gap-3 text-sm">
        {activeSessionId && <ModelSwitcher />}

        <button 
          onClick={() => setActivePanel?.("status")}
          className="flex items-center gap-2 bg-zinc-900 text-zinc-400 hover:text-emerald-400 px-3 py-1.5 text-xs font-medium rounded-md transition-all border border-zinc-800 hover:border-emerald-500/30"
          title="Check Backend Health"
        >
          <HeartPulse size={14} />
          <span>Status</span>
        </button>

        <button 
          onClick={() => setActivePanel?.("settings")}
          className="text-zinc-400 hover:text-zinc-100 transition-colors p-2 hover:bg-zinc-800/80 rounded-lg active:scale-95"
          title="Settings"
        >
          <Settings size={18} />
        </button>

        <button 
          onClick={() => setActivePanel?.("profile")}
          className="text-zinc-400 hover:text-zinc-100 transition-colors p-2 hover:bg-zinc-800/80 rounded-lg active:scale-95"
          title="Profile"
        >
          <User size={18} />
        </button>

        {setRightPanelOpen && (
          <button 
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className="text-zinc-400 hover:text-zinc-100 transition-colors p-2 hover:bg-zinc-800/80 rounded-lg active:scale-95"
            title="Toggle Right Panel"
          >
            {rightPanelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
          </button>
        )}
      </div>
    </header>
  );
}
