import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkMercadoLivreReply, createMercadoLivreChannel } from './channels/mercadolivre.ts';
import { createSimulatedMarketplace } from './channels/simulated.ts';
import type { InboundQuestion } from './channels/types.ts';
import type { CopilotResult } from './copilot.ts';
import { createMemoryStore } from './store.ts';
import { runSync, type Handoff } from './sync.ts';

const question = (id: string, text: string): InboundQuestion => ({ id, text, item: 'Produto', customer: 'c', receivedAt: '2026-11-19T10:00:00Z' });

const result = (decision: 'answer' | 'escalate', reply = 'Sim, aceitamos devolução em até 7 dias.'): CopilotResult => ({
  decision,
  reply,
  citations: [],
  confidence: 0.9,
  reason: 'motivo',
  guardrail: null,
  handoffSummary: decision === 'escalate' ? 'resumo' : '',
  sources: [],
  usage: { model: 'fake', latencyMs: 0, promptTokens: 0, completionTokens: 0, costUsd: 0 },
});

test('a cycle publishes answers, hands off the rest, and never handles a question twice', async () => {
  const { channel, published } = createSimulatedMarketplace([question('1', 'devolução?'), question('2', 'é compatível com iPhone?')]);
  const store = createMemoryStore();
  const handoffs: Handoff[] = [];
  let calls = 0;
  const deps = {
    channel,
    store,
    answer: async (ticket: string) => (calls++, result(ticket.includes('iPhone') ? 'escalate' : 'answer')),
    notifyHuman: async (handoff: Handoff) => void handoffs.push(handoff),
  };

  const first = await runSync(deps);
  assert.equal(first.answered, 1);
  assert.equal(first.escalated, 1);
  assert.equal(published.get('1'), 'Sim, aceitamos devolução em até 7 dias.');
  assert.equal(published.has('2'), false); // stays pending on the channel for the human
  assert.equal(handoffs[0].question.id, '2');

  const second = await runSync(deps);
  assert.equal(second.fetched, 1);
  assert.equal(second.skipped, 1);
  assert.equal(calls, 2);
});

test('a reply that breaks the channel rules is handed off instead of published', async () => {
  const { channel, published } = createSimulatedMarketplace([question('1', 'tem desconto?')]);
  const report = await runSync({
    channel,
    store: createMemoryStore(),
    answer: async () => result('answer', 'Chama no WhatsApp (11) 98765-4321 que eu te passo.'),
    notifyHuman: async () => {},
  });
  assert.equal(report.items[0].outcome, 'escalated');
  assert.match(report.items[0].reason!, /Mercado Livre/);
  assert.equal(published.size, 0);
});

test('one failing question does not stop the cycle and is retried next time', async () => {
  const { channel } = createSimulatedMarketplace([question('1', 'ok'), question('2', 'boom')]);
  const store = createMemoryStore();
  let failNext = true;
  const deps = {
    channel,
    store,
    answer: async (ticket: string) => {
      if (ticket.includes('boom') && failNext) throw new Error('LLM timeout');
      return result('answer');
    },
    notifyHuman: async () => {},
  };
  const first = await runSync(deps);
  assert.deepEqual([first.answered, first.failed], [1, 1]);
  failNext = false;
  const second = await runSync(deps);
  assert.deepEqual([second.fetched, second.answered], [1, 1]);
});

test('Mercado Livre reply check blocks contact info without false positives on prices', () => {
  assert.equal(checkMercadoLivreReply('Parcelamos em até 10x de R$ 149,90, e a garantia é de 12 meses.'), null);
  for (const text of ['Veja em www.bazarorion.com.br', 'Escreve pra vendas@bazarorion.com', 'Liga (11) 98765-4321', 'Chama no whatsapp']) {
    assert.ok(checkMercadoLivreReply(text), text);
  }
});

test('Mercado Livre connector reads unanswered questions and posts answers in the API format', async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const body = url.includes('/questions/search')
      ? { questions: [
          { id: 11, text: 'Tem garantia?', status: 'UNANSWERED', item_id: 'MLB1', date_created: '2026-11-19T10:00:00Z', from: { id: 7 } },
          { id: 12, text: 'Já respondida', status: 'ANSWERED', item_id: 'MLB1', date_created: '2026-11-18T10:00:00Z', from: { id: 8 } },
        ] }
      : {};
    return new Response(JSON.stringify(body), { status: 200 });
  }) as typeof fetch;

  const channel = createMercadoLivreChannel({ accessToken: 'token', sellerId: '123', fetchImpl });
  const pending = await channel.fetchPending();
  assert.deepEqual(pending.map((q) => [q.id, q.item, q.customer]), [['11', 'MLB1', '7']]);
  assert.match(calls[0].url, /\/questions\/search\?seller_id=123&api_version=4$/);

  await channel.reply(pending[0], 'Sim, 12 meses.');
  assert.match(calls[1].url, /\/answers$/);
  assert.deepEqual(JSON.parse(String(calls[1].init?.body)), { question_id: 11, text: 'Sim, 12 meses.' });
});
