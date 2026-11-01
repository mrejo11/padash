import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { SITE_NAME, SITE_URL, absoluteUrl } from '../lib/seo';
import './globals.css';
const vazirmatn = localFont({ src: '../public/fonts/Vazirmatn.woff2', display: 'swap', variable: '--font-vazirmatn', weight: '100 900' });
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'بازرگانی پاداش | تأمین عایق حرارتی و برودتی', template: '%s | بازرگانی پاداش' },
  description: 'انتخاب، مقایسه و استعلام عایق‌های حرارتی و برودتی برای تأسیسات، ساختمان و صنعت. کاتالوگ تخصصی بازرگانی پاداش.',
  icons: { icon: '/favicon.svg' },
  applicationName: SITE_NAME,
  robots: { index: !['deploy-preview', 'branch-deploy'].includes(process.env.CONTEXT || ''), follow: true },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  openGraph: { title: 'بازرگانی پاداش | تأمین عایق حرارتی و برودتی', description: 'از انتخاب فنی تا تأمین پروژه، همراه شما.', siteName: SITE_NAME, locale: 'fa_IR', type: 'website', images: [absoluteUrl('/images/insulation-hero.png')] },
  twitter: { card: 'summary_large_image' },
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="fa" dir="rtl" className={vazirmatn.variable}><body>{children}</body></html>;
}
