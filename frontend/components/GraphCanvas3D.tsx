"use client";

import React, { useRef, useEffect, useMemo, useState } from 'react';
import ForceGraph3D, { ForceGraphMethods } from 'react-force-graph-3d';
import { GraphNode as Node, GraphEdge as Edge } from '../types/graph';
import { Cluster } from '../services/clusterEngine';
import * as THREE from 'three';
import { ChevronDown, Target } from 'lucide-react';

interface GraphCanvas3DProps {
  nodes: Node[];
  edges: Edge[];
  clusters: Cluster[];
  zoom: number;
  onNodeClick: (node: any) => void;
}

/**
 * AI ORCHESTRA ELITE COGNITIVE TOPOLOGY (m.md v5 compliant)
 */
const SEMANTIC_COLORS = {
  session: '#06b6d4',      // Cyan (Root Anchor)
  task: '#f97316',         // Orange (Operational Layer)
  model: '#eab308',        // Gold (Intelligence Provider)
  output: '#10b981',       // Emerald (Cognitive Artifact)
  memory: '#8b5cf6',       // Violet (Persistent Core)
  error: '#ef4444',        // Red (System Failure)
  active: '#3b82f6',       // Electric Blue (Neural Pulse)
  lineage: '#ffffff',      // Pure White (Active Flow)
  default: '#334155',      // Slate 700 (Background Structure)
};

// Provider-specific neural identity
const PROVIDER_COLORS: Record<string, string> = {
  'GPT-4': '#10a37f', 
  'Claude': '#d97706', 
  'Gemini': '#4f46e5', 
  'Ollama': '#64748b',
};

