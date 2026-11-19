export type ChatMessage = { role: 'system' | 'user'; content: string };

export type ChatCompletion = {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number | null;
};

export const DEFAULT_MODEL = 'anthropic/claude-haiku-5.5';

/** Calls OpenRouter's OpenAI-compatible endpoint asking for a JSON object back. */
export async function chatJSON(messages: ChatMessage[]): Promise<ChatCompletion> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set (copy .env.example to .env.local).');
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'X-Title': 'Support Copilot' },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0,
      max_tokens: 700,
      response_format: { type: 'json_object' },
      usage: { include: true },
      // Hidden reasoning ate the whole max_tokens budget and truncated the JSON; grounded triage doesn't need it.
      reasoning: { enabled: false },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status} for model ${model}: ${(await res.text()).slice(0, 300)}`);

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error(`OpenRouter returned no message content for model ${model}.`);
  return {
    content,
    model: data.model ?? model,
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
    costUsd: typeof data.usage?.cost === 'number' ? data.usage.cost : null,
  };
}
