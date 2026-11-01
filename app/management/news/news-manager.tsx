'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, ExternalLink, FileText, LoaderCircle, Plus, RefreshCw, Save } from 'lucide-react';
import type { NewsFields, NewsRecord } from '../../../lib/news';
import { fa } from '../../../lib/catalog';
import AdminLogin from '../admin-login';
const blank: NewsFields = { title: '', summary: '', body: '', kind: 'news', status: 'draft', event_date: '' };

export default function NewsManager() {
  const [items, setItems] = useState<NewsRecord[]>([]);
  const [code, setCode] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<NewsRecord | null>(null);
  const [fields, setFields] = useState<NewsFields>(blank);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/news', { cache: 'no-store' });
      const result = await response.json() as { items: NewsRecord[]; error?: string; code?: string };
      if (!response.ok) {
        if (result.code) { setCode(result.code); setAuthenticated(false); setItems([]); setShowEditor(false); }
        else throw new Error(result.error || 'دریافت اطلاعات انجام نشد.');
        return;
      }
      setItems(result.items); setAuthenticated(true); setCode('');
    } catch (error) { setError(error instanceof Error ? error.message : 'ارتباط برقرار نشد.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  function edit(item: NewsRecord | null) {
    setSelected(item); setFields(item ? { title: item.title, summary: item.summary, body: item.body, kind: item.kind, status: item.status, event_date: item.event_date } : { ...blank });
    setShowEditor(true); setMessage(''); setError('');
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
  async function save(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/admin/news', { method: selected ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(selected ? { id: selected.id, revision: selected.revision, fields } : fields) });
      const result = await response.json() as { item: NewsRecord; error?: string };
      if (response.status === 401) { setAuthenticated(false); setCode('signin'); setItems([]); setSelected(null); setFields(blank); setShowEditor(false); throw new Error('نشست پایان یافته است؛ دوباره وارد شوید.'); }
      if (!response.ok) throw new Error(result.error || 'ذخیره انجام نشد.');
      setSelected(result.item); setFields({ title: result.item.title, summary: result.item.summary, body: result.item.body, kind: result.item.kind, status: result.item.status, event_date: result.item.event_date });
      setMessage(result.item.status === 'published' ? 'خبر منتشر شد و در سایت قابل مشاهده است.' : 'پیش‌نویس ذخیره شد و برای بازدیدکنندگان نمایش داده نمی‌شود.');
      await refresh();
    } catch (error) { setError(error instanceof Error ? error.message : 'ارتباط برقرار نشد.'); }
    finally { setBusy(false); }
  }
  function field(key: keyof NewsFields, value: string) { setFields(previous => ({ ...previous, [key]: value })); setMessage(''); }
  return <main className="news-admin"><header className="news-admin-header"><a href="/management" className="button button-outline"><ArrowRight size={16}/>مدیریت درخواست‌ها</a><a href="/news" target="_blank" rel="noreferrer">مشاهده بخش اخبار<ExternalLink size={15}/></a></header>
    <div className="admin-page-heading"><div><span className="admin-eyebrow">محتوای رسمی بازرگانی پاداش</span><h1>مدیریت اخبار و رویدادها</h1><p>خبر واقعی را پیش‌نویس کنید و پس از بازبینی منتشر کنید.</p></div><button className="button button-outline" onClick={refresh} disabled={loading || busy}><RefreshCw size={16}/>به‌روزرسانی</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {!authenticated ? <section className="admin-login-panel">{loading ? <LoaderCircle className="spin"/> : <><h2>ورود مدیر</h2>{code === 'not_configured' ? <p>رمز مدیریت روی سرور تنظیم نشده است.</p> : code === 'signin' ? <AdminLogin onSuccess={refresh}/> : <p>دریافت وضعیت دسترسی انجام نشد. دوباره تلاش کنید.</p>}</>}</section> : <>
      <div className="news-admin-summary"><span>{fa(items.length)} مطلب · {fa(items.filter(item => item.status === 'published').length)} منتشرشده</span><button className="button button-dark" disabled={busy} onClick={() => edit(null)}><Plus size={17}/>خبر یا رویداد جدید</button></div>
      {items.length ? <div className="news-admin-list">{items.map(item => <article key={item.id}><div><span className={'admin-status ' + (item.status === 'published' ? 'status-confirmed' : '')}>{item.status === 'published' ? 'منتشرشده' : 'پیش‌نویس'}</span><h2>{item.title}</h2><p>{item.summary}</p><small>{item.kind === 'event' ? 'رویداد' : 'خبر'} · آخرین تغییر: {new Date(item.updated_at).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran', dateStyle: 'medium', timeStyle: 'short' })}</small></div><button className="button button-outline" disabled={busy} onClick={() => edit(item)}>ویرایش</button></article>)}</div>
        : <div className="content-empty"><FileText size={32}/><h2>هنوز مطلبی ثبت نشده است</h2><p>هیچ خبر نمونه‌ای به‌جای خبر واقعی منتشر نمی‌شود. از دکمه بالا یک پیش‌نویس بسازید.</p></div>}
      {showEditor && <form ref={formRef} className="news-editor" onSubmit={save} aria-labelledby="news-editor-title"><h2 id="news-editor-title">{selected ? 'ویرایش مطلب' : 'مطلب جدید'}</h2>
        <fieldset disabled={busy}><div className="field-grid"><label className="field">نوع مطلب<select value={fields.kind} onChange={event => field('kind', event.target.value)}><option value="news">خبر و اطلاعیه</option><option value="event">رویداد</option></select></label>
          <label className="field">وضعیت انتشار<select value={fields.status} onChange={event => field('status', event.target.value)}><option value="draft">پیش‌نویس؛ فقط مدیریت</option><option value="published">انتشار عمومی در سایت</option></select></label></div>
          <label className="field">عنوان<input required minLength={8} maxLength={160} value={fields.title} onChange={event => field('title', event.target.value)}/></label>
          <label className="field">خلاصه برای کارت خبر و موتور جست‌وجو<textarea required minLength={20} maxLength={320} rows={3} value={fields.summary} onChange={event => field('summary', event.target.value)}/></label>
          {fields.kind === 'event' && <label className="field">تاریخ رویداد (میلادی)<input type="date" required value={fields.event_date} onChange={event => field('event_date', event.target.value)}/></label>}
          <label className="field">متن کامل<textarea required minLength={80} maxLength={20000} rows={12} value={fields.body} onChange={event => field('body', event.target.value)}/></label>
          <p className="admin-help">متن ساده است؛ بین بندها یک خط خالی بگذارید. کد HTML اجرا نمی‌شود. برای برداشتن خبر از سایت، وضعیت را به پیش‌نویس تغییر دهید. ذخیرهٔ حالت «انتشار عمومی» مطلب را فوراً منتشر می‌کند.</p>
          {message && <p className="admin-save-success" role="status">{message}</p>}
          <div className="document-actions"><button className="button button-orange">{busy ? <LoaderCircle className="spin" size={16}/> : <Save size={16}/>} {busy ? 'در حال ذخیره...' : fields.status === 'published' ? 'ذخیره و انتشار عمومی' : 'ذخیره پیش‌نویس'}</button>
            <button type="button" className="button button-outline" onClick={() => setShowEditor(false)}>بستن ویرایشگر</button>
            {selected?.status === 'published' && <a href={'/news/' + selected.id} target="_blank" rel="noreferrer" className="button button-outline">مشاهده مطلب<ExternalLink size={14}/></a>}</div>
        </fieldset>
      </form>}
    </>}
  </main>;
}
