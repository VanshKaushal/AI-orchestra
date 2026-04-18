import { useStore } from "../store/useStore";
import { BrainCircuit, PanelRightClose, PanelRightOpen, HeartPulse } from "lucide-react";
import ModelSwitcher from "./ModelSwitcher";
import { testBackend } from "../services/api";

interface HeaderProps {
  rightPanelOpen?: boolean;
  setRightPanelOpen?: (val: boolean) => void;
}

export default function Header({ rightPanelOpen, setRightPanelOpen }: HeaderProps) {
  const { activeSessionId } = useStore();

  const handleHealthCheck = async () => {
    try {
      const data = await testBackend();
      console.log("Health Check:", data);
    } catch (e) {
      console.error("Health Check Failed:", e);
    }
  };

  return (
    <header className="h-[60px] bg-[#0a0a0a] flex items-center justify-between px-6 shrink-0 z-10 w-full relative border-b border-zinc-800/50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-100">
          <BrainCircuit size={18} />
        </div>
        <h1 className="text-zinc-100 font-semibold text-[15px] tracking-wide">
          Orchestra <span className="text-zinc-500 font-normal">OS</span>
        </h1>
      </div>

      <div className="flex items-center gap-3 text-sm">
        {activeSessionId && <ModelSwitcher />}

        <button 
          onClick={handleHealthCheck}
          className="flex items-center gap-2 bg-zinc-900 text-zinc-400 hover:text-emerald-400 px-3 py-1.5 text-xs font-medium rounded-md transition-all border border-zinc-800 hover:border-emerald-500/30"
          title="Check Backend Health"
        >
          <HeartPulse size={14} />
          <span>Status</span>
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
