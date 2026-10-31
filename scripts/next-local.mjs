import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { startLocalBlobs } from './local-blobs.mjs';

const [command, ...args] = process.argv.slice(2);
if (!['dev', 'start'].includes(command)) throw new Error('Expected dev or start');
const env = { ...process.env };
let blobs;
// Real Netlify functions receive their own storage context from the adapter.
if (!env.NETLIFY && !env.NETLIFY_BLOBS_CONTEXT) {
  const token = randomBytes(32).toString('hex');
  blobs = await startLocalBlobs({ directory: resolve('.sites-runtime/netlify-blobs'), token });
  env.NETLIFY_BLOBS_CONTEXT = Buffer.from(JSON.stringify(blobs.context)).toString('base64');
}
const child = spawn(process.execPath, [resolve('node_modules/next/dist/bin/next'), command,
  ...(command === 'dev' ? ['--webpack', '--port', '5173', '--hostname', '127.0.0.1'] : []), ...args], { stdio: 'inherit', env });
let stopping = false;
async function stop(signal) {
  if (stopping) return;
  stopping = true;
  if (signal) child.kill(signal);
  await blobs?.stop();
}
process.on('SIGINT', () => void stop('SIGINT'));
process.on('SIGTERM', () => void stop('SIGTERM'));
child.on('error', async error => { console.error(error.message); await stop(); process.exitCode = 1; });
child.on('exit', async code => { await stop(); process.exitCode = code ?? 1; });
