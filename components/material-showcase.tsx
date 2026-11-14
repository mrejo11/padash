import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpLeft } from 'lucide-react';

export default function MaterialShowcase() {
  return <div className="material-editorial">
    <div className="material-brand">
      <div className="material-brand-art"><Image src="/images/padash-logo-slim.png" alt="لوگوی بازرگانی پاداش" fill preload sizes="(max-width: 760px) 90vw, 520px"/></div>
      <div className="material-brand-caption"><span>همراه انتخاب‌های مطمئن</span><b>عایق مطمئن، آسایش ماندگار.</b></div>
    </div>
    <div className="material-footnote"><span dir="ltr">PADASH / INSULATION & COMMERCE</span><Link href="/products">کشف محصولات<ArrowUpLeft size={20}/></Link></div>
  </div>;
}
