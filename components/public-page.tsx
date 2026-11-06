import type { ReactNode } from 'react';
import { ArrowLeft, Phone } from 'lucide-react';
import { businessContacts } from '../lib/contacts';
import SiteHeader from './site-header';
import Brand from './brand';
import '../app/storefront-theme.css';
import '../app/content.css';
import '../app/catalog.css';
import '../app/storefront-polish.css';
import '../app/storefront-redesign.css';

export default function PublicPage({ children }: { children: ReactNode }) {
  return <div className="storefront public-page"><a className="skip-link" href="#content">رفتن به محتوای اصلی</a>
    <SiteHeader/>
    <main id="content" className="container public-main">{children}</main>
    <footer className="public-footer"><div className="container"><div><Brand/><p>همراه انتخاب و تأمین عایق پروژه شما.</p><a href="/">بازگشت به صفحه اصلی<ArrowLeft size={14}/></a></div>
      <div className="public-footer-contacts">{businessContacts.map(contact => <a key={contact.phone} href={contact.href}><Phone size={15}/><span>{contact.name}</span><bdi>{contact.displayPhone}</bdi></a>)}</div></div></footer>
  </div>;
}
