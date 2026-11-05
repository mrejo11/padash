import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { onNetlify } from './platform';

const cookieName = 'padash_admin';
const duration = 8 * 60 * 60;

function password() {
  const value = process.env.SALES_ADMIN_PASSWORD;
  return value && value.length >= 24 ? value : null;
}

function equal(a: string, b: string) {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}

function signature(payload: string, secret: string) {
  return createHmac('sha256', secret).update('padash-admin-session-v1:' + payload).digest('base64url');
}

export function adminConfigured() { return Boolean(password()); }

export function validPassword(value: string) {
  const secret = password();
  return Boolean(secret && equal(value, secret));
}

export function isAdmin(request: Request) {
  const secret = password();
  if (!secret) return false;
  const cookie = request.headers.get('cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith(cookieName + '='));
  const value = cookie?.slice(cookieName.length + 1);
  if (!value || value.length > 256) return false;
  const parts = value.split('.');
  if (parts.length !== 3) return false;
  const [expires, nonce, mac] = parts;
  const now = Math.floor(Date.now() / 1000);
  if (!/^\d+$/.test(expires) || Number(expires) <= now || Number(expires) > now + duration) return false;
  return equal(mac, signature(`${expires}.${nonce}`, secret));
}

export function sessionCookie(request: Request, logout = false) {
  const secret = password();
  if (!secret && !logout) throw new Error('Administrator not configured');
  const payload = `${Math.floor(Date.now() / 1000) + duration}.${randomUUID()}`;
  const value = logout ? '' : `${payload}.${signature(payload, secret!)}`;
  const secure = Boolean(process.env.PADASH_PUBLIC_ORIGIN?.startsWith('https://')) || onNetlify() || new URL(request.url).protocol === 'https:';
  return `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${logout ? 0 : duration}${secure ? '; Secure' : ''}`;
}
