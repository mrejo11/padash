
import Link from 'next/link';
import Image from 'next/image';
import { BRAND_MARK } from '../lib/brand-assets';

export default function Brand({ className = '', subtitle = 'عایق حرارتی، برودتی و صوتی' }: { className?: string; subtitle?: string }) {
  return <Link href="/" className={'brand padash-brand ' + className}>
    <span className="brand-logo"><Image src={BRAND_MARK} alt="" width={72} height={72} sizes="(max-width: 420px) 46px, 72px"/></span>
    <span className="brand-text"><b>بازرگانی پاداش</b><small>{subtitle}</small></span>
  </Link>;
}
