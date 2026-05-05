from fastapi import APIRouter, Query
from typing import Optional
from .graph_builder import build_graph
from .graph_scorer import score_nodes
from .graph_models import GraphData
from typing import Optional, Dict, Any
from app.services.graph_ai_enricher import GraphAIEnricher

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

@router.get("/ai/{session_id}")
async def get_ai_graph(
    session_id: str,
    threshold: float = Query(0.7, description="Similarity threshold for semantic edges"),
    k: int = Query(5, description="Number of clusters")
):
    """
    Get the AI-enriched cognitive graph.
    Includes clusters and semantic edges.
    """
    # Fetch existing graph via existing function
    nodes, edges = build_graph(session_id)
    
    # Score nodes
    nodes = score_nodes(nodes, edges)
    
    # Performance Safety: Limit to top 100 most important nodes
    nodes = sorted(nodes, key=lambda x: x.importance, reverse=True)[:100]
    
    # Filter edges to only include those where both nodes are in the final set
    node_ids = {n.id for n in nodes}
    filtered_edges = [e for e in edges if e.source in node_ids and e.target in node_ids]
    
    # Pass graph -> graph_ai_enricher
    enriched_graph = GraphAIEnricher.enrich_graph(nodes, filtered_edges, threshold=threshold, k=k)
    
    return enriched_graph
