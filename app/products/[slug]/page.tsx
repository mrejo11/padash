
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import PublicPage from '../../../components/public-page';
import ProductGallery from '../../../components/product-gallery';
import CatalogShopping from '../../../components/catalog-shopping';
import ProductSpecifications from '../../../components/product-specifications';
import BreadcrumbNavigation from '../../../components/breadcrumb-navigation';
import JsonLd from '../../../components/json-ld';
import { findProductBySlug, products, productPath } from '../../../lib/catalog';
import { categoryPath, findCatalogCategory } from '../../../lib/catalog-seo';
import { guides } from '../../../lib/guides';
import { absoluteUrl, imageObject, pageMetadata } from '../../../lib/seo';
import { productSearchSnippet } from '../../../lib/seo-content';
import { publicProductSpecs } from '../../../lib/product-specs';
import {RelatedInsulation} from '../../../components/insulation-links';
import { WhatsAppLink } from '../../../components/whatsapp-link';
import { productWhatsAppUrl } from '../../../lib/whatsapp';
import { ProductImpression } from '../../../components/analytics-impression';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const product = findProductBySlug((await params).slug);
  if(!product)return { title:'محصول پیدا نشد', robots:{index:false} };
  const snippet=productSearchSnippet(product);
  return pageMetadata(snippet.title,snippet.description,productPath(product),product.images?.[0]);
}
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = findProductBySlug((await params).slug);
  if (!product) notFound();
  await connection();
  const verified = await publicProductSpecs(product.id);
  const path = productPath(product);
  const related = guides.filter(guide => guide.relatedProducts.some(id=>id===product.id||product.relatedProducts?.includes(id)));
  const relatedProducts=products.filter(item=>item.id!==product.id&&(product.relatedProducts?.includes(item.id)||item.category===product.category)).slice(0,4);
  const category=findCatalogCategory(product.category);
  return <PublicPage>
    <ProductImpression product={{ id: product.id, name: product.name, category: product.category }}/>
    <JsonLd value={{ '@context': 'https://schema.org', '@type': 'WebPage', '@id': absoluteUrl(path + '#webpage'), name: product.name, description: product.desc, url: absoluteUrl(path), inLanguage: 'fa-IR', about: { '@type': 'Thing', name: product.material }, isPartOf: { '@id': absoluteUrl('/#website') }, ...(product.images?.[0]?{primaryImageOfPage:imageObject(product.images[0]),image:product.images.map(imageObject)}:{}) }}/>
    <BreadcrumbNavigation items={[{ name: 'صفحه اصلی', path: '/' }, { name: 'محصولات', path: '/products' }, ...(category ? [{ name: category.name, path: categoryPath(category.id) }] : []), { name: product.name, path }]}/>
    <article className="product-detail-page partner-detail-page">
      <div className="product-detail-intro">
        <header className="content-heading"><span className="eyebrow">کد محصول <bdi>{product.id}</bdi></span><h1>{product.name}</h1><p>{product.desc}</p></header>
        <CatalogShopping product={product} technicalModel={verified?.model}/>
        <nav className="product-buying-links" aria-label="راهنمای خرید محصول">
          <a href="#order-details">چه مشخصاتی برای خرید لازم است؟</a>
          {category && <Link href={categoryPath(category.id) + '#buying-price'}>عوامل مؤثر بر قیمت {category.name}</Link>}
          <WhatsAppLink href={productWhatsAppUrl(product, absoluteUrl(path))} label="استعلام این محصول در واتس‌اپ" productId={product.id}/>
        </nav>
      </div>
      <div className="product-gallery-panel"><ProductGallery product={product} preload/></div>
      <section className="product-detail-specs" aria-labelledby="product-specs">
      <ProductSpecifications product={product} verified={verified}/>
      <h2>پیش از درخواست این موارد را بررسی کنید</h2><ul className="product-checks">{product.notes.map(note => <li key={note}>{note}</li>)}</ul><p className="article-note">مشخصات بالا معرفی خانواده محصول است. تأیید برند، مدل، گواهی‌ها، موجودی و قیمت به استعلام و دیتاشیت نهایی نیاز دارد.</p>
      <h2 id="order-details">اطلاعات لازم برای خرید {product.name}</h2><p className="insulation-note">{product.requestHint||`شکل عرضهٔ ${product.form}، ضخامت و ${product.cover} را همراه با مقدار مورد نیاز به ${product.unit} اعلام کنید. محل مصرف ${product.use} و شرایط پروژه برای بررسی مدل نهایی اهمیت دارند.`}</p>
      {product.orderExample && <p className="product-order-example"><strong>نمونهٔ سفارش</strong> {product.orderExample}</p>}
      </section>
    </article>
    <RelatedInsulation productIds={[product.id]}/>
    {(related.length>0||relatedProducts.length>0)&&<section className="article-related"><h2>محصولات و راهنماهای مرتبط</h2>{relatedProducts.map(item=><a key={item.id} href={productPath(item)}>{item.name}</a>)}{related.map(guide => <a key={guide.slug} href={'/guides/' + guide.slug}>{guide.title}</a>)}</section>}
  </PublicPage>;
}
