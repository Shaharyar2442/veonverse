from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models import User


def compute_level(xp: int) -> int:
    return max(1, 1 + (xp // 100))


def xp_to_next_level(xp: int) -> int:
    current_level = compute_level(xp)
    return max(0, current_level * 100 - xp)


def award_xp_and_touch_activity(db: Session, user: User, xp_delta: int) -> None:
    if xp_delta <= 0:
        _touch_activity(user)
        return

    user.xp += xp_delta
    user.level = compute_level(user.xp)
    _touch_activity(user)
    db.flush()


def _touch_activity(user: User) -> None:
    today = date.today().isoformat()
    if not user.last_active_day:
        user.streak_count = 1
    else:
        last_day = date.fromisoformat(user.last_active_day)
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        if user.last_active_day == today:
            return
        if user.last_active_day == yesterday:
            user.streak_count += 1
        else:
            user.streak_count = 1
    user.last_active_day = today
