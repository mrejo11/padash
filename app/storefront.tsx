'use client';

import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowLeft, ArrowUpLeft, BookOpen, Building2, Calculator, CheckCheck, ChevronDown, ClipboardList, Factory, FileText, Headphones, Layers3, Phone, Scale, Search, ShieldCheck, Truck, Wind, X } from 'lucide-react';
import { products, categories, fa, type Product, type QuoteItem } from '../lib/catalog';
import { useQuoteCart } from '../lib/use-quote-cart';
import { businessContacts } from '../lib/contacts';
import type { Guide } from '../lib/guides';
import type { PublicNews } from '../lib/news';
import type { RequestKind } from '../lib/management-model';
import Brand from '../components/brand';
import SiteHeader from '../components/site-header';
import MaterialShowcase from '../components/material-showcase';
import ProductMedia from '../components/product-media';
import CatalogBrowser from '../components/catalog-browser';
import Modal from '../components/modal';
import { ProductModal, QuoteModal } from '../components/commerce-dialogs';

const applications = [
  { title: 'تأسیسات و تهویه', icon: Wind, filter: 'elastomeric', product: 'EL-T', heading: 'برای لوله‌ها و کانال‌های پروژه', description: 'برای خطوط سرمایش و گرمایش یا کانال هوا، از خانواده عایق‌های الاستومری شروع کنید. دمای کار، رطوبت و قطر لوله، انتخاب نهایی را مشخص می‌کنند.', tags: ['خطوط آب سرد و گرم', 'کانال هوا', 'موتورخانه'] },
  { title: 'ساختمان و معماری', icon: Building2, filter: 'glasswool', product: 'VN-1221', heading: 'برای سقف، جداره و آسایش ساختمان', description: 'برای عایق‌کاری سقف و جداره، فرم‌های مختلف پشم شیشه را بررسی کنید. نیاز حرارتی و صوتی، ضخامت و جزئیات اجرای پروژه را با ما در میان بگذارید.', tags: ['سقف و جداره', 'ساختمان مسکونی', 'فضاهای تجاری'] },
  { title: 'صنعت و خطوط فرایند', icon: Factory, filter: 'rockwool', product: 'VN-1220', heading: 'برای شرایط کاری پروژه‌های صنعتی', description: 'برای تجهیزات و خطوط گرم، خانواده پشم سنگ را بررسی کنید. دمای فرایند، دانسیته و پوشش محافظ باید بر اساس مشخصات فنی مدل منتخب تأیید شوند.', tags: ['خطوط گرم', 'تجهیزات صنعتی', 'مخازن'] },
];
const quickCategories = [
  { id: 'glasswool', product: 'VN-1221', name: 'پشم شیشه', note: 'سقف، جداره و تأسیسات' },
  { id: 'rockwool', product: 'VN-1220', name: 'پشم سنگ', note: 'کاربردهای حرارتی و صوتی' },
  { id: 'elastomeric', product: 'EL-R', name: 'عایق الاستومری', note: 'سرمایش، گرمایش و تهویه' },
  { id: 'polymer', product: 'VN-1218', name: 'فوم پلی‌اتیلن', note: 'زیرسازی و عایق‌کاری عمومی' },
];
const questions = [
  { question: 'نمی‌دانم کدام عایق برای پروژه‌ام مناسب است؛ از کجا شروع کنم؟', answer: 'کاربرد عایق، محل نصب و شرایط دما و رطوبت را در درخواست مشاوره بنویسید. اگر اندازه‌ها یا نقشه پروژه را آماده دارید، هنگام گفت‌وگو با کارشناسان مطرح کنید تا گزینه‌های مناسب بررسی شوند.' },
  { question: 'چطور قیمت و پیش‌فاکتور دریافت کنم؟', answer: 'محصول را انتخاب کنید و ضخامت، مقدار و مشخصات مورد نیاز را به سبد استعلام اضافه کنید. سپس اطلاعات تماس و شهر تحویل را ثبت کنید. قیمت، موجودی و شرایط تأمین پس از بررسی در پیش‌فاکتور اعلام می‌شوند.' },
  { question: 'مقدار عایق مورد نیاز را چطور حساب کنم؟', answer: 'در محاسبه‌گر، نوع متریال و ابعاد سطح، رول یا ورق را وارد کنید. برآورد تعداد، هم‌پوشانی و برنامه برش نمایش داده می‌شود. ابعاد واقعی محصول و شرایط اجرا باید پیش از سفارش تأیید شوند.' },
  { question: 'بعد از ثبت استعلام، چطور درخواست را پیگیری کنم؟', answer: 'پس از ثبت موفق، کد و پیوند اختصاصی پیگیری دریافت می‌کنید. از همان پیوند، وضعیت و خلاصه درخواست را ببینید یا چاپ کنید. برای هماهنگی بیشتر نیز می‌توانید با مدیران پاداش تماس بگیرید.' },
];

