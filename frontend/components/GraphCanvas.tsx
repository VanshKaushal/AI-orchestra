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

const nodeTypes = {}; // We can add custom node types here later

export default function GraphCanvas({ nodes: initialNodes, edges: initialEdges, onNodeClick }: GraphCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes and edges when props change
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const defaultEdgeOptions = {
    animated: true,
    style: { stroke: '#555', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#555',
    },
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
      <div className="absolute inset-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          style={{ width: '100%', height: '100%' }}
        >
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              switch (node.type) {
                case 'goal': return '#ef4444';
                case 'task': return '#eab308';
                case 'decision': return '#a855f7';
                case 'session': return '#3b82f6';
                case 'llm': return '#71717a';
                case 'insight': return '#f97316';
                default: return '#555';
              }
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
            style={{ backgroundColor: '#111', borderRadius: '8px', border: '1px solid #333' }}
          />
          <Background color="#333" gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}
