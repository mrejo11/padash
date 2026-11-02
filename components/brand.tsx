import Image from 'next/image';

/** The supplied artwork stays intact; sizing is handled by the surrounding layout. */
export default function Brand({ className = '', subtitle = 'عایق‌های حرارتی و برودتی' }: { className?: string; subtitle?: string }) {
  return <a href="/" className={'brand padash-brand ' + className} aria-label="بازرگانی پاداش، صفحه اصلی">
    <span className="brand-logo"><Image src="/images/padash-logo.png" alt="" width={72} height={72} sizes="72px"/></span>
    <span className="brand-text"><b>بازرگانی پاداش</b><small>{subtitle}</small></span>
  </a>;
}
