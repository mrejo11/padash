import Image from 'next/image';
import { ArrowUpLeft, Layers3 } from 'lucide-react';

export default function MaterialShowcase() {
  return <div className="material-showcase">
    <div className="material-photo">
      <Image src="/images/insulation-hero.png" alt="نمایی از ساختار عایق الیافی با روکش فویل و عایق الاستومری لوله‌ای" fill priority sizes="(max-width: 900px) 100vw, 50vw"/>
      <span className="material-photo-label"><span/>عایق حرارتی، برودتی و صوتی</span>
      <div className="material-photo-caption"><span dir="ltr">THE RIGHT LAYER.</span><p>کیفیت یک پروژه،<br/><strong>از جزئیات شروع می‌شود.</strong></p></div>
    </div>
    <a className="material-floating-link" href="/products"><span className="material-floating-icon"><Layers3 size={25}/></span><span><b>متریال مناسب پروژه شما</b><small>بررسی محصولات و مشخصات</small></span><ArrowUpLeft size={22}/></a>
    <span className="material-side-note" dir="ltr">PADASH · INSULATION SOLUTIONS</span>
  </div>;
}
