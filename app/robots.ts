import type { MetadataRoute } from 'next';
import { absoluteUrl } from '../lib/seo';
export default function robots(): MetadataRoute.Robots {
  // Private pages send noindex themselves so crawlers can see that directive.
  const preview = ['deploy-preview', 'branch-deploy'].includes(process.env.CONTEXT || '');
  return { rules: preview ? { userAgent: '*', disallow: '/' } : { userAgent: '*', allow: '/', disallow: ['/api/'] }, sitemap: absoluteUrl('/sitemap.xml') };
}
