import { revalidateTag } from 'next/cache';
import { adminConfigured, isAdmin } from '../../../../../lib/admin-auth';
import { findProductBySlug } from '../../../../../lib/catalog';
import { BodyError, json, readBytes, sameOrigin } from '../../../../../lib/http';
import { emptyProductSpecs, MAX_DATASHEET_BYTES } from '../../../../../lib/product-spec-fields';
import { getProductSpecs, isDatasheet, productSpecTag, saveProductSpecs, specForm, specificationInput } from '../../../../../lib/product-specs';

type Context = { params: Promise<{ slug: string }> };
const unavailable = 'دریافت یا ذخیرهٔ مشخصات فنی انجام نشد.';
const invalid = 'فیلدهای دسته و منبع معتبر را بررسی کنید. فایل باید PDF معتبر و حداکثر ۲ مگابایت باشد.';

function authorize(request: Request) {
  if (!adminConfigured()) return json({ code: 'not_configured', error: 'ورود مدیر هنوز فعال نشده است.' }, 503);
  if (!isAdmin(request)) return json({ code: 'signin', error: 'برای مدیریت کاتالوگ وارد شوید.' }, 401);
}

export async function GET(request: Request, { params }: Context) {
  const denied = authorize(request);
  if (denied) return denied;
  const product = findProductBySlug((await params).slug);
  if (!product) return json({ error: 'محصول پیدا نشد.' }, 404);
  try {
    const saved = await getProductSpecs(product.id);
    return json({ specs: saved ? specForm(saved) : emptyProductSpecs });
  } catch { return json({ error: unavailable }, 503); }
}

export async function PUT(request: Request, { params }: Context) {
  const denied = authorize(request);
  if (denied) return denied;
  if (!sameOrigin(request)) return json({ error: 'مبدأ درخواست معتبر نیست.' }, 403);
  const product = findProductBySlug((await params).slug);
  if (!product) return json({ error: 'محصول پیدا نشد.' }, 404);
  const type = request.headers.get('content-type');
  if (!type?.startsWith('multipart/form-data;')) return json({ error: invalid }, 415);
  try {
    const body = await readBytes(request, MAX_DATASHEET_BYTES + 32768);
    const form = await new Response(new Uint8Array(body), { headers: { 'Content-Type': type } })
      .formData().catch(() => { throw new BodyError(400); });
    const fields = form.get('fields');
    let input: unknown;
    try { input = typeof fields === 'string' ? JSON.parse(fields) : null; }
    catch { throw new BodyError(400); }
    const parsed = specificationInput.safeParse(input);
    const file = form.get('datasheet');
    const bytes = file instanceof File ? new Uint8Array(await file.arrayBuffer()) : undefined;
    if (!parsed.success || (file !== null && (!bytes || !isDatasheet(bytes)))) return json({ error: invalid }, 400);
    const result = await saveProductSpecs(product, parsed.data, bytes);
    if (result.code === 'invalid') return json({ error: invalid }, 400);
    if (result.code === 'conflict') return json({ error: 'مشخصات در پنجرهٔ دیگری تغییر کرده‌اند. صفحه را دوباره بارگذاری کنید.' }, 409);
    revalidateTag(productSpecTag(product.id), { expire: 0 });
    return json({ specs: result.specs });
  } catch (error) {
    return error instanceof BodyError ? json({ error: invalid }, error.status) : json({ error: unavailable }, 503);
  }
}
