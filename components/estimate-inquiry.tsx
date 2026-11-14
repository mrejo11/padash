'use client';

import { useState } from 'react';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { fa, products, validQuantity, type QuoteItem } from '../lib/catalog';
import { useQuoteCart } from '../lib/use-quote-cart';
import { ProductModal, QuoteModal } from './commerce-dialogs';

export default function EstimateInquiry({ productId, quantity, note }: { productId: string; quantity: number; note: string }) {
  const { cart, setCart, ready } = useQuoteCart();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const product = products.find(item => item.id === productId);
  if (!product) return null;
  const valid = validQuantity(product, quantity);
  function add(item: QuoteItem) {
    setCart(previous => {
      const index = previous.findIndex(line => line.productId === item.productId && line.thickness === item.thickness && line.note === item.note);
      return index < 0 ? [...previous, item] : previous.map((line, i) => i === index ? { ...line, quantity: Math.min(100000, line.quantity + item.quantity) } : line);
    });
    setReviewOpen(false);
    setQuoteOpen(true);
  }
  return <div className="estimate-inquiry">
    <h3>از برآورد تا استعلام، یک قدم.</h3>
    <p>{valid ? `${fa(quantity)} ${product.unit} ${product.name}؛ نتیجه و ابعاد به فرم منتقل می‌شود. مشخصات فنی را پیش از افزودن به سبد بررسی کنید.` : 'این مقدار از محدوده ثبت آنلاین خارج است؛ برای بررسی تأمین با پاداش تماس بگیرید.'}</p>
    <button className="button button-orange" disabled={!ready || !valid} onClick={() => setReviewOpen(true)}><ClipboardList size={18}/>بررسی و استعلام این برآورد<ArrowLeft size={18}/></button>
    {reviewOpen && <ProductModal product={product} initialQuantity={quantity} initialNote={note.slice(0, 300)} onAdd={add} onClose={() => setReviewOpen(false)}/>}
    {quoteOpen && <QuoteModal initialKind="order" cart={cart} setCart={setCart} onClose={() => setQuoteOpen(false)}/>}
  </div>;
}
