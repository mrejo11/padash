'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useReducedMotion } from '../lib/use-reduced-motion';

const slides = [
  { kind: 'brand', name: 'بازرگانی پاداش', src: '/images/padash-logo-slim.png', alt: 'نشان بازرگانی پاداش', eyebrow: 'همراه انتخاب‌های مطمئن', title: 'عایق مطمئن، آسایش ماندگار.', duration: 12000, href: '/products' },
  { kind: 'photo', name: 'عایق‌های حرارتی و برودتی', src: '/images/insulation-hero.png', alt: 'عایق الیافی با روکش فویل و عایق الاستومری لوله‌ای', eyebrow: 'برای جزئیاتی که اهمیت دارند', title: 'انتخاب درست، از اینجا شروع می‌شود.', duration: 5000, href: '/products/el-r' },
  { kind: 'product', name: 'پشم سنگ تخته‌ای', src: '/images/products/1220-4960.jpg', alt: 'لایه‌های پشم سنگ تخته‌ای', eyebrow: 'از ساختمان تا صنعت', title: 'متریال مناسب برای پروژه شما.', duration: 5000, href: '/products/vn-1220' },
  { kind: 'product', name: 'ورق یونولیت', src: '/images/products/eps-sheets.jpg', alt: 'ورق‌های سفید یونولیت در ضخامت‌های مختلف', eyebrow: 'تازه‌های کاتالوگ پاداش', title: 'ورق یونولیت برای پروژه شما.', duration: 5000, href: '/products/eps-sheet' },
] as const;

export default function MaterialShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const reducedMotion = useReducedMotion();
  const carousel = useRef<HTMLDivElement>(null);
  const running = !paused && !hovered && visible && pageVisible && !reducedMotion;

  useEffect(() => {
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 });
    if (carousel.current) observer.observe(carousel.current);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', updateVisibility); };
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setActive(value => (value + 1) % slides.length), slides[active].duration);
    return () => window.clearTimeout(timer);
  }, [active, running]);

  function select(index: number) {
    setPaused(true);
    setActive((index + slides.length) % slides.length);
  }

  return <div ref={carousel} className="brand-carousel" role="region" aria-roledescription="اسلایدر" aria-label="معرفی بازرگانی پاداش"
    data-running={running}
    onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(true); }}
    onPointerLeave={() => setHovered(false)}
    onFocusCapture={event => {
      if (!event.currentTarget.contains(event.relatedTarget) && !(event.target instanceof Element && event.target.closest('.brand-carousel-play'))) setPaused(true);
    }}>
    <div className="brand-carousel-stage" aria-live={paused || reducedMotion ? 'polite' : 'off'} aria-atomic="true">
      {slides.map((slide, index) => <div key={slide.src} className={'brand-slide brand-slide-' + slide.kind + (index === active ? ' is-active' : '')}
        role="group" aria-roledescription="اسلاید" aria-label={`${index + 1} از ${slides.length}: ${slide.name}`} aria-hidden={index !== active}>
        <div className="brand-slide-art"><Image src={slide.src} alt={slide.alt} fill preload={index === 0} sizes="(max-width: 600px) 92vw, (max-width: 900px) 600px, 580px"/></div>
        <div className="brand-slide-caption"><span>{slide.eyebrow}</span><p>{slide.title}</p></div>
      </div>)}
      <span className="brand-carousel-signature" dir="ltr" aria-hidden="true">PADASH <span/> INSULATION & COMMERCE</span>
    </div>
    <div className="brand-carousel-bottom">
      <a href={slides[active].href} className="brand-carousel-link">{slides[active].kind==='brand'?'کشف محصولات':'مشخصات محصول'}<ArrowLeft size={16}/></a>
      <div className="brand-carousel-controls" role="group" aria-label="کنترل تصاویر">
        <button type="button" onClick={() => select(active - 1)} aria-label="تصویر قبلی"><ChevronRight size={17}/></button>
        <div className="brand-carousel-dots">{slides.map((slide, index) => <button key={slide.src} type="button" onClick={() => select(index)} aria-label={`نمایش ${slide.name}`} aria-current={active === index ? 'true' : undefined}><span/></button>)}</div>
        <button type="button" onClick={() => select(active + 1)} aria-label="تصویر بعدی"><ChevronLeft size={17}/></button>
        {!reducedMotion && <button type="button" className="brand-carousel-play" onClick={() => setPaused(value => !value)} aria-label={paused ? 'پخش خودکار تصاویر' : 'توقف پخش خودکار تصاویر'}>{paused ? <Play size={14}/> : <Pause size={14}/>}</button>}
      </div>
    </div>
  </div>;
}
