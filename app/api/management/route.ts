import {env} from 'cloudflare:workers';
import {statusLabels} from '../../../lib/quote-validation';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
function authorized(request:Request){
 const admin=(env as unknown as {SALES_ADMIN_EMAIL?:string}).SALES_ADMIN_EMAIL?.trim().toLowerCase();
 if(!admin)return json({error:'دسترسی مدیر فروش هنوز تنظیم نشده است.',code:'not_configured'},503);
 const email=request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
 if(!email)return json({error:'برای مدیریت درخواست‌ها وارد حساب مجاز شوید.',code:'signin'},401);
 if(email!==admin)return json({error:'این حساب مجوز دسترسی به درخواست‌های مشتریان را ندارد.',code:'forbidden'},403);
 if(!env.DB)return json({error:'پایگاه داده در دسترس نیست.'},503);
 return null;
}
export async function GET(request:Request){
 const denied=authorized(request);if(denied)return denied;
 const page=Math.max(1,Math.min(100000,Number(new URL(request.url).searchParams.get('page'))||1));
 const [rows,count]=await Promise.all([env.DB!.prepare('SELECT id,name,company,phone,city,items,message,status,created_at FROM quotes ORDER BY created_at DESC LIMIT 30 OFFSET ?').bind((Math.floor(page)-1)*30).all(),env.DB!.prepare('SELECT COUNT(*) AS total FROM quotes').first<{total:number}>()]);
 return json({items:rows.results,total:count?.total||0,page:Math.floor(page)});
}
export async function PATCH(request:Request){
 const denied=authorized(request);if(denied)return denied;
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return json({error:'مبدأ درخواست معتبر نیست.'},403);
 if(Number(request.headers.get('content-length')||0)>1024)return json({error:'حجم درخواست معتبر نیست.'},413);
 let data;try{const text=await request.text();if(text.length>1024)return json({error:'حجم درخواست معتبر نیست.'},413);data=JSON.parse(text);}catch{return json({error:'درخواست معتبر نیست.'},400);}
 if(typeof data.id!=='string'||!/^PD-[A-F0-9]{12}$/.test(data.id)||typeof data.status!=='string'||!Object.hasOwn(statusLabels,data.status))return json({error:'وضعیت یا شناسه معتبر نیست.'},400);
 const result=await env.DB!.prepare('UPDATE quotes SET status = ? WHERE id = ?').bind(data.status,data.id).run();
 return result.meta.changes?json({ok:true}):json({error:'درخواست پیدا نشد.'},404);
}
