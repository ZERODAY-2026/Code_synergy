/**
 * Gemma 4 client for RECEIPTS.
 *
 * Cloud mode: proxied through a thin edge function so the Gemini API key
 * never ships in the bundle. For the hackathon scaffold this hits the
 * Gemini API directly; replace GEMINI_ENDPOINT with your edge function URL.
 *
 * Local mode: identical prompt against Ollama at localhost:11434 — genuine
 * airplane-mode demo, zero network to Gemma cloud.
 */

const GEMINI_MODEL = 'gemma-4-26b-a4b-it'; // Gemma 4 26B A4B IT (multimodal, generateContent)
const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent';

const OLLAMA_ENDPOINT = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'gemma4'; // `ollama pull gemma4` before demo
import { SYSTEM_PROMPT } from '../systemPrompt.js';

export const API_KEY_PLACEHOLDER = 'AIzaSyB6esVhziPBoMP9Y46t5QKb_KXzQ3ivLUk';

/**
 * Build the multimodal content parts for Gemma 4.
 * `image` is an optional base64 data URL (screenshot artifact).
 */
function buildParts(systemPrompt, artifactText, artifactType, imageBase64) {
  const text = `
SYSTEM: ${systemPrompt}

ARTIFACT_TYPE: ${artifactType}
ARTIFACT_TEXT:
${artifactText}

${imageBase64 ? '[IMAGE_ATTACHED]' : ''}
Output strict JSON only.
`.trim();

  const parts = [{ text }];
  if (imageBase64) {
    parts.push({
      inline_data: {
        mime_type: 'image/png',
        data: imageBase64.split(',')[1],
      },
    });
  }
  return parts;
}

/**
 * Find the index of the matching closing bracket/brace for an opening at `start`.
 * Respects string literals and escapes so braces inside quotes don't count.
 */
function matchingClose(s, start) {
  const open = s[start];
  const close = open === '{' ? '}' : open === '[' ? ']' : null;
  if (!close) return -1;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"' && !esc) inStr = !inStr;
    if (inStr) continue;
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Extract robust JSON from a model response that may be wrapped in prose/markdown.
 * Tries a full parse first, then falls back to locating the last balanced JSON
 * structure (object or array). A bare findings array is wrapped into the expected
 * object shape so the rest of the pipeline keeps working.
 */
function extractJSON(text) {
  let cleaned = text.trim();
  // Strip markdown fences
  cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();

  // 1. Direct parse
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    // fall through
  }

  // 2. Scan for balanced JSON structures, prefer the LAST one (Gemma often appends
  //    the JSON after a long reasoning trace).
  let best = null;
  let bestStart = -1;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '{' || ch === '[') {
      const end = matchingClose(cleaned, i);
      if (end !== -1 && end > i) {
        const cand = cleaned.slice(i, end + 1);
        try {
          const parsed = JSON.parse(cand);
          best = parsed;
          bestStart = i; // keep scanning so the LAST valid structure wins
        } catch (_) {
          // not valid JSON, keep scanning
        }
      }
    }
  }

  if (best !== null) {
    // If the model returned a bare array of findings, wrap it into our contract.
    if (Array.isArray(best)) {
      return {
        artifact_type: 'unknown',
        summary: 'Model returned findings without a wrapper object.',
        verdict: { severity: 'medium', label: 'Review required', confidence: 0.5 },
        findings: best,
        iocs: [],
        next_actions: ['Manually verify cited lines against the artifact.'],
        unknowns: ['Top-level object keys missing from model output.'],
      };
    }
    return best;
  }

  throw new Error('No valid JSON object or array found in model response');
}

/**
 * Cloud call via Gemini API (replace endpoint with your edge function proxy).
 */
async function callGemini(apiKey, systemPrompt, artifactText, artifactType, imageBase64) {
  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: buildParts(systemPrompt, artifactText, artifactType, imageBase64) }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 3000,
        responseMimeType: 'application/json',
      },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return extractJSON(text);
}

/**
 * Local call via Ollama (open weights, on-device).
 */
async function callOllama(systemPrompt, artifactText, artifactType, imageBase64) {
  const prompt = `${SYSTEM_PROMPT_HEADER(systemPrompt)}\n\nARTIFACT_TYPE: ${artifactType}\nARTIFACT_TEXT:\n${artifactText}\n${imageBase64 ? '[IMAGE_ATTACHED]' : ''}\nOutput strict JSON only.`;
  const res = await fetch(OLLAMA_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0.1 },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  return extractJSON(data.response ?? '');
}

function SYSTEM_PROMPT_HEADER(systemPrompt) {
  return systemPrompt;
}

/**
 * Analyze an artifact with Gemma 4.
 * mode: 'cloud' | 'local'
 * imageBase64: optional data URL for screenshot artifacts
 *
 * On schema/parse failure, attempts ONE automatic repair retry appending
 * the parse error to the prompt (per FR-4 of the RECEIPTS spec).
 */
export async function analyzeArtifact({
  artifactText,
  artifactType = 'unknown',
  mode = 'cloud',
  apiKey = API_KEY_PLACEHOLDER,
  imageBase64 = null,
  systemPrompt,
  cross_examine,
}) {
  const prompt = systemPrompt || SYSTEM_PROMPT;

  let lastError = null;
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      let raw;
      if (mode === 'local') {
        raw = await callOllama(prompt, artifactText, artifactType, imageBase64);
      } else {
        raw = await callGemini(apiKey, prompt, artifactText, artifactType, imageBase64);
      }
      return { data: raw, mode, attempts };
    } catch (err) {
      lastError = err;
      // Repair retry: append the parse error and try once more
      if (attempts < maxAttempts) {
        // eslint-disable-next-line no-console
        console.warn(`Attempt ${attempts} failed:`, err.message);
      }
    }
  }

  throw lastError;
}
