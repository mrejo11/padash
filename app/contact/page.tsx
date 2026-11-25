import Link from 'next/link';
import { Phone } from 'lucide-react';
import CompanyPageIntro from '../../components/company-page-intro';
import styles from '../../components/company-pages.module.css';
import InquiryAction from '../../components/inquiry-action';
import PublicPage from '../../components/public-page';
import { companyPages } from '../../lib/company-pages';
import { businessContacts } from '../../lib/contacts';
import { pageMetadata } from '../../lib/seo';
import { WhatsAppLink } from '../../components/whatsapp-link';
import { whatsappUrl } from '../../lib/whatsapp';

const page = companyPages.contact;
export const metadata = pageMetadata(page.seoTitle, page.description, page.path);

export default function ContactPage() {
  return <PublicPage>
    <CompanyPageIntro page={page}/>
    <section className={styles.section} aria-labelledby="contact-team">
      <h2 id="contact-team">شماره تماس مدیران</h2>
      <ul className={styles.contactGrid}>{businessContacts.map(contact => <li key={contact.phone}>
        <a className={styles.contactCard} href={contact.href} aria-label={`تماس با ${contact.name}، ${contact.displayPhone}`}>
          <span className={styles.phoneIcon}><Phone size={23} aria-hidden="true"/></span>
          <span className={styles.contactName}>{contact.name}</span>
          <bdi dir="ltr" className={styles.contactNumber}>{contact.displayPhone}</bdi>
        </a>
      </li>)}</ul>
    </section>
    <div className={`${styles.section} ${styles.contactGrid}`}>
      <section id="online-request" className={`${styles.panel} ${styles.onlinePanel}`} aria-labelledby="online-heading">
        <h2 id="online-heading">ثبت درخواست آنلاین</h2>
        <p>مشخصات پروژه را بفرستید. پس از ثبت موفق، کد و پیوند اختصاصی برای مشاهدهٔ وضعیت درخواست دریافت می‌کنید.</p>
        <InquiryAction topic="مشاوره انتخاب و تأمین عایق" label="ثبت درخواست و دریافت کد پیگیری" formSource="contact"/>
        <WhatsAppLink href={whatsappUrl('سلام، برای مشاوره درباره انتخاب و تأمین عایق پیام می‌دهم.')} label="مشاوره در واتس‌اپ"/>
        <Link href="/quote-terms">مراحل و شرایط استعلام</Link>
      </section>
      <section className={styles.panel} aria-labelledby="contact-checklist">
        <h2 id="contact-checklist">پیش از تماس چه چیزهایی آماده کنیم؟</h2>
        <ul className={styles.checklist}>
          <li>محل نصب و نوع نیاز به عایق‌کاری</li>
          <li>نام محصول، مقدار، ابعاد و در صورت نیاز ضخامت، دانسیته یا روکش</li>
          <li>شهر تحویل و زمان مورد نیاز پروژه</li>
        </ul>
        <Link href="/calculator">محاسبهٔ مقدار مورد نیاز</Link>
      </section>
    </div>
  </PublicPage>;
}
