import {z} from 'zod';
import {products,normalizeDigits} from './catalog';
const item=z.object({productId:z.string(),thickness:z.number(),quantity:z.number().finite().min(.1).max(100000),note:z.string().trim().max(300)}).refine(x=>products.some(p=>p.id===x.productId&&p.thicknesses.includes(x.thickness)),{message:'محصول یا ضخامت انتخاب‌شده معتبر نیست.'});
export const quotePayload=z.object({
 requestId:z.string().uuid(),name:z.string().trim().min(2).max(80),company:z.string().trim().max(120).default(''),
 phone:z.string().transform(s=>normalizeDigits(s).replace(/[\s()-]/g,'')).pipe(z.string().regex(/^\+?[0-9]{8,15}$/)),
 city:z.string().trim().min(2).max(80),items:z.array(item).max(30),message:z.string().trim().max(2000).default(''),consent:z.literal('yes'),website:z.string().max(0).optional(),
}).refine(x=>x.items.length>0||x.message.length>=10,{message:'محصول یا شرح نیاز پروژه را وارد کنید.'});
export const statusLabels:Record<string,string>={new:'در انتظار بررسی',reviewing:'در حال بررسی',quoted:'پیش‌فاکتور ارائه شده',closed:'بسته شده'};
