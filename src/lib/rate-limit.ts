// shortcut: in-memory limiter is per serverless instance; move to Vercel KV/Upstash if the demo gets real traffic.
const recentRequests = new Map<string, number[]>();

export function allowRequest(request: Request, bucket: string, limitPerMinute: number): boolean {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (recentRequests.get(key) ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= limitPerMinute) return false;
  recentRequests.set(key, [...recent, now]);
  return true;
}
