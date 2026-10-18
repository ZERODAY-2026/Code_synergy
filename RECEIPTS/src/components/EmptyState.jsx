export default function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ color: 'var(--muted)' }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)' }}>
        <svg className="w-8 h-8" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Drop or paste an artifact</h2>
      <p className="text-sm max-w-xs mb-6">
        Log, email, config, JWT, or screenshot. RECEIPTS hashes it, runs Gemma 4, and stamps every claim VERIFIED or UNCONFIRMED — then draws the beam to the exact source line.
      </p>
      <div className="text-xs" style={{ opacity: 0.7 }}>
        Try <span className="mono" style={{ color: 'var(--accent)' }}>Sample auth.log</span> or the phishing email above.
      </div>
    </div>
  );
}
