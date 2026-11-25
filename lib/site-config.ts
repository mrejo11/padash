const productionOrigin = 'https://www.padashgroup.ir';

function siteOrigin(value: string | undefined) {
  try {
    const url = new URL(value || productionOrigin);
    if (url.protocol === 'https:' && url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password) {
      return url.origin;
    }
  } catch { /* Use the owner-confirmed origin when configuration is invalid. */ }
  return productionOrigin;
}

export const SITE_URL = siteOrigin(process.env.SITE_URL);
export const isPreviewDeployment = () => process.env.VERCEL_ENV === 'preview'
  || ['deploy-preview', 'branch-deploy'].includes(process.env.CONTEXT || '');
