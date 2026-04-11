import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.sessions.session_manager import session_manager
from app.core.multi_session_orchestrator import multi_session_orchestrator
from app.core.watchdog import watchdog
from app.utils.logger import logger


class ChatCLI:
    """Interactive multi-session CLI chat interface for AI Orchestra.
    
    Commands:
    - /new "<task>" - Create new session
    - /sessions - List all sessions
    - /msg <session_id> "<message>" - Send message to session
    - /switch <session_id> <model> - Switch model for session
    - /state - Show global state
    - /run <command> - Run shell command
    - /exit - Exit
    """

    def __init__(self):
        self.session_manager = session_manager
        self.running = True
        self.active_session_id = None

    async def create_session(self, task: str, model: str = "ollama") -> dict:
        """Create a new session"""
        result = self.session_manager.create(task, model)
        self.active_session_id = result["session_id"]
        return result

    async def send_to_session(self, session_id: str, message: str) -> dict:
        """Send message to a session"""
        result = await multi_session_orchestrator.send_message(session_id, message)
        return result

    def print_help(self):
        """Print help message"""
        print("""
=== AI Orchestra CLI ===
Multi-Session AI Chat Interface

Commands:
  /new "<task>"              - Create new session (e.g., /new "Build API")
  /sessions                  - List all sessions
  /msg <id> "<message>"      - Send message to session (e.g., /msg abc123 "Hello")
  /switch <id> <model>       - Switch model (e.g., /switch abc123 openai)
  /use <id>                  - Set active session
  /state                     - Show global state
  /run <command>             - Run shell command (e.g., /run ls)
  /exit                      - Exit

Models: ollama, openai, anthropic

Example:
  /new "Build a todo API"
  /msg abc1 "What endpoints do I need?"
  /switch abc1 openai
        """)

    def print_sessions(self):
        """Print all sessions"""
        sessions = self.session_manager.list_all()
        
        if not sessions:
            print("[System]: No sessions. Create one with /new")
            return
        
        print("\n=== Sessions ===")
        for s in sessions:
            active = " *" if s["session_id"] == self.active_session_id else ""
            print(f"  {s['session_id']}{active} | {s['model']} | {s['status']} | {s['task'][:40]}...")
        print()

    def print_state(self):
        """Print global state"""
        state = self.session_manager.global_state()
        print(f"\n=== Global State ===")
        print(f"Total sessions: {state['total_sessions']}")
        print(f"Running: {state['running_sessions']}")
        
        if state.get("orchestrator_state"):
            print(f"Conversation: {state['orchestrator_state']}")
        print()

    async def run_command(self, command: str):
        """Run shell command"""
        print(f"[Running]: {command}")
        result = await multi_session_orchestrator.run_command(command)
        
        if result.get("success"):
            print(f"[Output]:\n{result.get('stdout', '')}")
        else:
            print(f"[Error]: {result.get('error', result.get('stderr', 'Unknown error'))}")

    async def run(self):
        """Run the interactive chat loop"""
        print("=" * 50)
        print("  AI Orchestra V3 - Multi-Session Orchestrator")
        print("  ONE AI brain, MANY parallel processes")
        print("=" * 50)
        print("\nCommands: /new, /sessions, /msg, /switch, /state, /run, /exit\n")

        while self.running:
            try:
                prompt = f"You [{self.active_session_id[:8] if self.active_session_id else 'none'}]: " if self.active_session_id else "You: "
                user_input = input(prompt).strip()
                
                if not user_input:
                    continue
                
                if user_input.startswith("/"):
                    parts = user_input.split(maxsplit=2)
                    cmd = parts[0].lower()
                    
                    if cmd == "/help":
                        self.print_help()
                        continue
                    
                    elif cmd == "/new":
                        if len(parts) < 2:
                            print("[Error]: Usage: /new \"<task>\"")
                            continue
                        task = parts[1].strip('"')
                        model = parts[2] if len(parts) > 2 else "ollama"
                        result = await self.create_session(task, model)
                        print(f"[Created]: Session {result['session_id']} - {result['task']}")
                        continue
                    
                    elif cmd == "/sessions":
                        self.print_sessions()
                        continue
                    
                    elif cmd == "/use":
                        if len(parts) < 2:
                            print("[Error]: Usage: /use <session_id>")
                            continue
                        session_id = parts[1]
                        if self.session_manager.get(session_id):
                            self.active_session_id = session_id
                            print(f"[Active]: Session {session_id}")
                        else:
                            print(f"[Error]: Session {session_id} not found")
                        continue
                    
                    elif cmd == "/msg":
                        if len(parts) < 3:
                            print("[Error]: Usage: /msg <session_id> \"<message>\"")
                            continue
                        session_id = parts[1]
                        message = parts[2].strip('"')
                        
                        print(f"[Session {session_id}]: {message}")
                        result = await self.send_to_session(session_id, message)
                        
                        if "error" in result:
                            print(f"[Error]: {result['error']}")
                        else:
                            if result.get("auto_answer"):
                                print(f"[Auto-Answer]: {result['auto_answer']}")
                            print(f"\n[{result.get('provider', 'unknown')}]: {result.get('response', '')[:500]}")
                        continue
                    
                    elif cmd == "/switch":
                        if len(parts) < 3:
                            print("[Error]: Usage: /switch <session_id> <model>")
                            continue
                        session_id = parts[1]
                        model = parts[2]
                        
                        if self.session_manager.switch_model(session_id, model):
                            print(f"[Switched]: Session {session_id} to {model}")
                        else:
                            print(f"[Error]: Failed to switch session {session_id}")
                        continue
                    
                    elif cmd == "/state":
                        self.print_state()
                        continue
                    
                    elif cmd == "/run":
                        if len(parts) < 2:
                            print("[Error]: Usage: /run <command>")
                            continue
                        command = parts[1]
                        await self.run_command(command)
                        continue
                    
                    elif cmd == "/exit" or cmd == "/quit":
                        print("[System]: Goodbye!")
                        self.running = False
                        break
                    
                    else:
                        print(f"[Error]: Unknown command: {cmd}")
                        continue
                
                if not self.active_session_id:
                    print("[Error]: No active session. Use /new to create one or /sessions to see existing.")
                    continue
                
                print(f"[Session {self.active_session_id[:8]}]: {user_input}")
                result = await self.send_to_session(self.active_session_id, user_input)
                
                if "error" in result:
                    print(f"[Error]: {result['error']}")
                else:
                    if result.get("auto_answer"):
                        print(f"[Auto-Answer]: {result['auto_answer']}")
                    print(f"\n[{result.get('provider', 'unknown')}]: {result.get('response', '')[:500]}")
                
            except KeyboardInterrupt:
                print("\n[System]: Goodbye!")
                self.running = False
                break
            except Exception as e:
                print(f"[Error]: {str(e)}")


async def main():
    """Main entry point"""
    cli = ChatCLI()
    await cli.run()


if __name__ == "__main__":
    asyncio.run(main())