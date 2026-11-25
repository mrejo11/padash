import { ArrowLeft, BookOpen } from 'lucide-react';
import PublicPage from '../../components/public-page';
import BreadcrumbNavigation from '../../components/breadcrumb-navigation';
import { guides } from '../../lib/guides';
import { pageMetadata } from '../../lib/seo';
import { fa } from '../../lib/catalog';
import {InsulationHub} from '../../components/insulation-links';
export const metadata = pageMetadata('راهنمای انتخاب و محاسبه عایق', 'راهنمای تفاوت عایق حرارتی، برودتی و صوتی و مقاله‌های مستند انتخاب الاستومری، پشم سنگ، پشم شیشه، پلی‌اتیلن و محاسبه مقدار خرید.', '/guides');
export default function Guides() {
  return <PublicPage><BreadcrumbNavigation items={[{ name: 'صفحه اصلی', path: '/' }, { name: 'راهنمای عایق', path: '/guides' }]}/>
    <div className="content-heading"><span className="eyebrow">دانش فنی برای تصمیم خرید</span><h1>راهنمای انتخاب و محاسبه عایق</h1><p>مطالب تألیفی با ارجاع مستقیم به منابع تولیدکنندگان و نهادهای فنی؛ مشخصات نهایی همیشه از دیتاشیت همان محصول بررسی می‌شوند.</p></div>
    <section className="guide-comparison"><h2>نام جنس با هدف عایق‌کاری چه تفاوتی دارد؟</h2><p>حرارتی، برودتی و صوتی هدف انتخاب را توصیف می‌کنند؛ پشم سنگ، پشم شیشه، الاستومری و پلی‌اتیلن نام خانوادهٔ ماده‌اند. بنابراین برای شناخت نیاز، ابتدا مسئلهٔ پروژه و سپس مشخصات مدل را بررسی کنید.</p><p>در کاربرد حرارتی، انتقال گرما و جزئیات نصب مطرح‌اند. در خط سرد، خطر میعان و کنترل بخار هم باید بررسی شوند. در موضوع صوت، کاهش بازتاب داخل اتاق با محدودکردن انتقال صدا بین فضاها یکسان نیست. هیچ نام ماده‌ای به‌تنهایی، عملکرد نهایی یک ساختمان یا سامانه را تضمین نمی‌کند.</p><p>راهنماهای زیر برای شناخت جنس و متره‌اند؛ برای مقایسهٔ خانواده‌های قابل استعلام بر اساس کاربرد، از مسیرهای انتخاب استفاده کنید.</p></section>
    <InsulationHub/>
    <h2 className="guide-articles-heading">راهنماهای تخصصی انتخاب و متره</h2>
    <div className="content-grid">{guides.map(guide => <article className="content-card" key={guide.slug}><BookOpen size={25}/><span className="mini-label">{guide.category} · {fa(guide.minutes)} دقیقه</span>
      <h2><a href={'/guides/' + guide.slug}>{guide.title}</a></h2><p>{guide.description}</p><a href={'/guides/' + guide.slug} className="text-button">مطالعه راهنما<ArrowLeft size={16}/></a></article>)}</div>
  </PublicPage>;
}
