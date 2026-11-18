import NewsManager from './news-manager';
export const metadata = { title: 'مدیریت اخبار و رویدادها', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
export default function NewsManagementPage() { return <NewsManager/>; }
