'use client';

import { Phone } from 'lucide-react';
import { businessContacts } from '../lib/contacts';
import { useReducedMotion } from '../lib/use-reduced-motion';

const slogan = 'بازرگانی پاداش؛ عایق مطمئن، آسایش ماندگار.';
const promise = 'همراه شما، از انتخاب آگاهانه تا تأمین پروژه';

export default function BrandTicker() {
  const reducedMotion = useReducedMotion();
  return <div className="brand-ticker" data-paused={reducedMotion} tabIndex={0} role="region" aria-label="شعار و شماره‌های تماس پاداش">
    <div className="container brand-ticker-inner">
      <span className="brand-ticker-label" aria-hidden="true"><span/>نگاه پاداش</span>
      <p className="brand-motion-sr">{slogan} {promise}. تماس با {businessContacts.map(contact => `${contact.name}: ${contact.displayPhone}`).join('؛ ')}</p>
      <div className="brand-ticker-window" aria-hidden="true"><div className="brand-ticker-track">
        {[0, 1].map(copy => <div className="brand-ticker-group" key={copy} dir="rtl"><span>{slogan}</span><i/><span>{promise}</span><i/>{businessContacts.map(contact => <span className="brand-ticker-contact" key={contact.phone}><Phone size={13}/><span>{contact.name}</span><bdi dir="ltr">{contact.displayPhone}</bdi><i/></span>)}</div>)}
      </div></div>
    </div>
  </div>;
}
