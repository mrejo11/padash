import {env} from 'cloudflare:workers';
import {quotePayload} from '../../../lib/quote-validation';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function POST(request:Request){
 const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin)return json({error:'مبدأ درخواست معتبر نیست.'},403);
 if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'قالب درخواست معتبر نیست.'},415);
 if(!env.DB)return json({error:'سامانه ثبت درخواست موقتاً در دسترس نیست.'},503);
 let input:unknown;
 try{
  const reader=request.body?.getReader();if(!reader)return json({error:'درخواست خالی است.'},400);
  const chunks:Uint8Array[]=[];let total=0;
  while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>16384){await reader.cancel();return json({error:'حجم درخواست بیش از حد مجاز است.'},413);}chunks.push(value);}
  const bytes=new Uint8Array(total);let pos=0;for(const chunk of chunks){bytes.set(chunk,pos);pos+=chunk.length;}
  input=JSON.parse(new TextDecoder().decode(bytes));
 }catch{return json({error:'اطلاعات درخواست قابل خواندن نیست.'},400);}
 const parsed=quotePayload.safeParse(input);
 if(!parsed.success)return json({error:'نام، شماره تماس، شهر و مشخصات اقلام را بررسی کنید. برای مشاوره، حداقل ۱۰ حرف درباره پروژه بنویسید.'},400);
 const data=parsed.data;
 try{
  const existing=await env.DB.prepare('SELECT id, token FROM quotes WHERE token = ?').bind(data.requestId).first<{id:string;token:string}>();
  if(existing)return json(existing);
  const ip=request.headers.get('cf-connecting-ip')||'local';
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(new Date().toISOString().slice(0,10)+':padash:'+ip));
  const ipHash=Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('');
  const createdAt=new Date().toISOString(), cutoff=new Date(Date.now()-86400000).toISOString();
  const id='PD-'+crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase();
  const result=await env.DB.prepare("INSERT INTO quotes (id,token,name,company,phone,city,items,message,status,created_at,ip_hash) SELECT ?,?,?,?,?,?,?,?,'new',?,? WHERE (SELECT COUNT(*) FROM quotes WHERE ip_hash = ? AND created_at > ?) < 5").bind(id,data.requestId,data.name,data.company,data.phone,data.city,JSON.stringify(data.items),data.message,createdAt,ipHash,ipHash,cutoff).run();
  if(!result.meta.changes)return json({error:'تعداد درخواست‌های امروز از این شبکه به حد مجاز رسیده است. فردا دوباره تلاش کنید.'},429);
  return json({id,token:data.requestId},201);
 }catch{
  const existing=await env.DB.prepare('SELECT id, token FROM quotes WHERE token = ?').bind(data.requestId).first().catch(()=>null);
  if(existing)return json(existing);
  return json({error:'ثبت درخواست کامل نشد. اطلاعات سبد محفوظ است؛ دوباره تلاش کنید.'},503);
 }
}
