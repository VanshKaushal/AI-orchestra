"use client";

import { X } from "lucide-react";
import { useStore } from "../store/useStore";
import { useState, useEffect } from "react";
import { testBackend } from "../services/api";
import { useAnalytics } from "../store/useAnalytics";


interface SidePanelProps {
  activePanel: string | null;
  setActivePanel: (panel: string | null) => void;
}

export default function SidePanel({ activePanel, setActivePanel }: SidePanelProps) {
  const { currentModels, activeSessionId, sessions, user } = useStore();
  const { providers, totalMessages, totalErrors } = useAnalytics();

  const [status, setStatus] = useState<{ backend: string; message?: string }>({ backend: "Checking..." });
  const [wsStatus, setWsStatus] = useState<string>("Connecting...");
  const currentModel = activeSessionId ? currentModels[activeSessionId] || "OpenAI" : "OpenAI";

  useEffect(() => {
    let mounted = true;

    async function checkStatus() {
      const res = await testBackend();

      if (!mounted) return;

      if (!res.success) {
        setStatus({
          backend: "DOWN",
          message: res.error,
        });
      } else {
        setStatus({
          backend: "UP",
        });
      }
    }

    checkStatus();
    const interval = setInterval(checkStatus, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);


  useEffect(() => {
    // Simple WebSocket status check
    if (activeSessionId) {
      setWsStatus("Connected");
    } else {
      setWsStatus("No session");
    }
  }, [activeSessionId]);


  if (!activePanel) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={() => setActivePanel(null)}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-80 bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 shrink-0">
          <h2 className="text-lg font-semibold text-zinc-100 capitalize">
            {activePanel}
          </h2>
          <button
            onClick={() => setActivePanel(null)}
            className="text-zinc-400 hover:text-zinc-100 transition-colors p-1 hover:bg-zinc-800/80 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activePanel === "settings" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Theme
                </label>
                <select className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Dark</option>
                  <option>Light</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Default Model
                </label>
                <select className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>OpenAI</option>
                  <option>Gemini</option>
                  <option>Anthropic</option>
                  <option>Grok</option>
                  <option>Ollama</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Message History Limit
                </label>
                <input
                  type="number"
                  defaultValue="100"
                  min="10"
                  max="1000"
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {activePanel === "profile" && (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-zinc-400">Name</p>
                <p className="text-zinc-100 text-lg font-semibold mt-2">{user.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-400">Email</p>
                <p className="text-zinc-100 text-lg font-semibold mt-2">{user.email}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-400">Active Sessions</p>
                <p className="text-zinc-100 text-lg font-semibold mt-2">{sessions.length}</p>
              </div>

              <button className="w-full mt-8 bg-red-900/30 hover:bg-red-900/50 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg transition-colors border border-red-900/50 font-medium">
                Logout
              </button>
            </div>
          )}

          {activePanel === "status" && (
            <div className="space-y-6">
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-400">Backend</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      status.backend === "UP"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : status.backend === "DOWN"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-zinc-500/20 text-zinc-400"
                    }`}>
                      {status.backend}
                    </span>
                  </div>
                  {status.backend === "DOWN" && status.message && (
                    <div className="text-[10px] text-red-400/80 font-mono bg-red-500/5 p-2 rounded border border-red-500/10 mt-1">
                      {status.message}
                    </div>
                  )}
                </div>
              </div>


              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-400">WebSocket</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    wsStatus === "Connected"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {wsStatus}
                  </span>
                </div>
              </div>

              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-400">Active Model</span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">
                    {currentModel}
                  </span>
                </div>
              </div>

              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-400">Sessions</span>
                  <span className="text-zinc-100 font-semibold">{sessions.length}</span>
                </div>
              </div>

              {/* Analytics Section */}
              <div className="mt-8 border-t border-zinc-800 pt-6">
                <h3 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Usage Analytics
                </h3>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Requests</p>
                    <p className="text-xl font-semibold text-zinc-100">{totalMessages}</p>
                  </div>
                  <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Errors</p>
                    <p className="text-xl font-semibold text-red-400">{totalErrors}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {Object.entries(providers).map(([name, data]) => (
                    <div key={name} className="provider-card bg-[#111] border border-zinc-800 p-2 rounded-lg hover:border-zinc-700 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium text-sm text-zinc-200">{name}</p>
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-mono">
                          {data.requests} reqs
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        Tokens: <span className="text-zinc-300">{data.tokens.toLocaleString()}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}
