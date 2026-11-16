import Link from 'next/link';
import { notFound } from 'next/navigation';
import PublicPage from '../../../../components/public-page';
import CatalogShopping from '../../../../components/catalog-shopping';
import JsonLd from '../../../../components/json-ld';
import { products, productPath } from '../../../../lib/catalog';
import { catalogCategories, categoryPath, findCatalogCategory } from '../../../../lib/catalog-seo';
import { absoluteUrl, breadcrumbs, pageMetadata } from '../../../../lib/seo';

export function generateStaticParams() { return catalogCategories.map(category => ({slug: category.id})); }
export async function generateMetadata({params}: {params: Promise<{slug: string}>}) {
  const category = findCatalogCategory((await params).slug);
  return category ? pageMetadata(category.title, category.description, categoryPath(category.id))
    : {title: 'دسته‌بندی پیدا نشد', robots: {index: false}};
}
export default async function CategoryPage({params}: {params: Promise<{slug: string}>}) {
  const category = findCatalogCategory((await params).slug);
  if (!category) notFound();
  const path = categoryPath(category.id);
  const items = products.filter(product => product.category === category.id);
  const trail = breadcrumbs([{name: 'صفحه اصلی', path: '/'}, {name: 'محصولات', path: '/products'}, {name: category.name, path}]);
  return <PublicPage><JsonLd value={{'@context': 'https://schema.org', '@graph': [
    {...trail, '@context': undefined, '@id': absoluteUrl(path + '#breadcrumb')},
    {'@type': 'CollectionPage', '@id': absoluteUrl(path + '#webpage'), url: absoluteUrl(path), name: category.name,
      description: category.description, inLanguage: 'fa-IR', isPartOf: {'@id': absoluteUrl('/#website')},
      breadcrumb: {'@id': absoluteUrl(path + '#breadcrumb')}, mainEntity: {'@id': absoluteUrl(path + '#items')}},
    {'@type': 'ItemList', '@id': absoluteUrl(path + '#items'), numberOfItems: items.length,
      itemListElement: items.map((product,index) => ({'@type': 'ListItem', position: index+1, name: product.name, url: absoluteUrl(productPath(product))}))},
  ]}}/>
    <nav className="content-breadcrumb" aria-label="مسیر صفحه"><Link href="/">پاداش</Link><span>/</span><Link href="/products">محصولات</Link><span>/</span><span>{category.name}</span></nav>
    <header className="catalog-page-heading"><div className="content-heading"><span className="eyebrow">کاتالوگ تخصصی بازرگانی پاداش</span><h1>{category.name}؛ انتخاب و استعلام</h1><p>{category.intro}</p></div></header>
    <CatalogShopping initialCategory={category.id}/>
  </PublicPage>;
}
