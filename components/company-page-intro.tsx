import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import type { CompanyPageDetails } from '../lib/company-pages';
import { absoluteUrl, breadcrumbs, organization, website } from '../lib/seo';
import JsonLd from './json-ld';
import styles from './company-pages.module.css';

export default function CompanyPageIntro({ page, visual }: { page: CompanyPageDetails; visual?: ReactNode }) {
  const trail = breadcrumbs([{ name: 'صفحه اصلی', path: '/' }, { name: page.label, path: page.path }]);
  const breadcrumbId = absoluteUrl(`${page.path}#breadcrumb`);
  const organizationRef = { '@id': organization['@id'] };

  return <>
    <JsonLd value={{ '@context': 'https://schema.org', '@graph': [
      { ...trail, '@context': undefined, '@id': breadcrumbId },
      {
        '@type': page.schemaType,
        '@id': absoluteUrl(`${page.path}#webpage`),
        url: absoluteUrl(page.path),
        name: page.title,
        description: page.description,
        dateModified: page.updated,
        inLanguage: 'fa-IR',
        isPartOf: { '@id': website['@id'] },
        breadcrumb: { '@id': breadcrumbId },
        ...(page.schemaType === 'ContactPage' ? { mainEntity: organizationRef } : { about: organizationRef }),
      },
    ] }}/>
    <nav className={styles.breadcrumb} aria-label="مسیر صفحه">
      <Link href="/">صفحه اصلی</Link><ChevronLeft size={15} aria-hidden="true"/><span aria-current="page">{page.label}</span>
    </nav>
    <header className={styles.hero}>
      <div><h1>{page.title}</h1><p>{page.description}</p></div>
      {visual}
    </header>
  </>;
}
