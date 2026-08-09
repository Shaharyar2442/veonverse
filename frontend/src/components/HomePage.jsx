import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
  Compass,
  Flag,
  Flame,
  Footprints,
  Globe,
  Home,
  LayoutGrid,
  Lock,
  MapPin,
  Medal,
  MessageCircle,
  MessageSquare,
  Play,
  Rocket,
  Search,
  Shield,
  Sun,
  TrendingUp,
  User,
  Users,
  UsersRound,
} from "lucide-react";
import {
  BanglalinkLogo,
  BeelineLogo,
  JazzWorldLogo,
  KyivstarLogo,
  MobilinkLogo,
  VeonLogo,
} from "./BrandLogos";

/* ------------------------------------------------------------------ data -- */

const NAV_LINKS = [
  { label: "Explore", active: true },
  { label: "Leadership Principles", target: "principles" },
  { label: "Stories" },
  { label: "Ask Kaan" },
  { label: "Our People" },
  { label: "Global Mobility", locked: true },
];

const SIDEBAR_LINKS = [
  { label: "Home", icon: Home, active: true },
  { label: "Explore", icon: Compass },
  { label: "Leadership\nPrinciples", icon: Award, target: "principles" },
  { label: "Stories", icon: BookOpen },
  { label: "Ask Kaan", icon: MessageCircle },
  { label: "Our People", icon: User },
  { label: "Workspace", icon: LayoutGrid },
];

const STATS = [
  { value: "7+", label: "OpCos", icon: Building2, color: "text-purple-400" },
  { value: "160,000+", label: "Employees", icon: Users, color: "text-sky-400" },
  { value: "250M+", label: "Customers", icon: User, color: "text-emerald-400" },
  { value: "50+", label: "Markets", icon: Globe, color: "text-orange-400" },
];

// Real coordinates — the globe and the world map both project from these, so a
// pin always sits over the city it belongs to instead of a hardcoded offset.
const OPCOS = [
  { id: "veon", name: "VEON HQ", place: "Dubai, UAE", lat: 25.2, lon: 55.27, Logo: VeonLogo, tint: "#ffca05" },
  { id: "mobilink", name: "Mobilink Bank", place: "Pakistan", lat: 24.86, lon: 67.01, Logo: MobilinkLogo, tint: "#d8232a" },
  { id: "jazzworld", name: "JazzWorld", place: "Pakistan", lat: 33.68, lon: 73.05, Logo: JazzWorldLogo, tint: "#c8102e" },
  { id: "kyivstar", name: "Kyivstar", place: "Ukraine", lat: 50.45, lon: 30.52, Logo: KyivstarLogo, tint: "#00a1f1" },
  { id: "banglalink", name: "Banglalink", place: "Bangladesh", lat: 23.81, lon: 90.41, Logo: BanglalinkLogo, tint: "#f26522" },
  { id: "beeline-kz", name: "Beeline", place: "Kazakhstan", lat: 43.24, lon: 76.89, Logo: BeelineLogo, tint: "#ffdd00" },
  { id: "beeline-uz", name: "Beeline", place: "Uzbekistan", lat: 41.31, lon: 69.24, Logo: BeelineLogo, tint: "#ffdd00" },
];

