import { useState } from "react";
import { PRINCIPLE_TILES } from "../data/principleTiles";

/**
 * "Our Principles" — the main screen.
 *
 * The ten leadership principles as flip cards: the front carries the
 * principle's mark and name, hovering flips the card to reveal the official
 * description, and clicking opens that principle in the mentor experience.
 *
 * Each card is a single button rather than a div with a button inside it, so
 * the flip has one trigger for every input method: :hover for a mouse, :focus
 * for a keyboard, and the tap that focuses it on a touch screen.
 */
export default function PrinciplesScreen({ onSelectPrinciple }) {
  return (
    // h-screen + overflow-y-auto, not min-h-screen: html/body/#root are locked
    // to height:100%/overflow:hidden for the game view, so this screen has to
    // be its own scroll container. Same approach as HomePage.
    <div className="relative h-screen w-full overflow-y-auto overflow-x-hidden bg-[#04070d] font-sans text-slate-200 [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-[#070c15] [&::-webkit-scrollbar-thumb]:bg-[#2b3a56] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3a4d70]">
      {/* Ambient wash behind the heading, so the page has a centre of gravity
          before any card is touched. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[540px]"
        style={{
          background:
            "radial-gradient(ellipse 900px 420px at 50% 0%, rgba(255,202,5,0.10), transparent 70%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1180px] px-6 pb-20">
        {/* Brand line — keeps the screen recognisably part of the portal. */}
        <div className="flex items-center gap-2.5 pt-8">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#ffca05] text-base font-black text-[#03101f]">
            V
          </span>
          <span className="text-lg font-black tracking-tight text-white">
            VEON<span className="text-[#ffca05]">VERSE</span>
          </span>
        </div>

        <header className="pb-3 pt-16">
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
            Our Principles
          </h1>
          <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-slate-400 sm:text-lg">
            The VEON Manifestos inspire us how we work every day.
          </p>
        </header>

        {/* A rule that carries information rather than decorating. */}
        <div className="mt-8 flex items-center gap-4">
          <span className="text-xs font-semibold text-slate-500">
            {PRINCIPLE_TILES.length} principles
          </span>
          <span className="h-px flex-1 bg-[#182234]" />
          <span className="hidden text-xs text-slate-600 sm:block">
            Hover a card to read it
          </span>
        </div>

        <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {PRINCIPLE_TILES.map((tile, index) => (
            <PrincipleCard
              key={tile.title}
              tile={tile}
              number={index + 1}
              onOpen={() => onSelectPrinciple && onSelectPrinciple(index)}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Mixes a hex colour towards white.
 *
 * The accent colours are sampled from the artwork, and several of them are deep
 * indigos that sit almost on top of the card background — legible as a 2px rule,
 * unreadable as text. This lifts them just for the label.
 */
function lighten(hex, amount = 0.55) {
  const value = parseInt(hex.slice(1), 16);
  const mix = (channel) => Math.round(channel + (255 - channel) * amount);
  const r = mix((value >> 16) & 255);
  const g = mix((value >> 8) & 255);
  const b = mix(value & 255);
  return `rgb(${r}, ${g}, ${b})`;
}

function PrincipleCard({ tile, number, onOpen }) {
  const Icon = tile.icon;
  // Official artwork dropped into public/principles/ is picked up
  // automatically; until a file exists the request 404s and the lucide mark
  // stands in. Same pattern as the OpCo logos in public/logos/.
  const [artFailed, setArtFailed] = useState(false);

  return (
    // 320px is sized to the longest description ("Courage Fuels Our
    // Leadership") at the 5-column width, so no back face has to scroll.
    <li className="h-[320px]">
      {/* The button carries .flip-card (and therefore `perspective`) itself, so
          that .flip-card-inner is its *direct* child. With a wrapper element in
          between, the perspective applies to the wrapper instead, the 3D
          context never reaches the faces, and backface-visibility stops
          hiding the back — every card renders back-side up. */}
      <button
        type="button"
        onClick={onOpen}
        className="flip-card block h-full w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffca05]"
      >
        <div className="flip-card-inner">
          {/* ── Front ── */}
          <div className="flip-face border border-[#182234] bg-[#0a0f1a] p-5 transition-colors">
            <span className="text-xs font-semibold tabular-nums text-slate-600">
              {String(number).padStart(2, "0")}
            </span>

            {/* The official artwork is a finished tile — its own chamfered
                shape, its own background, transparent corners. So it stands on
                its own here. Only the lucide fallback gets the tinted square,
                because a bare stroke icon needs something to sit on. */}
            {tile.art && !artFailed ? (
              <img
                src={`/principles/${tile.art}`}
                alt=""
                loading="lazy"
                className="mt-auto -ml-2 h-[124px] w-[124px] object-contain"
                onError={() => setArtFailed(true)}
              />
            ) : (
              <span
                className="mt-auto grid h-16 w-16 place-items-center rounded-2xl border"
                style={{ background: `${tile.color}1f`, borderColor: `${tile.color}59` }}
              >
                <Icon size={30} strokeWidth={1.75} style={{ color: tile.color }} />
              </span>
            )}

            {/* Reserve two lines. Most titles wrap to two; without this the
                one-line titles pull their icon and rule out of alignment with
                the rest of the row. */}
            <h2 className="mt-5 min-h-[2.95rem] text-[1.0625rem] font-black leading-snug tracking-tight text-white">
              {tile.title}
            </h2>

            {/* Colour arrives as a rule rather than a wash, so the ten cards
                read as one family with ten marks, not ten colour schemes. */}
            <span
              className="mt-4 h-0.5 w-9 rounded-full"
              style={{ background: tile.color }}
            />
          </div>

          {/* ── Back ── */}
          <div
            className="flip-face flip-face-back bg-[#0c1320] p-5"
            style={{ borderWidth: 1, borderStyle: "solid", borderColor: `${tile.color}4d` }}
          >
            <span
              className="text-xs font-bold tracking-wide"
              style={{ color: lighten(tile.color) }}
            >
              {tile.short}
            </span>

            {/* min-h-0 lets this flex child shrink, so the overflow guard
                engages instead of pushing the footer off the card. The card
                height above is sized so it should never actually be needed. */}
            <p className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1 text-[0.8125rem] leading-[1.55] text-slate-300">
              {tile.description}
            </p>

            <span className="mt-3 shrink-0 text-[11px] font-bold text-[#ffca05]">
              Start this principle
            </span>
          </div>
        </div>
      </button>
    </li>
  );
}
