/**
 * AI gateway — provider abstraction over Anthropic Claude.
 *
 * When `ANTHROPIC_API_KEY` is set, features call Claude; otherwise the caller's
 * deterministic heuristic fallback is used, so every AI feature is functional
 * (and honest) without a key and upgrades transparently when one is added.
 *
 * Governance: prompts are NOT logged (privacy); callers log only the feature +
 * subject + source to the audit trail. All output is suggestion-only.
 */
export const aiEnabled = !!process.env.ANTHROPIC_API_KEY;

const MODEL = process.env.AI_MODEL || "claude-haiku-4-5-20251001";

export async function callClaude(
  system: string,
  prompt: string,
  maxTokens = 800,
): Promise<string | null> {
  if (!aiEnabled) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY as string,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      content?: { text?: string }[];
    };
    const text = json?.content?.[0]?.text;
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
