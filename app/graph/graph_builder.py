import time
from typing import List, Dict, Any, Tuple
from .graph_models import GraphNode, GraphEdge
from .event_store import EVENT_STORE

def build_graph(session_id: str = None) -> Tuple[List[GraphNode], List[GraphEdge]]:
    """
    Process events into nodes and edges.
    If session_id is provided, filter for that session.
    """
    events = EVENT_STORE
    if session_id:
        events = [e for e in events if e.get("data", {}).get("session_id") == session_id]

    nodes_dict: Dict[str, GraphNode] = {}
    edges: List[GraphEdge] = []

    for event in events:
        etype = event["type"]
        data = event["data"]
        ts = event["timestamp"]

        if etype == "session_created":
            sid = data["session_id"]
            node_id = f"session_{sid}"
            if node_id not in nodes_dict:
                nodes_dict[node_id] = GraphNode(
                    id=node_id,
                    type="session",
                    label=f"Session: {data.get('task', 'Untitled')[:20]}...",
                    timestamp=ts,
                    metadata=data
                )
            
            # Add goal node
            goal_id = f"goal_{sid}"
            nodes_dict[goal_id] = GraphNode(
                id=goal_id,
                type="goal",
                label=data.get("task", "Goal"),
                timestamp=ts,
                metadata={"session_id": sid}
            )
            edges.append(GraphEdge(source=node_id, target=goal_id, type="HAS_GOAL"))

        elif etype == "message_processed":
            sid = data.get("session_id")
            if not sid: continue
            
            mid = f"msg_{int(ts * 1000)}"
            nodes_dict[mid] = GraphNode(
                id=mid,
                type="task",
                label=f"Task: {data.get('message', '')[:30]}...",
                timestamp=ts,
                metadata=data
            )
            
            session_node_id = f"session_{sid}"
            if session_node_id in nodes_dict:
                edges.append(GraphEdge(source=session_node_id, target=mid, type="HAS_TASK"))

        elif etype == "response_generated":
            sid = data.get("session_id")
            if not sid: continue
            
            rid = f"resp_{int(ts * 1000)}"
            model_name = data.get("model", "unknown")
            
            # Model node
            model_id = f"model_{model_name}"
            if model_id not in nodes_dict:
                nodes_dict[model_id] = GraphNode(
                    id=model_id,
                    type="llm",
                    label=f"Model: {model_name}",
                    timestamp=ts,
                    metadata={"provider": model_name}
                )

            # Response node
            nodes_dict[rid] = GraphNode(
                id=rid,
                type="output",
                label=f"Response ({model_name})",
                timestamp=ts,
                metadata=data
            )
            
            # Edges
            edges.append(GraphEdge(source=model_id, target=rid, type="GENERATED"))
            
            # Connect response to its session or last task
            # For simplicity, connect to session
            session_node_id = f"session_{sid}"
            if session_node_id in nodes_dict:
                edges.append(GraphEdge(source=rid, target=session_node_id, type="RESULT_OF"))

    # Add insight nodes (Optional Logic)
    # Example: If a session has many messages, add a potential bottleneck insight
    session_message_counts = {}
    for e in events:
        if e["type"] == "message_processed":
            sid = e["data"].get("session_id")
            if sid:
                session_message_counts[sid] = session_message_counts.get(sid, 0) + 1
    
    for sid, count in session_message_counts.items():
        if count > 5:
            insight_id = f"insight_bottleneck_{sid}"
            nodes_dict[insight_id] = GraphNode(
                id=insight_id,
                type="insight",
                label="Potential Bottleneck Detected",
                timestamp=time.time(),
                metadata={"reason": "High interaction volume", "session_id": sid}
            )
            edges.append(GraphEdge(source=f"session_{sid}", target=insight_id, type="HAS_INSIGHT"))

    return list(nodes_dict.values()), edges