type Props = { news?: Pick<PublicNews, 'id' | 'title' | 'summary' | 'kind' | 'published_at'>[]; newsUnavailable?: boolean; featuredGuides?: Pick<Guide, 'slug' | 'title' | 'category' | 'minutes'>[] };

export default function Storefront({ news = [], featuredGuides = [] }: Props) {
  const { cart, setCart } = useQuoteCart();
  const [category, setCategory] = useState('all');
  const [catalogReset, setCatalogReset] = useState(0);
  const [heroQuery, setHeroQuery] = useState('');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [detail, setDetail] = useState<Product | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteKind, setQuoteKind] = useState<RequestKind>('consultation');
  const [info, setInfo] = useState<'privacy' | 'terms' | 'about' | null>(null);
  const [application, setApplication] = useState(0);
  const [toast, setToast] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const selected = applications[application];

  useEffect(() => {
    const hero = document.getElementById('home-intro');
    if (!hero || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setShowQuickActions(!entry.isIntersecting && entry.boundingClientRect.bottom < 0));
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(''), 5000); return () => clearTimeout(timer); } }, [toast]);

  function openQuote(kind?: RequestKind) { setQuoteKind(kind || (cart.length ? 'order' : 'consultation')); setQuoteOpen(true); }
  function add(item: QuoteItem) {
    setCart(previous => {
      const index = previous.findIndex(line => line.productId === item.productId && line.thickness === item.thickness && line.note === item.note);
      return index < 0 ? [...previous, item] : previous.map((line, i) => i === index ? { ...line, quantity: Math.min(100000, line.quantity + item.quantity) } : line);
    });
    setDetail(null); setToast('محصول به سبد استعلام اضافه شد');
  }
  function toggleCompare(id: string) {
    if (compare.includes(id)) setCompare(compare.filter(value => value !== id));
    else if (compare.length < 3) setCompare([...compare, id]);
    else setToast('حداکثر ۳ محصول را می‌توانید مقایسه کنید');
  }
  function jumpFilter(filter: string, query = '') {
    setCategory(filter); setCatalogQuery(query); setCatalogReset(value => value + 1);
    const target = document.getElementById('catalog-heading');
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }
  function search(event: FormEvent) { event.preventDefault(); jumpFilter('all', heroQuery.trim()); }
  function moveApplication(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === 'ArrowLeft') next = (index + 1) % applications.length;
    else if (event.key === 'ArrowRight') next = (index + applications.length - 1) % applications.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = applications.length - 1;
    else return;
    event.preventDefault(); setApplication(next); document.getElementById('application-tab-' + next)?.focus();
  }

  return <>
    <a href="#main" className="skip-link">رفتن به محتوای اصلی</a>
    <div className="topbar"><div className="container"><span>همراه شما، از انتخاب عایق تا تأمین پروژه</span><a className="topbar-contact" href={businessContacts[0].href}><Phone size={13}/><span>مشاوره مستقیم</span><bdi>{businessContacts[0].displayPhone}</bdi></a></div></div>
    <SiteHeader onQuote={() => openQuote()} cartCount={cart.length}/>
    <main id="main">
      <div className="hero-band" id="home-intro"><section className="hero container" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <div className="hero-kicker"><span/>بازرگانی پاداش · عایق و ملزومات پروژه</div>
          <h1 id="hero-heading">انتخاب درست عایق،<br/><span>شروع یک پروژه مطمئن.</span></h1>
          <p>عایق مناسب پروژه‌تان را پیدا کنید، مشخصات را مقایسه کنید و برای قیمت و تأمین، مستقیم با ما در ارتباط باشید.</p>
          <div className="hero-buttons"><a href="#catalog" className="button button-orange">مشاهده محصولات<ArrowLeft size={19}/></a><button className="button button-outline" onClick={() => openQuote('consultation')}><Headphones size={19}/>کمک برای انتخاب عایق</button></div>
          <form className="hero-search" role="search" onSubmit={search}><Search size={20}/><input aria-label="جست‌وجوی سریع محصول" type="search" placeholder="دنبال چه محصولی می‌گردید؟" value={heroQuery} onChange={event => setHeroQuery(event.target.value)}/><button type="submit" aria-label="جست‌وجو در کاتالوگ"><ArrowLeft size={20}/></button></form>
          <div className="hero-search-suggestions"><span>پرکاربرد:</span>{quickCategories.slice(0, 3).map(item => <button key={item.id} onClick={() => jumpFilter(item.id)}>{item.name}</button>)}</div>
        </div>
        <MaterialShowcase/>
      </section></div>

      <section className="benefits container" aria-label="خدمات پاداش">{[
        { icon: Headphones, title: 'مشاوره برای انتخاب', note: 'متناسب با شرایط پروژه شما' },
        { icon: Layers3, title: 'مقایسه مشخصات', note: 'انتخاب آگاهانه پیش از سفارش' },
        { icon: FileText, title: 'پیش‌فاکتور روشن', note: 'قیمت و شرایط تأمین مشخص' },
        { icon: Truck, title: 'هماهنگی تأمین', note: 'با توجه به مقصد و زمان پروژه' },
      ].map(item => <div key={item.title}><item.icon/><span><b>{item.title}</b><small>{item.note}</small></span></div>)}</section>

      <section className="category-section section container" aria-labelledby="categories-heading">
        <div className="section-heading"><div><span className="section-kicker">از اینجا شروع کنید</span><h2 id="categories-heading">برای هر نیاز، یک انتخاب مناسب.</h2></div><a className="text-button" href="/products">همه دسته‌بندی‌ها<ArrowLeft size={18}/></a></div>
        <div className="category-tiles">{quickCategories.map(item => <button className="category-tile" key={item.id} onClick={() => jumpFilter(item.id)}><span className="category-tile-image"><ProductMedia product={products.find(product => product.id === item.product)!}/></span><span className="category-tile-copy"><strong>{item.name}</strong><small>{item.note}</small></span><ArrowUpLeft size={21}/></button>)}</div>
      </section>

      <section className="catalog section container" id="catalog" aria-labelledby="catalog-heading">
        <div className="section-heading"><div><span className="section-kicker">کاتالوگ محصولات</span><h2 id="catalog-heading" tabIndex={-1}>محصولات را دقیق‌تر ببینید.</h2><p>مشخصات را بررسی کنید و محصول مورد نیاز را به سبد استعلام اضافه کنید.</p></div><a className="text-button" href="/products">کاتالوگ کامل<ArrowLeft size={18}/></a></div>
        <CatalogBrowser key={catalogReset} compact initialQuery={catalogQuery} category={category} onCategoryChange={setCategory} onInspect={setDetail} onCompare={toggleCompare} compared={compare}/>
        <div className="catalog-help"><span className="catalog-help-icon"><Headphones size={26}/></span><div><h3>هنوز برای انتخاب مطمئن نیستید؟</h3><p>درباره کاربرد و شرایط پروژه‌تان بگویید؛ با هم گزینه‌ها را بررسی می‌کنیم.</p></div><button className="text-button" onClick={() => openQuote('consultation')}>درخواست مشاوره<ArrowLeft size={18}/></button></div>
      </section>

      <section className="project-section" id="solutions"><div className="container">
        <div className="section-heading"><div><span className="section-kicker">انتخاب بر اساس کاربرد</span><h2>برای کدام بخش پروژه عایق می‌خواهید؟</h2></div><span className="project-section-note">یک نقطه شروع برای انتخاب بهتر</span></div>
        <div className="project-tabs" role="tablist" aria-label="کاربرد عایق">{applications.map((item, index) => <button id={'application-tab-' + index} key={item.filter} role="tab" aria-selected={index === application} aria-controls="application-panel" tabIndex={index === application ? 0 : -1} onClick={() => setApplication(index)} onKeyDown={event => moveApplication(event, index)}><item.icon size={23}/>{item.title}<ArrowUpLeft size={18}/></button>)}</div>
        <div className="project-panel" id="application-panel" role="tabpanel" aria-labelledby={'application-tab-' + application} tabIndex={0}>
          <div className="project-panel-copy"><span className="project-panel-label">{selected.title}</span><h3>{selected.heading}</h3><p>{selected.description}</p><div className="project-tags">{selected.tags.map(tag => <span key={tag}>{tag}</span>)}</div><button className="button button-dark" onClick={() => jumpFilter(selected.filter)}>بررسی محصولات مرتبط<ArrowLeft size={18}/></button></div>
          <div className="project-panel-visual"><span className="project-visual-circle"/><ProductMedia product={products.find(product => product.id === selected.product)!}/><span className="project-visual-caption">انتخاب نهایی بر اساس مشخصات فنی پروژه</span></div>
        </div>
      </div></section>

      <section className="estimator-banner container" id="estimator"><div className="estimator-banner-icon"><Calculator size={42} strokeWidth={1.4}/><span dir="ltr">m²</span></div><div><span className="section-kicker">قبل از سفارش، دقیق‌تر برآورد کنید</span><h2>چقدر عایق نیاز دارید؟</h2><p>ابعاد پروژه را وارد کنید؛ تعداد رول یا ورق و برنامه برش را ببینید.</p></div><a className="button button-orange" href="/calculator">محاسبه مقدار مورد نیاز<ArrowLeft size={19}/></a></section>

      <section className="process section container"><div className="section-heading"><div><span className="section-kicker">ساده، روشن، قابل پیگیری</span><h2>تا دریافت پیش‌فاکتور، سه قدم فاصله دارید.</h2></div></div><div className="process-grid">{[
        { n: '۰۱', title: 'محصول را انتخاب کنید', description: 'مشخصات و مقدار مورد نیازتان را به سبد استعلام اضافه کنید.', icon: Layers3 },
        { n: '۰۲', title: 'درخواست را ثبت کنید', description: 'اطلاعات تماس و شهر تحویل را وارد کنید و کد پیگیری بگیرید.', icon: ClipboardList },
        { n: '۰۳', title: 'پیشنهاد تأمین بگیرید', description: 'قیمت و شرایط نهایی پس از بررسی، در پیش‌فاکتور مشخص می‌شود.', icon: FileText },
      ].map(item => <div className="process-step" key={item.n}><span className="step-number">{item.n}</span><item.icon size={25}/><h3>{item.title}</h3><p>{item.description}</p></div>)}</div></section>

      {featuredGuides.length > 0 && <section className="knowledge section container" id="knowledge"><div className="section-heading"><div><span className="section-kicker">با آگاهی انتخاب کنید</span><h2>کمی بیشتر بدانید، بهتر انتخاب کنید.</h2></div><a className="text-button" href="/guides">همه راهنماها<ArrowLeft size={18}/></a></div><div className="guide-grid">{featuredGuides.map((guide, index) => <a className="guide-card" href={'/guides/' + guide.slug} key={guide.slug}><div className={'guide-visual guide-visual-' + index}>{index === 0 ? <Calculator size={52} strokeWidth={1.2}/> : index === 1 ? <Layers3 size={52} strokeWidth={1.2}/> : <BookOpen size={52} strokeWidth={1.2}/>}<span>{['اندازه‌گیری دقیق‌تر', 'انتخاب آگاهانه‌تر', 'شناخت بهتر متریال'][index]}</span><b>{fa(index + 1).padStart(2, '۰')}</b></div><div className="guide-meta"><span>{guide.category}</span><span>{fa(guide.minutes)} دقیقه مطالعه</span></div><h3>{guide.title}</h3><span className="guide-more">مطالعه راهنما<ArrowUpLeft size={18}/></span></a>)}</div></section>}

      <section className="faq-section section container" aria-labelledby="faq-heading"><div className="faq-intro"><span className="section-kicker">پاسخ چند سؤال رایج</span><h2 id="faq-heading">با خیال روشن‌تری<br/>تصمیم بگیرید.</h2><p>سؤال دیگری دارید؟<br/>برای گفت‌وگو درباره پروژه در کنارتان هستیم.</p><a className="text-button" href="#contact">ارتباط با پاداش<ArrowLeft size={18}/></a></div><div className="faq-list">{questions.map(item => <details key={item.question}><summary>{item.question}<ChevronDown size={20}/></summary><p>{item.answer}</p></details>)}</div></section>

      {news.length > 0 && <section className="section container home-news" id="news"><div className="section-heading"><div><span className="section-kicker">تازه‌های پاداش</span><h2>اخبار و رویدادها</h2></div><a href="/news" className="text-button">همه خبرها<ArrowLeft size={18}/></a></div><div className="home-news-grid">{news.map(item => <article className="home-news-card" key={item.id}><span className="mini-label">{item.kind === 'event' ? 'رویداد' : 'خبر و اطلاعیه'}</span><time dateTime={item.published_at!}>{new Date(item.published_at!).toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran', dateStyle: 'medium' })}</time><h3><a href={'/news/' + item.id}>{item.title}</a></h3><p>{item.summary}</p><a className="text-button" href={'/news/' + item.id}>ادامه مطلب<ArrowLeft size={16}/></a></article>)}</div></section>}

      <section className="business-contact section container" id="contact" aria-labelledby="contact-heading"><div className="contact-heading"><div><span className="section-kicker">یک گفت‌وگوی خوب، یک انتخاب بهتر</span><h2 id="contact-heading">درباره پروژه‌تان صحبت کنیم.</h2><p>برای مشاوره، استعلام قیمت و هماهنگی تأمین، مستقیم با ما در ارتباط باشید.</p></div><span className="contact-heading-icon"><Headphones size={40} strokeWidth={1.3}/></span></div><div className="business-contact-grid">{businessContacts.map(contact => <a className="manager-card" href={contact.href} key={contact.phone} aria-label={'تماس با ' + contact.name + '، ' + contact.displayPhone}><span className="manager-icon"><Phone size={23}/></span><div className="manager-info"><h3>{contact.name}</h3><p>مشاوره و هماهنگی تأمین</p></div><div className="manager-call"><bdi className="manager-number">{contact.displayPhone}</bdi><span>تماس مستقیم<ArrowUpLeft size={16}/></span></div></a>)}</div><div className="contact-online"><span><ShieldCheck size={19}/>ترجیح می‌دهید نیاز پروژه را آنلاین بفرستید؟</span><button className="text-button" onClick={() => openQuote()}>ثبت درخواست و دریافت کد پیگیری<ArrowLeft size={18}/></button></div></section>
    </main>

    <footer className="footer"><div className="container footer-main"><div className="footer-about"><Brand/><p>همراه انتخاب و تأمین عایق‌های حرارتی و برودتی؛<br/>برای آسایش امروز و انرژی فردا.</p><span className="footer-en" dir="ltr">BETTER MATERIALS. BETTER BUILDING.</span></div><div><h4>محصولات پاداش</h4>{categories.slice(1).map(item => <button key={item.id} onClick={() => jumpFilter(item.id)}>{item.name}</button>)}</div><div><h4>همراه پروژه شما</h4><a href="/calculator">محاسبه مقدار عایق</a><a href="/guides">راهنمای خرید</a><a href="/news">اخبار و رویدادها</a><button onClick={() => setInfo('about')}>درباره پاداش</button></div><div className="footer-contact"><h4>شروع یک همکاری</h4><p>مشخصات پروژه را بفرستید تا گزینه‌های تأمین را بررسی کنیم.</p><button className="button button-orange" onClick={() => openQuote()}>ثبت استعلام<ArrowLeft size={18}/></button><a href="#contact">تماس مستقیم با مدیران<ArrowUpLeft size={15}/></a></div></div><div className="container footer-bottom"><span>© بازرگانی پاداش · تمامی حقوق محفوظ است.</span><div><button onClick={() => setInfo('privacy')}>حریم خصوصی</button><button onClick={() => setInfo('terms')}>شرایط استعلام</button><a href="/management">ورود مدیریت</a></div></div></footer>

    {showQuickActions && !quoteOpen && !detail && !compareOpen && !info && compare.length === 0 && <aside className="mobile-project-actions" aria-label="دسترسی سریع تماس و استعلام"><a href={businessContacts[0].href}><Phone size={20}/><span>تماس با پاداش</span></a><button className="button button-orange" onClick={() => openQuote()}><ClipboardList size={18}/>{cart.length ? 'سبد استعلام (' + fa(cart.length) + ')' : 'مشاوره و استعلام'}<ArrowLeft size={17}/></button></aside>}
    {compare.length > 0 && <aside className="compare-dock" aria-label="سبد مقایسه"><div><Scale size={20}/><span>{fa(compare.length)} محصول برای مقایسه</span></div><button className="button button-dark" disabled={compare.length < 2} onClick={() => setCompareOpen(true)}>{compare.length < 2 ? 'یک محصول دیگر انتخاب کنید' : 'مقایسه محصولات'}<ArrowLeft size={15}/></button><button className="icon-button" aria-label="پاک کردن مقایسه" onClick={() => setCompare([])}><X size={18}/></button></aside>}
    {toast && <div className="toast" role="status"><CheckCheck size={20}/>{toast}{cart.length > 0 && <button className="toast-action" onClick={() => { setToast(''); openQuote('order'); }}>مشاهده سبد<ArrowLeft size={16}/></button>}<button aria-label="بستن پیام" onClick={() => setToast('')}><X size={17}/></button></div>}
    {detail && <ProductModal product={detail} onClose={() => setDetail(null)} onAdd={add}/>}
    {quoteOpen && <QuoteModal initialKind={quoteKind} cart={cart} setCart={setCart} onClose={() => setQuoteOpen(false)}/>}
    {compareOpen && <Modal title="مقایسه محصولات" wide onClose={() => setCompareOpen(false)}><div className="compare-table-wrap"><table className="compare-table"><thead><tr><th>مشخصات</th>{compare.map(id => <th key={id}>{products.find(product => product.id === id)!.name}</th>)}</tr></thead><tbody>{[['material', 'جنس عایق'], ['form', 'شکل عرضه'], ['use', 'کاربرد عمومی'], ['cover', 'پوشش قابل درخواست'], ['thicknesses', 'ضخامت‌ها (میلی‌متر)'], ['unit', 'واحد سفارش']].map(([key, label]) => <tr key={key}><th>{label}</th>{compare.map(id => { const value = products.find(product => product.id === id)![key as keyof Product]; return <td key={id}>{Array.isArray(value) ? (value.length ? (value as number[]).map(fa).join('، ') : 'طبق مشخصات درخواست') : String(value ?? '—')}</td>; })}</tr>)}<tr><th>انتخاب</th>{compare.map(id => <td key={id}><button className="button button-orange" onClick={() => { setCompareOpen(false); setDetail(products.find(product => product.id === id)!); }}>جزئیات و استعلام</button></td>)}</tr></tbody></table></div><p className="modal-note">این مقایسه در سطح خانواده محصولات است؛ دمای مجاز، ضریب هدایت حرارتی و گواهی‌ها باید از دیتاشیت برند منتخب تأیید شوند.</p></Modal>}
    {info && <Modal title={{ privacy: 'حریم خصوصی', terms: 'شرایط استعلام', about: 'درباره بازرگانی پاداش' }[info]} onClose={() => setInfo(null)}><div className="article-content">{info === 'about' ? <><p>بازرگانی پاداش، بستری برای انتخاب و استعلام عایق‌های حرارتی و برودتی در پروژه‌های ساختمانی، تأسیساتی و صنعتی است.</p><p>در این سامانه می‌توانید خانواده‌های عایق را بررسی کنید، محصولات را مقایسه کنید و نیاز پروژه خود را به‌صورت ساختاریافته ثبت کنید.</p><p>کاتالوگ پاداش شامل عایق‌های حرارتی و صوتی، روکش‌ها، توری و ورق‌های محافظ است. برند، موجودی، مشخصات قطعی و شرایط تأمین در پیش‌فاکتور رسمی تعیین می‌شوند. تصاویر هر گروه برای معرفی محصول هستند.</p></> : info === 'privacy' ? <><p>نام، شماره تماس، شهر و اطلاعات پروژه صرفاً برای ثبت و بررسی درخواست تأمین دریافت می‌شوند و در پایگاه داده سامانه نگهداری می‌شوند.</p><p>سبد استعلام در مرورگر شما ذخیره می‌شود؛ اطلاعات تماس در حافظه محلی مرورگر ذخیره نمی‌شوند. برای محدودکردن ارسال‌های تکراری، شناسه درهم‌سازی‌شده شبکه ذخیره می‌شود.</p><p>پیوند پیگیری درخواست محرمانه است؛ آن را فقط با افراد مرتبط با پروژه به اشتراک بگذارید. اطلاعات تماس در صفحه پیگیری عمومی نمایش داده نمی‌شود. پیش از بهره‌برداری عمومی، مسیر رسمی درخواست حذف یا اصلاح داده باید توسط شرکت معرفی شود.</p></> : <><p>ارسال درخواست به معنی خرید قطعی، رزرو موجودی یا تعهد به قیمت و زمان تحویل نیست.</p><p>قیمت، موجودی، برند، مشخصات فنی، هزینه حمل، مالیات و شرایط پرداخت در پیش‌فاکتور رسمی تأیید می‌شوند.</p><p>مقادیر ابزار برآورد و تصاویر محصولات جنبه راهنما دارند. تناسب محصول، ضخامت و پوشش با شرایط پروژه باید توسط مسئول فنی تأیید شود.</p></>}</div></Modal>}
  </>;
}