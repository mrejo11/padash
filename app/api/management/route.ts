import { z } from 'zod';
import { adminConfigured, isAdmin } from '../../../lib/admin-auth';
import { BodyError, json, readJson, sameOrigin } from '../../../lib/http';
import { listQuotes, updateQuoteStatus } from '../../../lib/quotes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(request: Request) {
  if (!adminConfigured()) return json({ error: 'ورود مدیر هنوز فعال نشده است.', code: 'not_configured' }, 503);
  if (!isAdmin(request)) return json({ error: 'برای مدیریت درخواست‌ها وارد شوید.', code: 'signin' }, 401);
  return null;
}

export async function GET(request: Request) {
  const denied = authorized(request);
  if (denied) return denied;
  const page = Math.floor(Math.max(1, Math.min(100000, Number(new URL(request.url).searchParams.get('page')) || 1)));
  try { return json(await listQuotes(page)); }
  catch { return json({ error: 'دریافت اطلاعات انجام نشد. دوباره تلاش کنید.' }, 503); }
}

const updatePayload = z.object({ token: z.string().uuid(), status: z.enum(['new', 'reviewing', 'quoted', 'closed']) });

export async function PATCH(request: Request) {
  const denied = authorized(request);
  if (denied) return denied;
  if (!sameOrigin(request)) return json({ error: 'مبدأ درخواست معتبر نیست.' }, 403);
  try {
    const parsed = updatePayload.safeParse(await readJson(request, 1024));
    if (!parsed.success) return json({ error: 'وضعیت یا شناسه معتبر نیست.' }, 400);
    return await updateQuoteStatus(parsed.data.token, parsed.data.status)
      ? json({ ok: true }) : json({ error: 'درخواست پیدا نشد.' }, 404);
  } catch (error) {
    return json({ error: 'تغییر وضعیت انجام نشد. دوباره تلاش کنید.' }, error instanceof BodyError ? error.status : 503);
  }
}
