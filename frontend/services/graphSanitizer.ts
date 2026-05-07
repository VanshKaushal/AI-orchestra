/**
 * Step 2: BUILD SANITIZATION LAYER (MANDATORY)
 */

import { GraphData, GraphNode } from '../types/graph';

export function sanitizeGraph(graph: any): GraphData {
  if (!graph) return { nodes: [], edges: [] };

  const safeNodes: GraphNode[] = (graph.nodes || [])
    .filter(Boolean) // remove undefined/null
    .map((node: any, index: number) => ({
      id: node?.id ?? `node-${index}`,
      label: node?.label ?? "Unknown",
      type: node?.type ?? "topic",
      importance: typeof node?.importance === "number" ? node.importance : 0.5,
      relevanceScore: typeof node?.relevanceScore === "number" ? node.relevanceScore : 0,
      centrality: typeof node?.centrality === "number" ? node.centrality : 0,
      cluster: typeof node?.cluster === "number" ? node.cluster : undefined,
      metadata: node?.metadata ?? {},
      count: typeof node?.count === "number" ? node.count : 1,
      timestamp: node?.timestamp,
      embedding: Array.isArray(node?.embedding) ? node.embedding : undefined,
      session_id: node?.session_id
    }));

  const safeEdges: GraphEdge[] = (graph.edges || [])
    .filter((e: any) => e && e.source && e.target)
    .map((e: any) => ({
      source: typeof e.source === 'object' ? e.source.id : e.source,
      target: typeof e.target === 'object' ? e.target.id : e.target,
      weight: typeof e.weight === "number" ? e.weight : 1.0,
      type: e.type ?? "relation",
      strength: typeof e.strength === "number" ? e.strength : 0.5,
      label: e.label,
      animated: !!e.animated
    }));

  return {
    nodes: safeNodes,
    edges: safeEdges
  };
}

