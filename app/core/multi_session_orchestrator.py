import asyncio
import uuid
import time
from typing import Dict, List, Optional, Any
from datetime import datetime
from app.models.schemas import LLMProvider, Message, MessageRole
from app.core.orchestrator import Orchestrator
from app.core.watchdog import watchdog
from app.utils.logger import logger
from app.core.ws_manager import ws_manager
from app.api.state import update_session_state


class Session:
    """Represents a single AI session running in parallel"""

    def __init__(
        self,
        session_id: str,
        task: str,
        model: LLMProvider = LLMProvider.OLLAMA
    ):
        self.session_id = session_id
        self.task = task
        self.model = model
        self.local_summary = ""
        self.status = "waiting"
        self.created_at = datetime.now()
        self.messages: List[Dict[str, Any]] = []
        self._task = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "task": self.task,
            "model": self.model.value,
            "local_summary": self.local_summary,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "message_count": len(self.messages)
        }


class MultiSessionOrchestrator:
    """Orchestrator for managing multiple parallel AI sessions.
    
    Allows:
    - Multiple sessions running simultaneously
    - Each session handles a different task
    - Sessions are isolated but share global knowledge
    - Watchdog auto-resolves questions
    """

    def __init__(self):
        try:
            self.sessions: Dict[str, Session] = getattr(self, "sessions", {}) or {}
        except:
            self.sessions = {}
            
        self.orchestrator = Orchestrator()
        self._running_tasks: Dict[str, asyncio.Task] = {}
        logger.info("MultiSessionOrchestrator initialized")

    def get_all_sessions(self) -> List[Dict[str, Any]]:
        """List all sessions safely (Phase 1 Fix)"""
        try:
            if not self.sessions:
                return []
            return [s.to_dict() for s in self.sessions.values()]
        except Exception as e:
            logger.error(f"Error listing sessions: {e}")
            return []

    def get_state(self) -> Dict[str, Any]:
        """Get global state safely (Phase 2 Fix)"""
        try:
            return self.get_global_state()
        except Exception as e:
            logger.error(f"Error getting state: {e}")
            return {"status": "error", "sessions": []}

    def create_session(self, task: str, model: str = "ollama") -> Session:
        """Create a new session"""
        session_id = str(uuid.uuid4())[:8]
        
        try:
            provider = LLMProvider(model)
        except ValueError:
            provider = LLMProvider.OLLAMA
        
        session = Session(session_id=session_id, task=task, model=provider)
        self.sessions[session_id] = session
        
        logger.info(f"Created session {session_id}: {task}")
        asyncio.create_task(ws_manager.broadcast({
            "type": "session_created",
            "data": session.to_dict()
        }))
        # Also broadcast global state update
        asyncio.create_task(ws_manager.broadcast({
            "type": "global_state_update",
            "data": self.get_global_state()
        }, client_id="global"))
        
        return session

    def get_session(self, session_id: str) -> Optional[Session]:
        """Get a session by ID"""
        return self.sessions.get(session_id)

    def list_sessions(self) -> List[Dict[str, Any]]:
        """List all sessions"""
        return [s.to_dict() for s in self.sessions.values()]

    def delete_session(self, session_id: str) -> bool:
        """Delete a session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            
            if session_id in self._running_tasks:
                self._running_tasks[session_id].cancel()
                del self._running_tasks[session_id]
            
            logger.info(f"Deleted session {session_id}")
            return True
        return False

    async def send_message(
        self,
        session_id: str,
        message_text: str,
        use_watchdog: bool = True
    ) -> Dict[str, Any]:
        """Send a message to a session and get response"""
        session = self.sessions.get(session_id)
        if not session:
            return {"error": "Session not found"}
        
        session.status = "running"
        
        # Phase 2: Update State Explorer (Silent Hook)
        try:
            update_session_state(
                session_id, 
                goal=session.task, 
                log=f"Received input: {message_text[:30]}..."
            )
        except:
            pass

        try:
            from app.models.schemas import ChatRequest
            request = ChatRequest(
                message=message_text,
                user_id=f"session_{session_id}",
                force_provider=session.model
            )
            
            # 1. Create User Message Object
            user_msg = Message(
                session_id=session_id,
                role=MessageRole.USER,
                content=message_text
            )
            session.messages.append(user_msg.dict())
            
            # 2. Process with Orchestrator
            response = await self.orchestrator.process(request)
            
            final_response_text = response.response
            auto_answer = None
            
            if use_watchdog:
                wd_result = watchdog.process_response(response.response)
                if wd_result["auto_answer"]:
                    auto_answer = wd_result["auto_answer"]
                    final_response_text = watchdog.inject_answer(
                        response.response,
                        auto_answer
                    )
            
            # 3. Create Assistant Message Object
            assistant_msg = Message(
                session_id=session_id,
                role=MessageRole.ASSISTANT,
                content=final_response_text,
                provider=response.provider,
                tokens_used=response.tokens_used,
                cost=response.cost
            )
            session.messages.append(assistant_msg.dict())
            
            session.local_summary = self._build_summary(session)
            session.status = "waiting"
            
            # Phase 2: Update State Explorer (Success Hook)
            try:
                progress = min(100, len(session.messages) * 10)
                update_session_state(
                    session_id, 
                    progress=progress,
                    log=f"Model {response.provider.value} responded. Context updated."
                )
            except:
                pass
            
            # 4. Broadcast via WebSocket (The single source for AI responses)
            await ws_manager.broadcast({
                "type": "message",
                "session_id": session_id,
                "data": assistant_msg.dict()
            }, client_id=session_id)
            
            if auto_answer:
                await ws_manager.broadcast({
                    "type": "watchdog_log",
                    "session_id": session_id,
                    "data": {"log": f"Watchdog auto-answered: {auto_answer}"}
                }, client_id=session_id)
            
            # 5. Return response for REST (Frontend will use this as fallback)
            return {
                "message_id": assistant_msg.id,
                "response": final_response_text,
                "provider": response.provider.value,
                "tokens_used": response.tokens_used,
                "cost": response.cost,
                "auto_answer": auto_answer,
                "session": session.to_dict()
            }
            
        except Exception as e:
            session.status = "error"
            logger.error(f"Session {session_id} error: {e}")
            return {"error": str(e)}

    def _build_summary(self, session: Session) -> str:
        """Build local summary for session"""
        if not session.messages:
            return "New session"
        
        last_msgs = session.messages[-3:]
        summary_parts = [f"Task: {session.task}"]
        
        for msg in last_msgs:
            role = msg.get("role", "unknown")
            content = msg.get("content", "")[:50]
            summary_parts.append(f"{role}: {content}...")
        
        return " | ".join(summary_parts)

    async def run_session_task(self, session_id: str, initial_message: str) -> Dict[str, Any]:
        """Run a session task (for background execution)"""
        return await self.send_message(session_id, initial_message)

    def switch_model(self, session_id: str, model: str) -> bool:
        """Switch the model for a session"""
        session = self.sessions.get(session_id)
        if not session:
            return False
        
        try:
            session.model = LLMProvider(model)
            logger.info(f"Session {session_id} switched to {model}")
            asyncio.create_task(ws_manager.broadcast({
                "type": "model_switched",
                "session_id": session_id,
                "data": {"model": model}
            }, client_id=session_id))
            return True
        except ValueError:
            logger.warning(f"Invalid model: {model}")
            return False

    def get_session_state(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session state"""
        session = self.sessions.get(session_id)
        if session:
            return session.to_dict()
        return None

    async def run_command(self, command: str) -> Dict[str, Any]:
        """Run a shell command asynchronously"""
        try:
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            
            return {
                "success": process.returncode == 0,
                "stdout": stdout.decode() if stdout else "",
                "stderr": stderr.decode() if stderr else "",
                "returncode": process.returncode
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_global_state(self) -> Dict[str, Any]:
        """Get global state across all sessions"""
        try:
            # Get raw state dict instead of string summary for API use
            state_dict = self.orchestrator.state_manager.to_dict("default")
            
            return {
                "total_sessions": len(self.sessions),
                "running_sessions": sum(1 for s in self.sessions.values() if s.status == "running"),
                "sessions": self.list_sessions(),
                "orchestrator_state": {
                    "current_goal": state_dict.get("goal", "Active Orchestration"),
                    "completion_percentage": "50", # Mock progress
                    "pending_tasks": state_dict.get("open_tasks", [])
                }
            }
        except Exception as e:
            logger.error(f"Error in get_global_state: {e}")
            return {
                "total_sessions": 0,
                "running_sessions": 0,
                "sessions": [],
                "orchestrator_state": {
                    "current_goal": "System Initializing",
                    "completion_percentage": "0",
                    "pending_tasks": []
                }
            }


multi_session_orchestrator = MultiSessionOrchestrator()