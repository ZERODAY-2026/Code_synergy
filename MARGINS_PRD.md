# Margins — Product Requirements Doc

**Track:** DeepMind / Google — Best Use of Gemma 4  
**Team:** Team Margins  
**Build window:** Oct 18–19, 2026 (target: 36 working hours)

## 0. Snapshot

| Field | Value |
|-------|-------|
| Product | Margins — a multimodal coach that diagnoses where your reasoning broke, not just whether the answer is right |
| Track | DeepMind / Google — Best Use of Gemma 4 |
| Model | Gemma 4 (multimodal, open weights) via Gemini API; local fallback via Ollama |
| Platform | Responsive web app (single page) + installable PWA |
| Build window | Oct 18–19, 2026 (target: 36 working hours) |
| Team | Team Margins |
| One-liner | "Point your camera at your homework. Get the exact line where your thinking slipped, a three-step hint ladder, and three new problems built to break the habit." |

## 1. Problem

Students get graded on answers. The useful signal lives in the work — the step where a rule was misapplied. Existing AI tutors have two failure modes:

**Text-only.** They can't read a photographed notebook page, so students must retype multi-line algebra, which is exactly the friction that kills daily use.

**Answer-first.** They hand over the solution. The student learns nothing and the session ends.

Nobody has an affordable, private, multimodal tool that reads a page of handwriting and returns a diagnosis plus targeted reps.

## 2. Why Gemma 4 specifically

This is not a generic "we called an LLM" submission. Gemma 4 is load-bearing in four ways:

- **Multimodal by default.** Photo of handwriting → structured reasoning. The single hardest part of the product (transcribing messy, non-linear student work) is native to the model, not bolted on.
- **Open weights.** Margins ships a Local Mode where the identical prompt runs on-device. Student work never leaves the laptop. This is a real differentiator for schools and a killer demo beat.
- **Cost profile.** A tutoring product lives or dies on per-session cost. Gemma-class economics make free daily use viable where a frontier model would not be.
- **Rapid prototyping.** One endpoint, one structured-output contract, working prototype in hours — which is the point of the track.

## 3. Users

| Persona | Need | Success looks like |
|---------|------|--------------------|
| Maya, 15 — student | Doesn't want the answer, wants to know why she's stuck at 11pm | Fixes her own error after hint 1 or 2; doesn't ping a friend |
| Mr. Okafor — teacher | Wants to see patterns of misconception across a class | Exports a misconception histogram after a quiz |
| Devi — parent/self-learner | Privacy-sensitive; wants offline | Runs a full session in airplane mode |

## 4. Goals / Non-goals

### Goals

- **G1:** Photo → accurate step-level transcription of handwritten work for algebra, arithmetic, and physics-adjacent word problems.
- **G2:** Identify the first invalid step and name the misconception in plain language.
- **G3:** Never reveal the final answer before the student asks for it.
- **G4:** Generate 3 practice problems targeting that exact misconception.
- **G5:** Full offline session via local weights.

### Non-goals (v1)

- Handwriting correction or OCR-perfect fidelity on cursive.
- Multi-page documents / essay grading.
- Accounts, persistence beyond localStorage, social features.
- Subjects beyond math + intro physics.

## 5. Core user flow

1. Student opens Margins, taps Capture, photographs the page.
2. App downscales to ≤1536px long edge, sends image + system prompt.
3. Gemma 4 returns the structured contract (§7) in one call.
4. UI renders: transcribed steps with a single red flag on the first invalid step, the misconception in one sentence, and a collapsed hint ladder.
5. Student taps Hint 1 → one line, Socratic. Hint 2 → more explicit. Hint 3 → shows the rule. Answer stays hidden behind its own button.
6. Below: three generated practice chips. Tap one → it expands inline; answer is hidden until revealed.
7. Esc / Next page resets for the following problem.
8. Toggle Local Mode → identical flow, on-device weights, zero network.