export default function GraphCanvas3D({ nodes, edges, clusters, onNodeClick }: GraphCanvas3DProps) {
  const fgRef = useRef<ForceGraphMethods>();
  const [mounted, setMounted] = useState(false);
  const [hoverLineage, setHoverLineage] = useState<{ nodes: Set<string>, links: Set<string> }>({
    nodes: new Set(),
    links: new Set()
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const graphData = useMemo(() => {
    const processedNodes: any[] = [];
    const processedLinks: any[] = [];
    const nodesById = new Map<string, any>();
    const modelHubs = new Map<string, any>();

    // 1. First pass: Register all existing nodes
    nodes.forEach(n => {
      const node = { ...n, id: String(n.id) };
      processedNodes.push(node);
      nodesById.set(node.id, node);
    });

    // 2. Second pass: Ensure Model Hubs exist (Shared across sessions)
    nodes.forEach(node => {
      const modelName = node.metadata?.model || node.model;
      if (modelName && (node.type === 'ai_response' || node.type === 'response' || node.type === 'output')) {
        const modelId = `model_${modelName}`;
        // CRITICAL: Only add if not already present from backend or previous step
        if (!nodesById.has(modelId) && !modelHubs.has(modelId)) {
          const mNode = {
            id: modelId,
            label: modelName,
            type: 'model',
            importance: 1.2,
            metadata: { is_model_node: true, model_name: modelName }
          };
          modelHubs.set(modelId, mNode);
          processedNodes.push(mNode);
          nodesById.set(modelId, mNode);
        }
      }
    });

    // 3. Third pass: Build Relationships (Lineage Chains)
    edges.forEach(e => {
      const sid = String(e.source);
      const tid = String(e.target);
      processedLinks.push({ 
        ...e, 
        source: sid, 
        target: tid,
        id: `link_${sid}_${tid}` 
      });
    });

    // 4. ELITE TOPOLOGY INJECTION (Spider-web Effect)
    nodes.forEach(node => {
      const nid = String(node.id);
      
      // Chain: SESSION -> TASK -> MODEL -> OUTPUT
      if (node.type === 'ai_response' || node.type === 'output' || node.type === 'response') {
        const modelName = node.metadata?.model || node.model;
        const taskId = node.metadata?.prompt_id || node.prompt_id || node.metadata?.task_id;
        const sessionId = node.session_id || node.metadata?.session_id;

        const modelId = modelName ? `model_${modelName}` : null;

        // Model -> Output (Only if nodes exist)
        if (modelId && nodesById.has(modelId) && nodesById.has(nid)) {
          processedLinks.push({
            id: `l_m_o_${modelId}_${nid}`,
            source: modelId,
            target: nid,
            type: 'GENERATED',
            animated: true,
            importance: 1.0
          });

          // Task -> Model
          if (taskId && nodesById.has(String(taskId))) {
            processedLinks.push({
              id: `l_t_m_${taskId}_${modelId}`,
              source: String(taskId),
              target: modelId,
              type: 'ROUTED_TO',
              importance: 0.8
            });
          }
        }

        // Session -> Task
        if (sessionId && taskId && nodesById.has(String(sessionId)) && nodesById.has(String(taskId))) {
          processedLinks.push({
            id: `l_s_t_${sessionId}_${taskId}`,
            source: String(sessionId),
            target: String(taskId),
            type: 'OWNS',
            importance: 0.7
          });
        }
      }
    });

    // 5. Semantic Density: Link similar outputs in same session
    const outputs = processedNodes.filter(n => n.type === 'output' || n.type === 'ai_response');
    outputs.forEach((o1, i) => {
      outputs.slice(i + 1, i + 4).forEach(o2 => {
        if (o1.session_id === o2.session_id) {
          processedLinks.push({
            id: `l_sem_${o1.id}_${o2.id}`,
            source: o1.id,
            target: o2.id,
            type: 'RELATED_TO',
            strength: 0.2,
            opacity: 0.1
          });
        }
      });
    });

    return { nodes: processedNodes, links: processedLinks };
  }, [nodes, edges]);

  // LINEAGE TRACING SYSTEM (Iterative for safety and performance)
  const traceLineage = (nodeId: string) => {
    const nodesInLineage = new Set<string>([nodeId]);
    const linksInLineage = new Set<string>();
    const stack = [nodeId];
    
    // Safety limit to prevent infinite loops in malformed graphs
    let iterations = 0;
    while (stack.length > 0 && iterations < 1000) {
      iterations++;
      const currId = stack.pop()!;
      
      graphData.links.forEach(link => {
        const s = typeof link.source === 'object' ? link.source.id : link.source;
        const t = typeof link.target === 'object' ? link.target.id : link.target;
        
        if (s === currId && !nodesInLineage.has(t)) {
          nodesInLineage.add(t);
          linksInLineage.add(link.id);
          stack.push(t);
        }
        if (t === currId && !nodesInLineage.has(s)) {
          nodesInLineage.add(s);
          linksInLineage.add(link.id);
          stack.push(s);
        }
      });
    }
    setHoverLineage({ nodes: nodesInLineage, links: linksInLineage });
  };

  useEffect(() => {
    if (!fgRef.current) return;
    const fg = fgRef.current;
    
    // SPHERICAL NEURAL CLUSTER PHYSICS
    fg.d3Force('charge')?.strength(-100); // Dense clustering
    fg.d3Force('center')?.strength(0.8);  // Strong central gravity
    fg.d3Force('link')?.distance(40);     // Tight links
    
    // ATMOSPHERIC DEPTH SYSTEM
    const scene = fg.scene();
    const camera = fg.camera() as THREE.PerspectiveCamera;
    
    if (scene && camera) {
      camera.far = 10000; 
      camera.updateProjectionMatrix();

      scene.background = new THREE.Color(0x020203);
      scene.fog = new THREE.Fog(0x020203, 100, 3000); 

      // Remove old lights to prevent stacking
      scene.children = scene.children.filter(c => !(c instanceof THREE.Light || c instanceof THREE.Points));

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);
      
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(100, 100, 100);
      scene.add(dirLight);

      const pointLight = new THREE.PointLight(SEMANTIC_COLORS.active, 2, 1000);
      scene.add(pointLight);

      // NEURAL DUST
      const particlesGeometry = new THREE.BufferGeometry();
      const count = 2000;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 2000;
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particlesMaterial = new THREE.PointsMaterial({
        size: 1.5,
        color: SEMANTIC_COLORS.active,
        transparent: true,
        opacity: 0.2,
      });
      scene.add(new THREE.Points(particlesGeometry, particlesMaterial));
    }
  }, [mounted]);

  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      // Small delay to ensure physics has started
      setTimeout(() => {
        fgRef.current?.zoomToFit(800, 150);
      }, 500);
    }
  }, [graphData.nodes.length]); // Better dependency: refit when node count changes

  const getNodeColor = (node: any) => {
    if (node.type === 'session') return SEMANTIC_COLORS.session;
    if (node.type === 'task' || node.type === 'goal') return SEMANTIC_COLORS.task;
    if (node.type === 'intelligence' || node.type === 'model' || node.type === 'llm' || node.metadata?.is_model_node) return SEMANTIC_COLORS.model;
    if (node.type === 'ai_response' || node.type === 'insight' || node.type === 'response' || node.type === 'output') {
      return node.type === 'insight' ? SEMANTIC_COLORS.insight : SEMANTIC_COLORS.output;
    }
    if (node.type === 'error') return SEMANTIC_COLORS.error;
    return SEMANTIC_COLORS.default;
  };
 
  const getNodeThreeObject = (node: any) => {
    const isLineage = hoverLineage.nodes.has(node.id);
    const isDimmed = hoverLineage.nodes.size > 0 && !isLineage;

    const size = (node.importance || 0.5) * 8 + 4;
    const baseColor = getNodeColor(node);
    const color = isLineage ? SEMANTIC_COLORS.lineage : baseColor;
    const group = new THREE.Group();
 
    // 1. SPATIAL GEOMETRY (m.md v5 Typed Nodes)
    let geometry: THREE.BufferGeometry;
    if (node.type === 'session') {
      geometry = new THREE.IcosahedronGeometry(size * 1.5, 0); // Large orbital hubs
    } else if (node.type === 'model' || node.metadata?.is_model_node) {
      geometry = new THREE.OctahedronGeometry(size * 1.2); // Glowing hubs
    } else if (node.type === 'task') {
      geometry = new THREE.SphereGeometry(size * 1.3, 32, 32); // Larger, round Directive nodes
    } else if (node.type === 'memory') {
      geometry = new THREE.TorusGeometry(size * 0.7, size * 0.2, 16, 100);
    } else {
      geometry = new THREE.SphereGeometry(size, 24, 24); // Satellites
    }
 
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: isLineage ? 2.0 : (isDimmed ? 0.1 : 0.8),
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: isDimmed ? 0.15 : 0.9,
    });
 
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
  
    // 2. VOLUMETRIC AURA (Neural Pulse)
    if (!isDimmed) {
      const glowGeo = geometry.clone().scale(1.2, 1.2, 1.2);
      const glowMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: isLineage ? 0.4 : 0.1,
        side: THREE.BackSide
      });
      group.add(new THREE.Mesh(glowGeo, glowMat));
    }

    // 3. TEXT LABEL (Billboarding) - Only for lineage or significant nodes to save memory
    if (isLineage || (node.importance > 1.2 && !isDimmed)) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 256;
        canvas.height = 64;
        ctx.fillStyle = 'white';
        ctx.font = 'Bold 24px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(node.label || '', 128, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const labelMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const labelSprite = new THREE.Sprite(labelMat);
        labelSprite.scale.set(size * 4, size, 1);
        labelSprite.position.set(0, size * 1.5, 0);
        group.add(labelSprite);
      }
    }
 
    return group;
  };
 
  const handleNodeClick = (node: any) => {
    if (!fgRef.current) return;
    
    // Safety check for coordinates
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    const z = node.z ?? 0;

    const distance = 400; 
    const nodeDist = Math.hypot(x, y, z);
    const distRatio = nodeDist > 0 ? (1 + distance / nodeDist) : 0;
    
    const camPos = nodeDist > 0 
      ? { x: x * distRatio, y: y * distRatio, z: z * distRatio }
      : { x: 0, y: 0, z: distance };

    fgRef.current.cameraPosition(
      camPos,
      node, // look at node
      1200
    );
    onNodeClick(node);
  };

  if (!mounted) return null;

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#020203]">
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeThreeObject={getNodeThreeObject}
        nodeLabel={(node: any) => `
          <div class="glass-panel p-4 rounded-xl border border-white/10 min-w-[200px] font-sans">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-2 h-2 rounded-full" style="background: ${getNodeColor(node)}; box-shadow: 0 0 10px ${getNodeColor(node)}"></div>
              <span class="text-[9px] font-black uppercase tracking-widest text-white/60">${node.type || 'node'}</span>
            </div>
            <div class="text-sm font-bold text-white mb-1">${node.label}</div>
            <div class="text-[10px] text-zinc-500 italic">${node.id}</div>
            ${node.metadata?.model_name ? `<div class="text-[9px] text-amber-500 font-bold mt-2 uppercase tracking-tighter">Powered by ${node.metadata.model_name}</div>` : ''}
          </div>
        `}
        
        // EDGE RENDERING (Neural Infrastructure)
        linkColor={(link: any) => hoverLineage.links.has(link.id) ? SEMANTIC_COLORS.lineage : 'rgba(255, 255, 255, 0.05)'}
        linkWidth={(link: any) => hoverLineage.links.has(link.id) ? 2 : 0.5}
        linkOpacity={(link: any) => hoverLineage.links.has(link.id) ? 0.8 : 0.1}
        
        // CAUSAL FLOW (Neural Particles)
        linkDirectionalParticles={(link: any) => hoverLineage.links.has(link.id) ? 8 : (link.animated ? 3 : 0)}
        linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleWidth={(link: any) => hoverLineage.links.has(link.id) ? 2.5 : 1.2}
        linkDirectionalParticleColor={(link: any) => hoverLineage.links.has(link.id) ? SEMANTIC_COLORS.lineage : getNodeColor(link.source)}
        
        backgroundColor="#020203"
        onNodeClick={handleNodeClick}
        onNodeHover={(node) => {
          if (node) traceLineage(node.id);
          else setHoverLineage({ nodes: new Set(), links: new Set() });
        }}
        showNavInfo={false}
        enableNodeDrag={true}
        
        // PHYSICS ENGINE (Hierarchy-Aware)
        d3VelocityDecay={0.3}
        warmupTicks={100}
      />

      {/* HUD OVERLAY - SEMANTIC CONTEXT (Hidden for now) */}
      {/* 
      <div className="absolute bottom-10 left-10 z-20 flex flex-col gap-4 pointer-events-none">
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-500 neural-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Cognitive Cortex v5</span>
          </div>
          <div className="flex gap-6 mt-2">
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-zinc-600 uppercase">Nodes</span>
              <span className="text-xl font-black text-white tabular-nums">{nodes.length}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-zinc-600 uppercase">Neural Links</span>
              <span className="text-xl font-black text-cyan-500 tabular-nums">{edges.length}</span>
            </div>
          </div>
        </div>
      </div>
      */}
    </div>
  );
}


