const DOT_GRID = [34, 67, 100, 133, 166];

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
    </div>
  );
}
