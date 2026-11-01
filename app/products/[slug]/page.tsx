import { notFound } from 'next/navigation';
import PublicPage from '../../../components/public-page';
import ProductArt from '../../product-art';
import JsonLd from '../../../components/json-ld';
import { products, fa } from '../../../lib/catalog';
import { guides } from '../../../lib/guides';
import { absoluteUrl, breadcrumbs, pageMetadata } from '../../../lib/seo';
const find = (slug: string) => products.find(product => product.id.toLowerCase() === slug);
export function generateStaticParams() { return products.map(product => ({ slug: product.id.toLowerCase() })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const product = find((await params).slug);
  return product ? pageMetadata(product.name, product.desc, '/products/' + product.id.toLowerCase()) : { title: 'محصول پیدا نشد', robots: { index: false } };
}
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = find((await params).slug);
  if (!product) notFound();
  const path = '/products/' + product.id.toLowerCase();
  const related = guides.filter(guide => guide.relatedProducts.includes(product.id));
  return <PublicPage><JsonLd value={breadcrumbs([{ name: 'صفحه اصلی', path: '/' }, { name: 'محصولات', path: '/products' }, { name: product.name, path }])}/>
    <JsonLd value={{ '@context': 'https://schema.org', '@type': 'WebPage', '@id': absoluteUrl(path + '#webpage'), name: product.name, description: product.desc, url: absoluteUrl(path), inLanguage: 'fa-IR', about: { '@type': 'Thing', name: product.material }, isPartOf: { '@id': absoluteUrl('/#website') } }}/>
    <nav className="content-breadcrumb" aria-label="مسیر صفحه"><a href="/">پاداش</a><span>/</span><a href="/products">محصولات</a><span>/</span><span>{product.name}</span></nav>
    <article className="product-detail-page"><div className={'product-detail-art art-' + product.art}><ProductArt type={product.art}/><small>نمایش مفهومی خانواده محصول</small></div><div><header className="content-heading"><span className="eyebrow">کد خانواده: <bdi>{product.id}</bdi></span><h1>{product.name}</h1><p>{product.desc}</p></header>
      <dl className="product-spec-list"><div><dt>جنس</dt><dd>{product.material}</dd></div><div><dt>شکل عرضه</dt><dd>{product.form}</dd></div><div><dt>کاربرد عمومی</dt><dd>{product.use}</dd></div><div><dt>واحد استعلام</dt><dd>{product.unit}</dd></div><div><dt>پوشش قابل بررسی</dt><dd>{product.cover}</dd></div><div><dt>ضخامت قابل استعلام</dt><dd>{product.thicknesses.map(fa).join('، ')} میلی‌متر</dd></div></dl>
      <h2>پیش از درخواست این موارد را بررسی کنید</h2><ul className="product-checks">{product.notes.map(note => <li key={note}>{note}</li>)}</ul><p className="article-note">مشخصات بالا معرفی خانواده محصول است. تأیید برند، مدل، گواهی‌ها، موجودی و قیمت به استعلام و دیتاشیت نهایی نیاز دارد.</p>
      <div className="document-actions"><a href="/#catalog" className="button button-orange">انتخاب و ثبت استعلام</a><a href="/#contact" className="button button-outline">تماس با مدیران</a></div></div></article>
    <section className="article-related"><h2>راهنماهای مرتبط و منابع فنی</h2>{related.map(guide => <a key={guide.slug} href={'/guides/' + guide.slug}>{guide.title}</a>)}</section>
  </PublicPage>;
}
