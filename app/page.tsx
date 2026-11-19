import Storefront from './storefront';
import { publicNewsSnapshot } from '../lib/public-news';
import { guides } from '../lib/guides';
import { pageMetadata } from '../lib/seo';
import {InsulationHub} from '../components/insulation-links';
import './storefront-theme.css';
import './content.css';
import './catalog.css';
import './storefront-design.css';
import './insulation.css';
export const dynamic = 'force-dynamic';
export const metadata = { ...pageMetadata('خرید عایق حرارتی، برودتی و صوتی', 'بازرگانی پاداش؛ تأمین و فروش عایق حرارتی، برودتی و صوتی برای ساختمان، صنعت و تأسیسات. مشاهده محصولات و ملزومات، محاسبه مقدار و استعلام قیمت.', '/'), title: { absolute: 'خرید عایق حرارتی، برودتی و صوتی | بازرگانی پاداش' } };
export default async function Home() {
  const snapshot = await publicNewsSnapshot();
  return <div className="storefront homepage"><Storefront featuredGuides={guides.slice(0, 3).map(({ slug, title, category, minutes }) => ({ slug, title, category, minutes }))} news={snapshot.items.slice(0,3).map(({ id, title, summary, kind, published_at }) => ({ id, title, summary, kind, published_at }))} newsUnavailable={snapshot.unavailable}><InsulationHub home/></Storefront></div>;
}
