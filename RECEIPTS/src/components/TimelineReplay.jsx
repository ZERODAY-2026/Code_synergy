import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

/**
 * Parse lines into chronological forensic timeline events.
 */
function extractTimelineEvents(lines = [], findings = []) {
  const events = [];
  const timeRegexes = [
    /([A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2})/,
    /(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})/,
    /([A-Za-z]{3},\s+\d+\s+[A-Za-z]{3}\s+\d{4}\s+\d{2}:\d{2}:\d{2})/,
    /(\d{2}:\d{2}:\d{2})/,
  ];

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    let timeStr = null;
    for (const rx of timeRegexes) {
      const match = line.match(rx);
      if (match) {
        timeStr = match[1];
        break;
      }
    }

    // Match against findings citing this line
    const matchedFinding = findings.find(
      (f) => f.citation && lineNum >= f.citation.start_line && lineNum <= f.citation.end_line
    );

    if (timeStr || matchedFinding) {
      let severity = matchedFinding?.severity || 'info';
      if (!matchedFinding) {
        if (/Failed password|invalid user|unauthorized|denied/i.test(line)) severity = 'high';
        else if (/curl.*bash|sudo.*root|rm\s+-rf|wget.*sh/i.test(line)) severity = 'critical';
        else if (/Accepted password|Accepted publickey|session opened/i.test(line)) severity = 'medium';
      }

      // Generate concise caption
      let caption = '';
      if (matchedFinding) {
        caption = `${matchedFinding.title}: ${matchedFinding.detail || line}`;
      } else {
        const cleanLine = line.replace(/^[A-Za-z0-9: \t-]+sshd\[\d+\]:\s*/, '').trim();
        caption = cleanLine || line;
      }

      events.push({
        id: `ev-${lineNum}`,
        lineNum,
        timeStr: timeStr || `Line ${lineNum}`,
        severity,
        caption,
        grounded: matchedFinding ? matchedFinding.grounded : true,
        findingId: matchedFinding?.id,
      });
    }
  });

  return events;
}

const SEVERITY_COLORS = {
  critical: 'var(--critical)',
  high: 'var(--unconfirmed)',
  medium: '#eab308',
  low: 'var(--verified)',
  info: 'var(--accent)',
};

/**
 * Timeline Replay component with scrubber, play/pause, step controls,
 * keyboard shortcuts, and synchronized artifact auto-scroll.
 */
