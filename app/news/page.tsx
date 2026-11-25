
import Link from 'next/link';
import PublicPage from '../../components/public-page';
import BreadcrumbNavigation from '../../components/breadcrumb-navigation';
import { publicNewsSnapshot } from '../../lib/public-news';
import { isPreviewDeployment, pageMetadata } from '../../lib/seo';
export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  const meta = pageMetadata('اخبار و رویدادها', 'اطلاعیه‌ها، خبرها و رویدادهای منتشرشده بازرگانی پاداش درباره خدمات و تأمین عایق‌های حرارتی و برودتی.', '/news');
  const { items } = await publicNewsSnapshot();
  return items.length ? meta : { ...meta, robots: { index: false, follow: !isPreviewDeployment() } };
}
export default async function NewsPage() {
  const {items, unavailable} = await publicNewsSnapshot();
  if (unavailable) throw new Error('Public news storage is temporarily unavailable');
  return <PublicPage><BreadcrumbNavigation items={[{ name: 'صفحه اصلی', path: '/' }, { name: 'اخبار و رویدادها', path: '/news' }]}/>
    <div className="content-heading"><span className="eyebrow">تازه‌های بازرگانی پاداش</span><h1>اخبار و رویدادهای پاداش</h1><p>اطلاعیه‌ها و برنامه‌هایی که توسط مدیریت بازرگانی پاداش منتشر می‌شوند.</p></div>
    {items.length ? <div className="content-grid">{items.map(item => <article className="content-card" key={item.id}><span className="mini-label">{item.kind === 'event' ? 'رویداد' : 'خبر و اطلاعیه'}</span><time dateTime={item.published_at!}>{new Date(item.published_at!).toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran', dateStyle: 'long' })}</time><h2><a href={'/news/' + item.id}>{item.title}</a></h2><p>{item.summary}</p><a className="text-button" href={'/news/' + item.id}>ادامه مطلب</a></article>)}</div>
      : <div className="content-empty"><h2>هنوز خبر یا رویدادی منتشر نشده است</h2><p>خبرهای تازهٔ بازرگانی پاداش پس از انتشار در این بخش قرار می‌گیرند.</p><Link href="/contact" className="text-button">ارتباط با مدیران</Link></div>}
  </PublicPage>;
}
