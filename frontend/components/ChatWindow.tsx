"use client";

import { useStore } from "../store/useStore";
import ChatMessage from "./ChatMessage";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageSquarePlus } from "lucide-react";
import { createSession } from "../services/api";

export default function ChatWindow() {
  const { activeSessionId, sessions, messages, addSession } = useStore();
  const sessionMessages = activeSessionId ? messages[activeSessionId] || [] : [];
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessionMessages]);

  const handleNewSession = async () => {
    try {
      const res = await createSession();

      if (!res.success || !res.data) {
        console.error("Backend not reachable or returned error:", res.error);
        // We can show a more user-friendly message or fallback
        const fallbackSession: any = {
          id: `local-${Date.now()}`,
          name: `Session ${sessions.length + 1} (Offline)`,
          status: "idle",
          createdAt: new Date().toISOString(),
        };
        addSession(fallbackSession);
        return;
      }

      const newSession: any = {
        id: res.data.session_id || `s-${Date.now()}`,
        name: res.data.task || `Session ${sessions.length + 1}`,
        status: res.data.status || "idle",
        createdAt: res.data.created_at || new Date().toISOString(),
      };
      addSession(newSession);
    } catch (err) {
      console.error("Failed to create session in ChatWindow:", err);
    }
  };


  if (!activeSessionId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-zinc-100 bg-[#0a0a0a]">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 mb-6 border border-zinc-800">
          <Sparkles size={28} className="text-zinc-400" />
        </div>
        <h2 className="text-2xl font-semibold mb-3">How can I help you today?</h2>
        <p className="text-zinc-500 mb-8 max-w-sm text-center">
          Ask a question, start a task, or let the Orchestra manage multiple LLMs for you.
        </p>
        <button 
          onClick={handleNewSession}
          className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-900 font-medium py-3 px-6 rounded-full transition-all"
        >
          <MessageSquarePlus size={18} />
          Create new chat
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 bg-[#0a0a0a]" ref={scrollRef}>
      <div className="max-w-3xl mx-auto space-y-8 pb-10">
        <AnimatePresence initial={false}>
          {sessionMessages.map((msg, idx) => (
            <motion.div
              key={msg.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChatMessage message={msg} />
            </motion.div>
          ))}
          {/* Loading indicator */}
          {sessions.find(s => s.id === activeSessionId)?.status === "running" && sessionMessages[sessionMessages.length - 1]?.role === "user" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start max-w-3xl mx-auto px-2">
              <div className="flex gap-4 w-full">
                <div className="shrink-0 w-8 h-8 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center mt-0.5">
                  <Sparkles size={14} className="text-zinc-400" />
                </div>
                <div className="flex gap-1.5 items-center mt-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce delay-150"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce delay-300"></span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
