from fastapi import APIRouter
from typing import Dict, List, Any
import asyncio

router = APIRouter()

# Temporary in-memory state (safe fallback)
# Structure: { session_id: { "goal": str, "progress": int, "logs": List[str] } }
STATE_STORE: Dict[str, Dict[str, Any]] = {}

from app.utils.response import wrap_response

@router.get("/state/{session_id}")
async def get_state(session_id: str):
    """Retrieve the current state for a given session explorer."""
    try:
        data = STATE_STORE.get(session_id, {
            "goal": "Not specified",
            "progress": 0,
            "logs": ["System initialized", "Waiting for input..."]
        })
        return wrap_response(data=data)
    except Exception as e:
        return wrap_response(success=False, error=str(e))

def update_session_state(session_id: str, goal: str = None, progress: int = None, log: str = None):
    """Internal helper to update the state store safely."""
    from app.core.ws_manager import ws_manager
    
    if session_id not in STATE_STORE:
        STATE_STORE[session_id] = {
            "goal": "Not specified",
            "progress": 0,
            "logs": ["Session initialized"]
        }
    
    if goal:
        STATE_STORE[session_id]["goal"] = goal
    if progress is not None:
        STATE_STORE[session_id]["progress"] = min(100, max(0, progress))
    if log:
        STATE_STORE[session_id]["logs"].append(log)
        if len(STATE_STORE[session_id]["logs"]) > 20:
            STATE_STORE[session_id]["logs"] = STATE_STORE[session_id]["logs"][-20:]
            
    # Broadcast update via WebSocket
    try:
        asyncio.create_task(ws_manager.broadcast({
            "type": "state_explorer_update",
            "session_id": session_id,
            "data": STATE_STORE[session_id]
        }, client_id=session_id))
    except:
        pass
