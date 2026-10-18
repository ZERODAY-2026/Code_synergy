import { useState } from 'react';

export default function ExhibitHeader({ exhibitId, hash, timestamp, type, mode }) {
  const [copied, setCopied] = useState(false);
  const dateUtc = timestamp ? new Date(timestamp).toUTCString() : '';
  const truncatedHash = hash ? `${hash.slice(0, 10)}…${hash.slice(-8)}` : '';

  const copy = async () => {
    if (!hash) return;
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="glass p-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded" style={{ background: 'rgba(34,211,238,0.12)', color: 'var(--accent)', border: '1px solid rgba(34,211,238,0.3)' }}>
          {exhibitId || 'EXHIBIT-001'}
        </span>
        <span className="text-xs font-bold tracking-wider uppercase text-[color:var(--muted)]">
          {type ? type.replace(/_/g, ' ') : 'ARTIFACT'}
        </span>
        <span
          className="px-2 py-0.5 rounded border text-[10px] font-bold tracking-wider uppercase"
          style={{
            color: mode === 'local' ? 'var(--verified)' : 'var(--accent)',
            borderColor: mode === 'local' ? 'rgba(53,208,127,0.4)' : 'rgba(34,211,238,0.4)',
          }}
        >
          {mode === 'local' ? 'OFFLINE WEIGHTS' : 'GEMMA 4'}
        </span>
      </div>

      <div
        className="flex items-center gap-3 text-xs mono rounded px-2.5 py-1.5 cursor-pointer hover:border-[color:var(--accent)] transition"
        style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid var(--panel-border)' }}
        onClick={copy}
        title="Click to copy full SHA-256 hash"
      >
        <span className="uppercase tracking-wider text-[10px] text-[color:var(--muted)]">SHA-256</span>
        <span className="text-[color:var(--text)] font-medium">{truncatedHash}</span>
        <span className="text-[10px] text-[color:var(--accent)]">{copied ? 'Copied ✓' : 'Copy'}</span>
        {dateUtc && (
          <span className="hidden sm:inline text-[10px] text-[color:var(--muted)] pl-2 border-l border-[rgba(255,255,255,0.1)]">
            {dateUtc}
          </span>
        )}
      </div>
    </div>
  );
}
