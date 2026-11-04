import {z} from 'zod';
import {products,normalizeDigits,validThickness,validQuantity} from './catalog';
const item=z.object({productId:z.string(),thickness:z.number().nullable(),quantity:z.number().finite().min(.1).max(100000),note:z.string().trim().max(300)}).refine(x=>products.some(p=>p.id===x.productId&&validThickness(p,x.thickness)),{message:'محصول یا ضخامت انتخاب‌شده معتبر نیست.'})
 .refine(x=>x.thickness!==null||x.note.length>=5,{message:'مشخصات محصول سفارشی را در توضیحات قلم بنویسید.'})
 .refine(x=>products.some(p=>p.id===x.productId&&validQuantity(p,x.quantity)),{message:'مقدار درخواست معتبر نیست؛ تعداد رول یا ورق باید عدد صحیح باشد.'});
export const quotePayload=z.object({
 requestId:z.string().uuid(),name:z.string().trim().min(2).max(80),company:z.string().trim().max(120).default(''),
 phone:z.string().transform(s=>normalizeDigits(s).replace(/[\s()-]/g,'')).pipe(z.string().regex(/^\+?[0-9]{8,15}$/)),
 city:z.string().trim().min(2).max(80),items:z.array(item).max(30),message:z.string().trim().max(2000).default(''),consent:z.literal('yes'),website:z.string().max(0).optional(),
 kind:z.enum(['order','consultation']).optional(),
}).refine(x=>x.items.length>0||x.message.length>=10,{message:'محصول یا شرح نیاز پروژه را وارد کنید.'})
 .refine(x=>x.kind!=='order'||x.items.length>0,{message:'برای استعلام سفارش حداقل یک محصول انتخاب کنید.'})
 .refine(x=>x.kind!=='consultation'||x.message.length>=10,{message:'شرح نیاز مشاوره را وارد کنید.'});
export { statusLabels } from './management-model';
