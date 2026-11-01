import PublicPage from '../../components/public-page';
import JsonLd from '../../components/json-ld';
import { listPublishedNews } from '../../lib/news';
import { breadcrumbs, pageMetadata } from '../../lib/seo';
export const dynamic = 'force-dynamic';
export const metadata = pageMetadata('اخبار و رویدادها', 'اطلاعیه‌ها، خبرها و رویدادهای منتشرشده بازرگانی پاداش درباره خدمات و تأمین عایق‌های حرارتی و برودتی.', '/news');
export default async function NewsPage() {
  const items = await listPublishedNews();
  return <PublicPage><JsonLd value={breadcrumbs([{ name: 'صفحه اصلی', path: '/' }, { name: 'اخبار و رویدادها', path: '/news' }])}/>
    <div className="content-heading"><span className="eyebrow">تازه‌های بازرگانی پاداش</span><h1>اخبار و رویدادهای پاداش</h1><p>اطلاعیه‌ها و برنامه‌هایی که توسط مدیریت بازرگانی پاداش منتشر می‌شوند.</p></div>
    {items.length ? <div className="content-grid">{items.map(item => <article className="content-card" key={item.id}><span className="mini-label">{item.kind === 'event' ? 'رویداد' : 'خبر و اطلاعیه'}</span><time dateTime={item.published_at!}>{new Date(item.published_at!).toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran', dateStyle: 'long' })}</time><h2><a href={'/news/' + item.id}>{item.title}</a></h2><p>{item.summary}</p><a className="text-button" href={'/news/' + item.id}>ادامه مطلب</a></article>)}</div>
      : <div className="content-empty"><h2>هنوز خبر یا رویدادی منتشر نشده است</h2><p>خبرهای تازهٔ بازرگانی پاداش پس از انتشار در این بخش قرار می‌گیرند.</p><a href="/#contact" className="text-button">ارتباط با مدیران</a></div>}
  </PublicPage>;
}
