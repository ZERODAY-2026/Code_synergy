import { motion } from 'framer-motion';
import HijackChain from './HijackChain';

export default function FindingCard({
  finding,
  isActive,
  onCiteClick,
  onCiteClickA,
  onCiteClickB,
  onHover,
  index = 0,
  flat,
  onCrossExamine,
  onDecodeQuote,
}) {
  const {
    id,
    title,
    detail,
    severity,
    citation,
    citation_a,
    citation_b,
    evidence_quote,
    grounded,
    reason,
    attack,
    taxonomy,
    secret_type,
    verified_by,
    decoded,
    hijack_chain,
    confidence,
    neutralized,
  } = finding;

  const isNeutralized = !!neutralized;
  const badge = isNeutralized
    ? 'NEUTRALIZED'
    : grounded
    ? 'VERIFIED'
    : 'UNCONFIRMED';

  const badgeClass = isNeutralized
    ? 'text-[#22D3EE] bg-[rgba(34,211,238,0.12)] border-[rgba(34,211,238,0.4)]'
    : grounded
    ? 'text-[color:var(--verified)] bg-[rgba(53,208,127,0.12)] border-[rgba(53,208,127,0.4)]'
    : 'text-[color:var(--unconfirmed)] bg-[rgba(245,165,36,0.12)] border-[rgba(245,165,36,0.4)] badge-breathe';

  const sevColor = {
    critical: 'var(--critical)',
    high: 'var(--unconfirmed)',
    medium: '#eab308',
    low: 'var(--verified)',
    info: 'var(--accent)',
  }[severity] || 'var(--muted)';

  const confPct = Math.round((confidence ?? 0) * 100);

  return (
    <motion.div
      id={`finding-${id}`}
      data-finding-id={id}
      initial={flat ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        flat
          ? { duration: 0 }
          : { type: 'spring', stiffness: 260, damping: 26, delay: index * 0.06 }
      }
      whileHover={
        flat
          ? undefined
          : {
              z: 38,
              scale: 1.01,
              transition: { duration: 0.14, ease: 'easeOut' },
            }
      }
      onHoverStart={() => onHover?.(id)}
      onHoverEnd={() => onHover?.(null)}
      onClick={() => {
        if (citation) onCiteClick?.(citation.start_line, citation.end_line, id);
        else if (citation_b) onCiteClickB?.(citation_b.start_line, citation_b.end_line);
      }}
      className={`glass cursor-pointer p-3 transition-colors ${
        isActive ? 'border-[color:var(--accent)]' : 'hover:border-[rgba(255,255,255,0.2)]'
      }`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-bold text-sm text-[color:var(--text)] truncate">{title}</h3>
        <span
          className={`shrink-0 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border ${badgeClass}`}
          title={reason}
        >
          {badge}
        </span>
      </div>
      <p className="text-sm text-[color:var(--muted)] mb-2 leading-snug">{detail}</p>

      {/* Badges row: Severity, Taxonomy, ATT&CK, Confidence */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
          style={{ color: sevColor, borderColor: 'var(--panel-border)' }}
        >
          {severity}
        </span>

        {taxonomy && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[rgba(255,255,255,0.1)] text-[color:var(--unconfirmed)] bg-[rgba(245,165,36,0.06)]"
            title="Taxonomy category"
          >
            {taxonomy.replace(/_/g, ' ')}
          </span>
        )}

        {attack?.technique_id && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
            style={{ color: 'var(--attack)', borderColor: 'var(--panel-border)' }}
            title={attack.name}
          >
            {attack.technique_id}
          </span>
        )}

        {secret_type && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[rgba(255,255,255,0.1)] text-[color:var(--verified)] bg-[rgba(53,208,127,0.06)]"
          >
            {secret_type.replace(/_/g, ' ')}
          </span>
        )}

        {verified_by && (
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
            style={{
              color: verified_by === 'entropy' ? 'var(--unconfirmed)' : 'var(--verified)',
              borderColor: verified_by === 'entropy' ? 'rgba(245,165,36,0.3)' : 'rgba(53,208,127,0.3)',
              background: verified_by === 'entropy' ? 'rgba(245,165,36,0.08)' : 'rgba(53,208,127,0.08)',
            }}
          >
            {verified_by === 'entropy' ? 'SHANNON ENTROPY' : `PROOF: ${verified_by.toUpperCase()}`}
          </span>
        )}

        <span className="ml-auto text-[10px] mono" style={{ color: 'var(--muted)' }}>
          conf {confPct}%
        </span>
      </div>

      {decoded && (
        <div className="rounded p-2 text-[11px] mono my-2 border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.4)]">
          <div className="text-[9px] font-bold uppercase text-[color:var(--accent)] mb-1">
            Deterministic Proof:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px]">
            {Object.entries(decoded).map(([k, v]) => (
              <div key={k} className="truncate">
                <span className="text-[color:var(--muted)]">{k}: </span>
                <span className="text-[color:var(--text)] font-medium">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hijack Chain Renderer */}
      {hijack_chain && (
        <HijackChain
          chain={hijack_chain}
          citationA={citation_a}
          citationB={citation_b}
          grounded={grounded}
          onCiteClickA={onCiteClickA}
          onCiteClickB={onCiteClickB}
          onDecodeQuote={onDecodeQuote}
        />
      )}

      {/* Single Mode Citations */}
      {!hijack_chain && citation && (
        <div className="flex items-center gap-2 text-xs mb-2">
          <span style={{ color: 'var(--muted)' }}>Cited:</span>
          <span
            className="mono underline underline-offset-2 cursor-pointer font-medium"
            style={{ color: 'var(--accent)' }}
            onClick={(e) => {
              e.stopPropagation();
              onCiteClick?.(citation.start_line, citation.end_line, id);
            }}
          >
            lines {citation.start_line}–{citation.end_line}
          </span>
        </div>
      )}

      {/* Evidence Quote */}
      {!hijack_chain && evidence_quote && (
        <div
          className="rounded p-2 text-xs italic mono leading-relaxed"
          style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid var(--panel-border)', color: 'var(--text)' }}
        >
          “{evidence_quote}”
        </div>
      )}

      {!grounded && reason && (
        <div
          className="text-[10px] rounded px-2 py-1 mt-2"
          style={{
            color: 'var(--unconfirmed)',
            background: 'rgba(245,165,36,0.1)',
            border: '1px solid rgba(245,165,36,0.25)',
          }}
        >
          {reason}
        </div>
      )}

      {/* Interactive Actions: Cross-Examine & Decoder */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[rgba(255,255,255,0.06)]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCrossExamine?.(id);
          }}
          className="text-[10px] font-semibold px-2 py-1 rounded border border-[rgba(255,255,255,0.1)] hover:border-[color:var(--unconfirmed)] hover:text-[color:var(--unconfirmed)] transition flex items-center gap-1"
          style={{ color: 'var(--muted)' }}
          title="Challenge finding: 'why not benign?' — must re-cite or retract"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Cross-Examine (Benign?)</span>
        </button>

        {evidence_quote && onDecodeQuote && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDecodeQuote(evidence_quote);
            }}
            className="text-[10px] font-semibold px-2 py-1 rounded border border-[rgba(255,255,255,0.1)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] transition flex items-center gap-1"
            style={{ color: 'var(--muted)' }}
            title="Decode base64 / hex / URL / invisible unicode in Decoder Drawer"
          >
            <span>Decode Span</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
