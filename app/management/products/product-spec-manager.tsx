'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import { products, productPath } from '../../../lib/catalog';
import { emptyProductSpecs, MAX_DATASHEET_BYTES, productFieldKeys, specificationFields, type ProductSpecForm } from '../../../lib/product-spec-fields';
import AdminAccess from '../admin-access';
import AdminShell from '../admin-shell';

type ApiResult = { specs?: ProductSpecForm; code?: string; error?: string };

export default function ProductSpecManager() {
  const [id, setId] = useState(products[0].id);
  const [fields, setFields] = useState<ProductSpecForm | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removeDatasheet, setRemoveDatasheet] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const requestVersion = useRef(0);
  const product = products.find(item => item.id === id)!;
  const path = productPath(product);
  const endpoint = '/api/admin/product-specs/' + id.toLowerCase();

  function signedOut() {
    requestVersion.current++;
    setAuthenticated(false);
    setAccessCode('signin');
    setFields(null);
    setMessage('');
    setError('');
  }

  const load = useCallback(async (signal?: AbortSignal) => {
    const version = ++requestVersion.current;
    try {
      const response = await fetch(endpoint, { cache: 'no-store', signal });
      const result = await response.json() as ApiResult;
      if (signal?.aborted || version !== requestVersion.current) return;
      if (result.code) {
        setAccessCode(result.code);
        setAuthenticated(false);
      } else if (response.ok && result.specs) {
        setFields(result.specs);
        setAuthenticated(true);
        setAccessCode('');
      } else {
        setError(result.error || 'دریافت مشخصات انجام نشد.');
      }
    } catch {
      if (!signal?.aborted && version === requestVersion.current) setError('ارتباط برقرار نشد.');
    } finally {
      if (!signal?.aborted && version === requestVersion.current) setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) void load(controller.signal);
    });
    return () => controller.abort();
  }, [load]);

  function prepareLoad() {
    requestVersion.current++;
    setFields(null);
    setLoading(true);
    setError('');
    setMessage('');
    setRemoveDatasheet(false);
  }

  function reload() {
    prepareLoad();
    void load();
  }

  function edit(changes: Partial<ProductSpecForm>) {
    setFields(previous => ({ ...(previous ?? emptyProductSpecs), ...changes }));
    setMessage('');
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fields || saving) return;
    const file = fileInput.current?.files?.[0];
    if (file && file.size > MAX_DATASHEET_BYTES) {
      setError('حجم فایل باید حداکثر ۲ مگابایت باشد.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    const form = new FormData();
    const { status, revision, source, sourceUrl, manufacturer, model } = fields;
    const values = Object.fromEntries(Object.entries(fields.values).filter(([, row]) => row.value.trim()));
    form.set('fields', JSON.stringify({ status, revision, source, sourceUrl, manufacturer, model, values, removeDatasheet }));
    if (file) form.set('datasheet', file);
    try {
      const response = await fetch(endpoint, { method: 'PUT', body: form });
      const result = await response.json() as ApiResult;
      if (response.status === 401) {
        signedOut();
      } else if (response.ok && result.specs) {
        setFields(result.specs);
        setRemoveDatasheet(false);
        if (fileInput.current) fileInput.current.value = '';
        setMessage(result.specs.status === 'published' ? 'مشخصات در صفحه محصول منتشر شد.' : 'پیش‌نویس ذخیره شد.');
      } else {
        setError(result.error || 'ذخیرهٔ مشخصات انجام نشد.');
      }
    } catch {
      setError('ارتباط برقرار نشد.');
    } finally {
      setSaving(false);
    }
  }

  return <AdminShell authenticated={authenticated} onSignedOut={signedOut} logoutDisabled={loading || saving}>
    <div className="admin-page-heading">
      <div><h1>مشخصات فنی محصولات</h1><p>مشخصات مستند مدل و دیتاشیت آن را برای صفحه محصول ثبت کنید.</p></div>
      <button className="button button-outline" disabled={loading || saving} onClick={reload}><RefreshCw size={16}/>بارگذاری مجدد</button>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {!authenticated ? <AdminAccess loading={loading} code={accessCode} onSuccess={reload}/> : <>
      <label className="field">محصول کاتالوگ<select value={id} disabled={saving} onChange={event => {
        prepareLoad();
        setId(event.target.value);
      }}>
        {products.map(item => <option key={item.id} value={item.id}>{item.name} ({item.id})</option>)}
      </select></label>
      {loading && <p role="status">در حال دریافت مشخصات…</p>}
      {fields && <form className="news-editor" onSubmit={save}>
        <fieldset disabled={saving}>
          <div className="field-grid">
            <label className="field">وضعیت<select value={fields.status} onChange={event => edit({ status: event.target.value as ProductSpecForm['status'] })}>
              <option value="draft">پیش‌نویس</option><option value="published">انتشار عمومی</option>
            </select></label>
            <label className="field">سازنده<input maxLength={90} value={fields.manufacturer} onChange={event => edit({ manufacturer: event.target.value })}/></label>
            <label className="field">نام یا مدل دقیق<input maxLength={90} value={fields.model} onChange={event => edit({ model: event.target.value })}/></label>
            <label className="field">منبع مشخصات<input required={fields.status === 'published'} maxLength={400} value={fields.source} onChange={event => edit({ source: event.target.value })}/></label>
            <label className="field">لینک منبع (اختیاری)<input type="url" dir="ltr" maxLength={600} value={fields.sourceUrl} onChange={event => edit({ sourceUrl: event.target.value })}/></label>
          </div>
          <fieldset>
            <legend>فیلدهای فنی این دسته</legend>
            {productFieldKeys(product.category).map(key => {
              const field = specificationFields[key];
              const row = fields.values[key] ?? { value: '', unit: '' };
              const patchRow = (changes: Partial<typeof row>) => edit({ values: { ...fields.values, [key]: { ...row, ...changes } } });
              return <div className="field-grid" key={key}>
                <label className="field">{field.label}<input maxLength={200} value={row.value} onChange={event => patchRow({ value: event.target.value })}/></label>
                <label className="field">واحد {field.label}<input dir="auto" maxLength={32} placeholder={field.unitHint} value={row.unit} onChange={event => patchRow({ unit: event.target.value })}/></label>
              </div>;
            })}
          </fieldset>
          <label className="field">دیتاشیت سازنده (PDF، حداکثر ۲ مگابایت)<input ref={fileInput} type="file" accept=".pdf,application/pdf" disabled={removeDatasheet}/></label>
          {fields.hasDatasheet && <label className="consent"><input type="checkbox" checked={removeDatasheet} onChange={event => {
            if (event.target.checked && fileInput.current) fileInput.current.value = '';
            setRemoveDatasheet(event.target.checked);
          }}/><span>برداشتن دیتاشیت فعلی از محصول</span></label>}
          {message && <p className="admin-save-success" role="status">{message}</p>}
          <div className="document-actions"><button type="submit" className="button button-orange"><Save size={16}/>{saving ? 'در حال ذخیره…' : 'ذخیره مشخصات'}</button>
            <a className="button button-outline" href={path} target="_blank" rel="noreferrer">صفحه محصول</a></div>
        </fieldset>
      </form>}
    </>}
  </AdminShell>;
}
