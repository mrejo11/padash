import PublicPage from '../../components/public-page';
import CatalogShopping from '../../components/catalog-shopping';
import JsonLd from '../../components/json-ld';
import { products, categories, fa } from '../../lib/catalog';
import { absoluteUrl, breadcrumbs, pageMetadata } from '../../lib/seo';
export const metadata = pageMetadata('کاتالوگ عایق و ملزومات پروژه', 'محصولات بازرگانی پاداش؛ پشم شیشه، پشم سنگ، فوم، فویل، توری، کارتن‌پلاست و عایق الاستومری، همراه تصاویر و فرم استعلام.', '/products');
export default function ProductsPage() {
  const list={'@type':'ItemList','@id':absoluteUrl('/products#items'),numberOfItems:products.length,itemListElement:products.map((product,index)=>({'@type':'ListItem',position:index+1,name:product.name,url:absoluteUrl('/products/'+product.id.toLowerCase())}))};
  const trail=breadcrumbs([{name:'صفحه اصلی',path:'/'},{name:'محصولات',path:'/products'}]);
  return <PublicPage><JsonLd value={{'@context':'https://schema.org','@graph':[
    {...trail,'@context':undefined,'@id':absoluteUrl('/products#breadcrumb')},list,
    {'@type':'CollectionPage','@id':absoluteUrl('/products#webpage'),url:absoluteUrl('/products'),name:'انتخاب عایق و ملزومات پروژه',inLanguage:'fa-IR',isPartOf:{'@id':absoluteUrl('/#website')},breadcrumb:{'@id':absoluteUrl('/products#breadcrumb')},mainEntity:{'@id':absoluteUrl('/products#items')}},
  ]}}/>
    <header className="catalog-page-heading"><div className="content-heading"><span className="eyebrow">کاتالوگ تخصصی بازرگانی پاداش</span><h1>انتخاب عایق و ملزومات پروژه</h1><p>محصولات را بررسی کنید، مشخصات مورد نیاز را بنویسید و استعلام خود را مستقیم برای پاداش بفرستید.</p></div><div className="catalog-heading-stats"><span><b>{fa(products.length)}</b>محصول و خانواده</span><span><b>{fa(categories.length-1)}</b>دسته‌بندی</span></div></header>
    <CatalogShopping/>
  </PublicPage>;
}
