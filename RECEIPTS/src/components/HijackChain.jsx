export default function HijackChain({
  chain,
  citationA,
  citationB,
  grounded = true,
  onCiteClickA,
  onCiteClickB,
  onDecodeQuote,
}) {
  if (!chain) return null;

  const { untrusted_span, overridden_instruction, consequence } = chain;

  return (
    <div
      className="rounded-lg p-2.5 my-2 border text-xs flex flex-col gap-2"
      style={{
        background: 'rgba(0,0,0,0.45)',
        borderColor: grounded ? 'rgba(53,208,127,0.3)' : 'rgba(245,165,36,0.3)',
      }}
    >
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-1">
        <span
          className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
          style={{ color: grounded ? 'var(--verified)' : 'var(--unconfirmed)' }}
        >
          <span>●</span>
          <span>HIJACK CHAIN</span>
          <span className="opacity-60 text-[9px]">({grounded ? 'CODE VERIFIED' : 'UNCONFIRMED'})</span>
        </span>

        {onDecodeQuote && untrusted_span && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDecodeQuote(untrusted_span);
            }}
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.1)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] text-[color:var(--muted)] transition"
            title="Inspect invisible spans in Decoder"
          >
            Decode Span
          </button>
        )}
      </div>

      {/* Visual Chain Flow */}
      <div className="flex flex-col gap-1.5 mono text-[11px]">
        {/* Node 1: Untrusted Span B */}
        <div
          className="rounded p-2 border transition-colors cursor-pointer"
          style={{
            background: 'rgba(255,92,92,0.07)',
            borderColor: 'rgba(255,92,92,0.35)',
            color: 'var(--text)',
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (citationB) onCiteClickB?.(citationB.start_line, citationB.end_line);
          }}
          title="Click to jump to untrusted span in Panel B"
        >
          <div className="flex items-center justify-between text-[9px] uppercase tracking-wider mb-1 font-bold text-[color:var(--critical)]">
            <span>Untrusted Input (B)</span>
            {citationB && (
              <span className="underline text-[color:var(--accent)]">
                B: lines {citationB.start_line}–{citationB.end_line}
              </span>
            )}
          </div>
          <div className="leading-snug break-words italic">“{untrusted_span}”</div>
        </div>

        {/* Arrow 1: overrides */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-[color:var(--unconfirmed)] uppercase tracking-wider py-0.5 select-none">
          <span>▼ overrides</span>
        </div>

        {/* Node 2: Overridden Policy A */}
        <div
          className="rounded p-2 border transition-colors cursor-pointer"
          style={{
            background: 'rgba(34,211,238,0.07)',
            borderColor: 'rgba(34,211,238,0.35)',
            color: 'var(--text)',
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (citationA) onCiteClickA?.(citationA.start_line, citationA.end_line);
          }}
          title="Click to jump to defeated instruction in Policy A"
        >
          <div className="flex items-center justify-between text-[9px] uppercase tracking-wider mb-1 font-bold text-[color:var(--accent)]">
            <span>Defeated Policy (A)</span>
            {citationA ? (
              <span className="underline text-[color:var(--accent)]">
                A: lines {citationA.start_line}–{citationA.end_line}
              </span>
            ) : (
              <span className="text-[color:var(--muted)]">Core Boundary</span>
            )}
          </div>
          <div className="leading-snug break-words">“{overridden_instruction}”</div>
        </div>

        {/* Arrow 2: therefore */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-[color:var(--attack)] uppercase tracking-wider py-0.5 select-none">
          <span>▼ therefore</span>
        </div>

        {/* Node 3: Resulting Hijack Consequence */}
        <div
          className="rounded p-2 border"
          style={{
            background: 'rgba(139,124,246,0.1)',
            borderColor: 'rgba(139,124,246,0.4)',
            color: 'var(--text)',
          }}
        >
          <div className="text-[9px] uppercase tracking-wider mb-1 font-bold text-[color:var(--attack)]">
            Agent Hijack Behavior
          </div>
          <div className="leading-snug font-medium text-[color:var(--text)]">{consequence}</div>
        </div>
      </div>
    </div>
  );
}
