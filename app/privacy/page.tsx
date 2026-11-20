import Link from 'next/link';
import CompanyPageIntro from '../../components/company-page-intro';
import styles from '../../components/company-pages.module.css';
import PublicPage from '../../components/public-page';
import { companyPages } from '../../lib/company-pages';
import { pageMetadata } from '../../lib/seo';

const page = companyPages.privacy;
export const metadata = pageMetadata(page.seoTitle, page.description, page.path);

export default function PrivacyPage() {
  return <PublicPage>
    <CompanyPageIntro page={page}/>
    <article className={`${styles.section} ${styles.panel} ${styles.prose} ${styles.policy}`} aria-label={page.label}>
      <section>
        <h2>اطلاعات فرم استعلام</h2>
        <p>هنگام ارسال فرم، نام، شماره تماس، شهر تحویل، نام اختیاری شرکت و مشخصات و اقلام پروژه را دریافت می‌کنیم. این اطلاعات در سامانه ذخیره می‌شوند و مدیران فروش از آن‌ها برای بررسی درخواست، تماس و هماهنگی تأمین استفاده می‌کنند.</p>
        <p>سامانه برای محدود کردن ارسال‌های تکراری از شناسهٔ درهم‌سازی‌شدهٔ شبکه استفاده می‌کند.</p>
      </section>
      <section>
        <h2>سبد استعلام در مرورگر</h2>
        <p>اقلام و توضیحات سبد در حافظهٔ محلی مرورگر نگهداری می‌شوند تا در مراجعهٔ بعدی در دسترس باشند. نام و شماره‌ای که در فیلدهای تماس وارد می‌کنید در این حافظه ذخیره نمی‌شوند. می‌توانید اقلام را از سبد حذف کنید یا داده‌های سایت را از تنظیمات مرورگر پاک کنید.</p>
      </section>
      <section>
        <h2>رسید و پیوند پیگیری</h2>
        <p>رسید، خلاصه و وضعیت درخواست را نشان می‌دهد. شماره تماس و شرح اختصاصی پروژه در رسید دیده نمی‌شوند. هر کس پیوند اختصاصی را داشته باشد می‌تواند رسید را باز کند. پیوند را فقط با افراد مرتبط با پروژه به اشتراک بگذارید.</p>
      </section>
      <section>
        <h2>سؤال دربارهٔ اطلاعات یک درخواست</h2>
        <p>برای پرسش یا درخواست بررسی و اصلاح اطلاعات، از صفحهٔ <Link href="/contact">تماس با ما</Link> با مدیران در ارتباط باشید و کد پیگیری را آماده داشته باشید.</p>
      </section>
    </article>
  </PublicPage>;
}
