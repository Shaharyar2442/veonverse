import {
  Sun,
  Rocket,
  Shield,
  TrendingUp,
  Flame,
  Users,
  Flag,
  Medal,
  UsersRound,
  Footprints,
} from "lucide-react";

// The 10 leadership principles, ordered to match C_FACTOR_SCENARIOS (the
// 10-principle journey).
//
// - `label`:       two-line form (uses `\n`) for the home-page tiles.
// - `short`:       compact form for the landing-page frieze.
// - `description`: the official "Core Definition & Summary" from the source
//                  documents in backend/data/principles/. Shown on the back of
//                  the flip cards on the Our Principles screen.
// - `icon`:        lucide fallback, used until real artwork is dropped into
//                  public/principles/ (see the README in that folder).
// - `art`:         filename of the official icon in public/principles/.
export const PRINCIPLE_TILES = [
  {
    title: "Clarity is Our Superpower",
    label: "Clarity is Our\nSuperpower",
    short: "Clarity",
    icon: Sun,
    art: "clarity.png",
    color: "#4b37c8",
    description:
      "Driving total transparency, cutting through corporate noise, and communicating with extreme precision. Leaders isolate what truly matters and eliminate unnecessary complexity so the team can align quickly and act with confidence.",
  },
  {
    title: "Our Pioneering Spirit Defines Us",
    label: "Our Pioneering\nSpirit Defines Us",
    short: "Pioneering",
    icon: Rocket,
    art: "pioneering.png",
    color: "#3d2fb4",
    description:
      "Embracing innovation, questioning legacy paradigms, and taking bold risks to invent new solutions. Leaders refuse to copy existing playbook formulas blindly; instead, they build from first principles based on genuine user needs.",
  },
  {
    title: "We Fight Against Mediocrity",
    label: "We Fight\nAgainst Mediocrity",
    short: "Anti-Mediocrity",
    icon: Shield,
    art: "mediocrity.png",
    color: "#3a2fae",
    description:
      "Rejecting “good enough” outcomes and actively raising standards through ownership, rigor, and continuous improvement. True leaders exhibit constructive dissatisfaction with the status quo to elevate performance from good to world-class.",
  },
  {
    title: "We Put Results Above Rituals",
    label: "We Put Results\nAbove Rituals",
    short: "Results First",
    icon: TrendingUp,
    art: "results.png",
    color: "#76b175",
    description:
      "Prioritizing tangible business outcomes and customer value over bureaucratic protocol, unnecessary committee approvals, and rigid governance rituals.",
  },
  {
    title: "We Hire for Potential and Drive",
    label: "We Hire for\nPotential and Drive",
    short: "Potential & Drive",
    icon: Users,
    art: "potential.png",
    color: "#78a88d",
    description:
      "Choosing high-learning-agility, ambitious talent capable of exponential growth over predictable candidates with static linear experience. Leaders mentor, empower, and build capabilities for the future.",
  },
  {
    title: "Courage Fuels Our Leadership",
    label: "Courage Fuels\nOur Leadership",
    short: "Courage",
    icon: Flame,
    art: "courage.png",
    color: "#fd703c",
    description:
      "Practicing radical candor, intellectual honesty, and standing up for what is right even when socially or politically uncomfortable. True leaders challenge flawed assumptions respectfully to protect the company’s objective success.",
  },
  {
    title: "We Aim for Audacious Impact",
    label: "We Aim for\nAudacious Impact",
    short: "Audacious Impact",
    icon: Flag,
    art: "audacious.png",
    color: "#4436bd",
    description:
      "Setting game-changing, exponential goals that reshape markets rather than settling for incremental, safe progress. Leaders champion bold vision, strategic disruption, and relentless execution.",
  },
  {
    title: "We Incentivize with Integrity",
    label: "We Incentivize\nwith Integrity",
    short: "Integrity",
    icon: Medal,
    art: "integrity.png",
    color: "#fd703c",
    description:
      "Uncompromising adherence to ethical boundaries and values. No commercial goal, financial incentive, or aggressive target is worth compromising integrity, compliance, or stakeholder trust.",
  },
  {
    title: "We Stand Strong Together",
    label: "We Stand Strong\nTogether",
    short: "Together",
    icon: UsersRound,
    art: "together.png",
    color: "#df7042",
    description:
      "Fostering an interdependent ecosystem over lone-wolf behaviors. True leaders build cross-functional synergy, elevate team capabilities, and win together as one unified organization.",
  },
  {
    title: "We Never Give Up",
    label: "We Never\nGive Up",
    short: "Never Give Up",
    icon: Footprints,
    art: "persistence.png",
    color: "#76b175",
    description:
      "Demonstrating unyielding grit, emotional composure, and resilience when encountering major strategic roadblocks. Leaders treat adversity as a learning mechanism to re-strategize, adapt, and drive forward to completion.",
  },
];
