/**
 * The validator (~15 lines, and it's the whole pitch).
 * Override the model's grounded field with this. That's the point: the
 * model's claims are checked by code, not taken on faith.
 */
export const norm = (s) => (s ?? '').replace(/\s+/g, ' ').trim();

export function verify(finding, lines) {
  if (!finding.citation || !finding.evidence_quote) {
    return { ...finding, grounded: false, reason: 'no citation provided' };
  }

  const { start_line: a, end_line: b } = finding.citation;
  const span = norm(lines.slice(a - 1, b).join(' '));
  const ok = span.includes(norm(finding.evidence_quote));

  return {
    ...finding,
    grounded: ok,
    reason: ok ? 'quote found in cited range' : 'quote NOT found in cited range',
  };
}

export function validateFindings(findings, lines) {
  return findings.map((f) => verify(f, lines));
}

/**
 * X-RAY Prompt Injection Validator
 * Validates dual-panel citations across Artifact A (Trusted) and Artifact B (Untrusted).
 */
export function verifyXrayFinding(finding, linesA = [], linesB = []) {
  const normTextA = norm(linesA.join(' '));
  const normTextB = norm(linesB.join(' '));

  // Check citation B (Untrusted payload)
  let okB = false;
  let reasonB = 'no untrusted citation';
  if (finding.citation_b?.quote) {
    okB = normTextB.includes(norm(finding.citation_b.quote));
    reasonB = okB ? 'B quote verified in untrusted input' : 'B quote NOT found in untrusted input';
  } else if (finding.evidence_quote) {
    okB = normTextB.includes(norm(finding.evidence_quote));
    reasonB = okB ? 'quote verified in untrusted input' : 'quote NOT found in untrusted input';
  }

  // Check citation A (Trusted instruction being defeated)
  let okA = true;
  let reasonA = 'standalone injection';
  if (finding.citation_a?.quote) {
    okA = normTextA.includes(norm(finding.citation_a.quote));
    reasonA = okA ? 'A instruction verified in policy' : 'A instruction NOT found in policy';
  }

  const isGrounded = okB && okA;
  const reason = isGrounded
    ? 'both sides verified by code'
    : !okB
    ? reasonB
    : reasonA;

  return {
    ...finding,
    grounded: isGrounded,
    reason,
  };
}

export function validateXrayFindings(findings = [], linesA = [], linesB = []) {
  return findings.map((f) => verifyXrayFinding(f, linesA, linesB));
}

/**
 * X-RAY Re-verify Loop
 * Re-runs validation against sanitized B and patched system prompt A.
 * If zero attack vectors survive in B, the state is NEUTRALIZED.
 */
export function reverifyXray(findings = [], linesPatchedA = [], linesSanitizedB = []) {
  const textSanitizedB = norm(linesSanitizedB.join(' '));
  let survivingCount = 0;

  const reverified = findings.map((f) => {
    const quoteB = norm(f.citation_b?.quote || f.evidence_quote || '');
    const stillPresent = quoteB.length > 0 && textSanitizedB.includes(quoteB);

    if (stillPresent) {
      survivingCount++;
      return {
        ...f,
        neutralized: false,
        surviving: true,
        reason: 'Attack payload STILL ACTIVE in sanitized input',
      };
    }

    return {
      ...f,
      neutralized: true,
      surviving: false,
      reason: 'Payload sanitized — attack vector eliminated',
    };
  });

  return {
    findings: reverified,
    neutralized: survivingCount === 0,
    survivingCount,
  };
}
