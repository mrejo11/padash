// Explicit, read-only import of the partner's public catalogue and unmodified images.
// Run manually: node scripts/import-products.mjs. It does not publish or set prices/stock.
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const origin = 'https://vananeh.com';
const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(new Date());
async function get(path) {
  const url = new URL(path, origin);
  if (url.origin !== origin) throw new Error('Unexpected source origin');
  const response = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { Accept: 'application/json, image/*, text/html, text/xml' } });
  if (!response.ok) throw new Error(`Source returned ${response.status}: ${url.pathname}`);
  if (new URL(response.url).origin !== origin) throw new Error('Unexpected source redirect');
  return response;
}

await mkdir('.sites-runtime/catalog-import', { recursive: true });
const first = await get('/wp-json/wc/store/v1/products?per_page=100&page=1');
const count = Number(first.headers.get('x-wp-total'));
const pages = Number(first.headers.get('x-wp-totalpages'));
if (!Number.isInteger(count) || count < 1 || count > 500 || !Number.isInteger(pages) || pages < 1 || pages > 5) throw new Error('Unexpected catalogue size');
const records = await first.json();
for (let page = 2; page <= pages; page++) records.push(...await (await get(`/wp-json/wc/store/v1/products?per_page=100&page=${page}`)).json());
if (records.length !== count || new Set(records.map(record => record.id)).size !== count) throw new Error('Incomplete or duplicate catalogue');
await writeFile('.sites-runtime/catalog-import/products.json', JSON.stringify(records, null, 2));
const sitemap = await (await get('/product-sitemap.xml')).text();
await writeFile('.sites-runtime/catalog-import/product-sitemap.xml', sitemap);
const sitemapProducts = [...sitemap.matchAll(/<loc>([^<]+\/product\/[^<]+)<\/loc>/g)].map(match => decodeURI(match[1]));
if (sitemapProducts.length !== count || records.some(record => !sitemapProducts.includes(decodeURI(record.permalink)))) throw new Error('Store and sitemap disagree; review manually');
const shop = await (await get('/%D9%81%D8%B1%D9%88%D8%B4%DA%AF%D8%A7%D9%87/')).text();
await writeFile('.sites-runtime/catalog-import/shop.html', shop);
const directory = 'public/images/products';
await mkdir(directory, { recursive: true });
const imported = [];
for (const record of records) {
  if (!Number.isSafeInteger(record.id) || typeof record.name !== 'string' || record.name.length > 180 || !Array.isArray(record.images) || record.images.length > 20) throw new Error('Unexpected product');
  const sourceUrl = new URL(record.permalink);
  if (sourceUrl.origin !== origin || !sourceUrl.pathname.startsWith('/product/')) throw new Error('Unexpected product link');
  const images = [];
  for (const image of record.images) {
    if (!Number.isSafeInteger(image.id)) throw new Error('Unexpected image ID');
    const response = await get(image.src);
    const type = response.headers.get('content-type')?.split(';')[0];
    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[type];
    if (!extension) throw new Error('Unsupported image type');
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 10_000_000) throw new Error('Image too large');
    const { width, height } = await sharp(bytes).metadata();
    if (!width || !height) throw new Error('Invalid image dimensions');
    const file = `${record.id}-${image.id}.${extension}`;
    await writeFile(`${directory}/${file}`, bytes);
    images.push({ id: image.id, src: '/images/products/' + file, width, height, sourceUrl: image.src,
      sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  imported.push({ id: record.id, name: record.name, url: record.permalink, images });
  console.log(`Imported ${record.id}: ${images.length} images`);
}
await writeFile('docs/catalog-source.json', JSON.stringify({ source: origin, checkedAt: date, count, products: imported }, null, 2) + '\n');
// Only neutral local image metadata enters the deployed application.
await writeFile('lib/product-images.json', JSON.stringify({ count, products: imported.map(({id,images})=>({id,images:images.map(({src,width,height})=>({src,width,height}))})) }, null, 2) + '\n');
console.log(`Complete: ${count} products; API pagination and product sitemap agree. Images retained unchanged.`);
