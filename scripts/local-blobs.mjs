import { createServer } from 'node:http';
import { once } from 'node:events';
import { BlobsServer } from '@netlify/blobs/server';

// The disk emulator does not make conditional filesystem writes atomic. Serialize
// its requests locally so it models the hosted service's conditional-write contract.
export async function startLocalBlobs({ directory, token }) {
  const upstream = new BlobsServer({ directory, token, logger: () => {} });
  const { address } = await upstream.start();
  let pending = Promise.resolve();
  const proxy = createServer((request, response) => {
    pending = pending.then(async () => {
      try {
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        const body = Buffer.concat(chunks);
        const headers = { ...request.headers };
        delete headers.host; delete headers.connection; delete headers['transfer-encoding'];
        const result = await fetch(address + request.url, {
          method: request.method, headers, body: ['GET', 'HEAD'].includes(request.method) ? undefined : body,
          signal: AbortSignal.timeout(10000),
        });
        response.writeHead(result.status, Object.fromEntries(result.headers));
        response.end(Buffer.from(await result.arrayBuffer()));
      } catch { response.writeHead(500); response.end(); }
    });
  });
  proxy.listen(0, '127.0.0.1');
  await once(proxy, 'listening');
  const edgeURL = `http://127.0.0.1:${proxy.address().port}`;
  return {
    context: { siteID: 'padash-local', token, edgeURL, uncachedEdgeURL: edgeURL },
    async stop() {
      proxy.closeAllConnections();
      await new Promise(resolve => proxy.close(resolve));
      await upstream.stop();
    },
  };
}
