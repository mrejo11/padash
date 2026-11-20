'use client';
import {useState} from 'react';
import {ClipboardList} from 'lucide-react';
import {useQuoteCart} from '../lib/use-quote-cart';
import {QuoteModal} from './lazy-commerce';

export default function InquiryAction({topic,label='استعلام قیمت و بررسی نیاز'}:{topic:string;label?:string}){
  const {cart,setCart,ready}=useQuoteCart();
  const [open,setOpen]=useState(false);
  return <><button className="button button-orange" disabled={!ready} onClick={()=>setOpen(true)}><ClipboardList size={18} aria-hidden="true"/>{label}</button>
    {open&&<QuoteModal initialKind="consultation" inquiryContext={topic} cart={cart} setCart={setCart} onClose={()=>setOpen(false)}/>}</>;
}
