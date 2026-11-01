# Deploying Padash on Netlify

The app now builds with **Next.js**, not Vinext. `npm run build` produces `.next`, including the server-rendered receipt and API routes. Netlify's automatically installed Next.js adapter handles those routes.

## Deployment

Connect `mrejo11/padash`, branch `main`. The root `netlify.toml` sets:

- Build command: `npm run build`
- Publish directory: `.next`
- Node.js: `24`

Leave the base directory empty: `package.json` is at the repository root. Keep the automatic `@netlify/plugin-nextjs` integration. A static export or `dist/client` publish directory cannot run the request APIs.

## Request storage

Requests are stored in **Netlify Blobs**, using the runtime credentials supplied by Netlify. No Cloudflare account, database connection string, or personal Netlify API token is needed. Production uses the site-wide store `padash-production-v1`; previews use `padash-preview-v1`. Records persist across deployments.

The application uses strong reads and conditional writes for duplicate submissions, status updates, and request/login limits. The small sales panel reads records to sort and paginate them; for a large request volume, replace this repository implementation with an indexed database.

The `/management` dashboard includes order/consultation counts, seven-day activity, requested quantities grouped by unit, search and date/status/type filters, follow-up dates, internal notes, assignments, recent change history, and filtered CSV export across all pages. Updates carry a revision number to reject stale concurrent edits. Internal fields are never rendered on the customer receipt. See the [Persian management guide](docs/management.md) for operating details and the distinction between requested quantities and confirmed sales.

Original Cloudflare D1 data and local Wrangler data are not deleted or copied automatically. If the old site contains real requests, export and migrate those separately before switching customer traffic. The Netlify store initially starts empty.

## Administrator login

In Netlify, open **Project configuration → Environment variables** and add:

```text
SALES_ADMIN_PASSWORD = a unique randomly generated password of at least 24 characters
```

Make this variable available to **Functions**, only in the **Production** deploy context. Generate the value with a password manager. Keep it out of Git and do not use a `NEXT_PUBLIC_` prefix. Redeploy after setting it.

Open `/management` and enter that password. Login uses a signed, eight-hour, HttpOnly/SameSite cookie; Netlify cookies also require HTTPS. There is a persistent limit of ten login attempts per network in fifteen minutes. Changing the password invalidates existing sessions. Without a valid configured password, the panel remains locked and customer details are not exposed. Quote submission and receipt pages do not require this setting.

The same session protects `/management/news`, which manages drafts, public news and events. Published news appears on the homepage and in `/sitemap.xml` immediately. No sample company news is seeded. The canonical origin is the owner-confirmed `https://padashco.netlify.app` in `lib/seo.ts`; deploy-preview hostnames never become canonical. The optional build variable `GOOGLE_SITE_VERIFICATION` supplies the public HTML verification token from Google Search Console. It is separate from the administrator password. See [the SEO and content guide](docs/seo.md) for the owner-side verification and sitemap submission steps.

## Local development and checks

Use Node 24. In PowerShell:

```powershell
npm.cmd ci --include=optional
npm.cmd run dev
```

Open `http://localhost:5173`. The local launcher starts Netlify's Blobs emulator; local records persist under ignored `.sites-runtime/netlify-blobs`. To use the admin panel locally, set `SALES_ADMIN_PASSWORD` in ignored `.env.local` and restart the server. No hosted data is used by the local emulator.

```powershell
npm.cmd run build
npm.cmd run typecheck
npm.cmd run test:integration
npm.cmd start
```

The integration check launches the built Next.js server and an isolated Netlify Blobs emulator. It tests actual HTTP requests, concurrent submissions, persistent limits, privacy of receipts, administrator access, cross-origin rejection, updates, logout and persistence across app restarts. Test data stays under ignored `.sites-runtime/integration-*`.

The original template's Cloudflare helper files remain as historical source; they are not used by `dev`, `build`, `start`, or the Netlify runtime. The current app does not use the original ChatGPT authentication headers.
