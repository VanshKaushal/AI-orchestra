"use client";

import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface GraphCanvasProps {
  nodes: any[];
  edges: any[];
  onNodeClick: (event: React.MouseEvent, node: any) => void;
}

const getHierarchyLayout = (nodes: any[], edges: any[]) => {
  if (nodes.length === 0) return { nodes: [], edges: [] };

  // 1. Identify "roots" (nodes with no incoming edges of certain types)
  const incoming = new Set(edges.map(e => e.target));
  const roots = nodes.filter(n => !incoming.has(n.id) || n.type === 'session');
  
  if (roots.length === 0 && nodes.length > 0) roots.push(nodes[0]);

  const levels: Record<string, number> = {};
  const levelCounts: Record<number, number> = {};
  
  // 2. Simple BFS to assign levels
  const queue = roots.map(r => ({ id: r.id, level: 0 }));
  const visited = new Set();
  
  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    
    levels[id] = level;
    levelCounts[level] = (levelCounts[level] || 0) + 1;
    
    const children = edges.filter(e => e.source === id).map(e => e.target);
    children.forEach(cid => queue.push({ id: cid, level: level + 1 }));
  }

  // 3. Position nodes based on levels
  const currentLevelIndex: Record<number, number> = {};
  const nodeWidth = 220;
  const nodeHeight = 100;
  const horizontalGap = 100;
  const verticalGap = 150;

  const flowNodes = nodes.map(n => {
    const level = levels[n.id] ?? 0;
    const index = currentLevelIndex[level] ?? 0;
    currentLevelIndex[level] = index + 1;
    
    const totalInLevel = levelCounts[level] || 1;
    const x = (index - (totalInLevel - 1) / 2) * (nodeWidth + horizontalGap);
    const y = level * verticalGap;

    return {
      id: String(n.id),
      type: 'default',
      data: { 
        type: n.type,
        label: (
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-black uppercase tracking-tighter text-white/40">{n.type}</span>
            <span className="text-[11px] font-bold text-white text-center leading-tight">{n.label || n.id}</span>
          </div>
        )
      },
      position: { x, y },
      style: {
        background: 'rgba(20, 20, 25, 0.8)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${getNodeColor(n.type)}55`,
        borderRadius: '12px',
        color: '#fff',
        width: nodeWidth,
        padding: '12px',
        boxShadow: `0 0 20px -10px ${getNodeColor(n.type)}`,
      }
    };
  });

  const flowEdges = edges.map((e, idx) => ({
    id: `e-${idx}`,
    source: String(e.source),
    target: String(e.target),
    animated: true,
    style: { stroke: `${getNodeColor('default')}44`, strokeWidth: 1.5 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: getNodeColor('default'),
    },
  }));

  return { nodes: flowNodes, edges: flowEdges };
};

const getNodeColor = (type: string) => {
  switch (type) {
    case 'session': return '#06b6d4'; // Cyan
    case 'task': return '#f97316';    // Orange
    case 'model': return '#eab308';   // Gold
    case 'ai_response':
    case 'output': return '#10b981';  // Emerald
    case 'memory':
    case 'insight': return '#8b5cf6'; // Violet
    case 'error': return '#ef4444';   // Red
    default: return '#334155';        // Slate
  }
};

export default function GraphCanvas({ nodes: initialNodes, edges: initialEdges, onNodeClick }: GraphCanvasProps) {
  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(() => 
    getHierarchyLayout(initialNodes, initialEdges), 
    [initialNodes, initialEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

  React.useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#020203]">
      <div className="absolute inset-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          style={{ width: '100%', height: '100%' }}
        >
          <Controls className="bg-zinc-900 border-zinc-800 fill-zinc-500" />
          <MiniMap 
            nodeColor={(node: any) => getNodeColor(node.data?.type)}
            maskColor="rgba(0, 0, 0, 0.4)"
            className="bg-zinc-900/50 border border-white/5 rounded-xl"
          />
          <Background color="#111" gap={20} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}

