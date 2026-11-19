'use client';

import { useState } from 'react';
import { SIMULATED_QUESTIONS } from '@/lib/channels/simulated.ts';
import type { SyncItem, SyncReport } from '@/lib/sync.ts';

const FLOW = [
  ['A cada 5 min', 'O worker busca as perguntas sem resposta: GET /questions/search do Mercado Livre.'],
  ['Copiloto', 'Cada pergunta passa pela mesma triagem do atendimento, com as regras do canal no prompt.'],
  ['Regras do canal', 'A resposta é pública: link, e-mail, telefone ou WhatsApp bloqueiam a publicação.'],
  ['Publica ou encaminha', 'POST /answers no anúncio, ou aviso no Slack para um atendente responder.'],
] as const;

const BADGE: Record<SyncItem['outcome'], { label: string; className: string }> = {
  answered: { label: 'Respondida', className: 'bg-emerald-500/10 text-emerald-300' },
  escalated: { label: 'Encaminhada para humano', className: 'bg-amber-500/10 text-amber-300' },
  failed: { label: 'Falhou, tenta no próximo ciclo', className: 'bg-red-500/10 text-red-300' },
};

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

export default function MarketplacePage() {
  const [report, setReport] = useState<SyncReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const itemById = new Map(report?.items.map((item) => [item.question.id, item]));

  async function runCycle() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro inesperado.');
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-7 space-y-3">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Respostas automáticas no marketplace</h1>
          <p className="text-neutral-400 leading-relaxed">
            Em produção, um worker roda num servidor a cada 5 minutos, lê as perguntas dos anúncios no Mercado Livre,
            responde o que a central de ajuda cobre e encaminha o resto para um atendente. Aqui a caixa de perguntas é
            simulada, no mesmo formato da API do Mercado Livre, e cada clique roda um ciclo do worker.
          </p>
        </div>
        <ol className="lg:col-span-5 space-y-3 text-sm">
          {FLOW.map(([title, text], index) => (
            <li key={title} className="flex gap-3">
              <span className="font-mono text-neutral-600">0{index + 1}</span>
              <span className="text-neutral-400">
                <span className="text-white">{title}.</span> {text}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-y border-neutral-900 py-5">
        <button
          type="button"
          onClick={runCycle}
          disabled={loading}
          className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        >
          {loading ? 'Rodando ciclo…' : 'Rodar um ciclo do worker'}
        </button>
        <p className="text-sm text-neutral-500" aria-live="polite">
          {error ? (
            <span className="text-red-300">{error}</span>
          ) : report ? (
            `${report.fetched} perguntas pendentes · ${report.answered} respondidas · ${report.escalated} encaminhadas · ${report.failed} falhas · ${(report.durationMs / 1000).toFixed(1)} s`
          ) : (
            `${SIMULATED_QUESTIONS.length} perguntas aguardando resposta.`
          )}
        </p>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SIMULATED_QUESTIONS.map((question) => {
          const item = itemById.get(question.id);
          const badge = item ? BADGE[item.outcome] : { label: 'Pendente', className: 'bg-neutral-800 text-neutral-400' };
          return (
            <li key={question.id} className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs text-neutral-500">{question.item}</p>
                  <p className="mt-1 leading-relaxed">{question.text}</p>
                </div>
                <span className="shrink-0 font-mono text-xs text-neutral-600">{formatTime(question.receivedAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-neutral-600">{question.customer}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>{badge.label}</span>
              </div>
              {item?.outcome === 'answered' && (
                <p className="border-l-2 border-emerald-500/40 pl-3 text-sm leading-relaxed text-neutral-300">{item.reply}</p>
              )}
              {item?.outcome === 'escalated' && (
                <div className="space-y-1 border-l-2 border-amber-500/40 pl-3 text-sm leading-relaxed">
                  <p className="text-neutral-300">{item.handoffSummary}</p>
                  <p className="text-xs text-amber-300/80">{item.reason}</p>
                </div>
              )}
              {item?.outcome === 'failed' && <p className="text-xs text-red-300">{item.error}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
