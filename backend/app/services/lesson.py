from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Badge, ChatMessage, Principle, User, UserBadge, UserProgress
from app.services.bedrock import BedrockService
from app.services.retrieval import retrieve_context


STEP_TO_NUMBER = {
    "intro": 1,
    "discussion": 2,
    "official_principle": 3,
    "examples": 4,
    "reflection": 5,
    "completion": 6,
}

STEP_SCHEMA = {
    "type": "object",
    "properties": {
        "step": {"type": "string"},
        "text": {"type": "string"},
        "options": {
            "anyOf": [
                {"type": "array", "items": {"type": "string"}},
                {"type": "null"},
            ]
        },
        "avatar_state": {"type": "string"},
    },
    "required": ["step", "text", "options", "avatar_state"],
}


bedrock_service = BedrockService()


def _log_chat(
    db: Session,
    user_id: int,
    role: str,
    content: str,
    retrieved_chunk_ids: list[str] | None = None,
) -> None:
    db.add(
        ChatMessage(
            user_id=user_id,
            role=role,
            content=content,
            retrieved_chunk_ids=retrieved_chunk_ids,
        )
    )


def _get_or_create_progress(db: Session, user_id: int, principle_id: int) -> UserProgress:
    progress = db.execute(
        select(UserProgress).where(
            UserProgress.user_id == user_id, UserProgress.principle_id == principle_id
        )
    ).scalar_one_or_none()
    if progress:
        return progress

    progress = UserProgress(
        user_id=user_id,
        principle_id=principle_id,
        status="in_progress",
        current_step="intro",
    )
    db.add(progress)
    db.flush()
    return progress


def _run_structured_call(step: str, prompt: str, options_expected: bool = False) -> dict[str, Any]:
    try:
        response = bedrock_service.converse_structured(
            system_prompt=(
                "You are VEONVERSE AI Leadership Mentor. Always return grounded, practical coaching."
            ),
            user_prompt=prompt,
            schema=STEP_SCHEMA,
        )
    except Exception:
        if options_expected:
            response = {
                "step": step,
                "text": "A high-standard leader challenges mediocrity early, asks for better work, and sets a clear bar for excellence.",
                "options": [
                    "Speak up directly and ask for a stronger draft.",
                    "Accept the work and wait for a later revision.",
                    "Delegate the issue and avoid the conversation.",
                    "Set a higher bar and coach the team on why it matters.",
                ],
                "avatar_state": "ready",
            }
        else:
            response = {
                "step": step,
                "text": "This is a local fallback response so the experience can still be explored while AI services are not configured.",
                "options": None,
                "avatar_state": "ready",
            }
    response["step"] = step
    if not options_expected:
        response["options"] = None
    return response


