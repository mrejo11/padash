import type { ReactNode } from 'react';
import { ArrowLeft, Phone } from 'lucide-react';
import { businessContacts } from '../lib/contacts';
import '../app/storefront-theme.css';
import '../app/content.css';

export default function PublicPage({ children }: { children: ReactNode }) {
  return <div className="storefront public-page"><a className="skip-link" href="#content">رفتن به محتوای اصلی</a>
    <header className="public-header"><div className="container"><a href="/" className="brand"><img src="/favicon.svg" alt="" width={42} height={42}/><span><b>پاداش<span className="brand-dot">.</span></b><small>بازرگانی پاداش · عایق حرارتی و برودتی</small></span></a>
      <nav aria-label="منوی مطالب"><a href="/products">محصولات</a><a href="/guides">راهنماها</a><a href="/calculator">محاسبه عایق</a><a href="/news">اخبار و رویدادها</a><a href="/#contact">تماس با مدیران</a></nav></div></header>
    <main id="content" className="container public-main">{children}</main>
    <footer className="public-footer"><div className="container"><div><b>بازرگانی پاداش</b><p>همراه انتخاب و تأمین عایق پروژه شما.</p><a href="/">بازگشت به صفحه اصلی<ArrowLeft size={14}/></a></div>
      <div className="public-footer-contacts">{businessContacts.map(contact => <a key={contact.phone} href={contact.href}><Phone size={15}/><span>{contact.name}</span><bdi>{contact.displayPhone}</bdi></a>)}</div></div></footer>
  </div>;
}
