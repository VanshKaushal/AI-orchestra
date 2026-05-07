"use client";

import React, { useRef, useEffect, useMemo, useState } from 'react';
import ForceGraph3D, { ForceGraphMethods } from 'react-force-graph-3d';
import { GraphNode as Node, GraphEdge as Edge, NodeType } from '../types/graph';
import { Cluster } from '../services/clusterEngine';
import * as THREE from 'three';
import { ChevronDown } from 'lucide-react';

interface GraphCanvas3DProps {
  nodes: Node[];
  edges: Edge[];
  clusters: Cluster[];
  zoom: number;
  onNodeClick: (node: any) => void;
}

// PREMIUM SEMANTIC COLOR ARCHITECTURE
const COLOR_SYSTEM: Record<string, string> = {
  task: '#f97316',          // Vibrant Orange (Goal/Task)
  intelligence: '#ffd700',  // Brilliant Gold (LLM/Model)
  ai_response: '#10b981',   // Emerald Green (Output)
  session: '#00f2ff',       // Electric Cyan (Thread)
  error: '#ef4444',         // Crimson Red
  insight: '#8b5cf6',       // Vivid Violet
  user_prompt: '#3b82f6',   // Azure Blue
  external_knowledge: '#6366f1', // Indigo
  default: '#94a3b8'        // Slate Grey
};

// SESSION COLOR GENERATOR
const getSessionColor = (sessionId?: string) => {
  if (!sessionId) return null;
  
  // Simple hash function for string to number
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = sessionId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Map hash to HSL space for vibrant, distinct colors
  const h = Math.abs(hash % 360);
  const s = 80; // High saturation
  const l = 60; // Vibrant lightness
  
  return `hsl(${h}, ${s}%, ${l}%)`;
};

