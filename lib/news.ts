import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { readVersioned, storage } from './storage';

export const newsPayload = z.object({
  title: z.string().trim().min(8).max(160), summary: z.string().trim().min(20).max(320),
  body: z.string().trim().min(80).max(20000),
  kind: z.enum(['news', 'event']), status: z.enum(['draft', 'published']),
  event_date: z.string().default('').refine(value => !value || /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(new Date(value + 'T12:00:00Z').getTime())
    && new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value),
}).strict().refine(value => value.kind !== 'event' || Boolean(value.event_date), { message: 'تاریخ رویداد را وارد کنید.' });
export type NewsFields = z.infer<typeof newsPayload>;
export type NewsRecord = NewsFields & {
  id: string; created_at: string; updated_at: string; published_at: string | null; revision: number;
};
export type PublicNews = Omit<NewsRecord, 'revision' | 'status'>;
export function publicNews(record: NewsRecord): PublicNews {
  const { revision: _revision, status: _status, ...visible } = record;
  return visible;
}
export async function listNews() {
  const store = storage();
  const { blobs } = await store.list({ prefix: 'news/' });
  const rows: NewsRecord[] = [];
  for (let i = 0; i < blobs.length; i += 20) {
    const batch = await Promise.all(blobs.slice(i, i + 20).map(blob => store.get(blob.key, { type: 'json' })));
    rows.push(...batch.filter((row): row is NewsRecord => Boolean(row)));
  }
  return rows.sort((a, b) => b.updated_at.localeCompare(a.updated_at) || a.id.localeCompare(b.id));
}
export async function listPublishedNews() {
  return (await listNews()).filter(row => row.status === 'published' && row.published_at)
    .sort((a, b) => b.published_at!.localeCompare(a.published_at!) || a.id.localeCompare(b.id)).map(publicNews);
}
export async function getPublishedNews(id: string) {
  if (!z.string().uuid().safeParse(id).success) return null;
  const row: NewsRecord | null = await storage().get('news/' + id, { type: 'json' });
  return row?.status === 'published' && row.published_at ? publicNews(row) : null;
}
export async function createNews(fields: NewsFields) {
  const now = new Date().toISOString();
  const row: NewsRecord = { ...fields, id: randomUUID(), created_at: now, updated_at: now,
    published_at: fields.status === 'published' ? now : null, revision: 0 };
  await storage().setJSON('news/' + row.id, row, { onlyIfNew: true });
  return row;
}
export async function updateNews(id: string, revision: number, fields: NewsFields) {
  const store = storage();
  const current = await readVersioned(store, 'news/' + id);
  if (!current) return { code: 'missing' as const };
  const row = current.data as NewsRecord;
  if (row.revision !== revision) return { code: 'conflict' as const };
  if (!current.etag) throw new Error('Missing news version');
  const next: NewsRecord = { ...row, ...fields, revision: revision + 1, updated_at: new Date().toISOString(),
    published_at: fields.status === 'published' ? row.published_at || new Date().toISOString() : row.published_at };
  const result = await store.setJSON('news/' + id, next, { onlyIfMatch: current.etag });
  return result.modified ? { code: 'ok' as const, row: next } : { code: 'conflict' as const };
}
