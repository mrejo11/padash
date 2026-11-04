import { z } from 'zod';
import { adminConfigured, isAdmin } from '../../../lib/admin-auth';
import { BodyError, json, readJson, sameOrigin } from '../../../lib/http';
import { allQuotes, listQuotes, updateQuote } from '../../../lib/quotes';
import { filterQuotes, kindLabels, quoteItems, requestKind, statusLabels, tehranDate } from '../../../lib/management-model';
import { products } from '../../../lib/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(request: Request) {
  if (!adminConfigured()) return json({ error: 'ورود مدیر هنوز فعال نشده است.', code: 'not_configured' }, 503);
  if (!isAdmin(request)) return json({ error: 'برای مدیریت درخواست‌ها وارد شوید.', code: 'signin' }, 401);
  return null;
}

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(value + 'T00:00:00Z');
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'تاریخ معتبر نیست.');
const optionalDate = z.union([z.literal(''), date]);
const filtersSchema = z.object({
  q: z.string().trim().max(120).default(''),
  status: z.enum(['', 'new', 'reviewing', 'quoted', 'confirmed', 'closed', 'cancelled']).default(''),
  kind: z.enum(['', 'order', 'consultation']).default(''),
  from: optionalDate.default(''), to: optionalDate.default(''),
  followUp: z.enum(['', 'due', 'unassigned']).default(''),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  format: z.enum(['json', 'csv']).default('json'),
}).refine(value => !value.from || !value.to || value.from <= value.to);

function csvCell(value: unknown) {
  const text = String(value ?? '');
  // Spreadsheet formulas may be hidden behind whitespace or control characters.
  const safe = /^[\s\u0000-\u001f]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text) ? "'" + text : text;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export async function GET(request: Request) {
  const denied = authorized(request);
  if (denied) return denied;
  const parsed = filtersSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return json({ error: 'فیلترها یا بازه تاریخ معتبر نیست.' }, 400);
  const { page, format, ...filters } = parsed.data;
  try {
    if (format === 'csv') {
      const rows = filterQuotes(await allQuotes(), filters);
      const records = [
        ['کد پیگیری', 'نوع درخواست', 'نام', 'شرکت', 'شماره تماس', 'شهر', 'وضعیت', 'زمان ثبت',
          'مسئول پیگیری', 'تاریخ پیگیری', 'شرح پروژه', 'یادداشت داخلی', 'محصول', 'ضخامت (میلی‌متر)', 'مقدار', 'واحد', 'توضیح قلم'],
        ...rows.flatMap(row => {
          const items = quoteItems(row);
          const base = [row.id, kindLabels[requestKind(row)], row.name, row.company, row.phone, row.city,
            statusLabels[row.status], row.created_at, row.assignee || '', row.follow_up_date || '', row.message, row.internal_note || ''];
          return items.length ? items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return [...base, product ? `${product.name} (${product.id})` : item.productId, item.thickness??'طبق مشخصات درخواست', item.quantity, product?.unit || 'واحد', item.note];
          }) : [[...base, '', '', '', '', '']];
        }),
      ];
      return new Response('\uFEFF' + records.map(row => row.map(csvCell).join(',')).join('\r\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff',
          'Content-Disposition': `attachment; filename="padash-requests-${tehranDate()}.csv"`,
        },
      });
    }
    return json(await listQuotes(page, filters));
  }
  catch { return json({ error: 'دریافت اطلاعات انجام نشد. دوباره تلاش کنید.' }, 503); }
}

const updatePayload = z.object({
  token: z.string().uuid(), revision: z.number().int().min(0),
  status: z.enum(['new', 'reviewing', 'quoted', 'confirmed', 'closed', 'cancelled']).optional(),
  internal_note: z.string().trim().max(5000).optional(),
  assignee: z.string().trim().max(80).optional(), follow_up_date: optionalDate.optional(),
}).strict().refine(value => Object.keys(value).some(key => !['token', 'revision'].includes(key)));

export async function PATCH(request: Request) {
  const denied = authorized(request);
  if (denied) return denied;
  if (!sameOrigin(request)) return json({ error: 'مبدأ درخواست معتبر نیست.' }, 403);
  try {
    const parsed = updatePayload.safeParse(await readJson(request, 32768));
    if (!parsed.success) return json({ error: 'وضعیت، تاریخ پیگیری یا اطلاعات واردشده معتبر نیست.' }, 400);
    const result = await updateQuote(parsed.data);
    if (result.code === 'missing') return json({ error: 'درخواست پیدا نشد.' }, 404);
    if (result.code === 'conflict') return json({ error: 'این درخواست در پنجره دیگری تغییر کرده است. جزئیات را دوباره باز کنید تا آخرین نسخه دریافت شود.', code: 'conflict' }, 409);
    return json({ ok: true, quote: result.quote });
  } catch (error) {
    return json({ error: 'تغییرات ذخیره نشد. دوباره تلاش کنید.' }, error instanceof BodyError ? error.status : 503);
  }
}
