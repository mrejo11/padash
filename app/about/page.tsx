import Image from 'next/image';
import Link from 'next/link';
import AboutContent from '../../components/about-content';
import CompanyPageIntro from '../../components/company-page-intro';
import InquiryAction from '../../components/inquiry-action';
import styles from '../../components/company-pages.module.css';
import PublicPage from '../../components/public-page';
import { BRAND_LOGO } from '../../lib/brand-assets';
import { companyPages } from '../../lib/company-pages';
import { businessReferences, businessServices } from '../../lib/business-profile';
import { insulationTopics } from '../../lib/insulation-topics';
import { pageMetadata } from '../../lib/seo';

const page = companyPages.about;
export const metadata = pageMetadata(page.seoTitle, page.description, page.path);

const references = [
  { id: 'projects', title: 'پروژه‌ها و سوابق اجرایی', entries: businessReferences.projects },
  { id: 'suppliers', title: 'برندها و تأمین‌کنندگان', entries: businessReferences.suppliers },
  { id: 'credentials', title: 'گواهینامه‌ها و استانداردها', entries: businessReferences.credentials },
];

export default function AboutPage() {
  return <PublicPage>
    <CompanyPageIntro page={page} visual={
      <div className={styles.logoPlate}>
        <Image src={BRAND_LOGO} alt="لوگوی بازرگانی پاداش" width={212} height={212}/>
      </div>
    }/>
    <div className={styles.aboutGrid}>
      <article className={`${styles.panel} ${styles.prose}`} aria-label="معرفی بازرگانی پاداش">
        <AboutContent/>
      </article>
      <aside className={styles.aboutLinks} aria-labelledby="project-options">
        <h2 id="project-options">عایق را بر اساس کاربرد انتخاب کنید</h2>
        <ul>{insulationTopics.map(topic => <li key={topic.id}><Link href={topic.path}>{topic.name}</Link></li>)}</ul>
        <Link href="/products">همهٔ محصولات</Link>
      </aside>
    </div>
    <section className={styles.section} aria-labelledby="business-services">
      <h2 id="business-services">خدمات برای صنایع و گروه‌های تخصصی</h2>
      <ul className={styles.serviceList}>{businessServices.map(service => <li className={styles.panel} key={service.title}>
        <h3>{service.title}</h3><p>{service.description}</p>
      </li>)}</ul>
    </section>
    {references.filter(section => section.entries.length > 0).map(section => <section className={styles.section} key={section.id} aria-labelledby={section.id}>
      <h2 id={section.id}>{section.title}</h2>
      <ul className={styles.serviceList}>{section.entries.map(entry => <li className={styles.panel} key={entry.title}>
        <h3>{entry.url ? <a href={entry.url}>{entry.title}</a> : entry.title}</h3><p>{entry.description}</p>
      </li>)}</ul>
    </section>)}
    <section className={styles.callout} aria-labelledby="about-contact">
      <div><h2 id="about-contact">برای پروژه‌تان راهنمایی می‌خواهید؟</h2><p>کاربرد، ابعاد و شرایط محل نصب را با ما در میان بگذارید تا گزینه‌های تأمین را بررسی کنیم.</p></div>
      <InquiryAction topic="مشاوره تخصصی و بررسی تأمین پروژه" label="مشاوره تخصصی و استعلام"/>
    </section>
  </PublicPage>;
}
