import type { Metadata } from 'next';
import { businessContacts } from './contacts';

// Confirmed by the owner. Deployment-preview URLs must never become canonical.
export const SITE_URL = 'https://padashco.netlify.app';
export const SITE_NAME = 'بازرگانی پاداش';
export const absoluteUrl = (path = '/') => new URL(path, SITE_URL).toString();
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return { title, description, alternates: { canonical: absoluteUrl(path) },
    openGraph: { title: `${title} | ${SITE_NAME}`, description, url: absoluteUrl(path), siteName: SITE_NAME,
      type: 'website', locale: 'fa_IR', images: [{ url: absoluteUrl('/images/padash-logo.png'), width: 1000, height: 1000, alt: 'نشان بازرگانی پاداش؛ عایق حرارتی و برودتی' }] },
    twitter: { card: 'summary', title: `${title} | ${SITE_NAME}`, description, images: [absoluteUrl('/images/padash-logo.png')] },
  };
}
export const organization = {
  '@type': 'Organization', '@id': absoluteUrl('/#organization'), name: SITE_NAME,
  url: SITE_URL, logo: absoluteUrl('/images/padash-logo.png'),
  description: 'انتخاب، مقایسه، مشاوره و استعلام تأمین عایق‌های حرارتی و برودتی برای ساختمان، تأسیسات و صنعت.',
  contactPoint: businessContacts.map(contact => ({ '@type': 'ContactPoint', name: contact.name,
    telephone: contact.href.slice(4), contactType: 'sales', availableLanguage: 'Persian' })),
};
export function breadcrumbs(items: { name: string; path: string }[]) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({
    '@type': 'ListItem', position: index + 1, name: item.name, item: absoluteUrl(item.path),
  })) };
}
