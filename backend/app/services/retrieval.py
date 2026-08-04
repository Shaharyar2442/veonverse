import math
from sqlalchemy import select

from app.database import SessionLocal, engine
from app.models import LeadershipChunk
from app.services.bedrock import BedrockService


bedrock_service = BedrockService()


def _cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)


def retrieve_context(
    query: str,
    principle_id: int | None = None,
    chunk_type: str | None = None,
    k: int = 4,
) -> list[dict]:
    query_embedding = bedrock_service.embed_text(query, input_type="search_query")
    is_postgres = engine.dialect.name == "postgresql"

    with SessionLocal() as db:
        if is_postgres:
            distance_expr = LeadershipChunk.embedding.cosine_distance(query_embedding).label("distance")
            query_stmt = select(
                LeadershipChunk.id,
                LeadershipChunk.chunk_text,
                LeadershipChunk.principle_id,
                LeadershipChunk.chunk_type,
                LeadershipChunk.source_url,
                distance_expr,
            )
            if principle_id is not None:
                query_stmt = query_stmt.where(LeadershipChunk.principle_id == principle_id)
            if chunk_type is not None:
                query_stmt = query_stmt.where(LeadershipChunk.chunk_type == chunk_type)
            query_stmt = query_stmt.order_by(distance_expr).limit(k)
            rows = db.execute(query_stmt).all()

            return [
                {
                    "id": str(row.id),
                    "score": max(0.0, 1.0 - float(row.distance)),
                    "chunk_text": row.chunk_text,
                    "principle_id": row.principle_id,
                    "chunk_type": row.chunk_type,
                    "source_url": row.source_url,
                }
                for row in rows
            ]
        else:
            # Fallback for SQLite / generic DBs
            query_stmt = select(LeadershipChunk)
            if principle_id is not None:
                query_stmt = query_stmt.where(LeadershipChunk.principle_id == principle_id)
            if chunk_type is not None:
                query_stmt = query_stmt.where(LeadershipChunk.chunk_type == chunk_type)

            chunks = db.execute(query_stmt).scalars().all()
            scored_chunks = []
            for chunk in chunks:
                emb = chunk.embedding
                if isinstance(emb, list):
                    score = _cosine_similarity(query_embedding, emb)
                    scored_chunks.append({
                        "id": str(chunk.id),
                        "score": score,
                        "chunk_text": chunk.chunk_text,
                        "principle_id": chunk.principle_id,
                        "chunk_type": chunk.chunk_type,
                        "source_url": chunk.source_url,
                    })

            scored_chunks.sort(key=lambda x: x["score"], reverse=True)
            return scored_chunks[:k]
