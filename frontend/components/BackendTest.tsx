"use client";

import React, { useState } from "react";
import { testBackend as runBackendTest } from "../services/api";

export default function BackendTest() {
  const [status, setStatus] = useState<string>("idle");
  const [log, setLog] = useState<any>(null);

  const handleTest = async () => {
    setStatus("testing");
    try {
      const data = await runBackendTest();
      setStatus("success");
      setLog(data);
    } catch (err: any) {
      setStatus("failed");
      setLog(err.message || "Unknown error");
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-zinc-800/80 rounded-lg border border-zinc-700 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Connectivity Test</span>
        <button 
          onClick={handleTest}
          disabled={status === "testing"}
          className={`px-3 py-1 rounded text-xs font-bold transition-all ${
            status === "testing" ? "bg-zinc-700 text-zinc-500 cursor-not-allowed" :
            status === "success" ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" :
            status === "failed" ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" :
            "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 font-bold"
          }`}
        >
          {status === "testing" ? "Testing..." : "Test Backend"}
        </button>
      </div>
      {log && (
        <div className={`text-[10px] font-mono p-1.5 rounded bg-black/40 border border-zinc-700/50 ${
          status === "success" ? "text-green-300" : "text-red-300"
        }`}>
          {typeof log === "string" ? log : JSON.stringify(log)}
        </div>
      )}
    </div>
  );
}
