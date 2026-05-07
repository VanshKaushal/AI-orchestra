"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { 
  Share2, RefreshCw, Sliders, Info, X, Layers, MousePointer2, Anchor, 
  ChevronDown, Check, PanelRightClose, PanelRightOpen, Activity, Cpu, 
  AlertTriangle, TrendingUp, Zap, Search, Filter, Play, History, Brain, Globe, Target
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import dynamic from 'next/dynamic';
import { processGraph } from '../../services/graphProcessor';
import { getClusters, Cluster } from '../../services/clusterEngine';
import { BASE_URL } from '../../services/api';
import { GraphNode, GraphEdge } from '../../types/graph';

// SESSION COLOR GENERATOR
const getSessionColor = (sessionId?: string) => {
  if (!sessionId) return null;
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = sessionId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  const s = 70 + (Math.abs(hash % 20)); 
  const l = 50 + (Math.abs(hash % 10)); 
  return `hsl(${h}, ${s}%, ${l}%)`;
};

const GraphCanvas3D = dynamic(
  () => import('../../components/GraphCanvas3D'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-zinc-500 font-mono tracking-widest uppercase animate-pulse">
        Initializing Cognitive Engine...
      </div>
    )
  }
);

const BACKEND_URL = BASE_URL;

export default function GraphPage() {
  const { 
    activeSessionId, 
    sessions, 
    graphMode, 
    setGraphMode, 
    graphSettings, 
    updateGraphSettings 
  } = useStore();
  
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isHUDCollapsed, setIsHUDCollapsed] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);

  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = "";
      
      // Multi-session fidelity logic: if multiple are selected, we need the global dataset to filter from
      const isMultiSelect = selectedSessions.length > 1;
      const effectiveMode = isMultiSelect ? 'global' : graphMode;
      
      switch (effectiveMode) {
        case 'session':
          endpoint = `${BACKEND_URL}/graph?session_id=${activeSessionId}`;
          break;
        case 'global':
          endpoint = `${BACKEND_URL}/graph`; 
          break;
        case 'insight':
          endpoint = `${BACKEND_URL}/graph/ai/${activeSessionId}?threshold=0.85&k=3`;
          break;
        case 'timeline':
          endpoint = `${BACKEND_URL}/graph?session_id=${activeSessionId}`;
          break;
        default:
          endpoint = `${BACKEND_URL}/graph?session_id=${activeSessionId}`;
      }
        
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
      const res = await response.json();
      if (!res?.success || !res?.data) throw new Error("Invalid response");

      const data = res.data;
      const processedGraph = processGraph(data);
      const graphClusters = getClusters(processedGraph.nodes);
      
      setClusters(graphClusters);
      setNodes(processedGraph.nodes);
      setEdges(processedGraph.edges);
    } catch (error) {
      console.error("Fetch failed:", error);
    } finally {
      setLoading(false);
    }
  }, [activeSessionId, graphMode, selectedSessions]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  const uniqueSessions = useMemo(() => {
    return sessions.map(s => ({
      id: String(s.id),
      name: s.name || `Session ${String(s.id).slice(-4)}`
    }));
  }, [sessions]);

  const filteredNodes = useMemo(() => {
    return nodes
      .filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter(n => (n.importance || 0) * 10 >= graphSettings.semanticStrength * 10)
      .filter(n => selectedSessions.length === 0 || !n.session_id || selectedSessions.includes(n.session_id));
  }, [nodes, searchQuery, graphSettings.semanticStrength, selectedSessions]);

  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    return edges.filter(e => nodeIds.has(String(e.source)) && nodeIds.has(String(e.target)));
  }, [edges, filteredNodes]);

  const analytics = useMemo(() => {
    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    const errors = nodes.filter(n => n.type === 'error').length;
    const typeDistribution = nodes.reduce((acc: any, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {});

    return { totalNodes, totalEdges, errors, typeDistribution };
  }, [nodes, edges]);

  return (
    <div className="h-screen w-full flex flex-col bg-[#020617] text-slate-200 overflow-hidden font-sans">
      <Header />
      
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />

        <main className="flex-1 flex flex-col relative overflow-hidden">
          
          {/* PREMIUM FLOATING TOOLBAR */}
          <div className="absolute top-6 left-6 right-6 md:top-8 md:left-8 md:right-8 h-auto md:h-14 z-20 flex flex-col md:flex-row items-center p-2 md:px-4 gap-3 md:gap-4 bg-slate-900/60 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between w-full md:w-auto md:pr-4 md:border-r md:border-white/5">
              <div className="flex items-center gap-3">
                <Brain className="text-blue-500 animate-pulse" size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 whitespace-nowrap">Cognitive Brain</span>
              </div>
              
              {/* SESSION SELECTOR (QUICK ACCESS) */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-950/30 rounded-lg border border-white/5 ml-4">
                <div className="flex flex-col">
                  <span className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter">Fidelity</span>
                  <button 
                    onClick={() => setShowFilterDrawer(true)}
                    className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1 hover:text-emerald-400 transition-colors"
                  >
                    {selectedSessions.length === 0 ? 'Full Cortex' : `${selectedSessions.length} Active`}
                    <ChevronDown size={8} className="text-slate-600" />
                  </button>
                </div>
              </div>
              
              <div className="md:hidden flex gap-2">
                 <button onClick={fetchGraphData} className="p-2 bg-slate-100 rounded-lg text-slate-900">
                   <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                 </button>
              </div>
            </div>

            <div className="flex w-full md:w-auto overflow-x-auto no-scrollbar gap-1 p-1 bg-slate-950/50 rounded-xl border border-white/5">
              {[
                { id: 'session', icon: Target, color: 'bg-blue-600', text: 'SESSION' },
                { id: 'global', icon: Globe, color: 'bg-amber-500', text: 'GLOBAL' },
                { id: 'insight', icon: Zap, color: 'bg-purple-600', text: 'INSIGHT' },
                { id: 'timeline', icon: History, color: 'bg-emerald-600', text: 'TIME' }
              ].map(item => (
                <button 
                  key={item.id}
                  onClick={() => setGraphMode(item.id as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all whitespace-nowrap ${graphMode === item.id ? `${item.color} text-white shadow-lg` : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <item.icon size={12} /> {item.text}
                </button>
              ))}
            </div>

            <div className="hidden md:flex flex-1 items-center bg-slate-950/30 rounded-xl px-3 border border-white/5">
              <Search size={14} className="text-slate-500" />
              <input 
                type="text" 
                placeholder="Search semantic memory..." 
                className="bg-transparent border-none focus:ring-0 text-xs w-full py-2 px-3 placeholder:text-slate-600 text-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                className="p-2.5 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-slate-400 border border-white/5 transition-all active:scale-95"
              >
                <Filter size={16} />
              </button>

              <button 
                onClick={fetchGraphData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-white text-slate-950 rounded-xl transition-all text-[10px] font-black disabled:opacity-50 active:scale-95"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                SYNC
              </button>
            </div>
          </div>

          {/* GRAPH RENDERING ENGINE */}
          <div className="flex-1 relative">
            <GraphCanvas3D 
              nodes={filteredNodes} 
              edges={filteredEdges}
              clusters={clusters}
              zoom={1}
              onNodeClick={(node) => {
                setSelectedNode(node);
                if (window.innerWidth < 1024) setIsSidebarOpen(true);
              }}
            />

            {/* LIVE ANALYTICS HUD */}
            <div className={`
              absolute bottom-8 right-8 md:bottom-12 md:right-12 transition-all duration-700 ease-in-out z-20
              ${isHUDCollapsed ? 'w-12 h-12 md:w-16 md:h-16 rounded-2xl cursor-pointer hover:scale-110 active:scale-95' : 'w-[calc(100%-4rem)] md:w-80 h-auto rounded-[2.5rem]'}
              bg-slate-900/80 backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden
            `}
            onClick={() => isHUDCollapsed && setIsHUDCollapsed(false)}
            >
              {isHUDCollapsed ? (
                <div className="w-full h-full flex items-center justify-center bg-blue-500/10 animate-pulse">
                  <Activity size={20} className="text-blue-500" />
                </div>
              ) : (
                <div className="p-6 md:p-8 animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className="flex items-center gap-2 md:gap-3">
                      <Activity size={16} className="text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                      <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Live Insights</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsHUDCollapsed(true);
                      }}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  <div className="hidden md:grid grid-cols-2 gap-8 mb-10">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Total Nodes</span>
                      <div className="text-3xl font-black text-white tabular-nums">{analytics.totalNodes}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Active Links</span>
                      <div className="text-3xl font-black text-blue-500 tabular-nums">{analytics.totalEdges}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase">Composition</span>
                        <span className="hidden md:inline text-[9px] font-mono text-slate-400/50">{analytics.totalNodes} elements</span>
                      </div>
                      <div className="h-1 w-full bg-slate-950/50 rounded-full overflow-hidden flex">
                        {Object.entries(analytics.typeDistribution).map(([type, count]: [any, any], idx) => (
                          <div 
                            key={type}
                            style={{ 
                              width: `${(count / analytics.totalNodes) * 100}%`,
                              backgroundColor: ['#3b82f6', '#fbbf24', '#f97316', '#10b981', '#8b5cf6'][idx % 5]
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 md:pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[7px] md:text-[8px] font-bold text-slate-700 uppercase">Engine Status</span>
                        <span className="text-[9px] md:text-[11px] font-bold text-slate-400 tracking-tight italic">Optimizing neural pathways...</span>
                      </div>
                      <Play size={12} className="text-slate-600 hover:text-blue-500 cursor-pointer transition-colors" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* SESSION FILTER DRAWER (PREMIUM UI) */}
        {showFilterDrawer && (
          <div className="absolute inset-0 z-[60] flex justify-end">
            <div 
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-500"
              onClick={() => setShowFilterDrawer(false)}
            />
            <div className="relative w-full max-w-sm bg-slate-900/90 backdrop-blur-3xl border-l border-white/10 h-full shadow-2xl p-8 flex flex-col animate-in slide-in-from-right-full duration-700">
              <div className="flex items-center justify-between mb-10">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-black text-white tracking-tight uppercase">Cognitive Filters</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Isolate memory threads</p>
                </div>
                <button 
                  onClick={() => setShowFilterDrawer(false)}
                  className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
                >
                  <RefreshCw size={20} className="rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Sessions</span>
                    <button 
                      onClick={() => setSelectedSessions([])}
                      className="text-[9px] font-black text-blue-500 uppercase hover:text-blue-400 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="grid gap-3">
                    {uniqueSessions.map(session => {
                      const isSelected = selectedSessions.includes(session.id);
                      const sessionColor = getSessionColor(session.id);
                      return (
                        <button
                          key={session.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSessions(selectedSessions.filter(id => id !== session.id));
                            } else {
                              setSelectedSessions([...selectedSessions, session.id]);
                            }
                          }}
                          className={`
                            group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300
                            ${isSelected 
                              ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                              : 'bg-slate-950/30 border-white/5 hover:border-white/20'}
                          `}
                        >
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-3 h-3 rounded-full shadow-lg"
                              style={{ backgroundColor: sessionColor || '#3b82f6', boxShadow: `0 0 10px ${sessionColor}` }}
                            />
                            <div className="flex flex-col items-start">
                              <span className={`text-[10px] font-black uppercase tracking-tight ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                                {session.name}
                              </span>
                              <span className="text-[8px] text-slate-600 font-bold uppercase">ID: {session.id.slice(-6)}</span>
                            </div>
                          </div>
                          <div className={`
                            w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                            ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/10 text-transparent'}
                          `}>
                            <Target size={10} strokeWidth={4} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-8 border-t border-white/5">
                <button 
                  onClick={() => setShowFilterDrawer(false)}
                  className="w-full py-4 bg-white text-slate-950 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                >
                  Apply Perspective
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PREMIUM SIDE PANEL (NODE INSPECTOR) */}
        <div className={`
          fixed inset-y-0 right-0 z-[100] lg:relative lg:z-30 transition-all duration-500 ease-in-out border-l border-white/5 bg-[#020617] 
          ${isSidebarOpen ? 'w-full md:w-96 translate-x-0' : 'w-0 translate-x-full lg:w-0 overflow-hidden border-none'}
        `}>
          <div className="w-full md:w-96 h-full flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
                  <Brain size={16} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">Inspector</h3>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Semantic Lineage</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-hide">
              {!selectedNode ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <MousePointer2 size={32} className="text-slate-600" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select a node to inspect</p>
                </div>
              ) : (
                <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                        {selectedNode.type}
                      </span>
                      <span className="text-[9px] font-mono text-slate-600">{selectedNode.id.split('_').pop()}</span>
                    </div>
                    <h1 className="text-base md:text-lg font-black text-white leading-tight italic">
                      "{selectedNode.label}"
                    </h1>
                  </section>

                  <div className="grid grid-cols-2 gap-4 md:gap-8">
                    <section className="space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Importance</span>
                      <div className="text-2xl md:text-3xl font-black text-white tracking-tighter">
                        {((selectedNode.importance || 0) * 100).toFixed(0)}%
                      </div>
                    </section>
                    <section className="space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Relevance</span>
                      <div className="text-2xl md:text-3xl font-black text-amber-500 tracking-tighter">
                        {((selectedNode.relevanceScore || 0) * 100).toFixed(0)}%
                      </div>
                    </section>
                  </div>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Layers size={14} className="text-slate-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Semantic Context</span>
                    </div>
                    <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-4 md:p-5 space-y-4">
                      {selectedNode.metadata?.summary ? (
                        <p className="text-xs text-slate-400 leading-relaxed italic">
                          {selectedNode.metadata.summary}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-600 italic">No semantic summary available for this memory node.</p>
                      )}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-slate-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Metadata Payload</span>
                    </div>
                    <div className="bg-slate-950 rounded-2xl border border-white/5 p-4 overflow-hidden overflow-x-auto">
                      <pre className="text-[9px] md:text-[10px] font-mono text-emerald-500/80 leading-relaxed">
                        {JSON.stringify(selectedNode.metadata || {}, null, 2)}
                      </pre>
                    </div>
                  </section>
                </div>
              )}
            </div>

            <div className="p-6 md:p-8 bg-slate-950/30 border-t border-white/5">
              <div className="flex gap-4 items-start">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Info size={16} className="text-blue-500" />
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  Cognitive nodes represent synthesized intelligence from the AI Orchestra engine. Semantic links are established via vector similarity.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TOGGLE SIDE PANEL BUTTON */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 z-40 p-3 md:p-5 bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all shadow-2xl hover:scale-105 active:scale-95"
          >
            <PanelRightOpen size={24} />
          </button>
        )}
      </div>
    </div>
  );
}

