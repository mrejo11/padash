import { Phone, ArrowUpLeft } from 'lucide-react';
import { businessContacts } from '../lib/contacts';

export default function ContactStrip() {
  return <div className="contact-strip" role="region" aria-label="شماره‌های تماس پاداش"><div className="container">
    <p>همراه پروژه شما؛ از انتخاب تا تأمین</p>
    <div className="contact-marquee-window"><div className="contact-marquee-track">
      {[0, 1].map(copy => <div className="contact-marquee-group" key={copy} dir="rtl" aria-hidden={copy === 1 ? true : undefined}>
        {businessContacts.map(contact => <a key={contact.phone} href={contact.href} tabIndex={copy === 1 ? -1 : undefined} aria-label={'تماس با '+contact.name+'، '+contact.displayPhone}><Phone size={14}/><span>{contact.name}</span><bdi dir="ltr">{contact.displayPhone}</bdi><ArrowUpLeft size={14}/></a>)}
      </div>)}
    </div></div>
  </div></div>;
}
