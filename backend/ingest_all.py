import os
import re
from pathlib import Path

os.environ["USE_TORCH"] = "1"
os.environ["USE_TF"] = "0"

from dotenv import load_dotenv

load_dotenv()

from sqlalchemy import delete, func, select

from app.database import SessionLocal, engine
from app.models import Base, LeadershipChunk
from app.seed import seed_initial_data
from app.services.bedrock import BedrockService


def parse_principle_file(file_path: Path) -> list[dict[str, str]]:
    content = file_path.read_text(encoding="utf-8")
    chunks: list[dict[str, str]] = []

    # Split by H2 headers (## Header)
    sections = re.split(r"\n(?=## )", content)
    main_title = ""
    for sec in sections:
        if sec.startswith("# Principle"):
            lines = sec.strip().split("\n")
            main_title = lines[0].replace("# ", "").strip()
            continue

        lines = sec.strip().split("\n")
        header = lines[0].replace("## ", "").strip()
        body = "\n".join(lines[1:]).strip()

        if "Definition" in header or "Summary" in header:
            chunk_type = "definition"
        elif "Tension" in header or "Choice" in header:
            chunk_type = "psychometric_tension"
        elif "Hogan" in header or "Competency" in header:
            chunk_type = "hogan_mapping"
        elif "Coaching" in header or "Behaviors" in header:
            chunk_type = "coaching_examples"
        else:
            chunk_type = "general"

        chunk_text = f"{main_title}\n{header}\n{body}".strip()
        chunks.append({"chunk_type": chunk_type, "chunk_text": chunk_text})

    return chunks


def main() -> None:
    load_dotenv()
    principles_dir = Path(__file__).parent / "data" / "principles"
    if not principles_dir.exists():
        raise FileNotFoundError(f"Principles directory missing: {principles_dir}")

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    bedrock = BedrockService()
    db = SessionLocal()
    seed_initial_data(db)

    total_ingested = 0
    try:
        # Clean existing chunks before re-ingesting all principles
        db.execute(delete(LeadershipChunk))
        db.commit()

        for principle_id in range(1, 11):
            file_path = principles_dir / f"principle_{principle_id}.txt"
            if not file_path.exists():
                print(f"Warning: {file_path.name} not found, skipping.")
                continue

            parsed_chunks = parse_principle_file(file_path)
            print(f"Ingesting Principle {principle_id}: {len(parsed_chunks)} semantic chunks...")

            for chunk_data in parsed_chunks:
                embedding = bedrock.embed_text(chunk_data["chunk_text"], input_type="search_document")
                db.add(
                    LeadershipChunk(
                        chunk_text=chunk_data["chunk_text"],
                        embedding=embedding,
                        principle_id=principle_id,
                        chunk_type=chunk_data["chunk_type"],
                        source_url=f"internal://veonverse/principles/{principle_id}",
                    )
                )
                total_ingested += 1

        db.commit()
        total_chunks = db.execute(select(func.count()).select_from(LeadershipChunk)).scalar_one()
        print(f"\nSuccessfully ingested all 10 principles!")
        print(f"Total chunks in pgvector database: {total_chunks}")
    except Exception as exc:
        db.rollback()
        print(f"Error during ingestion: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
