"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import GraphCanvas from '../../components/GraphCanvas';
import axios from 'axios';
import { Share2, RefreshCw, Sliders, Info, X } from 'lucide-react';

const BACKEND_URL = "http://127.0.0.1:8000";

const typeColors: Record<string, string> = {
  goal: '#ef4444',    // red
  task: '#eab308',    // yellow
  decision: '#a855f7', // purple
  session: '#3b82f6',  // blue
  llm: '#71717a',     // gray
  insight: '#f97316',  // orange
};

export default function GraphPage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [importanceThreshold, setImportanceThreshold] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/graph`);
      const { nodes: rawNodes, edges: rawEdges } = response.data;

      // Map backend nodes to React Flow nodes
      const flowNodes = rawNodes.map((n: any, index: number) => ({
        id: n.id,
        type: 'default', // Using default React Flow node for now
        data: { label: n.label, ...n },
        position: { x: Math.random() * 800, y: Math.random() * 600 }, // Random layout as fallback
        style: {
          background: typeColors[n.type] || '#555',
          color: '#fff',
          borderRadius: '12px',
          padding: '10px',
          fontSize: '12px',
          width: 50 + n.importance * 20,
          height: 30 + n.importance * 10,
          border: 'none',
          boxShadow: `0 0 20px ${typeColors[n.type]}44`,
          transition: 'all 0.3s ease',
        },
      }));

      // Map backend edges to React Flow edges
      const flowEdges = rawEdges.map((e: any) => ({
        id: `${e.source}-${e.target}-${e.type}`,
        source: e.source,
        target: e.target,
        label: e.type,
        animated: true,
        style: { stroke: '#444', strokeWidth: 1.5 },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error("Failed to fetch graph data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: any) => {
    setSelectedNode(node.data);
  }, []);

  const filteredNodes = nodes.filter(n => (n.data.importance || 0) >= importanceThreshold);
  // Also filter edges to ensure they only connect existing nodes
  const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = edges.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));

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
            
            <div className="flex items-center gap-4 ml-auto">
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
            <GraphCanvas 
              nodes={filteredNodes} 
              edges={filteredEdges} 
              onNodeClick={onNodeClick}
            />

            {/* LEGEND (Fixed Position Overlay inside Canvas) */}
            <div className="absolute bottom-6 left-6 z-10 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 p-4 rounded-2xl shadow-2xl ring-1 ring-white/5">
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black mb-3 pb-2 border-b border-zinc-800/50">Legend</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                {Object.entries(typeColors).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2.5 group cursor-default">
                    <div className="w-2.5 h-2.5 rounded-full ring-4 ring-offset-4 ring-offset-zinc-900 ring-transparent group-hover:ring-current transition-all duration-300" style={{ backgroundColor: color, color: color }}></div>
                    <span className="text-[10px] text-zinc-400 font-medium capitalize tracking-wide">{type}</span>
                  </div>
                ))}
              </div>
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
