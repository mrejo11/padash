'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CalendarClock, Check, ExternalLink, History, LoaderCircle, Phone, Save, X } from 'lucide-react';
import { fa, products, thicknessLabel } from '../../lib/catalog';
import { kindLabels, needsFollowUp, quantities, quoteItems, requestKind, statusLabels, type Quote, type QuoteStatus } from '../../lib/management-model';

export function displayDate(value: string, time = true) {
  return new Date(value.length === 10 ? value + 'T12:00:00+03:30' : value).toLocaleString('fa-IR', {
    timeZone: 'Asia/Tehran', dateStyle: 'medium', ...(time ? { timeStyle: 'short' as const } : {}),
  });
}

function historyLabel(change: string) {
  if (change.startsWith('status:')) {
    const [, before, after] = change.split(':');
    return `وضعیت از «${statusLabels[before as QuoteStatus] || before}» به «${statusLabels[after as QuoteStatus] || after}» تغییر کرد`;
  }
  return ({ internal_note: 'یادداشت داخلی ویرایش شد', assignee: 'مسئول پیگیری تغییر کرد', follow_up_date: 'تاریخ پیگیری تغییر کرد' } as Record<string, string>)[change] || 'اطلاعات درخواست ویرایش شد';
}

export default function RequestDetail({ quote, onClose, onSaved, onSessionExpired }: {
  quote: Quote; onClose: () => void; onSaved: (quote: Quote) => void; onSessionExpired: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [record, setRecord] = useState(quote);
  const [status, setStatus] = useState(quote.status);
  const [note, setNote] = useState(quote.internal_note || '');
  const [assignee, setAssignee] = useState(quote.assignee || '');
  const [followUp, setFollowUp] = useState(quote.follow_up_date || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const changed = status !== record.status || note !== (record.internal_note || '')
    || assignee !== (record.assignee || '') || followUp !== (record.follow_up_date || '');
  useEffect(() => {
    const current = dialog.current;
    const previous = document.body.style.overflow;
    current?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { current?.close(); document.body.style.overflow = previous; };
  }, []);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy || !changed) return;
    setBusy(true); setError(''); setSaved(false);
    try {
      const response = await fetch('/api/management', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: record.token, revision: record.revision || 0, status,
          internal_note: note, assignee, follow_up_date: followUp }),
      });
      const result = await response.json() as { error?: string; quote: Quote };
      if (response.status === 401) { onSessionExpired(); return; }
      if (!response.ok) throw new Error(result.error || 'ذخیره انجام نشد.');
      setRecord(result.quote); setNote(result.quote.internal_note || '');
      setAssignee(result.quote.assignee || ''); setFollowUp(result.quote.follow_up_date || '');
      setSaved(true); onSaved(result.quote);
    } catch (error) { setError(error instanceof Error ? error.message : 'ارتباط برقرار نشد.'); }
    finally { setBusy(false); }
  }
  const items = quoteItems(record);
  return <dialog ref={dialog} className="admin-detail" aria-labelledby="request-detail-title"
    onCancel={event => { if (busy) event.preventDefault(); else onClose(); }}>
    <header className="admin-detail-header">
      <div><span className="admin-eyebrow">{kindLabels[requestKind(record)]} · <bdi>{record.id}</bdi></span>
        <h2 id="request-detail-title">جزئیات درخواست {record.name}</h2><p>{displayDate(record.created_at)}</p></div>
      <button className="icon-button" aria-label="بستن جزئیات" disabled={busy} onClick={onClose}><X size={21}/></button>
    </header>
    <div className="admin-detail-content">
      <div className="admin-detail-main">
        <section className="admin-detail-section"><h3>اطلاعات مشتری و پروژه</h3>
          <dl className="admin-customer"><div><dt>نام مشتری</dt><dd>{record.name}</dd></div>
            <div><dt>شرکت / سازمان</dt><dd>{record.company || 'ثبت نشده'}</dd></div>
            <div><dt>شماره تماس</dt><dd><a className="admin-phone" href={'tel:' + record.phone}><Phone size={14}/><bdi>{record.phone}</bdi></a></dd></div>
            <div><dt>شهر</dt><dd>{record.city}</dd></div></dl>
          <h4>شرح نیاز پروژه</h4><p className="admin-project-message">{record.message || 'توضیحی ثبت نشده است.'}</p>
        </section>
        <section className="admin-detail-section"><div className="admin-section-title"><h3>اقلام درخواستی</h3><span>{fa(items.length)} قلم</span></div>
          {items.length ? <><div className="admin-table-scroll"><table className="admin-items-table"><thead><tr><th>محصول و مشخصات</th><th>ضخامت / انتخاب</th><th>مقدار</th></tr></thead>
            <tbody>{items.map((item, index) => { const product = products.find(p => p.id === item.productId);
              return <tr key={index}><td><b>{product?.name || item.productId}</b>{product&&<small><bdi>{product.id}</bdi></small>}{item.note && <small>{item.note}</small>}</td><td>{thicknessLabel(item.thickness)}</td><td>{fa(item.quantity)} {product?.unit || 'واحد'}</td></tr>;
            })}</tbody></table></div><div className="admin-quantity-total">جمع مقدار درخواستی: {quantities(record).map(v => <b key={v.unit}>{fa(v.quantity)} {v.unit}</b>)}</div></>
            : <div className="admin-inline-empty">این درخواست برای مشاوره ثبت شده و قلمی ندارد.</div>}
        </section>
        <section className="admin-detail-section"><h3><History size={17}/> سوابق پیگیری</h3>
          <ol className="admin-history">{[...(record.history || [])].reverse().map((entry, index) => <li key={index}>
            <time>{displayDate(entry.at)}</time><p>{entry.changes.map(historyLabel).join('؛ ')}</p></li>)}
            <li><time>{displayDate(record.created_at)}</time><p>درخواست مشتری ثبت شد</p></li></ol>
          {(record.history?.length || 0) >= 100 && <p className="admin-help">۱۰۰ تغییر اخیر نمایش داده می‌شود.</p>}
        </section>
        <a className="admin-receipt-link" href={'/request/' + record.token} target="_blank" rel="noreferrer">مشاهده رسید مشتری<ExternalLink size={15}/></a>
      </div>
      <form className="admin-followup-form" onSubmit={save}>
        <h3><CalendarClock size={18}/> مدیریت و پیگیری</h3><p className="admin-help">وضعیت در رسید مشتری هم نمایش داده می‌شود. سایر اطلاعات این بخش فقط برای مدیریت است.</p>
        <label className="field">وضعیت درخواست<select value={status} disabled={busy} onChange={e => { setStatus(e.target.value as QuoteStatus); setSaved(false); }}>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="field">مسئول پیگیری<input maxLength={80} value={assignee} disabled={busy} onChange={e => { setAssignee(e.target.value); setSaved(false); }} placeholder="نام کارشناس فروش"/></label>
        <label className="field">تاریخ پیگیری بعدی<input type="date" aria-describedby="followup-help" value={followUp} disabled={busy} onChange={e => { setFollowUp(e.target.value); setSaved(false); }}/></label>
        <p id="followup-help" className="admin-help">انتخاب تاریخ میلادی؛ نمایش تاریخ و سررسید بر اساس تهران است.</p>
        {needsFollowUp(record) && <p className="admin-due-notice">این درخواست نیاز به پیگیری دارد.</p>}
        <label className="field">یادداشت داخلی<textarea rows={6} maxLength={5000} value={note} disabled={busy} onChange={e => { setNote(e.target.value); setSaved(false); }} placeholder="نتیجه تماس، شرایط تأمین و اقدام بعدی..."/></label>
        <small className="admin-help">{fa(note.length)} از ۵٬۰۰۰ نویسه</small>
        {error && <p className="form-error" role="alert">{error}</p>}
        {saved && <p className="admin-save-success" role="status"><Check size={16}/>تغییرات ذخیره شد.</p>}
        <button className="button button-orange full-width" disabled={busy || !changed}>{busy ? <LoaderCircle className="spin" size={17}/> : <Save size={17}/>} {busy ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</button>
        {changed && <p className="admin-help">تغییرات ذخیره‌نشده دارید.</p>}
      </form>
    </div>
  </dialog>;
}
