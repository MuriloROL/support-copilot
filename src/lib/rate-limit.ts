// Public demo runs on a shared API key: one call per endpoint every 10 minutes per IP.
const DEMO_LIMIT = 1;
const DEMO_WINDOW_MS = 10 * 60_000;

// shortcut: in-memory limiter is per serverless instance; move to Vercel KV/Upstash if the demo gets real traffic.
const recentRequests = new Map<string, number[]>();

export const RATE_LIMIT_MESSAGE = 'A demo permite 1 uso a cada 10 minutos. Tente de novo mais tarde.';

export function allowRequest(request: Request, bucket: string): boolean {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (recentRequests.get(key) ?? []).filter((time) => now - time < DEMO_WINDOW_MS);
  if (recent.length >= DEMO_LIMIT) return false;
  recentRequests.set(key, [...recent, now]);
  return true;
}
