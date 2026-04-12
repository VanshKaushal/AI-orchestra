import { useStore } from "../store/useStore";
import { X } from "lucide-react";

export default function SessionTabs() {
  const { sessions, activeSessionId, setActiveSessionId, removeSession } = useStore();

  if (sessions.length === 0) return null;

  return (
    <div className="flex items-center gap-1 overflow-x-auto bg-zinc-950 px-2 pt-2 border-b border-zinc-800 scrollbar-hide shrink-0 z-10">
      {sessions.map((session) => (
        <div
          key={session.id}
          className={`group flex items-center gap-2 px-4 py-2.5 text-sm rounded-t-xl transition-all border border-b-0 cursor-pointer min-w-32 max-w-48 relative
            ${
              activeSessionId === session.id
                ? "bg-zinc-900 border-zinc-800 text-white z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]"
                : "bg-transparent border-transparent text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300"
            }
          `}
          onClick={() => setActiveSessionId(session.id)}
        >
          {activeSessionId === session.id && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-xl" />
          )}
          <span className="truncate flex-1 font-medium select-none">{session.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeSession(session.id);
            }}
            className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-md hover:bg-zinc-800"
            title="Close session"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