## 6. Functional requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Accept camera capture or file upload (jpg/png/webp/heic) | P0 |
| FR-2 | Client-side downscale + EXIF rotation fix before upload | P0 |
| FR-3 | Single multimodal call returns the full JSON contract | P0 |
| FR-4 | Validate response against schema; on failure, one automatic repair retry with the parse error appended | P0 |
| FR-5 | Render steps with exactly one flagged first error | P0 |
| FR-6 | Hint ladder progressive disclosure (3 tiers) | P0 |
| FR-7 | Answer hidden until explicitly revealed | P0 |
| FR-8 | Generate 3 practice problems, each with hidden answer + target misconception | P0 |
| FR-9 | Local Mode toggle → same prompt against local weights | P0 |
| FR-10 | Low-confidence responses (confidence < 0.7) render an "I'm not sure about line 3" banner and highlight the region | P1 |
| FR-11 | "Wrong diagnosis" thumbs-down → stores image + correction in localStorage | P1 |
| FR-12 | Teacher view: misconception histogram across session history | P2 |
| FR-13 | TTS read-aloud of hints | P2 |
| FR-14 | Multi-image (page 1 + page 2) support | P2 |

## 7. Output contract

Single call, strict JSON, no prose wrapper.

```json
{
  "subject": "algebra",
  "problem_transcription": "Solve for x:  2(x + 3) = 14",
  "steps": [
    { "index": 1, "work": "2x + 6 = 14", "verdict": "valid", "note": "distribution correct" },
    { "index": 2, "work": "2x = 20", "verdict": "invalid", "note": "should subtract 6, added it" },
    { "index": 3, "work": "x = 10", "verdict": "downstream", "note": "follows from step 2" }
  ],
  "first_error": {
    "step_index": 2,
    "misconception": "inverse-operation direction — adds instead of subtracting to isolate the term",
    "evidence": "'2x = 20' implies +6 was applied, not −6"
  },
  "hint_ladder": [
    "Step 2 is the one to stare at. What operation is 'undone' when a term is added to x?",
    "You have +6 sitting on the same side as 2x. To remove it, apply the opposite.",
    "Subtract 6 from both sides: 2x = 14 − 6. Then divide by 2."
  ],
  "practice": [
    { "prompt": "3(x + 4) = 21", "answer": "x = 3", "targets": "inverse-operation direction" },
    { "prompt": "5x − 7 = 23", "answer": "x = 6", "targets": "inverse-operation direction" },
    { "prompt": "−2(x + 5) = 8", "answer": "x = −9", "targets": "inverse-operation direction + sign handling" }
  ],
  "confidence": 0.88,
  "needs_review": false
}
```

**System prompt shape:** role → "diagnose, don't solve" → transcription discipline ("mark illegible spans as `[?]`, never guess") → misconception taxonomy with ~40 named labels → JSON-only output → two few-shot examples (one valid, one invalid).

**Misconception taxonomy** is a flat list of strings so the teacher histogram is groupable without extra parsing. Roughly: inverse-operation direction, exponent distribution, fraction addition, sign handling, order of operations, unit conversion, formula substitution, proportionality.

## 8. Architecture

**Stack:** Vite + React + Tailwind. No backend for v1 — the Gemini API key is proxied through a thin edge function so it isn't in the bundle; Local Mode talks to `localhost:11434`.

**Latency budget:** capture → rendered diagnosis under 6s on a laptop, under 10s on mid-range mobile. Show a skeleton with the transcribed steps streaming in first (steps arrive as a partial parse, hints after) so the perceived wait is ~2s.

**Cost:** ~1,600 input tokens (image + prompt) and ~900 output tokens per session. At Gemma-class pricing a session lands well under a cent, which is what makes "unlimited free sessions" honest.

**Privacy:** no image ever persisted server-side. Local Mode is a genuine airplane-mode demo, not a marketing claim.

## 9. Non-functional requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | First contentful paint < 1.5s on 4G |
| NFR-2 | Works offline in Local Mode after initial model pull |
| NFR-3 | Zero image retention server-side |
| NFR-4 | Schema-validation failure rate < 2% in a 50-image test set |
| NFR-5 | Accessible: full keyboard path, AA contrast, screen-reader labels on all controls |
| NFR-6 | No answer leakage: the final answer string must not appear in hint tiers 1–2 (assert in tests) |

## 10. Metrics & evaluation

Build a 50-image golden set before writing UI: 30 algebra, 10 arithmetic, 10 physics word problems, at least 12 with deliberate errors, 5 with messy handwriting, 3 with a correct-but-messy solution that should yield `first_error: null`.

