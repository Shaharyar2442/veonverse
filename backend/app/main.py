from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal, engine, get_db
from app.models import Badge, Base, ChatMessage, Principle, User, UserBadge, UserProgress
from app.schemas import (
    BadgeItem,
    LessonNextRequest,
    LessonStepResponse,
    MentorAskRequest,
    MentorAskResponse,
    PrincipleItem,
    PrincipleListResponse,
    ProgressItem,
    UserBadgesResponse,
    UserProgressResponse,
)
from app.seed import seed_initial_data
from app.services.bedrock import BedrockService
from app.services.gamification import compute_level, xp_to_next_level
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
    if settings.database_url.startswith("postgresql"):
        with engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
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


@app.get("/principles", response_model=PrincipleListResponse)
def list_principles(user_id: int = 1, db: Session = Depends(get_db)):
    principles = db.execute(select(Principle).order_by(Principle.number)).scalars().all()
    user_progress_items = db.execute(
        select(UserProgress).where(UserProgress.user_id == user_id)
    ).scalars().all()
    status_map = {item.principle_id: item.status for item in user_progress_items}

    items = [
        PrincipleItem(
            id=p.id,
            number=p.number,
            title=p.title,
            official_text=p.official_text,
            summary=p.summary,
            psychometric_tension=p.psychometric_tension,
            hogan_competencies=p.hogan_competencies,
            behavioral_domains=p.behavioral_domains,
            status=status_map.get(p.id, "not_started"),
        )
        for p in principles
    ]
    return {"principles": items}


@app.get("/principles/{principle_id}", response_model=PrincipleItem)
def get_principle(principle_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    p = db.execute(select(Principle).where(Principle.id == principle_id)).scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail=f"Principle {principle_id} not found.")

    progress = db.execute(
        select(UserProgress).where(
            UserProgress.user_id == user_id, UserProgress.principle_id == principle_id
        )
    ).scalar_one_or_none()

    return PrincipleItem(
        id=p.id,
        number=p.number,
        title=p.title,
        official_text=p.official_text,
        summary=p.summary,
        psychometric_tension=p.psychometric_tension,
        hogan_competencies=p.hogan_competencies,
        behavioral_domains=p.behavioral_domains,
        status=progress.status if progress else "not_started",
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
        "level": user.level if user.level else compute_level(user.xp),
        "streak_count": user.streak_count,
        "xp_to_next_level": xp_to_next_level(user.xp),
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


@app.get("/")
def root():
    return {
        "status": "ok",
        "app": settings.app_name,
        "docs": "/docs",
        "principles": "/principles",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
