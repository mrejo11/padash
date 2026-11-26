import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { startLocalBlobs } from './local-blobs.mjs';
import { getStore } from '@netlify/blobs';
import { auditSeo } from './test-seo.mjs';

await mkdir('.sites-runtime', { recursive: true });
const directory = await mkdtemp(resolve('.sites-runtime/integration-'));
const storageToken = randomBytes(32).toString('hex');
const password = randomBytes(32).toString('base64url');
const blobs = await startLocalBlobs({ directory, token: storageToken });
const portProbe = createServer();
portProbe.listen(0, '127.0.0.1');
await once(portProbe, 'listening');
const port = portProbe.address().port;
await new Promise(resolve => portProbe.close(resolve));
const origin = `http://127.0.0.1:${port}`;
let child;
let logs = '';
let blobsStopped = false;
async function start(adminPassword = password, hosted = false, vercel = false) {
  child = spawn(process.execPath, [resolve('node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'production', NETLIFY: '', VERCEL:vercel?'1':'', PADASH_LOCAL_RUNTIME:'1', SALES_ADMIN_PASSWORD: adminPassword,
      SITE_ID: hosted ? 'integration' : '', SITE_NAME: hosted ? 'integration' : '',
      NETLIFY_BLOBS_CONTEXT: Buffer.from(JSON.stringify(blobs.context)).toString('base64') },
  });
  child.stdout.on('data', data => { logs += data; if (process.env.DEBUG_TESTS) process.stdout.write(data); });
  child.stderr.on('data', data => { logs += data; if (process.env.DEBUG_TESTS) process.stderr.write(data); });
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null) throw new Error('Server exited: ' + logs);
    try { if ((await fetch(origin)).ok) return; } catch {}
    await delay(250);
  }
  throw new Error('Server startup timed out: ' + logs);
}
async function stop() {
  if (!child || child.exitCode !== null) return;
  const exited = once(child, 'exit');
  child.kill();
  await exited;
}
const request = (path, options = {}) => fetch(origin + path, { signal: AbortSignal.timeout(15000), ...options });
const send = (path, body, options = {}) => request(path, {
  method: options.method || 'POST', body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json', Origin: origin, ...options.headers },
});
const payload = () => ({ requestId: randomUUID(), name: 'Private Test Customer', company: 'Test Company',
  phone: '09121234567', city: 'تهران', items: [], message: 'Private project request for insulation', consent: 'yes' });
