import Image from 'next/image';
import ProductArt from '../app/product-art';
import type { Product } from '../lib/catalog';

export default function ProductMedia({ product, priority=false, sizes='(max-width: 600px) 44vw, (max-width: 1100px) 30vw, 300px' }: { product:Product; priority?:boolean; sizes?:string }) {
  const picture=product.images?.[0];
  return picture ? <Image className="catalog-product-photo" src={picture.src} alt={picture.alt} width={picture.width} height={picture.height}
    sizes={sizes} preload={priority}/> : <ProductArt type={product.art}/>;
}
