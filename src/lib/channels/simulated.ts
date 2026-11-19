import { checkMercadoLivreReply, MERCADO_LIVRE_RULES } from './mercadolivre.ts';
import type { Channel, InboundQuestion } from './types.ts';

// Fictional listing questions in the Mercado Livre format, so the demo runs without a seller account.
export const SIMULATED_QUESTIONS: InboundQuestion[] = [
  { id: '9001', item: 'Air Fryer Orion 4L Digital', customer: 'compradora_ana', receivedAt: '2026-11-19T08:12:00-03:00', text: 'Se eu receber e não gostar, posso devolver?' },
  { id: '9002', item: 'Cafeteira Expresso Orion Barista', customer: 'joao.m', receivedAt: '2026-11-19T08:40:00-03:00', text: 'Vocês emitem nota fiscal?' },
  { id: '9003', item: 'Smart TV Orion 50" 4K', customer: 'lucas_tv', receivedAt: '2026-11-19T09:05:00-03:00', text: 'Qual é a garantia dessa TV?' },
  { id: '9004', item: 'Liquidificador Orion Turbo 1200W', customer: 'mari_cozinha', receivedAt: '2026-11-19T09:31:00-03:00', text: 'Se vier na voltagem errada vocês trocam?' },
  { id: '9005', item: 'Fone Bluetooth Orion Pulse', customer: 'pedro.s', receivedAt: '2026-11-19T09:47:00-03:00', text: 'Ele funciona com iPhone 15? Tem cancelamento de ruído?' },
  { id: '9006', item: 'Aspirador Robô Orion Clean', customer: 'carla_r', receivedAt: '2026-11-19T10:02:00-03:00', text: 'Me passa seu WhatsApp que eu fecho direto com desconto.' },
  { id: '9007', item: 'Smart TV Orion 50" 4K', customer: 'roberto_99', receivedAt: '2026-11-19T10:15:00-03:00', text: 'Comprei, veio com defeito e ninguém me responde. Vou abrir reclamação no Procon.' },
];

/** In-memory marketplace that follows Mercado Livre's rules: escalated questions stay pending for a human. */
export function createSimulatedMarketplace(questions: InboundQuestion[] = SIMULATED_QUESTIONS) {
  const published = new Map<string, string>();
  const channel: Channel = {
    name: 'marketplace-simulado',
    label: 'Marketplace simulado (formato Mercado Livre)',
    promptRules: MERCADO_LIVRE_RULES,
    checkReply: checkMercadoLivreReply,
    async fetchPending() {
      return questions.filter((question) => !published.has(question.id));
    },
    async reply(question, text) {
      published.set(question.id, text);
    },
  };
  return { channel, published };
}
