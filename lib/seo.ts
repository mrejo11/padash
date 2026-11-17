import type { Metadata } from 'next';
import { businessContacts } from './contacts';
import type { ProductImage } from './catalog';

// Confirmed by the owner. Deployment-preview URLs must never become canonical.
export const SITE_URL = 'https://www.padashgroup.ir';
export const SITE_NAME = 'بازرگانی پاداش';
export const SITE_SHORT_NAME = 'پاداش';
export const SITE_ALTERNATE_NAMES = [SITE_SHORT_NAME, 'Padash Trading', 'Padash'];
export const SOCIAL_IMAGE = '/images/padash-share.png';
export const isPreviewDeployment = () => process.env.VERCEL_ENV === 'preview'
  || ['deploy-preview', 'branch-deploy'].includes(process.env.CONTEXT || '');
export const absoluteUrl = (path = '/') => new URL(path, SITE_URL).toString();
export function pageMetadata(title: string, description: string, path: string, picture?: ProductImage): Metadata {
  const image=picture||{src:SOCIAL_IMAGE,width:512,height:512,alt:'نشان بازرگانی پاداش؛ عایق و ملزومات پروژه'};
  return { title, description, alternates: { canonical: absoluteUrl(path) },
    openGraph: { title: `${title} | ${SITE_NAME}`, description, url: absoluteUrl(path), siteName: SITE_NAME,
      type: 'website', locale: 'fa_IR', images: [{ url: absoluteUrl(image.src), width: image.width, height: image.height, alt: image.alt }] },
    twitter: { card: 'summary', title: `${title} | ${SITE_NAME}`, description, images: [absoluteUrl(image.src)] },
  };
}
export const imageObject=(image:ProductImage)=>({'@type':'ImageObject',url:absoluteUrl(image.src),contentUrl:absoluteUrl(image.src),width:image.width,height:image.height,caption:image.alt});
export const organization = {
  '@type': 'Organization', '@id': absoluteUrl('/#organization'), name: SITE_NAME,
  alternateName: SITE_ALTERNATE_NAMES,
  url: SITE_URL, logo: absoluteUrl(SOCIAL_IMAGE),
  description: 'انتخاب، مقایسه، مشاوره و استعلام تأمین عایق‌های حرارتی و برودتی برای ساختمان، تأسیسات و صنعت.',
  contactPoint: businessContacts.map(contact => ({ '@type': 'ContactPoint', name: contact.name,
    telephone: contact.href.slice(4), contactType: 'sales', availableLanguage: 'Persian' })),
};
export const website = {
  '@type': 'WebSite', '@id': absoluteUrl('/#website'), name: SITE_NAME,
  alternateName: SITE_ALTERNATE_NAMES, url: absoluteUrl('/'), inLanguage: 'fa-IR',
  publisher: { '@id': organization['@id'] },
};
export function breadcrumbs(items: { name: string; path: string }[]) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({
    '@type': 'ListItem', position: index + 1, name: item.name, item: absoluteUrl(item.path),
  })) };
}
