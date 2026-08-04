from datetime import datetime
from pydantic import BaseModel, Field


class LessonNextRequest(BaseModel):
    user_id: int
    user_input: str | None = None


class LessonStepResponse(BaseModel):
    step: str
    text: str
    options: list[str] | None = None
    avatar_state: str
    step_number: int
    total_steps: int = 6
    xp: int


class MentorAskRequest(BaseModel):
    user_id: int
    question: str
    principle_id: int | None = None


class MentorAskResponse(BaseModel):
    step: str = "mentor_ask"
    text: str
    options: list[str] | None = None
    avatar_state: str
    sources: list[str] = Field(default_factory=list)


class ProgressItem(BaseModel):
    principle_id: int
    status: str
    current_step: str
    step_number: int
    chosen_scenario_answer: str | None
    reflection_response: str | None
    completed_at: datetime | None


class UserProgressResponse(BaseModel):
    user_id: int
    xp: int
    progress: list[ProgressItem]


class BadgeItem(BaseModel):
    badge_id: int
    name: str
    criteria: str
    earned_at: datetime


class UserBadgesResponse(BaseModel):
    user_id: int
    badges: list[BadgeItem]
