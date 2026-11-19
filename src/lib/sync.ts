import type { Channel, InboundQuestion } from './channels/types.ts';
import { answerTicket, type CopilotResult } from './copilot.ts';
import type { ProcessedStore } from './store.ts';

export type Handoff = { channel: string; question: InboundQuestion; reason: string; summary: string };

export type SyncItem = {
  question: InboundQuestion;
  outcome: 'answered' | 'escalated' | 'failed';
  reply?: string;
  reason?: string;
  handoffSummary?: string;
  error?: string;
};

export type SyncReport = {
  channel: string;
  startedAt: string;
  durationMs: number;
  fetched: number;
  skipped: number;
  answered: number;
  escalated: number;
  failed: number;
  items: SyncItem[];
};

type SyncDeps = {
  channel: Channel;
  store: ProcessedStore;
  answer?: (ticket: string, channelRules: string) => Promise<CopilotResult>;
  notifyHuman?: (handoff: Handoff) => Promise<void>;
};

/** Posts the handoff to a chat webhook (Slack-compatible `{ text }`), or logs it when none is configured. */
export async function notifyHandoff(handoff: Handoff): Promise<void> {
  const text = `[${handoff.channel}] Pergunta ${handoff.question.id} precisa de um humano.\nMotivo: ${handoff.reason}\nResumo: ${handoff.summary}`;
  const url = process.env.HANDOFF_WEBHOOK_URL;
  if (!url) {
    console.log(text);
    return;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Handoff webhook returned ${res.status}`);
}

/** One polling cycle: fetch pending questions, answer what the help center covers, hand the rest to a human. */
export async function runSync({
  channel,
  store,
  answer = (ticket, channelRules) => answerTicket(ticket, { channelRules }),
  notifyHuman = notifyHandoff,
}: SyncDeps): Promise<SyncReport> {
  const startedAt = new Date();
  const pending = await channel.fetchPending();
  const fresh = pending.filter((question) => !store.has(`${channel.name}:${question.id}`));

  async function handle(question: InboundQuestion): Promise<SyncItem> {
    const key = `${channel.name}:${question.id}`;
    try {
      const ticket = question.item ? `Anúncio: ${question.item}\n${question.text}` : question.text;
      const result = await answer(ticket, channel.promptRules);
      const blocked = result.decision === 'answer' ? channel.checkReply(result.reply) : null;

      if (result.decision === 'answer' && !blocked) {
        await channel.reply(question, result.reply);
        store.add({ key, outcome: 'answered', at: new Date().toISOString() });
        return { question, outcome: 'answered', reply: result.reply, reason: result.reason };
      }

      const reason = blocked ?? result.reason;
      const summary = result.handoffSummary || question.text;
      await notifyHuman({ channel: channel.label, question, reason, summary });
      store.add({ key, outcome: 'escalated', at: new Date().toISOString() });
      return { question, outcome: 'escalated', reason, handoffSummary: summary };
    } catch (error) {
      // Not stored as processed, so the next cycle retries it.
      return { question, outcome: 'failed', error: error instanceof Error ? error.message : String(error) };
    }
  }

  const items = await Promise.all(fresh.map(handle));
  const count = (outcome: SyncItem['outcome']) => items.filter((item) => item.outcome === outcome).length;
  return {
    channel: channel.label,
    startedAt: startedAt.toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
    fetched: pending.length,
    skipped: pending.length - fresh.length,
    answered: count('answered'),
    escalated: count('escalated'),
    failed: count('failed'),
    items,
  };
}
