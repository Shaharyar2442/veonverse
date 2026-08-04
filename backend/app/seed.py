from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Badge, Principle, User


PRINCIPLES_SEED = [
    {
        "id": 1,
        "number": 1,
        "title": "Clarity is Our Superpower",
        "official_text": (
            "Clarity is Our Superpower means driving total transparency, cutting through noise, "
            "and communicating with extreme precision. Leaders isolate what truly matters and eliminate unnecessary complexity."
        ),
        "summary": "Synthesizing complex data into unambiguous priorities and rapid decisions.",
        "psychometric_tension": "Simplification vs. Comprehensiveness",
        "hogan_competencies": "Communication, Decision-making",
        "behavioral_domains": "Interpersonal / Leadership",
        "badge_name": "Clarity Champion",
        "badge_criteria": "Complete the 'Clarity is Our Superpower' leadership principle lesson.",
    },
    {
        "id": 2,
        "number": 2,
        "title": "Our Pioneering Spirit Defines Us",
        "official_text": (
            "Our Pioneering Spirit Defines Us means embracing innovation, questioning legacy paradigms, "
            "and taking bold risks to invent new solutions from first principles."
        ),
        "summary": "Creating solutions from scratch based on user needs over safe best-practice replication.",
        "psychometric_tension": "Innovation vs. Sticking to Proven Best-Practices",
        "hogan_competencies": "Driving Innovation, Taking Smart Risks",
        "behavioral_domains": "Business / Business & Interpersonal",
        "badge_name": "Pioneer Trailblazer",
        "badge_criteria": "Complete the 'Our Pioneering Spirit Defines Us' leadership principle lesson.",
    },
    {
        "id": 3,
        "number": 3,
        "title": "We Fight Against Mediocrity",
        "official_text": (
            "We Fight Against Mediocrity means rejecting 'good enough' outcomes and actively raising "
            "standards through ownership, rigor, and continuous improvement."
        ),
        "summary": "Disrupting steady-state execution to elevate performance from good to world-class.",
        "psychometric_tension": "Constructive Dissatisfaction (Restlessness) vs. Contented Steady-State Execution (Stability)",
        "hogan_competencies": "Driving for Results, Self-development",
        "behavioral_domains": "Intrapersonal / Interpersonal & Interpersonal",
        "badge_name": "Excellence Driver",
        "badge_criteria": "Complete the 'We Fight Against Mediocrity' leadership principle lesson.",
    },
    {
        "id": 4,
        "number": 4,
        "title": "We Put Results Above Rituals",
        "official_text": (
            "We Put Results Above Rituals means prioritizing tangible business outcomes and customer value "
            "over bureaucratic protocol, unnecessary committee approvals, and rigid governance rituals."
        ),
        "summary": "Choosing outcome-driven agility and accountability over rigid corporate protocols.",
        "psychometric_tension": "Outcome-Driven Agility vs. Protocol Compliance",
        "hogan_competencies": "Driving Performance, Accountability",
        "behavioral_domains": "Leadership / Leadership & Interpersonal",
        "badge_name": "Agility Master",
        "badge_criteria": "Complete the 'We Put Results Above Rituals' leadership principle lesson.",
    },
    {
        "id": 5,
        "number": 5,
        "title": "We Hire for Potential and Drive",
        "official_text": (
            "We Hire for Potential and Drive means choosing high-learning-agility, ambitious talent capable of "
            "exponential growth over predictable candidates with static linear experience."
        ),
        "summary": "Betting on unproven, high-potential drivers with massive learning agility.",
        "psychometric_tension": "High Potential Drivers vs. Safe Bets with Tested Experience",
        "hogan_competencies": "Developing People, Self-development",
        "behavioral_domains": "Leadership / Leadership & Interpersonal",
        "badge_name": "Talent Catalyst",
        "badge_criteria": "Complete the 'We Hire for Potential and Drive' leadership principle lesson.",
    },
    {
        "id": 6,
        "number": 6,
        "title": "Courage Fuels Our Leadership",
        "official_text": (
            "Courage Fuels Our Leadership means practicing radical candor, intellectual honesty, and standing up "
            "for what is right even when socially or politically uncomfortable."
        ),
        "summary": "Challenging flawed assumptions respectfully to protect objective business success.",
        "psychometric_tension": "Radical Candor & Intellectual Honesty vs. Social Preservation & Diplomatic Harmony",
        "hogan_competencies": "Taking Smart Risks, Integrity",
        "behavioral_domains": "Intrapersonal / Interpersonal & Interpersonal",
        "badge_name": "Courageous Leader",
        "badge_criteria": "Complete the 'Courage Fuels Our Leadership' leadership principle lesson.",
    },
    {
        "id": 7,
        "number": 7,
        "title": "We Aim for Audacious Impact",
        "official_text": (
            "We Aim for Audacious Impact means setting game-changing, exponential goals that reshape markets "
            "rather than settling for incremental, safe progress."
        ),
        "summary": "Championing exponential strategic moonshots over safe incremental security.",
        "psychometric_tension": "Exponential Moonshots (Disruption) vs. Incremental Security (Safe Margins)",
        "hogan_competencies": "Driving Strategy, Overcoming Obstacles",
        "behavioral_domains": "Leadership / Leadership & Interpersonal",
        "badge_name": "Moonshot Architect",
        "badge_criteria": "Complete the 'We Aim for Audacious Impact' leadership principle lesson.",
    },
    {
        "id": 8,
        "number": 8,
        "title": "We Incentivize with Integrity",
        "official_text": (
            "We Incentivize with Integrity means uncompromising adherence to ethical boundaries and values. "
            "No commercial target or financial incentive is worth compromising integrity."
        ),
        "summary": "Protecting value-driven ethical boundaries under high-stakes commercial pressure.",
        "psychometric_tension": "Value Driven Boundary vs. Results at All Costs",
        "hogan_competencies": "Integrity, Accountability",
        "behavioral_domains": "Intrapersonal / Interpersonal & Interpersonal",
        "badge_name": "Integrity Guardian",
        "badge_criteria": "Complete the 'We Incentivize with Integrity' leadership principle lesson.",
    },
    {
        "id": 9,
        "number": 9,
        "title": "We Stand Strong Together",
        "official_text": (
            "We Stand Strong Together means fostering an interdependent ecosystem over lone-wolf behaviors. "
            "True leaders build cross-functional synergy and win together as one unified organization."
        ),
        "summary": "Lifting team capacity and cross-functional alignment over siloed top performance.",
        "psychometric_tension": "Interdependent Ecosystem vs. Lone-Wolf",
        "hogan_competencies": "Teamwork, Relationship Building",
        "behavioral_domains": "Interpersonal / Interpersonal & Interpersonal",
        "badge_name": "Unity Builder",
        "badge_criteria": "Complete the 'We Stand Strong Together' leadership principle lesson.",
    },
    {
        "id": 10,
        "number": 10,
        "title": "We Never Give Up",
        "official_text": (
            "We Never Give Up means demonstrating unyielding grit, emotional composure, and resilience "
            "when encountering major strategic roadblocks to adapt and succeed."
        ),
        "summary": "Persisting through major roadblocks with grit, composure, and tactical adaptation.",
        "psychometric_tension": "Grit vs. Sunk-Cost Containment",
        "hogan_competencies": "Overcoming Obstacles, Handling Stress",
        "behavioral_domains": "Intrapersonal / Interpersonal & Interpersonal",
        "badge_name": "Resilience Titan",
        "badge_criteria": "Complete the 'We Never Give Up' leadership principle lesson.",
    },
]


