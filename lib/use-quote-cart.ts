'use client';
import { useEffect, useState } from 'react';
import { products, validThickness, validQuantity, type QuoteItem } from './catalog';

const key='padash-cart-v1';
function restore():QuoteItem[] {
  try {
    const saved=JSON.parse(localStorage.getItem(key)||'[]');
    return Array.isArray(saved)?saved.filter(item=>item&&products.some(product=>product.id===item.productId&&validThickness(product,item.thickness)&&validQuantity(product,item.quantity))
      &&Number.isFinite(item.quantity)&&item.quantity>=.1&&item.quantity<=100000&&typeof item.note==='string'&&item.note.length<=300
      &&(item.thickness!==null||item.note.trim().length>=5)).slice(0,30):[];
  }catch{return [];}
}
export function useQuoteCart() {
  const [cart,setCart]=useState<QuoteItem[]>([]);
  const [ready,setReady]=useState(false);
  useEffect(()=>{setCart(restore());setReady(true);},[]);
  useEffect(()=>{if(ready)try{localStorage.setItem(key,JSON.stringify(cart));}catch{}},[cart,ready]);
  return {cart,setCart,ready};
}
