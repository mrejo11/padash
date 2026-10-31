import { randomUUID } from 'node:crypto';
import { adminConfigured, sessionCookie, validPassword } from '../../../../lib/admin-auth';
import { BodyError, clientHash, json, readJson, sameOrigin } from '../../../../lib/http';
import { reserveAttempt } from '../../../../lib/storage';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'مبدأ درخواست معتبر نیست.' }, 403);
  if (!adminConfigured()) return json({ error: 'ورود مدیر هنوز فعال نشده است.' }, 503);
  try {
    const data = await readJson(request, 2048) as { password?: unknown } | null;
    if (!data || typeof data.password !== 'string' || data.password.length > 1024) return json({ error: 'رمز معتبر نیست.' }, 400);
    if (!await reserveAttempt(`limits/login/${clientHash(request)}`, randomUUID(), 10, 15 * 60 * 1000)) {
      return json({ error: 'تعداد تلاش‌ها زیاد است. ۱۵ دقیقه بعد دوباره تلاش کنید.' }, 429, { 'Retry-After': '900' });
    }
    if (!validPassword(data.password)) return json({ error: 'رمز ورود صحیح نیست.' }, 401);
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(request) });
  } catch (error) {
    return json({ error: 'ورود انجام نشد. دوباره تلاش کنید.' }, error instanceof BodyError ? error.status : 503);
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'مبدأ درخواست معتبر نیست.' }, 403);
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(request, true) });
}
