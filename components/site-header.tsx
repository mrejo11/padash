'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpLeft, ClipboardList, Menu, Phone, X } from 'lucide-react';
import { fa } from '../lib/catalog';
import Brand from './brand';

export default function SiteHeader({ onQuote, onAbout, cartCount = 0 }: { onQuote?: () => void; onAbout?: () => void; cartCount?: number }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const home = Boolean(onQuote);
  useEffect(() => {
    if (!open) return;
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
    }
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !header.current?.contains(event.target)) setOpen(false);
    }
    const desktop = window.matchMedia('(min-width: 1281px)');
    const resize = () => { if (desktop.matches) setOpen(false); };
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', outside);
    desktop.addEventListener('change', resize);
    return () => {
      document.removeEventListener('keydown', escape);
      document.removeEventListener('pointerdown', outside);
      desktop.removeEventListener('change', resize);
    };
  }, [open]);
  return <header className="header site-header" ref={header}><div className="container header-inner">
    <Brand/>
    <nav id={menuId} className={'nav' + (open ? ' mobile-open' : '')} aria-label="منوی اصلی" onClick={() => setOpen(false)}>
      <a href={home ? '#catalog' : '/products'}>محصولات</a>
      <a href={home ? '#solutions' : '/#solutions'}>راهکارها</a>
      <a href={home ? '#estimator' : '/calculator'}>محاسبه عایق</a>
      <a href="/guides">راهنمای انتخاب</a>
      <a href="/news">اخبار پاداش</a>
      <a href={home ? '#contact' : '/#contact'}>تماس با مدیران</a>
      {onAbout && <button onClick={onAbout}>درباره پاداش</button>}
    </nav>
    <div className="header-actions">
      {onQuote ? <button className="button button-dark quote-header" onClick={() => { setOpen(false); onQuote(); }} aria-label="درخواست مشاوره و پیش‌فاکتور">
        <ClipboardList size={18}/><span className="header-action-label">درخواست پیش‌فاکتور</span><span className="header-action-short">استعلام</span>
        {cartCount > 0 && <span className="cart-badge">{fa(cartCount)}</span>}<ArrowUpLeft size={16}/>
      </button> : <a className="button button-dark quote-header" href="/#contact" aria-label="مشاوره و تماس با مدیران"><Phone size={17}/><span className="header-action-label">مشاوره و تماس</span><span className="header-action-short">تماس</span></a>}
      <button ref={toggle} className="icon-button mobile-menu" onClick={() => setOpen(!open)} aria-controls={menuId} aria-expanded={open} aria-label={open ? 'بستن منو' : 'باز کردن منو'}>{open ? <X/> : <Menu/>}</button>
    </div>
  </div></header>;
}
