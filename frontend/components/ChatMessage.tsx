import { Message } from "../types";
import { Sparkles } from "lucide-react";
import { useStore } from "../store/useStore";

export default function ChatMessage({ message }: { message: Message }) {
  const { currentModels, activeSessionId } = useStore();
  const currentProvider = activeSessionId ? currentModels[activeSessionId] : "Orchestra";
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex items-center justify-center my-6">
        <div className="text-zinc-400 text-[11px] font-medium tracking-wide uppercase px-4 py-1 border border-zinc-800 rounded-full flex gap-2 items-center bg-zinc-900/50">
          <Sparkles size={12} className="text-zinc-500" />
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full group ${isUser ? "justify-end" : "justify-start"}`}>
      {isUser ? (
        <div className="max-w-[80%] md:max-w-xl bg-zinc-800 text-zinc-100 px-5 py-3 rounded-2xl rounded-br-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      ) : (
        <div className="flex gap-4 w-full">
          <div className="shrink-0 w-8 h-8 rounded-full border border-zinc-700 bg-[#0a0a0a] flex items-center justify-center mt-0.5">
            <Sparkles size={14} className="text-zinc-100" />
          </div>

          <div className="flex flex-col gap-1 w-full min-w-0">

            <div className="text-zinc-200 leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
