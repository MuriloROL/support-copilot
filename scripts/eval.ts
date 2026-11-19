// Runs the copilot over the labeled tickets and writes src/data/eval-results.json (shown at /eval).
// Usage: npm run eval   (needs OPENROUTER_API_KEY in .env.local)
import { writeFileSync } from 'node:fs';
import { tickets } from '../src/data/tickets.ts';
import { answerTicket, searchKb } from '../src/lib/copilot.ts';

const rows = [];
const errors: { id: string; error: string }[] = [];
for (const ticket of tickets) {
  const retrieved = searchKb(ticket.text).map((hit) => hit.article.id);
  try {
    const result = await answerTicket(ticket.text);
    rows.push({
      id: ticket.id,
      text: ticket.text,
      expected: ticket.expected,
      expectedArticle: ticket.article ?? null,
      decision: result.decision,
      citations: result.citations,
      confidence: result.confidence,
      guardrail: result.guardrail,
      reply: result.reply,
      retrievalHit: ticket.article ? retrieved.includes(ticket.article) : null,
      decisionCorrect: result.decision === ticket.expected,
      citationCorrect: ticket.article && result.decision === 'answer' ? result.citations.includes(ticket.article) : null,
      latencyMs: result.usage.latencyMs,
      costUsd: result.usage.costUsd,
      model: result.usage.model,
    });
    console.log(`${ticket.id} ${result.decision === ticket.expected ? 'ok  ' : 'FAIL'} ${result.decision} ${result.guardrail ?? ''}`);
  } catch (error) {
    errors.push({ id: ticket.id, error: String(error) });
    console.log(`${ticket.id} ERROR ${error}`);
  }
}

const pct = (hits: number, total: number) => (total ? Math.round((hits / total) * 100) : 0);
const answerable = rows.filter((row) => row.retrievalHit !== null);
const answered = rows.filter((row) => row.citationCorrect !== null);
const costs = rows.map((row) => row.costUsd).filter((cost): cost is number => typeof cost === 'number');

const summary = {
  runAt: new Date().toISOString(),
  model: rows[0]?.model ?? null,
  tickets: tickets.length,
  errors: errors.length,
  retrievalHitRate: pct(answerable.filter((row) => row.retrievalHit).length, answerable.length),
  decisionAccuracy: pct(rows.filter((row) => row.decisionCorrect).length, rows.length),
  missedEscalations: rows.filter((row) => row.expected === 'escalate' && row.decision === 'answer').length,
  unnecessaryEscalations: rows.filter((row) => row.expected === 'answer' && row.decision === 'escalate').length,
  citationAccuracy: pct(answered.filter((row) => row.citationCorrect).length, answered.length),
  avgLatencyMs: Math.round(rows.reduce((sum, row) => sum + (row.latencyMs ?? 0), 0) / (rows.length || 1)),
  avgCostUsd: costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : null,
};

writeFileSync(new URL('../src/data/eval-results.json', import.meta.url), JSON.stringify({ summary, rows, errors }, null, 2) + '\n');
console.log(summary);
