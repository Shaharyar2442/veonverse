from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Badge, ChatMessage, Principle, User, UserBadge, UserProgress
from app.services.bedrock import BedrockService
from app.services.gamification import award_xp_and_touch_activity
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
                "You are the VEON AI Leadership Mentor Avatar, an executive leader speaking warmly, "
                "inspirationally, and interactively to an employee. Your mission is to teach and convey "
                "VEON's leadership principles clearly through storytelling, practical guidance, and dialog."
            ),
            user_prompt=prompt,
            schema=STEP_SCHEMA,
        )
    except Exception:
        if options_expected:
            response = {
                "step": step,
                "text": "Welcome! I'm your Leadership Avatar. Let's explore how we bring this principle to life. Imagine you face this workplace situation—how would you respond?",
                "options": [
                    "Take direct initiative to elevate standard and explain the vision.",
                    "Gather the core team first to align on immediate priorities.",
                    "Review customer feedback to isolate the single metric that matters.",
                    "Coach team members individually on how to achieve excellence.",
                ],
                "avatar_state": "Presenting Story",
            }
        else:
            response = {
                "step": step,
                "text": "Great work engaging with this principle! Together we build a high-performing culture.",
                "options": None,
                "avatar_state": "Coaching Employee",
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
    award_xp_and_touch_activity(db, user, 0)

    if current_step == "intro":
        prompt = (
            f"As the VEON Leadership Avatar, warmly introduce the leadership principle '{principle.title}' to the employee.\n"
            f"Share a realistic corporate story highlighting the core tension: {principle.psychometric_tension or 'Standard vs High Performance'}.\n"
            "Ask the employee how they would handle this situation and provide exactly 4 practical action choices."
        )
        mentor_response = _run_structured_call("intro", prompt, options_expected=True)
        if not mentor_response.get("options") or len(mentor_response["options"]) != 4:
            raise RuntimeError("Intro response must include exactly 4 options.")
        mentor_response["avatar_state"] = "Presenting Story"
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
            raise ValueError("A selected option is required for the discussion step.")
        progress.chosen_scenario_answer = user_input
        prompt = (
            f"The employee chose this action: '{user_input}'.\n"
            f"As their Leadership Avatar, discuss their choice warmly: commend what is effective, "
            f"explain how it connects to '{principle.title}' and Hogan competencies ({principle.hogan_competencies}), "
            "and offer one practical leadership insight."
        )
        mentor_response = _run_structured_call("discussion", prompt)
        mentor_response["avatar_state"] = "Coaching & Feedback"
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
            query=f"Explain {principle.title} faithfully to official guidance.",
            principle_id=principle_id,
            k=4,
        )
        context = "\n\n".join(chunk["chunk_text"] for chunk in chunks)
        prompt = (
            f"As the Leadership Avatar, explain the official meaning of '{principle.title}' to the employee in an inspiring, easy-to-digest conversational way.\n\n"
            f"Official Guidance Context:\n{context}"
        )
        mentor_response = _run_structured_call("official_principle", prompt)
        mentor_response["avatar_state"] = "Explaining Principle"
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
            query=f"Give workplace examples of {principle.title}.",
            principle_id=principle_id,
            k=4,
        )
        context = "\n\n".join(chunk["chunk_text"] for chunk in chunks)
        prompt = (
            f"As the Leadership Avatar, share 2-3 vivid practical workplace examples of putting '{principle.title}' into action.\n\n"
            f"Context:\n{context}"
        )
        mentor_response = _run_structured_call("examples", prompt)
        mentor_response["avatar_state"] = "Sharing Real Examples"
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
                f"As the Leadership Avatar, ask the employee an encouraging reflection question: "
                f"How will they demonstrate '{principle.title}' in their own role and projects this week?"
            )
            mentor_response = _run_structured_call("reflection", prompt)
            mentor_response["avatar_state"] = "Listening to Employee"
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

        award_xp_and_touch_activity(db, user, settings.lesson_xp_reward)
        progress.current_step = "completion"
        progress.status = "completed"
        progress.completed_at = datetime.now(timezone.utc)

        badge = db.execute(select(Badge).where(Badge.id == principle_id)).scalar_one_or_none()
        if badge:
            existing_badge = db.execute(
                select(UserBadge).where(UserBadge.user_id == user_id, UserBadge.badge_id == badge.id)
            ).scalar_one_or_none()
            if not existing_badge:
                db.add(UserBadge(user_id=user_id, badge_id=badge.id, earned_at=datetime.now(timezone.utc)))

        prompt = (
            f"As the Leadership Avatar, warmly congratulate the employee for mastering '{principle.title}'! "
            f"Mention they earned {settings.lesson_xp_reward} XP and unlocked the '{badge.name if badge else 'Principle'}' badge."
        )
        mentor_response = _run_structured_call("completion", prompt)
        mentor_response["avatar_state"] = "Celebrating Achievement"
        _log_chat(db, user_id, "assistant", mentor_response["text"])
        db.commit()
        return {
            **mentor_response,
            "step_number": STEP_TO_NUMBER["completion"],
            "total_steps": 6,
            "xp": user.xp,
        }

    if current_step == "completion":
        prompt = f"As the Leadership Avatar, warmly encourage the employee as they continue their leadership journey with '{principle.title}'."
        mentor_response = _run_structured_call("completion", prompt)
        mentor_response["avatar_state"] = "Standing By"
        _log_chat(db, user_id, "assistant", mentor_response["text"])
        db.commit()
        return {
            **mentor_response,
            "step_number": STEP_TO_NUMBER["completion"],
            "total_steps": 6,
            "xp": user.xp,
        }

    raise RuntimeError(f"Unsupported lesson step: {current_step}")
