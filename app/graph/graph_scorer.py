import time
from typing import List, Dict
from .graph_models import GraphNode, GraphEdge

def score_nodes(nodes: List[GraphNode], edges: List[GraphEdge]) -> List[GraphNode]:
    """
    Apply importance scoring to nodes based on:
    - Frequency: How many edges connect to it.
    - Recency: How new the node is.
    - Connectivity: Distance to high-importance nodes.
    """
    now = time.time()
    
    # Map edges for quick lookup
    connection_counts: Dict[str, int] = {}
    for edge in edges:
        connection_counts[edge.source] = connection_counts.get(edge.source, 0) + 1
        connection_counts[edge.target] = connection_counts.get(edge.target, 0) + 1

    for node in nodes:
        # Base importance
        score = 1.0
        
        # 1. Connectivity Score (Direct connections)
        connectivity = connection_counts.get(node.id, 0)
        score += connectivity * 0.5
        
        # 2. Recency Score (Nodes created in the last 10 minutes get a boost)
        age = now - node.timestamp
        if age < 600:  # 10 minutes
            recency_boost = (600 - age) / 600
            score += recency_boost * 2.0
            
        # 3. Type-based weights
        type_weights = {
            "goal": 2.0,
            "insight": 3.0,
            "session": 1.5,
            "task": 1.0,
            "llm": 0.8,
            "output": 0.5
        }
        score *= type_weights.get(node.type, 1.0)
        
        node.importance = round(score, 2)
        
    return nodes
