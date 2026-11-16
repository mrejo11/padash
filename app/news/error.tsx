'use client';

import Link from 'next/link';
import PublicPage from '../../components/public-page';

export default function NewsError({reset}: {reset: () => void}) {
  // Preserve the server error response so an outage is not indexed as an empty archive.
  return <PublicPage><div className="content-empty"><h1>دریافت اخبار موقتاً ممکن نیست</h1>
    <p>برای دریافت خبرها دوباره تلاش کنید یا با مدیران بازرگانی پاداش تماس بگیرید.</p>
    <button type="button" className="button button-outline" onClick={reset}>تلاش دوباره</button>
    <Link href="/#contact" className="text-button">ارتباط با مدیران</Link>
  </div></PublicPage>;
}
