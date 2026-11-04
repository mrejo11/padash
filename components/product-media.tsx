import Image from 'next/image';
import ProductArt from '../app/product-art';
import type { Product } from '../lib/catalog';

export default function ProductMedia({ product, priority=false }: { product:Product; priority?:boolean }) {
  const picture=product.images?.[0];
  return picture ? <Image className="catalog-product-photo" src={picture.src} alt={picture.alt} width={picture.width} height={picture.height}
    sizes="(max-width: 480px) 90vw, (max-width: 1180px) 44vw, 300px" priority={priority}/> : <ProductArt type={product.art}/>;
}
