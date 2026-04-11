import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.orchestrator import Orchestrator
from app.models.schemas import ChatRequest, LLMProvider


async def main():
    orchestrator = Orchestrator()
    
    print("=" * 50)
    print("  AI Orchestra - Test Mode")
    print("=" * 50)
    
    messages = [
        "Hello, I need help with Python",
        "What's a list comprehension?",
        "Thanks!"
    ]
    
    for msg in messages:
        print(f"\nYou: {msg}")
        
        request = ChatRequest(message=msg, user_id="test_user")
        response = await orchestrator.process(request)
        
        if response.fallback_triggered:
            print(f"[Switch]: {response.fallback_from.value} -> {response.provider.value}")
        
        print(f"[{response.provider.value}]: {response.response[:200]}")
    
    print("\n--- State ---")
    print(orchestrator.get_state_summary("test_user"))
    
    print("\n--- Stats ---")
    print(orchestrator.get_usage_summary())


if __name__ == "__main__":
    asyncio.run(main())