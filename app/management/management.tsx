'use client';
import Brand from '../../components/brand';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CalendarClock, ChevronLeft, ChevronRight, ClipboardList, Download, Inbox, LayoutDashboard, LoaderCircle, LockKeyhole, LogOut, MessageSquareText, Package, RefreshCw, Search, SlidersHorizontal, TrendingUp, X } from 'lucide-react';
import { fa } from '../../lib/catalog';
import { kindLabels, needsFollowUp, quantities, quoteItems, requestKind, statusLabels, type ManagementFilters, type ManagementResponse, type ManagementStats, type Quote } from '../../lib/management-model';
import AdminLogin from './admin-login';
import RequestDetail, { displayDate } from './request-detail';

const emptyFilters: ManagementFilters = { q: '', kind: '', status: '', from: '', to: '', followUp: '' };
const shortDate = (date: string) => new Date(date + 'T12:00:00+03:30').toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran', weekday: 'short' });

function Dashboard({ stats, filter }: { stats: ManagementStats; filter: (value: Partial<ManagementFilters>) => void }) {
  const maxDay = Math.max(1, ...stats.daily.map(day => day.orders + day.consultations));
  const cards = [
    { title: 'کل درخواست‌ها', value: stats.total, caption: `${fa(stats.today)} درخواست امروز`, icon: ClipboardList, action: {} },
    { title: 'سفارش و استعلام', value: stats.orders, caption: 'درخواست تأمین محصول', icon: Package, action: { kind: 'order' } },
    { title: 'درخواست مشاوره', value: stats.consultations, caption: 'بررسی و راهنمایی پروژه', icon: MessageSquareText, action: { kind: 'consultation' } },
    { title: 'در انتظار بررسی', value: stats.pending, caption: 'درخواست‌های جدید', icon: Inbox, action: { status: 'new' } },
  ];
  return <>
    <div className="admin-stats">{cards.map(card => <button className="admin-stat" key={card.title} onClick={() => filter(card.action)}>
      <span className="admin-stat-label">{card.title}<span className="admin-stat-icon"><card.icon size={20}/></span></span>
      <strong>{fa(card.value)}</strong><span className="admin-stat-caption">{card.caption}<ArrowLeft size={15}/></span>
    </button>)}</div>
    {stats.followUps > 0 && <button className="admin-followup-alert" onClick={() => filter({ followUp: 'due' })}><CalendarClock size={19}/><span><b>{fa(stats.followUps)} درخواست برای پیگیری امروز یا روزهای قبل دارید.</b> فهرست پیگیری‌ها را ببینید.</span><ArrowLeft size={18}/></button>}
    <div className="admin-overview">
      <section className="admin-panel admin-trend"><div className="admin-section-title"><div><h2><TrendingUp size={18}/> روند ثبت درخواست</h2><p>۷ روز اخیر · به وقت تهران</p></div><div className="admin-chart-legend"><span><i/>سفارش</span><span><i/>مشاوره</span></div></div>
        <div className="admin-chart" role="img" aria-label={'درخواست‌های هفت روز اخیر: ' + stats.daily.map(day => `${displayDate(day.date, false)}: ${fa(day.orders)} سفارش و ${fa(day.consultations)} مشاوره`).join('، ')}>
          {stats.daily.map(day => <div className="admin-chart-day" key={day.date}><b>{fa(day.orders + day.consultations)}</b><div className="admin-chart-track"><div className="admin-chart-stack" style={{ height: `${(day.orders + day.consultations) / maxDay * 100}%` }}>
            <span style={{ flex: day.consultations }}/><span style={{ flex: day.orders }}/></div></div><small>{shortDate(day.date)}</small></div>)}
        </div>
      </section>
      <section className="admin-panel admin-volume"><div className="admin-section-title"><div><h2><Package size={18}/> حجم اقلام سفارش</h2><p>جمع مقادیر درخواستی به تفکیک واحد</p></div><span className="admin-soft-badge">{fa(stats.lineItems)} قلم</span></div>
        {stats.volumes.length ? <div className="admin-volume-values">{stats.volumes.map(volume => <div key={volume.unit}><strong>{fa(volume.quantity)}</strong><span>{volume.unit}</span></div>)}</div> : <p className="admin-inline-empty">هنوز مقداری برای سفارش ثبت نشده است.</p>}
        <p className="admin-help">شامل درخواست‌های لغوشده نیست. مبالغ مالی پس از صدور پیش‌فاکتور رسمی مشخص می‌شوند.</p>
        <div className="admin-demand">{stats.products.slice(0, 3).map(product => <div key={product.id}><span>{product.name}<small>{fa(product.requests)} درخواست</small></span><b>{fa(product.quantity)} <small>{product.unit}</small></b></div>)}</div>
      </section>
    </div>
  </>;
}

