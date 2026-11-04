'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Expand } from 'lucide-react';
import ProductMedia from './product-media';
import { fa, type Product } from '../lib/catalog';

export default function ProductGallery({product}:{product:Product}) {
  const [active,setActive]=useState(0);
  const images=product.images||[];
  if(!images.length) return <div className={'product-gallery conceptual art-'+product.art}><ProductMedia product={product}/><small>نمایش مفهومی خانواده محصول</small></div>;
  const selected=images[active];
  return <div className="product-gallery">
    <a className="product-gallery-main" href={selected.src} target="_blank" rel="noreferrer" aria-label={'نمایش تصویر بزرگ '+product.name}>
      <Image src={selected.src} alt={selected.alt} width={selected.width} height={selected.height} sizes="(max-width: 850px) 90vw, 520px"/>
      <span className="gallery-expand"><Expand size={17}/>نمایش بزرگ‌تر</span>
    </a>
    {images.length>1&&<div className="product-gallery-thumbs" role="group" aria-label="تصاویر محصول">{images.map((picture,index)=><button key={picture.src} type="button" onClick={()=>setActive(index)} aria-pressed={index===active} aria-label={'تصویر '+fa(index+1)+' از '+product.name}>
      <Image src={picture.src} alt="" width={80} height={80} sizes="80px"/>
    </button>)}</div>}
    <p className="gallery-caption">گالری {product.name} · {fa(active+1)} از {fa(images.length)}</p>
  </div>;
}
