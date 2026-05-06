"use client";

import React, { useRef, useEffect, useMemo } from 'react';
import ForceGraph3D, { ForceGraphMethods } from 'react-force-graph-3d';
import { GraphNode as Node, GraphEdge as Edge } from '../types/graph';
import { Cluster } from '../services/clusterEngine';
import * as THREE from 'three';

interface GraphCanvas3DProps {
  nodes: Node[];
  edges: Edge[];
  clusters: Cluster[];
  zoom: number;
  onNodeClick: (node: any) => void;
}

export default function GraphCanvas3D({ nodes, edges, clusters, onNodeClick }: GraphCanvas3DProps) {
  const fgRef = useRef<ForceGraphMethods>();
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const graphData = useMemo(() => {
    return {
      nodes: nodes.map(n => ({
        ...n,
        // Visual properties
        color: n.cluster !== undefined ? undefined : '#3b82f6', // Use cluster color if available
      })),
      links: edges.map(e => ({
        ...e,
        source: e.source,
        target: e.target
      }))
    };
  }, [nodes, edges]);

  useEffect(() => {
    if (!fgRef.current) return;
    
    // Step 4: Hybrid Layout Engine configuration
    const fg = fgRef.current;
    
    // Stronger repulsion between clusters
    fg.d3Force('charge')?.strength(-100);
    
    // Link distance based on type
    fg.d3Force('link')?.distance((link: any) => {
      return link.type === 'semantic' ? 150 : 50;
    });

    // Shift center to the left
    fg.d3Force('center')?.x(-150);

  }, [graphData]);

  // Node styling based on type (Step 5)
  const getNodeColor = (node: any) => {
    if (node.cluster !== undefined) {
      const cluster = clusters.find(c => c.id === `cluster_${node.cluster}`);
      return cluster?.color || '#a855f7';
    }
    switch (node.type) {
      case 'goal': return '#ef4444';
      case 'task': return '#eab308';
      case 'insight': return '#f97316';
      default: return '#3b82f6';
    }
  };

  const getNodeThreeObject = (node: any) => {
    // Step 3: Multi-Layer Visibility logic (based on importance/type)
    // We'll use the 'val' for radius and opacity for depth
    
    let size = 8;
    if (node.importance > 5) size = 15;
    if (node.importance > 8) size = 22;

    const group = new THREE.Group();

    // The Node Sphere
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: getNodeColor(node),
      emissive: getNodeColor(node),
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    // Step 6: Deduplication Badge (x5)
    if (node.count && node.count > 1) {
      // Simple representation of a badge
      const badgeGeometry = new THREE.SphereGeometry(size * 0.4, 16, 16);
      const badgeMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff' });
      const badge = new THREE.Mesh(badgeGeometry, badgeMaterial);
      badge.position.set(size, size, 0);
      group.add(badge);
    }

    return group;
  };

  if (!mounted) return null;

  return (
    <div className="w-full h-full bg-black">
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeLabel={(node: any) => `
          <div style="background: rgba(0,0,0,0.9); padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(8px); min-width: 200px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="color: ${getNodeColor(node)}; font-size: 10px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase;">${node.type}</span>
              <span style="color: #555; font-size: 9px; font-family: monospace;">ID: ${node.id.split('_').pop()}</span>
            </div>
            <div style="color: #fff; font-size: 13px; line-height: 1.4; font-weight: 500; margin-bottom: 12px; border-left: 2px solid ${getNodeColor(node)}; padding-left: 10px;">
              ${node.label}
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; border-top: 1px solid rgba(255,255,255,0.05); pt: 8px; margin-top: 8px;">
              <div style="display: flex; flex-direction: column;">
                <span style="color: #555; font-size: 9px; text-transform: uppercase;">Importance</span>
                <span style="color: #fff; font-size: 11px; font-weight: 700;">${node.importance.toFixed(2)}</span>
              </div>
              ${node.count > 1 ? `
              <div style="display: flex; flex-direction: column;">
                <span style="color: #555; font-size: 9px; text-transform: uppercase;">Merged</span>
                <span style="color: #10b981; font-size: 11px; font-weight: 700;">x${node.count}</span>
              </div>` : ''}
              ${node.cluster !== undefined ? `
              <div style="display: flex; flex-direction: column;">
                <span style="color: #555; font-size: 9px; text-transform: uppercase;">Cluster</span>
                <span style="color: #a855f7; font-size: 11px; font-weight: 700;">#${node.cluster}</span>
              </div>` : ''}
            </div>
          </div>
        `}
        nodeThreeObject={getNodeThreeObject}
        nodeThreeObjectExtend={false}
        linkColor={(link: any) => link.type === 'semantic' ? '#aaa' : '#666'}
        linkWidth={(link: any) => link.type === 'semantic' ? 2 : 1}
        linkDirectionalArrowColor={() => '#fff'}
        linkDirectionalArrowLength={10}
        linkDirectionalArrowRelPos={0.75}
        linkDirectionalParticles={4}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleWidth={2}
        linkCurvature={0.2}
        onNodeClick={onNodeClick}
        backgroundColor="#000"
        showNavInfo={false}
        enableNodeDrag={true}
        enablePointerInteraction={true}
      />
    </div>
  );
}
