import { setTimeout as delay } from 'node:timers/promises';

const value = process.argv[2];
if (!value) throw new Error('Usage: node scripts/check-deployment.mjs https://your-service.example');
const origin = new URL(value);
if (origin.protocol !== 'https:' || origin.origin !== value || origin.username || origin.password) {
  throw new Error('Use an HTTPS origin without a path, credentials, or trailing slash');
}

// CLI upload can finish before the new application is ready to accept traffic.
let ready = false;
for (let attempt = 0; attempt < 36; attempt++) {
  try {
    const response = await fetch(new URL('/api/health', origin), {
      redirect: 'error', signal: AbortSignal.timeout(10000), cache: 'no-store',
    });
    if (response.status === 200 && (await response.json()).status === 'ok') {
      ready = true;
      break;
    }
  } catch {
    // Retry startup failures without logging private hosting response bodies.
  }
  if (attempt < 35) await delay(5000);
}
if (!ready) throw new Error('The deployed service did not pass /api/health');

for (const [path, expected] of [['/', 200], ['/news', 200], ['/api/management', 401]]) {
  const response = await fetch(new URL(path, origin), {
    redirect: 'error', signal: AbortSignal.timeout(15000), cache: 'no-store',
  });
  await response.body?.cancel();
  if (response.status !== expected) throw new Error(`${path}: expected HTTP ${expected}, received ${response.status}`);
  console.log(`${path}: HTTP ${expected}`);
}
console.log(`Service checks passed: ${origin.origin}`);
