# AI Orchestra OS (V3)

A unified AI system where a SINGLE CHAT can seamlessly switch across multiple LLMs, MULTIPLE AI SESSIONS can run in parallel, WATCHDOG agents auto-resolve LLM questions, and all sessions share a global project-level intelligence state.

## Features

- **Single Chat Continuity** - Switch between LLMs (auto + manual) with no context loss
- **Multi-Session Parallel Execution** - Run multiple AI sessions simultaneously
- **Watchdog Automation** - Auto-answer LLM questions without user interruption
- **Command Execution** - Run shell commands asynchronously from any session
- **Policy-Driven Routing** - Centralized management of routing rules and fallback chains
- **Local Models Priority** - Use Ollama by default to minimize cost
- **Global Project Intelligence** - All sessions share structured state
- **Quality Escalation** - Auto-escalate weak responses to better models

## Architecture

```
ai_orchestra/
├── app/
│   ├── main.py                 # FastAPI entry point
│   ├── api/chat.py             # REST endpoints
│   ├── core/
│   │   ├── orchestrator.py     # Main orchestration engine
│   │   ├── multi_session_orchestrator.py  # Parallel session manager
│   │   ├── router.py           # LLM selection logic
│   │   ├── policy_engine.py    # Centralized routing policies
│   │   ├── state_manager.py    # Conversation state (CORE)
│   │   ├── context_builder.py  # Context reconstruction
│   │   ├── switch_engine.py    # Auto + manual switching
│   │   ├── watchdog.py         # Auto-answer questions
│   │   ├── command_runner.py   # Async background execution
│   │   ├── quality_checker.py  # Response validation
│   │   └── usage_tracker.py    # Cost tracking
│   ├── sessions/
│   │   └── session_manager.py  # Session CRUD operations
│   ├── adapters/
│   │   ├── base_adapter.py     # Adapter contract
│   │   ├── openai.py           # OpenAI GPT
│   │   ├── anthropic.py        # Claude
│   │   └── ollama.py           # Local LLM
│   ├── memory/
│   │   ├── short_term.py       # Redis/history
│   │   └── long_term.py        # FAISS/vector
│   └── models/
│       ├── schemas.py          # Pydantic models
│       └── state.py            # Conversation state
├── cli/chat.py                 # Interactive multi-session CLI
├── .env.example                # Environment template
├── requirements.txt           # Dependencies
└── README.md                  # This file
```

## Installation

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Set up environment:**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Install Ollama (for local LLM):**
```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows: Download from https://ollama.com
```

4. **Start Ollama:**
```bash
ollama serve
# In another terminal:
ollama pull mistral
```

5. **Start Redis (optional):**
```bash
# Docker
docker run -d -p 6379:6379 redis

# Or install locally
```

## Usage

### Start the API Server

```bash
uvicorn app.main:app --reload
```

API will be available at `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

### Start the CLI

```bash
python cli/chat.py
```

### CLI Commands

```
/new "<task>"           - Create new session
/sessions               - List all sessions
/msg <id> "<message>"   - Send message to session
/switch <id> <model>    - Switch model for session
/use <id>               - Set active session
/state                  - Show global state
/run "<command>"        - Run background shell command
/exit                   - Exit
```

### API Endpoints

```bash
# Chat
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "user_id": "user1"}'

# Health check
curl http://localhost:8000/api/health

# Get stats
curl http://localhost:8000/api/stats

# Get conversation state
curl http://localhost:8000/api/state/user1

# Manual switch
curl -X POST http://localhost:8000/api/switch/user1?provider=openai

# Run shell command
curl -X POST "http://localhost:8000/api/run?command=ls"
```

## Global State Design (THE CORE)

The system maintains ONE shared project-level state:

```python
{
  "goal": string,           # What user is trying to accomplish
  "context_summary": string,# Accumulated context
  "decisions": [string],    # Decisions made during conversation
  "open_tasks": [string],   # Pending tasks
  "conversation_style": {
    "tone": "professional",
    "depth": "detailed"
  }
}
```

## Context Reconstruction Engine

When calling ANY LLM, we construct:

```
SYSTEM:
You are continuing an ongoing engineering task.

GOAL:
{goal}

PROGRESS:
{decisions}

PENDING TASKS:
{open_tasks}

SUMMARY:
{context_summary}

STYLE:
Tone: {tone}
Depth: {depth}

USER INPUT:
{message}

Remember: You are continuing a conversation, NOT starting fresh.
```

This ensures the LLM always knows the conversation state, not just raw history.

## Session State (ISOLATED)

Each session has its own isolated state:

```python
{
  "session_id": string,
  "task": string,
  "model": string,
  "local_summary": string,
  "status": "running" | "waiting" | "completed"
}
```

## Routing Logic (Policy Engine)

The routing is handled by a centralized `PolicyEngine` which enforces:
1. Default → Ollama (FREE)
2. Query length > 100 words → Anthropic
3. Query length > 500 words or "complex" → OpenAI
4. Automatic fallback chain: OpenAI → Anthropic → Ollama

## Watchdog System

The watchdog detects question patterns in LLM responses and auto-answers them:

- "should I..." → "Yes, proceed"
- "which framework" → "Use the most popular"
- "confirm" → "Confirmed, continue"

This keeps AI sessions running continuously without pausing for user confirmation.

## Environment Variables

```env
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-haiku-20240307

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral

# Redis
REDIS_URL=redis://localhost:6379
```

## Example Session

```
==================================================
  AI Orchestra V3 - Multi-Session Orchestrator
  ONE AI brain, MANY parallel processes
==================================================

Commands: /new, /sessions, /msg, /switch, /state, /run, /exit

You: /new "Build a todo API"

[Created]: Session a1b2c3d4 - Build a todo API

You [a1b2c3d]: What endpoints do I need?

[Session a1b2c3d4]: What endpoints do I need?

[ollama]: For a todo API, you'll need:

1. GET /todos - List all todos
2. POST /todos - Create a new todo
3. GET /todos/{id} - Get single todo
4. PUT /todos/{id} - Update todo
5. DELETE /todos/{id} - Delete todo

/switch a1b2c3d4 openai

[Switched]: Session a1b2c3d4 to openai

/state

=== Global State ===
Total sessions: 1
Running: 1
Conversation: Goal: Build a todo API | Intent: help request | Style: helpful/standard
```

## Requirements

- Python 3.11+
- fastapi, uvicorn, httpx, pydantic
- redis (optional, falls back to in-memory)
- faiss-cpu (optional, falls back to in-memory)
- sentence-transformers (optional)

## System Feel

The system should feel like:
- → ONE AI brain
- → MANY parallel thinking processes
- → ZERO interruption
- → FULL control

## License

MIT