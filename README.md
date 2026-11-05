# بازرگانی پاداش

وب‌سایت کاتالوگ، ثبت استعلام، پیگیری درخواست و مدیریت فروش، با **Next.js App Router**؛ ذخیره‌سازی با Netlify Blobs یا SQLite روی دیسک پایدار ران‌فلر.

## دیپلوی خودکار روی ران‌فلر

راهنمای [RUNFLARE.md](RUNFLARE.md) شامل اتصال شاخهٔ `main`، متغیرهای محیطی، دیسک پایدار، بررسی سلامت و پشتیبان‌گیری است. `npm start` مخصوص اجرای production است و شبیه‌ساز محلی راه نمی‌اندازد. برای پیش‌نمایش محلی نسخهٔ ساخته‌شده از `npm run start:local` استفاده کنید.

## اجرا

Node.js 24 نصب کنید؛ سپس در پوشه پروژه:

```powershell
npm.cmd ci --include=optional
npm.cmd run dev
```

آدرس محلی: `http://localhost:5173`

## دیپلوی روی Netlify

تنظیمات در `netlify.toml` ثبت شده است:

- دستور ساخت: `npm run build`
- پوشه انتشار: `.next`
- نسخه Node: `24`

درخواست‌ها روی Netlify Blobs ذخیره می‌شوند. برای فعال‌کردن ورود به `/management`، متغیر امن `SALES_ADMIN_PASSWORD` را با رمز تصادفی حداقل ۲۴ کاراکتر، در بخش Environment variables و با دسترسی Functions تنظیم و دوباره دیپلوی کنید. فرم ثبت درخواست به این رمز نیاز ندارد.

[راهنمای دیپلوی و ذخیره اطلاعات](NETLIFY.md)

[راهنمای پنل مدیریت، سفارش‌ها، مشاوره و پیگیری مشتریان](docs/management.md)

[راهنمای محاسبه‌گر، مقالات مستند، مدیریت اخبار و سئوی سایت](docs/seo.md)

[محصولات، منابع تصاویر و روش به‌روزرسانی کاتالوگ و برآورد مقدار](docs/partner-catalog.md)

## بررسی

```powershell
npm.cmd run build
npm.cmd run typecheck
npm.cmd run test:calculator
npm.cmd run test:integration
```

این پروژه ابتدا از یک قالب Cloudflare ساخته شده بود. مسیر اجرایی فعلی Next.js است؛ اطلاعات قدیمی D1 به فضای جدید کپی نمی‌شوند. [مستندات قالب اولیه](docs/cloudflare-template.md) صرفاً برای سابقه نگهداری شده‌اند.
