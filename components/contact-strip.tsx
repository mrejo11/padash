import { Phone } from 'lucide-react';
import { businessContacts } from '../lib/contacts';

export default function ContactStrip() {
  return <div className="contact-strip" role="region" aria-label="شماره‌های تماس پاداش"><div className="container">
    {businessContacts.map(contact => <a key={contact.phone} href={contact.href} aria-label={`تماس با ${contact.name}، ${contact.displayPhone}`}>
      <Phone size={14} aria-hidden="true"/><span>{contact.name}</span><bdi dir="ltr">{contact.displayPhone}</bdi>
    </a>)}
  </div></div>;
}
