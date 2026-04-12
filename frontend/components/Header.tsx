import { useStore } from "../store/useStore";
import { BrainCircuit, PanelRightClose, PanelRightOpen } from "lucide-react";
import ModelSwitcher from "./ModelSwitcher";

interface HeaderProps {
  rightPanelOpen?: boolean;
  setRightPanelOpen?: (val: boolean) => void;
}

export default function Header({ rightPanelOpen, setRightPanelOpen }: HeaderProps) {
  const { activeSessionId } = useStore();

  return (
    <header className="h-[60px] bg-[#0a0a0a] flex items-center justify-between px-6 shrink-0 z-10 w-full relative">
      <div className="flex items-center gap-3">
        {/* Placeholder if we wanted global menu, we keep simple brand for now */}
        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-100">
          <BrainCircuit size={18} />
        </div>
        <h1 className="text-zinc-100 font-semibold text-[15px] tracking-wide">
          Orchestra <span className="text-zinc-500 font-normal">OS</span>
        </h1>
      </div>

      <div className="flex items-center gap-3 text-sm">
        {activeSessionId && <ModelSwitcher />}

        <button onClick={async () => {
          try {
            const res = await fetch("http://127.0.0.1:8000/");
            console.log("TEST:", await res.json());
          } catch(e) {
            console.error("Test Backend Failed", e);
          }
        }} className="bg-red-500/20 text-red-500 px-2 py-1 text-xs font-bold rounded">
          Test Backend
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
