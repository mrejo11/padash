'use client';
import {useEffect,useState} from 'react';
import {Activity,CheckCircle2,RefreshCw,ShieldCheck,TriangleAlert} from 'lucide-react';
import AdminShell from '../admin-shell';
import AdminAccess from '../admin-access';
import {fa} from '../../../lib/catalog';
type Status={checkedAt:string;storage:'ok'|'unavailable';platform:string;clientIdentification:string;limits:{quotes:number;quoteWindowHours:number;login:number;loginWindowMinutes:number}};
export default function SystemStatus(){
  const [data,setData]=useState<Status|null>(null),[code,setCode]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState(''),[revision,setRevision]=useState(0);
  const refresh=()=>{setLoading(true);setError('');setRevision(value=>value+1);};
  useEffect(()=>{const controller=new AbortController();
    void fetch('/api/admin/status',{cache:'no-store',signal:controller.signal}).then(async response=>{const result=await response.json();if(controller.signal.aborted)return;if(!response.ok){if(result.code){setCode(result.code);setData(null);return;}throw new Error(result.error||'بررسی وضعیت انجام نشد.');}setData(result);setCode('');}).catch(error=>{if(!controller.signal.aborted)setError(error instanceof Error?error.message:'ارتباط برقرار نشد.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();
  },[revision]);
  return <AdminShell authenticated={Boolean(data&&!code)} onSignedOut={()=>{setData(null);setCode('signin');refresh();}}>
    <div className="admin-page-heading"><div><span className="admin-eyebrow">سلامت و دسترسی</span><h1>وضعیت سامانه</h1><p>نتیجهٔ بررسی اتصال و حفاظت از فرم‌ها در همین لحظه.</p></div><button className="button button-outline" disabled={loading} onClick={refresh} aria-label="بررسی دوباره وضعیت"><RefreshCw size={17} className={loading?'spin':''}/>بررسی دوباره</button></div>
    {error&&<div className="admin-error" role="alert">{error}</div>}
    {!data||code?<AdminAccess loading={loading} code={code} onSuccess={refresh}/>:<>
      <div className="admin-system-grid" aria-busy={loading}>{[
        {title:'ذخیره‌سازی درخواست‌ها و اخبار',ok:data.storage==='ok',text:data.storage==='ok'?'اتصال برقرار است':'اتصال برقرار نیست؛ تنظیمات ذخیره‌سازی در میزبان باید بررسی شود.'},
        {title:'شناسایی مشتری برای محدودیت فرم',ok:data.clientIdentification!=='unavailable',text:data.clientIdentification==='unavailable'?'شناسهٔ معتبر از میزبان دریافت نشد.':data.clientIdentification==='local'?'محیط محلی آزمایش؛ مشتریان واقعی در این محیط شناسایی نمی‌شوند.':'شناسایی از پراکسی معتبر '+(data.clientIdentification==='vercel'?'Vercel':'Netlify')},
        {title:'دسترسی مدیریت',ok:true,text:'ورود مدیر تأیید شد؛ اطلاعات مدیریتی بدون نشست معتبر در دسترس نیست.'},
      ].map(card=><section className="admin-panel admin-system-card" key={card.title}>{card.ok?<CheckCircle2 size={24}/>:<TriangleAlert size={24}/>}<h2>{card.title}</h2><span className={'admin-health-pill '+(card.ok?'is-ok':'is-error')}>{card.ok?'تأیید شد':'نیاز به بررسی'}</span><p>{card.text}</p></section>)}</div>
      <section className="admin-panel admin-system-notes"><h2><ShieldCheck size={19}/>حفاظت از فرم‌ها</h2><p>هر IP می‌تواند حداکثر {fa(data.limits.quotes)} درخواست جدید در {fa(data.limits.quoteWindowHours)} ساعت ثبت کند. این محدودیت برای کل سایت مشترک نیست؛ کاربران یک شبکهٔ مشترک ممکن است IP یکسان داشته باشند.</p><p>ورود مدیریت: حداکثر {fa(data.limits.login)} تلاش در {fa(data.limits.loginWindowMinutes)} دقیقه برای هر IP. اطلاعات مشتریان و رمزها در این صفحه نمایش داده نمی‌شوند.</p></section>
      <p className="admin-last-sync"><Activity size={15}/>آخرین بررسی: <time dateTime={data.checkedAt}>{new Date(data.checkedAt).toLocaleString('fa-IR',{timeZone:'Asia/Tehran'})}</time>{error&&' · اطلاعات قبلی؛ بررسی تازه ناموفق بود'}</p>
    </>}
  </AdminShell>;
}
