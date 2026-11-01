import type { MetadataRoute } from 'next';
import { guides } from '../lib/guides';
import { products } from '../lib/catalog';
import { listPublishedNews } from '../lib/news';
import { absoluteUrl } from '../lib/seo';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const news = await listPublishedNews();
  return [
    ...['/', '/products', '/guides', '/calculator', '/news'].map(path => ({ url: absoluteUrl(path) })),
    ...products.map(product => ({ url: absoluteUrl('/products/' + product.id.toLowerCase()) })),
    ...guides.map(guide => ({ url: absoluteUrl('/guides/' + guide.slug), lastModified: guide.modified + 'T12:00:00+03:30' })),
    ...news.map(item => ({ url: absoluteUrl('/news/' + item.id), lastModified: item.updated_at })),
  ];
}
