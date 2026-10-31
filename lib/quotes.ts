import { createHash } from 'node:crypto';
import type { z } from 'zod';
import { quotePayload } from './quote-validation';
import { storage, reserveAttempt, readVersioned } from './storage';

export type Quote = {
  id: string; token: string; name: string; company: string; phone: string;
  city: string; items: string; message: string; status: string; created_at: string;
};

export async function getQuote(token: string): Promise<Quote | null> {
  return storage().get(`quotes/${token.toLowerCase()}`, { type: 'json' });
}

export async function createQuote(data: z.infer<typeof quotePayload>, clientHash: string) {
  const token = data.requestId.toLowerCase();
  const existing = await getQuote(token);
  if (existing) return { quote: existing, created: false };
  if (!await reserveAttempt(`limits/quotes/${clientHash}`, token, 5, 86_400_000)) return null;
  const quote: Quote = {
    id: 'PD-' + createHash('sha256').update(token).digest('hex').slice(0, 12).toUpperCase(),
    token, name: data.name, company: data.company, phone: data.phone, city: data.city,
    items: JSON.stringify(data.items), message: data.message, status: 'new',
    created_at: new Date().toISOString(),
  };
  const result = await storage().setJSON(`quotes/${token}`, quote, { onlyIfNew: true });
  if (result.modified) return { quote, created: true };
  const saved = await getQuote(token);
  if (!saved) throw new Error('Quote unavailable after concurrent creation');
  return { quote: saved, created: false };
}

export async function listQuotes(page: number) {
  const store = storage();
  const { blobs } = await store.list({ prefix: 'quotes/' });
  const rows: Quote[] = [];
  // Bound parallel reads rather than issuing one request per quote at once.
  for (let i = 0; i < blobs.length; i += 20) {
    const batch = await Promise.all(blobs.slice(i, i + 20).map(b => store.get(b.key, { type: 'json' })));
    rows.push(...batch.filter((row): row is Quote => Boolean(row)));
  }
  rows.sort((a, b) => b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id));
  return { items: rows.slice((page - 1) * 30, page * 30), total: rows.length, page };
}

export async function updateQuoteStatus(token: string, status: string) {
  const store = storage();
  const key = `quotes/${token.toLowerCase()}`;
  for (let attempt = 0; attempt < 10; attempt++) {
    const current = await readVersioned(store, key);
    if (!current) return false;
    if (!current.etag) throw new Error('Missing storage version');
    const result = await store.setJSON(key, { ...current.data, status }, { onlyIfMatch: current.etag });
    if (result.modified) return true;
  }
  throw new Error('Storage contention');
}
