"use client";

import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { useStore } from "../store/useStore";
import { sendMessage, sendSessionMessage } from "../services/api";
import { Send, Zap, Cpu, Sparkles, Command, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InputBox() {
  const [input, setInput] = useState("");
  const { activeSessionId, sessions, currentModels, switchModel, addMessage, setSessionStatus } = useStore();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const models = ["OpenAI", "Claude", "Gemini", "Gemma", "Ollama"];
  const currentModel = activeSessionId ? currentModels[activeSessionId] || "OpenAI" : "OpenAI";

  const handleSend = async () => {
    if (!input.trim() || !activeSessionId) return;

    const userMessage: any = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    addMessage(activeSessionId, userMessage);
    setInput("");
    setSessionStatus(activeSessionId, "running");

    try {
      const res = await sendSessionMessage(activeSessionId, input);
      
      if (res.success && res.data) {
        const assistantMsg: any = {
          id: res.data.message_id || `assistant-${Date.now()}`,
          role: "assistant",
          content: res.data.response || res.data.content, 
          model: res.data.provider || currentModel,
          tokens_used: res.data.tokens_used || 0,
          cost: res.data.cost || 0,
          timestamp: Date.now(),
        };
        addMessage(activeSessionId, assistantMsg);
      } else {
        // Show error as a message
        const errorMsg: any = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Error: ${res.error || "Failed to get response from AI Orchestra"}`,
          model: "System",
          timestamp: Date.now(),
        };
        addMessage(activeSessionId, errorMsg);
      }
    } catch (error: any) {
      console.error("Failed to send message:", error);
      const errorMsg: any = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `Connection Error: ${error.message || "Could not reach the backend server"}`,
        model: "System",
        timestamp: Date.now(),
      };
      addMessage(activeSessionId, errorMsg);
    } finally {
      setSessionStatus(activeSessionId, "idle");
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Model Selection - Premium Segmented Control */}
      <div className="flex items-center justify-center">
        <div className="flex items-center p-1.5 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl">
          {models.map((model) => (
            <button
              key={model}
              onClick={() => activeSessionId && switchModel(activeSessionId, model)}
              className={`relative px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 ${
                currentModel === model 
                  ? 'text-cyan-400' 
                  : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {currentModel === model && (
                <motion.div 
                  layoutId="activeModelPill"
                  className="absolute inset-0 bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.03)] rounded-xl"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {model === "Gemma" && <Zap size={10} className={currentModel === model ? "text-cyan-400" : "text-zinc-700"} />}
                {model}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative group">
        {/* Glow effect on hover/focus */}
        <div className={`absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-[2.2rem] blur-xl opacity-0 transition duration-1000 group-hover:opacity-100 ${isFocused ? 'opacity-100' : ''}`} />
        
        <div className={`relative flex items-center gap-4 bg-[#0a0a0b]/80 backdrop-blur-2xl border ${isFocused ? 'border-cyan-500/30' : 'border-white/10'} rounded-[1.5rem] px-7 py-3.5 transition-all duration-500`}>
          <div className="shrink-0">
            <Cpu size={20} className={isFocused ? "text-cyan-500" : "text-zinc-600"} />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Instruct the Cognitive Orchestra..."
            className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-base text-zinc-100 placeholder:text-zinc-800 font-medium tracking-wide"
          />

          <div className="flex items-center gap-4">
            <button
              onClick={handleSend}
              disabled={!input.trim() || !activeSessionId}
              className={`group/btn flex items-center justify-center w-12 h-12 rounded-full transition-all duration-500 ${
                input.trim() 
                  ? 'bg-zinc-100 text-zinc-950 hover:bg-white hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                  : 'bg-zinc-900 text-zinc-700 opacity-50'
              }`}
            >
              <ArrowRight size={22} className="transition-transform group-hover/btn:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center">
        <span className="text-[9px] font-black text-zinc-800 uppercase tracking-[0.4em]">Neural Integration: Active</span>
      </div>
    </div>
  );
}
