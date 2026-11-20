import Image from 'next/image';
import Link from 'next/link';
import AboutContent from '../../components/about-content';
import CompanyPageIntro from '../../components/company-page-intro';
import styles from '../../components/company-pages.module.css';
import PublicPage from '../../components/public-page';
import { BRAND_LOGO } from '../../lib/brand-assets';
import { companyPages } from '../../lib/company-pages';
import { insulationTopics } from '../../lib/insulation-topics';
import { pageMetadata } from '../../lib/seo';

const page = companyPages.about;
export const metadata = pageMetadata(page.seoTitle, page.description, page.path);

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
    <section className={styles.callout} aria-labelledby="about-contact">
      <div><h2 id="about-contact">برای پروژه‌تان راهنمایی می‌خواهید؟</h2><p>کاربرد، ابعاد و شرایط محل نصب را با ما در میان بگذارید تا گزینه‌های تأمین را بررسی کنیم.</p></div>
      <Link className="button button-orange" href="/contact">تماس با ما</Link>
    </section>
  </PublicPage>;
}
