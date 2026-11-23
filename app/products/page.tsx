import PublicPage from '../../components/public-page';
import CatalogShopping from '../../components/catalog-shopping';
import JsonLd from '../../components/json-ld';
import { products } from '../../lib/catalog';
import { absoluteUrl, breadcrumbs, imageObject, pageMetadata } from '../../lib/seo';
import {InsulationHub} from '../../components/insulation-links';
const picture=products.find(product=>product.images?.length)?.images?.[0];
const title = 'محصولات عایق و ملزومات ساختمانی';
const description = 'برای خرید عایق و ملزومات ساختمانی، فوم پلی‌اتیلن، یونولیت، پشم شیشه، پشم سنگ، عایق الاستومری و پیچ شیروانی را بررسی کنید و استعلام قیمت بگیرید.';
export const metadata = pageMetadata('خرید عایق و ملزومات ساختمانی | کاتالوگ محصولات', description, '/products', picture);
export default function ProductsPage() {
  const list={'@type':'ItemList','@id':absoluteUrl('/products#items'),numberOfItems:products.length,itemListElement:products.map((product,index)=>({'@type':'ListItem',position:index+1,name:product.name,url:absoluteUrl('/products/'+product.id.toLowerCase())}))};
  const trail=breadcrumbs([{name:'صفحه اصلی',path:'/'},{name:'محصولات',path:'/products'}]);
  return <PublicPage><JsonLd value={{'@context':'https://schema.org','@graph':[
    {...trail,'@context':undefined,'@id':absoluteUrl('/products#breadcrumb')},list,
    {'@type':'CollectionPage','@id':absoluteUrl('/products#webpage'),url:absoluteUrl('/products'),name:title,description,inLanguage:'fa-IR',isPartOf:{'@id':absoluteUrl('/#website')},breadcrumb:{'@id':absoluteUrl('/products#breadcrumb')},mainEntity:{'@id':absoluteUrl('/products#items')},...(picture?{primaryImageOfPage:imageObject(picture)}:{})},
  ]}}/>
    <header className="catalog-page-heading"><div className="content-heading">
      <h1>{title}</h1><p>از فوم رولی و یونولیت تا عایق تأسیسات و ملزومات نصب، دستهٔ مورد نیاز را انتخاب کنید تا مشخصات خرید، محاسبهٔ مقدار و استعلام قیمت را ببینید.</p>
    </div></header>
    <CatalogShopping/>
    <InsulationHub/>
  </PublicPage>;
}
