"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import { Share2, RefreshCw, Sliders, Info, X, Layers, MousePointer2, Anchor } from 'lucide-react';
import { useStore } from '../../store/useStore';
import dynamic from 'next/dynamic';
import { processGraph } from '../../services/graphProcessor';
import { sanitizeGraph } from '../../services/graphSanitizer';
import { GraphNode, GraphEdge } from '../../types/graph';

const GraphCanvas3D = dynamic(
  () => import('../../components/GraphCanvas3D'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-neutral-400">
        Loading Cognitive Graph...
      </div>
    )
  }
);
import { getClusters, Cluster } from '../../services/clusterEngine';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const typeColors: Record<string, string> = {
  goal: '#ef4444',    // red
  task: '#eab308',    // yellow
  response: '#3b82f6', // blue
  model: '#71717a',     // gray
  insight: '#f97316',  // orange
  cluster: '#a855f7',  // purple (macro)
};

export default function GraphPage() {
  const { activeSessionId, sessions } = useStore();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [importanceThreshold, setImportanceThreshold] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<"3d" | "2d">("3d");
  const [mode, setMode] = useState<"normal" | "ai">("normal");
  const [threshold, setThreshold] = useState(0.7);
  const [kClusters, setKClusters] = useState(5);

  const clusterColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1'
  ];

  const fetchGraphData = useCallback(async () => {
    if (!activeSessionId) return;
    setLoading(true);
    try {
      // Step 7: Session-based Isolation
      const endpoint = mode === "ai" 
        ? `${BACKEND_URL}/graph/ai/${activeSessionId}?threshold=${threshold}&k=${kClusters}`
        : `${BACKEND_URL}/graph?session_id=${activeSessionId}`;
        
      const response = await fetch(endpoint);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || data.error) throw new Error(data?.error || "Failed to fetch graph data");

      // Step 1: Data Sanitization & Step 6: Deduplication
      const processedGraph = processGraph(data);
      
      // Step 2: Clustering
      const graphClusters = getClusters(processedGraph.nodes);
      setClusters(graphClusters);

      setNodes(processedGraph.nodes);
      setEdges(processedGraph.edges);
      
      console.log("SANITIZED GRAPH:", { nodes: processedGraph.nodes, edges: processedGraph.edges });
    } catch (error) {
      console.error("Failed to fetch graph data:", error);
    } finally {
      setLoading(false);
    }
  }, [activeSessionId, mode, threshold, kClusters]);

  const mergeSessions = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        sessions.map(async (s) => {
          try {
            const r = await fetch(`${BACKEND_URL}/graph?session_id=${s.id}`);
            if (!r.ok) return { nodes: [], edges: [] };
            return await r.json();
          } catch (e) {
            console.error(`Failed to fetch graph for session ${s.id}:`, e);
            return { nodes: [], edges: [] };
          }
        })
      );
      
      const combinedNodes = results.flatMap(r => r.nodes || []);
      const combinedEdges = results.flatMap(r => r.edges || []);
      
      const processed = processGraph({ nodes: combinedNodes, edges: combinedEdges });
      const graphClusters = getClusters(processed.nodes);
      
      setNodes(processed.nodes);
      setEdges(processed.edges);
      setClusters(graphClusters);
    } catch (error) {
      console.error("Merge failed:", error);
    } finally {
      setLoading(false);
    }
  }, [sessions]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  const onNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
  }, []);

  const filteredNodes = (nodes || [])
    .filter(Boolean)
    .filter(n => (n.importance ?? 0) >= importanceThreshold);
    
  // Also filter edges to ensure they only connect existing nodes
  const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = (edges || [])
    .filter(e => e && e.source && e.target)
    .filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));

  return (
    <div className="h-screen w-full flex flex-col bg-black text-white overflow-hidden font-sans">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR */}
        <div className="w-64 border-r border-neutral-800 shrink-0 hidden lg:block">
          <Sidebar />
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#050505]">
          
          {/* TOOLBAR (Fixed Top) */}
          <div className="h-16 border-b border-neutral-800 flex items-center px-6 gap-6 shrink-0 bg-[#0a0a0a] z-10 shadow-sm">
            <div className="flex items-center gap-2 text-zinc-400">
              <Share2 size={18} className="text-blue-500" />
              <span className="text-sm font-semibold tracking-tight text-zinc-200">Cognitive Engine</span>
            </div>

            <div className="h-6 w-px bg-neutral-800 mx-2"></div>

            <button 
              onClick={fetchGraphData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all text-xs font-bold disabled:opacity-50 shadow-lg shadow-blue-900/10 active:scale-95"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              GENERATE
            </button>

            <button 
              onClick={mergeSessions}
              disabled={loading || sessions.length < 2}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white rounded-lg transition-all text-xs font-bold disabled:opacity-50 active:scale-95"
            >
              <Layers size={14} />
              MERGE SESSIONS
            </button>
            
            <div className="flex items-center gap-4 ml-auto">
              {/* Mode Toggle */}
              <div className="flex bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                <button 
                  onClick={() => setMode("normal")}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${mode === "normal" ? "bg-neutral-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  NORMAL
                </button>
                <button 
                  onClick={() => setMode("ai")}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${mode === "ai" ? "bg-blue-600 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  AI ENRICHED
                </button>
              </div>

              {mode === "ai" && (
                <div className="flex items-center gap-3 bg-neutral-900/50 px-3 py-1.5 rounded-full border border-neutral-800">
                  <span className="text-[10px] text-zinc-500 font-black">SIMILARITY</span>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="0.95" 
                    step="0.05"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-24 accent-blue-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[10px] text-zinc-500 font-mono w-6 text-center">
                    {threshold.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 bg-neutral-900/50 px-3 py-1.5 rounded-full border border-neutral-800">
                <Sliders size={14} className="text-zinc-500" />
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  step="0.5"
                  value={importanceThreshold}
                  onChange={(e) => setImportanceThreshold(Number(e.target.value))}
                  className="w-32 accent-blue-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-[10px] text-zinc-500 font-mono w-6 text-center">
                  {importanceThreshold.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* GRAPH CANVAS AREA */}
          <div className="flex-1 relative z-0">
            {!loading && nodes.length === 0 ? (
              <div className="flex items-center justify-center h-full text-zinc-500 bg-[#050505]">
                <div className="text-center">
                  <Share2 size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-medium">No graph data available for this session.</p>
                </div>
              </div>
            ) : (
              <GraphCanvas3D 
                nodes={filteredNodes} 
                edges={filteredEdges}
                clusters={clusters}
                zoom={zoom}
                onNodeClick={(node) => setSelectedNode(node)}
              />
            )}

            {/* LEGEND (Fixed Position Overlay) */}
            <div className="absolute bottom-6 left-6 z-10 bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black mb-3 pb-2 border-b border-white/5">Engine Layers</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                {Object.entries(typeColors).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}></div>
                    <span className="text-[10px] text-zinc-400 font-medium capitalize tracking-wide">{type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 9: Interaction Controls */}
            <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
              <button className="p-3 bg-zinc-900 border border-white/10 rounded-xl hover:bg-zinc-800 text-zinc-400" title="Focus Mode">
                <MousePointer2 size={18} />
              </button>
              <button className="p-3 bg-zinc-900 border border-white/10 rounded-xl hover:bg-zinc-800 text-zinc-400" title="Pin Node">
                <Anchor size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR (Details Panel) */}
        {selectedNode ? (
          <div className="w-80 border-l border-neutral-800 shrink-0 bg-[#0a0a0a] flex flex-col h-full animate-in slide-in-from-right duration-300 shadow-2xl z-20">
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/20">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-sm shadow-lg" style={{ backgroundColor: typeColors[selectedNode.type] || '#555', boxShadow: `0 0 12px ${typeColors[selectedNode.type]}44` }}></div>
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-100">{selectedNode.type} ID: {selectedNode.id.split('_').pop()}</h3>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="p-1.5 hover:bg-neutral-800 rounded-full text-zinc-500 transition-all active:scale-90"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
              <section>
                <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 block mb-3">Label</label>
                <div className="text-sm leading-relaxed text-zinc-200 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800/50 italic font-medium">
                  "{selectedNode.label}"
                </div>
              </section>

              <div className="grid grid-cols-2 gap-6">
                <section>
                  <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 block mb-2">Importance</label>
                  <div className="text-xl text-blue-400 font-black tracking-tighter tabular-nums drop-shadow-sm">
                    {selectedNode.importance.toFixed(2)}
                  </div>
                </section>
                <section>
                  <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 block mb-2">Logged At</label>
                  <div className="text-xs text-zinc-400 font-mono font-bold">
                    {new Date(selectedNode.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </section>
              </div>

              <section>
                <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600 block mb-3">Raw Metadata</label>
                <div className="relative group">
                   <pre className="text-[10px] bg-black p-5 rounded-2xl border border-neutral-800 text-emerald-500/80 overflow-x-auto font-mono leading-relaxed scrollbar-hide shadow-inner">
                    {JSON.stringify(selectedNode.metadata, null, 2)}
                  </pre>
                  <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none group-hover:border-white/10 transition-colors"></div>
                </div>
              </section>
            </div>

            <div className="p-6 bg-neutral-900/30 border-t border-neutral-800">
              <div className="text-[10px] leading-relaxed text-zinc-500 flex gap-3 items-start">
                <Info size={14} className="shrink-0 text-blue-500" />
                <p>Nodes are automatically generated based on real-time AI reasoning events captured by the orchestra engine.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-80 border-l border-neutral-800 shrink-0 bg-[#0a0a0a] flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(circle_at_center,rgba(24,24,27,1)_0%,rgba(9,9,11,1)_100%)]">
            <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mb-6 border border-neutral-800 shadow-inner">
              <Share2 size={24} className="text-zinc-700" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">No Node Selected</h3>
            <p className="text-[11px] text-zinc-700 leading-relaxed font-medium">Click on any reasoning node in the canvas to inspect cognitive links and metadata.</p>
          </div>
        )}
      </div>
    </div>
  );
}
