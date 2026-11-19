import type { Channel, InboundQuestion } from './types.ts';

const API_URL = 'https://api.mercadolibre.com';
// Assumption: not confirmed in the public docs; keeps answers short enough for the listing page.
const MAX_ANSWER_LENGTH = 2000;

export const MERCADO_LIVRE_RULES = `Canal: perguntas públicas de um anúncio no Mercado Livre. A resposta fica visível para todos os compradores.
Não mencione o site da loja, "Minha conta", links, e-mail, telefone, WhatsApp ou redes sociais, e não convide o cliente a negociar fora do Mercado Livre.
No Mercado Livre, o comprador acompanha o pedido, vê a nota fiscal e pede troca ou devolução em "Minhas compras". Quando um artigo citar um caminho do site da loja (como "Minha conta > Pedidos"), use "Minhas compras, no Mercado Livre" no lugar.
Perguntas sobre especificações do produto que os artigos não cobrem devem ser encaminhadas (escalate).`;

const FORBIDDEN_CONTENT: { pattern: RegExp; label: string }[] = [
  { pattern: /https?:\/\/|www\.|\.com\b|\.com\.br\b/i, label: 'link' },
  { pattern: /[\w.+-]+@[\w-]+\.[\w.]+/, label: 'e-mail' },
  { pattern: /\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/, label: 'telefone' },
  { pattern: /whats ?app|instagram|telegram|minha conta/i, label: 'contato ou canal fora do Mercado Livre' },
];

/** Mercado Livre answers are public and can't carry contact info; enforced in code, not just in the prompt. */
export function checkMercadoLivreReply(text: string): string | null {
  if (text.length > MAX_ANSWER_LENGTH) return `Regra do canal: a resposta passa de ${MAX_ANSWER_LENGTH} caracteres.`;
  const hit = FORBIDDEN_CONTENT.find((rule) => rule.pattern.test(text));
  return hit ? `Regra do Mercado Livre: a resposta não pode conter ${hit.label}.` : null;
}

type MercadoLivreQuestion = { id: number; text: string; status: string; item_id?: string; date_created: string; from?: { id?: number } };

export function createMercadoLivreChannel(config: { accessToken: string; sellerId: string; fetchImpl?: typeof fetch }): Channel {
  const fetchImpl = config.fetchImpl ?? fetch;

  async function api(path: string, init?: RequestInit) {
    const res = await fetchImpl(`${API_URL}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${config.accessToken}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });
    // shortcut: no refresh-token rotation (tokens last 6h, refresh tokens are single use); add a persisted token store before running unattended.
    if (res.status === 401) throw new Error('Mercado Livre rejected the access token (401). Tokens last 6 hours: refresh it and update ML_ACCESS_TOKEN.');
    if (!res.ok) throw new Error(`Mercado Livre ${res.status} on ${path}: ${(await res.text()).slice(0, 200)}`);
    return res.json();
  }

  return {
    name: 'mercadolivre',
    label: 'Mercado Livre',
    promptRules: MERCADO_LIVRE_RULES,
    checkReply: checkMercadoLivreReply,
    async fetchPending(): Promise<InboundQuestion[]> {
      // shortcut: first page only; paginate with offset/limit if a seller gets more questions than one page per cycle.
      const data = await api(`/questions/search?seller_id=${encodeURIComponent(config.sellerId)}&api_version=4`);
      const questions: MercadoLivreQuestion[] = data.questions ?? [];
      // Filtered here because the docs don't confirm a status query parameter.
      return questions
        .filter((question) => question.status === 'UNANSWERED')
        .map((question) => ({
          id: String(question.id),
          text: question.text,
          item: question.item_id ?? null,
          customer: String(question.from?.id ?? 'desconhecido'),
          receivedAt: question.date_created,
        }));
    },
    async reply(question, text) {
      await api('/answers', { method: 'POST', body: JSON.stringify({ question_id: Number(question.id), text }) });
    },
  };
}

export function createMercadoLivreChannelFromEnv(): Channel {
  const accessToken = process.env.ML_ACCESS_TOKEN;
  const sellerId = process.env.ML_SELLER_ID;
  if (!accessToken || !sellerId) throw new Error('CHANNEL=mercadolivre needs ML_ACCESS_TOKEN and ML_SELLER_ID (see .env.example).');
  return createMercadoLivreChannel({ accessToken, sellerId });
}
