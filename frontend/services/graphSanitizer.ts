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
      type: node?.type ?? "task",
      importance: typeof node?.importance === "number" ? node.importance : 0,
      cluster: typeof node?.cluster === "number" ? node.cluster : undefined,
      metadata: node?.metadata ?? {},
      count: typeof node?.count === "number" ? node.count : 1
    }));

  const safeEdges = (graph.edges || [])
    .filter((e: any) => e && e.source && e.target)
    .map((e: any) => ({
      source: e.source,
      target: e.target,
      weight: typeof e.weight === "number" ? e.weight : 1.0,
      type: e.type ?? "relation"
    }));

  return {
    nodes: safeNodes,
    edges: safeEdges
  };
}
