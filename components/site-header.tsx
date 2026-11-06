'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUpLeft, ClipboardList, Menu, Phone, X } from 'lucide-react';
import { fa } from '../lib/catalog';
import Brand from './brand';

export default function SiteHeader({ onQuote, cartCount = 0 }: { onQuote?: () => void; cartCount?: number }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
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
    const desktop = window.matchMedia('(min-width: 1101px)');
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
      <a href={home ? '#catalog' : '/products'} aria-current={pathname.startsWith('/products')?'page':undefined}>محصولات</a>
      <a href={home ? '#solutions' : '/#solutions'}>انتخاب بر اساس کاربرد</a>
      <a href="/calculator" aria-current={pathname==='/calculator'?'page':undefined}>محاسبه مقدار</a>
      <a href="/guides" aria-current={pathname.startsWith('/guides')?'page':undefined}>راهنمای خرید</a>
      <a href={home ? '#contact' : '/#contact'}>تماس با ما</a>
    </nav>
    <div className="header-actions">
      {onQuote ? <button className="button button-dark quote-header" onClick={() => { setOpen(false); onQuote(); }} aria-label="درخواست مشاوره و پیش‌فاکتور">
        <ClipboardList size={18}/><span className="header-action-label">{cartCount?'سبد استعلام':'مشاوره و استعلام'}</span><span className="header-action-short">استعلام</span>
        {cartCount > 0 && <span className="cart-badge">{fa(cartCount)}</span>}<ArrowUpLeft size={16}/>
      </button> : <a className="button button-dark quote-header" href="/#contact" aria-label="مشاوره و تماس با مدیران"><Phone size={17}/><span className="header-action-label">مشاوره و تماس</span><span className="header-action-short">تماس</span></a>}
      <button ref={toggle} className="icon-button mobile-menu" onClick={() => setOpen(!open)} aria-controls={menuId} aria-expanded={open} aria-label={open ? 'بستن منو' : 'باز کردن منو'}>{open ? <X/> : <Menu/>}</button>
    </div>
  </div></header>;
}
