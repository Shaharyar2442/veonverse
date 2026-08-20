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
// - `label`: two-line form (uses `\n`) for the home-page tiles.
// - `short`: compact form for the landing-page frieze.
export const PRINCIPLE_TILES = [
  { title: "Clarity is Our Superpower", label: "Clarity is Our\nSuperpower", short: "Clarity", icon: Sun, color: "#fbbf24" },
  { title: "Our Pioneering Spirit Defines Us", label: "Our Pioneering\nSpirit Defines Us", short: "Pioneering", icon: Rocket, color: "#60a5fa" },
  { title: "We Fight Against Mediocrity", label: "We Fight\nAgainst Mediocrity", short: "Anti-Mediocrity", icon: Shield, color: "#a78bfa" },
  { title: "We Put Results Above Rituals", label: "We Put Results\nAbove Rituals", short: "Results First", icon: TrendingUp, color: "#34d399" },
  { title: "We Hire for Potential and Drive", label: "We Hire for\nPotential and Drive", short: "Potential & Drive", icon: Users, color: "#4ade80" },
  { title: "Courage Fuels Our Leadership", label: "Courage Fuels\nOur Leadership", short: "Courage", icon: Flame, color: "#fb923c" },
  { title: "We Aim for Audacious Impact", label: "We Aim for\nAudacious Impact", short: "Audacious Impact", icon: Flag, color: "#60a5fa" },
  { title: "We Incentivize with Integrity", label: "We Incentivize\nwith Integrity", short: "Integrity", icon: Medal, color: "#fbbf24" },
  { title: "We Stand Strong Together", label: "We Stand Strong\nTogether", short: "Together", icon: UsersRound, color: "#c084fc" },
  { title: "We Never Give Up", label: "We Never\nGive Up", short: "Never Give Up", icon: Footprints, color: "#2dd4bf" },
];
