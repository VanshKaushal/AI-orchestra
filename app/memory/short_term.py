import json
from typing import List, Optional
from datetime import datetime, timedelta
from app.models.schemas import Message, MessageRole
from app.utils.logger import logger

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False


class ShortTermMemory:
    """Redis-based short-term memory for conversation history"""

    def __init__(self, redis_url: str = "redis://localhost:6379", max_messages: int = 10):
        self.max_messages = max_messages
        self.redis_client = None
        self.redis_url = redis_url
        
        if REDIS_AVAILABLE:
            try:
                self.redis_client = redis.from_url(redis_url, decode_responses=True)
                self.redis_client.ping()
                logger.info("Connected to Redis for short-term memory")
            except Exception as e:
                logger.warning(f"Redis not available, using in-memory fallback: {e}")
                self.redis_client = None
                self._memory_store = {}
        else:
            logger.warning("Redis not installed, using in-memory fallback")
            self._memory_store = {}

    def _get_key(self, user_id: str) -> str:
        return f"chat:history:{user_id}"

    def add_message(self, user_id: str, message: Message) -> None:
        """Add a message to conversation history"""
        if self.redis_client:
            try:
                key = self._get_key(user_id)
                msg_json = json.dumps({
                    "role": message.role.value,
                    "content": message.content,
                    "timestamp": message.timestamp.isoformat(),
                    "provider": message.provider.value if message.provider else None,
                    "tokens_used": message.tokens_used,
                    "cost": message.cost
                })
                
                self.redis_client.rpush(key, msg_json)
                self.redis_client.expire(key, timedelta(hours=24))
                
                # Trim to max messages
                self.redis_client.ltrim(key, -self.max_messages, -1)
            except Exception as e:
                logger.error(f"Redis error adding message: {e}")
                self._add_message_fallback(user_id, message)
        else:
            self._add_message_fallback(user_id, message)

    def _add_message_fallback(self, user_id: str, message: Message) -> None:
        """In-memory fallback"""
        if user_id not in self._memory_store:
            self._memory_store[user_id] = []
        self._memory_store[user_id].append(message)
        if len(self._memory_store[user_id]) > self.max_messages:
            self._memory_store[user_id] = self._memory_store[user_id][-self.max_messages:]

    def get_history(self, user_id: str) -> List[Message]:
        """Get conversation history for a user"""
        if self.redis_client:
            try:
                key = self._get_key(user_id)
                messages = self.redis_client.lrange(key, 0, -1)
                result = []
                for msg_json in messages:
                    data = json.loads(msg_json)
                    result.append(Message(
                        role=MessageRole(data["role"]),
                        content=data["content"],
                        timestamp=datetime.fromisoformat(data["timestamp"]),
                        provider=data.get("provider"),
                        tokens_used=data.get("tokens_used"),
                        cost=data.get("cost")
                    ))
                return result
            except Exception as e:
                logger.error(f"Redis error getting history: {e}")
                return self._get_history_fallback(user_id)
        else:
            return self._get_history_fallback(user_id)

    def _get_history_fallback(self, user_id: str) -> List[Message]:
        """In-memory fallback"""
        return self._memory_store.get(user_id, [])

    def clear_history(self, user_id: str) -> None:
        """Clear conversation history for a user"""
        if self.redis_client:
            try:
                self.redis_client.delete(self._get_key(user_id))
            except Exception as e:
                logger.error(f"Redis error clearing history: {e}")
        if user_id in self._memory_store:
            del self._memory_store[user_id]
