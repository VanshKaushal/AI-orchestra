import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
from app.memory.embeddings import EmbeddingsGenerator
from app.utils.logger import logger


try:
    import faiss
    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False

class LongTermMemory:
    """FAISS-based vector database for long-term memory"""

    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self.embeddings = EmbeddingsGenerator()
        self.index = None
        self.metadata: List[Dict[str, Any]] = []
        
        if HAS_FAISS:
            try:
                self.index = faiss.IndexFlatL2(dimension)
                logger.info(f"Initialized FAISS index with dimension {dimension}")
            except Exception as e:
                logger.error(f"FAISS initialization error: {e}")
        else:
            logger.warning("FAISS not available, using in-memory fallback")
            self._fallback_index = {}

    def _faiss_available(self) -> bool:
        return HAS_FAISS

    def add_memory(self, user_id: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Add a memory to the vector store"""
        embedding = self.embeddings.embed(content)
        
        # Ensure correct shape
        if embedding.ndim == 1:
            embedding = embedding.reshape(1, -1)
        
        if self.index is not None:
            try:
                self.index.add(embedding.astype(np.float32))
                self.metadata.append({
                    "user_id": user_id,
                    "content": content,
                    "timestamp": datetime.now().isoformat(),
                    **(metadata or {})
                })
            except Exception as e:
                logger.error(f"Error adding to FAISS: {e}")
        else:
            # Fallback: store in dict
            if user_id not in self._fallback_index:
                self._fallback_index[user_id] = []
            self._fallback_index[user_id].append({
                "content": content,
                "embedding": embedding,
                "timestamp": datetime.now().isoformat(),
                **(metadata or {})
            })

    def search(self, user_id: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search memories for a user"""
        query_embedding = self.embeddings.embed(query)
        
        if query_embedding.ndim == 1:
            query_embedding = query_embedding.reshape(1, -1)
        
        if self.index is not None and self.index.ntotal > 0:
            try:
                distances, indices = self.index.search(
                    query_embedding.astype(np.float32), 
                    min(top_k, self.index.ntotal)
                )
                
                results = []
                for i, idx in enumerate(indices[0]):
                    if idx >= 0 and idx < len(self.metadata):
                        mem = self.metadata[idx]
                        if mem.get("user_id") == user_id:
                            results.append({
                                "content": mem["content"],
                                "timestamp": mem.get("timestamp"),
                                "distance": float(distances[0][i])
                            })
                return results[:top_k]
            except Exception as e:
                logger.error(f"Search error: {e}")
        
        # Fallback: simple text search
        return self._search_fallback(user_id, query, top_k)

    def _search_fallback(self, user_id: str, query: str, top_k: int) -> List[Dict[str, Any]]:
        """Fallback search using simple matching"""
        if user_id not in self._fallback_index:
            return []
        
        # Simple approach: return recent memories
        memories = self._fallback_index[user_id][-top_k:]
        return [
            {"content": m["content"], "timestamp": m.get("timestamp")}
            for m in memories
        ]

    def get_summary(self, user_id: str) -> str:
        """Get a summary of stored memories"""
        if self.index is not None and self.metadata:
            user_memories = [m for m in self.metadata if m.get("user_id") == user_id]
            if user_memories:
                return f"User has {len(user_memories)} stored memories"
        
        if hasattr(self, '_fallback_index') and user_id in self._fallback_index:
            return f"User has {len(self._fallback_index[user_id])} stored memories"
        
        return "No long-term memories stored"
