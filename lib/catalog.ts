import { partnerProducts } from './partner-products';
export type ProductImage = { src:string; width:number; height:number; alt:string };
export type Product = { id:string; name:string; en:string; category:string; material:string; form:string; use:string; desc:string; thicknesses:number[]; unit:string; art:string; tag:string; cover:string; notes:string[];
  images?:ProductImage[]; specifications?:{label:string; value:string}[]; requestHint?:string; relatedProducts?:string[] };
export const categories = [ {id:'all',name:'همه محصولات'}, {id:'elastomeric',name:'عایق الاستومری'}, {id:'rockwool',name:'پشم سنگ'}, {id:'glasswool',name:'پشم شیشه'}, {id:'polymer',name:'فوم و پلی‌اتیلن'}, {id:'facing',name:'فویل و روکش'}, {id:'mesh',name:'توری'}, {id:'sheets',name:'کارتن‌پلاست'} ];
const generalProducts:Product[] = [
 {id:'EL-R',name:'عایق الاستومری رولی',en:'ELASTOMERIC · ROLL',category:'elastomeric',material:'فوم الاستومری',form:'رول',use:'کانال هوا و سطوح تأسیسات',desc:'ساختار منعطف و سلول‌بسته برای عایق‌کاری سطوح و کانال‌های تأسیساتی. انتخاب ضخامت و پوشش باید با دما و رطوبت پروژه تطبیق داده شود.',thicknesses:[6,9,13,19,25,32],unit:'مترمربع',art:'roll',tag:'تأسیسات و تهویه',cover:'ساده / روکش‌دار',notes:['مناسب برای بررسی در کاربردهای HVAC','نیازمند درزبندی کامل و چسب سازگار','محیط بیرونی نیازمند بررسی پوشش محافظ']},
 {id:'RW-S',name:'پشم سنگ تخته‌ای',en:'STONE WOOL · BOARD',category:'rockwool',material:'الیاف معدنی سنگ',form:'تخته',use:'جداره‌ها و تجهیزات صنعتی',desc:'عایق الیافی به شکل تخته برای بررسی در کاربردهای حرارتی و صوتی ساختمان و صنعت. دانسیته، ضخامت و نوع روکش متناسب با پروژه مشخص می‌شود.',thicknesses:[30,50,75,100],unit:'مترمربع',art:'board',tag:'حرارتی و صوتی',cover:'ساده / فویل آلومینیوم',notes:['انتخاب دانسیته بر اساس محل نصب','کنترل رطوبت و جزئیات اجرایی ضروری است','واکنش در برابر آتش مطابق گواهی محصول منتخب']},
 {id:'EL-T',name:'عایق الاستومری لوله‌ای',en:'ELASTOMERIC · TUBE',category:'elastomeric',material:'فوم الاستومری',form:'لوله‌ای',use:'لوله‌های سرمایش و گرمایش',desc:'مقطع لوله‌ای انعطاف‌پذیر برای عایق‌کاری خطوط تأسیسات. قطر داخلی باید با قطر بیرونی لوله و ضخامت با شرایط کارکرد تطبیق داده شود.',thicknesses:[9,13,19,25],unit:'متر طول',art:'tube',tag:'خطوط لوله',cover:'ساده / پوشش محافظ',notes:['قطر بیرونی لوله را در درخواست درج کنید','اتصالات و زانوها نیز باید درزبندی شوند','محدوده دمایی تابع برند و مدل نهایی است']},
 {id:'GW-F',name:'پشم شیشه فویل‌دار',en:'GLASS WOOL · FOIL FACED',category:'glasswool',material:'الیاف شیشه',form:'رول',use:'سقف، جداره و کانال',desc:'عایق الیافی رولی با روکش فویل برای بررسی در سطوح ساختمانی و کانال‌ها. نوع روکش و لایه کنترل بخار باید با جزئیات اجرایی پروژه هماهنگ باشد.',thicknesses:[25,50,75,100],unit:'مترمربع',art:'foil',tag:'ساختمان و تأسیسات',cover:'فویل آلومینیوم',notes:['ضخامت و دانسیته هنگام استعلام تعیین شود','پیوستگی روکش در محل درزها اهمیت دارد','برای نصب از تجهیزات حفاظت فردی استفاده شود']},
 {id:'RW-P',name:'پشم سنگ لوله‌ای',en:'STONE WOOL · PIPE SECTION',category:'rockwool',material:'الیاف معدنی سنگ',form:'لوله‌ای',use:'خطوط گرم و تجهیزات',desc:'مقاطع پیش‌ساخته پشم سنگ برای خطوط لوله صنعتی. ابعاد و پوشش نهایی پس از بررسی دمای کار، قطر لوله و شرایط محیطی مشخص می‌شود.',thicknesses:[25,30,50,75,100],unit:'متر طول',art:'mineral',tag:'صنعت و موتورخانه',cover:'ساده / فویل / ورق محافظ',notes:['متناسب با قطر بیرونی لوله انتخاب شود','دمای مجاز از دیتاشیت محصول تأیید شود','در محیط مرطوب حفاظت بیرونی بررسی شود']},
 {id:'PE-R',name:'فوم پلی‌اتیلن رولی',en:'POLYETHYLENE · FOAM',category:'polymer',material:'فوم پلی‌اتیلن',form:'رول',use:'کاربردهای عمومی ساختمان',desc:'فوم سبک رولی برای کاربردهای عمومی عایق‌کاری و زیرسازی. تناسب با شرایط دمایی، الزامات حریق و محل نصب باید پیش از خرید تأیید شود.',thicknesses:[5,10,15,20],unit:'مترمربع',art:'white',tag:'سبک و انعطاف‌پذیر',cover:'ساده / متالایز',notes:['انتخاب بر اساس کاربرد و دیتاشیت','کاربرد در دمای بالا نیازمند تأیید فنی است','ابعاد رول بر اساس برند تأمین‌شده متغیر است']},
];
// Stable legacy IDs preserve old requests; partner IDs identify their source catalogue.
export const products:Product[] = [...partnerProducts, ...generalProducts];
export type QuoteItem = {productId:string; thickness:number|null; quantity:number; note:string};
export const fa = (n:number) => new Intl.NumberFormat('fa-IR',{maximumFractionDigits:1}).format(n);
export const normalizeDigits = (s:string) => s.replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠١٢٣٤٥٦٧٨٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
export const validThickness = (product:Product, thickness:unknown) => product.thicknesses.length ? typeof thickness==='number' && product.thicknesses.includes(thickness) : thickness===null;
export const quantityStep = (product:Product) => ['رول','ورق'].includes(product.unit) ? 1 : .1;
export const validQuantity = (product:Product, quantity:number) => Number.isFinite(quantity) && quantity>=quantityStep(product) && quantity<=100000 && (quantityStep(product)!==1 || Number.isInteger(quantity));
export const thicknessLabel = (value:number|null) => value===null ? 'طبق مشخصات درخواست' : fa(value)+' میلی‌متر';
export const productPath = (product:Pick<Product,'id'>) => '/products/'+product.id.toLowerCase();
export const normalizeSearch = (value:string) => normalizeDigits(value).replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200d\s-]+/g,' ').trim().toLowerCase();
export function filterProducts({query='',category='all'}:{query?:string;category?:string}) {
  const words=normalizeSearch(query).split(' ').filter(Boolean);
  return products.filter(product => (category==='all'||product.category===category)
    && words.every(word=>normalizeSearch([product.name,product.en,product.id,product.material,product.use,product.form].join(' ')).includes(word)));
}
