from app.config import settings
from app.services.bedrock import BedrockService
from app.services.opensearch_store import create_opensearch_client


bedrock_service = BedrockService()
opensearch_client = create_opensearch_client()


def retrieve_context(query: str, principle_id: int | None = None, k: int = 4) -> list[dict]:
    if not bedrock_service.is_configured() or not settings.opensearch_endpoint:
        fallback_text = (
            "We fight against mediocrity by refusing to accept 'good enough', raising standards, "
            "and acting with ownership and rigor every day."
        )
        return [
            {
                "id": "local-fallback-1",
                "score": 1.0,
                "chunk_text": fallback_text,
                "principle_id": principle_id,
                "source_url": "local-fallback",
            }
        ]

    query_embedding = bedrock_service.embed_text(query, input_type="search_query")

    knn_query: dict = {
        "size": k,
        "query": {
            "knn": {"embedding": {"vector": query_embedding, "k": k}},
        },
    }

    if principle_id is not None:
        knn_query = {
            "size": k,
            "query": {
                "bool": {
                    "must": [{"knn": {"embedding": {"vector": query_embedding, "k": k}}}],
                    "filter": [{"term": {"principle_id": str(principle_id)}}],
                }
            },
        }

    response = opensearch_client.search(index=settings.opensearch_index, body=knn_query)
    hits = response.get("hits", {}).get("hits", [])

    return [
        {
            "id": hit["_id"],
            "score": hit.get("_score", 0),
            "chunk_text": hit["_source"]["chunk_text"],
            "principle_id": hit["_source"].get("principle_id"),
            "source_url": hit["_source"].get("source_url"),
        }
        for hit in hits
    ]