| Metric | Target |
|--------|--------|
| Step transcription accuracy (exact line match) | ≥ 90% |
| First-error localization (correct step index) | ≥ 80% |
| Misconception label match (human-graded) | ≥ 70% |
| Answer-leak violations | 0 |
| p95 end-to-end latency | < 8s |

Run the set before and after every prompt change. Log the diff in the repo — judges ask "how did you know it worked," and a versioned eval table is the answer.

## 11. Build plan

| Block | Hours | Deliverable |
|-------|-------|-------------|
| 0 | 0–3 | Golden set + taxonomy + system prompt v1, tested via raw API calls in a script |
| 1 | 3–9 | Capture, downscale, upload, JSON contract rendering (ugly but working) |
| 2 | 9–16 | Hint ladder, hidden answers, practice chips, error states, confidence banner |
| 3 | 16–22 | Local Mode via Ollama, mode toggle, offline check |
| 4 | 22–28 | Eval run, prompt v2, latency tuning, streaming skeleton |
| 5 | 28–34 | Visual polish, accessibility pass, teacher histogram |
| 6 | 34–36 | Demo script rehearsal ×3, README, 90s video, repo cleanup |

**Hard rule:** feature freeze at hour 28. Hours 28–36 are polish and rehearsal only. Hackathon losses come from shipping at hour 35.

## 12. Demo script (3 min)

**Cold open (0:00–0:20)** — "Every AI tutor gives you the answer. Here's the problem with that." Hold up a real notebook page with a deliberate mistake. "Maya got the answer wrong. But the answer isn't the interesting part — line 2 is."

**Beat 1 (0:20–1:10)** — Photograph the page live. Skeleton appears, steps stream in, red flag lands on step 2. Read the misconception aloud. "It didn't solve it. It found the habit."

**Beat 2 (1:10–1:50)** — Tap Hint 1, then 2. Student voiceover: "Oh. I added instead of subtracted." Note that the answer is still hidden.

**Beat 3 (1:50–2:20)** — The practice chips. "Three new problems, built from the exact thing she got wrong. Not random." Open one.

**Beat 4 (2:20–2:50)** — the money shot. Toggle Local Mode, pull the Wi-Fi, show airplane mode on screen, run a second page. "Same prompt. Same model. Open weights, on the device. A student's handwriting never leaves the laptop."

**Close (2:50–3:00)** — "Margins. Because the mistake is where the learning is."

Rehearse the Wi-Fi pull. It is the single highest-value 15 seconds in the demo and the one most likely to break.

## 13. Risks

| Risk | Mitigation |
|------|------------|
| Messy handwriting → bad transcription | `[?]` markers, never guess; show the transcription so the student can correct it; `needs_review` banner |
| Model solves instead of diagnosing | Explicit system-prompt rule + a test asserting the answer string is absent from hints 1–2 |
| Schema drift breaks the UI | Validator + one repair retry; render partials from a streaming parse |
| Local model too slow for the demo | Pre-pull weights; keep the local test image small; have a pre-recorded backup clip |
| Demo Wi-Fi failure | Local Mode is the backup and the highlight — that's the whole point |
| Over-scoping | Hour-28 freeze, non-goals enforced in writing |

## 14. Stretch goals (only if hours remain)

- **Misconception fingerprint** — after 10 sessions, show the student their top 3 recurring error types as a shareable card. This is the retention hook.
- **Teacher QR** — student scans, work lands in a class histogram, no accounts.
- **Handwriting-to-LaTeX export** for the transcribed page.
- **Voice-out hints** so it works while doing problems on paper.

## 15. Judging map

| Criterion from the track card | Where Margins delivers |
|-------------------------------|------------------------|
| Multimodal experience | Photo of handwriting is the primary input; the product doesn't work as text-only |
| Focused AI tool | One job: diagnose reasoning errors for learners. Not a chatbot |
| Rapid prototyping | Single endpoint, single JSON contract, prototype in hours; eval harness is a script, not a platform |
| Open model / Gemini API | Cloud via Gemini API, local via open weights — the same prompt both ways |
| "What can Gemma 4 bring to your project" | Its multimodal accuracy is the transcription layer, its cost makes free daily use viable, its openness makes Local Mode a privacy product rather than a slogan |
