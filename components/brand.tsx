
import Link from 'next/link';
import Image from 'next/image';

/** The refined logo is shared by public pages, management and receipts. */
export default function Brand({ className = '', subtitle = 'عایق حرارتی، برودتی و صوتی' }: { className?: string; subtitle?: string }) {
  return <Link href="/" className={'brand padash-brand ' + className} aria-label="بازرگانی پاداش، صفحه اصلی">
    <span className="brand-logo"><Image src="/images/padash-logo.webp" alt="" width={72} height={72} sizes="72px"/></span>
    <span className="brand-text"><b>بازرگانی پاداش</b><small>{subtitle}</small></span>
  </Link>;
}
