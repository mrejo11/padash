import { z } from 'zod';
import { adminConfigured, isAdmin } from '../../../../lib/admin-auth';
import { BodyError, json, readJson, sameOrigin } from '../../../../lib/http';
import { createNews, listNews, newsPayload, updateNews } from '../../../../lib/news';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
function authorize(request: Request) {
  if (!adminConfigured()) return json({ code: 'not_configured', error: 'ورود مدیر هنوز فعال نشده است.' }, 503);
  if (!isAdmin(request)) return json({ code: 'signin', error: 'برای مدیریت اخبار وارد شوید.' }, 401);
}
export async function GET(request: Request) {
  const denied = authorize(request); if (denied) return denied;
  try { return json({ items: await listNews() }); }
  catch { return json({ error: 'دریافت خبرها انجام نشد.' }, 503); }
}
export async function POST(request: Request) {
  const denied = authorize(request); if (denied) return denied;
  if (!sameOrigin(request)) return json({ error: 'مبدأ درخواست معتبر نیست.' }, 403);
  try {
    const parsed = newsPayload.safeParse(await readJson(request, 131072));
    if (!parsed.success) return json({ error: 'عنوان، خلاصه و متن را کامل کنید؛ برای رویداد تاریخ معتبر لازم است.' }, 400);
    return json({ item: await createNews(parsed.data) }, 201);
  } catch (error) { return json({ error: 'ثبت خبر انجام نشد.' }, error instanceof BodyError ? error.status : 503); }
}
export async function PATCH(request: Request) {
  const denied = authorize(request); if (denied) return denied;
  if (!sameOrigin(request)) return json({ error: 'مبدأ درخواست معتبر نیست.' }, 403);
  try {
    const body = z.object({ id: z.string().uuid(), revision: z.number().int().min(0), fields: newsPayload }).strict()
      .safeParse(await readJson(request, 131072));
    if (!body.success) return json({ error: 'اطلاعات خبر یا تاریخ رویداد معتبر نیست.' }, 400);
    const result = await updateNews(body.data.id, body.data.revision, body.data.fields);
    if (result.code === 'missing') return json({ error: 'خبر پیدا نشد.' }, 404);
    if (result.code === 'conflict') return json({ error: 'خبر در پنجره دیگری تغییر کرده است. فهرست را به‌روز و خبر را دوباره باز کنید.' }, 409);
    return json({ item: result.row });
  } catch (error) { return json({ error: 'ویرایش خبر انجام نشد.' }, error instanceof BodyError ? error.status : 503); }
}
