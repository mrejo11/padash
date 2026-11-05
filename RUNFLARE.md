# Padash on Runflare

Service: project `37702`, service `87517` (`padashco`). Repository: `mrejo11/padash`, branch `main`.

## Runtime and automatic deployment

Use Node.js **24**, one service replica, repository root as the build directory, `npm ci --include=dev --include=optional`, `npm run build`, and `npm start`. The server listens on `0.0.0.0:$PORT` (currently port `3000`). Keep the Git integration's automatic deployment enabled so successful pushes to `main` build and deploy this service.

Configure storage and secrets before pushing the production-launcher change. A code rollback does not roll back database contents. Keep a backup before changing the storage backend or namespace.

## Persistent storage

Attach a persistent disk at **`/app/data`**. The initial 512 MB option is sufficient for a small text-only sales database; the hosting panel determines its charge. Do not put the database under the repository or temporary container filesystem. Disk allocation cannot be reduced in the current panel.

Set these environment variables for both build and runtime, preserving existing `PORT` and `HOST`:

```text
NODE_ENV=production
PADASH_STORAGE=sqlite
PADASH_DATABASE_PATH=/app/data/padash.sqlite
PADASH_PERSISTENT_DISK=true
PADASH_STORE_NAMESPACE=production
PADASH_PUBLIC_ORIGIN=https://padashco-dac-padashco.runflare.cloud
```

Set `SALES_ADMIN_PASSWORD` separately as a private hosting secret, using a unique password of at least 24 characters from a password manager. Never commit it, copy `.env.local` to Git, or prefix it with `NEXT_PUBLIC_`. Changing it invalidates administrator sessions. The production launcher rejects missing credentials, an invalid public origin, or unconfirmed persistent storage.

SQLite uses WAL, FULL synchronous commits, a busy timeout, and atomic conditional writes. Orders, news, rate limits, and revisions survive application restarts and builds. Use **one replica on the same local persistent disk**; multiple replicas or network file sharing require a different database architecture.

On self-hosting, quote limits use a private hash of the contact number (five requests per 24 hours), plus a service-wide ceiling of 100 new attempts per minute. International Iranian mobile prefixes are normalized for the contact quota. Unverified forwarded IP headers are ignored. Administrator login has a shared service limit of ten attempts per 15 minutes. Netlify continues using its trusted edge IP header and existing network quotas. Contact quotas are abuse controls, not phone ownership verification.

## Existing records and backups

Before the first storage switch, inspect the old `.sites-runtime/netlify-blobs` directory and the old hosted store. Existing local, Netlify, and SQLite stores are separate; **records are not automatically migrated**. If there are real orders or news, export and migrate them before switching customer traffic. Do not delete the old directory or old provider store.

A persistent disk is not an independent backup. Take consistent SQLite snapshots using SQLite's online backup API, and retain encrypted copies outside this service. Do not copy only `padash.sqlite` from a running WAL database: recent commits may still be in `padash.sqlite-wal`. For an offline backup or restore, stop all database writers and preserve the database together with its WAL/SHM companions. Restrict access because customer details are private. Test restore into an isolated service before relying on a backup.

## Verification

After deployment:

- `/` and `/news` return 200.
- `/api/health` returns 200 and `{"status":"ok"}`; unavailable storage returns 503. It exposes no credentials or customer details.
- `/api/management` returns 401 without a session, rather than 503.
- `/management` accepts the hosting secret and uses a Secure, HttpOnly, SameSite=Strict session cookie.
- The latest running deployment matches the pushed commit on `main`.

Set the Runflare health-check path to `/api/health` with adequate startup time. A disk or environment change may restart the service. Keep account credit sufficient for continuous operation.

The SEO canonical domain remains the owner-confirmed **https://padashco.netlify.app** until the owner explicitly changes it. `PADASH_PUBLIC_ORIGIN` sets request-origin validation and HTTPS cookies for this deployment; it does not change canonical URLs. If the Runflare public hostname changes, update that setting before accepting submissions on the new hostname.

Local checks:

```powershell
npm.cmd run build
npm.cmd run typecheck
npm.cmd run test:integration
$env:PADASH_TEST_STORAGE='sqlite'
npm.cmd run test:integration
```

Use Node 24 for SQLite. The integration suite uses isolated test databases and exercises simultaneous submissions and edits, quotas, restart persistence, admin authentication, HTTPS origin checks, private receipts, news publication, and the existing SEO audit.
