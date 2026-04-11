import uuid
from typing import Dict, List, Optional
from datetime import datetime
from app.core.multi_session_orchestrator import multi_session_orchestrator, Session
from app.utils.logger import logger


class SessionManager:
    """Manages AI sessions - create, list, switch, delete"""

    def __init__(self):
        self.orchestrator = multi_session_orchestrator

    def create(self, task: str, model: str = "ollama") -> Dict:
        """Create a new session"""
        session = self.orchestrator.create_session(task, model)
        return {
            "session_id": session.session_id,
            "task": session.task,
            "model": session.model.value,
            "status": session.status
        }

    def list_all(self) -> List[Dict]:
        """List all sessions"""
        return self.orchestrator.list_sessions()

    def get(self, session_id: str) -> Optional[Dict]:
        """Get a specific session"""
        session = self.orchestrator.get_session(session_id)
        if session:
            return session.to_dict()
        return None

    def delete(self, session_id: str) -> bool:
        """Delete a session"""
        return self.orchestrator.delete_session(session_id)

    def switch_model(self, session_id: str, model: str) -> bool:
        """Switch model for a session"""
        return self.orchestrator.switch_model(session_id, model)

    def get_state(self, session_id: str) -> Optional[Dict]:
        """Get session state"""
        return self.orchestrator.get_session_state(session_id)

    def global_state(self) -> Dict:
        """Get global state"""
        return self.orchestrator.get_global_state()


session_manager = SessionManager()