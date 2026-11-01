import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PublicPage from '../../../components/public-page';
import JsonLd from '../../../components/json-ld';
import { findGuide, guides } from '../../../lib/guides';
import { products, fa } from '../../../lib/catalog';
import { absoluteUrl, breadcrumbs, organization, pageMetadata } from '../../../lib/seo';
export function generateStaticParams() { return guides.map(guide => ({ slug: guide.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const guide = findGuide((await params).slug);
  if (!guide) return { title: 'راهنما پیدا نشد', robots: { index: false } };
  const meta = pageMetadata(guide.title, guide.description, '/guides/' + guide.slug);
  return { ...meta, openGraph: { ...meta.openGraph, type: 'article', publishedTime: guide.published + 'T12:00:00+03:30', modifiedTime: guide.modified + 'T12:00:00+03:30' } };
}
export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = findGuide((await params).slug);
  if (!guide) notFound();
  const path = '/guides/' + guide.slug;
  return <PublicPage><JsonLd value={breadcrumbs([{ name: 'صفحه اصلی', path: '/' }, { name: 'راهنماها', path: '/guides' }, { name: guide.title, path }])}/>
    <JsonLd value={{ '@context': 'https://schema.org', '@type': 'Article', headline: guide.title, description: guide.description,
      mainEntityOfPage: absoluteUrl(path), datePublished: guide.published + 'T12:00:00+03:30', dateModified: guide.modified + 'T12:00:00+03:30',
      inLanguage: 'fa-IR', author: { '@type': 'Organization', name: 'تحریریه بازرگانی پاداش', url: absoluteUrl('/guides') }, publisher: organization,
      citation: guide.sources.map(source => source.url) }}/>
    <nav className="content-breadcrumb" aria-label="مسیر صفحه"><a href="/">پاداش</a><span>/</span><a href="/guides">راهنماها</a><span>/</span><span>{guide.category}</span></nav>
    <article className="reading-article"><header className="content-heading"><span className="eyebrow">{guide.category}</span><h1>{guide.title}</h1>
      <div className="article-meta"><span>تحریریه بازرگانی پاداش</span><span>{fa(guide.minutes)} دقیقه مطالعه</span><span>بررسی منابع: <time dateTime={guide.modified}>{new Date(guide.modified + 'T12:00:00+03:30').toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran', dateStyle: 'long' })}</time></span></div><p>{guide.intro}</p></header>
      <nav className="article-toc" aria-label="فهرست راهنما"><b>در این راهنما</b>{guide.sections.map((section, index) => <a key={section.heading} href={'#section-' + index}>{section.heading}</a>)}</nav>
      {guide.sections.map((section, index) => <section id={'section-' + index} key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        {section.sourceIds && <div className="inline-sources">منابع این بخش: {section.sourceIds.map(id => { const source = guide.sources.find(source => source.id === id)!; return <a key={id} href={source.url} target="_blank" rel="noreferrer">{source.title}</a>; })}</div>}</section>)}
      <aside className="article-note">این راهنما برای انتخاب اولیه و تنظیم استعلام است؛ جایگزین طراحی حرارتی، بررسی الزامات پروژه یا دستور نصب سازنده نیست. ارجاع به یک برند، اعلام نمایندگی یا موجودی آن در پاداش نیست.</aside>
      <section className="article-sources"><h2>منابع داخلی و خارجی</h2><ul>{guide.sources.map(source => <li key={source.id}><span>{source.origin}</span><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul></section>
      <section className="article-related"><h2>قدم بعدی پروژه</h2><a href="/calculator">محاسبه مقدار عایق رولی</a>{guide.relatedProducts.map(id => { const product = products.find(p => p.id === id)!; return <a href={'/products/' + product.id.toLowerCase()} key={id}>{product.name}</a>; })}<a href="/#contact">مشاوره با مدیران پاداش</a></section>
    </article>
  </PublicPage>;
}
