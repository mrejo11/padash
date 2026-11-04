'use client';
import { useState } from 'react';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { fa, type Product, type QuoteItem } from '../lib/catalog';
import { useQuoteCart } from '../lib/use-quote-cart';
import { estimateProfile } from '../lib/estimate-products';
import CatalogBrowser from './catalog-browser';
import { ProductModal, QuoteModal } from './commerce-dialogs';

export default function CatalogShopping({product}:{product?:Product}) {
  const {cart,setCart,ready}=useQuoteCart();
  const [detail,setDetail]=useState<Product|null>(null),[quoteOpen,setQuoteOpen]=useState(false);
  function add(item:QuoteItem) {
    setCart(previous=>{
      const index=previous.findIndex(line=>line.productId===item.productId&&line.thickness===item.thickness&&line.note===item.note);
      return index<0?[...previous,item]:previous.map((line,i)=>i===index?{...line,quantity:Math.min(100000,line.quantity+item.quantity)}:line);
    });
    setDetail(null);setQuoteOpen(true);
  }
  return <>
    {product?<div className="product-inquiry-actions"><button className="button button-orange" disabled={!ready} onClick={()=>setDetail(product)}>ثبت مشخصات و استعلام<ArrowLeft size={18}/></button>{estimateProfile(product.id)&&<a href={'/calculator?product='+encodeURIComponent(product.id.toLowerCase())} className="button button-outline">محاسبه مقدار مورد نیاز</a>}<a href="/#contact" className="button button-outline">تماس با مدیران</a></div>
      :<CatalogBrowser onInspect={setDetail}/>}
    {cart.length>0&&<div className="catalog-cart-summary"><span><ClipboardList size={19}/>{fa(cart.length)} قلم در سبد استعلام</span><button className="button button-dark" onClick={()=>setQuoteOpen(true)}>تکمیل درخواست<ArrowLeft size={16}/></button></div>}
    {detail&&<ProductModal product={detail} onAdd={add} onClose={()=>setDetail(null)}/>}
    {quoteOpen&&<QuoteModal initialKind="order" cart={cart} setCart={setCart} onClose={()=>setQuoteOpen(false)}/>}
  </>;
}