try {
  await start();
  console.log('Checking pages and input validation...');
  assert.equal((await request('/')).status, 200);
  assert.equal((await request('/management')).status, 200);
  assert.equal((await request('/request/not-a-token')).status, 404);
  const calculatorPage = await (await request('/calculator')).text();
  assert(calculatorPage.includes('بررسی و استعلام این برآورد'), 'a valid calculator result offers a review before adding to the quote');
  assert(calculatorPage.includes('۱۴۰ مترمربع'), 'the default 14 rolls transfer as 140 square metres, matching the catalogue order unit');
  const incompleteEstimate = await (await request('/calculator?product=eps-sheet')).text();
  assert(!incompleteEstimate.includes('بررسی و استعلام این برآورد'), 'missing sheet dimensions cannot create a quote draft');
  assert.equal((await request('/api/management', { headers: { 'oai-authenticated-user-email': 'admin@example.com' } })).status, 401);
  assert.equal((await send('/api/quotes', payload(), { headers: { Origin: 'https://other.example' } })).status, 403);
  assert.equal((await send('/api/quotes', {})).status, 400);
  assert.equal((await send('/api/quotes', { ...payload(), website: 'spam' })).status, 400);
  assert.equal((await send('/api/quotes', { ...payload(), message: 'x'.repeat(17000) })).status, 413);
  assert.equal((await send('/api/quotes', { ...payload(), kind: 'order' })).status, 400, 'orders require items');
  assert.equal((await send('/api/quotes', { ...payload(), kind: 'consultation', message: 'short' })).status, 400);
  assert.equal((await request('/api/management?format=csv')).status, 401, 'export requires authentication');

  const data = payload();
  console.log('Checking concurrent submissions...');
  const duplicateResponses = await Promise.all(Array.from({ length: 4 }, () => send('/api/quotes', data)));
  assert.equal(duplicateResponses.filter(r => r.status === 201).length, 1, 'exactly one creation');
  assert(duplicateResponses.every(r => r.status === 200 || r.status === 201));
  const receipts = await Promise.all(duplicateResponses.map(r => r.json()));
  receipts.forEach(r => assert.deepEqual(r, receipts[0]));
  const receipt = receipts[0];
  const receiptResponse = await request('/request/' + receipt.token);
  assert.match(receiptResponse.headers.get('cache-control'), /no-store/);
  assert.equal(receiptResponse.headers.get('referrer-policy'), 'no-referrer');
  const html = await receiptResponse.text();
  assert(html.includes('padash-mark-blue-gold.webp'), 'the receipt uses the current brand emblem');
  assert(html.includes(receipt.id));
  for (const privateValue of [data.name, data.phone, data.message, data.company]) assert(!html.includes(privateValue), 'receipt must not contain customer details');

  assert.equal((await send('/api/admin/session', { password: 'incorrect' })).status, 401);
  console.log('Checking administrator authentication...');
  assert.equal((await send('/api/admin/session', { password }, { headers: { Origin: 'https://other.example' } })).status, 403);
  const login = await send('/api/admin/session', { password });
  assert.equal(login.status, 200);
  const setCookie = login.headers.get('set-cookie');
  assert(setCookie.includes('HttpOnly') && setCookie.includes('SameSite=Strict'));
  const cookie = setCookie.split(';')[0];
  const sessionHeaders = { Cookie: cookie };
  console.log('Checking technical specification and datasheet publication...');
  const specPath = '/api/admin/product-specs/el-r';
  const productPage = '/products/el-r';
  const datasheetPath = productPage + '/datasheet';
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n');
  const specFields = { revision: null, status: 'draft', source: 'Integration-only manufacturer reference',
    sourceUrl: '', manufacturer: 'Fixture Manufacturer', model: 'Fixture Model',
    values: { density: { value: '42', unit: 'kg/m³' } }, removeDatasheet: false };
  function saveSpecs(fields, bytes, headers = sessionHeaders) {
    const requestBody = new FormData();
    requestBody.set('fields', JSON.stringify(fields));
    if (bytes) requestBody.set('datasheet', new Blob([bytes], { type: 'application/pdf' }), 'datasheet.pdf');
    return request(specPath, { method: 'PUT', headers: { Origin: origin, ...headers }, body: requestBody });
  }
  assert.equal((await request(specPath)).status, 401);
  assert.equal((await saveSpecs(specFields, pdf, { ...sessionHeaders, Origin: 'https://other.example' })).status, 403);
  assert.equal((await saveSpecs(specFields, Buffer.from('not a PDF'))).status, 400);
  assert.equal((await saveSpecs({ ...specFields, values: { meshOpening: { value: '1', unit: 'mm' } } })).status, 400);
  assert.equal((await saveSpecs({ ...specFields, status: 'published', source: '' })).status, 400);
  assert.equal((await request(datasheetPath)).status, 404);
  assert.doesNotMatch(await (await request(productPage)).text(), /Fixture Model/);
  const specDraft = await saveSpecs(specFields, pdf);
  assert.equal(specDraft.status, 200);
  assert.equal((await specDraft.json()).specs.revision, 0);
  assert.equal((await request(datasheetPath)).status, 404);
  assert.doesNotMatch(await (await request(productPage)).text(), /Fixture Model/);
  const publishSpecs = { ...specFields, revision: 0, status: 'published' };
  const edits = await Promise.all([saveSpecs(publishSpecs), saveSpecs(publishSpecs)]);
  assert.deepEqual(edits.map(response => response.status).sort(), [200, 409]);
  const productWithSpecs = await (await request(productPage)).text();
  assert.match(productWithSpecs, /Fixture Model/);
  assert.match(productWithSpecs, /kg\/m³/);
  assert.match(productWithSpecs, /"@type":"Product"/);
  assert.doesNotMatch(productWithSpecs, /"@type":"(?:Offer|Review|AggregateRating)"/);
  const datasheet = await request(datasheetPath);
  assert.equal(datasheet.status, 200);
  assert.equal(datasheet.headers.get('content-type'), 'application/pdf');
  assert.match(datasheet.headers.get('content-disposition'), /^attachment/);
  assert.equal(datasheet.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.deepEqual(Buffer.from(await datasheet.arrayBuffer()), pdf);
  assert.equal((await saveSpecs({ ...specFields, revision: 1, removeDatasheet: true })).status, 200);
  assert.equal((await request(datasheetPath)).status, 404);
  assert.doesNotMatch(await (await request(productPage)).text(), /Fixture Model/);
  assert.equal((await request('/management/products')).headers.get('x-robots-tag'), 'noindex, nofollow');
  console.log('Checking crawlable content, canonical URLs, calculator and news publishing...');
  for (const path of ['/guides', '/guides/roll-insulation-quantity', '/guides/rock-wool-and-glass-wool', '/products', '/products/el-r', '/calculator', '/news']) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
    const content = await response.text();
    assert(content.includes('rel="canonical" href="https://www.padashgroup.ir' + path + '"'), 'canonical must use the owner-confirmed production domain');
  }
  const home = await (await request('/')).text();
  assert(home.includes('"@type":"WebSite"') && home.includes('"@type":"Organization"'));
  assert(home.includes('href="/guides/roll-insulation-quantity"') && home.includes('href="/products/vn-1221"'), 'public content exposes crawlable guide and featured catalogue product links');
  assert(home.includes('tel:+989112243632') && home.includes('tel:+989117746592'));
  assert(!home.includes('tel:+989112286151'), 'the former number is removed from the homepage');
  const robots = await (await request('/robots.txt')).text();
  assert(robots.includes('Sitemap: https://www.padashgroup.ir/sitemap.xml'));
  assert.equal((await request('/management')).headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.equal((await request('/api/admin/news')).status, 401);
  const newsArchive = () => request('/news', { headers: { 'User-Agent': 'Twitterbot' } }).then(response => response.text());
  const newsArchiveInSitemap = () => request('/sitemap.xml').then(response => response.text()).then(xml => xml.includes('<loc>https://www.padashgroup.ir/news</loc>'));
  assert.match(await newsArchive(), /<meta name="robots" content="noindex, follow"/);
  assert.equal(await newsArchiveInSitemap(), false, 'an empty archive stays out of the sitemap');
  const draftFields = { title: 'خبر آزمون محرمانه برای پیش‌نویس', summary: 'این خلاصه صرفاً داده آزمون مستقل است و نباید پیش از انتشار دیده شود.',
    body: 'این متن نمونه فقط در آزمون یکپارچه و فضای ذخیره‌سازی جدا ایجاد می‌شود. <script>alert("news-xss")</script> هیچ خبر واقعی یا رویداد ساختگی در سایت اصلی ثبت نمی‌شود.', kind: 'news', status: 'draft', event_date: '' };
  assert.equal((await send('/api/admin/news', draftFields)).status, 401);
  assert.equal((await send('/api/admin/news', draftFields, { headers: { ...sessionHeaders, Origin: 'https://other.example' } })).status, 403);
  assert.equal((await send('/api/admin/news', { ...draftFields, kind: 'event', event_date: '2026-02-30' }, { headers: sessionHeaders })).status, 400);
  const draftResponse = await send('/api/admin/news', draftFields, { headers: sessionHeaders });
  assert.equal(draftResponse.status, 201);
  const draft = (await draftResponse.json()).item;
  assert.equal((await request('/news/' + draft.id)).status, 404, 'draft page is private');
  for (const path of ['/', '/news', '/sitemap.xml']) assert(!(await (await request(path)).text()).includes(draft.title), 'draft never appears in public content');
  assert(!(await (await request('/sitemap.xml')).text()).includes('/news/' + draft.id));
  const eventFields = { ...draftFields, title: 'رویداد مستقل در فضای آزمون', kind: 'event', event_date: '2026-12-05' };
  const eventResponse = await send('/api/admin/news', eventFields, { headers: sessionHeaders });
  assert.equal(eventResponse.status, 201);
  const eventItem = (await eventResponse.json()).item;
  assert.equal((await send('/api/admin/news', { id: eventItem.id, revision: 0, fields: { ...eventFields, status: 'published' } }, { method: 'PATCH', headers: sessionHeaders })).status, 200);
  const eventHtml = await (await request('/news/' + eventItem.id)).text();
  assert(eventHtml.includes('2026-12-05') && eventHtml.includes('تاریخ رویداد'));
  assert.equal((await send('/api/admin/news', { id: eventItem.id, revision: 1, fields: eventFields }, { method: 'PATCH', headers: sessionHeaders })).status, 200);
  const publish = await send('/api/admin/news', { id: draft.id, revision: 0, fields: { ...draftFields, status: 'published' } }, { method: 'PATCH', headers: sessionHeaders });
  assert.equal(publish.status, 200);
  assert.doesNotMatch(await newsArchive(), /<meta name="robots" content="noindex/);
  assert.equal(await newsArchiveInSitemap(), true, 'the public archive is added as soon as a story is published');
  assert.equal((await request('/news/' + draft.id)).status, 200);
  const publishedHtml = await (await request('/news/' + draft.id)).text();
  assert(!publishedHtml.includes('<script>alert("news-xss")</script>'), 'news body cannot execute HTML');
  assert(publishedHtml.includes('&lt;script&gt;'), 'HTML in body is displayed as text');
  assert((await (await request('/')).text()).includes(draft.title), 'published news updates homepage without rebuilding');
  assert((await (await request('/sitemap.xml')).text()).includes('/news/' + draft.id));
  assert.equal((await send('/api/admin/news', { id: draft.id, revision: 0, fields: draftFields }, { method: 'PATCH', headers: sessionHeaders })).status, 409);
  assert.equal((await send('/api/admin/news', { id: draft.id, revision: 1, fields: draftFields }, { method: 'PATCH', headers: sessionHeaders })).status, 200);
  assert.equal((await request('/news/' + draft.id)).status, 404, 'unpublished news is hidden immediately');
  assert.match(await newsArchive(), /<meta name="robots" content="noindex, follow"/);
  assert(!(await (await request('/sitemap.xml')).text()).includes('/news/' + draft.id));
  const map = await (await request('/sitemap.xml')).text();
  assert(map.includes('/guides/roll-insulation-quantity') && map.includes('/products/el-r'));
  assert(!map.includes('/management') && !map.includes('/request/'), 'private pages excluded from sitemap');
  assert.equal((await request('/api/management', { headers: { Cookie: cookie.slice(0, -1) + '!' } })).status, 401);
  const listing = await (await request('/api/management', { headers: sessionHeaders })).json();
  assert.equal(listing.total, 1);
  assert.equal(listing.items[0].phone, data.phone);
  assert.equal(listing.stats.consultations, 1);
  assert.equal(listing.stats.orders, 0);
  const update = { token: receipt.token, revision: 0, status: 'reviewing',
    internal_note: 'Private administrator note', assignee: 'Private sales operator', follow_up_date: '2026-01-01' };
  assert.equal((await send('/api/management', update, { method: 'PATCH' })).status, 401);
  assert.equal((await send('/api/management', update, { method: 'PATCH', headers: { ...sessionHeaders, Origin: 'https://other.example' } })).status, 403);
  assert.equal((await send('/api/management', { ...update, status: 'invalid' }, { method: 'PATCH', headers: sessionHeaders })).status, 400);
  assert.equal((await send('/api/management', { ...update, follow_up_date: '2026-02-30' }, { method: 'PATCH', headers: sessionHeaders })).status, 400);
  assert.equal((await send('/api/management', { ...update, internal_note: 'x'.repeat(5001) }, { method: 'PATCH', headers: sessionHeaders })).status, 400);
  assert.equal((await send('/api/management', update, { method: 'PATCH', headers: sessionHeaders })).status, 200);
  assert.equal((await send('/api/management', update, { method: 'PATCH', headers: sessionHeaders })).status, 409, 'stale edits must not overwrite updates');
  const updatedListing = await (await request('/api/management?followUp=due', { headers: sessionHeaders })).json();
  assert.equal(updatedListing.total, 1);
  assert.equal(updatedListing.items[0].revision, 1);
  assert.equal(updatedListing.items[0].internal_note, update.internal_note);
  assert.equal(updatedListing.items[0].history.length, 1);
  const updatedReceipt = await (await request('/request/' + receipt.token)).text();
  assert(updatedReceipt.includes('در حال بررسی'));
  for (const privateValue of [update.internal_note, update.assignee]) assert(!updatedReceipt.includes(privateValue), 'admin fields must not leak into receipt or RSC payload');

  console.log('Checking order quantities, filters, workflow and full CSV export...');
  const orderData = { ...payload(), kind: 'order', name: 'Order Customer', company: ' =1+1', phone: '۰۹۱۲۲۲۲۲۲۲۲',
    message: 'Order project', items: [
      { productId: 'EL-R', thickness: 19, quantity: 100.5, note: 'roll details' },
      { productId: 'EL-T', thickness: 13, quantity: 20.2, note: 'pipe details' },
    ] };
  const orderResponse = await send('/api/quotes', orderData);
  assert.equal(orderResponse.status, 201);
  const orderReceipt = await orderResponse.json();
  const orders = await (await request('/api/management?kind=order&q=' + encodeURIComponent('۰۹۱۲۲۲۲۲۲۲۲'), { headers: sessionHeaders })).json();
  assert.equal(orders.total, 1);
  assert.equal(orders.items[0].token, orderReceipt.token);
  assert.equal(orders.stats.orders, 1);
  assert.equal(orders.stats.consultations, 1);
  assert.deepEqual(Object.fromEntries(orders.stats.volumes.map(v => [v.unit, v.quantity])), { 'مترمربع': 100.5, 'متر طول': 20.2 });
  assert.equal(orders.stats.lineItems, 2);
  const exportResponse = await request('/api/management?kind=order&format=csv', { headers: sessionHeaders });
  assert.equal(exportResponse.status, 200);
  assert(exportResponse.headers.get('cache-control').includes('no-store'));
  const csv = await exportResponse.text();
  assert(csv.includes("'=1+1"), 'CSV formulas are escaped after input normalization');
  assert(csv.includes('100.5') && csv.includes('20.2') && csv.includes('roll details') && csv.includes('pipe details'));
  assert(!csv.includes(data.name), 'export respects filters');
  assert.equal((await request('/api/management?from=2026-02-30', { headers: sessionHeaders })).status, 400);
  assert.equal((await request('/api/management?from=2026-12-01&to=2026-01-01', { headers: sessionHeaders })).status, 400);
  assert.equal((await request('/api/management?status=bogus', { headers: sessionHeaders })).status, 400);
  assert.equal((await request('/api/management?page=0', { headers: sessionHeaders })).status, 400);
  const concurrentUpdates = await Promise.all(['confirmed', 'cancelled'].map(status => send('/api/management', {
    token: orderReceipt.token, revision: 0, status,
  }, { method: 'PATCH', headers: sessionHeaders })));
  assert.equal(concurrentUpdates.filter(r => r.status === 200).length, 1);
  assert.equal(concurrentUpdates.filter(r => r.status === 409).length, 1);
  assert.equal((await send('/api/management', { token: orderReceipt.token, revision: 1, status: 'cancelled' }, { method: 'PATCH', headers: sessionHeaders })).status, 200);
  const cancelledStats = await (await request('/api/management', { headers: sessionHeaders })).json();
  assert.equal(cancelledStats.stats.volumes.length, 0, 'cancelled orders excluded from volume');

  const burst = await Promise.all(Array.from({ length: 8 }, () => send('/api/quotes', payload())));
  assert.equal(burst.filter(r => r.status === 201).length, 3, 'remaining network quota slots');
  assert.equal(burst.filter(r => r.status === 429).length, 5, 'concurrent requests respect quota');
  assert.equal((await send('/api/quotes', data)).status, 200, 'idempotent retry after limit');
  const logout = await request('/api/admin/session', { method: 'DELETE', headers: { ...sessionHeaders, Origin: origin } });
  assert.equal(logout.status, 200);
  assert(logout.headers.get('set-cookie').includes('Max-Age=0'));

  const attempts = await Promise.all(Array.from({ length: 10 }, () => send('/api/admin/session', { password: 'wrong' })));
  assert.equal(attempts.filter(r => r.status === 401).length, 8);
  assert.equal(attempts.filter(r => r.status === 429).length, 2);
  await stop();
  await start('');
  assert.equal((await request('/api/management', { headers: sessionHeaders })).status, 503, 'missing password fails closed');
  assert.equal((await send('/api/admin/session', { password })).status, 503);
  assert((await (await request('/request/' + receipt.token)).text()).includes(receipt.id), 'data survives application restart');
  await stop();
  await start(password, true);
  console.log('Checking Netlify proxy headers and secure sessions...');
  const proxyHeaders = { Origin: 'https://padash.example', 'x-forwarded-host': 'padash.example', 'x-nf-client-connection-ip': '203.0.113.10' };
  const hostedLogin = await send('/api/admin/session', { password }, { headers: proxyHeaders });
  assert.equal(hostedLogin.status, 200);
  assert(hostedLogin.headers.get('set-cookie').includes('; Secure'));
  assert.equal((await send('/api/admin/session', { password }, { headers: { ...proxyHeaders, Origin: 'http://padash.example' } })).status, 403);
  const hostedBurst = await Promise.all(Array.from({ length: 6 }, () => send('/api/quotes', payload(), { headers: proxyHeaders })));
  assert.equal(hostedBurst.filter(r => r.status === 201).length, 5);
  assert.equal(hostedBurst.filter(r => r.status === 429).length, 1);
  assert.equal((await send('/api/quotes', payload(), { headers: { ...proxyHeaders, 'x-nf-client-connection-ip': '203.0.113.11' } })).status, 201, 'separate clients have separate quotas');

  console.log('Checking legacy records, Tehran date boundaries, pagination and export across pages...');
  const store = getStore({ ...blobs.context, name: 'padash-local-v1', consistency: 'strong' });
  const legacyTokens = [];
  for (let i = 0; i < 25; i++) {
    const token = randomUUID(); legacyTokens.push(token);
    await store.setJSON('quotes/' + token, { token, id: 'PD-LEGACY-' + String(i).padStart(2, '0'),
      name: 'Legacy Customer ' + i, company: ' =1+1', phone: '09120000000', city: 'قم',
      items: JSON.stringify([{ productId: 'EL-R', thickness: 19, quantity: 1, note: '' }]),
      message: '', status: 'new', created_at: '2026-10-01T20:45:00.000Z' });
  }
  const hostedCookie = hostedLogin.headers.get('set-cookie').split(';')[0];
  const hostedSession = { Cookie: hostedCookie };
  const legacyPath = '/api/management?q=Legacy&kind=order&from=2026-10-02&to=2026-10-02';
  const first = await (await request(legacyPath, { headers: hostedSession })).json();
  const second = await (await request(legacyPath + '&page=2', { headers: hostedSession })).json();
  assert.equal(first.total, 25, 'legacy items infer order and Tehran date is Oct 2');
  assert.equal(first.items.length, 20);
  assert.equal(second.items.length, 5);
  assert.equal(new Set([...first.items, ...second.items].map(row => row.token)).size, 25);
  const legacyCsv = await (await request(legacyPath + '&format=csv', { headers: hostedSession })).text();
  assert.equal(legacyCsv.split('\r\n').length, 26, 'CSV includes all matching pages');
  assert(legacyCsv.includes("' =1+1"), 'legacy formulas with leading whitespace are escaped');
  assert.equal((await send('/api/management', { token: legacyTokens[0], revision: 0, assignee: 'Legacy operator' },
    { method: 'PATCH', headers: { ...hostedSession, ...proxyHeaders } })).status, 200, 'legacy records can be updated');
  console.log('Checking all partner products, image integrity and custom specification orders...');
  const partnerSource = JSON.parse(await readFile('docs/catalog-source.json', 'utf8'));
  assert.equal(partnerSource.count, 6);
  assert.deepEqual(partnerSource.products.map(item => item.id).sort(), [1213, 1216, 1218, 1219, 1220, 1221]);
  assert.equal(partnerSource.products.flatMap(item => item.images).length, 19);
  const productSitemap = await (await request('/sitemap.xml')).text();
  const catalogue = await (await request('/products')).text();
  const noSupplierName = content => assert(!/ونانه|vananeh/i.test(content), 'supplier identity must not appear in the deployed page or metadata');
  for (const path of ['/', '/products', '/calculator', '/management']) noSupplierName(await (await request(path)).text());
  noSupplierName(await readFile('lib/product-images.json', 'utf8'));
  for (const product of partnerSource.products) {
    const path = '/products/vn-' + product.id;
    const response = await request(path);
    assert.equal(response.status, 200, path);
    const content = await response.text();
    assert(content.includes('rel="canonical" href="https://www.padashgroup.ir' + path + '"'));
    noSupplierName(content);
    assert(content.includes('/calculator?product=vn-' + product.id), 'each new product opens its own calculator profile');
    const calculator = await (await request('/calculator?product=vn-' + product.id)).text();
    noSupplierName(calculator);
    assert(calculator.includes('value="VN-' + product.id + '" selected=""'), 'calculator selects the requested product');
    assert(content.includes('ثبت مشخصات و استعلام'));
    assert(productSitemap.includes('https://www.padashgroup.ir' + path));
    assert(catalogue.includes('href="' + path + '"'), 'partner listings render without JavaScript');
    for (const picture of product.images) {
      const bytes = await readFile(resolve('public', picture.src.slice(1)));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), picture.sha256, 'partner image remains unchanged');
      const imageResponse = await request(picture.src);
      assert.equal(imageResponse.status, 200);
      assert(imageResponse.headers.get('content-type').startsWith('image/'));
      assert.equal(createHash('sha256').update(Buffer.from(await imageResponse.arrayBuffer())).digest('hex'), picture.sha256);
    }
  }
  const partnerHeaders = { ...proxyHeaders, 'x-nf-client-connection-ip': '203.0.113.12' };
  const partnerItems = partnerSource.products.map(product => ({productId: 'VN-' + product.id, thickness: null, quantity: 2, note: 'Private specification for model ' + product.id}));
  const partnerPayload = { ...payload(), name: 'Partner Order Customer', kind: 'order', items: partnerItems };
  for (const invalid of [
    { ...partnerItems[0], note: '   ' },
    { ...partnerItems[0], thickness: 19 },
    { productId: 'EL-R', thickness: null, quantity: 1, note: 'invalid legacy thickness' },
    { productId: 'VN-1213', thickness: null, quantity: 1.5, note: 'fractional sheet count' },
    { productId: 'VN-1219', thickness: null, quantity: .5, note: 'fractional roll count' },
  ]) assert.equal((await send('/api/quotes', { ...partnerPayload, items: [invalid] }, { headers: partnerHeaders })).status, 400);
  const partnerResponse = await send('/api/quotes', partnerPayload, { headers: partnerHeaders });
  assert.equal(partnerResponse.status, 201);
  const partnerReceipt = await partnerResponse.json();
  assert.equal((await send('/api/quotes', partnerPayload, { headers: partnerHeaders })).status, 200, 'partner request retry is idempotent');
  const partnerAdminPath = '/api/management?q=' + encodeURIComponent(partnerPayload.name);
  const partnerOrders = await (await request(partnerAdminPath, { headers: hostedSession })).json();
  assert.equal(partnerOrders.total, 1);
  const storedItems = typeof partnerOrders.items[0].items === 'string' ? JSON.parse(partnerOrders.items[0].items) : partnerOrders.items[0].items;
  assert.deepEqual(storedItems, partnerItems, 'all six product specifications reach management unchanged');
  const partnerCsv = await (await request(partnerAdminPath + '&format=csv', { headers: hostedSession })).text();
  noSupplierName(partnerCsv);
  assert(partnerCsv.includes('طبق مشخصات درخواست') && partnerCsv.includes('رول') && partnerCsv.includes('ورق'));
  for (const item of partnerItems) assert(partnerCsv.includes(item.productId) && partnerCsv.includes(item.note));
  const partnerReceiptHtml = await (await request('/request/' + partnerReceipt.token)).text();
  assert(partnerReceiptHtml.includes('طبق مشخصات درخواست'));
  assert(!partnerReceiptHtml.includes('NaN'));
  for (const privateValue of [partnerPayload.name, partnerPayload.phone, ...partnerItems.map(item => item.note)]) assert(!partnerReceiptHtml.includes(privateValue), 'partner receipt preserves privacy');
  console.log('Checking Vercel per-client quotas, secure login and trusted headers...');
  await stop();
  await start(password,false,true);
  const vercelHeaders={'x-forwarded-host':'padash.example',Origin:'https://padash.example','x-vercel-forwarded-for':'198.51.100.40','x-forwarded-for':'198.51.100.99','x-nf-client-connection-ip':'198.51.100.98'};
  // next start injects its loopback X-Forwarded-For when absent; an explicitly
  // empty authoritative header exercises the fail-closed branch end to end.
  assert.equal((await send('/api/quotes',payload(),{headers:{Origin:'https://padash.example','x-forwarded-host':'padash.example','x-vercel-forwarded-for':''}})).status,503,'empty trusted IP fails instead of using a shared global quota');
  const vercelLogin=await send('/api/admin/session',{password},{headers:vercelHeaders});
  assert.equal(vercelLogin.status,200);assert(vercelLogin.headers.get('set-cookie').includes('; Secure'));
  assert.equal((await send('/api/admin/session',{password},{headers:{...vercelHeaders,Origin:'http://padash.example'}})).status,403);
  const vercelSession={Cookie:vercelLogin.headers.get('set-cookie').split(';')[0]};
  assert.equal((await request('/api/admin/status')).status,401,'service details require a valid session');
  const health=await(await request('/api/admin/status',{headers:{...vercelHeaders,...vercelSession}})).json();
  assert.equal(health.platform,'vercel');assert.equal(health.clientIdentification,'vercel');assert.equal(health.storage,'ok');
  assert.equal(health.limits.quotes,5);assert(!JSON.stringify(health).includes(password));assert(!JSON.stringify(health).includes('198.51.100.40'));
  for(let i=0;i<5;i++)assert.equal((await send('/api/quotes',payload(),{headers:vercelHeaders})).status,201,'same Vercel client within quota');
  assert.equal((await send('/api/quotes',payload(),{headers:{...vercelHeaders,'x-forwarded-for':'203.0.113.250','x-nf-client-connection-ip':'203.0.113.249'}})).status,429,'changing untrusted fallback headers cannot evade the authoritative IP quota');
  assert.equal((await send('/api/quotes',payload(),{headers:{...vercelHeaders,'x-vercel-forwarded-for':'198.51.100.41'}})).status,201,'another customer can submit after the first hits quota');
  assert.equal((await send('/api/quotes',payload(),{headers:{...vercelHeaders,'x-vercel-forwarded-for':'invalid'}})).status,503);
  const loginIp={...vercelHeaders,'x-vercel-forwarded-for':'198.51.100.42'};
  for(let i=0;i<10;i++)assert.equal((await send('/api/admin/session',{password:'wrong'},{headers:loginIp})).status,401);
  assert.equal((await send('/api/admin/session',{password},{headers:loginIp})).status,429);
  assert.equal((await send('/api/admin/session',{password},{headers:{...loginIp,'x-vercel-forwarded-for':'198.51.100.43'}})).status,200,'login quota is isolated by client too');
  for(const path of ['/management','/management/requests?kind=order','/management/follow-ups','/management/news','/management/system']){
    const response=await request(path);assert.equal(response.status,200,path);assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow');
    const html=await response.text();for(const destination of ['/management/requests','/management/follow-ups','/management/news','/management/system'])assert(html.includes('href="'+destination+'"'),'shared management menu includes '+destination);
    assert(!html.includes('Private Test Customer'),'customer details are not prerendered without authentication');
    assert(/name="robots" content="[^"]*noindex/.test(html),'new management routes inherit noindex');
  }
  const seo = await auditSeo(origin);
  console.log('SEO audit:',JSON.stringify({pages:seo.pagesChecked,images:seo.images,internalDestinations:seo.internalDestinations}));
  assert.equal((await request('/api/health')).status,200,'storage readiness succeeds');
  console.log('Checking sitemap availability during a news-store outage...');
  await blobs.stop();blobsStopped = true;
  const fallbackSitemap = await request('/sitemap.xml');
  assert.equal(fallbackSitemap.status,200,'stable catalogue stays discoverable when news storage is unavailable');
  const fallbackXml = await fallbackSitemap.text();
  const stablePaths=seo.pages.filter(page=>page.path!=='/news'&&!page.path.startsWith('/news/')).map(page=>'https://www.padashgroup.ir'+page.path).sort();
  assert.deepEqual([...fallbackXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]).sort(),stablePaths,'all original and new stable pages remain in the fallback sitemap');
  assert.equal([...fallbackXml.matchAll(/<image:loc>/g)].length,seo.images,'all product images remain in the fallback sitemap');
  assert(!fallbackXml.includes('<loc>https://www.padashgroup.ir/news</loc>'),'a failing news archive is not advertised as an indexable sitemap URL');
  for(const path of ['/products/el-r','/products/vn-1213','/guides/roll-insulation-quantity'])assert(fallbackXml.includes('https://www.padashgroup.ir'+path));
  assert.equal((await request('/api/health')).status,503,'unavailable storage fails readiness');
  const outageStatus=await(await request('/api/admin/status',{headers:{...vercelHeaders,...vercelSession}})).json();
  assert.equal(outageStatus.storage,'unavailable','authenticated system view reports a real storage outage');
  const homeWithoutNews=await request('/');
  assert.equal(homeWithoutNews.status,200,'news storage outage does not take down the homepage');
  assert((await homeWithoutNews.text()).includes('عایق حرارتی، برودتی و صوتی'));
  assert.equal((await request('/news')).status,500,'storage outage must not masquerade as an empty successful news archive');
  console.log('PASS: validation, privacy, quotas, admin access, CSRF, workflow, concurrent edits, quantities, CSV, dates, persistence, crawlable guides/products, canonical URLs, noindex, news workflow, XSS escaping, sitemap updates, 6 partner products, 19 original images, custom specification orders and complete SEO audit.');
} finally {
  await stop();
  if(!blobsStopped)await blobs.stop();
}
