import Link from 'next/link';
import { Suspense } from 'react';
import Storefront from './storefront';
import { publicNewsSnapshot } from '../lib/public-news';
import { guides } from '../lib/guides';
import { SITE_TITLE, pageMetadata } from '../lib/seo';
import {InsulationHub} from '../components/insulation-links';
import { AnalyticsPreferences } from '../components/public-support';
import { FloatingWhatsApp } from '../components/whatsapp-link';
import './storefront-theme.css';
import './content.css';
import './catalog.css';
import './storefront-design.css';
import './insulation.css';
export const dynamic = 'force-dynamic';
export const metadata = pageMetadata(
  { absolute: SITE_TITLE },
  'تأمین و فروش عایق حرارتی، برودتی و صوتی. برای خرید فوم پلی‌اتیلن، یونولیت، پشم سنگ و پشم شیشه، مشخصات را مقایسه کنید، مقدار را حساب کنید و قیمت بگیرید.',
  '/',
);
async function HomeNews() {
  const { items } = await publicNewsSnapshot();
  if (!items.length) return null;

  return <section className="section container home-news" id="news" aria-labelledby="home-news-title">
    <div className="section-heading"><h2 id="home-news-title">اخبار و رویدادها</h2><Link href="/news" className="text-button">همه خبرها</Link></div>
    <div className="home-news-grid">{items.slice(0, 3).map(item => <article className="home-news-card" key={item.id}>
      <span className="mini-label">{item.kind === 'event' ? 'رویداد' : 'خبر و اطلاعیه'}</span>
      <time dateTime={item.published_at!}>{new Date(item.published_at!).toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran', dateStyle: 'medium' })}</time>
      <h3><Link href={'/news/' + item.id}>{item.title}</Link></h3><p>{item.summary}</p>
    </article>)}</div>
  </section>;
}

export default function Home() {
  return <div className="storefront homepage">
    <Storefront featuredGuides={guides.slice(0, 3).map(({ slug, title, category, minutes }) => ({ slug, title, category, minutes }))}
      analyticsPreferences={<AnalyticsPreferences/>}
      news={<Suspense fallback={null}><HomeNews/></Suspense>}>
      <InsulationHub home/>
    </Storefront>
    <FloatingWhatsApp/>
  </div>;
}
