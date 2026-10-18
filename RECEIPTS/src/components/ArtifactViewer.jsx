export default function ArtifactViewer({
  text,
  highlightedLines = new Set(),
  activeLine = null,
  onLineClick,
  lineIdPrefix = 'line',
}) {
  const lines = text ? text.split('\n') : [];

  return (
    <div
      className="absolute inset-0 overflow-y-auto artifact-scroll"
      style={{
        border: '1px solid var(--panel-border)',
        borderRadius: 10,
        background: 'rgba(0,0,0,0.3)',
      }}
    >
      <table className="w-full text-left border-collapse">
        <tbody>
          {lines.map((line, i) => {
            const num = i + 1;
            const isCited = highlightedLines.has(num);
            const isActive = activeLine === num;

            let rowClass = 'cursor-pointer ';
            if (isActive) {
              rowClass += 'timeline-active-line ';
            } else if (isCited) {
              rowClass += 'bg-[rgba(53,208,127,0.08)] ';
            } else {
              rowClass += 'hover:bg-[rgba(255,255,255,0.03)] ';
            }

            let rowStyle = undefined;
            if (isActive) {
              rowStyle = {
                boxShadow: 'inset 3px 0 0 var(--accent), 0 0 16px rgba(34, 211, 238, 0.25)',
              };
            } else if (isCited) {
              rowStyle = {
                boxShadow: 'inset 3px 0 0 var(--verified)',
              };
            }

            return (
              <tr
                key={num}
                id={`${lineIdPrefix}-${num}`}
                className={rowClass}
                style={rowStyle}
                onClick={() => onLineClick?.(num, num, null)}
              >
                <td
                  className="w-12 pr-3 text-right mono text-xs select-none"
                  style={{
                    color: isActive ? 'var(--accent)' : 'var(--muted)',
                    opacity: isActive ? 1 : 0.6,
                    borderRight: '1px solid var(--panel-border)',
                  }}
                >
                  {num}
                </td>
                <td
                  className="px-3 text-xs mono leading-relaxed break-words whitespace-pre-wrap select-text"
                  style={{
                    color: isActive ? '#ffffff' : isCited ? 'var(--text)' : '#c3ccdb',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {line}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
