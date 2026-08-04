import argparse
from pathlib import Path

from dotenv import load_dotenv

from app.config import settings
from app.services.bedrock import BedrockService
from app.services.opensearch_store import create_opensearch_client, ensure_index


def chunk_text(text: str, chunk_size_words: int = 260, overlap_words: int = 40) -> list[str]:
    words = text.split()
    chunks: list[str] = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size_words, len(words))
        chunk = " ".join(words[start:end]).strip()
        if chunk:
            chunks.append(chunk)
        if end == len(words):
            break
        start = end - overlap_words
    return chunks


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ingest leadership principle text into OpenSearch.")
    parser.add_argument("--principle-id", required=True, type=int)
    parser.add_argument("--source-url", required=True)
    parser.add_argument("--text", type=str, default=None)
    parser.add_argument("--text-file", type=str, default=None)
    args = parser.parse_args()
    if not args.text and not args.text_file:
        parser.error("Provide either --text or --text-file.")
    return args


def load_input_text(args: argparse.Namespace) -> str:
    if args.text:
        return args.text
    file_path = Path(args.text_file)
    if not file_path.exists():
        raise FileNotFoundError(f"Input file not found: {file_path}")
    return file_path.read_text(encoding="utf-8")


def main() -> None:
    load_dotenv()
    args = parse_args()
    text = load_input_text(args)

    bedrock = BedrockService()
    client = create_opensearch_client()
    chunks = chunk_text(text)
    if not chunks:
        raise RuntimeError("No chunks were produced from input text.")

    first_embedding = bedrock.embed_text(chunks[0], input_type="search_document")
    dimension = len(first_embedding)
    ensure_index(client, settings.opensearch_index, dimension)

    success_count = 0
    failures: list[str] = []
    response = client.index(
        index=settings.opensearch_index,
        body={
            "chunk_text": chunks[0],
            "embedding": first_embedding,
            "principle_id": str(args.principle_id),
            "source_url": args.source_url,
        },
    )
    if response.get("result") in {"created", "updated"}:
        success_count += 1
    else:
        failures.append(f"Chunk 0 failed index response: {response}")

    for idx, chunk in enumerate(chunks[1:], start=1):
        embedding = bedrock.embed_text(chunk, input_type="search_document")
        response = client.index(
            index=settings.opensearch_index,
            body={
                "chunk_text": chunk,
                "embedding": embedding,
                "principle_id": str(args.principle_id),
                "source_url": args.source_url,
            },
        )
        if response.get("result") in {"created", "updated"}:
            success_count += 1
        else:
            failures.append(f"Chunk {idx} failed index response: {response}")

    client.indices.refresh(index=settings.opensearch_index)
    count_response = client.count(
        index=settings.opensearch_index,
        body={"query": {"term": {"principle_id": str(args.principle_id)}}},
    )
    indexed_count = count_response.get("count", 0)

    print(f"Chunks generated: {len(chunks)}")
    print(f"Chunks indexed successfully this run: {success_count}")
    print(f"Total chunks in index for principle_id={args.principle_id}: {indexed_count}")
    if failures:
        print("Failures detected:")
        for failure in failures:
            print(f" - {failure}")
        raise RuntimeError("One or more chunks failed indexing.")

    if success_count != len(chunks):
        raise RuntimeError("Not all chunks were indexed successfully.")
    print("Ingestion verification passed.")


if __name__ == "__main__":
    main()
