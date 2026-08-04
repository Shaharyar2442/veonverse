import argparse
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import delete, func, select

from app.database import SessionLocal
from app.models import LeadershipChunk
from app.services.bedrock import BedrockService


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
    parser = argparse.ArgumentParser(description="Ingest leadership principle text into PostgreSQL pgvector.")
    parser.add_argument("--principle-id", required=True, type=int)
    parser.add_argument("--source-url", required=True)
    parser.add_argument("--text", type=str, default=None)
    parser.add_argument("--text-file", type=str, default=None)
    parser.add_argument(
        "--replace-existing",
        action="store_true",
        help="Delete existing chunks for the provided principle before ingesting.",
    )
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
    chunks = chunk_text(text)
    if not chunks:
        raise RuntimeError("No chunks were produced from input text.")

    db = SessionLocal()
    success_count = 0
    failures: list[str] = []
    if args.replace_existing:
        db.execute(delete(LeadershipChunk).where(LeadershipChunk.principle_id == args.principle_id))

    for idx, chunk in enumerate(chunks):
        try:
            embedding = bedrock.embed_text(chunk, input_type="search_document")
            db.add(
                LeadershipChunk(
                    chunk_text=chunk,
                    embedding=embedding,
                    principle_id=args.principle_id,
                    source_url=args.source_url,
                )
            )
            success_count += 1
        except Exception as exc:
            failures.append(f"Chunk {idx} failed: {exc}")

    if failures:
        db.rollback()
    else:
        db.commit()

    indexed_count = db.execute(
        select(func.count()).select_from(LeadershipChunk).where(LeadershipChunk.principle_id == args.principle_id)
    ).scalar_one()
    db.close()

    print(f"Chunks generated: {len(chunks)}")
    print(f"Chunks indexed successfully this run: {success_count}")
    print(f"Total chunks in pgvector table for principle_id={args.principle_id}: {indexed_count}")
    if failures:
        print("Failures detected:")
        for failure in failures:
            print(f" - {failure}")
        raise RuntimeError("One or more chunks failed indexing.")

    if success_count != len(chunks):
        raise RuntimeError("Not all chunks were indexed successfully.")
    print("Ingestion verification passed for PostgreSQL pgvector.")


if __name__ == "__main__":
    main()
