import Image from 'next/image';
import { BRAND_LOGO } from '../lib/brand-assets';

export default function MaterialShowcase() {
  return <div className="material-brand">
    <Image src={BRAND_LOGO} alt="لوگوی بازرگانی پاداش" width={400} height={400} loading="eager" fetchPriority="high" sizes="(max-width: 760px) 150px, (max-width: 1200px) 32vw, 400px"/>
  </div>;
}
