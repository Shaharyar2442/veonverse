export const STORY_TREE = [
  {
    principleId: 1,
    number: 1,
    title: "Clarity is Our Superpower",
    psychometricTension: "Simplification vs. Comprehensiveness",
    bgGradient: "linear-gradient(135deg, #091830 0%, #040914 100%)",
    sceneTitle: "Scene 1: The Midnight Launch Crisis",
    location: "Kyivstar & Jazz Joint Command Center",
    avatarIntro:
      "Welcome to the Kyivstar Launch Hub! It's 11:45 PM—15 minutes before our joint digital wallet launch across 5 million users. Your team handed you a massive 60-page diagnostic report with 400 conflicting metrics.",
    storyScenario:
      "Engineers argue over server latency, marketing wants cohort studies, and legal is re-checking paperwork. The clock is ticking down.",
    avatarPrompt: "How do you lead the team right now to ensure clarity and execute on time?",
    choices: [
      {
        id: "A",
        text: "⚡ Isolate the single metric that matters most (API Response Time) and launch immediately.",
        isCorrect: true,
        feedbackText:
          "Brilliant move! You cut through the noise, isolated the core superpower metric, and enabled 5 million users to onboard seamlessly without getting bogged down in 60 pages of analysis paralysis.",
        xp: 100,
        badgeName: "Superpower Clarity Champion",
      },
      {
        id: "B",
        text: "📊 Pause the launch and spend 2 hours reviewing all 60 pages of secondary diagnostic data.",
        isCorrect: false,
        feedbackText:
          "Exhaustive documentation feels safe, but delaying a major product launch for secondary metrics sacrifices agility. Clarity means simplifying to what matters most when speed is critical.",
        xp: 30,
        badgeName: "Clarity Apprentice",
      },
    ],
  },
  {
    principleId: 2,
    number: 2,
    title: "Our Pioneering Spirit Defines Us",
    psychometricTension: "Innovation vs. Proven Best-Practices",
    bgGradient: "linear-gradient(135deg, #180930 0%, #0a0414 100%)",
    sceneTitle: "Scene 2: The Broken Legacy Billing System",
    location: "Beeline Kazakhstan Innovation Lab",
    avatarIntro:
      "You are reviewing a legacy customer billing system that has failed three times this month. Traditional operators recommend hiring a consulting firm to copy an established competitor playbook.",
    storyScenario:
      "Your lead engineer pulls you aside: 'We can build a pioneer AI micro-billing algorithm from scratch in 48 hours tailored specifically to raw user habits, but it has never been done in Central Asia before.'",
    avatarPrompt: "What decision defines our pioneering spirit?",
    choices: [
      {
        id: "A",
        text: "🚀 Build the proprietary AI micro-billing system from scratch based on raw user needs.",
        isCorrect: true,
        feedbackText:
          "That is the true VEON Pioneer mindset! You accepted the risk of the unknown over the safety of external validation, creating a breakthrough system that sets a new benchmark across all OpCos.",
        xp: 100,
        badgeName: "Pioneering Spirit Pioneer",
      },
      {
        id: "B",
        text: "📜 Copy the competitor's safe, proven 5-year-old billing playbook to avoid risk.",
        isCorrect: false,
        feedbackText:
          "Replicating competitor models feels safe, but pioneers do not look for safety in external validation—they create solutions from first principles.",
        xp: 30,
        badgeName: "Pioneer Explorer",
      },
    ],
  },
  {
    principleId: 3,
    number: 3,
    title: "We Fight Against Mediocrity",
    psychometricTension: "Constructive Dissatisfaction vs. Stability",
    bgGradient: "linear-gradient(135deg, #300918 0%, #14040a 100%)",
    sceneTitle: "Scene 3: The 'Good Enough' Quarterly Review",
    location: "VEON HQ Executive Suite — Dubai",
    avatarIntro:
      "Your team just presented their quarterly growth report. The numbers hit the baseline target, but the strategy relies on outdated routines with zero ambitious breakthrough goals.",
    storyScenario:
      "The room is quiet. Everyone is ready to wrap up early and celebrate a 'satisfactory' quarter. But you know VEON's true potential is far greater.",
    avatarPrompt: "How do you respond to maintain high standards?",
    choices: [
      {
        id: "A",
        text: "🔥 Challenge the status quo with constructive dissatisfaction and push for a 3x moonshot target.",
        isCorrect: true,
        feedbackText:
          "Refusing to accept mediocrity is how we transform industries! Your team reframing their goals unlocked a massive 300% growth trajectory for next quarter.",
        xp: 100,
        badgeName: "Mediocrity Crusader",
      },
      {
        id: "B",
        text: "👍 Accept the baseline report to keep the team comfortable and preserve harmony.",
        isCorrect: false,
        feedbackText:
          "Comfort breeds stagnation. Fighting against mediocrity requires constructive dissatisfaction even when things seem 'good enough'.",
        xp: 30,
        badgeName: "Excellence Seeker",
      },
    ],
  },
  {
    principleId: 4,
    number: 4,
    title: "We Put Results Above Rituals",
    psychometricTension: "Outcome Agility vs. Protocol Compliance",
    bgGradient: "linear-gradient(135deg, #093018 0%, #04140a 100%)",
    sceneTitle: "Scene 4: The 5-Layer Approval Chain",
    location: "Banglalink Digital Studio — Dhaka",
    avatarIntro:
      "A sudden network outage in a key region requires an immediate infrastructure patch. Standard policy dictates a 7-day 5-committee sign-off ritual before deploying any fix.",
    storyScenario:
      "Customers are losing connection right now. Your engineering lead has verified the patch and is ready to push it live in 60 seconds.",
    avatarPrompt: "Which action puts results first?",
    choices: [
      {
        id: "A",
        text: "⚡ Bypass unnecessary bureaucracy, verify patch safety, and restore customer service instantly.",
        isCorrect: true,
        feedbackText:
          "Outcome-driven agility! You prioritized real customer impact over compliance rituals, restoring connectivity to 2 million people in minutes.",
        xp: 100,
        badgeName: "Results Over Rituals Leader",
      },
      {
        id: "B",
        text: "📑 Wait 7 days for all 5 committee meetings to finish their protocol forms.",
        isCorrect: false,
        feedbackText:
          "Protocols exist to serve outcomes—not the other way around. When customer impact is at stake, eliminate empty rituals.",
        xp: 30,
        badgeName: "Agility Driver",
      },
    ],
  },
  {
    principleId: 5,
    number: 5,
    title: "We Hire for Potential and Drive",
    psychometricTension: "High Potential Drivers vs. Safe Candidates",
    bgGradient: "linear-gradient(135deg, #281809 0%, #120a04 100%)",
    sceneTitle: "Scene 5: The Final Candidate Selection",
    location: "Mobilink Bank Talent Hub — Islamabad",
    avatarIntro:
      "You are hiring a Lead Product Director for a new Fintech product. You have two final candidates in front of you.",
    storyScenario:
      "Candidate A has 15 years at a legacy bank with a safe, rigid resume. Candidate B is a hungry young innovator with raw drive, incredible learning agility, and a passion to disrupt financial inclusion.",
    avatarPrompt: "Who do you select to fuel VEON's future?",
    choices: [
      {
        id: "A",
        text: "🌟 Hire Candidate B for their high potential, learning agility, and relentless hunger.",
        isCorrect: true,
        feedbackText:
          "Spot on! Drive and potential scale exponentially. Candidate B launched 4 breakthrough features in their first 90 days!",
        xp: 100,
        badgeName: "Talent Catalyst",
      },
      {
        id: "B",
        text: "📋 Hire Candidate A because 15 years of legacy experience feels safer on paper.",
        isCorrect: false,
        feedbackText:
          "Past experience without drive produces incremental results. We build high-performing teams by betting on potential and hunger.",
        xp: 30,
        badgeName: "Talent Assessor",
      },
    ],
  },
  {
    principleId: 6,
    number: 6,
    title: "Courage Fuels Our Leadership",
    psychometricTension: "Radical Candor vs. Social Preservation",
    bgGradient: "linear-gradient(135deg, #300909 0%, #140404 100%)",
    sceneTitle: "Scene 6: The Flawed Strategic Partnership",
    location: "Global Leadership Steering Committee",
    avatarIntro:
      "During a high-stakes partnership meeting, a vendor presents a deal that looks lucrative on paper, but you notice a hidden clause that compromises customer privacy.",
    storyScenario:
      "Everyone around the table is smiling and ready to sign. Pointing out the flaw will cause tension and delay the deal, but staying silent puts customer trust at risk.",
    avatarPrompt: "How do you show courageous leadership?",
    choices: [
      {
        id: "A",
        text: "🦁 Speak up with radical candor, highlight the privacy risk publicly, and insist on fixing it.",
        isCorrect: true,
        feedbackText:
          "Courage in action! Protecting customer trust requires radical candor, even when it interrupts executive consensus. You saved the company from a major reputational crisis.",
        xp: 100,
        badgeName: "Courageous Vanguard",
      },
      {
        id: "B",
        text: "🤐 Remain silent to preserve social harmony and avoid creating awkwardness in the room.",
        isCorrect: false,
        feedbackText:
          "Social preservation at the cost of truth is dangerous. Courageous leaders speak up when values or integrity are on the line.",
        xp: 30,
        badgeName: "Truth Advocate",
      },
    ],
  },
  {
    principleId: 7,
    number: 7,
    title: "We Aim for Audacious Impact",
    psychometricTension: "Exponential Moonshots vs. Incremental Security",
    bgGradient: "linear-gradient(135deg, #092830 0%, #041218 100%)",
    sceneTitle: "Scene 7: The 5G Infrastructure Blueprint",
    location: "Beeline Uzbekistan Tech Hub",
    avatarIntro:
      "You are finalizing the 3-year network expansion strategy. Plan A offers a safe, incremental 5% increase in urban coverage.",
    storyScenario:
      "Plan B proposes an audacious moonshot: deploying direct-to-cell satellite technology to achieve 100% nationwide connectivity, connecting remote mountain communities for the first time.",
    avatarPrompt: "Which plan aligns with our audacious vision?",
    choices: [
      {
        id: "A",
        text: "🚀 Champion Plan B's audacious satellite moonshot to transform nationwide connectivity.",
        isCorrect: true,
        feedbackText:
          "Audacious Impact achieved! Your bold moonshot connected 3 million previously unreached citizens, establishing VEON as the undisputed digital market leader.",
        xp: 100,
        badgeName: "Audacious Moonshot Pioneer",
      },
      {
        id: "B",
        text: "🛡️ Select Plan A for safe 5% incremental growth to avoid ambitious risk.",
        isCorrect: false,
        feedbackText:
          "Incremental goals lead to ordinary results. We aim for audacious impact that changes lives and transforms whole regions.",
        xp: 30,
        badgeName: "Impact Builder",
      },
    ],
  },
  {
    principleId: 8,
    number: 8,
    title: "We Incentivize with Integrity",
    psychometricTension: "Value Driven Boundary vs. Results at All Costs",
    bgGradient: "linear-gradient(135deg, #301f09 0%, #180f04 100%)",
    sceneTitle: "Scene 8: The End-of-Quarter Revenue Shortcut",
    location: "Enterprise Sales Division — Kyiv",
    avatarIntro:
      "It is the final day of the fiscal year. Your team is $50,000 short of hitting their annual performance bonus threshold.",
    storyScenario:
      "A sales rep suggests pre-booking unverified enterprise contracts to inflate the numbers today, promising to fix paperwork next month. No one will notice right away.",
    avatarPrompt: "How do you handle this integrity test?",
    choices: [
      {
        id: "A",
        text: "⚖️ Reject the unverified contracts, uphold strict integrity boundaries, and miss the shortcut bonus.",
        isCorrect: true,
        feedbackText:
          "Integrity above short-term gains! True leaders never trade values for financial shortcuts. Your team's ethical stance earned deep trust from executive leadership.",
        xp: 100,
        badgeName: "Integrity Anchor",
      },
      {
        id: "B",
        text: "💸 Pre-book the invalid contracts just to hit the bonus threshold for the quarter.",
        isCorrect: false,
        feedbackText:
          "Winning at all costs destroys trust. We incentivize performance anchored in unshakeable ethical boundaries.",
        xp: 30,
        badgeName: "Ethics Guardian",
      },
    ],
  },
  {
    principleId: 9,
    number: 9,
    title: "We Stand Strong Together",
    psychometricTension: "Interdependent Ecosystem vs. Lone-Wolf Execution",
    bgGradient: "linear-gradient(135deg, #2c0930 0%, #160418 100%)",
    sceneTitle: "Scene 9: The Cross-OpCo Collaboration Rivalry",
    location: "One VEON Synergy Operations",
    avatarIntro:
      "Two regional OpCo engineering teams are secretly building duplicate customer analytics platforms in isolation, competing for internal credit.",
    storyScenario:
      "Both teams are wasting resources duplicating effort rather than sharing code and building one unified global platform.",
    avatarPrompt: "How do you unite the teams?",
    choices: [
      {
        id: "A",
        text: "🤝 Merge both teams into a unified cross-OpCo ecosystem to co-build a single global platform.",
        isCorrect: true,
        feedbackText:
          "One VEON in action! By breaking down silos and uniting the teams, you cut delivery time in half and created a world-class shared capability.",
        xp: 100,
        badgeName: "Ecosystem Unifier",
      },
      {
        id: "B",
        text: "🐺 Let both teams compete in isolation as lone wolves to see who finishes first.",
        isCorrect: false,
        feedbackText:
          "Lone-wolf execution creates silos and wastes collective strength. We are exponentially stronger when we build together across borders.",
        xp: 30,
        badgeName: "Synergy Collaborator",
      },
    ],
  },
  {
    principleId: 10,
    number: 10,
    title: "We Never Give Up",
    psychometricTension: "Grit vs. Sunk-Cost Containment",
    bgGradient: "linear-gradient(135deg, #093021 0%, #041810 100%)",
    sceneTitle: "Scene 10: The 72-Hour Storm Recovery",
    location: "Disaster Response Command Center",
    avatarIntro:
      "A severe blizzard has knocked out critical tower infrastructure in a remote province. Two initial repair attempts failed due to freezing equipment.",
    storyScenario:
      "The team is exhausted and sub-zero temperatures are dropping further. Others suggest giving up until next week, leaving 100,000 citizens without emergency communications.",
    avatarPrompt: "What is your leadership stance?",
    choices: [
      {
        id: "A",
        text: "🏔️ Adapt repair tactics, rally the disaster recovery team, and push through until connectivity is restored.",
        isCorrect: true,
        feedbackText:
          "Unstoppable grit! Your team's relentless perseverance restored emergency services at 4:00 AM, saving lives and proving VEON's commitment to our communities.",
        xp: 100,
        badgeName: "Relentless Grit Legend",
      },
      {
        id: "B",
        text: "🧊 Abandon recovery efforts until temperatures warm up next week.",
        isCorrect: false,
        feedbackText:
          "True grit shows when conditions are toughest. When communities rely on us, we never give up.",
        xp: 30,
        badgeName: "Resilience Champion",
      },
    ],
  },
];
