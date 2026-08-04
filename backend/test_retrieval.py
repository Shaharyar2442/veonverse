from dotenv import load_dotenv


SAMPLE_QUESTIONS = [
    "How do I challenge a team that keeps shipping average-quality work?",
    "What does rejecting good enough look like in daily leadership behavior?",
    "How should a manager respond when deadlines are used to justify low standards?",
    "How can I coach someone from acceptable performance to excellence?",
]


def main() -> None:
    load_dotenv()
    from app.services.retrieval import retrieve_context

    for question in SAMPLE_QUESTIONS:
        print("=" * 100)
        print(f"Question: {question}")
        results = retrieve_context(question, principle_id=1, k=4)
        for i, chunk in enumerate(results, start=1):
            snippet = chunk["chunk_text"][:220].replace("\n", " ")
            print(f"{i}. chunk_id={chunk['id']} score={chunk['score']:.4f} text={snippet}...")


if __name__ == "__main__":
    main()
