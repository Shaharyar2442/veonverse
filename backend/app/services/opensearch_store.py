from urllib.parse import urlparse

import boto3
from opensearchpy import AWSV4SignerAuth, OpenSearch, RequestsHttpConnection

from app.config import settings


def _normalize_host() -> tuple[str, int, bool]:
    endpoint = settings.opensearch_endpoint.strip()
    if endpoint.startswith("http://") or endpoint.startswith("https://"):
        parsed = urlparse(endpoint)
        host = parsed.hostname or parsed.netloc
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        return host, port, parsed.scheme == "https"
    if ":" in endpoint:
        host, raw_port = endpoint.rsplit(":", maxsplit=1)
        return host, int(raw_port), False
    return endpoint, 443, True


def create_opensearch_client() -> OpenSearch:
    host, port, use_ssl = _normalize_host()
    client_kwargs = {
        "hosts": [{"host": host, "port": port}],
        "use_ssl": use_ssl,
        "verify_certs": settings.opensearch_verify_certs,
        "connection_class": RequestsHttpConnection,
    }

    if settings.opensearch_use_aws_sigv4:
        credentials = boto3.Session().get_credentials()
        if not credentials:
            raise RuntimeError("AWS credentials are required for SigV4 OpenSearch auth.")
        client_kwargs["http_auth"] = AWSV4SignerAuth(credentials, settings.aws_region, "es")
    elif settings.opensearch_username and settings.opensearch_password:
        client_kwargs["http_auth"] = (settings.opensearch_username, settings.opensearch_password)

    return OpenSearch(**client_kwargs)


def ensure_index(client: OpenSearch, index_name: str, dimension: int) -> None:
    if client.indices.exists(index=index_name):
        return

    mapping = {
        "settings": {
            "index": {"knn": True},
            "knn.algo_param.ef_search": 128,
        },
        "mappings": {
            "properties": {
                "chunk_text": {"type": "text"},
                "embedding": {
                    "type": "knn_vector",
                    "dimension": dimension,
                    "method": {
                        "name": "hnsw",
                        "engine": "nmslib",
                        "space_type": "cosinesimil",
                        "parameters": {"ef_construction": 128, "m": 24},
                    },
                },
                "principle_id": {"type": "keyword"},
                "source_url": {"type": "keyword"},
            }
        },
    }
    client.indices.create(index=index_name, body=mapping)
