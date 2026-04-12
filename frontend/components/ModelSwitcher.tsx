"use client";

import { useStore } from "../store/useStore";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { switchModel } from "../services/api";

const MODELS = ["OpenAI", "Ollama", "Gemini", "Grok", "Anthropic"];

export default function ModelSwitcher() {
  const { activeSessionId, currentModels, switchModel: switchModelStore } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentModel = activeSessionId ? currentModels[activeSessionId] || "OpenAI" : "OpenAI";

  const handleSwitch = async (model: string) => {
    if (!activeSessionId) return;
    try {
      switchModelStore(activeSessionId, model); // optimistic UI
      setIsOpen(false);
      await switchModel(activeSessionId, model).catch(() => {});
    } catch (err) {
      console.error("Failed to switch model", err);
    }
  };

  if (!activeSessionId) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-zinc-300 hover:text-zinc-100 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-zinc-800/80 font-medium"
      >
        <span>{currentModel}</span>
        <ChevronDown size={14} className="text-zinc-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-48 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-20">
          <div className="py-1">
            {MODELS.map((model) => (
              <button
                key={model}
                onClick={() => handleSwitch(model)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  model === currentModel 
                    ? "text-blue-400 bg-blue-500/10 font-semibold" 
                    : "text-zinc-300 hover:bg-zinc-700/50"
                }`}
              >
                {model}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
