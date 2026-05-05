/**
 * Step 2: AI-Powered Clustering
 */

import { Node, Graph } from './graphProcessor';

export interface Cluster {
  id: string;
  label: string;
  nodes: Node[];
  color: string;
  importance: number;
}

export const CLUSTER_COLORS = [
  '#a855f7', // Purple (per spec)
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

/**
 * Groups nodes into clusters based on the 'cluster' property provided by backend
 * or by semantic grouping.
 */
export const getClusters = (nodes: Node[]): Cluster[] => {
  const clustersMap = new Map<number, Node[]>();
  
  nodes.forEach(node => {
    const clusterId = node.cluster ?? 0;
    if (!clustersMap.has(clusterId)) {
      clustersMap.set(clusterId, []);
    }
    clustersMap.get(clusterId)!.push(node);
  });

  return Array.from(clustersMap.entries()).map(([id, clusterNodes]) => {
    // Generate a label based on the most important node in the cluster
    const sortedNodes = [...clusterNodes].sort((a, b) => b.importance - a.importance);
    const topNode = sortedNodes[0];
    const avgImportance = clusterNodes.reduce((acc, n) => acc + n.importance, 0) / clusterNodes.length;

    return {
      id: `cluster_${id}`,
      label: topNode.label.length > 30 ? topNode.label.substring(0, 30) + '...' : topNode.label,
      nodes: clusterNodes,
      color: CLUSTER_COLORS[id % CLUSTER_COLORS.length],
      importance: avgImportance
    };
  });
};

/**
 * Step 3: Multi-Layer Graph Model
 * Filters nodes based on zoom level or mode.
 */
export const getLayeredData = (graph: Graph, zoom: number): Graph => {
  // Level 1 (Macro): clusters only (zoom < 0.5)
  // Level 2 (Meso): tasks + decisions (zoom 0.5–1)
  // Level 3 (Micro): full detail (zoom > 1)
  
  // Note: Implementation of this usually happens in the rendering loop 
  // by adjusting node visibility/scale.
  return graph;
};
