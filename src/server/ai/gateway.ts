/**
 * AI gateway — provider abstraction over Google Gemini.
 *
 * When `GEMINI_API_KEY` is set, features call Gemini; otherwise the caller's
 * deterministic heuristic fallback is used, so every AI feature is functional
 * (and honest) without a key and upgrades transparently when one is added.
 *
 * Governance: prompts are NOT logged (privacy); callers log only the feature +
 * subject + source to the audit trail. All output is suggestion-only.
 */
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";

export const aiEnabled = !!GEMINI_API_KEY;

// gemini-2.5-flash is free-tier eligible; thinking is disabled below so the
// output-token budget is spent on the answer, not on hidden reasoning.
const MODEL = process.env.AI_MODEL || "gemini-2.5-flash";

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

/** Call Gemini with a system instruction + user prompt. Returns text or null. */
export async function callModel(
  system: string,
  prompt: string,
  maxTokens = 800,
): Promise<string | null> {
  if (!aiEnabled) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: system }] },
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.2,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as GeminiResponse;
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" ? text : null;
  } catch {
    return null;
  }
}

/** Pull the first JSON object out of a model response (which may include prose). */
export function extractJson<T>(raw: string): T | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
