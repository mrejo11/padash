import PublicPage from '../../components/public-page';
import RollCalculator from '../roll-calculator';
import JsonLd from '../../components/json-ld';
import { breadcrumbs, pageMetadata } from '../../lib/seo';
export const metadata = pageMetadata('محاسبه مقدار عایق رولی', 'محاسبه مساحت و تعداد رول عایق از ابعاد واقعی، سطح مستطیلی و دورپیچ لوله؛ با ذخیره انتخابی، جزئیات فرمول و منابع سازنده.', '/calculator');
export default function CalculatorPage() {
  return <PublicPage><JsonLd value={breadcrumbs([{ name: 'صفحه اصلی', path: '/' }, { name: 'محاسبه مقدار عایق', path: '/calculator' }])}/>
    <div className="content-heading"><span className="eyebrow">ابزار متره و برنامه‌ریزی خرید</span><h1>محاسبه مقدار عایق رولی</h1><p>ابعاد واقعی رول و سطح را وارد کنید. حداقل مساحتی و برنامهٔ برش سادهٔ دورپیچ لوله، با فرض‌های مشخص و جداگانه نمایش داده می‌شوند.</p></div>
    <div className="standalone-calculator"><RollCalculator/></div></PublicPage>;
}
