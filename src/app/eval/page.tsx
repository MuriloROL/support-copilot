import type { Metadata } from 'next';
import data from '@/data/eval-results.json';

export const metadata: Metadata = { title: 'Avaliação | Copiloto de Suporte' };

type EvalRow = {
  id: string;
  text: string;
  expected: 'answer' | 'escalate';
  expectedArticle: string | null;
  decision: 'answer' | 'escalate';
  citations: string[];
  guardrail: string | null;
  decisionCorrect: boolean;
  retrievalHit: boolean | null;
  citationCorrect: boolean | null;
};

type EvalResults = {
  summary: {
    runAt: string;
    model: string | null;
    tickets: number;
    errors: number;
    retrievalHitRate: number;
    decisionAccuracy: number;
    missedEscalations: number;
    unnecessaryEscalations: number;
    citationAccuracy: number;
    avgLatencyMs: number;
    avgCostUsd: number | null;
  } | null;
  rows: EvalRow[];
};

const results = data as EvalResults;
const LABEL = { answer: 'Responder', escalate: 'Humano' } as const;

export default function EvalPage() {
  const { summary, rows } = results;

  return (
    <div className="space-y-10">
      <div className="space-y-3 max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Avaliação offline</h1>
        <p className="text-neutral-400 leading-relaxed">
          Antes de mudar prompt, modelo ou busca, o copiloto roda contra tickets rotulados: quais devem ser respondidos
          (e com qual artigo) e quais precisam de um humano. O erro mais grave é responder o que deveria ir para um
          atendente.
        </p>
      </div>

      {!summary ? (
        <p className="rounded-lg border border-dashed border-neutral-800 p-8 text-sm text-neutral-500">
          Nenhuma avaliação executada ainda. Rode <code className="font-mono text-neutral-300">npm run eval</code>.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-px overflow-hidden rounded-lg border border-neutral-800 bg-neutral-800">
            <Metric label="Decisão correta" value={`${summary.decisionAccuracy}%`} hint={`${summary.tickets} tickets`} />
            <Metric label="Respondeu o que era de humano" value={String(summary.missedEscalations)} hint="o erro mais grave" />
            <Metric label="Humano sem necessidade" value={String(summary.unnecessaryEscalations)} hint="custo operacional" />
            <Metric label="Busca acertou o artigo" value={`${summary.retrievalHitRate}%`} hint="artigo esperado no top 3" />
            <Metric label="Citação correta" value={`${summary.citationAccuracy}%`} hint="nas respostas automáticas" />
            <Metric
              label="Latência média"
              value={`${(summary.avgLatencyMs / 1000).toFixed(1)} s`}
              hint={summary.avgCostUsd === null ? '' : `US$ ${summary.avgCostUsd.toFixed(5)} por ticket`}
            />
          </dl>
          <p className="text-xs font-mono text-neutral-500">
            {summary.model} · {new Date(summary.runAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
            {summary.errors > 0 && ` · ${summary.errors} erro(s) de execução`}
          </p>

          <div className="overflow-x-auto rounded-lg border border-neutral-800">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-neutral-500">
                <tr className="border-b border-neutral-800">
                  <th className="p-3 font-medium">Ticket</th>
                  <th className="p-3 font-medium">Esperado</th>
                  <th className="p-3 font-medium">Copiloto</th>
                  <th className="p-3 font-medium">Citou</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {rows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="p-3 text-neutral-300">
                      <span className="mr-2 font-mono text-xs text-neutral-600">{row.id}</span>
                      {row.text}
                      {row.guardrail && <span className="mt-1 block text-xs text-amber-300/80">{row.guardrail}</span>}
                    </td>
                    <td className="p-3 whitespace-nowrap text-neutral-400">{LABEL[row.expected]}</td>
                    <td className={`p-3 whitespace-nowrap ${row.decisionCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                      {row.decisionCorrect ? '✓' : '✗'} {LABEL[row.decision]}
                    </td>
                    <td className="p-3 font-mono text-xs text-neutral-500">{row.citations.join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-neutral-950 p-5 space-y-1">
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="text-2xl font-semibold tracking-tight">{value}</dd>
      {hint && <dd className="text-xs text-neutral-600">{hint}</dd>}
    </div>
  );
}
