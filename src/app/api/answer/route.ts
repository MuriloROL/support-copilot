import { answerTicket } from '@/lib/copilot.ts';
import { allowRequest, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit.ts';

const MAX_TICKET_LENGTH = 2000;

export async function POST(request: Request) {
  if (!allowRequest(request, 'answer')) {
    return Response.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Corpo da requisição precisa ser JSON.' }, { status: 400 });
  }
  const ticket = typeof (body as { ticket?: unknown })?.ticket === 'string' ? (body as { ticket: string }).ticket.trim() : '';
  if (ticket.length < 5 || ticket.length > MAX_TICKET_LENGTH) {
    return Response.json({ error: `O ticket precisa ter entre 5 e ${MAX_TICKET_LENGTH} caracteres.` }, { status: 400 });
  }

  try {
    return Response.json(await answerTicket(ticket));
  } catch (error) {
    console.error('answerTicket failed:', error);
    return Response.json({ error: 'Não consegui consultar o modelo agora. Tente novamente.' }, { status: 502 });
  }
}
