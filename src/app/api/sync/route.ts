import { createSimulatedMarketplace } from '@/lib/channels/simulated.ts';
import { allowRequest } from '@/lib/rate-limit.ts';
import { createMemoryStore } from '@/lib/store.ts';
import { runSync } from '@/lib/sync.ts';

// Demo endpoint: runs one worker cycle over the fictional marketplace inbox. The real worker is scripts/worker.ts.
export async function POST(request: Request) {
  if (!allowRequest(request, 'sync', 3)) {
    return Response.json({ error: 'Muitas execuções seguidas. Tente de novo em um minuto.' }, { status: 429 });
  }
  try {
    // Fresh inbox and store per request, and no webhook: each click replays the same fictional cycle.
    const { channel } = createSimulatedMarketplace();
    return Response.json(await runSync({ channel, store: createMemoryStore(), notifyHuman: async () => {} }));
  } catch (error) {
    console.error('runSync failed:', error);
    return Response.json({ error: 'Não consegui rodar o ciclo agora. Tente novamente.' }, { status: 502 });
  }
}
