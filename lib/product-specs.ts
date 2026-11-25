import { randomUUID } from 'node:crypto';
import { unstable_cache } from 'next/cache';
import { z } from 'zod';
import type { Product } from './catalog';
import { MAX_DATASHEET_BYTES, productFieldKeys, type ProductSpecFields, type ProductSpecForm } from './product-spec-fields';
import { readVersioned, storage } from './storage';

const sourceUrl = z.string().trim().max(600).refine(value => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch { return false; }
});

export const specificationInput = z.object({
  revision: z.number().int().nonnegative().nullable(),
  status: z.enum(['draft', 'published']),
  source: z.string().trim().max(400),
  sourceUrl,
  manufacturer: z.string().trim().max(90),
  model: z.string().trim().max(90),
  values: z.record(z.string().max(40), z.object({
    value: z.string().trim().min(1).max(200),
    unit: z.string().trim().max(32),
  }).strict()),
  removeDatasheet: z.boolean(),
}).strict();

type SavedSpecs = ProductSpecFields & { revision: number; datasheetKey: string | null };
const specKey = (id: string) => 'product-specs/v1/' + id;
export const productSpecTag = (id: string) => (process.env.PADASH_STORE_NAMESPACE || 'local') + '/' + specKey(id);

export async function getProductSpecs(id: string, timeoutMs?: number): Promise<SavedSpecs | null> {
  return storage(timeoutMs).get(specKey(id), { type: 'json' });
}

export function specForm(saved: SavedSpecs): ProductSpecForm {
  const { datasheetKey, ...fields } = saved;
  return { ...fields, hasDatasheet: Boolean(datasheetKey) };
}

export async function publicProductSpecs(id: string) {
  try {
    return await unstable_cache(async () => {
      const specs = await getProductSpecs(id, 1500);
      return specs?.status === 'published' ? specForm(specs) : null;
    }, [productSpecTag(id)], { tags: [productSpecTag(id)], revalidate: 300 })();
  } catch {
    return null;
  }
}

export function isDatasheet(bytes: Uint8Array) {
  return bytes.byteLength <= MAX_DATASHEET_BYTES
    && /^%PDF-[12]\.\d/.test(Buffer.from(bytes.subarray(0, 16)).toString('ascii'))
    && /%%EOF\s*$/.test(Buffer.from(bytes.subarray(-1024)).toString('ascii'));
}

export async function saveProductSpecs(product: Product, input: z.infer<typeof specificationInput>, file?: Uint8Array) {
  const { revision, removeDatasheet, ...fields } = input;
  const allowed = new Set(productFieldKeys(product.category));
  if (Object.keys(fields.values).some(key => !allowed.has(key)) || (removeDatasheet && file)) {
    return { code: 'invalid' as const };
  }

  const store = storage();
  const key = specKey(product.id);
  const current = await readVersioned(store, key);
  const previous = current?.data as SavedSpecs | undefined;
  if ((previous?.revision ?? null) !== revision) return { code: 'conflict' as const };
  if (current && !current.etag) throw new Error('Missing specification version');

  const oldFile = removeDatasheet ? null : previous?.datasheetKey ?? null;
  const hasContent = Object.keys(fields.values).length > 0 || Boolean(fields.manufacturer || fields.model || file || oldFile);
  if (fields.status === 'published' && (!fields.source || !hasContent)) return { code: 'invalid' as const };

  // Each upload is immutable. Concurrent edits only publish the file referenced by the winning record.
  const newFile = file ? 'datasheets/v1/' + product.id + '/' + randomUUID() : null;
  if (file && newFile) await store.set(newFile, Uint8Array.from(file).buffer, { onlyIfNew: true });
  const next: SavedSpecs = { ...fields, revision: (revision ?? -1) + 1, datasheetKey: newFile ?? oldFile };
  const result = await store.setJSON(key, next, current?.etag ? { onlyIfMatch: current.etag } : { onlyIfNew: true });
  if (!result.modified) {
    if (newFile) await store.delete(newFile).catch(() => undefined);
    return { code: 'conflict' as const };
  }
  return { code: 'ok' as const, specs: specForm(next) };
}

export async function getPublicDatasheet(id: string) {
  const specs = await getProductSpecs(id);
  if (specs?.status !== 'published' || !specs.datasheetKey) return null;
  return storage().get(specs.datasheetKey, { type: 'arrayBuffer' });
}
