import { createHash } from 'node:crypto';
import type { z } from 'zod';
import { quotePayload } from './quote-validation';
import { storage, reserveAttempt, readVersioned } from './storage';
import { filterQuotes, managementStats, type Quote, type ManagementFilters, type QuoteStatus } from './management-model';

export type { Quote } from './management-model';

export async function getQuote(token: string): Promise<Quote | null> {
  return storage().get(`quotes/${token.toLowerCase()}`, { type: 'json' });
}

export async function createQuote(data: z.infer<typeof quotePayload>, clientHash: string) {
  const token = data.requestId.toLowerCase();
  const existing = await getQuote(token);
  if (existing) return { quote: existing, created: false };
  if (process.env.PADASH_STORAGE === 'sqlite'
    && !await reserveAttempt('limits/quotes/service', token, 100, 60_000)) return null;
  if (!await reserveAttempt(`limits/quotes/${clientHash}`, token, 5, 86_400_000)) return null;
  const quote: Quote = {
    id: 'PD-' + createHash('sha256').update(token).digest('hex').slice(0, 12).toUpperCase(),
    token, name: data.name, company: data.company, phone: data.phone, city: data.city,
    items: JSON.stringify(data.items), message: data.message, status: 'new',
    created_at: new Date().toISOString(), kind: data.kind || (data.items.length ? 'order' : 'consultation'),
    revision: 0, internal_note: '', assignee: '', follow_up_date: '', history: [],
  };
  const result = await storage().setJSON(`quotes/${token}`, quote, { onlyIfNew: true });
  if (result.modified) return { quote, created: true };
  const saved = await getQuote(token);
  if (!saved) throw new Error('Quote unavailable after concurrent creation');
  return { quote: saved, created: false };
}

export async function allQuotes() {
  const store = storage();
  const { blobs } = await store.list({ prefix: 'quotes/' });
  const rows: Quote[] = [];
  // Bound parallel reads rather than issuing one request per quote at once.
  for (let i = 0; i < blobs.length; i += 20) {
    const batch = await Promise.all(blobs.slice(i, i + 20).map(b => store.get(b.key, { type: 'json' })));
    rows.push(...batch.filter((row): row is Quote => Boolean(row)));
  }
  rows.sort((a, b) => b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id));
  return rows;
}

export async function listQuotes(page: number, filters: ManagementFilters) {
  const rows = await allQuotes();
  const filtered = filterQuotes(rows, filters);
  const pageSize = 20;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  return { items: filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    total: filtered.length, page: currentPage, pageSize, stats: managementStats(rows) };
}

export type QuoteUpdate = {
  token: string; revision: number; status?: QuoteStatus; internal_note?: string;
  assignee?: string; follow_up_date?: string;
};

export async function updateQuote(update: QuoteUpdate) {
  const store = storage();
  const key = `quotes/${update.token.toLowerCase()}`;
  for (let attempt = 0; attempt < 10; attempt++) {
    const current = await readVersioned(store, key);
    if (!current) return { code: 'missing' as const };
    if (!current.etag) throw new Error('Missing storage version');
    const quote = current.data as Quote;
    if ((quote.revision || 0) !== update.revision) return { code: 'conflict' as const };
    const changes: string[] = [];
    const next = { ...quote };
    for (const field of ['status', 'internal_note', 'assignee', 'follow_up_date'] as const) {
      const value = update[field];
      if (value === undefined || value === (quote[field] || '')) continue;
      Object.assign(next, { [field]: value });
      changes.push(field);
    }
    if (!changes.length) return { code: 'ok' as const, quote };
    next.revision = (quote.revision || 0) + 1;
    next.updated_at = new Date().toISOString();
    next.history = [...(quote.history || []), { at: next.updated_at, changes: changes.map(field =>
      field === 'status' ? `status:${quote.status}:${next.status}` : field) }].slice(-100);
    const result = await store.setJSON(key, next, { onlyIfMatch: current.etag });
    if (result.modified) return { code: 'ok' as const, quote: next };
  }
  throw new Error('Storage contention');
}
