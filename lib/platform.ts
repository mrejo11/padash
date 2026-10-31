// Netlify exposes SITE_ID/SITE_NAME to Functions; NETLIFY is primarily build-time.
export function onNetlify() {
  return Boolean(process.env.SITE_ID && process.env.SITE_NAME) || process.env.NETLIFY === 'true';
}
