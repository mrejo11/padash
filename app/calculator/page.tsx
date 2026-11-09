import PublicPage from '../../components/public-page';
import RollCalculator from '../roll-calculator';
import JsonLd from '../../components/json-ld';
import { breadcrumbs, pageMetadata } from '../../lib/seo';
import { calculatorProfile } from '../../lib/estimate-products';
export const metadata = pageMetadata('متره عایق، یونولیت، نخ و پیچ شیروانی', 'محاسبه رول و ورق عایق، ورق و بلوک یونولیت، کلاف نخ و طناب و تعداد پیچ شیروانی با ابعاد واقعی، برنامه برش، چیدمان اتصال و بسته‌بندی.', '/calculator');
export default async function CalculatorPage({searchParams}:{searchParams:Promise<{product?:string|string[]}>}) {
  const selected=(await searchParams).product;
  const initialProductId=typeof selected==='string'&&calculatorProfile(selected)?selected:undefined;
  return <PublicPage><JsonLd value={breadcrumbs([{ name: 'صفحه اصلی', path: '/' }, { name: 'محاسبه مقدار عایق', path: '/calculator' }])}/>
    <div className="content-heading"><span className="eyebrow">ابزار متره و برنامه‌ریزی خرید</span><h1>محاسبه مقدار عایق و ملزومات</h1><p>از عایق و یونولیت تا نخ و پیچ شیروانی؛ محصول را انتخاب کنید و اندازه‌ها را از پروژه و بسته‌بندی واقعی وارد کنید. روش محاسبه با نوع محصول تغییر می‌کند.</p></div>
    <div className="standalone-calculator"><RollCalculator key={initialProductId||'EL-R'} initialProductId={initialProductId}/></div></PublicPage>;
}
