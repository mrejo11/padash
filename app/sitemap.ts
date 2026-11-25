import type { MetadataRoute } from 'next';
import { guides } from '../lib/guides';
import { productPath, products } from '../lib/catalog';
import { publicNewsSnapshot } from '../lib/public-news';
import { catalogCategories, categoryPath } from '../lib/catalog-seo';
import { catalogBuyingGuides } from '../lib/catalog-buying-guides';
import { absoluteUrl, isPreviewDeployment } from '../lib/seo';
import { companyPages } from '../lib/company-pages';
import {insulationTopics} from '../lib/insulation-topics';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (isPreviewDeployment()) return [];
  // A temporary news-store outage must not hide all of the stable catalogue URLs.
  const {items: news} = await publicNewsSnapshot();
  const contentUpdated='2026-11-19';
  const catalogUpdated='2026-11-23';
  return [
    { url: absoluteUrl('/'), lastModified: '2026-11-25' },
    { url: absoluteUrl('/products'), lastModified: catalogUpdated },
    { url: absoluteUrl('/guides'), lastModified: contentUpdated },
    { url: absoluteUrl('/calculator') },
    ...Object.values(companyPages).map(page => ({ url: absoluteUrl(page.path), lastModified: page.updated })),
    ...(news.length ? [{url:absoluteUrl('/news')}] : []),
    ...insulationTopics.map(topic=>({url:absoluteUrl(topic.path),lastModified:contentUpdated})),
    ...catalogCategories.map(category => ({url: absoluteUrl(categoryPath(category.id)),lastModified:catalogBuyingGuides[category.id].updated})),
    ...products.map(product => ({ url: absoluteUrl(productPath(product)), ...(product.images?.length?{images:product.images.map(image=>absoluteUrl(image.src))}:{}) })),
    ...guides.map(guide => ({ url: absoluteUrl('/guides/' + guide.slug), lastModified: guide.modified + 'T12:00:00+03:30' })),
    ...news.map(item => ({ url: absoluteUrl('/news/' + item.id), lastModified: item.updated_at })),
  ];
}
