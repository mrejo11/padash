import PublicPage from '../../components/public-page';
import ProductArt from '../product-art';
import JsonLd from '../../components/json-ld';
import { products, fa } from '../../lib/catalog';
import { absoluteUrl, pageMetadata } from '../../lib/seo';
export const metadata = pageMetadata('محصولات عایق حرارتی و برودتی', 'کاتالوگ خانواده‌های عایق الاستومری، پشم سنگ، پشم شیشه و پلی‌اتیلن؛ کاربرد، ضخامت و اطلاعات موردنیاز استعلام بازرگانی پاداش.', '/products');
export default function ProductsPage() {
  return <PublicPage><JsonLd value={{ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: products.map((product, index) => ({ '@type': 'ListItem', position: index + 1, name: product.name, url: absoluteUrl('/products/' + product.id.toLowerCase()) })) }}/>
    <div className="content-heading"><span className="eyebrow">کاتالوگ تخصصی پاداش</span><h1>عایق‌های حرارتی و برودتی</h1><p>این کاتالوگ خانواده محصول را معرفی می‌کند؛ برند، موجودی، قیمت و مشخصات قطعی در پیش‌فاکتور تأیید می‌شوند.</p></div>
    <div className="content-grid">{products.map(product => <article className="content-card product-guide-card" key={product.id}><div className={'art-' + product.art}><ProductArt type={product.art}/></div><h2><a href={'/products/' + product.id.toLowerCase()}>{product.name}</a></h2><p>{product.desc}</p><small>ضخامت‌های قابل استعلام: {product.thicknesses.map(fa).join('، ')} میلی‌متر</small><a className="text-button" href={'/products/' + product.id.toLowerCase()}>مشخصات و راهنمای استعلام</a></article>)}</div>
  </PublicPage>;
}
