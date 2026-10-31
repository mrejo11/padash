import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL(process.env.URL || 'https://padashco.netlify.app'),
  title: 'بازرگانی پاداش | انتخاب هوشمند عایق',
  description: 'انتخاب، مقایسه و استعلام عایق‌های حرارتی و برودتی برای تأسیسات، ساختمان و صنعت. کاتالوگ تخصصی بازرگانی پاداش.',
  icons: { icon: '/favicon.svg' },
  openGraph: { title: 'بازرگانی پاداش | انتخاب هوشمند عایق', description: 'از انتخاب فنی تا تأمین پروژه، همراه شما.', locale: 'fa_IR', type: 'website', images: ['/images/insulation-hero.png'] },
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}