def seed_initial_data(db: Session) -> None:
    for data in PRINCIPLES_SEED:
        principle = db.execute(select(Principle).where(Principle.id == data["id"])).scalar_one_or_none()
        if not principle:
            principle = Principle(
                id=data["id"],
                number=data["number"],
                title=data["title"],
                official_text=data["official_text"],
                summary=data["summary"],
                psychometric_tension=data["psychometric_tension"],
                hogan_competencies=data["hogan_competencies"],
                behavioral_domains=data["behavioral_domains"],
            )
            db.add(principle)
        else:
            principle.number = data["number"]
            principle.title = data["title"]
            principle.official_text = data["official_text"]
            principle.summary = data["summary"]
            principle.psychometric_tension = data["psychometric_tension"]
            principle.hogan_competencies = data["hogan_competencies"]
            principle.behavioral_domains = data["behavioral_domains"]

        badge = db.execute(select(Badge).where(Badge.id == data["id"])).scalar_one_or_none()
        if not badge:
            badge = Badge(
                id=data["id"],
                name=data["badge_name"],
                criteria=data["badge_criteria"],
            )
            db.add(badge)
        else:
            badge.name = data["badge_name"]
            badge.criteria = data["badge_criteria"]

    user = db.execute(select(User).where(User.id == 1)).scalar_one_or_none()
    if not user:
        db.add(User(id=1, name="Leader Candidate", xp=0, level=1, streak_count=1))

    db.commit()
