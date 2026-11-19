import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tickets } from '../data/tickets.ts';
import { answerTicket, HANDOFF_REPLY, parseModelAnswer, policyCheck, searchKb } from './copilot.ts';
import type { ChatCompletion } from './openrouter.ts';
import { tokenize } from './search.ts';

const fakeChat = (content: string) => async (): Promise<ChatCompletion> => ({
  content,
  model: 'fake',
  promptTokens: 1,
  completionTokens: 1,
  costUsd: 0,
});

const answer = (citations: string[], confidence = 0.9) =>
  JSON.stringify({ decision: 'answer', answer: 'Resposta.', citations, confidence, reason: 'ok', handoff_summary: '' });

test('tokenize strips accents, stopwords and stems by prefix', () => {
  assert.deepEqual(tokenize('Devolução do produto não chegou'), ['devol', 'produ', 'chego']);
});

test('every answerable eval ticket retrieves its expected article in the top 3', () => {
  for (const ticket of tickets.filter((t) => t.expected === 'answer')) {
    const ids = searchKb(ticket.text).map((hit) => hit.article.id);
    assert.ok(ids.includes(ticket.article!), `${ticket.id} got [${ids}] instead of ${ticket.article}`);
  }
});

test('policy rules catch legal, billing and data-deletion tickets only', () => {
  for (const id of ['e01', 'e02', 'e03']) assert.ok(policyCheck(tickets.find((t) => t.id === id)!.text), id);
  assert.equal(policyCheck('Quando o estorno do cartão aparece na fatura?'), null);
  assert.equal(policyCheck('Como funciona o processo de troca?'), null);
});

test('parseModelAnswer accepts fenced JSON and rejects malformed output', () => {
  assert.equal(parseModelAnswer('```json\n' + answer(['frete']) + '\n```')?.decision, 'answer');
  assert.equal(parseModelAnswer('not json'), null);
  assert.equal(parseModelAnswer(answer(['frete'], 1.5)), null);
  assert.equal(parseModelAnswer(JSON.stringify({ decision: 'maybe' })), null);
});

test('answerTicket answers when the model cites a retrieved article', async () => {
  const result = await answerTicket('O frete é grátis pra Salvador?', { chat: fakeChat(answer(['frete'])) });
  assert.equal(result.decision, 'answer');
  assert.equal(result.reply, 'Resposta.');
  assert.equal(result.guardrail, null);
});

test('answerTicket fails safe to a human on bad citations, low confidence, bad JSON or policy', async () => {
  const cases: [string, string][] = [
    ['O frete é grátis pra Salvador?', answer(['artigo-inventado'])],
    ['O frete é grátis pra Salvador?', answer(['frete'], 0.3)],
    ['O frete é grátis pra Salvador?', '{oops'],
    ['Vou no Procon se o frete não for grátis', answer(['frete'])],
  ];
  for (const [ticket, output] of cases) {
    const result = await answerTicket(ticket, { chat: fakeChat(output) });
    assert.equal(result.decision, 'escalate', output);
    assert.equal(result.reply, HANDOFF_REPLY);
    assert.ok(result.guardrail);
  }
});
