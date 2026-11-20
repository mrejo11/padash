
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Phone } from 'lucide-react';
import { companyPages } from '../lib/company-pages';
import { businessContacts } from '../lib/contacts';
import SiteHeader from './site-header';
import Brand from './brand';
import {insulationTopics} from '../lib/insulation-topics';
import '../app/storefront-theme.css';
import '../app/content.css';
import '../app/catalog.css';
import '../app/storefront-design.css';
import '../app/insulation.css';

export default function PublicPage({ children }: { children: ReactNode }) {
  return <div className="storefront public-page"><a className="skip-link" href="#content">رفتن به محتوای اصلی</a>
    <SiteHeader/>
    <main id="content" className="container public-main">{children}</main>
    <footer className="public-footer"><div className="container"><div>
      <Brand/><p>همراه انتخاب و تأمین عایق پروژه شما.</p>
      <nav className="insulation-footer-links" aria-label="اطلاعات پاداش">{Object.values(companyPages).map(page => <Link href={page.path} key={page.path}>{page.label}</Link>)}</nav>
      <nav className="insulation-footer-links" aria-label="کاربردهای عایق">{insulationTopics.map(topic=><Link href={topic.path} key={topic.id}>{topic.name}</Link>)}</nav>
    </div>
      <div className="public-footer-contacts">{businessContacts.map(contact => <a key={contact.phone} href={contact.href}><Phone size={15}/><span>{contact.name}</span><bdi>{contact.displayPhone}</bdi></a>)}</div></div></footer>
  </div>;
}
