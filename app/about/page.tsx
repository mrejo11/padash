import Link from 'next/link';
import PublicPage from '../../components/public-page';
import JsonLd from '../../components/json-ld';
import {aboutParagraphs} from '../../lib/business-profile';
import {absoluteUrl, breadcrumbs, organization, pageMetadata} from '../../lib/seo';

export const metadata=pageMetadata('درباره ما','آشنایی با بازرگانی پاداش (Padash Trading)، کاتالوگ عایق و ملزومات پروژه، ابزار محاسبه مقدار و روش ارتباط با مدیران برای مشاوره و استعلام.','/about');
export default function AboutPage(){
  return <PublicPage><JsonLd value={{'@context':'https://schema.org','@graph':[
    breadcrumbs([{name:'صفحه اصلی',path:'/'},{name:'درباره پاداش',path:'/about'}]),
    {'@type':'AboutPage','@id':absoluteUrl('/about#webpage'),url:absoluteUrl('/about'),name:'درباره بازرگانی پاداش',inLanguage:'fa-IR',about:{'@id':organization['@id']},isPartOf:{'@id':absoluteUrl('/#website')}},
  ]}}/>
    <article className="reading-article"><header className="content-heading"><span className="eyebrow" lang="en" dir="ltr">Padash Trading</span><h1>درباره بازرگانی پاداش</h1><p>{aboutParagraphs[0]}</p></header>
      {aboutParagraphs.slice(1).map(paragraph=><p key={paragraph}>{paragraph}</p>)}
      <section className="article-related"><h2>انتخاب و آماده‌سازی نیاز پروژه</h2>
        <p>در کاتالوگ، مشخصات و شکل عرضه را بررسی کنید. برای برآورد تعداد، ابعاد واقعی پروژه و محصول را در محاسبه‌گر وارد کنید و برای بررسی شرایط تأمین با مدیران تماس بگیرید.</p>
        <Link href="/products">محصولات پاداش</Link><Link href="/calculator">محاسبه مقدار مورد نیاز</Link><Link href="/guides">راهنمای خرید</Link><Link href="/contact">تماس با ما</Link>
      </section>
    </article>
  </PublicPage>;
}
