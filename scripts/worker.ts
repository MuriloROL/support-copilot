// Polls a sales channel, answers what the help center covers and hands the rest to a human.
// Usage: npm run worker            loop every SYNC_INTERVAL_MINUTES (default 5)
//        npm run worker -- --once  single cycle, for system cron or a Kubernetes CronJob
// CHANNEL=mercadolivre uses the real Mercado Livre API; anything else uses the simulated marketplace.
import { createMercadoLivreChannelFromEnv } from '../src/lib/channels/mercadolivre.ts';
import { createSimulatedMarketplace } from '../src/lib/channels/simulated.ts';
import { createFileStore } from '../src/lib/store.ts';
import { runSync } from '../src/lib/sync.ts';

const channel = process.env.CHANNEL === 'mercadolivre' ? createMercadoLivreChannelFromEnv() : createSimulatedMarketplace().channel;
const store = createFileStore(new URL('../data/processed.json', import.meta.url).pathname);
const intervalMs = Number(process.env.SYNC_INTERVAL_MINUTES || 5) * 60_000;
const once = process.argv.includes('--once');

let running = false;
let stopping = false;
const stop = () => {
  if (!running) process.exit(0);
  stopping = true;
  console.log('Finishing the current cycle before stopping…');
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

async function cycle() {
  running = true;
  try {
    const report = await runSync({ channel, store });
    console.log(
      `[${report.startedAt}] ${report.channel}: ${report.fetched} pending, ${report.skipped} already handled, ` +
        `${report.answered} answered, ${report.escalated} handed off, ${report.failed} failed (${report.durationMs} ms)`,
    );
    for (const item of report.items.filter((item) => item.outcome === 'failed')) {
      console.error(`  question ${item.question.id} failed, will retry next cycle: ${item.error}`);
    }
  } catch (error) {
    console.error('Sync cycle failed:', error);
    process.exitCode = 1;
  } finally {
    running = false;
  }
}

console.log(`Worker started on ${channel.label}${once ? ' (single cycle)' : `, every ${intervalMs / 60_000} min`}.`);
do {
  await cycle();
  if (once || stopping) break;
  await new Promise((resolve) => setTimeout(resolve, intervalMs));
} while (!stopping);
