import Link from 'next/link';
import { notFound } from 'next/navigation';
import PublicPage from '../../../../components/public-page';
import CatalogBuyingGuide from '../../../../components/catalog-buying-guide';
import CatalogShopping from '../../../../components/catalog-shopping';
import JsonLd from '../../../../components/json-ld';
import { products, productPath } from '../../../../lib/catalog';
import { catalogCategories, categoryPath, findCatalogCategory } from '../../../../lib/catalog-seo';
import { catalogBuyingGuides } from '../../../../lib/catalog-buying-guides';
import { absoluteUrl, breadcrumbs, imageObject, pageMetadata } from '../../../../lib/seo';
import {RelatedInsulation} from '../../../../components/insulation-links';
import {guides} from '../../../../lib/guides';
const categoryImage=(id:string)=>products.find(product=>product.category===id&&product.images?.length)?.images?.[0];

export function generateStaticParams() { return catalogCategories.map(category => ({slug: category.id})); }
export async function generateMetadata({params}: {params: Promise<{slug: string}>}) {
  const category = findCatalogCategory((await params).slug);
  return category ? pageMetadata(category.title, category.description, categoryPath(category.id),categoryImage(category.id))
    : {title: 'دسته‌بندی پیدا نشد', robots: {index: false}};
}
export default async function CategoryPage({params}: {params: Promise<{slug: string}>}) {
  const category = findCatalogCategory((await params).slug);
  if (!category) notFound();
  const path = categoryPath(category.id);
  const buyingGuide = catalogBuyingGuides[category.id];
  const heading = buyingGuide.heading;
  const items = products.filter(product => product.category === category.id);
  const relatedGuides=guides.filter(guide=>guide.relatedProducts.some(id=>items.some(product=>product.id===id)));
  const picture=categoryImage(category.id);
  const trail = breadcrumbs([{name: 'صفحه اصلی', path: '/'}, {name: 'محصولات', path: '/products'}, {name: category.name, path}]);
  return <PublicPage><JsonLd value={{'@context': 'https://schema.org', '@graph': [
    {...trail, '@context': undefined, '@id': absoluteUrl(path + '#breadcrumb')},
    {'@type': 'CollectionPage', '@id': absoluteUrl(path + '#webpage'), url: absoluteUrl(path), name: heading,
      description: category.description, inLanguage: 'fa-IR', isPartOf: {'@id': absoluteUrl('/#website')},
      breadcrumb: {'@id': absoluteUrl(path + '#breadcrumb')}, mainEntity: {'@id': absoluteUrl(path + '#items')},...(picture?{primaryImageOfPage:imageObject(picture)}:{})},
    {'@type': 'ItemList', '@id': absoluteUrl(path + '#items'), numberOfItems: items.length,
      itemListElement: items.map((product,index) => ({'@type': 'ListItem', position: index+1, name: product.name, url: absoluteUrl(productPath(product))}))},
  ]}}/>
    <nav className="content-breadcrumb" aria-label="مسیر صفحه"><Link href="/">پاداش</Link><span>/</span><Link href="/products">محصولات</Link><span>/</span><span aria-current="page">{category.name}</span></nav>
    <header className="catalog-page-heading"><div className="content-heading">
      <h1>{heading}</h1><p>{category.intro}</p>
      <div className="buying-actions">
        <a className="button button-orange" href="#buying-price">استعلام قیمت</a>
        <a className="button button-outline" href="#buying-options">انتخاب محصول و محاسبه مقدار</a>
      </div>
    </div></header>
    <CatalogShopping initialCategory={category.id}/>
    <CatalogBuyingGuide guide={buyingGuide} categoryName={category.name} items={items}/>
    <RelatedInsulation productIds={items.map(product=>product.id)}/>
    {relatedGuides.length>0&&<section className="article-related"><h2>راهنماهای مرتبط با {category.name}</h2>{relatedGuides.map(guide=><Link href={'/guides/'+guide.slug} key={guide.slug}>{guide.title}</Link>)}</section>}
  </PublicPage>;
}
