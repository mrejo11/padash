# بازرگانی پاداش

وب‌سایت کاتالوگ محصولات، محاسبه مقدار مصالح، ثبت و پیگیری درخواست، مدیریت فروش و انتشار اخبار با Next.js App Router و Netlify Blobs.

## اجرای محلی

از Node.js 24 استفاده کنید. در پوشه پروژه:

```powershell
npm.cmd ci --include=optional
npm.cmd run dev
```

سایت در `http://localhost:5173` در دسترس است. برای ورود به `/management`، متغیر `SALES_ADMIN_PASSWORD` را با یک رمز تصادفی حداقل ۲۴ کاراکتری در `.env.local` قرار دهید و سرور را دوباره اجرا کنید. این فایل نباید وارد Git شود.

شبیه‌ساز محلی Netlify Blobs به‌صورت خودکار اجرا می‌شود. داده‌های محلی در `.sites-runtime/netlify-blobs` نگهداری می‌شوند و از داده‌های سایت اصلی جدا هستند.

## ساخت و بررسی

```powershell
npm.cmd run build
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:calculator
npm.cmd run test:accessories
npm.cmd run test:integration
```

آزمون یکپارچه به بیلد آماده نیاز دارد و سفارش‌ها، ورود مدیر، محدودیت درخواست، ویرایش هم‌زمان، اخبار، تصاویر و سئو را در فضای ذخیره‌سازی آزمایشی جدا بررسی می‌کند.

برای پیش‌نمایش محلی نسخه ساخته‌شده، `npm run start:local` را اجرا کنید. دستور `npm start` سرور Next.js را با ذخیره‌سازی تنظیم‌شده در محیط میزبانی اجرا می‌کند.

## انتشار روی Netlify

تنظیمات در `netlify.toml` قرار دارند: ساخت با `npm run build`، خروجی `.next` و Node.js 24. رمز مدیریت را در متغیرهای امن Functions تنظیم کنید. داده‌های اصلی در Netlify Blobs باقی می‌مانند.

- [راهنمای Netlify و ذخیره اطلاعات](NETLIFY.md)
- [راهنمای پنل مدیریت و سفارش‌ها](docs/management.md)
- [راهنمای محتوا و سئو](docs/seo.md)
- [منابع تصاویر و به‌روزرسانی کاتالوگ](docs/partner-catalog.md)
- [راهنمای برآورد مصالح ساختمانی](docs/construction-product-estimates.md)
