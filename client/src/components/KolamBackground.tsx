const DOT_GRID = [34, 67, 100, 133, 166];

// Letterform strokes inspired by Tamizhi (Tamil-Brahmi) inscriptions —
// decorative, drawn as SVG so no ancient-script font is needed.
const TAMIZHI_GLYPHS = [
  'M12 4 V20 M4 12 H20', // ka — cross
  'M6 20 V8 L12 4 L18 8 V20', // ma — open gable
  'M12 4 V20 M12 9 Q6 9 6 14', // ta — stem with hook
  'M5 5 H19 M12 5 V20', // na — tee
  'M5 13 Q5 4 12 4 Q19 4 19 13 V20', // ya — arch with tail
  'M7 4 V15 Q7 20 12 20 Q17 20 17 15 V10', // la — basin
  'M12 6 A5 5 0 1 0 12 16 M12 16 V20', // va — loop with stem
];

// Graffiti marks from Keezhadi-excavation pottery shards.
const POTTERY_MARKS = {
  fish: 'M3 12 Q9 5 15 12 Q9 19 3 12 Z M15 12 L21 7 M15 12 L21 17',
  sun: 'M12 12 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M12 2 V6 M12 18 V22 M2 12 H6 M18 12 H22 M5 5 L8 8 M19 5 L16 8 M5 19 L8 16 M19 19 L16 16',
  river: 'M3 16 L8 8 L13 16 L18 8 L21 12',
  ladder: 'M8 3 V21 M16 3 V21 M8 8 H16 M8 13 H16 M8 18 H16',
};

function Glyph({ d, className = '', opacity = 0.14 }: { d: string; className?: string; opacity?: number }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="#C24A2D"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
    >
      <path d={d} />
    </svg>
  );
}

// Vertical strip of Tamizhi letterforms — reads like the inscribed edge of a
// stone pillar; shown only on wider screens.
function InscriptionPillar({ side }: { side: 'left' | 'right' }) {
  const glyphs = side === 'left' ? TAMIZHI_GLYPHS : [...TAMIZHI_GLYPHS].reverse();
  return (
    <div
      className={`absolute inset-y-0 ${side === 'left' ? 'left-5' : 'right-5'} hidden md:flex flex-col items-center justify-center gap-7`}
    >
      {glyphs.map((d, i) => (
        <Glyph key={i} d={d} />
      ))}
      <div className="w-px h-16 bg-accent opacity-10" />
    </div>
  );
}

export default function KolamBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* faint pulli (dot) grid across the whole canvas */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(194,74,45,0.09) 1px, transparent 1.5px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* warm radial wash behind the content */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 32%, rgba(232,212,196,0.55), transparent 65%)' }}
      />
      {/* central kolam mandala — draws itself on load, then rotates imperceptibly */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,660px)] h-[min(92vw,660px)]">
        <svg
          className="kolam-spin w-full h-full opacity-[0.16]"
          viewBox="0 0 200 200"
          fill="none"
          stroke="#C24A2D"
          strokeWidth="1.2"
          strokeLinecap="round"
        >
          {/* pulli grid anchoring the kolam */}
          {DOT_GRID.map((y) =>
            DOT_GRID.map((x) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="#C24A2D" stroke="none" opacity="0.5" />
            )),
          )}
          {/* outer diamond weave */}
          <path
            className="kolam-path"
            pathLength={1}
            d="M100 18 Q148 52 182 100 Q148 148 100 182 Q52 148 18 100 Q52 52 100 18 Z"
          />
          {/* rounded square interlocking the diamond — eight-point star */}
          <path
            className="kolam-path"
            pathLength={1}
            style={{ animationDelay: '0.6s' }}
            d="M48 34 H152 Q166 34 166 48 V152 Q166 166 152 166 H48 Q34 166 34 152 V48 Q34 34 48 34 Z"
          />
          {/* sikku loops at the four gates */}
          {[
            [100, 30],
            [170, 100],
            [100, 170],
            [30, 100],
          ].map(([cx, cy], i) => (
            <circle
              key={`loop-${cx}-${cy}`}
              className="kolam-path"
              pathLength={1}
              style={{ animationDelay: `${1.2 + i * 0.25}s` }}
              cx={cx}
              cy={cy}
              r="14"
            />
          ))}
          {/* centre flower */}
          <path
            className="kolam-path"
            pathLength={1}
            style={{ animationDelay: '2.4s' }}
            d="M100 72 Q118 82 128 100 Q118 118 100 128 Q82 118 72 100 Q82 82 100 72 Z"
          />
          <circle className="kolam-path" pathLength={1} style={{ animationDelay: '2.8s' }} cx="100" cy="100" r="9" />
        </svg>
      </div>
      {/* Tamizhi inscription pillars flanking the page */}
      <InscriptionPillar side="left" />
      <InscriptionPillar side="right" />
      {/* Keezhadi pottery graffiti, scattered like shard finds */}
      <div className="absolute bottom-14 left-8 rotate-[-8deg]">
        <Glyph d={POTTERY_MARKS.fish} opacity={0.18} />
      </div>
      <div className="absolute top-16 left-10 rotate-[6deg]">
        <Glyph d={POTTERY_MARKS.sun} opacity={0.14} />
      </div>
      <div className="absolute bottom-20 right-10 rotate-[5deg]">
        <Glyph d={POTTERY_MARKS.river} opacity={0.16} />
      </div>
      <div className="absolute top-24 right-14 rotate-[-5deg] hidden sm:block">
        <Glyph d={POTTERY_MARKS.ladder} opacity={0.12} />
      </div>
    </div>
  );
}
