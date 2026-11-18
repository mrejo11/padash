'use client';
import {LoaderCircle,LockKeyhole} from 'lucide-react';
import AdminLogin from './admin-login';
export default function AdminAccess({loading,code,onSuccess}:{loading:boolean;code:string;onSuccess:()=>void}){
  return <section className="admin-login-panel">{loading?<div className="admin-loading" role="status"><LoaderCircle className="spin" size={26}/><p>در حال بررسی دسترسی…</p></div>:<><span className="admin-login-icon"><LockKeyhole size={28}/></span><h2>ورود به مدیریت پاداش</h2>{code==='signin'?<><p>برای مشاهده اطلاعات مشتریان و مدیریت سایت وارد شوید.</p><AdminLogin onSuccess={onSuccess}/></>:code==='not_configured'?<p>ورود مدیر هنوز فعال نشده است. مسئول سایت باید تنظیمات دسترسی مدیر را در میزبان تکمیل کند.</p>:<p>ارتباط با سامانه برقرار نشد. از دکمهٔ به‌روزرسانی دوباره تلاش کنید.</p>}</>}</section>;
}
