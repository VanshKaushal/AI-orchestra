import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.orchestrator import Orchestrator
from app.models.schemas import ChatRequest, LLMProvider
from app.utils.logger import logger


class ChatCLI:
    """Interactive CLI chat interface for AI Orchestra.
    
    Commands:
    - /help - Show help
    - /switch <model> - Switch to specific model (openai, anthropic, ollama)
    - /state - Show conversation state
    - /stats - Show usage statistics
    - /clear - Clear conversation
    - /quit - Exit
    """

    def __init__(self):
        self.orchestrator = Orchestrator()
        self.running = True
        self.current_provider = None

    async def chat(self, message: str, user_id: str = "cli_user") -> str:
        """Send a message and get response"""
        request = ChatRequest(
            message=message, 
            user_id=user_id,
            force_provider=self.current_provider
        )
        
        print(f"[User]: {message}")
        
        try:
            response = await self.orchestrator.process(request)
            
            if response.fallback_triggered:
                print(f"[Switch]: {response.fallback_from.value if response.fallback_from else 'N/A'} -> {response.provider.value}")
                if response.switch_reason:
                    print(f"[Reason]: {response.switch_reason}")
            
            print(f"\n[{response.provider.value}]: {response.response}")
            return response.response
            
        except Exception as e:
            error_msg = f"Error: {str(e)}"
            print(f"[Error]: {error_msg}")
            return error_msg

    def print_help(self):
        """Print help message"""
        print("""
=== AI Orchestra CLI ===
Commands:
  /help         - Show this help message
  /switch <model> - Switch model (openai, anthropic, ollama)
  /state        - Show conversation state
  /stats         - Show usage statistics
  /clear         - Clear conversation history
  /quit          - Exit the chat

Examples:
  /switch ollama
  /switch openai
  /state
        """)

    def print_state(self):
        """Print current conversation state"""
        summary = self.orchestrator.get_state_summary()
        print(f"\n=== Conversation State ===\n{summary}\n")

    def print_stats(self):
        """Print usage statistics"""
        summary = self.orchestrator.get_usage_summary()
        print(f"\n=== Usage Statistics ===\n{summary}\n")

    async def run(self):
        """Run the interactive chat loop"""
        print("=" * 50)
        print("  AI Orchestra - Multi-LLM Orchestrator")
        print("  ONE AI using MULTIPLE BRAINS")
        print("=" * 50)
        print("\nCommands: /help, /switch, /state, /stats, /clear, /quit\n")
        
        user_id = "cli_user"
        
        while self.running:
            try:
                user_input = input("\nYou: ").strip()
                
                if not user_input:
                    continue
                
                if user_input.startswith("/"):
                    parts = user_input.split(maxsplit=1)
                    cmd = parts[0].lower()
                    arg = parts[1].lower() if len(parts) > 1 else None
                    
                    if cmd == "/help":
                        self.print_help()
                        continue
                    
                    elif cmd == "/state":
                        self.print_state()
                        continue
                    
                    elif cmd == "/stats":
                        self.print_stats()
                        continue
                    
                    elif cmd == "/clear":
                        self.orchestrator.clear_conversation(user_id)
                        print("[System]: Conversation cleared")
                        continue
                    
                    elif cmd == "/quit" or cmd == "/exit":
                        print("[System]: Goodbye!")
                        self.running = False
                        break
                    
                    elif cmd == "/switch":
                        if not arg:
                            if self.current_provider:
                                print(f"[System]: Currently using: {self.current_provider.value}")
                            else:
                                print("[System]: Auto-selection (no override)")
                            continue
                        
                        try:
                            new_provider = LLMProvider(arg)
                            self.current_provider = new_provider
                            print(f"[System]: Switched to {new_provider.value}")
                        except ValueError:
                            print(f"[Error]: Unknown model '{arg}'. Use: openai, anthropic, ollama")
                        continue
                    
                    else:
                        print(f"[Error]: Unknown command: {cmd}")
                        continue
                
                request = ChatRequest(
                    message=user_input, 
                    user_id=user_id,
                    force_provider=self.current_provider
                )
                
                if self.current_provider:
                    print(f"[Using]: {self.current_provider.value}...")
                
                response = await self.orchestrator.process(request)
                
                if response.fallback_triggered:
                    from_str = response.fallback_from.value if response.fallback_from else "auto"
                    print(f"[Switch]: {from_str} -> {response.provider.value}")
                
                print(f"\n[{response.provider.value}]: {response.response}")
                
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