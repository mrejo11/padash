import Link from 'next/link';
import {ArrowUpLeft,Phone} from 'lucide-react';
import PublicPage from '../../components/public-page';
import JsonLd from '../../components/json-ld';
import {businessContacts} from '../../lib/contacts';
import {absoluteUrl,breadcrumbs,organization,pageMetadata} from '../../lib/seo';

export const metadata=pageMetadata('تماس با ما','شماره تماس مهندس پاداشی و مهندس فرجی، مدیران بازرگانی پاداش؛ ارتباط مستقیم برای مشاوره انتخاب عایق، استعلام مشخصات و هماهنگی تأمین پروژه.','/contact');
export default function ContactPage(){
  return <PublicPage><JsonLd value={{'@context':'https://schema.org','@graph':[
    breadcrumbs([{name:'صفحه اصلی',path:'/'},{name:'تماس با ما',path:'/contact'}]),
    {'@type':'ContactPage','@id':absoluteUrl('/contact#webpage'),url:absoluteUrl('/contact'),name:'تماس با بازرگانی پاداش',inLanguage:'fa-IR',mainEntity:{'@id':organization['@id']},isPartOf:{'@id':absoluteUrl('/#website')}},
  ]}}/>
    <header className="content-heading"><span className="eyebrow">ارتباط مستقیم با پاداش</span><h1>تماس با بازرگانی پاداش</h1><p>برای مشاوره، استعلام مشخصات و هماهنگی تأمین، نیاز پروژه خود را با مدیران در میان بگذارید.</p></header>
    <section className="business-contact" aria-labelledby="contact-team-heading"><div className="contact-heading"><div><h2 id="contact-team-heading">مشاوره و هماهنگی تأمین</h2></div></div>
      <div className="business-contact-grid">{businessContacts.map(contact=><a className="manager-card" key={contact.phone} href={contact.href} aria-label={'تماس با '+contact.name+'، '+contact.displayPhone}>
        <span className="manager-icon"><Phone size={23}/></span><div className="manager-info"><h3>{contact.name}</h3><p>مشاوره و هماهنگی تأمین</p></div><div className="manager-call"><bdi className="manager-number">{contact.displayPhone}</bdi><span>تماس مستقیم<ArrowUpLeft size={16}/></span></div>
      </a>)}</div>
    </section>
    <section className="article-related"><h2>پیش از تماس چه اطلاعاتی آماده کنیم؟</h2><p>نام محصول، کاربرد، مقدار و ابعاد، ضخامت یا دانسیته در صورت نیاز، نوع روکش و شهر تحویل به بررسی درخواست کمک می‌کنند. قیمت، موجودی و شرایط نهایی در پیش‌فاکتور تأیید می‌شوند.</p>
      <Link href="/products">بررسی محصولات</Link><Link href="/calculator">محاسبه مقدار</Link><Link href="/guides">راهنمای انتخاب</Link><Link href="/about">درباره پاداش</Link>
    </section>
  </PublicPage>;
}
