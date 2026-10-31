import { createHash } from 'node:crypto';
import { onNetlify } from './platform';

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(data, { status, headers: {
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers,
  } });
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    // Next can normalize request.url to localhost behind its HTTP server.
    // Use the incoming authority; trust forwarded hosts only on Netlify's proxy.
    const host = (onNetlify() && request.headers.get('x-forwarded-host'))
      || request.headers.get('host') || new URL(request.url).host;
    return ['http:', 'https:'].includes(parsed.protocol)
      && parsed.host === host.toLowerCase()
      && (!onNetlify() || parsed.protocol === 'https:');
  } catch { return false; }
}

export function clientHash(request: Request) {
  // Netlify sets this header at its edge. Do not trust arbitrary forwarded headers.
  const ip = onNetlify() ? request.headers.get('x-nf-client-connection-ip') || 'unknown' : 'local';
  return createHash('sha256').update('padash:' + ip).digest('hex');
}

export class BodyError extends Error {
  constructor(public status: number) { super('Invalid request body'); }
}

export async function readJson(request: Request, maxBytes: number): Promise<unknown> {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new BodyError(415);
  if (Number(request.headers.get('content-length')) > maxBytes) throw new BodyError(413);
  const reader = request.body?.getReader();
  if (!reader) throw new BodyError(400);
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) { await reader.cancel(); throw new BodyError(413); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new BodyError(400); }
}
