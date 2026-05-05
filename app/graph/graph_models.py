from pydantic import BaseModel
from typing import Dict, Any, List, Optional

class GraphNode(BaseModel):
    id: str
    type: str  # goal, task, decision, session, llm, topic, output, insight
    label: str
    importance: float = 0.0
    timestamp: float
    metadata: Dict[str, Any] = {}
    cluster: Optional[int] = None

class GraphEdge(BaseModel):
    source: str
    target: str
    type: str  # HAS_TASK, DEPENDS_ON, USED_MODEL, GENERATED, etc.
    weight: float = 1.0

class GraphData(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
