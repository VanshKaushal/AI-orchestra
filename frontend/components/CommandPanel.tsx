import { Terminal, Rocket, CheckSquare } from "lucide-react";
import { runCommand } from "../services/api";

export default function CommandPanel() {
  const handleCommand = async (command: string) => {
    try {
      await runCommand(command).catch(() => {});
    } catch (err) {
      console.error(`Failed to run ${command}`, err);
    }
  };

  return (
    <div className="p-4 bg-zinc-900 shrink-0">
      <div className="flex justify-around items-center gap-3">
        <button 
          onClick={() => handleCommand("test")}
          className="flex-1 flex flex-col items-center justify-center py-3 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 text-zinc-300 transition-all shadow-sm hover:shadow active:scale-95"
        >
          <Terminal size={18} className="mb-2 text-blue-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Run Test</span>
        </button>
        <button 
          onClick={() => handleCommand("deploy")}
          className="flex-1 flex flex-col items-center justify-center py-3 rounded-xl bg-blue-600 border border-blue-500 hover:bg-blue-500 text-white transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Rocket size={18} className="mb-2 text-white" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Deploy</span>
        </button>
        <button 
          onClick={() => handleCommand("lint")}
          className="flex-1 flex flex-col items-center justify-center py-3 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 text-zinc-300 transition-all shadow-sm hover:shadow active:scale-95"
        >
          <CheckSquare size={18} className="mb-2 text-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Lint</span>
        </button>
      </div>
    </div>
  );
}
