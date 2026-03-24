// ── FantasyHeroWave ────────────────────────────────────────────────────────────
//
// Pure SVG wave/divider component for the fantasy section.
// No state, no effects — safe for server components and client components alike.
//
// Design tokens (all derived from the existing fantasy palette):
//   #222232  — page base background           (gaffer.bg)
//   #1a1b2e  — deep surface layer             (card/panel dark)
//   #FF6B00  — orange accent                  (gaffer.orange)
//
// Two positions:
//   'bottom' — wave crest faces up, dark fill below.
//              Use as a "rising floor" under nav menus / content sections.
//              → FantasyDashboard between hero and nav
//
//   'top'    — dark fill above, wave crest faces down.
//              Use as a "crown arch" at the bottom of a header area.
//              → FantasyTeamScreen / PointsScreen below the header bar
//
// ─────────────────────────────────────────────────────────────────────────────

export interface FantasyHeroWaveProps {
  /** 'bottom' (default) — rising floor; 'top' — descending header crown */
  position?: 'bottom' | 'top'
  /** Extra Tailwind / inline class string for positioning the container */
  className?: string
  /** 0–1 master opacity (default 1) */
  opacity?: number
}

// ── Bottom wave (rising floor) ────────────────────────────────────────────────
//
// viewBox "0 0 400 800"
// Wave curves live in the first ~130 units (≈16% of total height).
// The remaining 670 units is solid fill so the component can be stretched
// to cover any amount of vertical real-estate while keeping the wave tight.
//
// At a 384px-wide / 480px-tall container the wave transition band is
// roughly 480 × 0.16 ≈ 75px — appropriately slim for a mobile UI.
//
function BottomWave({ opacity }: { opacity: number }) {
  return (
    <svg
      viewBox="0 0 400 800"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: '100%', opacity }}
    >
      {/* ── 1. Faint orange halo — barely-there energy at wave crests ── */}
      <path
        d="M0,68 C65,28 155,86 238,42 C298,10 356,50 400,34
           L400,800 L0,800 Z"
        fill="rgba(255,107,0,0.08)"
      />

      {/* ── 2. Deep navy mid-wave — adds perceived depth ── */}
      <path
        d="M0,84 C72,44 160,102 244,56 C306,22 362,66 400,48
           L400,800 L0,800 Z"
        fill="rgba(26,27,46,0.80)"
      />

      {/* ── 3. Opaque dark surface — the nav / content floor ── */}
      <path
        d="M0,102 C78,62 164,118 248,72 C310,38 366,82 400,64
           L400,800 L0,800 Z"
        fill="#1a1b2e"
      />

      {/* ── 4. Hard page-background fill — seamless merge with bg ── */}
      <path
        d="M0,122 C82,84 166,136 250,92 C314,58 368,100 400,84
           L400,800 L0,800 Z"
        fill="#222232"
      />
    </svg>
  )
}

// ── Top wave (header crown) ───────────────────────────────────────────────────
//
// viewBox "0 0 400 120"
// Solid dark fill at the top, wave crest curves outward at the bottom.
// A delicate orange stroke traces the wave edge for a lit-from-below feel.
//
function TopWave({ opacity }: { opacity: number }) {
  return (
    <svg
      viewBox="0 0 400 120"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: '100%', opacity }}
    >
      {/* ── Main header cap — dark fill with organic curved bottom ── */}
      <path
        d="M0,0 L400,0 L400,82
           C355,108 290,66 220,90
           C150,114 82,72 0,96 Z"
        fill="#222232"
      />

      {/* ── Inner surface layer — slight colour lift adds depth ── */}
      <path
        d="M0,0 L400,0 L400,70
           C352,96 286,54 216,78
           C146,102 78,62 0,84 Z"
        fill="rgba(26,27,46,0.55)"
      />

      {/* ── Orange accent edge — glowing underline of the header arch ── */}
      <path
        d="M0,96 C82,72 150,114 220,90 C290,66 355,108 400,82"
        fill="none"
        stroke="rgba(255,107,0,0.18)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* ── Subtle inner highlight — brightens the ridge slightly ── */}
      <path
        d="M0,92 C82,68 150,110 220,86 C290,62 355,104 400,78"
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

export function FantasyHeroWave({
  position = 'bottom',
  className = '',
  opacity = 1,
}: FantasyHeroWaveProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      {position === 'bottom'
        ? <BottomWave opacity={opacity} />
        : <TopWave   opacity={opacity} />}
    </div>
  )
}

export default FantasyHeroWave
