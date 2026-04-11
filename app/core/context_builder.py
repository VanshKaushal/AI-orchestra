from typing import List, Dict, Any
from app.models.schemas import Message, MessageRole
from app.core.state_manager import StateManager
from app.models.state import ConversationState


CONTEXT_TEMPLATE = """SYSTEM:
You are continuing an ongoing conversation. Use the provided context to maintain coherence.

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
{user_input}

Remember: You are continuing a conversation, NOT starting fresh. Reference previous context when relevant."""


class ContextBuilder:
    """Build context for LLM calls using conversation state (not raw chat history).
    
    This is the CORE of the system - replaces full chat history transfer with
    structured state-based prompts.
    """

    def __init__(self, system_prompt: str = "You are a helpful AI assistant.", max_recent: int = 3):
        self.system_prompt = system_prompt
        self.max_recent = max_recent
        self.state_manager = StateManager()

    def build(self, user_input: str, recent_messages: List[Message], summary: str = "", user_id: str = "default") -> Dict[str, Any]:
        """Build context dictionary for LLM using conversation state"""
        state_dict = self.state_manager.to_dict(user_id)
        
        recent = recent_messages[-self.max_recent:] if recent_messages else []
        
        context = {
            "system_prompt": self.system_prompt,
            "conversation_state": state_dict,
            "recent_messages": recent,
            "recent_messages_str": [msg.content for msg in recent],
            "user_input": user_input,
            "prompt_template": CONTEXT_TEMPLATE
        }
        return context

    def build_from_state(self, user_input: str, user_id: str = "default") -> str:
        """Build full prompt from conversation state - the CORE reconstruction engine"""
        state_dict = self.state_manager.to_dict(user_id)
        
        prompt = CONTEXT_TEMPLATE.format(
            goal=state_dict.get("goal", "General conversation"),
            decisions=self._format_list(state_dict.get("decisions", [])),
            open_tasks=self._format_list(state_dict.get("open_tasks", [])),
            context_summary=state_dict.get("context_summary", "No prior context"),
            tone=state_dict.get("conversation_style", {}).get("tone", "helpful"),
            depth=state_dict.get("conversation_style", {}).get("depth", "standard"),
            user_input=user_input
        )
        return prompt

    def _format_list(self, items: List[str]) -> str:
        """Format list items for prompt"""
        if not items:
            return "None"
        return "\n".join([f"- {item}" for item in items[-3:]])

    def build_conversation_context(self, user_input: str, recent_messages: List[Message], summary: str = "", user_id: str = "default") -> Dict[str, Any]:
        """Build conversation context object with state"""
        state_dict = self.state_manager.to_dict(user_id)
        
        return {
            "system_prompt": self.system_prompt,
            "goal": state_dict.get("goal", ""),
            "context_summary": state_dict.get("context_summary", ""),
            "decisions": state_dict.get("decisions", []),
            "open_tasks": state_dict.get("open_tasks", []),
            "last_user_intent": state_dict.get("last_user_intent", ""),
            "conversation_style": state_dict.get("conversation_style", {}),
            "recent_messages": recent_messages[-self.max_recent:] if recent_messages else [],
            "user_input": user_input
        }

    def estimate_tokens(self, context: Dict[str, Any]) -> int:
        """Estimate token count for context"""
        total = 0
        
        if context.get("system_prompt"):
            total += len(context["system_prompt"]) // 4
        
        if context.get("conversation_state"):
            state = context["conversation_state"]
            total += len(state.get("goal", "")) // 4
            total += len(state.get("context_summary", "")) // 4
            for d in state.get("decisions", []):
                total += len(d) // 4
            for t in state.get("open_tasks", []):
                total += len(t) // 4
        
        for msg in context.get("recent_messages_str", []):
            total += len(msg) // 4
        
        if context.get("user_input"):
            total += len(context["user_input"]) // 4
        
        return total

    def update_state(self, user_id: str, user_input: str, assistant_response: str = "") -> ConversationState:
        """Update conversation state after an interaction"""
        return self.state_manager.update_state(user_id, user_input, assistant_response)

    def get_state(self, user_id: str) -> ConversationState:
        """Get current conversation state"""
        return self.state_manager.get_state(user_id)

    def get_state_summary(self, user_id: str) -> str:
        """Get human-readable state summary"""
        return self.state_manager.get_state_summary(user_id)

    def clear_state(self, user_id: str) -> None:
        """Clear conversation state"""
        self.state_manager.clear_state(user_id)