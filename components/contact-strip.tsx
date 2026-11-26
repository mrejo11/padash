import { Phone } from 'lucide-react';
import { businessContactName, businessContacts } from '../lib/contacts';

export default function ContactStrip() {
  return <div className="contact-strip" role="region" aria-label="شماره‌های تماس پاداش">
    <div className="container">
      <span className="contact-strip-person"><Phone size={14} aria-hidden="true"/>{businessContactName}</span>
      <div className="contact-strip-lines">
        {businessContacts.map(contact => <a key={contact.phone} href={contact.href} aria-label={contact.callLabel}>
          <span>{contact.label}</span><bdi dir="ltr">{contact.displayPhone}</bdi>
        </a>)}
      </div>
    </div>
  </div>;
}
