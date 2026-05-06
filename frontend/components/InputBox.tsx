"use client";

import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { ArrowUp, Paperclip } from "lucide-react";
import { useChat } from "../hooks/useChat";
import { useStore } from "../store/useStore";
import { uploadFile } from "../services/api";

export default function InputBox() {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { sendMessage } = useChat();
  const { activeSessionId } = useStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const sendingRef = useRef(false);

  const handleSend = async () => {
    if (!(content || "").trim() || !activeSessionId || isSending || sendingRef.current) return;
    
    setIsSending(true);
    sendingRef.current = true;
    
    try {
      await sendMessage(content);
      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } finally {
      setIsSending(false);
      sendingRef.current = false;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await uploadFile(formData);
      
      if (response.success && response.data) {
        console.log("File uploaded successfully:", response.data);
        // Optionally add a system message to the chat
      } else {
        console.error("Upload failed:", response.error);
        alert(`Upload failed: ${response.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("File upload error:", error);
    }
    
    // Reset file input
    if (fileRef.current) {
      fileRef.current.value = "";
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
          <input
            type="file"
            ref={fileRef}
            className="hidden"
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileRef.current?.click()}
            className="shrink-0 p-2 text-zinc-400 hover:text-zinc-100 rounded-full transition-colors mb-0.5"
            title="Attach file"
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
            disabled={!(content || "").trim() || isSending}
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
