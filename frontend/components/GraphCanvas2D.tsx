"use client";

import React, { useRef, useEffect, useMemo, useState } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { GraphNode as Node, GraphEdge as Edge } from '../types/graph';
import { Cluster } from '../services/clusterEngine';

interface GraphCanvas2DProps {
  nodes: Node[];
  edges: Edge[];
  clusters: Cluster[];
  zoom: number;
  onNodeClick: (node: any) => void;
}

const SEMANTIC_COLORS = {
  session: '#06b6d4',      // Cyan
  task: '#f97316',         // Orange
  model: '#eab308',        // Gold
  output: '#10b981',       // Emerald
  insight: '#8b5cf6',      // Violet
  error: '#ef4444',        // Red
  active: '#3b82f6',       // Electric Blue
  default: '#475569',      // Slate
};

export default function GraphCanvas2D({ nodes, edges, clusters, onNodeClick }: GraphCanvas2DProps) {
  const fgRef = useRef<ForceGraphMethods>();
  const [mounted, setMounted] = useState(false);
  const [hoverNode, setHoverNode] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const graphData = useMemo(() => {
    const processedNodes = [...nodes.map(n => ({ ...n, id: String(n.id) }))];
    const processedLinks = [...edges.map(e => ({ ...e, source: String(e.source), target: String(e.target) }))];
    
    // Lineage logic (Same as 3D)
    const modelNodesMap = new Map();
    nodes.forEach(node => {
      if (node.type === 'ai_response' || node.type === 'insight') {
        const sessionId = node.session_id;
        const modelName = node.metadata?.model || node.model || 'Unknown Model';
        const promptId = node.metadata?.prompt_id || node.prompt_id;
        
        if (sessionId && modelName) {
          const modelNodeId = `model_${modelName}`;
          if (!modelNodesMap.has(modelNodeId)) {
            const modelNode = {
              id: modelNodeId,
              label: modelName,
              type: 'intelligence',
              importance: 1.0,
              metadata: { is_model_node: true, model_name: modelName }
            };
            processedNodes.push(modelNode as any);
            modelNodesMap.set(modelNodeId, modelNode);
          }
          
          if (promptId) {
            processedLinks.push({ source: String(sessionId), target: String(promptId), strength: 0.5 } as any);
            processedLinks.push({ source: String(promptId), target: modelNodeId, strength: 0.8 } as any);
          }
          processedLinks.push({ source: modelNodeId, target: String(node.id), strength: 1.0, animated: true } as any);
        }
      }
    });

    return { nodes: processedNodes, links: processedLinks };
  }, [nodes, edges]);

  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      setTimeout(() => {
        fgRef.current?.zoomToFit(800, 100);
      }, 500);
    }
  }, [graphData.nodes.length]);

  const getNodeColor = (node: any) => {
    if (node.type === 'session') return SEMANTIC_COLORS.session;
    if (node.type === 'task' || node.type === 'goal') return SEMANTIC_COLORS.task;
    if (node.type === 'intelligence' || node.type === 'model' || node.metadata?.is_model_node) return SEMANTIC_COLORS.model;
    if (node.type === 'ai_response' || node.type === 'insight' || node.type === 'response' || node.type === 'output') {
      return node.type === 'insight' ? SEMANTIC_COLORS.insight : SEMANTIC_COLORS.output;
    }
    if (node.type === 'error') return SEMANTIC_COLORS.error;
    return SEMANTIC_COLORS.default;
  };

  if (!mounted) return null;

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#020203]">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        backgroundColor="#020203"
        nodeLabel={(node: any) => `
          <div class="glass-panel p-3 rounded-lg border border-white/10 font-sans">
            <div class="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">${node.type || 'node'}</div>
            <div class="text-xs font-bold text-white">${node.label}</div>
          </div>
        `}
        nodeColor={getNodeColor}
        nodeRelSize={6}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.label;
          const fontSize = 12 / globalScale;
          const size = (node.importance || 0.5) * 8 + 4;
          const color = getNodeColor(node);
          const isHovered = hoverNode && hoverNode.id === node.id;

          // Draw Glow
          if (isHovered) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, size * 1.5, 0, 2 * Math.PI, false);
            ctx.fillStyle = `${color}22`;
            ctx.fill();
          }

          // Draw Circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();
          
          if (isHovered) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
          }

          // Draw Label
          if (globalScale > 1.5 || isHovered) {
            ctx.font = `${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isHovered ? '#fff' : 'rgba(255,255,255,0.6)';
            ctx.fillText(label, node.x, node.y + size + fontSize + 2);
          }
        }}
        linkWidth={1.5}
        linkColor={() => 'rgba(255,255,255,0.15)'}
        
        // Directional Arrows
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={() => 'rgba(255,255,255,0.3)'}

        // Causal Particles
        linkDirectionalParticles={(link: any) => link.animated ? 5 : 2}
        linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleWidth={2.5}
        linkDirectionalParticleColor={(link: any) => getNodeColor(link.source)}
        onNodeClick={onNodeClick}
        onNodeHover={setHoverNode}
        cooldownTicks={100}
        d3AlphaDecay={0.01}
        d3VelocityDecay={0.3}
      />
    </div>
  );
}
