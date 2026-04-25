from fastapi import APIRouter, Query
from typing import Optional
from .graph_builder import build_graph
from .graph_scorer import score_nodes
from .graph_models import GraphData

router = APIRouter()

@router.get("", response_model=GraphData)
async def get_graph(session_id: Optional[str] = Query(None, description="Optional session ID to filter graph")):
    """
    Get the cognitive graph of AI reasoning events.
    Returns nodes and edges scaled by importance.
    """
    nodes, edges = build_graph(session_id)
    
    # Score nodes
    nodes = score_nodes(nodes, edges)
    
    # Performance Safety: Limit to top 100 most important nodes
    nodes = sorted(nodes, key=lambda x: x.importance, reverse=True)[:100]
    
    # Filter edges to only include those where both nodes are in the final set
    node_ids = {n.id for n in nodes}
    filtered_edges = [e for e in edges if e.source in node_ids and e.target in node_ids]
    
    return GraphData(nodes=nodes, edges=filtered_edges)
