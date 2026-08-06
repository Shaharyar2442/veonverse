export const C_FACTOR_SCENARIOS = [
  {
    stageId: 1,
    stageName: "Principle 1",
    principleTitle: "Clarity is Our Superpower",
    psychometricTension: "Simplification vs. Complexity",
    leftForce: "Simplification",
    rightForce: "Complexity",
    hoganTarget: "Communication & Rapid Execution",
    locationTag: "Kyivstar & Jazz Ops Command Center",
    visualConcept: "nodes", // Represents chaotic nodes converging
    takeaways: [
      "Isolate the single metric that matters most during critical decisions.",
      "Eliminate administrative noise to enable rapid operational execution."
    ],
    dialogue: [
      "It is 11:45 PM—15 minutes before launching our 5-million user digital wallet.",
      "400 conflicting metric reports just landed on your desk.",
      "Engineers argue over server latency, marketing demands cohort studies, and legal wants paperwork review.",
      "How do we apply clarity right now?"
    ],
    choices: [
      {
        id: "A",
        text: "Isolate the single core metric (API Response Time) and launch immediately.",
        score: 100,
        stars: 3,
        badge: "Clarity Superpower Badge",
        feedback:
          "Great choice. You cut through complexity, focused on the single metric that matters, and enabled the team to execute with total clarity.",
      },
      {
        id: "B",
        text: "Pause the launch for 2 hours to analyze all 60 pages of secondary metric decks.",
        score: 40,
        stars: 1,
        badge: "Clarity Explorer Badge",
        feedback:
          "Exhaustive documentation feels safe, but delaying for secondary metrics sacrifices agility. Clarity means simplifying when speed is critical.",
      },
    ],
  },
  {
    stageId: 2,
    stageName: "Principle 2",
    principleTitle: "Our Pioneering Spirit Defines Us",
    psychometricTension: "Innovation vs. Proven Best-Practices",
    leftForce: "First-Principles Innovation",
    rightForce: "Proven Competitor Playbooks",
    hoganTarget: "Driving Innovation & Smart Risk-Taking",
    locationTag: "Beeline Kazakhstan Innovation Lab",
    visualConcept: "orbit", // Represents breaking out of a standard orbit
    takeaways: [
      "Challenge legacy playbooks when raw customer needs demand novel architecture.",
      "Pioneers accept smart calculated risks rather than waiting for external consensus."
    ],
    dialogue: [
      "Our legacy customer billing system has failed for the third time this month.",
      "Traditional operators recommend hiring a consulting firm to copy an established competitor playbook.",
      "Your lead engineer proposes building a pioneer AI micro-billing algorithm from scratch in 48 hours, tailored specifically to raw user habits.",
      "What is your directive?"
    ],
    choices: [
      {
        id: "A",
        text: "Build the proprietary AI micro-billing algorithm from scratch based on raw user needs.",
        score: 100,
        stars: 3,
        badge: "Pioneering Innovator Badge",
        feedback:
          "True VEON Pioneer mindset. You accepted the risk of the unknown over external validation, creating a new benchmark across our OpCos.",
      },
      {
        id: "B",
        text: "Copy the competitor's safe, 5-year-old billing playbook to avoid risk.",
        score: 35,
        stars: 1,
        badge: "Pioneer Explorer Badge",
        feedback:
          "Replicating competitor models feels safe, but pioneers do not look for safety in external validation.",
      },
    ],
  },
  {
    stageId: 3,
    stageName: "Principle 3",
    principleTitle: "We Fight Against Mediocrity",
    psychometricTension: "Constructive Dissatisfaction vs. Stability",
    leftForce: "Constructive Restlessness",
    rightForce: "Steady-State Comfort",
    hoganTarget: "Driving for Results & High Standards",
    locationTag: "VEON HQ Executive Suite — Dubai",
    visualConcept: "pulse", // Represents a flatline turning into a dynamic heartbeat/pulse
    takeaways: [
      "Good enough is the enemy of world-class execution.",
      "Practice constructive dissatisfaction to push baseline goals into exponential growth."
    ],
    dialogue: [
      "Your regional team presents their quarterly report, hitting a standard baseline 5% growth KPI.",
      "Everyone is ready to sign off and wrap up early.",
      "You notice the strategy relies on lazy routines with zero long-term ambition.",
      "The team is expecting easy approval. What do you do?"
    ],
    choices: [
      {
        id: "A",
        text: "Express constructive dissatisfaction, challenge the status quo, and push for a 3x moonshot target.",
        score: 100,
        stars: 3,
        badge: "Mediocrity Crusader Badge",
        feedback:
          "Refusing to settle for mediocrity unlocks breakthrough growth. Your team reframed their vision for the future.",
      },
      {
        id: "B",
        text: "Accept the baseline report to preserve peace and keep the team comfortable.",
        score: 30,
        stars: 1,
        badge: "Excellence Seeker Badge",
        feedback:
          "Comfort breeds stagnation. Fighting mediocrity requires constructive dissatisfaction even when things seem 'good enough'.",
      },
    ],
  },
  {
    stageId: 4,
    stageName: "Principle 4",
    principleTitle: "We Put Results Above Rituals",
    psychometricTension: "Outcome Agility vs. Protocol Compliance",
    leftForce: "Outcome Agility",
    rightForce: "Protocol Bureaucracy",
    hoganTarget: "Accountability & Speed of Execution",
    locationTag: "Banglalink Digital Studio — Dhaka",
    visualConcept: "blocks", // Represents shattering rigid blocks
    takeaways: [
      "Protocols exist to serve customer outcomes, not internal administrative habits.",
      "Eliminate empty committee rituals when speed and connectivity are at stake."
    ],
    dialogue: [
      "A network outage in a key province requires an immediate patch.",
      "Standard procedure dictates waiting 7 days for a 5-committee sign-off ritual.",
      "2 million users are without connectivity right now.",
      "Your engineering lead has verified patch safety and can deploy in 60 seconds. What is your call?"
    ],
    choices: [
      {
        id: "A",
        text: "Bypass empty bureaucracy, verify patch safety, and restore connectivity instantly.",
        score: 100,
        stars: 3,
        badge: "Results Over Rituals Badge",
        feedback:
          "Outcome-driven agility. You prioritized real customer impact over compliance rituals, restoring connectivity in minutes.",
      },
      {
        id: "B",
        text: "Wait 7 days for all 5 committee meetings to finish their approval forms.",
        score: 35,
        stars: 1,
        badge: "Agility Explorer Badge",
        feedback:
          "Protocols exist to serve outcomes—not the other way around. Eliminate empty rituals when customer impact is at stake.",
      },
    ],
  },
  {
    stageId: 5,
    stageName: "Principle 5",
    principleTitle: "We Hire for Potential and Drive",
    psychometricTension: "Raw Grit & Curiosity vs. Resume Pedigree",
    leftForce: "Learning Agility & Hunger",
    rightForce: "Static Corporate Pedigree",
    hoganTarget: "Talent Scouting & High-Drive Leadership",
    locationTag: "Jazz Digital Academy — Islamabad",
    visualConcept: "growth", // Represents a spark growing into a massive flame
    takeaways: [
      "Technical skills can be coached; intrinsic hunger and potential cannot.",
      "Bet on self-taught drivers with high learning velocity over static pedigree."
    ],
    dialogue: [
      "You are selecting the lead for our new FinTech Venture.",
      "Candidate A has a 15-year corporate resume but zero hunger.",
      "Candidate B is a self-taught engineer with extreme drive and curiosity.",
      "Candidate B lacks traditional credentials but built an open-source payment gateway in her spare time. Who do you select?"
    ],
    choices: [
      {
        id: "A",
        text: "Hire Candidate B for her extraordinary potential, hunger, and self-taught drive.",
        score: 100,
        stars: 3,
        badge: "Potential & Drive Talent Champion",
        feedback:
          "Outstanding talent choice. Skills can be coached, but raw hunger and potential drive exponential innovation.",
      },
      {
        id: "B",
        text: "Hire Candidate A for his polished 15-year corporate resume pedigree.",
        score: 40,
        stars: 1,
        badge: "Pedigree Explorer Badge",
        feedback:
          "Resumes show past accomplishments; drive creates future breakthroughs. Always hire for potential and hunger.",
      },
    ],
  },
  {
    stageId: 6,
    stageName: "Principle 6",
    principleTitle: "Courage Fuels Our Leadership",
    psychometricTension: "Brave Accountability vs. Passive Consent",
    leftForce: "Radical Candor & Transparency",
    rightForce: "Diplomatic Silence",
    hoganTarget: "Courageous Decision Making under Pressure",
    locationTag: "Kyivstar Crisis Command Center — Kyiv",
    visualConcept: "shield", // Represents a strong, transparent shield
    takeaways: [
      "Radical transparency protects long-term brand equity over short-term comfort.",
      "Lead with brave ownership during high-pressure crises."
    ],
    dialogue: [
      "During a severe network emergency, executive consensus favors staying silent until tomorrow morning.",
      "However, delaying public updates breaks customer trust.",
      "Taking ownership right now means facing public scrutiny, but transparency protects long-term brand integrity.",
      "What do you do?"
    ],
    choices: [
      {
        id: "A",
        text: "Step up courageously, take full accountability, and publish transparent real-time updates.",
        score: 100,
        stars: 3,
        badge: "Courageous Leader Badge",
        feedback:
          "True courageous leadership. Standing up in high-pressure moments builds unshakeable trust with employees and customers.",
      },
      {
        id: "B",
        text: "Remain silent and wait until tomorrow morning to avoid public scrutiny.",
        score: 30,
        stars: 1,
        badge: "Caution Explorer Badge",
        feedback:
          "Silence during a crisis erodes trust. Courage fuels our leadership when taking hard decisions under pressure.",
      },
    ],
  },
  {
    stageId: 7,
    stageName: "Principle 7",
    principleTitle: "We Aim for Audacious Impact",
    psychometricTension: "Exponential Moonshots vs. Incremental Security",
    leftForce: "Exponential Disruption",
    rightForce: "Incremental Margins",
    hoganTarget: "Driving Strategy & Overcoming Obstacles",
    locationTag: "Beeline Uzbekistan Tech Hub",
    visualConcept: "rocket", // Represents an exponential curve launching upward
    takeaways: [
      "Incremental targets result in ordinary outcomes.",
      "Champion moonshot strategic initiatives that re-architect the market."
    ],
    dialogue: [
      "You are finalizing the 3-year network expansion strategy.",
      "Plan A offers a safe 5% incremental urban coverage increase.",
      "Plan B proposes an audacious moonshot: deploying direct-to-cell satellite coverage for 100% rural connectivity across the entire country.",
      "Which path do we take?"
    ],
    choices: [
      {
        id: "A",
        text: "Champion Plan B's audacious satellite moonshot to transform nationwide connectivity.",
        score: 100,
        stars: 3,
        badge: "Audacious Moonshot Pioneer",
        feedback:
          "Audacious Impact achieved. Your bold moonshot connected 3 million unreached citizens and established market leadership.",
      },
      {
        id: "B",
        text: "Select Plan A for safe 5% incremental growth to avoid ambitious risk.",
        score: 40,
        stars: 1,
        badge: "Impact Explorer Badge",
        feedback:
          "Incremental goals produce ordinary results. We aim for audacious impact that transforms whole industries.",
      },
    ],
  },
  {
    stageId: 8,
    stageName: "Principle 8",
    principleTitle: "We Incentivize with Integrity",
    psychometricTension: "Ethical Alignment vs. Short-Term Shortcuts",
    leftForce: "Uncompromising Integrity",
    rightForce: "Short-Term Financial Gain",
    hoganTarget: "Ethics, Integrity & Sustainable Value",
    locationTag: "VEON Global Governance Center — Amsterdam",
    visualConcept: "balance", // Represents perfectly balanced scales
    takeaways: [
      "Short-term commercial gain never justifies compromising ethical boundaries.",
      "Align incentive structures strictly with sustainable, long-term enterprise value."
    ],
    dialogue: [
      "A vendor offers a short-term rebate that inflates this quarter's bonus payout.",
      "However, it creates long-term financial liability for the company next year.",
      "Everyone around the table is tempted to take the quick win.",
      "How do you align incentives with integrity?"
    ],
    choices: [
      {
        id: "A",
        text: "Reject the shortcut, report the conflict, and align bonuses strictly with long-term ethical value.",
        score: 100,
        stars: 3,
        badge: "Integrity Champion Badge",
        feedback:
          "Integrity in action. True leaders never trade long-term organizational health for short-term personal gain.",
      },
      {
        id: "B",
        text: "Accept the vendor rebate to inflate this quarter's bonus payout.",
        score: 25,
        stars: 1,
        badge: "Short-Term Explorer Badge",
        feedback:
          "Incentives without integrity compromise the enterprise. We reward sustainable, ethical value creation.",
      },
    ],
  },
  {
    stageId: 9,
    stageName: "Principle 9",
    principleTitle: "We Stand Strong Together",
    psychometricTension: "One-VEON Synergies vs. Siloed Turf Wars",
    leftForce: "One-VEON Synergy",
    rightForce: "Siloed Turf Preservation",
    hoganTarget: "Cross-Functional Collaboration & Unity",
    locationTag: "Jazz & Kyivstar Joint Engineering Cell",
    visualConcept: "merge", // Represents isolated nodes merging into a strong core
    takeaways: [
      "Break down OpCo silos to scale global technology platforms.",
      "Eliminate duplication by uniting talent under one shared organizational mission."
    ],
    dialogue: [
      "Two regional OpCo engineering teams are duplicating code and building competing cloud platforms.",
      "This turf war is wasting $4 million in capital.",
      "Team leads are aggressively protecting their local silos.",
      "How do you unite them under the One-VEON banner?"
    ],
    choices: [
      {
        id: "A",
        text: "Merge the engineering cells into a single unified One-VEON Cloud Architecture team.",
        score: 100,
        stars: 3,
        badge: "One-VEON Unity Champion",
        feedback:
          "One-VEON synergy achieved. By breaking down silos, you unlocked massive scale, shared expertise, and $4M in savings.",
      },
      {
        id: "B",
        text: "Allow both teams to continue competing and duplicating efforts in isolated silos.",
        score: 35,
        stars: 1,
        badge: "Silo Explorer Badge",
        feedback:
          "Duplication divides our strength. We stand strong together by scaling global synergies across all OpCos.",
      },
    ],
  },
  {
    stageId: 10,
    stageName: "Principle 10",
    principleTitle: "We Never Give Up",
    psychometricTension: "Relentless Persistence vs. Premature Surrender",
    leftForce: "Relentless Grit",
    rightForce: "Premature Surrender",
    hoganTarget: "Resilience, Perseverance & Grit",
    locationTag: "Banglalink Disaster Recovery Command — Dhaka",
    visualConcept: "core", // Represents a core glowing brighter despite external pressure
    takeaways: [
      "In times of severe disruption, perseverance defines leadership.",
      "Maintain emotional composure and rally teams to overcome seemingly impossible roadblocks."
    ],
    dialogue: [
      "A category 5 cyclone has knocked out 80% of regional cell towers.",
      "Third-party contractors declare restoration impossible for at least 30 days.",
      "Local emergency services rely on our network for rescue operations.",
      "Giving up is not an option. What is your directive?"
    ],
    choices: [
      {
        id: "A",
        text: "Mobilize emergency mobile radio units, rally internal engineers, and restore critical links in 24 hours.",
        score: 100,
        stars: 3,
        badge: "Relentless Grit & Resilience Leader",
        feedback:
          "Unstoppable VEON spirit. Your relentless persistence restored lifesaving connectivity when everyone else gave up.",
      },
      {
        id: "B",
        text: "Accept the contractor's 30-day delay and suspend restoration efforts.",
        score: 30,
        stars: 1,
        badge: "Persistence Explorer Badge",
        feedback:
          "When challenges seem insurmountable, VEON leaders find a way. We never give up when communities depend on us.",
      },
    ],
  },
];