export default function Management() {
  const [data, setData] = useState<ManagementResponse | null>(null);
  const [filters, setFilters] = useState<ManagementFilters>(emptyFilters);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [selected, setSelected] = useState<Quote | null>(null);
  const listRef = useRef<HTMLElement>(null);
  const generation = useRef(0);
  const refresh = useCallback(() => setRefreshKey(value => value + 1), []);
  function expireSession() { generation.current++; setSelected(null); setData(null); setCode('signin'); setError(''); setLoading(false); }
  useEffect(() => {
    const timer = setTimeout(() => { setFilters(value => ({ ...value, q: search })); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    const controller = new AbortController();
    const current = ++generation.current;
    async function load() {
      setLoading(true); setError('');
      try {
        const params = new URLSearchParams({ ...filters, page: String(page) });
        const response = await fetch('/api/management?' + params, { cache: 'no-store', signal: controller.signal });
        const result = await response.json() as ManagementResponse & { code?: string; error?: string };
        if (current !== generation.current) return;
        if (!response.ok) {
          if (result.code === 'signin' || result.code === 'not_configured') {
            setData(null); setSelected(null); setCode(result.code); return;
          }
          throw new Error(result.error || 'دریافت اطلاعات انجام نشد.');
        }
        setData(result as ManagementResponse); setCode('');
      } catch (error) {
        if (current === generation.current && !controller.signal.aborted) setError(error instanceof Error ? error.message : 'ارتباط برقرار نشد.');
      } finally { if (current === generation.current) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [filters, page, refreshKey]);
  function changeFilters(value: Partial<ManagementFilters>) { setFilters(previous => ({ ...previous, ...value })); setPage(1); }
  function quickFilter(value: Partial<ManagementFilters>) {
    setSearch(''); setFilters({ ...emptyFilters, ...value }); setPage(1);
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  async function logout() {
    setLoggingOut(true);
    try {
      const response = await fetch('/api/admin/session', { method: 'DELETE' });
      if (!response.ok) throw new Error('خروج انجام نشد. دوباره تلاش کنید.');
      expireSession();
    } catch (error) { setError(error instanceof Error ? error.message : 'ارتباط برقرار نشد.'); }
    finally { setLoggingOut(false); }
  }
  async function exportCsv() {
    setExporting(true); setError('');
    try {
      const response = await fetch('/api/management?' + new URLSearchParams({ ...filters, format: 'csv' }), { cache: 'no-store' });
      if (response.status === 401) { expireSession(); return; }
      if (!response.ok) { const result = await response.json() as { error?: string }; throw new Error(result.error || 'دریافت خروجی انجام نشد.'); }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = url; link.download = 'padash-requests.csv';
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setError(error instanceof Error ? error.message : 'ارتباط برقرار نشد.'); }
    finally { setExporting(false); }
  }
  const activeFilters = Object.values(filters).some(Boolean);
  const authenticated = Boolean(data && !code);
  const rows = data?.items || [];
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / (data?.pageSize || 20)));
  return <main className="admin-shell">
    <aside className="admin-sidebar">
      <Brand className="admin-brand" subtitle="سامانه مدیریت فروش"/>
      <div className="admin-sidebar-label">فضای مدیریت</div>
      <a href="#dashboard" className="admin-sidebar-link active"><LayoutDashboard size={19}/>نمای کلی و درخواست‌ها</a>
      <a href="/management/news" className="admin-sidebar-link"><ClipboardList size={19}/>اخبار و رویدادها</a>
      {authenticated && <><button className="admin-sidebar-link" onClick={() => quickFilter({ kind: 'order' })}><Package size={19}/>سفارش و استعلام<span>{fa(data!.stats.orders)}</span></button>
        <button className="admin-sidebar-link" onClick={() => quickFilter({ kind: 'consultation' })}><MessageSquareText size={19}/>درخواست‌های مشاوره<span>{fa(data!.stats.consultations)}</span></button>
        <button className="admin-sidebar-link" onClick={() => quickFilter({ followUp: 'due' })}><CalendarClock size={19}/>پیگیری‌ها<span>{fa(data!.stats.followUps)}</span></button></>}
      <div className="admin-sidebar-bottom"><span><LockKeyhole size={15}/>دسترسی ویژه مدیریت</span><a href="/">مشاهده وب‌سایت<ArrowLeft size={16}/></a></div>
    </aside>
    <div className="admin-workspace" id="dashboard">
      <header className="admin-topbar"><div className="admin-breadcrumb">بازرگانی پاداش <ChevronLeft size={13}/><b>مدیریت فروش</b></div>
        <div className="admin-top-actions"><a href="/" className="admin-site-link">بازگشت به سایت<ArrowLeft size={14}/></a>{authenticated && <button onClick={logout} disabled={loggingOut} className="admin-logout"><LogOut size={16}/>{loggingOut ? 'در حال خروج...' : 'خروج امن'}</button>}</div></header>
      <div className="admin-content">
        <div className="admin-page-heading"><div><span className="admin-eyebrow">مدیریت ارتباط با مشتریان</span><h1>مرکز مدیریت درخواست‌ها</h1><p>سفارش‌ها، نیاز پروژه و پیگیری مشتریان در یک نگاه.</p></div>
          <button className="button button-outline" onClick={refresh} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''}/>به‌روزرسانی</button></div>
        {error && <div className="admin-error" role="alert">{error}<button onClick={refresh}>تلاش دوباره</button></div>}
        {!authenticated ? <section className="admin-login-panel">
          {loading ? <div className="admin-loading" role="status"><LoaderCircle size={26} className="spin"/><p>در حال بررسی دسترسی...</p></div>
            : <><span className="admin-login-icon"><LockKeyhole size={30}/></span><h2>{code === 'not_configured' ? 'فعال‌سازی دسترسی مدیر' : 'ورود به پنل مدیریت'}</h2>
              {code === 'not_configured' ? <><p>رمز مدیریت هنوز روی سرور تنظیم نشده است.</p><p className="admin-help">مسئول فنی باید متغیر امن <bdi>SALES_ADMIN_PASSWORD</bdi> را با حداقل ۲۴ کاراکتر تنظیم و سرویس را دوباره اجرا کند.</p></>
                : code === 'signin' ? <><p>برای مشاهده اطلاعات مشتریان و مدیریت درخواست‌ها وارد شوید.</p><AdminLogin onSuccess={refresh}/></>
                  : <p>دریافت وضعیت دسترسی انجام نشد. دوباره تلاش کنید.</p>}</>}
        </section> : <>
          <p className="admin-scope">نمای کلی همه درخواست‌های ثبت‌شده</p>
          <Dashboard stats={data!.stats} filter={quickFilter}/>
          <section className="admin-panel admin-requests" ref={listRef} aria-busy={loading}>
            <div className="admin-list-heading"><div><h2>فهرست درخواست‌ها <span className="admin-soft-badge">{fa(data!.total)}</span></h2><p>جدیدترین درخواست‌ها در ابتدای فهرست قرار دارند.</p></div>
              <button className="button button-dark" onClick={exportCsv} disabled={exporting || loading || !data!.total}>{exporting ? <LoaderCircle size={16} className="spin"/> : <Download size={16}/>}خروجی همه نتایج</button></div>
            <div className="admin-kind-tabs" role="group" aria-label="نوع درخواست">{[['', 'همه درخواست‌ها'], ['order', 'سفارش و استعلام'], ['consultation', 'مشاوره']].map(([key, label]) => <button key={key} aria-pressed={filters.kind === key} className={filters.kind === key ? 'active' : ''} onClick={() => changeFilters({ kind: key })}>{label}</button>)}</div>
            <div className="admin-filters"><label className="admin-search"><Search size={18}/><input aria-label="جست‌وجوی درخواست‌ها" placeholder="نام، تلفن، کد پیگیری، شهر یا محصول..." maxLength={120} value={search} onChange={e => setSearch(e.target.value)}/>{search && <button aria-label="پاک کردن جست‌وجو" onClick={() => setSearch('')}><X size={15}/></button>}</label>
              <label className="admin-filter-field"><span>وضعیت</span><select value={filters.status} onChange={e => changeFilters({ status: e.target.value })}><option value="">همه وضعیت‌ها</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
              <label className="admin-filter-field"><span>پیگیری</span><select value={filters.followUp} onChange={e => changeFilters({ followUp: e.target.value })}><option value="">همه درخواست‌ها</option><option value="due">سررسید امروز و قبل</option><option value="unassigned">بدون مسئول پیگیری</option></select></label>
              <label className="admin-filter-field admin-date"><span>از تاریخ (میلادی)</span><input type="date" value={filters.from} max={filters.to || undefined} onChange={e => changeFilters({ from: e.target.value })}/></label>
              <label className="admin-filter-field admin-date"><span>تا تاریخ (میلادی)</span><input type="date" value={filters.to} min={filters.from || undefined} onChange={e => changeFilters({ to: e.target.value })}/></label>
            </div>
            <div className="admin-results-info"><span>{loading ? <><LoaderCircle className="spin" size={14}/>در حال دریافت...</> : <><SlidersHorizontal size={14}/>{fa(data!.total)} درخواست{activeFilters ? ' مطابق فیلترها' : ' ثبت‌شده'}</>}</span>{activeFilters && <button onClick={() => { setSearch(''); setFilters(emptyFilters); setPage(1); }}>پاک کردن فیلترها<X size={13}/></button>}</div>
            {rows.length ? <div className="admin-table-scroll"><table className="admin-requests-table"><thead><tr><th>مشتری / کد پیگیری</th><th>نوع و اقلام</th><th>مقدار درخواستی</th><th>وضعیت</th><th>پیگیری بعدی</th><th>زمان ثبت</th><th><span className="admin-sr-only">جزئیات</span></th></tr></thead>
              <tbody>{rows.map(row => <tr key={row.token}>
                <td data-label="مشتری / کد پیگیری"><button className="admin-customer-button" disabled={loading} onClick={() => setSelected(row)}>{row.name}</button><small>{row.company || row.city}</small><bdi className="admin-request-id">{row.id}</bdi></td>
                <td data-label="نوع و اقلام"><span className={'admin-kind kind-' + requestKind(row)}>{requestKind(row) === 'order' ? <Package size={13}/> : <MessageSquareText size={13}/>} {kindLabels[requestKind(row)]}</span><small>{quoteItems(row).length ? fa(quoteItems(row).length) + ' قلم محصول' : 'بررسی نیاز پروژه'}</small></td>
                <td data-label="مقدار درخواستی">{quantities(row).length ? quantities(row).map(volume => <span className="admin-row-volume" key={volume.unit}><b>{fa(volume.quantity)}</b> {volume.unit}</span>) : <span className="admin-help">—</span>}</td>
                <td data-label="وضعیت"><span className={'admin-status status-' + row.status}><i/>{statusLabels[row.status]}</span></td>
                <td data-label="پیگیری بعدی"><span className={needsFollowUp(row) ? 'admin-due' : ''}>{row.follow_up_date ? displayDate(row.follow_up_date, false) : 'تعیین نشده'}</span><small>{row.assignee || 'بدون مسئول'}</small></td>
                <td data-label="زمان ثبت"><span>{displayDate(row.created_at, false)}</span><small>{new Date(row.created_at).toLocaleTimeString('fa-IR', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit' })}</small></td>
                <td><button className="admin-open-detail" disabled={loading} aria-label={'مشاهده جزئیات ' + row.id} onClick={() => setSelected(row)}>جزئیات<ChevronLeft size={15}/></button></td>
              </tr>)}</tbody></table></div> : <div className="admin-empty"><Inbox size={38}/><h3>{activeFilters ? 'درخواستی با این فیلترها پیدا نشد' : 'هنوز درخواستی ثبت نشده است'}</h3><p>{activeFilters ? 'جست‌وجو یا بازه تاریخ را تغییر دهید.' : 'سفارش و مشاوره ثبت‌شده از فرم سایت در این بخش نمایش داده می‌شود.'}</p></div>}
            <footer className="admin-pagination"><span>{data!.total ? `${fa((data!.page - 1) * data!.pageSize + 1)} تا ${fa(Math.min(data!.page * data!.pageSize, data!.total))} از ${fa(data!.total)} درخواست` : '۰ درخواست'}</span>
              <div><button aria-label="صفحه قبل" disabled={loading || data!.page <= 1} onClick={() => setPage(data!.page - 1)}><ChevronRight size={16}/></button><span>صفحه {fa(data!.page)} از {fa(totalPages)}</span><button aria-label="صفحه بعد" disabled={loading || data!.page >= totalPages} onClick={() => setPage(data!.page + 1)}><ChevronLeft size={16}/></button></div></footer>
          </section>
          <p className="admin-footer-note"><LockKeyhole size={13}/>اطلاعات تماس و یادداشت‌های داخلی فقط در دسترس مدیریت قرار دارند. همه زمان‌ها به وقت تهران نمایش داده می‌شوند.</p>
        </>}
      </div>
    </div>
    {selected && authenticated && <RequestDetail key={selected.token} quote={selected} onClose={() => setSelected(null)} onSaved={quote => { setSelected(quote); refresh(); }} onSessionExpired={expireSession}/>}
  </main>;
}
