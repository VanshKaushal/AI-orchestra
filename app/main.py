import sys
import os
sys.path.append(os.getcwd())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router
from app.api.state import router as state_router
from app.api.command import router as command_router
from app.utils.logger import logger

app = FastAPI(
    title="AI Orchestra",
    description="Multi-LLM orchestration engine with dynamic routing and fallback",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "OK"}

@app.get("/health")
def health():
    return {"status": "OK", "version": "1.0.0"}

app.include_router(router, tags=["chat"])
app.include_router(state_router, tags=["state"])
app.include_router(command_router, tags=["command"])

from fastapi import WebSocket, WebSocketDisconnect
from app.core.ws_manager import ws_manager

@app.websocket("/ws/global")
async def websocket_global(websocket: WebSocket):
    await ws_manager.connect(websocket, "global")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, "global")

@app.websocket("/ws/session/{session_id}")
async def websocket_session(websocket: WebSocket, session_id: str):
    await ws_manager.connect(websocket, session_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, session_id)

logger.info("AI Orchestra API started")
