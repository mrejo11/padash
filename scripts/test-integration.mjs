import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { startLocalBlobs } from './local-blobs.mjs';

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
async function start(adminPassword = password, hosted = false) {
  child = spawn(process.execPath, [resolve('node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'production', NETLIFY: '', SALES_ADMIN_PASSWORD: adminPassword,
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
  assert.equal((await request('/api/management', { headers: { 'oai-authenticated-user-email': 'admin@example.com' } })).status, 401);
  assert.equal((await send('/api/quotes', payload(), { headers: { Origin: 'https://other.example' } })).status, 403);
  assert.equal((await send('/api/quotes', {})).status, 400);
  assert.equal((await send('/api/quotes', { ...payload(), website: 'spam' })).status, 400);
  assert.equal((await send('/api/quotes', { ...payload(), message: 'x'.repeat(17000) })).status, 413);

  const data = payload();
  console.log('Checking concurrent submissions...');
  const duplicateResponses = await Promise.all(Array.from({ length: 4 }, () => send('/api/quotes', data)));
  assert.equal(duplicateResponses.filter(r => r.status === 201).length, 1, 'exactly one creation');
  assert(duplicateResponses.every(r => r.status === 200 || r.status === 201));
  const receipts = await Promise.all(duplicateResponses.map(r => r.json()));
  receipts.forEach(r => assert.deepEqual(r, receipts[0]));
  const receipt = receipts[0];
  const html = await (await request('/request/' + receipt.token)).text();
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
  assert.equal((await request('/api/management', { headers: { Cookie: cookie.slice(0, -1) + '!' } })).status, 401);
  const listing = await (await request('/api/management', { headers: sessionHeaders })).json();
  assert.equal(listing.total, 1);
  assert.equal(listing.items[0].phone, data.phone);
  const update = { token: receipt.token, status: 'reviewing' };
  assert.equal((await send('/api/management', update, { method: 'PATCH' })).status, 401);
  assert.equal((await send('/api/management', update, { method: 'PATCH', headers: { ...sessionHeaders, Origin: 'https://other.example' } })).status, 403);
  assert.equal((await send('/api/management', { ...update, status: 'invalid' }, { method: 'PATCH', headers: sessionHeaders })).status, 400);
  assert.equal((await send('/api/management', update, { method: 'PATCH', headers: sessionHeaders })).status, 200);
  assert((await (await request('/request/' + receipt.token)).text()).includes('در حال بررسی'));

  const burst = await Promise.all(Array.from({ length: 8 }, () => send('/api/quotes', payload())));
  assert.equal(burst.filter(r => r.status === 201).length, 4, 'four remaining quota slots');
  assert.equal(burst.filter(r => r.status === 429).length, 4, 'concurrent requests respect quota');
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
  console.log('PASS: Next.js pages, validation, receipt privacy, concurrent idempotency and quotas, admin access, CSRF, updates, logout and persistence.');
} finally {
  await stop();
  await blobs.stop();
}
