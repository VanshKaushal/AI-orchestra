import { GraphNode as Node, GraphEdge as Edge, GraphData as Graph } from '../types/graph';
import { sanitizeGraph } from './graphSanitizer';

/**
 * 1. normalizeNodes(graph)
 * - Remove duplicate nodes (same text + type)
 * - Assign unique IDs
 * - Normalize labels (remove provider spam)
 * - Step 6: Node Deduplication
 */
export const normalizeNodes = (graph: Graph): Graph => {
  const seen = new Map<string, Node>();
  const mergedNodes: Node[] = [];
  const idMap = new Map<string, string>(); // Original ID -> Winner ID

  graph.nodes.forEach(node => {
    // Normalize labels
    let cleanLabel = node.label
      .replace(/\(ollama\)/gi, '')
      .replace(/\(openai\)/gi, '')
      .replace(/\(anthropic\)/gi, '')
      .trim();
    
    // Deduplication key: text + type + provider (if available)
    const provider = node.metadata?.model || node.metadata?.provider || '';
    const key = `${cleanLabel.toLowerCase()}_${node.type}_${provider}`;
    
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      existing.count = (existing.count || 1) + (node.count || 1);
      existing.importance = Math.max(existing.importance, node.importance);
      idMap.set(node.id, existing.id);
    } else {
      const newNode = { 
        ...node, 
        label: cleanLabel, 
        count: node.count || 1,
      };
      seen.set(key, newNode);
      mergedNodes.push(newNode);
      idMap.set(node.id, node.id);
    }
  });

  // Re-map edges
  const mergedEdges: Edge[] = graph.edges.map(edge => ({
    ...edge,
    source: idMap.get(edge.source) || edge.source,
    target: idMap.get(edge.target) || edge.target
  })).filter(edge => edge.source !== edge.target); // Remove self-loops after merge

  // Remove duplicate edges
  const uniqueEdgesMap = new Map<string, Edge>();
  mergedEdges.forEach(edge => {
    const key = `${edge.source}_${edge.target}_${edge.type}`;
    if (!uniqueEdgesMap.has(key)) {
      uniqueEdgesMap.set(key, edge);
    }
  });

  return { 
    nodes: mergedNodes, 
    edges: Array.from(uniqueEdgesMap.values()) 
  };
};

/**
 * 2. categorizeNodes(node)
 */
export const categorizeNodes = (node: Node): string => {
  const types = ['goal', 'task', 'response', 'model', 'insight'];
  if (types.includes(node.type)) return node.type;
  if (node.type === 'output' || node.type === 'llm') return 'response';
  return 'task';
};

/**
 * 3. buildHierarchy(graph)
 */
export const buildHierarchy = (graph: Graph): Graph => {
  const nodes = [...graph.nodes];
  graph.edges.forEach(edge => {
    if (['HAS_TASK', 'GENERATED', 'DEPENDS_ON'].includes(edge.type || '')) {
      const target = nodes.find(n => n.id === edge.target);
      // @ts-ignore - parent is a dynamic field for hierarchy
      if (target) target.parent = edge.source;
    }
  });
  return { nodes, edges: graph.edges };
};

/**
 * Process entire graph through the pipeline
 */
export const processGraph = (rawGraph: any): Graph => {
  const sanitized = sanitizeGraph(rawGraph);
  let g = normalizeNodes(sanitized);
  g = buildHierarchy(g);
  return g;
};