def advance_lesson(
    db: Session, user_id: int, principle_id: int, user_input: str | None = None
) -> dict[str, Any]:
    user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
    if not user:
        raise ValueError(f"User {user_id} not found.")

    principle = db.execute(select(Principle).where(Principle.id == principle_id)).scalar_one_or_none()
    if not principle:
        raise ValueError(f"Principle {principle_id} not found.")

    progress = _get_or_create_progress(db, user_id, principle_id)
    current_step = progress.current_step

    if current_step == "intro":
        prompt = (
            "Generate a realistic workplace scenario where mediocrity may be accepted unless challenged. "
            "Provide exactly 4 action options that vary in quality and courage. "
            f"Principle title: {principle.title}. Official text: {principle.official_text}"
        )
        mentor_response = _run_structured_call("intro", prompt, options_expected=True)
        if not mentor_response.get("options") or len(mentor_response["options"]) != 4:
            raise RuntimeError("Intro response must include exactly 4 options.")
        progress.current_step = "discussion"
        progress.status = "in_progress"
        _log_chat(db, user_id, "assistant", mentor_response["text"])
        db.commit()
        return {
            **mentor_response,
            "step_number": STEP_TO_NUMBER["intro"],
            "total_steps": 6,
            "xp": user.xp,
        }

    if current_step == "discussion":
        if not user_input:
            raise ValueError("A selected scenario option is required for the discussion step.")
        progress.chosen_scenario_answer = user_input
        prompt = (
            "The learner selected the following option in the mediocrity scenario: "
            f"'{user_input}'. Respond with coaching feedback: what they did well, what excellence requires, "
            "and one concrete adjustment."
        )
        mentor_response = _run_structured_call("discussion", prompt)
        progress.current_step = "official_principle"
        _log_chat(db, user_id, "user", user_input)
        _log_chat(db, user_id, "assistant", mentor_response["text"])
        db.commit()
        return {
            **mentor_response,
            "step_number": STEP_TO_NUMBER["discussion"],
            "total_steps": 6,
            "xp": user.xp,
        }

    if current_step == "official_principle":
        chunks = retrieve_context(
            query="Explain We Fight Against Mediocrity faithfully to official guidance.",
            principle_id=principle_id,
            k=4,
        )
        context = "\n\n".join(chunk["chunk_text"] for chunk in chunks)
        prompt = (
            "Use only the provided official context to explain this principle faithfully and clearly.\n\n"
            f"Context:\n{context}\n\n"
            "Deliver practical meaning in plain language."
        )
        mentor_response = _run_structured_call("official_principle", prompt)
        progress.current_step = "examples"
        _log_chat(db, user_id, "assistant", mentor_response["text"], [c["id"] for c in chunks])
        db.commit()
        return {
            **mentor_response,
            "step_number": STEP_TO_NUMBER["official_principle"],
            "total_steps": 6,
            "xp": user.xp,
        }

    if current_step == "examples":
        chunks = retrieve_context(
            query="Give high-standard workplace examples of fighting mediocrity.",
            principle_id=principle_id,
            k=4,
        )
        context = "\n\n".join(chunk["chunk_text"] for chunk in chunks)
        prompt = (
            "Using this context, produce 2-3 concise workplace examples demonstrating this principle in action.\n\n"
            f"Context:\n{context}"
        )
        mentor_response = _run_structured_call("examples", prompt)
        progress.current_step = "reflection"
        _log_chat(db, user_id, "assistant", mentor_response["text"], [c["id"] for c in chunks])
        db.commit()
        return {
            **mentor_response,
            "step_number": STEP_TO_NUMBER["examples"],
            "total_steps": 6,
            "xp": user.xp,
        }

    if current_step == "reflection":
        if not user_input:
            prompt = (
                "Ask one reflective, practical question that prompts the learner to identify where they "
                "currently accept mediocrity and what concrete standard they will raise this week."
            )
            mentor_response = _run_structured_call("reflection", prompt)
            _log_chat(db, user_id, "assistant", mentor_response["text"])
            db.commit()
            return {
                **mentor_response,
                "step_number": STEP_TO_NUMBER["reflection"],
                "total_steps": 6,
                "xp": user.xp,
            }

        progress.reflection_response = user_input
        _log_chat(db, user_id, "user", user_input)

        user.xp += settings.lesson_xp_reward
        progress.current_step = "completion"
        progress.status = "completed"
        progress.completed_at = datetime.now(timezone.utc)

        badge = db.execute(select(Badge).where(Badge.id == 1)).scalar_one_or_none()
        if not badge:
            raise RuntimeError("Required completion badge is missing.")
        existing_badge = db.execute(
            select(UserBadge).where(UserBadge.user_id == user_id, UserBadge.badge_id == badge.id)
        ).scalar_one_or_none()
        if not existing_badge:
            db.add(UserBadge(user_id=user_id, badge_id=badge.id, earned_at=datetime.now(timezone.utc)))

        prompt = (
            "Create a motivational completion message: congratulate the learner for completing the principle, "
            f"mention they earned {settings.lesson_xp_reward} XP, and reinforce one behavior to sustain excellence."
        )
        mentor_response = _run_structured_call("completion", prompt)
        _log_chat(db, user_id, "assistant", mentor_response["text"])
        db.commit()
        return {
            **mentor_response,
            "step_number": STEP_TO_NUMBER["completion"],
            "total_steps": 6,
            "xp": user.xp,
        }

    if current_step == "completion":
        prompt = "Return a short completion reminder and encourage the learner to ask a mentor question."
        mentor_response = _run_structured_call("completion", prompt)
        _log_chat(db, user_id, "assistant", mentor_response["text"])
        db.commit()
        return {
            **mentor_response,
            "step_number": STEP_TO_NUMBER["completion"],
            "total_steps": 6,
            "xp": user.xp,
        }

    raise RuntimeError(f"Unsupported lesson step: {current_step}")
