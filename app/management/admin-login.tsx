'use client';
import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, LoaderCircle, LogIn } from 'lucide-react';

export default function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'ورود انجام نشد.');
      setPassword(''); onSuccess();
    } catch (error) { setError(error instanceof Error ? error.message : 'ارتباط برقرار نشد.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={login} style={{ maxWidth: 380, margin: '20px auto', textAlign: 'right' }}>
    <label className="field">رمز ورود مدیر
      <span className="admin-password-input"><input name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" required maxLength={1024}
        dir="ltr" disabled={busy} value={password} onChange={event => setPassword(event.target.value)} />
        <button type="button" className="icon-button" onClick={() => setVisible(value => !value)} aria-label={visible ? 'پنهان کردن رمز' : 'نمایش رمز'} aria-pressed={visible}>{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button></span>
    </label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button button-orange full-width" disabled={busy}>{busy ? <LoaderCircle size={17} className="spin"/> : <LogIn size={17}/>} {busy ? 'در حال ورود...' : 'ورود به مدیریت'}</button>
  </form>;
}
