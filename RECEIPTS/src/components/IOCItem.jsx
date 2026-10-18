export default function IOCItem({ ioc, onCopy, onDecode }) {
  const { type, value, line } = ioc;
  const typeColor = {
    ip: '#22d3ee',
    domain: '#8b7cf6',
    user: '#35d07f',
    hash: '#60a5fa',
    path: '#eab308',
    url: '#ff5c5c',
  }[type] || 'var(--muted)';

  return (
    <div
      className="flex items-center justify-between gap-2 rounded p-2 transition-colors hover:border-[rgba(255,255,255,0.18)] cursor-pointer group"
      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)' }}
      onClick={() => onDecode?.(value)}
      title="Click to decode in Decoder Drawer"
    >
      <div className="flex items-center gap-2 overflow-hidden min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-wider shrink-0" style={{ color: typeColor }}>
          {type}
        </span>
        <span className="text-xs mono truncate text-[color:var(--text)] group-hover:text-[color:var(--accent)] transition-colors" title={value}>
          {value}
        </span>
        {line != null && (
          <span className="text-[10px] mono shrink-0 text-[color:var(--muted)]">
            line {line}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        {onDecode && (
          <button
            onClick={() => onDecode(value)}
            className="p-1 rounded text-[color:var(--muted)] hover:text-[color:var(--accent)] transition"
            title="Decode Base64 / Hex / URL / JWT"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
        )}

        <button
          onClick={() => onCopy(value)}
          className="p-1 rounded text-[color:var(--muted)] hover:text-[color:var(--accent)] transition"
          title="Copy"
          aria-label={`Copy ${value}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
