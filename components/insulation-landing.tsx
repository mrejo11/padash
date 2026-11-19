import Link from 'next/link';
import {ArrowLeft} from 'lucide-react';
import PublicPage from './public-page';
import ProductMedia from './product-media';
import JsonLd from './json-ld';
import InquiryAction from './inquiry-action';
import {products,productPath} from '../lib/catalog';
import {findCatalogCategory,categoryPath} from '../lib/catalog-seo';
import {guides} from '../lib/guides';
import {insulationTopics,topicFor,type InsulationTopic} from '../lib/insulation-topics';
import {absoluteUrl,breadcrumbs} from '../lib/seo';

export default function InsulationLanding({id}:{id:InsulationTopic['id']}){
  const topic=topicFor(id),items=topic.productIds.map(id=>products.find(product=>product.id===id)!);
  const relatedGuides=guides.filter(guide=>topic.guideSlugs.includes(guide.slug));
  const categories=[...new Set(items.map(product=>product.category))].map(findCatalogCategory).filter(category=>Boolean(category));
  const trail=breadcrumbs([{name:'صفحه اصلی',path:'/'},{name:topic.name,path:topic.path}]);
  return <PublicPage><JsonLd value={{'@context':'https://schema.org','@graph':[
    {...trail,'@context':undefined,'@id':absoluteUrl(topic.path+'#breadcrumb')},
    {'@type':'CollectionPage','@id':absoluteUrl(topic.path+'#webpage'),url:absoluteUrl(topic.path),name:topic.h1,description:topic.description,inLanguage:'fa-IR',isPartOf:{'@id':absoluteUrl('/#website')},breadcrumb:{'@id':absoluteUrl(topic.path+'#breadcrumb')},mainEntity:{'@id':absoluteUrl(topic.path+'#items')}},
    {'@type':'ItemList','@id':absoluteUrl(topic.path+'#items'),numberOfItems:items.length,itemListElement:items.map((product,index)=>({'@type':'ListItem',position:index+1,name:product.name,url:absoluteUrl(productPath(product))}))},
  ]}}/>
    <nav className="content-breadcrumb" aria-label="مسیر صفحه"><Link href="/">پاداش</Link><span>/</span><span aria-current="page">{topic.name}</span></nav>
    <header className="content-heading insulation-hero"><span className="eyebrow">انتخاب متریال و استعلام از بازرگانی پاداش</span><h1>{topic.h1}</h1><p>{topic.intro}</p><div className="insulation-actions"><InquiryAction topic={topic.name}/><a className="button button-outline" href="#topic-products">مشاهده محصولات مرتبط<ArrowLeft size={18}/></a></div></header>
    <section className="insulation-reading"><h2>{topic.question}</h2>{topic.explanation.map(text=><p key={text}>{text}</p>)}</section>
    <section id="topic-products" className="insulation-products" aria-labelledby="topic-products-title"><h2 id="topic-products-title">محصولات مرتبط در کاتالوگ پاداش</h2><p className="insulation-note">این فهرست معرفی خانواده‌های قابل بررسی است؛ برند، مدل، موجودی و مشخصات نهایی در استعلام تأیید می‌شوند.</p>
      <div className="insulation-product-grid">{items.map(product=><article className="insulation-product-card" key={product.id}><Link href={productPath(product)} className="insulation-product-image" aria-label={'مشخصات '+product.name}><ProductMedia product={product} sizes="(max-width: 600px) 82vw, (max-width: 1000px) 40vw, 300px"/></Link><div><h3><Link href={productPath(product)}>{product.name}</Link></h3><p>{product.desc}</p><Link className="text-button" href={productPath(product)}>مشخصات و استعلام {product.name}<ArrowLeft size={16}/></Link></div></article>)}</div>
      <nav className="insulation-family-links" aria-label="دسته‌های مرتبط">{categories.map(category=>category&&<Link key={category.id} href={categoryPath(category.id)}>همهٔ محصولات {category.name}</Link>)}</nav>
    </section>
    <section className="insulation-selection"><h2>برای انتخاب اولیه چه چیزی را مقایسه کنیم؟</h2><p className="insulation-note">این جدول راهنمای تنظیم استعلام است؛ مناسب‌بودن مدل برای پروژه باید با مدارک همان محصول تأیید شود.</p><div className="insulation-table-scroll"><table><caption>اطلاعات انتخاب {topic.name} بر اساس کاربرد</caption><thead><tr><th scope="col">کاربرد</th><th scope="col">خانوادهٔ قابل بررسی</th><th scope="col">اطلاعات لازم</th></tr></thead><tbody>{topic.selection.map(row=><tr key={row.application}><th scope="row">{row.application}</th><td>{row.productIds.map(id=>{const product=products.find(product=>product.id===id)!;return <Link href={productPath(product)} key={id}>{product.name}</Link>;})}</td><td>{row.check}</td></tr>)}</tbody></table></div></section>
    <section className="insulation-reading"><h2>محدودیت‌ها و نکات مهم انتخاب</h2>{topic.considerations.map(item=><div key={item.title}><h3>{item.title}</h3><p>{item.text}</p></div>)}</section>
    <section className="insulation-order"><div><h2>برای استعلام دقیق چه اطلاعاتی بفرستیم؟</h2><ul>{topic.orderChecklist.map(item=><li key={item}>{item}</li>)}</ul><Link className="text-button" href="/calculator">محاسبهٔ مقدار از ابعاد واقعی<ArrowLeft size={17}/></Link></div><div><h2>قیمت {topic.name} چگونه مشخص می‌شود؟</h2><p>{topic.priceFactors}</p><InquiryAction topic={topic.name}/><Link className="insulation-contact-link" href="/contact">تماس مستقیم با مدیران فروش</Link></div></section>
    <section className="insulation-faq"><h2>پرسش‌های پیش از خرید {topic.name}</h2>{topic.faqs.map(item=><details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
    <section className="article-related"><h2>راهنماها و کاربردهای مرتبط</h2>{relatedGuides.map(guide=><Link key={guide.slug} href={'/guides/'+guide.slug}>{guide.title}</Link>)}{insulationTopics.filter(item=>item.id!==topic.id).map(item=><Link key={item.id} href={item.path}>{item.name}؛ انتخاب و استعلام</Link>)}</section>
    <aside className="insulation-sources"><h2>منابع شناخت موضوع</h2><p>این منابع برای توضیح اصول انتخاب‌اند؛ ارجاع به سازنده، اعلام موجودی یا نمایندگی آن برند در پاداش نیست. مشخصات سفارش باید با دیتاشیت مدل منتخب تطبیق داده شوند.</p><ul>{topic.sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul></aside>
  </PublicPage>;
}
