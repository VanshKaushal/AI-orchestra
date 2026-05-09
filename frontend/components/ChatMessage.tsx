"use client";

import { Message } from "../types";
import { Sparkles, User, Cpu, Zap } from "lucide-react";
import { useStore } from "../store/useStore";
import { motion } from "framer-motion";

export default function ChatMessage({ message }: { message: Message }) {
  const { currentModels, activeSessionId } = useStore();
  const currentProvider = message.model || (activeSessionId ? currentModels[activeSessionId] : "Orchestra");
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex items-center justify-center my-8">
        <div className="text-zinc-500 text-[9px] font-black tracking-[0.2em] uppercase px-6 py-1.5 border border-white/5 rounded-full flex gap-3 items-center bg-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 animate-pulse"></div>
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[95%] md:max-w-3xl flex flex-col gap-4 ${isUser ? "items-end" : "items-start"}`}>
        {/* Metadata Header */}
        <div className={`flex items-center gap-3 px-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${isUser ? "bg-white/5 border-white/10" : "bg-cyan-500/10 border-cyan-500/20"}`}>
            {isUser ? <User size={12} className="text-zinc-500" /> : <Cpu size={12} className="text-cyan-500" />}
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
            {isUser ? "Operator" : `Neural Node: ${currentProvider}`}
          </span>
          {!isUser && <div className="w-1 h-1 rounded-full bg-emerald-500 neural-pulse"></div>}
        </div>

        {/* Message Content */}
        <div 
          className={`px-6 py-3 rounded-[2rem] border transition-all duration-500 ${
            isUser 
              ? "bg-zinc-800/40 border-white/5 text-zinc-100 rounded-tr-none" 
              : "bg-white/5 border-white/5 text-zinc-200 rounded-tl-none hover:bg-white/[0.07]"
          } leading-relaxed text-sm`}
        >
          {message.content}
        </div>

        {/* Timestamp / Context Footnote */}
        <div className={`flex items-center gap-4 px-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
           <span className="text-[8px] font-mono text-zinc-700">
             {new Date(message.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
           </span>
           {!isUser && (
             <div className="flex gap-2">
               <span className="text-[8px] font-black text-zinc-800 uppercase tracking-tighter">Sync: Solid</span>
               <span className="text-[8px] font-black text-zinc-800 uppercase tracking-tighter">Latency: 42ms</span>
             </div>
           )}
        </div>
      </div>
    </motion.div>
  );
}
