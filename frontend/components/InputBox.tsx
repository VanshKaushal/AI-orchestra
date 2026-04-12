"use client";

import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { ArrowUp, Paperclip } from "lucide-react";
import { useChat } from "../hooks/useChat";
import { useStore } from "../store/useStore";

export default function InputBox() {
  const [content, setContent] = useState("");
  const { sendMessage } = useChat();
  const { activeSessionId } = useStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!content.trim() || !activeSessionId) return;
    sendMessage(content);
    setContent("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [content]);

  if (!activeSessionId) return null;

  return (
    <div className="sticky bottom-0 bg-[#0a0a0a] px-6 py-4 pb-8 shrink-0">
      <div className="max-w-3xl mx-auto flex flex-col items-center">
        <div className="w-full relative flex items-end gap-2 bg-zinc-800 focus-within:bg-zinc-800 rounded-3xl px-4 py-2 transition-all">
          <button 
            className="shrink-0 p-2 text-zinc-400 hover:text-zinc-100 rounded-full transition-colors mb-0.5"
            title="Attach file (UI only)"
          >
            <Paperclip size={20} />
          </button>
          
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Orchestra..."
            className="w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none text-zinc-100 text-[15px] max-h-[200px] py-2.5 pb-3 px-1 leading-relaxed"
          />
          
          <button 
            onClick={handleSend}
            disabled={!content.trim()}
            className="shrink-0 p-2 bg-white text-zinc-900 rounded-full transition-all disabled:opacity-30 disabled:bg-zinc-600 disabled:text-zinc-400 mb-1"
          >
            <ArrowUp size={18} className="stroke-[2.5]" />
          </button>
        </div>
        <div className="text-[11px] text-zinc-500 mt-3 text-center">
          Orchestra OS can make mistakes. Consider verifying important information.
        </div>
      </div>
    </div>
  );
}
