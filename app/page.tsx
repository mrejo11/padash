import Storefront from './storefront';
import { publicNewsSnapshot } from '../lib/public-news';
import { guides } from '../lib/guides';
import { pageMetadata } from '../lib/seo';
import './storefront-theme.css';
import './content.css';
import './catalog.css';
import './storefront-design.css';
export const dynamic = 'force-dynamic';
export const metadata = { ...pageMetadata('عایق، یونولیت و ملزومات پروژه', 'بازرگانی پاداش؛ مشخصات و استعلام عایق الاستومری، پشم سنگ، پشم شیشه، فوم، یونولیت و ملزومات نصب؛ محاسبه مقدار مورد نیاز و تماس با مدیران فروش.', '/'), title: { absolute: 'بازرگانی پاداش | عایق، یونولیت و ملزومات پروژه' } };
export default async function Home() {
  const snapshot = await publicNewsSnapshot();
  return <div className="storefront homepage"><Storefront featuredGuides={guides.slice(0, 3).map(({ slug, title, category, minutes }) => ({ slug, title, category, minutes }))} news={snapshot.items.slice(0,3).map(({ id, title, summary, kind, published_at }) => ({ id, title, summary, kind, published_at }))} newsUnavailable={snapshot.unavailable}/></div>;
}
