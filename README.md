# 🎼 AI Orchestra Desktop (V4)

[![Electron](https://img.shields.io/badge/Desktop-Electron-blue)]()
[![Next.js](https://img.shields.io/badge/Frontend-Next.js-black)]()
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green)]()

**AI Orchestra Desktop** is a native, multi-LLM orchestration environment designed for complex engineering tasks. It transforms the legacy CLI into a high-performance desktop application where you can manage parallel AI sessions, visualize global project intelligence, and switch between models (Ollama, GPT, Claude) with zero context loss.

---

## ✨ Key Features

- 🖥️ **Native Desktop Experience** - High-performance wrapper powered by Electron.
- 🚀 **One-Command Setup** - Unified project lifecycle with a single `npm run dev` command.
- 🔍 **Real-Time State Explorer** - Live dashboard visualizing session goals, decisions, and parallel task progress.
- 🧠 **Global Intelligence State** - A centralized "brain" shared across all parallel AI sessions.
- ⚡ **Seamless Model Switching** - Hot-swap between Local (Ollama) and Cloud (OpenAI/Anthropic) models.
- 🐕 **Watchdog Automation** - Intelligent background agents that auto-resolve low-level LLM questions.
- 🛠️ **Hardened API** - Production-grade FastAPI backend with robust error handling and WebSocket isolation.

---

## 🏗️ Architecture

The system operates as a unified triad, synchronized by the Electron Main Process:

```mermaid
graph TD
    subgraph "Desktop Application (Electron)"
        Main["Main Process (main.js)"]
        UI["Frontend (Next.js @ :3001)"]
        API["Backend (FastAPI @ :8000)"]
    end

    Main -->|Spawns| API
    Main -->|Hosts| UI
    UI -->|REST/WS| API
    # AI Orchestra

    [![Electron](https://img.shields.io/badge/Desktop-Electron-blue)]()
    [![Next.js](https://img.shields.io/badge/Frontend-Next.js-black)]()
    [![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green)]()

    AI Orchestra is a multi-LLM orchestration environment combining a FastAPI backend, a Next.js frontend, and an Electron-based desktop wrapper. It provides session-based orchestration, model switching, a global state explorer, and tooling for integration tests and CLI workflows.

    ---

    **Quick links**
    - **Backend entry:** [app/main.py](app/main.py)
    - **Dev runner:** [package.json](package.json)
    - **Frontend:** [frontend/package.json](frontend/package.json)
    - **Run API test helper:** [run_api.py](run_api.py)
    - **CLI test:** [cli/test_chat.py](cli/test_chat.py)

    ---

    ## Quick Start

    Prerequisites:
    - Node.js (v18+ recommended)
    - Python 3.11+
    - (Optional) Ollama or other local inference runtimes if you plan to run local LLMs

    Install dependencies:

    ```bash
    # Root (tools used by electron/dev orchestration)
    npm install

    # Frontend
    cd frontend && npm install && cd ..

    # Python backend
    pip install -r requirements.txt
    ```

    Environment:
    - Copy and populate environment variables as needed (e.g. API keys):

    ```bash
    cp .env.example .env
    # Add OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.
    ```

    Run (development):

    ```bash
    # Starts Next dev server, spawns backend, then launches Electron window
    npm run dev

    # If you only want the backend during development:
    npm run backend

    # Start frontend only (alternate):
    cd frontend && npm run dev

    # Launch electron directly (after build/install):
    npm run electron
    ```

    Run quick API test (spawns uvicorn and performs a sample request):

    ```bash
    python run_api.py
    ```

    Run CLI test harness:

    ```bash
    python cli/test_chat.py
    ```

    ---

    ## Project Overview

    High-level components:
    - `app/` — FastAPI application and backend orchestration logic (routers, core orchestrator, adapters for LLMs).
    - `frontend/` — Next.js + React UI with components and services.
    - `cli/` — Command-line helpers and test harnesses.
    - `run_api.py` — Small helper that launches the backend and makes a sample request for quick local smoke-tests.

    Key commands from `package.json`:
    - `npm run dev` — development workflow (uses `concurrently` to run frontend and electron with a backend spawn).
    - `npm run backend` — run only the FastAPI app via `uvicorn app.main:app --port 8000`.

    ---

    ## Development Notes
    - The FastAPI app exposes REST endpoints under `/api` and WebSocket endpoints at `/ws/*` (see [app/main.py](app/main.py)).
    - The frontend expects the backend at `http://localhost:8000` by default.
    - Many adapters for LLM providers live under `app/adapters/` and can be configured via environment variables.

    Testing & debugging:
    - Use `python run_api.py` to sanity-check the backend and a sample chat request.
    - Use `python cli/test_chat.py` to exercise the orchestrator end-to-end (local-only, uses synchronous test data).

    ---

    ## Contributing
    - Open issues and PRs are welcome. For local development, follow the install steps above and run the backend and frontend individually to iterate quickly.

    ## License

    MIT