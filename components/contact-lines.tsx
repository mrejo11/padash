import { Phone } from 'lucide-react';
import { businessContactName, businessContacts } from '../lib/contacts';
import styles from './contact-lines.module.css';

export default function ContactLines({ heading: Heading = 'h2' }: { heading?: 'h2' | 'h3' }) {
  return <section className={styles.card} aria-labelledby="direct-contact-name">
    <div className={styles.identity}>
      <span className={styles.icon}><Phone size={22} aria-hidden="true"/></span>
      <div>
        <Heading id="direct-contact-name">{businessContactName}</Heading>
        <p>تماس مستقیم برای مشاوره و استعلام</p>
      </div>
    </div>
    <ul className={styles.lines}>
      {businessContacts.map(contact => <li key={contact.phone}>
        <a className={styles.line} href={contact.href} aria-label={contact.callLabel}>
          <span>{contact.label}</span>
          <bdi dir="ltr">{contact.displayPhone}</bdi>
        </a>
      </li>)}
    </ul>
  </section>;
}
