from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router
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

app.include_router(router, prefix="/api", tags=["chat"])

logger.info("AI Orchestra API started")
