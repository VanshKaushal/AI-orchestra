import numpy as np
from app.utils.logger import logger
try:
    from sentence_transformers import SentenceTransformer
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False
    logger.warning("sentence-transformers not found. Semantic enrichment disabled.")

try:
    from sklearn.cluster import KMeans
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False
    logger.warning("scikit-learn not found. Clustering disabled.")
from typing import List, Dict, Any, Optional


# Initialize model once at module level for efficiency
_model = None

def get_model():
    global _model
    if not HAS_TRANSFORMERS:
        return None
    if _model is None:
        try:
            logger.info("Loading SentenceTransformer model: all-MiniLM-L6-v2")
            _model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            return None
    return _model

class GraphAIEnricher:
    # Cache embeddings using node.id as key as per instruction 52
    _id_embedding_cache = {}

    @classmethod
    def enrich_graph(cls, nodes: List[Any], edges: List[Any], threshold: float = 0.7, k: int = 5) -> Dict[str, Any]:
        """
        Enriches the graph with embeddings, clustering, and semantic edges.
        """
        if not nodes:
            return {"nodes": [], "edges": []}

        try:
            model = get_model()
            
            # 1. Generate/Fetch Embeddings
            # Generate embeddings ONLY from node.label
            node_labels = []
            node_indices_to_encode = []
            embeddings_list = [None] * len(nodes)

            for i, node in enumerate(nodes):
                # Use node.id as cache key as per instruction
                if node.id in cls._id_embedding_cache:
                    embeddings_list[i] = cls._id_embedding_cache[node.id]
                else:
                    node_labels.append(node.label)
                    node_indices_to_encode.append(i)

            if node_labels and model:
                logger.info(f"Encoding {len(node_labels)} new node labels")
                new_embeddings = model.encode(node_labels)
                for i, emb in zip(node_indices_to_encode, new_embeddings):
                    cls._id_embedding_cache[nodes[i].id] = emb
                    embeddings_list[i] = emb

            if any(e is not None for e in embeddings_list):
                embeddings = np.array([e if e is not None else np.zeros(384) for e in embeddings_list])
            else:
                embeddings = None

            # 2. Clustering (KMeans)
            actual_k = min(k, len(nodes))
            if HAS_SKLEARN and actual_k > 1 and embeddings is not None:
                # sklearn KMeans
                kmeans = KMeans(n_clusters=actual_k, random_state=42, n_init='auto')
                cluster_labels = kmeans.fit_predict(embeddings)
            else:
                cluster_labels = [0] * len(nodes)

            # Assign cluster to nodes
            enriched_nodes = []
            for i, node in enumerate(nodes):
                node_dict = node.dict() if hasattr(node, 'dict') else vars(node)
                node_dict['cluster'] = int(cluster_labels[i])
                enriched_nodes.append(node_dict)

            # 3. Semantic Edge Creation (Cosine Similarity)
            new_edges = []
            if embeddings is not None and len(embeddings) > 0:
                # Normalize embeddings for cosine similarity
                norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
                norms[norms == 0] = 1e-10
                normalized_embeddings = embeddings / norms
                
                sim_matrix = np.dot(normalized_embeddings, normalized_embeddings.T)
            else:
                sim_matrix = None
            if sim_matrix is not None:
                existing_pairs = set()
                for edge in edges:
                    existing_pairs.add((edge.source, edge.target))

                for i in range(len(nodes)):
                    for j in range(i + 1, len(nodes)):
                        similarity = sim_matrix[i, j]
                        if similarity > threshold:
                            source_id = nodes[i].id
                            target_id = nodes[j].id
                            
                            # DO NOT duplicate existing edges
                            if (source_id, target_id) not in existing_pairs and (target_id, source_id) not in existing_pairs:
                                new_edges.append({
                                    "source": source_id,
                                    "target": target_id,
                                    "weight": float(similarity),
                                    "type": "semantic"
                                })

            # Combine existing and new edges
            all_edges = []
            for edge in edges:
                edge_dict = edge.dict() if hasattr(edge, 'dict') else vars(edge)
                all_edges.append(edge_dict)
            
            all_edges.extend(new_edges)

            return {
                "nodes": enriched_nodes,
                "edges": all_edges
            }
        except Exception as e:
            logger.error(f"AI Enrichment failed: {str(e)}")
            # Fallback to normal graph format
            fallback_nodes = []
            for node in nodes:
                node_dict = node.dict() if hasattr(node, 'dict') else vars(node)
                node_dict['cluster'] = 0
                fallback_nodes.append(node_dict)
            
            fallback_edges = [edge.dict() if hasattr(edge, 'dict') else vars(edge) for edge in edges]
            return {"nodes": fallback_nodes, "edges": fallback_edges}
