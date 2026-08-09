import { useState } from "react";

/**
 * OpCo brand marks.
 *
 * Each logo first tries the official file in `frontend/public/logos/`. If that
 * file is not there yet, it silently falls back to the inline SVG below, so the
 * page always renders. Drop the real artwork in with the filenames listed in
 * `frontend/public/logos/README.md` and it is picked up automatically — no code
 * change required.
 */

const LOGO_DIR = "/logos";

/**
 * Renders the official file, falling back to the inline SVG if it is missing.
 *
 * `crop` handles artwork that ships with padding, a wordmark or an opaque
 * background: the image is scaled up and offset so only the symbol shows, then
 * clipped to a circle. Values are tuned per logo against the supplied file.
 */
function BrandMark({ file, size, label, crop, halo, children }) {
  const [useOfficial, setUseOfficial] = useState(true);

  // Marks with black in them lose their silhouette against the near-black page,
  // so they get a faint light rim to separate them from the background.
  const haloStyle = halo ? { filter: "drop-shadow(0 0 1.5px rgba(255,255,255,0.55))" } : null;

  if (!useOfficial) return children;

  if (crop) {
    return (
      <>
        {/* Hidden probe so a missing file still triggers the SVG fallback */}
        <img src={`${LOGO_DIR}/${file}`} alt="" className="hidden" onError={() => setUseOfficial(false)} />
        <span
          role="img"
          aria-label={label}
          className="block shrink-0 rounded-full bg-no-repeat"
          style={{
            width: size,
            height: size,
            backgroundImage: `url(${LOGO_DIR}/${file})`,
            backgroundSize: crop.size,
            backgroundPosition: crop.position,
          }}
        />
      </>
    );
  }

  return (
    <img
      src={`${LOGO_DIR}/${file}`}
      alt={label}
      className="object-contain shrink-0"
      style={{ width: size, height: size, ...haloStyle }}
      onError={() => setUseOfficial(false)}
    />
  );
}

export function VeonLogo({ size = 34 }) {
  return (
    <BrandMark file="veon.jpg" size={size} label="VEON">
      <svg width={size} height={size} viewBox="0 0 100 100" aria-label="VEON" className="shrink-0">
        <path d="M4 14 H30 L50 60 L70 14 H96 L50 92 Z" fill="#ffca05" />
      </svg>
    </BrandMark>
  );
}

export function KyivstarLogo({ size = 34 }) {
  return (
    <BrandMark file="kyivstar.jpg" size={size} label="Kyivstar">
      <svg width={size} height={size} viewBox="0 0 100 100" aria-label="Kyivstar" className="shrink-0">
        <g transform="translate(50,50)" fill="#00a1f1">
          {[0, 72, 144, 216, 288].map((angle) => (
            <rect key={angle} x="-7" y="-46" width="14" height="27" rx="7" transform={`rotate(${angle})`} />
          ))}
        </g>
      </svg>
    </BrandMark>
  );
}

export function BeelineLogo({ size = 34 }) {
  return (
    <BrandMark file="beeline.jpg" size={size} label="Beeline" halo>
      <svg width={size} height={size} viewBox="0 0 100 100" aria-label="Beeline" className="shrink-0">
        <defs>
          <clipPath id="beelineClip">
            <circle cx="50" cy="50" r="48" />
          </clipPath>
        </defs>
        <g clipPath="url(#beelineClip)">
          <rect x="0" y="0" width="100" height="100" fill="#1c1c1c" />
          <rect x="0" y="22" width="100" height="18" fill="#ffdd00" />
          <rect x="0" y="58" width="100" height="18" fill="#ffdd00" />
        </g>
      </svg>
    </BrandMark>
  );
}

export function BanglalinkLogo({ size = 34 }) {
  return (
    <BrandMark file="banglalink.jpg" size={size} label="Banglalink" halo>
      <svg width={size} height={size} viewBox="0 0 100 100" aria-label="Banglalink" className="shrink-0">
        <defs>
          <clipPath id="blClip">
            <rect x="6" y="6" width="88" height="88" rx="16" />
          </clipPath>
        </defs>
        <rect x="6" y="6" width="88" height="88" rx="16" fill="#f26522" />
        <g fill="#111" clipPath="url(#blClip)">
          <path d="M20 14 C26 32 24 52 18 74 L26 74 C33 50 34 30 30 14 Z" />
          <path d="M38 12 C44 34 43 56 37 80 L45 80 C51 54 51 32 47 12 Z" />
          <path d="M56 16 C62 36 61 58 55 82 L62 82 C69 58 69 36 65 16 Z" />
          <path d="M74 12 C80 34 79 58 73 84 L80 84 C86 58 86 34 82 12 Z" />
        </g>
      </svg>
    </BrandMark>
  );
}

export function MobilinkLogo({ size = 34 }) {
  return (
    <BrandMark file="mobilink.jpg" size={size} label="Mobilink Bank">
      <svg width={size} height={size} viewBox="0 0 100 100" aria-label="Mobilink Bank" className="shrink-0">
        <defs>
          <radialGradient id="mbBall" cx="36%" cy="30%" r="78%">
            <stop offset="0%" stopColor="#f4646a" />
            <stop offset="52%" stopColor="#d8232a" />
            <stop offset="100%" stopColor="#8d0d14" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="44" fill="url(#mbBall)" />
        <path d="M16 44 C26 20 58 12 80 28 C60 22 34 30 26 52 Z" fill="#ff8f93" opacity="0.75" />
        <path d="M22 66 C38 88 70 86 84 62 C68 78 40 80 28 62 Z" fill="#6d060c" opacity="0.6" />
      </svg>
    </BrandMark>
  );
}

export function JazzWorldLogo({ size = 34 }) {
  return (
    <BrandMark file="jazzworld.jpg" size={size} label="JazzWorld" crop={{ size: "170%", position: "50% 26%" }}>
      <svg width={size} height={size} viewBox="0 0 100 100" aria-label="JazzWorld" className="shrink-0">
        <defs>
          <linearGradient id="jwGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e01e26" />
            <stop offset="55%" stopColor="#a01048" />
            <stop offset="100%" stopColor="#43005e" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="url(#jwGrad)" />
        <path
          d="M28 60 C33 42 41 40 43 53 L47 68 L54 46 L61 68 L67 47 C69 40 75 40 78 45"
          stroke="#fff"
          strokeWidth="5.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="40" cy="33" r="4.2" fill="#fff" />
      </svg>
    </BrandMark>
  );
}