export default function GraphCanvas3D({ nodes, edges, clusters, onNodeClick }: GraphCanvas3DProps) {
  const fgRef = useRef<ForceGraphMethods>();
  const [mounted, setMounted] = useState(false);
  const [isEngineCollapsed, setIsEngineCollapsed] = useState(false);
  const [hoverNode, setHoverNode] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const graphData = useMemo(() => {
    const processedNodes = [...nodes.map(n => ({ ...n, id: String(n.id) }))];
    const processedLinks = [...edges.map(e => ({ ...e, source: String(e.source), target: String(e.target) }))];
    
    // UNIVERSAL CAUSAL LINEAGE (Session -> Task -> LLM -> Output)
    const modelNodesMap = new Map();
    
    nodes.forEach(node => {
      if (node.type === 'ai_response' || node.type === 'insight') {
        const sessionId = node.session_id;
        const modelName = node.metadata?.model || node.model || 'Unknown Model';
        const promptId = node.metadata?.prompt_id || node.prompt_id;
        
        if (sessionId && modelName) {
          const modelNodeId = `model_${modelName}`;
          
          // 1. Create Model Node if not exists
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
          
          // 2. Connect Session -> Task (Prompt)
          if (promptId) {
            processedLinks.push({
              source: String(sessionId),
              target: String(promptId),
              type: 'session_containment',
              label: 'CONTAINS TASK',
              strength: 0.5
            } as any);

            // 3. Connect Task -> LLM Hub
            processedLinks.push({
              source: String(promptId),
              target: modelNodeId,
              type: 'task_execution',
              label: 'PROCESSED BY',
              strength: 0.8
            } as any);
          }
          
          // 4. Connect LLM Hub -> Output
          processedLinks.push({
            source: modelNodeId,
            target: String(node.id),
            type: 'generated_by',
            label: 'GENERATED OUTPUT',
            strength: 1.0,
            animated: true
          } as any);
        }
      }
    });

    // SEMANTIC WEB SYNTHESIS (Cross-Session Knowledge Web)
    const tagToNodes = new Map<string, string[]>();
    nodes.forEach(node => {
      const tags = node.metadata?.tags || node.tags || [];
      if (Array.isArray(tags)) {
        tags.forEach(tag => {
          if (!tagToNodes.has(tag)) tagToNodes.set(tag, []);
          tagToNodes.get(tag)?.push(String(node.id));
        });
      }
    });

    // Create Similarity Links for a "Web" feel
    tagToNodes.forEach((nodeIds, tag) => {
      if (nodeIds.length > 1) {
        for (let i = 0; i < nodeIds.length; i++) {
          for (let j = i + 1; j < nodeIds.length; j++) {
            processedLinks.push({
              source: nodeIds[i],
              target: nodeIds[j],
              type: 'semantic_similarity',
              strength: 0.3, // Subtle pull
              animated: false,
              label: `Topic: ${tag}`
            } as any);
          }
        }
      }
    });

    return { nodes: processedNodes, links: processedLinks };
  }, [nodes, edges]);

  useEffect(() => {
    if (!fgRef.current) return;
    
    const fg = fgRef.current;
    
    // PREMIUM PHYSICS ENGINE TUNING
    fg.d3Force('charge')?.strength(-300); // Stronger repulsion for clearer clusters
    fg.d3Force('link')?.distance((link: any) => {
      const isLineage = link.type === 'uses_model' || link.type === 'generated_by';
      const strength = link.strength || 0.5;
      const baseDist = isLineage ? 40 : 80; // Tighter causal links
      return baseDist * (1 - strength) + 30; 
    });
    
    // DEEP ZOOM & CAMERA CONTROLS
    const controls = fg.controls();
    if (controls) {
      // @ts-ignore
      controls.minDistance = 5;      // Microscopic zoom (inside nodes)
      // @ts-ignore
      controls.maxDistance = 10000;  // Macroscopic zoom (entire universe)
      // @ts-ignore
      controls.zoomSpeed = 2;      // More powerful zoom action
      // @ts-ignore
      controls.enableDamping = true; // Premium smooth feel
      // @ts-ignore
      controls.dampingFactor = 0.05;
    }

    // Stronger centering forces
    fg.d3Force('center')?.strength(0.15);
    // @ts-ignore - d3-force-3d types might be incomplete
    fg.d3Force('x', (THREE as any).forceX?.(0).strength(0.05));
    // @ts-ignore
    fg.d3Force('y', (THREE as any).forceY?.(0).strength(0.05));

  }, [graphData]);

  const getNodeColor = (node: any) => {
    // 1. High Priority: Direct type-based colors (Semantic Identity)
    if (COLOR_SYSTEM[node.type as string]) {
      return COLOR_SYSTEM[node.type as string];
    }
    
    // 2. Medium Priority: Cluster color
    if (node.cluster !== undefined) {
      const cluster = clusters.find(c => c.id === `cluster_${node.cluster}`);
      if (cluster?.color) return cluster.color;
    }
    
    // 3. Low Priority: Session color fallback
    const sessionColor = getSessionColor(node.session_id);
    if (sessionColor) return sessionColor;

    return COLOR_SYSTEM.default;
  };

  const getNodeThreeObject = (node: any) => {
    // NODE SIZING LOGIC based on multiple intelligence metrics
    const baseSize = 6;
    const importanceBoost = (node.importance || 0.5) * 10;
    const relevanceBoost = (node.relevanceScore || 0) * 8;
    const centralityBoost = (node.centrality || 0) * 5;
    const frequencyBoost = Math.log10(node.count || 1) * 4;
    
    const size = baseSize + importanceBoost + relevanceBoost + centralityBoost + frequencyBoost;

    const group = new THREE.Group();
    const isHovered = hoverNode && (
      hoverNode.id === node.id || 
      edges.some(e => (String(e.source) === String(hoverNode.id) && String(e.target) === String(node.id)) || 
                     (String(e.target) === String(hoverNode.id) && String(e.source) === String(node.id)))
    );

    const color = getNodeColor(node);
    
    // CUSTOM GEOMETRY PER TYPE (Nuclear Requirement)
    let geometry: THREE.BufferGeometry;
    switch (node.type) {
      case 'session':
        geometry = new THREE.CylinderGeometry(size, size, size * 0.5, 6); // Hexagon
        break;
      case 'insight':
      case 'intelligence':
        geometry = new THREE.OctahedronGeometry(size); // Diamond
        break;
      case 'tool_usage':
      case 'code':
      case 'file':
        geometry = new THREE.BoxGeometry(size * 1.2, size * 1.2, size * 1.2); // Rounded Square equivalent
        break;
      case 'error':
        geometry = new THREE.ConeGeometry(size, size * 1.5, 3); // Triangle
        break;
      case 'entity':
        geometry = new THREE.CapsuleGeometry(size * 0.5, size, 4, 8); // Capsule
        break;
      case 'external_knowledge':
      case 'url':
        geometry = new THREE.CylinderGeometry(size, size, size * 0.5, 8); // Octagon
        break;
      default:
        geometry = new THREE.SphereGeometry(size, 32, 32); // Orb/Circle
    }
    
    // TEMPORAL AGING & PULSE LOGIC
    const now = Date.now();
    const nodeTime = node.timestamp ? new Date(node.timestamp).getTime() : now;
    const ageSeconds = (now - nodeTime) / 1000;
    const isVeryRecent = ageSeconds < 60; // Less than 1 minute old
    
    // Memory Decay (m.md: Memory Aging)
    const decayFactor = Math.max(0.8, 1 - (ageSeconds / (3600 * 72))); // Very slow decay (72h)
    const opacity = 1.0; // Full solid opacity

    // Premium Material
    const material = new THREE.MeshPhysicalMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: isHovered ? 2.5 : (isVeryRecent ? 1.5 : 0.8),
      transparent: false, // Solid, non-transparent material
      opacity: 1.0,
      metalness: 0.1,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // Recent Pulse Animation (m.md: Recency Pulsing)
    if (isVeryRecent && !isHovered) {
      const pulseScale = 1 + Math.sin(Date.now() / 500) * 0.1;
      mesh.scale.set(pulseScale, pulseScale, pulseScale);
    }
    
    // Rotation for better visibility of 3D shapes
    if (node.type === 'session' || node.type === 'external_knowledge') {
      mesh.rotation.x = Math.PI / 2;
    }
    
    group.add(mesh);

    // INTELLIGENT GLOW / AURA SYSTEM
    const isImportant = (node.importance > 0.7 || node.relevanceScore > 0.8 || isHovered);
    if (isImportant) {
      const glowSize = size * (isHovered ? 1.6 : 1.3);
      const glowGeo = node.type === 'default' || !node.type ? 
        new THREE.SphereGeometry(glowSize, 32, 32) : 
        geometry.clone().scale(1.3, 1.3, 1.3);
        
      const glowMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: (isHovered ? 0.3 : 0.12) * decayFactor,
        side: THREE.BackSide
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      group.add(glowMesh);
    }

    return group;
  };

  // CINEMATIC CAMERA ENGINE
  useEffect(() => {
    if (mounted && fgRef.current) {
      const fg = fgRef.current;
      
      // Initial cinematic intro
      fg.cameraPosition({ z: 1000 }, { x: 0, y: 0, z: 0 }, 3000);
      
      // ATMOSPHERIC NEURAL PARTICLES
      const scene = fg.scene();
      const particlesGeometry = new THREE.BufferGeometry();
      const count = 2000;
      const positions = new Float32Array(count * 3);
      
      for (let i = 0; i < count * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 2000;
      }
      
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particlesMaterial = new THREE.PointsMaterial({
        size: 2,
        color: '#3b82f6',
        transparent: true,
        opacity: 0.1,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
      });
      
      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);
      
      // Slow particle drift animation
      let frame = 0;
      const animateParticles = () => {
        frame += 0.001;
        particles.rotation.y += 0.0005;
        particles.rotation.x += 0.0002;
        requestAnimationFrame(animateParticles);
      };
      animateParticles();
    }
  }, [mounted]);

  // HANDLE CINEMATIC FOCUS
  const handleNodeClick = (node: any) => {
    if (!fgRef.current) return;
    
    // Smooth cinematic fly-to
    const distance = 150;
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
    
    fgRef.current.cameraPosition(
      { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
      node,
      1200 // Transition duration in ms
    );
    
    onNodeClick(node);
  };

  if (!mounted) return null;

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#020617]">
      {/* CINEMATIC BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/15 via-transparent to-transparent"></div>
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>

      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        
        // PREMIUM LABEL SYSTEM
        nodeLabel={(node: any) => `
          <div style="background: rgba(2, 6, 23, 0.95); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(20px); min-width: 260px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); font-family: 'Inter', sans-serif;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${getNodeColor(node)}; box-shadow: 0 0 10px ${getNodeColor(node)};"></div>
                <span style="color: ${getNodeColor(node)}; font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;">${node.type}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                ${node.session_id ? `
                  <div style="padding: 2px 6px; border-radius: 4px; background: ${getSessionColor(node.session_id)}; color: #000; font-size: 8px; font-weight: 900; text-transform: uppercase;">
                    SESS:${node.session_id.slice(-4)}
                  </div>
                ` : ''}
                <span style="color: rgba(255,255,255,0.3); font-size: 10px; font-family: 'JetBrains Mono', monospace;">${node.id.length > 8 ? '...' + node.id.slice(-6) : node.id}</span>
              </div>
            </div>
            
            <div style="color: #f8fafc; font-size: 14px; line-height: 1.5; font-weight: 600; margin-bottom: 16px; border-left: 3px solid ${getNodeColor(node)}; padding-left: 12px;">
              ${node.label}
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <span style="color: rgba(255,255,255,0.4); font-size: 9px; text-transform: uppercase; font-weight: 700;">Importance</span>
                <span style="color: #fff; font-size: 12px; font-weight: 800;">${((node.importance || 0.5) * 100).toFixed(0)}%</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <span style="color: rgba(255,255,255,0.4); font-size: 9px; text-transform: uppercase; font-weight: 700;">Relevance</span>
                <span style="color: #fbbf24; font-size: 12px; font-weight: 800;">${((node.relevanceScore || 0) * 100).toFixed(0)}%</span>
              </div>
              ${node.count > 1 ? `
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <span style="color: rgba(255,255,255,0.4); font-size: 9px; text-transform: uppercase; font-weight: 700;">Recurrence</span>
                <span style="color: #10b981; font-size: 12px; font-weight: 800;">x${node.count}</span>
              </div>` : ''}
              ${node.session_id ? `
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <span style="color: rgba(255,255,255,0.4); font-size: 9px; text-transform: uppercase; font-weight: 700;">Session</span>
                <span style="color: #3b82f6; font-size: 12px; font-weight: 800;">Active</span>
              </div>` : ''}
            </div>
            
            ${node.metadata && Object.keys(node.metadata).length > 0 ? `
              <div style="margin-top: 12px; font-size: 10px; color: rgba(255,255,255,0.4); border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px;">
                Click to explore full semantic lineage
              </div>
            ` : ''}
          </div>
        `}
        
        linkLabel={(link: any) => `
          <div style="background: rgba(15, 23, 42, 0.9); padding: 6px 10px; border-radius: 6px; font-size: 11px; color: #f1f5f9; border: 1px solid rgba(255,255,255,0.1); font-family: 'Inter', sans-serif;">
            <span style="color: rgba(255,255,255,0.5); margin-right: 4px;">RELATION:</span>
            <span style="font-weight: 700; text-transform: uppercase;">${link.type || 'connected'}</span>
          </div>
        `}
        
        nodeThreeObject={getNodeThreeObject}
        nodeThreeObjectExtend={false}
        
        // CAUSAL LINEAGE LABELING
        linkLabel={(link: any) => `
          <div style="background: rgba(2, 6, 23, 0.95); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px); color: #fff; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; pointer-events: none;">
            <span style="color: ${getNodeColor(link.source)}; opacity: 0.8;">${link.type || 'relates_to'}</span>
          </div>
        `}
        
        // PREMIUM EDGE RENDERING
        linkColor={(link: any) => {
          const color = getNodeColor(link.source);
          return color; // Use solid source color
        }}
        
        linkWidth={(link: any) => {
          const isLineage = link.type === 'uses_model' || link.type === 'generated_by';
          const baseWidth = isLineage ? 2.5 : 1.2;
          const strengthBoost = (link.strength || 0.5) * 4;
          return baseWidth + strengthBoost;
        }}
        
        linkDirectionalParticles={(link: any) => link.type === 'generated_by' ? 6 : 3}
        linkDirectionalParticleSpeed={(link: any) => (link.strength || 0.5) * 0.012 + 0.002}
        linkDirectionalParticleWidth={(link: any) => {
          const isLineage = link.type === 'uses_model' || link.type === 'generated_by';
          return isLineage ? 5 : 2;
        }}
        linkDirectionalParticleColor={(link: any) => getNodeColor(link.source)}
        
        linkCurvature={0.25}
        linkDirectionalArrowLength={12}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={() => '#ffffff'}
        
        onNodeClick={handleNodeClick}
        onNodeHover={(node) => setHoverNode(node)}
        
        backgroundColor="rgba(0,0,0,0)" // Controlled by wrapper
        showNavInfo={false}
        enableNodeDrag={true}
        enablePointerInteraction={true}
      />

      {/* GRAPH CONTROLS OVERLAY (PREMIUM UI) */}
      <div className={`
        absolute bottom-8 left-8 md:bottom-12 md:left-12 transition-all duration-700 ease-in-out z-20
        ${isEngineCollapsed ? 'w-12 h-12 md:w-16 md:h-16 rounded-2xl cursor-pointer hover:scale-110 active:scale-95' : 'w-auto max-w-[calc(100vw-4rem)] h-auto rounded-2xl'}
        bg-slate-900/80 backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden
      `}
      onClick={() => isEngineCollapsed && setIsEngineCollapsed(false)}
      >
        {isEngineCollapsed ? (
          <div className="w-full h-full flex items-center justify-center bg-blue-500/10 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
          </div>
        ) : (
          <div className="p-4 md:p-5 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between gap-8 px-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Cognitive Engine</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEngineCollapsed(true);
                }}
                className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
              >
                <ChevronDown size={12} />
              </button>
            </div>
            <div className="h-[1px] w-full bg-white/5"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Nodes</span>
                <span className="text-base font-mono font-black text-white tabular-nums">{nodes.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Links</span>
                <span className="text-base font-mono font-black text-blue-400 tabular-nums">{edges.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


