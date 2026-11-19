'use client';
import {useState} from 'react';
import {ArrowLeft} from 'lucide-react';
import {useQuoteCart} from '../lib/use-quote-cart';
import {QuoteModal} from './lazy-commerce';

export default function InquiryAction({topic}:{topic:string}){
  const {cart,setCart,ready}=useQuoteCart();
  const [open,setOpen]=useState(false);
  return <><button className="button button-orange" disabled={!ready} onClick={()=>setOpen(true)}>استعلام قیمت و بررسی نیاز<ArrowLeft size={18}/></button>
    {open&&<QuoteModal initialKind="consultation" inquiryContext={topic} cart={cart} setCart={setCart} onClose={()=>setOpen(false)}/>}</>;
}