// Ordered to match the reference layout.
const PRINCIPLE_TILES = [
  { label: "Clarity is Our\nSuperpower", icon: Sun, color: "#fbbf24" },
  { label: "Our Pioneering\nSpirit Defines Us", icon: Rocket, color: "#60a5fa" },
  { label: "We Fight\nAgainst Mediocrity", icon: Shield, color: "#a78bfa" },
  { label: "We Put Results\nAbove Rituals", icon: TrendingUp, color: "#34d399" },
  { label: "Courage Fuels\nOur Leadership", icon: Flame, color: "#fb923c" },
  { label: "We Hire for\nPotential and Drive", icon: Users, color: "#4ade80" },
  { label: "We Aim for\nAudacious Impact", icon: Flag, color: "#60a5fa" },
  { label: "We Incentivize\nwith integrity", icon: Medal, color: "#fbbf24" },
  { label: "We Stand Strong\nTogether", icon: UsersRound, color: "#c084fc" },
  { label: "We Never\nGive Up", icon: Footprints, color: "#2dd4bf" },
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// Card treatment per OpCo. `dark` marks tints light enough to need dark label text.
const STORY_STYLE = {
  veon: { tag: "#ffca05", dark: true, wash: "#3d3520" },
  mobilink: { tag: "#d8232a", dark: false, wash: "#4a2b33" },
  jazzworld: { tag: "#a01048", dark: false, wash: "#402235" },
  kyivstar: { tag: "#1f7fc4", dark: false, wash: "#25405c" },
  banglalink: { tag: "#f26522", dark: false, wash: "#4a3323" },
  "beeline-kz": { tag: "#ffdd00", dark: true, wash: "#3d3a24" },
  "beeline-uz": { tag: "#ffdd00", dark: true, wash: "#3d3a24" },
};

const FALLBACK_STORY_STYLE = { tag: "#64748b", dark: false, wash: "#243043" };

const OPCO_BY_ID = Object.fromEntries(OPCOS.map((opco) => [opco.id, opco]));

function formatStoryDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

const POPULAR_QUESTIONS = [
  "What is VEON's purpose?",
  "How do Leadership Principles help employees?",
  "What makes One VEON unique?",
];

/* ------------------------------------------------------------ projection -- */

const GLOBE_SIZE = 420;
const GLOBE_R = GLOBE_SIZE / 2;
// The texture is equirectangular (2:1). At `background-size: auto 100%` its
// drawn width is twice the globe height, so 360° of longitude spans IMG_W px.
const IMG_W = GLOBE_SIZE * 2;

function globeX(lon) {
  return ((lon + 180) / 360) * IMG_W;
}

function globePoint(lat, lon, rotation) {
  const x = (((globeX(lon) - rotation) % IMG_W) + IMG_W) % IMG_W;
  const y = ((90 - lat) / 180) * GLOBE_SIZE;
  const dx = x - GLOBE_R;
  const dy = y - GLOBE_R;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return { x, y, dist, visible: dist < GLOBE_R * 0.94 };
}

/**
 * Projects every visible OpCo, then spreads the labels vertically so they never
 * overlap. The marker dot keeps its true position; only the label shifts.
 */
function placePins(rotation) {
  const MIN_GAP = 30;
  const pins = OPCOS.map((opco) => ({ opco, point: globePoint(opco.lat, opco.lon, rotation) }))
    .filter((pin) => pin.point.visible)
    .sort((a, b) => a.point.y - b.point.y);

  let lastLabelY = -Infinity;
  for (const pin of pins) {
    pin.labelY = Math.max(pin.point.y, lastLabelY + MIN_GAP);
    lastLabelY = pin.labelY;
  }

  // If the stack ran past the bottom, slide the whole run back up.
  const overflow = lastLabelY - (GLOBE_SIZE - 16);
  if (overflow > 0) for (const pin of pins) pin.labelY -= overflow;

  return pins;
}

// The world map SVG is a symmetric Mercator; this bound matches its viewBox.
const MAP_MAX_LAT = 75.3;

function mercator(lat) {
  return Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
}

function mapPoint(lat, lon) {
  const top = mercator(MAP_MAX_LAT);
  return {
    left: ((lon + 180) / 360) * 100,
    top: ((top - mercator(lat)) / (2 * top)) * 100,
  };
}

/* ------------------------------------------------------------ primitives -- */

function Card({ className = "", children }) {
  return (
    <section className={`bg-[#0a0f1a] border border-[#182234] rounded-2xl ${className}`}>{children}</section>
  );
}

function GhostButton({ children, onClick, gold = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
        gold
          ? "border-[#ffca05]/60 text-[#ffca05] hover:bg-[#ffca05]/10"
          : "border-[#243149] text-slate-300 hover:border-slate-500 hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

/* ----------------------------------------------------------------- globe -- */

/**
 * Draggable Earth. A NASA "Earth at Night" plate is scrolled horizontally
 * inside a circle (repeat-x makes the wrap seamless) over a blue ocean base,
 * with limb darkening, a terminator and an atmospheric rim layered on top.
 *
 * Pins are projected from real lat/lon through the same mapping as the texture,
 * so they track the surface as it turns and hide once they rotate out of view.
 * Clicking one spins the globe until that location faces the viewer.
 */
function EarthGlobe({ selectedId, onSelect }) {
  // Opens over Europe / the Middle East so the VEON markets face the viewer.
  const [rotation, setRotation] = useState(() => globeX(55) - GLOBE_R);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);
  const targetRef = useRef(null);
  const pauseUntilRef = useRef(0);

  useEffect(() => {
    let frame;
    let last = performance.now();
    const tick = (now) => {
      const delta = Math.min(64, now - last);
      last = now;
      setRotation((current) => {
        const target = targetRef.current;
        if (target !== null) {
          const diff = target - current;
          if (Math.abs(diff) < 0.4) {
            targetRef.current = null;
            return target;
          }
          return current + diff * Math.min(1, delta / 260);
        }
        if (dragRef.current || now < pauseUntilRef.current) return current;
        return current + delta * 0.011;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  function focusOn(opco) {
    // Nearest equivalent rotation, so it takes the short way round.
    let target = globeX(opco.lon) - GLOBE_R;
    target += Math.round((rotation - target) / IMG_W) * IMG_W;
    targetRef.current = target;
    pauseUntilRef.current = performance.now() + 6000;
    onSelect(opco.id);
  }

  function handlePointerDown(event) {
    dragRef.current = { startX: event.clientX, startRotation: rotation };
    targetRef.current = null;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.startX;
    setRotation(dragRef.current.startRotation - dx * 0.9);
  }

  function handlePointerUp(event) {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    pauseUntilRef.current = performance.now() + 2500;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div className="relative mx-auto" style={{ width: GLOBE_SIZE, height: GLOBE_SIZE }}>
      {/* Sphere — owns the drag gesture */}
      <div
        className={`absolute inset-0 rounded-full select-none touch-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ boxShadow: "0 0 90px 12px rgba(64,140,235,0.22)" }}
      >
        {/* Ocean base — the NASA plate has black oceans, so the blue comes from here */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            background:
              "radial-gradient(circle at 30% 24%, #17456f 0%, #0d2b4b 42%, #06182c 72%, #020a15 100%)",
          }}
        >
          {/* City lights, screened on so the black ocean drops out and lights glow */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/earth_night.jpg)",
              backgroundSize: "auto 100%",
              backgroundRepeat: "repeat-x",
              backgroundPositionX: `${-rotation}px`,
              mixBlendMode: "screen",
              filter: "brightness(1.75) contrast(2.2) saturate(2.4) sepia(0.35) hue-rotate(-12deg)",
            }}
          />
        </div>
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 56%, rgba(0,0,0,0.48) 81%, rgba(0,0,0,0.92) 100%)",
          }}
        />
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "linear-gradient(118deg, rgba(3,9,20,0) 42%, rgba(3,9,20,0.38) 78%, rgba(2,6,14,0.72) 100%)",
          }}
        />
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 24% 16%, rgba(126,198,255,0.34) 0%, rgba(126,198,255,0.10) 22%, transparent 46%)",
          }}
        />
        <div
          className="absolute -inset-px rounded-full pointer-events-none"
          style={{ boxShadow: "inset 0 0 22px 1px rgba(120,190,255,0.42)" }}
        />
      </div>

      {/* Pins — projected from lat/lon, so they turn with the surface. The VEON
          markets sit close together, so labels are pushed apart vertically while
          the marker itself stays on its true coordinates. */}
      {placePins(rotation).map(({ opco, point, labelY }) => {
        const isSelected = opco.id === selectedId;
        // Fade out as a pin approaches the limb.
        const opacity = Math.max(0, Math.min(1, (GLOBE_R * 0.94 - point.dist) / (GLOBE_R * 0.22)));
        const Logo = opco.Logo;
        const offset = labelY - point.y;

        return (
          <div key={opco.id} className="absolute inset-0 pointer-events-none" style={{ opacity }}>
            {/* Leader line back to the true position */}
            {Math.abs(offset) > 5 && (
              <span
                className="absolute w-px bg-[#ffca05]/45"
                style={{
                  left: point.x + 7,
                  top: Math.min(point.y, labelY),
                  height: Math.abs(offset),
                }}
              />
            )}
            {/* Marker at the real coordinates */}
            <span
              className="absolute w-[7px] h-[7px] rounded-full bg-[#ffca05] -translate-x-1/2 -translate-y-1/2 shadow-[0_0_8px_2px_rgba(255,202,5,0.55)]"
              style={{ left: point.x, top: point.y }}
            />
            <button
              onClick={() => focusOn(opco)}
              className="absolute pointer-events-auto -translate-y-1/2 cursor-pointer transition-transform hover:scale-[1.06] text-left"
              style={{ left: point.x + 12, top: labelY }}
              title={`${opco.name} — ${opco.place}`}
            >
              {isSelected ? (
                <span
                  className="flex items-center gap-2 bg-[#0d1420]/95 backdrop-blur-sm rounded-xl px-2.5 py-1.5 shadow-lg whitespace-nowrap"
                  style={{ border: `1px solid ${opco.tint}` }}
                >
                  <Logo size={24} />
                  <span className="leading-tight">
                    <span className="block text-[12px] font-bold text-white">{opco.name}</span>
                    <span className="block text-[10px] text-slate-400">{opco.place}</span>
                  </span>
                </span>
              ) : (
                <span
                  className="block leading-tight whitespace-nowrap"
                  style={{ textShadow: "0 1px 4px rgba(0,0,0,0.95), 0 0 10px rgba(0,0,0,0.85)" }}
                >
                  <span className="block text-[11px] font-bold text-white">{opco.name}</span>
                  <span className="block text-[9px] text-slate-300">{opco.place}</span>
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ page -- */

export default function HomePage({ onNavigate }) {
  const goPrinciples = () => onNavigate && onNavigate("principles");
  const [selectedOpco, setSelectedOpco] = useState("jazzworld");

  // Live OpCo coverage from the backend (Google News per operating company).
  const [stories, setStories] = useState([]);
  const [storiesState, setStoriesState] = useState("loading");
  const [showAllStories, setShowAllStories] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_BASE_URL}/stories?limit=12`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        const items = Array.isArray(data.stories) ? data.stories : [];
        setStories(items);
        setStoriesState(items.length ? "ready" : "empty");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setStoriesState("error");
      });

    return () => controller.abort();
  }, []);

  const visibleStories = showAllStories ? stories : stories.slice(0, 4);

  return (
    // h-screen (not min-h-screen) so this becomes its own scroll container —
    // html/body/#root are locked to height:100%; overflow:hidden for the game.
    <div className="h-screen w-full bg-[#04070d] text-slate-200 font-sans overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-[#070c15] [&::-webkit-scrollbar-thumb]:bg-[#2b3a56] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3a4d70]">
      {/* ─────────────────────────────── top nav ─────────────────────────────── */}
      <header className="flex items-center gap-6 px-6 py-3 border-b border-[#141c2b]">
        <div className="flex items-center gap-3 shrink-0">
          <VeonLogo size={38} />
          <div className="leading-tight">
            <div className="text-xl font-black tracking-tight">
              VEON<span className="text-[#ffca05]">VERSE</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium">One VEON. Infinite Possibilities.</div>
          </div>
        </div>

        <nav className="flex items-center gap-7 mx-auto">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={link.target === "principles" ? goPrinciples : undefined}
              className={`relative text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                link.active ? "text-white" : link.locked ? "text-[#ffca05]" : "text-slate-300 hover:text-white"
              }`}
            >
              {link.locked && <Lock size={13} />}
              {link.label}
              {link.active && (
                <span className="absolute -bottom-2 left-0 right-0 h-0.5 rounded-full bg-[#ffca05]" />
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 bg-[#0a0f1a] border border-[#1e2942] rounded-full px-4 py-2 w-64">
            <Search size={15} className="text-slate-500" />
            <input
              className="bg-transparent outline-none text-sm text-slate-300 placeholder:text-slate-500 w-full"
              placeholder="Search VEONVERSE..."
            />
          </div>
          <button className="flex items-center gap-1 text-slate-300 text-sm font-semibold cursor-pointer">
            <Globe size={17} />
            EN
            <ChevronDown size={14} />
          </button>
          <button className="relative text-slate-300 cursor-pointer">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#ffca05] text-[#03101f] text-[8px] font-black flex items-center justify-center">
              3
            </span>
          </button>
          <img src="/kaan_avatar.jpg" alt="Profile" className="w-9 h-9 rounded-full object-cover object-center" />
        </div>
      </header>

      <div className="flex">
        {/* ───────────────────────────── left rail ───────────────────────────── */}
        <aside className="w-[92px] shrink-0 p-3">
          <div className="bg-[#0a0f1a] border border-[#182234] rounded-2xl py-4 flex flex-col items-center gap-6">
            {SIDEBAR_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.target === "principles" ? goPrinciples : undefined}
                  className={`relative w-full flex flex-col items-center gap-1.5 px-1 cursor-pointer transition-colors ${
                    item.active ? "text-[#ffca05]" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {item.active && <span className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-[#ffca05]" />}
                  <Icon size={20} />
                  <span className="text-[9px] font-semibold leading-tight text-center whitespace-pre-line">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ────────────────────────────── content ────────────────────────────── */}
        <main className="flex-1 min-w-0 p-3 pl-0 space-y-3">
          {/* Row 1 — hero + Ask Kaan */}
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-3">
            <Card className="relative overflow-hidden p-6">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-4 items-center">
                <div>
                  <h1 className="text-4xl font-black leading-[1.1] tracking-tight">
                    One <span className="text-[#ffca05]">VEON.</span>
                    <br />
                    Infinite Possibilities.
                  </h1>
                  <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-sm">
                    Experience every VEON company, discover our people, explore our culture, and bring our
                    Leadership Principles to life.
                  </p>
                  <button className="mt-5 inline-flex items-center gap-2 bg-[#ffca05] hover:bg-[#ffd84d] text-[#03101f] font-extrabold text-sm px-6 py-3 rounded-lg transition-colors cursor-pointer">
                    Explore VEON
                    <ArrowRight size={16} />
                  </button>
                  <p className="mt-4 text-[11px] text-slate-600">
                    Drag the globe to spin it &middot; tap a marker to travel there
                  </p>
                </div>

                <EarthGlobe selectedId={selectedOpco} onSelect={setSelectedOpco} />
              </div>

              {/* Stats */}
              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#070c15] border border-[#182234] rounded-xl p-4">
                {STATS.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="flex items-center gap-3">
                      <Icon size={22} className={stat.color} />
                      <div className="leading-tight">
                        <div className="text-lg font-black text-white tabular-nums">{stat.value}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{stat.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Ask Kaan */}
            <Card className="relative overflow-hidden p-6">
              <img
                src="/kaan_avatar.jpg"
                alt="Kaan Terzioğlu"
                className="absolute right-0 top-0 w-[46%] aspect-square object-cover object-center pointer-events-none"
                style={{
                  maskImage:
                    "linear-gradient(to left, #000 55%, transparent 100%), linear-gradient(to top, transparent 0%, #000 30%)",
                  WebkitMaskImage:
                    "linear-gradient(to left, #000 55%, transparent 100%), linear-gradient(to top, transparent 0%, #000 30%)",
                  maskComposite: "intersect",
                  WebkitMaskComposite: "source-in",
                }}
              />
              <div className="relative max-w-[56%]">
                <h2 className="text-2xl font-black text-white">Ask Kaan</h2>
                <p className="mt-2 text-[13px] text-slate-400 leading-relaxed">
                  Ask questions about VEON Strategy, Leadership Principles and Culture.
                </p>
              </div>

              <div className="relative mt-5 space-y-2.5 max-w-[56%]">
                <GhostButton gold>
                  <Play size={15} />
                  Watch Message
                </GhostButton>
                <GhostButton>
                  <MessageSquare size={15} />
                  Ask Question
                </GhostButton>
              </div>

              <p className="relative mt-6 text-sm font-bold text-slate-300">Popular questions</p>
              <div className="relative mt-3 space-y-2">
                {POPULAR_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    className="w-full flex items-center justify-between gap-3 bg-[#070c15] border border-[#182234] hover:border-[#2b3a56] rounded-lg px-3.5 py-2.5 text-left transition-colors cursor-pointer"
                  >
                    <span className="text-[13px] text-slate-300">{question}</span>
                    <ChevronRight size={15} className="text-slate-500 shrink-0" />
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Row 2 — three panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-stretch">
            {/* Explore Our OpCos */}
            <Card className="p-5 flex flex-col">
              <h2 className="text-lg font-black text-white">Explore Our OpCos</h2>
              <p className="text-xs text-slate-500 mt-1">Discover and explore our operating companies.</p>

              {/* Dotted world map — the SVG masks a dot pattern into continent shapes */}
              <div className="relative mt-4 rounded-xl bg-[#070c15] border border-[#141c2b] h-[178px] overflow-hidden">
                <div
                  className="absolute inset-2"
                  style={{
                    backgroundImage: "radial-gradient(#3f63b8 1px, transparent 1.35px)",
                    backgroundSize: "6px 6px",
                    WebkitMaskImage: "url(/world_map.svg)",
                    maskImage: "url(/world_map.svg)",
                    // Stretch to fill: scaling is linear, so the percentage
                    // positions used for the pins stay correct.
                    WebkitMaskSize: "100% 100%",
                    maskSize: "100% 100%",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                  }}
                />
                {OPCOS.map((opco) => {
                  const point = mapPoint(opco.lat, opco.lon);
                  return (
                    <MapPin
                      key={opco.id}
                      size={15}
                      className="absolute -translate-x-1/2 -translate-y-full text-[#ffca05] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                      fill="#ffca05"
                      style={{ left: `${point.left}%`, top: `${point.top}%` }}
                    />
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-7 gap-1.5">
                {OPCOS.map((opco) => {
                  const Logo = opco.Logo;
                  return (
                    <div key={opco.id} className="flex flex-col items-center gap-1 text-center">
                      <Logo size={30} />
                      <span className="text-[8px] font-bold text-slate-200 leading-tight">{opco.name}</span>
                      <span className="text-[7px] text-slate-500 leading-tight">{opco.place}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-auto pt-6 flex justify-center">
                <button className="inline-flex items-center gap-2 border border-[#ffca05]/60 text-[#ffca05] hover:bg-[#ffca05]/10 rounded-lg px-6 py-2.5 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap">
                  See All OpCos
                  <ArrowRight size={14} />
                </button>
              </div>
            </Card>

            {/* Leadership Principles */}
            <Card className="p-5 flex flex-col">
              <h2 className="text-lg font-black text-white">Leadership Principles</h2>
              <p className="text-xs text-slate-500 mt-1">10 Principles. One VEON.</p>

              <div className="mt-5 grid grid-cols-5 gap-x-2 gap-y-5">
                {PRINCIPLE_TILES.map((tile) => {
                  const Icon = tile.icon;
                  return (
                    <button
                      key={tile.label}
                      onClick={goPrinciples}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <span
                        className="w-11 h-11 rounded-full flex items-center justify-center border transition-transform group-hover:scale-110"
                        style={{ background: `${tile.color}1f`, borderColor: `${tile.color}59` }}
                      >
                        <Icon size={20} style={{ color: tile.color }} />
                      </span>
                      <span className="text-[8px] font-semibold text-slate-400 text-center leading-tight whitespace-pre-line">
                        {tile.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-auto pt-6 flex justify-center">
                <button
                  onClick={goPrinciples}
                  className="inline-flex items-center gap-2 border border-[#ffca05]/60 text-[#ffca05] hover:bg-[#ffca05]/10 rounded-lg px-6 py-2.5 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Explore All Principles
                  <ArrowRight size={14} />
                </button>
              </div>
            </Card>

            {/* Stories Across VEON */}
            <Card className="p-5 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-white">Stories Across VEON</h2>
                  <p className="text-xs text-slate-500 mt-1">Real people. Real impact.</p>
                </div>
                {stories.length > 4 && (
                  <button
                    onClick={() => setShowAllStories((open) => !open)}
                    className="text-[11px] font-semibold text-[#ffca05] hover:underline cursor-pointer whitespace-nowrap"
                  >
                    {showAllStories ? "Show Less" : "View All Stories"}
                  </button>
                )}
              </div>

              {storiesState === "loading" && (
                <div className="mt-4 grid grid-cols-2 xl:grid-cols-4 gap-2.5">
                  {[0, 1, 2, 3].map((key) => (
                    <div key={key} className="flex flex-col animate-pulse">
                      <div className="h-[104px] rounded-lg bg-[#101827]" />
                      <div className="mt-2 h-2 w-12 rounded bg-[#101827]" />
                      <div className="mt-2 h-2.5 w-full rounded bg-[#101827]" />
                      <div className="mt-1.5 h-2.5 w-3/4 rounded bg-[#101827]" />
                    </div>
                  ))}
                </div>
              )}

              {(storiesState === "error" || storiesState === "empty") && (
                <div className="mt-4 flex-1 flex flex-col items-center justify-center text-center gap-1 py-8">
                  <p className="text-xs text-slate-400 font-semibold">
                    {storiesState === "error" ? "Couldn't load the latest stories." : "No stories available yet."}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {storiesState === "error" ? "Check the backend is running on port 18000." : "Try again shortly."}
                  </p>
                </div>
              )}

              {storiesState === "ready" && (
                <div className="mt-4 grid grid-cols-2 xl:grid-cols-4 gap-2.5">
                  {visibleStories.map((story) => {
                    const style = STORY_STYLE[story.opco_id] || FALLBACK_STORY_STYLE;
                    const StoryLogo = OPCO_BY_ID[story.opco_id]?.Logo;
                    return (
                      <a
                        key={story.url}
                        href={story.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col h-full group"
                        title={story.title}
                      >
                        {/* The feed's own artwork when it has any; otherwise just
                            the operating company's icon, no card behind it. */}
                        {story.image_url ? (
                          <img
                            src={story.image_url}
                            alt=""
                            loading="lazy"
                            className="h-[84px] w-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="h-[84px] flex items-center justify-center">
                            {StoryLogo && <StoryLogo size={54} />}
                          </div>
                        )}

                        <span
                          className="mt-2 self-start px-1.5 py-0.5 rounded text-[7px] font-bold"
                          style={{ background: style.tag, color: style.dark ? "#03101f" : "#ffffff" }}
                        >
                          {story.opco_name}
                        </span>

                        <span className="mt-1.5 text-[9px] text-slate-500">
                          {story.place}
                          {story.published_at ? ` · ${formatStoryDate(story.published_at)}` : ""}
                        </span>

                        {/* Fixed height keeps every "Read Story" on the same baseline */}
                        <span className="mt-0.5 text-[11px] font-bold text-white leading-tight line-clamp-3 min-h-[42px] group-hover:text-[#ffca05] transition-colors">
                          {story.title}
                        </span>

                        {story.source && (
                          <span className="mt-0.5 text-[9px] text-slate-600 truncate">{story.source}</span>
                        )}

                        {/* mt-auto pins every link to the bottom of its column */}
                        <span className="mt-auto pt-1.5 flex items-center gap-1 text-[10px] font-bold text-[#ffca05] group-hover:underline">
                          Read Story
                          <ArrowRight size={11} />
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Row 3 — OpCo strip */}
          <Card className="px-5 py-4 flex items-center gap-6">
            <h2 className="text-lg font-black text-white shrink-0">
              Our OpCos. <span className="text-[#ffca05]">Our Strength.</span>
            </h2>

            <div className="flex-1 min-w-0 flex flex-wrap items-center justify-around gap-x-5 gap-y-3">
              {OPCOS.map((opco) => {
                const Logo = opco.Logo;
                return (
                  <div key={"strip-" + opco.id} className="flex items-center gap-2.5">
                    <Logo size={34} />
                    <div className="leading-tight">
                      <div className="text-sm font-bold text-white whitespace-nowrap">{opco.name}</div>
                      <div className="text-[10px] text-slate-500 whitespace-nowrap">{opco.place}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
