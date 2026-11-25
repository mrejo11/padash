'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useRef,useState,type ReactNode} from 'react';
import {Activity,ArrowUpLeft,CalendarClock,ChevronLeft,ClipboardList,LayoutDashboard,LockKeyhole,LogOut,Menu,Newspaper,Package} from 'lucide-react';
import Brand from '../../components/brand';

const sections=[
  {href:'/management',label:'نمای کلی',icon:LayoutDashboard},
  {href:'/management/requests',label:'درخواست‌های مشتریان',icon:ClipboardList},
  {href:'/management/follow-ups',label:'پیگیری‌های امروز',icon:CalendarClock},
  {href:'/management/news',label:'اخبار و رویدادها',icon:Newspaper},
  {href:'/management/products',label:'مشخصات فنی محصولات',icon:Package},
  {href:'/management/system',label:'وضعیت سامانه',icon:Activity},
];
export default function AdminShell({children,authenticated,onSignedOut,logoutDisabled=false}:{children:ReactNode;authenticated:boolean;onSignedOut:()=>void;logoutDisabled?:boolean}){
  const pathname=usePathname(),mobile=useRef<HTMLDetailsElement>(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const current=sections.find(section=>section.href===pathname)||sections[0];
  const navigation=<nav aria-label="منوی مدیریت">{sections.map(section=><Link key={section.href} href={section.href} prefetch={false} aria-current={pathname===section.href?'page':undefined} className={'admin-sidebar-link'+(pathname===section.href?' active':'')} onClick={()=>mobile.current?.removeAttribute('open')}><section.icon size={19}/>{section.label}</Link>)}</nav>;
  async function logout(){
    setBusy(true);setError('');
    try{const response=await fetch('/api/admin/session',{method:'DELETE'});if(!response.ok)throw new Error('خروج انجام نشد؛ دوباره تلاش کنید.');onSignedOut();}
    catch(error){setError(error instanceof Error?error.message:'ارتباط برقرار نشد.');}
    finally{setBusy(false);}
  }
  return <div className="admin-shell admin-shell-v2"><a className="skip-link" href="#admin-content">رفتن به محتوای مدیریت</a>
    <aside className="admin-sidebar"><Brand className="admin-brand" subtitle="مدیریت فروش و محتوا"/><div className="admin-sidebar-label">فضای مدیریت پاداش</div>{navigation}
      <div className="admin-sidebar-bottom"><span><LockKeyhole size={15}/>دسترسی ویژه مدیریت</span><Link href="/">مشاهده وب‌سایت<ArrowUpLeft size={16}/></Link></div>
    </aside>
    <div className="admin-workspace"><header className="admin-topbar"><div className="admin-breadcrumb">بازرگانی پاداش<ChevronLeft size={14}/><b>{current.label}</b></div><div className="admin-top-actions"><Link href="/" className="admin-site-link">مشاهده سایت<ArrowUpLeft size={15}/></Link>{authenticated&&<button className="admin-logout" disabled={busy||logoutDisabled} onClick={logout}><LogOut size={16}/>{busy?'در حال خروج…':'خروج امن'}</button>}</div></header>
      <details className="admin-mobile-navigation" ref={mobile}><summary><Menu size={19}/><span>منوی مدیریت</span><b>{current.label}</b></summary>{navigation}</details>
      <main className="admin-content" id="admin-content">{error&&<div className="admin-error" role="alert">{error}</div>}{children}</main>
    </div>
  </div>;
}
