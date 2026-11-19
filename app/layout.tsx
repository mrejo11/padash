import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { SITE_NAME, SITE_URL, SOCIAL_IMAGE, absoluteUrl, isPreviewDeployment, organization, website } from '../lib/seo';
import JsonLd from '../components/json-ld';
import './globals.css';
import './brand-system.css';
const vazirmatn = localFont({ src: '../public/fonts/Vazirmatn.woff2', display: 'swap', variable: '--font-vazirmatn', weight: '100 900' });
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'بازرگانی پاداش | عایق حرارتی، برودتی و صوتی', template: '%s | بازرگانی پاداش' },
  description: 'انتخاب، مقایسه و استعلام عایق‌های حرارتی، برودتی و صوتی برای تأسیسات، ساختمان و صنعت. کاتالوگ تخصصی بازرگانی پاداش.',
  icons: { icon: { url: '/images/padash-icon.png', type: 'image/png', sizes: '96x96' }, apple: {url: '/images/padash-apple.png', sizes: '180x180'} },
  applicationName: SITE_NAME,
  robots: { index: !isPreviewDeployment(), follow: !isPreviewDeployment(), 'max-image-preview': 'large' },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  openGraph: { title: 'بازرگانی پاداش | عایق حرارتی، برودتی و صوتی', description: 'از انتخاب فنی تا تأمین پروژه، همراه شما.', siteName: SITE_NAME, locale: 'fa_IR', type: 'website', images: [{ url: absoluteUrl(SOCIAL_IMAGE), width: 512, height: 512, alt: 'نشان بازرگانی پاداش' }] },
  twitter: { card: 'summary' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#063959' };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="fa" dir="rtl" className={vazirmatn.variable}><body><JsonLd value={{'@context':'https://schema.org','@graph':[organization,website]}}/>{children}</body></html>;
}
