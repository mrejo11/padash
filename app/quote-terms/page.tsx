import Link from 'next/link';
import CompanyPageIntro from '../../components/company-page-intro';
import styles from '../../components/company-pages.module.css';
import PublicPage from '../../components/public-page';
import { companyPages } from '../../lib/company-pages';
import { pageMetadata } from '../../lib/seo';

const page = companyPages.terms;
export const metadata = pageMetadata(page.seoTitle, page.description, page.path);

export default function QuoteTermsPage() {
  return <PublicPage>
    <CompanyPageIntro page={page}/>
    <article className={`${styles.section} ${styles.panel} ${styles.prose} ${styles.policy}`} aria-label={page.label}>
      <section>
        <h2>ثبت استعلام یا درخواست مشاوره</h2>
        <p>برای استعلام محصول، اقلام را از <Link href="/products">کاتالوگ</Link> انتخاب کنید و مقدار، ابعاد و مشخصات مورد نیاز را در سبد بنویسید. اگر هنوز محصول را انتخاب نکرده‌اید، کاربرد عایق، محل نصب و زمان مورد نیاز را در درخواست مشاوره توضیح دهید.</p>
      </section>
      <section>
        <h2>رسید ثبت و پیگیری درخواست</h2>
        <p>پس از ثبت موفق، کد و پیوند اختصاصی دریافت می‌کنید. با همان پیوند می‌توانید وضعیت درخواست را ببینید و رسید را چاپ کنید. ثبت استعلام به معنی خرید قطعی، رزرو موجودی یا تعهد به قیمت و زمان تحویل نیست.</p>
      </section>
      <section>
        <h2>مواردی که در پیش‌فاکتور تأیید می‌شوند</h2>
        <p>قیمت، موجودی، برند، مشخصات فنی، زمان تحویل، هزینهٔ حمل، مالیات و شرایط پرداخت پس از بررسی درخواست در پیش‌فاکتور تأیید می‌شوند.</p>
      </section>
      <section>
        <h2>برآورد مقدار و مشخصات سفارش</h2>
        <p>مقادیر <Link href="/calculator">محاسبه‌گر</Link> و تصاویر کاتالوگ برای برآورد اولیه‌اند. پیش از سفارش، ابعاد واقعی، ضخامت، روکش و تناسب محصول را با مسئول فنی پروژه بررسی کنید.</p>
      </section>
    </article>
    <section className={styles.callout} aria-labelledby="start-inquiry">
      <div><h2 id="start-inquiry">درخواست استعلام دارید؟</h2><p>مشخصات پروژه را بفرستید یا برای بررسی اولیه با مدیران تماس بگیرید.</p></div>
      <Link className="button button-orange" href="/contact#online-request">راه‌های ثبت استعلام</Link>
    </section>
  </PublicPage>;
}
