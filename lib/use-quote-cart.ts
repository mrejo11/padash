'use client';
import { useSyncExternalStore, type SetStateAction } from 'react';
import { products, validThickness, validQuantity, type QuoteItem } from './catalog';

const key='padash-cart-v1';
const emptyCart:QuoteItem[]=[];
let lastStored: string | null | undefined;
let currentCart = emptyCart;
const listeners = new Set<() => void>();

function restore(raw: string | null):QuoteItem[] {
  try {
    const saved=JSON.parse(raw || '[]');
    return Array.isArray(saved)?saved.filter(item=>item&&products.some(product=>product.id===item.productId&&validThickness(product,item.thickness)&&validQuantity(product,item.quantity))
      &&Number.isFinite(item.quantity)&&item.quantity>=.1&&item.quantity<=100000&&typeof item.note==='string'&&item.note.length<=300
      &&(item.thickness!==null||item.note.trim().length>=5)).slice(0,30):[];
  }catch{return [];}
}
function getCart() {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== lastStored) {
      lastStored = raw;
      currentCart = restore(raw);
    }
  } catch { /* Keep the in-memory cart if storage is unavailable. */ }
  return currentCart;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function setCart(update: SetStateAction<QuoteItem[]>) {
  currentCart = typeof update === 'function' ? update(getCart()) : update;
  try {
    const raw = JSON.stringify(currentCart);
    localStorage.setItem(key, raw);
    lastStored = raw;
  } catch { /* Keep updating all open forms in this tab. */ }
  for (const listener of listeners) listener();
}

export function useQuoteCart() {
  const cart = useSyncExternalStore<QuoteItem[] | null>(subscribe, getCart, () => null);
  return {cart: cart ?? emptyCart, setCart, ready: cart !== null};
}
