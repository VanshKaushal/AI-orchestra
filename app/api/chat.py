from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models.schemas import ChatRequest, ChatResponse, CommandRequest
from app.core.orchestrator import Orchestrator
from app.sessions.session_manager import session_manager

router = APIRouter()
orchestrator = Orchestrator()


class ChatRequestExact(BaseModel):
    session_id: str
    message: str

class ChatResponseExact(BaseModel):
    response: str
    model: str
    switch: bool
    session_id: str

@router.post("/chat", response_model=ChatResponseExact)
async def chat(request: ChatRequestExact):
    """Chat endpoint for AI Orchestra (Exact Match)"""
    try:
        # Map to orchestrator logic
        # We'll use session_id as user_id for the orchestrator implementation if needed, 
        # or use the multi_session_orchestrator
        from app.core.multi_session_orchestrator import multi_session_orchestrator
        result = await multi_session_orchestrator.send_message(request.session_id, request.message)
        
        # result expected to have 'response', 'provider', 'fallback_triggered'
        return ChatResponseExact(
            response=result.get("response", ""),
            model=str(result.get("provider", "ollama")),
            switch=result.get("fallback_triggered", False),
            session_id=request.session_id
        )
    except Exception as e:
        logger.error(f"Chat failed: {str(e)}")
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
    """List all sessions (returns list directly for frontend)"""
    return session_manager.list_all()


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


@router.post("/session/create")
async def exact_create_session():
    """Create a new session (exact endpoint match)"""
    try:
        return session_manager.create("Default Task", "ollama")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



class SwitchRequest(BaseModel):
    session_id: str
    model: str

@router.post("/switch")
async def exact_switch_model(request: SwitchRequest):
    """Switch model for a session (exact endpoint match)"""
    result = session_manager.switch_model(request.session_id, request.model)
    if not result:
        raise HTTPException(status_code=404, detail="Session not found or invalid model")
    return {"success": True, "model": request.model}


@router.get("/state")
async def exact_get_state():
    """Get global state (exact endpoint match)"""
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

@router.post("/command")
async def handle_command(request: CommandRequest):
    """Handle command and return mock response"""
    return {"status": "success", "message": f"Command '{request.command}' executed successfully (mock)"}