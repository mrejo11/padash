'use client';

import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { analyticsPreference, setAnalyticsPreference, startTracking, subscribeAnalytics, syncAnalyticsPreference, trackEvent } from '../lib/analytics';

export default function AnalyticsControls() {
  const pathname = usePathname();
  const preference = useSyncExternalStore(subscribeAnalytics, analyticsPreference, () => '');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const open = settingsOpen || !preference;

  useEffect(() => {
    if (preference === 'granted') startTracking(pathname);
  }, [pathname, preference]);

  useEffect(() => {
    window.addEventListener('storage', syncAnalyticsPreference);
    return () => window.removeEventListener('storage', syncAnalyticsPreference);
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.type === 'auxclick' && event.button !== 1) return;
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>('a[href]');
      if (!link) return;
      const product_id = link.dataset.analyticsProduct;
      if (link.hasAttribute('data-analytics-whatsapp')) trackEvent('whatsapp_clicked', { product_id });
      else if (product_id && link.hasAttribute('download')) trackEvent('datasheet_downloaded', { product_id });
      else if (link.protocol === 'tel:') trackEvent('phone_clicked', {});
    }
    if (preference !== 'granted') return;
    document.addEventListener('click', handleClick, true);
    document.addEventListener('auxclick', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('auxclick', handleClick, true);
    };
  }, [preference]);

  function choose(value: 'granted' | 'denied') {
    setSettingsOpen(false);
    setAnalyticsPreference(value);
  }

  return <>
    <button type="button" className="analytics-preference-link" aria-expanded={open} onClick={() => setSettingsOpen(!settingsOpen)}>
      تنظیمات آمار بازدید
    </button>
    {open && <section className="analytics-prompt" aria-label="انتخاب تنظیمات آمار بازدید">
      <p>با اجازهٔ شما، آمار استفاده از سایت را با ابزار گوگل اندازه‌گیری می‌کنیم. <Link href="/privacy#analytics-privacy">حریم خصوصی</Link></p>
      <div>
        <button type="button" className="button button-outline" onClick={() => choose('denied')}>رد کردن</button>
        <button type="button" className="button button-outline" onClick={() => choose('granted')}>اجازه دادن</button>
      </div>
    </section>}
  </>;
}
