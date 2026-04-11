import json
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.state import ConversationState, StateUpdate
from app.utils.logger import logger


class StateManager:
    """Manages conversation state - core of the AI Orchestra system.
    
    Maintains structured state that replaces raw chat history transfer.
    Updates goal, context_summary, decisions, open_tasks, and conversation_style.
    """

    def __init__(self, max_history: int = 5):
        self.max_history = max_history
        self._state_store: Dict[str, ConversationState] = {}
        
        self._intent_keywords = {
            "help": "help request",
            "explain": "explanation",
            "write": "writing task",
            "code": "coding task",
            "debug": "debugging task",
            "create": "creation task",
            "fix": "fix task",
            "build": "build task",
            "implement": "implementation task",
            "analyze": "analysis task",
            "review": "review task",
            "test": "testing task"
        }
        
        self._goal_indicators = [
            "goal is", "trying to", "want to", "need to", "objective",
            "purpose is", "aim to", "need help with", "working on"
        ]

    def get_state(self, user_id: str) -> ConversationState:
        """Get conversation state for a user"""
        if user_id not in self._state_store:
            self._state_store[user_id] = ConversationState()
        return self._state_store[user_id]

    def update_state(self, user_id: str, user_input: str, assistant_response: str = "") -> ConversationState:
        """Update conversation state based on user input and assistant response"""
        state = self.get_state(user_id)
        
        self._update_goal(state, user_input)
        self._update_intent(state, user_input)
        self._update_context(state, user_input, assistant_response)
        self._extract_decisions(state, user_input, assistant_response)
        self._extract_tasks(state, user_input, assistant_response)
        self._detect_style(user_input, state)
        
        state.updated_at = datetime.now()
        
        return state

    def _update_goal(self, state: ConversationState, user_input: str) -> None:
        """Extract or update goal from user input"""
        input_lower = user_input.lower()
        
        for indicator in self._goal_indicators:
            if indicator in input_lower:
                parts = user_input.split(indicator, 1)
                if len(parts) > 1:
                    goal_text = parts[1].strip()
                    if len(goal_text) > 10 and len(goal_text) < 500:
                        if not state.goal or input_lower.startswith(tuple(self._goal_indicators)):
                            state.goal = goal_text[:200]
                        return
        
        if not state.goal and len(user_input) > 20:
            state.goal = user_input[:100]

    def _update_intent(self, state: ConversationState, user_input: str) -> None:
        """Extract user intent from input"""
        input_lower = user_input.lower()
        
        for keyword, intent in self._intent_keywords.items():
            if keyword in input_lower:
                state.last_user_intent = intent
                return
        
        if len(user_input.split()) > 10:
            state.last_user_intent = "extended conversation"

    def _update_context(self, state: ConversationState, user_input: str, response: str) -> None:
        """Update context summary with new information"""
        if not state.context_summary:
            state.context_summary = f"User is discussing: {user_input[:100]}"
        else:
            new_info = f" [{datetime.now().strftime('%H:%M')}]: {user_input[:50]}"
            current = state.context_summary + new_info
            if len(current) > 500:
                state.context_summary = current[-500:]
            else:
                state.context_summary = current

    def _extract_decisions(self, state: ConversationState, user_input: str, response: str) -> None:
        """Extract decisions made during conversation"""
        decision_indicators = [
            "decided", "decided to", "will use", "going with",
            "choosing", "choosing", "selected", "opted for"
        ]
        
        combined = f"{user_input} {response}".lower()
        
        for indicator in decision_indicators:
            if indicator in combined:
                idx = combined.find(indicator)
                snippet = combined[idx:idx+80].strip()
                if snippet and len(snippet) > 10:
                    if snippet not in state.decisions:
                        state.decisions.append(snippet[:100])
                        if len(state.decisions) > 10:
                            state.decisions = state.decisions[-10:]

    def _extract_tasks(self, state: ConversationState, user_input: str, response: str) -> None:
        """Extract open tasks from conversation"""
        task_indicators = [
            "need to", "still need", "to do", "pending",
            "remaining", "next step", "will need to", "have to"
        ]
        
        combined = f"{user_input} {response}".lower()
        
        for indicator in task_indicators:
            if indicator in combined:
                idx = combined.find(indicator)
                snippet = combined[idx:idx+60].strip()
                if snippet and len(snippet) > 10 and len(snippet) < 100:
                    if snippet not in state.open_tasks:
                        state.open_tasks.append(snippet[:80])
                        if len(state.open_tasks) > 5:
                            state.open_tasks = state.open_tasks[-5:]

    def _detect_style(self, user_input: str, state: ConversationState) -> None:
        """Detect conversation style from input"""
        words = user_input.split()
        
        if any(w in user_input.lower() for w in ["?", "explain", "why", "how"]):
            state.conversation_style.depth = "detailed"
        
        if len(words) > 200:
            state.conversation_style.depth = "comprehensive"
        elif len(words) < 10:
            state.conversation_style.depth = "brief"
        
        if "please" in user_input.lower() or "thanks" in user_input.lower():
            state.conversation_style.tone = "polite"
        elif "!" in user_input:
            state.conversation_style.tone = "enthusiastic"

    def apply_update(self, user_id: str, update: StateUpdate) -> ConversationState:
        """Apply specific state update"""
        state = self.get_state(user_id)
        
        if update.goal is not None:
            state.goal = update.goal
        if update.context_summary is not None:
            state.context_summary = update.context_summary
        if update.decisions is not None:
            state.decisions = update.decisions
        if update.open_tasks is not None:
            state.open_tasks = update.open_tasks
        if update.last_user_intent is not None:
            state.last_user_intent = update.last_user_intent
        if update.tone is not None:
            state.conversation_style.tone = update.tone
        if update.depth is not None:
            state.conversation_style.depth = update.depth
        
        state.updated_at = datetime.now()
        return state

    def get_state_summary(self, user_id: str) -> str:
        """Get human-readable state summary"""
        state = self.get_state(user_id)
        
        lines = []
        if state.goal:
            lines.append(f"Goal: {state.goal}")
        if state.last_user_intent:
            lines.append(f"Intent: {state.last_user_intent}")
        if state.decisions:
            lines.append(f"Decisions: {len(state.decisions)} made")
        if state.open_tasks:
            lines.append(f"Open tasks: {len(state.open_tasks)}")
        lines.append(f"Style: {state.conversation_style.tone}/{state.conversation_style.depth}")
        
        return " | ".join(lines) if lines else "New conversation"

    def clear_state(self, user_id: str) -> None:
        """Clear state for a user"""
        if user_id in self._state_store:
            del self._state_store[user_id]

    def to_dict(self, user_id: str) -> Dict[str, Any]:
        """Convert state to dictionary for LLM context"""
        state = self.get_state(user_id)
        return {
            "goal": state.goal or "General conversation",
            "context_summary": state.context_summary or "No prior context",
            "decisions": state.decisions[-3:] if state.decisions else [],
            "open_tasks": state.open_tasks[-3:] if state.open_tasks else [],
            "last_user_intent": state.last_user_intent or "general query",
            "conversation_style": {
                "tone": state.conversation_style.tone,
                "depth": state.conversation_style.depth
            }
        }