import Storefront from './storefront';
import JsonLd from '../components/json-ld';
import { listPublishedNews, type PublicNews } from '../lib/news';
import { guides } from '../lib/guides';
import { absoluteUrl, organization, pageMetadata, SITE_NAME, SITE_SHORT_NAME } from '../lib/seo';
import './storefront-theme.css';
import './content.css';
import './catalog.css';
import './storefront-polish.css';
export const dynamic = 'force-dynamic';
export const metadata = { ...pageMetadata('تأمین عایق حرارتی و برودتی', 'بازرگانی پاداش؛ انتخاب و استعلام عایق الاستومری، پشم سنگ، پشم شیشه و پلی‌اتیلن، محاسبه مقدار عایق و تماس با مهندس پاداشی و مهندس فرجی.', '/'), title: { absolute: 'بازرگانی پاداش | تأمین عایق حرارتی و برودتی' } };
export default async function Home() {
  let news: PublicNews[] = [];
  let newsUnavailable = false;
  try { news = (await listPublishedNews()).slice(0, 3); } catch { newsUnavailable = true; }
  return <div className="storefront homepage"><JsonLd value={{ '@context': 'https://schema.org', '@graph': [organization,
    { '@type': 'WebSite', '@id': absoluteUrl('/#website'), name: SITE_NAME, alternateName: SITE_SHORT_NAME, url: absoluteUrl('/'), inLanguage: 'fa-IR', publisher: { '@id': absoluteUrl('/#organization') } },
  ] }}/><Storefront featuredGuides={guides.slice(0, 3).map(({ slug, title, category, minutes }) => ({ slug, title, category, minutes }))} news={news.map(({ id, title, summary, kind, published_at }) => ({ id, title, summary, kind, published_at }))} newsUnavailable={newsUnavailable}/></div>;
}
