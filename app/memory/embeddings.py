import numpy as np
from typing import List, Optional
from app.utils.logger import logger

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False


class EmbeddingsGenerator:
    """Generate embeddings for messages"""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model = None
        self.model_name = model_name

        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                self.model = SentenceTransformer(model_name)
                logger.info(f"Loaded embedding model: {model_name}")
            except Exception as e:
                logger.warning(f"Could not load embedding model: {e}")
        else:
            logger.warning("sentence-transformers not available, using dummy embeddings")

    def embed(self, text: str) -> np.ndarray:
        """Generate embedding for text"""
        if self.model:
            try:
                embedding = self.model.encode(text)
                return embedding
            except Exception as e:
                logger.error(f"Embedding error: {e}")
        
        # Fallback: return random normalized vector
        return np.random.randn(384).astype(np.float32)

    def embed_batch(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for multiple texts"""
        if self.model:
            try:
                embeddings = self.model.encode(texts)
                return embeddings
            except Exception as e:
                logger.error(f"Batch embedding error: {e}")
        
        # Fallback
        return np.random.randn(len(texts), 384).astype(np.float32)
