import Image from 'next/image';
import { ArrowUpLeft, Layers3, Snowflake, Flame } from 'lucide-react';
import { products, productPath } from '../lib/catalog';
import ProductMedia from './product-media';

export default function MaterialShowcase(){
  const glass=products.find(product=>product.id==='VN-1221')!;
  const stone=products.find(product=>product.id==='VN-1220')!;
  const foam=products.find(product=>product.id==='VN-1218')!;
  return <div className="material-showcase">
    <div className="showcase-heading"><span><Layers3 size={17}/>نگاهی به محصولات پاداش</span><span dir="ltr">MATERIAL SELECTION / 01</span></div>
    <div className="showcase-materials">
      <a className="showcase-main-material" href={productPath(glass)}>
        <span className="showcase-material-label">عایق و روکش</span>
        <div className="showcase-main-photo"><ProductMedia product={glass} priority/></div>
        <div className="showcase-main-caption"><div><span dir="ltr">GLASS WOOL</span><h2>{glass.name}</h2><p>فرم و پوشش متناسب با پروژه</p></div><span className="showcase-arrow"><ArrowUpLeft size={23}/></span></div>
      </a>
      {[stone,foam].map((product,index)=><a className={'showcase-small-material showcase-small-'+index} key={product.id} href={productPath(product)}>
        <div className="showcase-small-photo"><ProductMedia product={product}/></div><div><span>{product.name}</span><ArrowUpLeft size={17}/></div>
      </a>)}
    </div>
    <div className="showcase-bottom"><span><Snowflake size={17}/><Flame size={17}/>از شناخت شرایط تا انتخاب متریال</span><a href="/products">کاتالوگ کامل<ArrowUpLeft size={15}/></a></div>
    <div className="showcase-brand-seal"><Image src="/images/padash-logo-slim.png" width={96} height={96} sizes="96px" alt="نشان بازرگانی پاداش"/></div>
  </div>;
}
