from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse
from app.core.orchestrator import Orchestrator
from app.sessions.session_manager import session_manager

router = APIRouter()
orchestrator = Orchestrator()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat endpoint for AI Orchestra"""
    try:
        response = await orchestrator.process(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


@router.get("/stats")
async def stats():
    """Get usage statistics"""
    return {"summary": orchestrator.get_usage_summary()}


@router.get("/state/{user_id}")
async def get_state(user_id: str = "default"):
    """Get conversation state for a user"""
    return {"state": orchestrator.get_state_summary(user_id)}


@router.post("/switch/{user_id}")
async def switch_provider(user_id: str, provider: str):
    """Manually switch provider for a user"""
    from app.models.schemas import LLMProvider
    try:
        p = LLMProvider(provider)
        result = orchestrator.switch_provider(p)
        return {"success": result, "provider": provider}
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid provider: {provider}")


@router.post("/sessions")
async def create_session(task: str, model: str = "ollama"):
    """Create a new session"""
    try:
        result = session_manager.create(task, model)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions")
async def list_sessions():
    """List all sessions"""
    return {"sessions": session_manager.list_all()}


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """Get a specific session"""
    session = session_manager.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a session"""
    result = session_manager.delete(session_id)
    if not result:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True}


@router.post("/sessions/{session_id}/message")
async def send_session_message(session_id: str, message: str):
    """Send a message to a session"""
    from app.core.multi_session_orchestrator import multi_session_orchestrator
    try:
        result = await multi_session_orchestrator.send_message(session_id, message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/sessions/{session_id}/model")
async def switch_session_model(session_id: str, model: str):
    """Switch model for a session"""
    result = session_manager.switch_model(session_id, model)
    if not result:
        raise HTTPException(status_code=404, detail="Session not found or invalid model")
    return {"success": True, "model": model}


@router.get("/sessions/{session_id}/state")
async def get_session_state(session_id: str):
    """Get session state"""
    state = session_manager.get_state(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    return state


@router.get("/global-state")
async def get_global_state():
    """Get global state across all sessions"""
    return session_manager.global_state()


@router.post("/run")
async def run_command(command: str):
    """Run a shell command"""
    from app.core.multi_session_orchestrator import multi_session_orchestrator
    try:
        result = await multi_session_orchestrator.run_command(command)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))