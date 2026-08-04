import os
os.environ["USE_TORCH"] = "1"
os.environ["USE_TF"] = "0"

from dotenv import load_dotenv

SAMPLE_TESTS = [
    (1, "How do we simplify complex data to communicate with total clarity?"),
    (2, "Why should leaders build from first principles instead of copying industry best practices?"),
    (6, "When should a leader use radical candor to challenge an executive decision?"),
    (8, "Why must we never compromise integrity to hit a massive commercial target?"),
]


def main() -> None:
    load_dotenv()
    from app.services.retrieval import retrieve_context

    for principle_id, question in SAMPLE_TESTS:
        print("=" * 100)
        print(f"Principle #{principle_id} Question: {question}")
        results = retrieve_context(question, principle_id=principle_id, k=2)
        for i, chunk in enumerate(results, start=1):
            snippet = chunk["chunk_text"][:220].replace("\n", " ")
            print(f"  {i}. [Chunk #{chunk['id']} | Type: {chunk['chunk_type']} | Score: {chunk['score']:.4f}] {snippet}...")


if __name__ == "__main__":
    main()
