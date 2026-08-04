from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Badge, Principle, User


PILOT_PRINCIPLE_TEXT = (
    "We Fight Against Mediocrity means we reject 'good enough' outcomes and "
    "actively raise standards through ownership, rigor, and continuous improvement."
)


def seed_initial_data(db: Session) -> None:
    principle = db.execute(select(Principle).where(Principle.id == 1)).scalar_one_or_none()
    if not principle:
        db.add(
            Principle(
                id=1,
                number=1,
                title="We Fight Against Mediocrity",
                official_text=PILOT_PRINCIPLE_TEXT,
                summary="Rejecting good enough and raising the bar for excellence.",
            )
        )

    user = db.execute(select(User).where(User.id == 1)).scalar_one_or_none()
    if not user:
        db.add(User(id=1, name="Pilot User", xp=0))

    badge = db.execute(select(Badge).where(Badge.id == 1)).scalar_one_or_none()
    if not badge:
        db.add(
            Badge(
                id=1,
                name="Excellence Starter",
                criteria="Complete the 'We Fight Against Mediocrity' pilot lesson.",
            )
        )

    db.commit()
