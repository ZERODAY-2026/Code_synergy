import { useEffect, useRef, useState } from 'react';

/**
 * Evaluate a cubic bezier (P0..P3) at parameter t.
 */
function bezierAt(x1, y1, x2, y2, cx1, cy1, cx2, cy2, t) {
  const mt = 1 - t;
  const a = mt * mt * mt;
  const b = 3 * mt * mt * t;
  const c = 3 * mt * t * t;
  const d = t * t * t;
  return {
    x: a * x1 + b * cx1 + c * cx2 + d * x2,
    y: a * y1 + b * cy1 + c * cy2 + d * y2,
  };
}

/**
 * The Verification Beam — Dual-Lens Engine.
 *
 * Mode 1 (TRIAGE): Finding Card (right) ──▶ Cited Source Line (left)
 * Mode 2 (X-RAY) : Finding Card ──▶ Untrusted Line (B) ──overrides──▶ Policy Line (A)
 */
export default function BeamLayer({ findings = [], hoveredId, containerRef, flat, lens = 'triage' }) {
  const [beams, setBeams] = useState([]);
  const rafRef = useRef(0);

  useEffect(() => {
    const compute = () => {
      const container = containerRef?.current;
      if (!container) return;
      const cRect = container.getBoundingClientRect();
      const next = [];
      let cap = 0;

      for (const f of findings) {
        if (cap >= 14) break; // Performance guardrail

        const cardEl = document.getElementById(`finding-${f.id}`);
        if (!cardEl) continue;
        const cCard = cardEl.getBoundingClientRect();

        // 1. Check for Line B (X-RAY untrusted input) or Line (Triage single log)
        const lineBNum = f.citation_b?.start_line || f.citation?.start_line;
        const lineBEl =
          document.getElementById(`line-b-${lineBNum}`) ||
          document.getElementById(`line-${lineBNum}`);

        // 2. Check for Line A (X-RAY policy instruction being overridden)
        const lineANum = f.citation_a?.start_line;
        const lineAEl = lineANum ? document.getElementById(`line-a-${lineANum}`) : null;

        if (lineBEl) {
          const lRectB = lineBEl.getBoundingClientRect();
          const xCard = cCard.left - cRect.left + 2;
          const yCard = cCard.top + cCard.height / 2 - cRect.top;
          const xB = lRectB.right - cRect.left - 4;
          const yB = lRectB.top + lRectB.height / 2 - cRect.top;

          if (yB >= -300 && yB <= cRect.height + 300) {
            next.push({
              key: `${f.id}-b`,
              id: f.id,
              grounded: f.neutralized ? true : !!f.grounded,
              neutralized: !!f.neutralized,
              x1: xCard,
              y1: yCard,
              x2: xB,
              y2: yB,
              type: 'card-to-b',
            });
            cap++;
          }

          // In X-RAY mode: draw cross-panel beam from B's malicious span across to A's defeated instruction
          if (lineAEl) {
            const lRectA = lineAEl.getBoundingClientRect();
            const xA = lRectA.right - cRect.left - 4;
            const yA = lRectA.top + lRectA.height / 2 - cRect.top;
            const xBLeft = lRectB.left - cRect.left + 4;

            if (yA >= -300 && yA <= cRect.height + 300) {
              next.push({
                key: `${f.id}-a-override`,
                id: f.id,
                grounded: f.neutralized ? true : !!f.grounded,
                neutralized: !!f.neutralized,
                x1: xBLeft,
                y1: yB,
                x2: xA,
                y2: yA,
                type: 'b-to-a',
              });
              cap++;
            }
          }
        }
      }

      setBeams(next);
    };

    const schedule = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        compute();
      });
    };

    compute();
    const t1 = setTimeout(compute, 100);
    const t2 = setTimeout(compute, 300);

    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    return () => {
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      clearTimeout(t1);
      clearTimeout(t2);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [findings, containerRef, lens]);

  if (beams.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <filter id="beam-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="beam-glow-neutralized" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {beams.map((b) => {
        const dx = b.x1 - b.x2;
        const cx1 = b.x1 - dx * 0.45;
        const cx2 = b.x2 + dx * 0.45;

        let targetX = b.x2;
        let targetY = b.y2;
        let pathD;

        if (b.grounded || b.neutralized) {
          pathD = `M ${b.x1} ${b.y1} C ${cx1} ${b.y1}, ${cx2} ${b.y2}, ${b.x2} ${b.y2}`;
        } else {
          // Unconfirmed: travels 60% of curve then halts
          const p60 = bezierAt(b.x1, b.y1, b.x2, b.y2, cx1, b.y1, cx2, b.y2, 0.6);
          targetX = p60.x;
          targetY = p60.y;
          const subCx1 = b.x1 - (b.x1 - targetX) * 0.5;
          const subCx2 = targetX + (b.x1 - targetX) * 0.3;
          pathD = `M ${b.x1} ${b.y1} C ${subCx1} ${b.y1}, ${subCx2} ${targetY}, ${targetX} ${targetY}`;
        }

        const strokeColor = b.neutralized
          ? 'var(--accent)'
          : b.grounded
          ? 'var(--verified)'
          : 'var(--unconfirmed)';

        const opacity = hoveredId ? (hoveredId === b.id ? 1.0 : 0.22) : 0.85;

        return (
          <g key={b.key} style={{ opacity, transition: 'opacity 180ms ease' }}>
            {b.grounded || b.neutralized ? (
              <>
                {/* Glow layer */}
                {!flat && (
                  <path
                    d={pathD}
                    stroke={strokeColor}
                    strokeWidth="6"
                    fill="none"
                    opacity={b.neutralized ? 0.6 : 0.45}
                    filter={b.neutralized ? 'url(#beam-glow-neutralized)' : 'url(#beam-glow)'}
                    pathLength="100"
                    strokeDasharray="100"
                    className="beam-draw"
                  />
                )}

                {/* Crisp core stroke */}
                <path
                  d={pathD}
                  stroke={strokeColor}
                  strokeWidth="1.5"
                  fill="none"
                  pathLength="100"
                  strokeDasharray="100"
                  className={flat ? '' : 'beam-draw'}
                />

                {/* Origin dot */}
                <circle
                  cx={b.x1}
                  cy={b.y1}
                  r="3.5"
                  fill={strokeColor}
                  className={flat ? '' : 'dot-pulse'}
                />

                {/* Landing dot */}
                <circle
                  cx={b.x2}
                  cy={b.y2}
                  r="3.5"
                  fill={strokeColor}
                  className={flat ? '' : 'dot-pulse'}
                />

                {/* Expanding ring */}
                {!flat && (
                  <circle
                    cx={b.x2}
                    cy={b.y2}
                    r="3.5"
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="1.5"
                    className="expanding-ring"
                  />
                )}
              </>
            ) : (
              <>
                {/* Unconfirmed dashed beam */}
                <path
                  d={pathD}
                  stroke="var(--unconfirmed)"
                  strokeWidth="1.5"
                  fill="none"
                  strokeDasharray="6 6"
                  className={flat ? '' : 'beam-flicker'}
                />

                <circle cx={b.x1} cy={b.y1} r="3" fill="var(--unconfirmed)" opacity="0.8" />

                <circle
                  cx={targetX}
                  cy={targetY}
                  r="3"
                  fill="none"
                  stroke="var(--unconfirmed)"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                  className={flat ? '' : 'beam-flicker'}
                />

                <line
                  x1={targetX - 6}
                  y1={targetY}
                  x2={b.x2}
                  y2={b.y2}
                  stroke="var(--unconfirmed)"
                  strokeWidth="0.75"
                  strokeDasharray="2 4"
                  opacity="0.25"
                />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
