import { aboutProfile } from './business-profile';

export type CompanyPageDetails = {
  path: string;
  label: string;
  title: string;
  seoTitle: string;
  description: string;
  schemaType: 'AboutPage' | 'ContactPage' | 'WebPage';
  updated: string;
};

export const companyPages = {
  about: {
    path: '/about',
    label: 'درباره ما',
    title: aboutProfile.title,
    seoTitle: aboutProfile.seoTitle,
    description: aboutProfile.description,
    schemaType: 'AboutPage',
    updated: '2026-11-20',
  },
  contact: {
    path: '/contact',
    label: 'تماس با ما',
    title: 'تماس با بازرگانی پاداش',
    seoTitle: 'تماس با ما برای مشاوره و استعلام عایق',
    description: 'با مهندس پاداشی و مهندس فرجی برای انتخاب عایق، استعلام قیمت و هماهنگی تأمین پروژه تماس بگیرید یا درخواست خود را آنلاین ثبت کنید.',
    schemaType: 'ContactPage',
    updated: '2026-11-20',
  },
  privacy: {
    path: '/privacy',
    label: 'حریم خصوصی',
    title: 'حریم خصوصی در بازرگانی پاداش',
    seoTitle: 'حریم خصوصی و اطلاعات درخواست استعلام',
    description: 'بخوانید هنگام ثبت استعلام چه اطلاعاتی دریافت می‌شود، سبد استعلام کجا ذخیره می‌شود و چه اطلاعاتی در رسید پیگیری نمایش داده می‌شود.',
    schemaType: 'WebPage',
    updated: '2026-11-20',
  },
  terms: {
    path: '/quote-terms',
    label: 'شرایط استعلام',
    title: 'شرایط استعلام و دریافت پیش‌فاکتور',
    seoTitle: 'شرایط استعلام قیمت و دریافت پیش‌فاکتور',
    description: 'مراحل ثبت و پیگیری استعلام عایق، اطلاعات لازم برای بررسی درخواست و مواردی را که در پیش‌فاکتور تأیید می‌شوند، بخوانید.',
    schemaType: 'WebPage',
    updated: '2026-11-20',
  },
} satisfies Record<string, CompanyPageDetails>;
