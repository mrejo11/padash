import { notFound } from 'next/navigation';
import PublicPage from '../../../components/public-page';
import ProductGallery from '../../../components/product-gallery';
import CatalogShopping from '../../../components/catalog-shopping';
import JsonLd from '../../../components/json-ld';
import { products, fa, productPath } from '../../../lib/catalog';
import { guides } from '../../../lib/guides';
import { absoluteUrl, breadcrumbs, pageMetadata } from '../../../lib/seo';
import { productSearchSnippet } from '../../../lib/seo-content';
const find = (slug: string) => products.find(product => product.id.toLowerCase() === slug);
export function generateStaticParams() { return products.map(product => ({ slug: product.id.toLowerCase() })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const product = find((await params).slug);
  if(!product)return { title:'محصول پیدا نشد', robots:{index:false} };
  const snippet=productSearchSnippet(product);
  const meta=pageMetadata(snippet.title,snippet.description,productPath(product));
  const picture=product.images?.[0];
  return picture?{...meta,openGraph:{...meta.openGraph,images:[{url:absoluteUrl(picture.src),width:picture.width,height:picture.height,alt:picture.alt}]},twitter:{...meta.twitter,images:[absoluteUrl(picture.src)]}}:meta;
}
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = find((await params).slug);
  if (!product) notFound();
  const path = '/products/' + product.id.toLowerCase();
  const related = guides.filter(guide => guide.relatedProducts.some(id=>id===product.id||product.relatedProducts?.includes(id)));
  const relatedProducts=products.filter(item=>product.relatedProducts?.includes(item.id));
  return <PublicPage><JsonLd value={breadcrumbs([{ name: 'صفحه اصلی', path: '/' }, { name: 'محصولات', path: '/products' }, { name: product.name, path }])}/>
    <JsonLd value={{ '@context': 'https://schema.org', '@type': 'WebPage', '@id': absoluteUrl(path + '#webpage'), name: product.name, description: product.desc, url: absoluteUrl(path), inLanguage: 'fa-IR', about: { '@type': 'Thing', name: product.material }, isPartOf: { '@id': absoluteUrl('/#website') }, ...(product.images?.[0]?{primaryImageOfPage:{'@type':'ImageObject',url:absoluteUrl(product.images[0].src),width:product.images[0].width,height:product.images[0].height,caption:product.images[0].alt}}:{}) }}/>
    <nav className="content-breadcrumb" aria-label="مسیر صفحه"><a href="/">پاداش</a><span>/</span><a href="/products">محصولات</a><span>/</span><span>{product.name}</span></nav>
    <article className="product-detail-page partner-detail-page"><div className="product-gallery-panel"><ProductGallery product={product}/></div><div><header className="content-heading"><span className="eyebrow">کاتالوگ بازرگانی پاداش · کد <bdi>{product.id}</bdi></span><h1>{product.name}</h1><p>{product.desc}</p></header>
      <dl className="product-spec-list"><div><dt>جنس</dt><dd>{product.material}</dd></div><div><dt>شکل عرضه</dt><dd>{product.form}</dd></div><div><dt>کاربرد عمومی</dt><dd>{product.use}</dd></div><div><dt>واحد درخواست اولیه</dt><dd>{product.unit}</dd></div><div><dt>پوشش قابل بررسی</dt><dd>{product.cover}</dd></div>{product.thicknesses.length>0&&<div><dt>ضخامت قابل استعلام</dt><dd>{product.thicknesses.map(fa).join('، ')} میلی‌متر</dd></div>}{product.specifications?.map(spec=><div key={spec.label}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}</dl>
      <h2>پیش از درخواست این موارد را بررسی کنید</h2><ul className="product-checks">{product.notes.map(note => <li key={note}>{note}</li>)}</ul><p className="article-note">مشخصات بالا معرفی خانواده محصول است. تأیید برند، مدل، گواهی‌ها، موجودی و قیمت به استعلام و دیتاشیت نهایی نیاز دارد.</p>
      <CatalogShopping product={product}/>
      </div></article>
    {(related.length>0||relatedProducts.length>0)&&<section className="article-related"><h2>محصولات و راهنماهای مرتبط</h2>{relatedProducts.map(item=><a key={item.id} href={productPath(item)}>{item.name}</a>)}{related.map(guide => <a key={guide.slug} href={'/guides/' + guide.slug}>{guide.title}</a>)}</section>}
  </PublicPage>;
}
