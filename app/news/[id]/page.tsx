import { cache } from 'react';
import { notFound } from 'next/navigation';
import PublicPage from '../../../components/public-page';
import JsonLd from '../../../components/json-ld';
import { getPublishedNews } from '../../../lib/news';
import { absoluteUrl, breadcrumbs, organization, pageMetadata } from '../../../lib/seo';
export const dynamic = 'force-dynamic';
const getNews = cache(getPublishedNews);
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const item = await getNews((await params).id);
  if (!item) return { title: 'خبر پیدا نشد', robots: { index: false } };
  const meta = pageMetadata(item.title, item.summary, '/news/' + item.id);
  return { ...meta, openGraph: { ...meta.openGraph, type: 'article' as const, publishedTime: item.published_at!, modifiedTime: item.updated_at } };
}
export default async function NewsDetail({ params }: { params: Promise<{ id: string }> }) {
  const item = await getNews((await params).id);
  if (!item) notFound();
  const path = '/news/' + item.id;
  return <PublicPage><JsonLd value={breadcrumbs([{ name: 'صفحه اصلی', path: '/' }, { name: 'اخبار', path: '/news' }, { name: item.title, path }])}/>
    <JsonLd value={{ '@context': 'https://schema.org', '@type': 'Article', headline: item.title, description: item.summary, datePublished: item.published_at,
      dateModified: item.updated_at, mainEntityOfPage: absoluteUrl(path), author: organization, publisher: organization, inLanguage: 'fa-IR' }}/>
    <article className="reading-article"><header className="content-heading"><span className="eyebrow">{item.kind === 'event' ? 'رویداد بازرگانی پاداش' : 'خبر و اطلاعیه بازرگانی پاداش'}</span><h1>{item.title}</h1>
      <div className="article-meta"><span>منتشرکننده: بازرگانی پاداش</span><time dateTime={item.published_at!}>{new Date(item.published_at!).toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran', dateStyle: 'long' })}</time></div><p>{item.summary}</p></header>
      {item.kind === 'event' && item.event_date && <p className="article-note">تاریخ رویداد: <time dateTime={item.event_date}>{new Date(item.event_date + 'T12:00:00+03:30').toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran', dateStyle: 'long' })}</time></p>}
      <div className="news-body">{item.body.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div><a className="text-button" href="/news">همه اخبار و رویدادها</a>
    </article>
  </PublicPage>;
}
