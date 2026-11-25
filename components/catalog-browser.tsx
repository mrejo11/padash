'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpLeft, Check, ChevronDown, Search, SlidersHorizontal, Scale, X } from 'lucide-react';
import { categories, fa, filterProducts, products, productPath, type Product } from '../lib/catalog';
import ProductMedia from './product-media';
import { analyticsItem, trackEvent } from '../lib/analytics';
import { useTrackingPath } from './analytics-impression';

const firstCategories = new Set(['all', 'glasswool', 'eps']);
const linkedCategories = [...categories.filter(item => firstCategories.has(item.id)), ...categories.filter(item => !firstCategories.has(item.id))];

export default function CatalogBrowser({onInspect,onCompare,compared=[],category,onCategoryChange,compact=false,initialQuery='',initialCategory='all',categoryLinks=false,headingLevel=3}:{
  onInspect:(product:Product)=>void;onCompare?:(id:string)=>void;compared?:string[];category?:string;onCategoryChange?:(value:string)=>void;compact?:boolean;initialQuery?:string;initialCategory?:string;categoryLinks?:boolean;headingLevel?:2|3;
}) {
  const [query,setQuery]=useState(initialQuery),[localCategory,setLocalCategory]=useState(initialCategory);
  const [sort,setSort]=useState<'featured'|'name'>('featured');
  const selectedCategory=category??localCategory;
  const activePath = useTrackingPath();
  const listId = (compact ? 'home_' : 'catalog_') + selectedCategory;
  function selectCategory(value:string){
    if (value !== selectedCategory) trackEvent('product_filter', { category: value });
    setLocalCategory(value);onCategoryChange?.(value);
  }
  function reset(){setQuery('');selectCategory(initialCategory);setSort('featured');}
  const Heading=headingLevel===2?'h2':'h3';
  const filtered=filterProducts({query,category:selectedCategory});
  if(sort==='name')filtered.sort((a,b)=>a.name.localeCompare(b.name,'fa'));
  const featured=compact&&sort==='featured'&&!query&&selectedCategory==='all';
  const featuredIds=['VN-1221','EL-R','VN-1220','EPS-SHEET'];
  const visible=featured?featuredIds.map(id=>filtered.find(product=>product.id===id)!).filter(Boolean):filtered;
  const visibleIds = visible.map(product => product.id).join(',');
  const resultCount = filtered.length;
  useEffect(() => {
    if (!activePath) return;
    const timer = setTimeout(() => {
      if (query.trim()) trackEvent('search', { search_term: 'catalog_search', results_count: resultCount }, listId + ':' + query.trim());
      if (!visibleIds) return;
      const items = visibleIds.split(',').map(id => analyticsItem(products.find(product => product.id === id)!));
      trackEvent('view_item_list', { item_list_id: listId, items }, listId + ':' + visibleIds);
    }, 450);
    return () => clearTimeout(timer);
  }, [activePath, listId, query, resultCount, visibleIds]);
  function selectItem(product: Product) {
    trackEvent('select_item', { item_list_id: listId, items: [analyticsItem(product)] });
  }
  const controls = <>
    <div className="catalog-search-row"><label className="catalog-search"><Search size={20}/><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="نام محصول، جنس یا کاربرد را جست‌وجو کنید…" aria-label="جست‌وجوی محصولات"/>{query&&<button type="button" onClick={()=>setQuery('')} aria-label="پاک کردن جست‌وجو"><X size={18}/></button>}</label>
      <label className="catalog-sort"><SlidersHorizontal size={17}/><span>چینش</span><select value={sort} onChange={event=>{
        const next = event.target.value === 'name' ? 'name' : 'featured';
        setSort(next);
        trackEvent('product_filter', { category: selectedCategory, sort: next });
      }} aria-label="ترتیب نمایش محصولات"><option value="featured">پیشنهاد کاتالوگ</option><option value="name">نام محصول</option></select></label></div>
    <div className="catalog-category-list" role="group" aria-label="دسته‌بندی محصولات">{(categoryLinks ? linkedCategories : categories).map(item=>{
      const content=<>{item.name}<span className="category-count">{fa(item.id==='all'?products.length:products.filter(product=>product.category===item.id).length)}</span></>;
      return categoryLinks?<Link key={item.id} href={item.id==='all'?'/products':'/products/category/'+item.id} prefetch={false} aria-current={selectedCategory===item.id?'page':undefined} className={selectedCategory===item.id?'active':''} onClick={() => {
        if (selectedCategory !== item.id) trackEvent('product_filter', { category: item.id });
      }}>{content}</Link>
        :<button key={item.id} type="button" aria-pressed={selectedCategory===item.id} className={selectedCategory===item.id?'active':''} onClick={()=>selectCategory(item.id)}>{content}</button>;
    })}</div>
  </>;
  return <div className={'catalog-browser'+(featured?' catalog-featured':'')}>
    {categoryLinks && initialCategory !== 'all'
      ? <details className="catalog-tools"><summary>جست‌وجو و تغییر دسته‌بندی<ChevronDown size={17} aria-hidden="true"/></summary>{controls}</details>
      : controls}
    <div className="catalog-results-line"><p role="status" aria-live="polite"><span className="catalog-result-dot"/>{visible.length<filtered.length?`${fa(visible.length)} محصول از ${fa(filtered.length)} محصول`: `${fa(filtered.length)} محصول`}{(query||(!categoryLinks&&selectedCategory!=='all'))&&<button type="button" className="catalog-reset" onClick={reset}><X size={13}/>پاک کردن فیلترها</button>}</p><span>برای دریافت قیمت، استعلام کنید</span></div>
    {visible.length?<div className="product-grid partner-product-grid">{visible.map((product,index)=><article className="product-card catalog-item" key={product.id}>
      <div className={'product-image '+(product.images?.length?'has-photo':'art-'+product.art)}>
        <span className="catalog-origin">{product.tag}</span>
        {onCompare&&<button className={'compare-toggle '+(compared.includes(product.id)?'selected':'')} type="button" onClick={()=>onCompare(product.id)} aria-label={'مقایسه '+product.name} aria-pressed={compared.includes(product.id)}>{compared.includes(product.id)?<Check size={18}/>:<Scale size={18}/>}</button>}
        <a className="catalog-photo-link" href={productPath(product)} aria-label={'مشخصات '+product.name} onClick={() => selectItem(product)}><ProductMedia product={product} priority={!compact && index === 0 && !query && sort === 'featured'}/></a>
        <span className="product-code" dir="ltr">{product.id}</span>
      </div>
      <div className="product-body"><span className="product-en" dir="ltr">{product.en}</span><Heading><a href={productPath(product)} onClick={() => selectItem(product)}>{product.name}</a></Heading><p>{product.use}</p>
        <dl className="catalog-card-facts"><div><dt>فرم</dt><dd>{product.form}</dd></div><div><dt>واحد درخواست</dt><dd>{product.unit}</dd></div></dl>
        <div className="catalog-card-actions"><a href={productPath(product)} onClick={() => selectItem(product)}>مشخصات محصول<ArrowUpLeft size={16}/></a><button className="button button-dark" aria-label={'استعلام قیمت '+product.name} onClick={()=>{selectItem(product);onInspect(product);}}>استعلام قیمت<ArrowLeft size={16}/></button></div>
      </div>
    </article>)}</div>:<div className="empty-state"><Search size={32}/><Heading>محصولی با این انتخاب پیدا نشد</Heading><p>عبارت جست‌وجو یا دسته‌بندی را تغییر دهید.</p>
      <button className="button button-outline" onClick={reset}>پاک کردن فیلترها</button>
      {categoryLinks && initialCategory!=='all' && <Link className="text-button" href="/products">مشاهده همه محصولات<ArrowLeft size={16}/></Link>}
    </div>}
    {visible.length<filtered.length&&<Link className="button button-outline catalog-load-more" href="/products">مشاهده کاتالوگ کامل<ArrowLeft size={18}/></Link>}
    <p className="catalog-order-note">واحدهای این کاتالوگ برای ثبت نیاز اولیه‌اند؛ ابعاد، مشخصات و واحد نهایی تأمین در پیش‌فاکتور تأیید می‌شوند.</p>
  </div>;
}
