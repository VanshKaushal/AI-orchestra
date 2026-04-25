import time
from typing import List, Dict, Any

# In-memory store for AI reasoning events
EVENT_STORE: List[Dict[str, Any]] = []

def log_event(event_type: str, data: Dict[str, Any]):
    """
    Log an event to the global store without interrupting main execution.
    Only capture essential metadata.
    """
    EVENT_STORE.append({
        "type": event_type,
        "data": data,
        "timestamp": time.time()
    })

def get_events():
    """Retrieve all logged events."""
    return EVENT_STORE

def clear_events():
    """Clear all events (useful for testing or session reset)."""
    global EVENT_STORE
    EVENT_STORE = []
