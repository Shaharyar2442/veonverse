# VEONVERSE AI Leadership Mentor (Functional Pilot)

This pilot implements one leadership principle end-to-end:
**"We Fight Against Mediocrity"**.

## Stack
- Backend: FastAPI + PostgreSQL
- LLM/Embeddings: AWS Bedrock (Converse + embedding model)
- Vector store: OpenSearch k-NN index (`leadership_chunks`)
- Frontend: React (Vite)
- Local orchestration: docker-compose

## Environment
1. Copy `.env.example` to `.env`.
2. Fill these required variables with real account values:
   - `AWS_REGION`
   - `BEDROCK_MODEL_ID`
   - `BEDROCK_EMBEDDING_MODEL_ID`
   - `OPENSEARCH_ENDPOINT`
   - `OPENSEARCH_INDEX`
3. Configure AWS credentials through profile/session/instance role (never in code).

## Run
```bash
docker-compose up --build
```

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

## Ingestion
Run as one-off after services are up and env is configured:
```bash
cd backend
python ingest.py --principle-id 1 --source-url https://example.com/principles --text-file .\principle.txt
```

The script prints:
- generated chunk count
- successful index writes
- verified count in OpenSearch for `principle_id`

## Retrieval Test
```bash
cd backend
python test_retrieval.py
```

This prints retrieved chunk IDs and snippets for sample questions.

## API
- `POST /lessons/{principle_id}/next`
- `POST /mentor/ask`
- `GET /users/{id}/progress`
- `GET /users/{id}/badges`
