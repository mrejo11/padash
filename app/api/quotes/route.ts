import { quotePayload } from '../../../lib/quote-validation';
import { createQuote } from '../../../lib/quotes';
import { BodyError, quoteClientHash, json, readJson, sameOrigin } from '../../../lib/http';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'مبدأ درخواست معتبر نیست.' }, 403);
  try {
    const parsed = quotePayload.safeParse(await readJson(request, 16384));
    if (!parsed.success) return json({ error: 'نام، شماره تماس، شهر و مشخصات اقلام را بررسی کنید. برای مشاوره، حداقل ۱۰ حرف درباره پروژه بنویسید.' }, 400);
    const result = await createQuote(parsed.data, quoteClientHash(request, parsed.data.phone));
    if (!result) return json({ error: 'تعداد درخواست‌ها به حد مجاز رسیده است. بعداً دوباره تلاش کنید یا با کارشناسان تماس بگیرید.' }, 429);
    return json({ id: result.quote.id, token: result.quote.token }, result.created ? 201 : 200);
  } catch (error) {
    return json({ error: 'ثبت درخواست کامل نشد. اطلاعات سبد محفوظ است؛ دوباره تلاش کنید.' }, error instanceof BodyError ? error.status : 503);
  }
}
