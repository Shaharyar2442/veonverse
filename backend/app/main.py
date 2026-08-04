from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal, engine, get_db
from app.models import Badge, Base, ChatMessage, User, UserBadge, UserProgress
from app.schemas import (
    BadgeItem,
    LessonNextRequest,
    LessonStepResponse,
    MentorAskRequest,
    MentorAskResponse,
    ProgressItem,
    UserBadgesResponse,
    UserProgressResponse,
)
from app.seed import seed_initial_data
from app.services.bedrock import BedrockService
from app.services.lesson import STEP_TO_NUMBER, advance_lesson
from app.services.retrieval import retrieve_context


bedrock_service = BedrockService()


MENTOR_SCHEMA = {
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


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/lessons/{principle_id}/next", response_model=LessonStepResponse)
def next_lesson(principle_id: int, payload: LessonNextRequest, db: Session = Depends(get_db)):
    try:
        response = advance_lesson(
            db=db,
            user_id=payload.user_id,
            principle_id=principle_id,
            user_input=payload.user_input,
        )
        return response
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/mentor/ask", response_model=MentorAskResponse)
def ask_mentor(payload: MentorAskRequest, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.id == payload.user_id)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail=f"User {payload.user_id} not found.")

    chunks = retrieve_context(payload.question, payload.principle_id or settings.default_principle_id, k=4)
    context = "\n\n".join(chunk["chunk_text"] for chunk in chunks)
    sources = [chunk["id"] for chunk in chunks]
    prompt = (
        "Answer the user question using only the retrieved context. If context is insufficient, state that "
        "and suggest asking a more specific question.\n\n"
        f"Question: {payload.question}\n\n"
        f"Retrieved Context:\n{context}"
    )
    model_response = bedrock_service.converse_structured(
        system_prompt="You are a grounded leadership mentor. Use only provided context.",
        user_prompt=prompt,
        schema=MENTOR_SCHEMA,
    )
    model_response["step"] = "mentor_ask"
    model_response["options"] = None

    db.add(
        ChatMessage(
            user_id=payload.user_id,
            role="user",
            content=payload.question,
            retrieved_chunk_ids=sources,
        )
    )
    db.add(
        ChatMessage(
            user_id=payload.user_id,
            role="assistant",
            content=model_response["text"],
            retrieved_chunk_ids=sources,
        )
    )
    db.commit()
    return {
        **model_response,
        "sources": sources,
    }


@app.get("/users/{user_id}/progress", response_model=UserProgressResponse)
def get_progress(user_id: int, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found.")

    progress_items = db.execute(select(UserProgress).where(UserProgress.user_id == user_id)).scalars().all()
    return {
        "user_id": user_id,
        "xp": user.xp,
        "progress": [
            ProgressItem(
                principle_id=item.principle_id,
                status=item.status,
                current_step=item.current_step,
                step_number=STEP_TO_NUMBER.get(item.current_step, 1),
                chosen_scenario_answer=item.chosen_scenario_answer,
                reflection_response=item.reflection_response,
                completed_at=item.completed_at,
            )
            for item in progress_items
        ],
    }


@app.get("/users/{user_id}/badges", response_model=UserBadgesResponse)
def get_badges(user_id: int, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found.")

    rows = db.execute(
        select(UserBadge, Badge)
        .join(Badge, Badge.id == UserBadge.badge_id)
        .where(UserBadge.user_id == user_id)
        .order_by(UserBadge.earned_at.desc())
    ).all()

    badge_items = [
        BadgeItem(
            badge_id=badge.id,
            name=badge.name,
            criteria=badge.criteria,
            earned_at=user_badge.earned_at,
        )
        for user_badge, badge in rows
    ]

    return {"user_id": user_id, "badges": badge_items}


@app.get("/health")
def health():
    return {"status": "ok"}
