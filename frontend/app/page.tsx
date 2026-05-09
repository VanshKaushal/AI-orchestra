"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import SidePanel from "../components/SidePanel";
import InputBox from "../components/InputBox";
import { useStore } from '../store/useStore';
import { processGraph } from '../services/graphProcessor';
import { getClusters, Cluster } from '../services/clusterEngine';
import { BASE_URL } from '../services/api';
import { GraphNode, GraphEdge } from '../types/graph';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Activity, Zap, Cpu, Search, Command, Target, Share2 } from 'lucide-react';
import ChatWindow from '../components/ChatWindow';

// Dynamic import for 3D Graph to prevent SSR issues
const GraphCanvas3D = dynamic(
  () => import('../components/GraphCanvas3D'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-[#020203] text-zinc-700 font-mono tracking-widest uppercase animate-pulse">
        Initializing Cognitive Engine...
      </div>
    )
  }
);

const GraphCanvas = dynamic(
  () => import('../components/GraphCanvas'),
  { ssr: false }
);

export default function AIOrchestraOS() {
  const { 
    activeSessionId, 
    sessions, 
    graphMode, 
    graphType,
    setGraphType,
    graphSettings,
    user,
    viewMode,
    setViewMode
  } = useStore();
  
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  // FETCH GRAPH DATA
  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = `${BASE_URL}/graph`;
      
      if (graphMode === 'session' && activeSessionId) {
        endpoint += `?session_id=${activeSessionId}`;
      } else if (graphMode === 'insight' && activeSessionId) {
        endpoint += `/ai/${activeSessionId}`;
      } else if (graphMode === 'global') {
        // Just /graph for global
      }
        
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
      const res = await response.json();
      if (res?.success && res?.data) {
        const processedGraph = processGraph(res.data);
        const graphClusters = getClusters(processedGraph.nodes);
        
        setClusters(graphClusters);
        setNodes(processedGraph.nodes);
        setEdges(processedGraph.edges);
      }
    } catch (error) {
      console.error("Fetch failed:", error);
    } finally {
      setLoading(false);
    }
  }, [activeSessionId, graphMode]);

  useEffect(() => {
    fetchGraphData();
    const interval = setInterval(fetchGraphData, 10000); 
    return () => clearInterval(interval);
  }, [fetchGraphData]);

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#020203] flex text-zinc-100 font-sans selection:bg-cyan-500/30">
      {/* 1. NAVIGATION LAYER: INTELLIGENT SIDEBAR */}
      <Sidebar />

      {/* 2. CORE WORKSPACE: CONDITIONAL VIEWS */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* HEADER (Shared) */}
        <header className="p-6 flex items-center justify-between z-40 bg-[#020203]/80 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="glass-panel px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
              <Brain size={16} className={viewMode === 'graph' ? "text-cyan-500" : "text-emerald-500"} />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {viewMode === 'chat' ? 'Intelligence Stream' : 'Cognitive Cortex'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="glass-panel px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3 focus-within:border-white/20 transition-colors">
              <Search size={14} className="text-zinc-500" />
              <input 
                placeholder={viewMode === 'chat' ? "Search messages..." : "Filter nodes..."}
                className="bg-transparent border-none focus:ring-0 outline-none text-xs w-48 text-zinc-300 placeholder:text-zinc-600"
              />
            </div>
            
            <button 
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className={`glass-panel p-2.5 rounded-xl border border-white/10 transition-all active:scale-95 ${rightPanelOpen ? 'text-cyan-500 border-cyan-500/20' : 'text-zinc-400'}`}
            >
              <Activity size={18} />
            </button>
          </div>
        </header>

        {/* VIEW CONTENT */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {viewMode === 'chat' ? (
              <motion.div 
                key="chat-view"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                  <ChatWindow />
                  
                  {/* Floating Input Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-10 pt-32 bg-gradient-to-t from-[#020203] via-[#020203]/95 to-transparent pointer-events-none z-50">
                      <div className="max-w-3xl mx-auto pointer-events-auto">
                        <InputBox />
                      </div>
                    </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="graph-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.4 }}
                className="flex-1 relative"
              >
                {graphType === 'obsidian' ? (
                  <GraphCanvas3D 
                    nodes={nodes} 
                    edges={edges}
                    clusters={clusters}
                    zoom={1}
                    onNodeClick={(node) => {
                      setSelectedNode(node);
                      setRightPanelOpen(true);
                    }}
                  />
                ) : (
                  <GraphCanvas 
                    nodes={nodes} 
                    edges={edges}
                    onNodeClick={(event, node) => {
                      setSelectedNode(node);
                      setRightPanelOpen(true);
                    }}
                  />
                )}
                
                {/* GRAPH TYPE TOGGLE (Obsidian vs Tree) */}
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-[#020203]/40 backdrop-blur-md border border-white/5 p-1 rounded-xl">
                  {[
                    { id: 'obsidian', label: 'Obsidian', icon: <Share2 size={10} /> },
                    { id: 'tree', label: 'System Tree', icon: <Activity size={10} /> }
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setGraphType(type.id as any)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                        graphType === type.id 
                          ? 'bg-white/10 text-white font-bold' 
                          : 'text-zinc-500 hover:text-zinc-400'
                      }`}
                    >
                      {type.icon}
                      <span className="text-[8px] uppercase tracking-wider font-black">{type.label}</span>
                    </button>
                  ))}
                </div>
                
                {/* GRAPH MODE SWITCHER - RESTORED */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-[#020203]/60 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl">
                  {[
                    { id: 'session', label: 'Session', icon: <Target size={12} /> },
                    { id: 'global', label: 'Global', icon: <Share2 size={12} /> },
                    { id: 'insight', label: 'AI Enriched', icon: <Zap size={12} /> },
                    { id: 'timeline', label: 'Timeline', icon: <Activity size={12} /> }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        useStore.getState().setGraphMode(mode.id as any);
                        fetchGraphData();
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                        graphMode === mode.id 
                          ? 'bg-cyan-500 text-black font-black shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                      }`}
                    >
                      {mode.icon}
                      <span className="text-[10px] uppercase tracking-widest font-black">{mode.label}</span>
                    </button>
                  ))}
                </div>

                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(2,2,3,0.3)_100%)]"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. ACTIVITY LAYER: STATE & LOGS */}
      <SidePanel 
        activePanel={rightPanelOpen ? "state" : null} 
        setActivePanel={(p) => setRightPanelOpen(!!p)} 
        selectedNode={selectedNode}
      />
    </main>
  );
}
