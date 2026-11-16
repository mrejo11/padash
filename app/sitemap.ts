import type { MetadataRoute } from 'next';
import { guides } from '../lib/guides';
import { products } from '../lib/catalog';
import { publicNewsSnapshot } from '../lib/public-news';
import { catalogCategories, categoryPath } from '../lib/catalog-seo';
import { absoluteUrl } from '../lib/seo';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // A temporary news-store outage must not hide all of the stable catalogue URLs.
  const {items: news} = await publicNewsSnapshot();
  return [
    ...['/', '/products', '/guides', '/calculator', '/news'].map(path => ({ url: absoluteUrl(path) })),
    ...catalogCategories.map(category => ({url: absoluteUrl(categoryPath(category.id))})),
    ...products.map(product => ({ url: absoluteUrl('/products/' + product.id.toLowerCase()), ...(product.images?.length?{images:product.images.map(image=>absoluteUrl(image.src))}:{}) })),
    ...guides.map(guide => ({ url: absoluteUrl('/guides/' + guide.slug), lastModified: guide.modified + 'T12:00:00+03:30' })),
    ...news.map(item => ({ url: absoluteUrl('/news/' + item.id), lastModified: item.updated_at })),
  ];
}
