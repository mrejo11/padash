import PublicPage from '../../components/public-page';
import RollCalculator from '../roll-calculator';
import JsonLd from '../../components/json-ld';
import { breadcrumbs, pageMetadata } from '../../lib/seo';
import { estimateProfile } from '../../lib/estimate-products';
export const metadata = pageMetadata('محاسبه مقدار عایق، فویل، توری و ورق', 'محاسبه تعداد رول و ورق پشم شیشه، پشم سنگ، فوم، فویل، توری و کارتن‌پلاست با ابعاد واقعی، هم‌پوشانی، برنامه برش و ذخیره انتخابی.', '/calculator');
export default async function CalculatorPage({searchParams}:{searchParams:Promise<{product?:string|string[]}>}) {
  const selected=(await searchParams).product;
  const initialProductId=typeof selected==='string'&&estimateProfile(selected)?selected:undefined;
  return <PublicPage><JsonLd value={breadcrumbs([{ name: 'صفحه اصلی', path: '/' }, { name: 'محاسبه مقدار عایق', path: '/calculator' }])}/>
    <div className="content-heading"><span className="eyebrow">ابزار متره و برنامه‌ریزی خرید</span><h1>محاسبه مقدار عایق و ملزومات</h1><p>محصول و شکل عرضه را انتخاب کنید و ابعاد واقعی رول یا ورق را وارد کنید. حداقل مساحتی و برنامهٔ پوشش با هم‌پوشانی و برش، جداگانه نمایش داده می‌شوند.</p></div>
    <div className="standalone-calculator"><RollCalculator key={initialProductId||'EL-R'} initialProductId={initialProductId}/></div></PublicPage>;
}
