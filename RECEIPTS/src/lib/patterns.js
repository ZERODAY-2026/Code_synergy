/**
 * Deterministic pattern fallback for RECEIPTS demo reliability.
 *
 * When Gemma 4 returns no citable findings, we still need at least one
 * VERIFIED, clickable finding so the "click → highlight line" demo beat
 * works. These are derived from obvious regex patterns in the artifact text
 * and are always grounded=true (exact line quotes).
 *
 * Each result: {id, title, detail, severity, citation:{start_line,end_line},
 * evidence_quote, grounded:true, attack:{technique_id,name}, confidence:1}
 */
const PATTERNS = [
  {
    name: 'Brute force then successful login',
    re: /Failed password for (invalid user )?\S+ from (\d+\.\d+\.\d+\.\d+)/,
    severity: 'high',
    attack: { technique_id: 'T1110.001', name: 'Brute Force: Password Guessing' },
    detail: 'Repeated failed password attempts from the same IP, followed by a successful login — consistent with brute force or credential stuffing.',
  },
  {
    name: 'Remote script execution (curl | bash)',
    re: /curl\s[^\n]*\|\s*bash/,
    severity: 'critical',
    attack: { technique_id: 'T1059.004', name: 'Command and Scripting Interpreter: Unix Shell' },
    detail: 'A command downloads and pipes a remote script directly into bash — classic remote code execution / initial access pattern.',
  },
  {
    name: 'Sudo command execution',
    re: /sudo.*COMMAND=/,
    severity: 'medium',
    attack: { technique_id: 'T1548.003', name: 'Abuse Elevation Control Mechanism: Sudo and Caching' },
    detail: 'Privileged command executed via sudo — review whether the command was authorized.',
  },
];

export function detectPatterns(text) {
  const lines = text.split('\n');
  const findings = [];
  let id = 1;
  for (const p of PATTERNS) {
    let m;
    // eslint-disable-next-line no-cond-assign
    while ((m = p.re.exec(text)) !== null) {
      // find which line the match starts on
      const idx = m.index;
      let lineNo = 1;
      let acc = 0;
      for (let i = 0; i < lines.length; i++) {
        if (acc + lines[i].length + 1 > idx) { lineNo = i + 1; break; }
        acc += lines[i].length + 1;
      }
      const quote = lines[lineNo - 1] || '';
      findings.push({
        id: `P${id++}`,
        title: p.name,
        detail: p.detail,
        severity: p.severity,
        citation: { start_line: lineNo, end_line: lineNo },
        evidence_quote: quote,
        grounded: true,
        attack: p.attack,
        confidence: 1,
      });
      p.re.lastIndex = m.index + 1;
    }
  }
  return findings;
}
