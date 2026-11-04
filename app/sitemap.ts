import type { MetadataRoute } from 'next';
import { guides } from '../lib/guides';
import { products } from '../lib/catalog';
import { listPublishedNews, type PublicNews } from '../lib/news';
import { absoluteUrl } from '../lib/seo';
export const dynamic = 'force-dynamic';
async function newsForSitemap():Promise<PublicNews[]> {
  let timer:ReturnType<typeof setTimeout>|undefined;
  try {
    // Storage retries can outlive a crawler request; keep the static URLs available.
    return await Promise.race([
      listPublishedNews(),
      new Promise<PublicNews[]>(resolve=>{timer=setTimeout(()=>resolve([]),2500);}),
    ]);
  } catch { return []; }
  finally { if(timer)clearTimeout(timer); }
}
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // A temporary news-store outage must not hide all of the stable catalogue URLs.
  const news = await newsForSitemap();
  return [
    ...['/', '/products', '/guides', '/calculator', '/news'].map(path => ({ url: absoluteUrl(path) })),
    ...products.map(product => ({ url: absoluteUrl('/products/' + product.id.toLowerCase()), ...(product.images?.length?{images:product.images.map(image=>absoluteUrl(image.src))}:{}) })),
    ...guides.map(guide => ({ url: absoluteUrl('/guides/' + guide.slug), lastModified: guide.modified + 'T12:00:00+03:30' })),
    ...news.map(item => ({ url: absoluteUrl('/news/' + item.id), lastModified: item.updated_at })),
  ];
}
