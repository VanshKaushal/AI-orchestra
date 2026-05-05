"use client";

import { useEffect } from "react";
import { useStore } from "../store/useStore";
import { FolderGit2, ShieldAlert, Cpu } from "lucide-react";
import { getState } from "../services/api";
import { useStateExplorer } from "../hooks/useStateExplorer";
import { ListTodo, Activity } from "lucide-react";

export default function StatePanel() {
  const { globalState, sessionStates, activeSessionId, setGlobalState } = useStore();
  const { goal, progress, logs } = useStateExplorer(activeSessionId || "");

  useEffect(() => {
    let mounted = true;
    async function fetchState() {
      const res = await getState();
      if (!mounted) return;
      if (res.success && res.data) {
        setGlobalState(res.data);
      } else {
        console.error("Failed to load initial state:", res.error);
      }
    }
    fetchState();
    return () => { mounted = false; };
  }, [setGlobalState]);



  const activeSessionState = activeSessionId ? sessionStates[activeSessionId] : null;

  return (
    <div className="flex flex-col shrink-0 border-b border-zinc-800 flex-1">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
        <div className="flex items-center gap-2 text-zinc-100 font-semibold tracking-wide text-sm">
          <FolderGit2 size={16} className="text-blue-500" />
          State Explorer
        </div>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            <ShieldAlert size={14} /> Global State
          </div>
          <div className="bg-zinc-800 rounded-2xl p-4 shadow-sm border border-zinc-700/50 space-y-4">
            <div>
              <div className="text-[10px] text-zinc-500 font-bold tracking-wider mb-1">CURRENT GOAL</div>
              <div className="text-sm text-zinc-300 bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800">{goal || "Not specified"}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 font-bold tracking-wider mb-1">PROGRESS</div>
              <div className="text-sm text-zinc-300 flex items-center gap-2">
                <div className="flex-1 bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{width: `${progress}%`}}></div>
                </div>
                <span className="font-mono text-xs">{progress}%</span>
              </div>
            </div>
            {globalState?.tasks && Array.isArray(globalState.tasks) && globalState.tasks.length > 0 && (
              <div>
                <div className="text-[10px] text-zinc-500 font-bold tracking-wider mb-1">TASKS</div>
                <ul className="text-xs text-zinc-400 space-y-1.5 pl-4 list-disc marker:text-zinc-600">
                  {globalState.tasks.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>

        {activeSessionState && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                <Cpu size={14} /> Session Context
              </div>
              <div className="bg-zinc-800 rounded-2xl p-4 shadow-sm border border-zinc-700/50">
                <pre className="text-xs text-blue-300/90 overflow-x-auto whitespace-pre-wrap font-mono bg-zinc-950 p-3 rounded-lg border border-zinc-800 max-h-48 overflow-y-auto">
                  {JSON.stringify(activeSessionState.context || {}, null, 2)}
                </pre>
                <div className="mt-4 flex justify-between items-center text-xs text-zinc-400 border-t border-zinc-700/50 pt-3 font-medium">
                  <span>Tokens Used:</span>
                  <span className="font-mono text-zinc-300 bg-zinc-950 px-2 py-0.5 rounded">{activeSessionState.tokensUsed || 0}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                <Activity size={14} className="text-emerald-500" /> System Logs
              </div>
              <div className="bg-zinc-800 rounded-2xl p-4 shadow-sm border border-zinc-700/50">
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {logs.length > 0 ? (
                    logs.map((log, i) => (
                      <div key={i} className="flex gap-2 text-[10px] font-mono leading-relaxed">
                        <span className="text-zinc-600">[{i}]</span>
                        <span className="text-zinc-400">{log}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-zinc-600 text-[10px] italic">No logs available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
