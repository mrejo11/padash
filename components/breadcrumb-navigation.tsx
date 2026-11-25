import Link from 'next/link';
import { Fragment } from 'react';
import { breadcrumbs } from '../lib/seo';
import JsonLd from './json-ld';

export default function BreadcrumbNavigation({ items, schema = true }: {
  items: Parameters<typeof breadcrumbs>[0]; schema?: boolean;
}) {
  return <>
    {schema && <JsonLd value={breadcrumbs(items)}/>}
    <nav className="content-breadcrumb" aria-label="مسیر صفحه">
      {items.map(({ name, path }, index) => <Fragment key={path}>
        {index > 0 && <span aria-hidden="true">/</span>}
        {index === items.length - 1 ? <span aria-current="page">{name}</span> : <Link href={path}>{name}</Link>}
      </Fragment>)}
    </nav>
  </>;
}