export default function TimelineReplay({
  lines = [],
  findings = [],
  onActiveLineChange,
  activeLine,
  flat,
}) {
  const events = useMemo(() => extractTimelineEvents(lines, findings), [lines, findings]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x or 2x
  const timerRef = useRef(null);

  const currentEvent = events[currentIndex] || null;

  // Jump to event and notify parent
  const selectEvent = useCallback(
    (index) => {
      if (events.length === 0) return;
      const targetIndex = Math.max(0, Math.min(events.length - 1, index));
      setCurrentIndex(targetIndex);
      const ev = events[targetIndex];
      if (ev) {
        onActiveLineChange?.(ev.lineNum, ev.findingId);
        const el = document.getElementById(`line-${ev.lineNum}`);
        if (el) {
          el.scrollIntoView({ behavior: flat ? 'auto' : 'smooth', block: 'center' });
        }
      }
    },
    [events, onActiveLineChange, flat]
  );

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.round(1400 / speed);
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= events.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        const next = prev + 1;
        const ev = events[next];
        if (ev) {
          onActiveLineChange?.(ev.lineNum, ev.findingId);
          const el = document.getElementById(`line-${ev.lineNum}`);
          if (el) {
            el.scrollIntoView({ behavior: flat ? 'auto' : 'smooth', block: 'center' });
          }
        }
        return next;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, events, onActiveLineChange, flat]);

  // Keyboard controls: Space = play/pause, Left = prev, Right = next
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept when user is typing in inputs or textareas
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        selectEvent(currentIndex + 1);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        selectEvent(currentIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, selectEvent]);

  if (events.length === 0) return null;

  return (
    <div
      className="glass p-3 flex flex-col gap-2 mt-2 border-t border-[rgba(255,255,255,0.08)] select-none"
      style={{ background: 'rgba(14,17,23,0.85)' }}
    >
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wider text-[10px] uppercase" style={{ color: 'var(--accent)' }}>
            Timeline Replay
          </span>
          <span className="text-[10px] mono text-[color:var(--muted)]">
            {currentIndex + 1} / {events.length} events
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Step Back */}
          <button
            onClick={() => selectEvent(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="p-1 rounded hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-30 text-[color:var(--text)] transition"
            title="Step Back (Left Arrow)"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition"
            style={{
              background: isPlaying ? 'rgba(255,92,92,0.2)' : 'rgba(53,208,127,0.2)',
              color: isPlaying ? 'var(--critical)' : 'var(--verified)',
              border: `1px solid ${isPlaying ? 'rgba(255,92,92,0.4)' : 'rgba(53,208,127,0.4)'}`,
            }}
            title="Play/Pause (Space)"
          >
            {isPlaying ? (
              <>
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>REPLAY</span>
              </>
            )}
          </button>

          {/* Step Forward */}
          <button
            onClick={() => selectEvent(currentIndex + 1)}
            disabled={currentIndex === events.length - 1}
            className="p-1 rounded hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-30 text-[color:var(--text)] transition"
            title="Step Forward (Right Arrow)"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Speed Toggle */}
          <button
            onClick={() => setSpeed((s) => (s === 1 ? 2 : 1))}
            className="px-1.5 py-0.5 rounded text-[10px] mono border border-[rgba(255,255,255,0.1)] text-[color:var(--muted)] hover:text-[color:var(--text)]"
            title="Toggle playback speed"
          >
            {speed}x
          </button>
        </div>
      </div>

      {/* Horizontal Scrubber */}
      <div className="relative w-full h-5 flex items-center group cursor-pointer">
        {/* Track */}
        <div className="absolute inset-x-0 h-1 rounded-full bg-[rgba(255,255,255,0.08)]" />

        {/* Filled Progress Track */}
        <div
          className="absolute left-0 h-1 rounded-full transition-all duration-150"
          style={{
            width: `${(currentIndex / Math.max(1, events.length - 1)) * 100}%`,
            background: 'var(--accent)',
            boxShadow: '0 0 8px rgba(34,211,238,0.5)',
          }}
        />

        {/* Event Markers */}
        {events.map((ev, idx) => {
          const pct = (idx / Math.max(1, events.length - 1)) * 100;
          const isSelected = idx === currentIndex;
          const color = SEVERITY_COLORS[ev.severity] || 'var(--muted)';
          return (
            <div
              key={ev.id}
              onClick={(e) => {
                e.stopPropagation();
                selectEvent(idx);
              }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full transition-transform hover:scale-150 z-10"
              style={{
                left: `${pct}%`,
                width: isSelected ? '10px' : '6px',
                height: isSelected ? '10px' : '6px',
                backgroundColor: color,
                boxShadow: isSelected ? `0 0 10px ${color}` : undefined,
                border: isSelected ? '1.5px solid #ffffff' : 'none',
              }}
              title={`${ev.timeStr} (Line ${ev.lineNum}): ${ev.severity.toUpperCase()}`}
            />
          );
        })}
      </div>

      {/* Animated one-line caption */}
      {currentEvent && (
        <div
          className="flex items-center gap-2 text-xs rounded px-2.5 py-1.5 transition-all duration-200"
          style={{
            background: 'rgba(0,0,0,0.4)',
            borderLeft: `3px solid ${SEVERITY_COLORS[currentEvent.severity] || 'var(--accent)'}`,
          }}
        >
          <span className="mono text-[11px] font-bold shrink-0" style={{ color: 'var(--accent)' }}>
            {currentEvent.timeStr}
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
            style={{
              color: SEVERITY_COLORS[currentEvent.severity],
              backgroundColor: 'rgba(255,255,255,0.05)',
            }}
          >
            {currentEvent.severity}
          </span>
          <span className="mono text-[11px] text-[color:var(--text)] truncate">
            {currentEvent.caption}
          </span>
          <span className="ml-auto text-[10px] mono text-[color:var(--muted)] shrink-0">
            line {currentEvent.lineNum}
          </span>
        </div>
      )}
    </div>
  );
}
