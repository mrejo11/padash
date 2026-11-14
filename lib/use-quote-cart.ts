'use client';
import { useEffect, useState, useSyncExternalStore, type SetStateAction } from 'react';
import { products, validThickness, validQuantity, type QuoteItem } from './catalog';

const key='padash-cart-v1';
const emptyCart:QuoteItem[]=[];
function restore():QuoteItem[] {
  try {
    const saved=JSON.parse(localStorage.getItem(key)||'[]');
    return Array.isArray(saved)?saved.filter(item=>item&&products.some(product=>product.id===item.productId&&validThickness(product,item.thickness)&&validQuantity(product,item.quantity))
      &&Number.isFinite(item.quantity)&&item.quantity>=.1&&item.quantity<=100000&&typeof item.note==='string'&&item.note.length<=300
      &&(item.thickness!==null||item.note.trim().length>=5)).slice(0,30):[];
  }catch{return [];}
}
export function useQuoteCart() {
  const ready=useSyncExternalStore(subscribe,()=>true,()=>false);
  const [initialCart]=useState(restore);
  const [editedCart,setEditedCart]=useState<QuoteItem[]|null>(null);
  const cart=editedCart??(ready?initialCart:emptyCart);
  function setCart(update:SetStateAction<QuoteItem[]>) {
    setEditedCart(previous=>typeof update==='function'?update(previous??initialCart):update);
  }
  useEffect(()=>{if(ready)try{localStorage.setItem(key,JSON.stringify(cart));}catch{}},[cart,ready]);
  return {cart,setCart,ready};
}

// The cart becomes visible after hydration, keeping browser storage out of SSR.
function subscribe() { return () => {}; }
