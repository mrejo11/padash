import { ArrowLeft, BookOpen } from 'lucide-react';
import PublicPage from '../../components/public-page';
import JsonLd from '../../components/json-ld';
import { guides } from '../../lib/guides';
import { breadcrumbs, pageMetadata } from '../../lib/seo';
import { fa } from '../../lib/catalog';
export const metadata = pageMetadata('راهنمای انتخاب و محاسبه عایق', 'مقاله‌های مستند درباره عایق الاستومری، پشم سنگ، پشم شیشه، پلی‌اتیلن و محاسبه مقدار عایق رولی با منابع داخلی و خارجی.', '/guides');
export default function Guides() {
  return <PublicPage><JsonLd value={breadcrumbs([{ name: 'صفحه اصلی', path: '/' }, { name: 'راهنمای عایق', path: '/guides' }])}/>
    <div className="content-heading"><span className="eyebrow">دانش فنی برای تصمیم خرید</span><h1>راهنمای انتخاب و محاسبه عایق</h1><p>مطالب تألیفی با ارجاع مستقیم به منابع تولیدکنندگان و نهادهای فنی؛ مشخصات نهایی همیشه از دیتاشیت همان محصول بررسی می‌شوند.</p></div>
    <div className="content-grid">{guides.map(guide => <article className="content-card" key={guide.slug}><BookOpen size={25}/><span className="mini-label">{guide.category} · {fa(guide.minutes)} دقیقه</span>
      <h2><a href={'/guides/' + guide.slug}>{guide.title}</a></h2><p>{guide.description}</p><a href={'/guides/' + guide.slug} className="text-button">مطالعه راهنما<ArrowLeft size={16}/></a></article>)}</div>
  </PublicPage>;
}
