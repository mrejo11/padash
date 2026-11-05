import { getStore } from '@netlify/blobs';
import { SqliteJsonStore } from './sqlite-storage';

export function storage() {
  const name=`padash-${process.env.PADASH_STORE_NAMESPACE || 'local'}-v1`;
  if(process.env.PADASH_STORAGE==='sqlite')return new SqliteJsonStore(process.env.PADASH_DATABASE_PATH||'',name);
  if(process.env.PADASH_STORAGE&&process.env.PADASH_STORAGE!=='netlify')throw new Error('Unsupported storage driver');
  return getStore({
    name,
    consistency: 'strong',
    fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(10000) }),
  });
}

type Visit = { id: string; at: number };

export async function readVersioned(store: ReturnType<typeof storage>, key: string) {
  const current = await store.getWithMetadata(key, { type: 'json' });
  if (!current || current.etag) return current;
  // The local Blobs emulator omits ETags from GET responses. Read its listed
  // version BEFORE rereading the value; concurrent changes then fail the CAS.
  const { blobs } = await store.list({ prefix: key });
  const etag = blobs.find(blob => blob.key === key)?.etag;
  if (!etag) throw new Error('Missing storage version');
  const data = await store.get(key, { type: 'json' });
  if (data === null) return null;
  return { data, etag, metadata: current.metadata };
}

// Compare-and-swap keeps the limit effective across concurrent function instances.
// Reusing an id does not consume another slot, so interrupted submissions can retry.
export async function reserveAttempt(key: string, id: string, limit: number, windowMs: number) {
  const store = storage();
  for (let attempt = 0; attempt < 20; attempt++) {
    const current = await readVersioned(store, key);
    const now = Date.now();
    const visits = ((current?.data || []) as Visit[]).filter(v => v.at > now - windowMs);
    if (visits.some(v => v.id === id)) return true;
    if (visits.length >= limit) return false;
    const result = await store.setJSON(key, [...visits, { id, at: now }],
      current?.etag ? { onlyIfMatch: current.etag } : { onlyIfNew: true });
    if (result.modified) return true;
  }
  throw new Error('Storage contention');
}
