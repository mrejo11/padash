'use client';
import { useState } from 'react';
import { ArrowLeft, ArrowUpLeft, Check, Search, SlidersHorizontal, Scale, X } from 'lucide-react';
import { categories, fa, filterProducts, products, productPath, type Product } from '../lib/catalog';
import ProductMedia from './product-media';

export default function CatalogBrowser({onInspect,onCompare,compared=[],category,onCategoryChange,compact=false}:{
  onInspect:(product:Product)=>void;onCompare?:(id:string)=>void;compared?:string[];category?:string;onCategoryChange?:(value:string)=>void;compact?:boolean;
}) {
  const [query,setQuery]=useState(''),[localCategory,setLocalCategory]=useState('all');
  const [sort,setSort]=useState('featured'),[expanded,setExpanded]=useState(false);
  const selectedCategory=category??localCategory;
  function selectCategory(value:string){setLocalCategory(value);onCategoryChange?.(value);}
  function reset(){setQuery('');selectCategory('all');setSort('featured');setExpanded(false);}
  const filtered=filterProducts({query,category:selectedCategory});
  if(sort==='name')filtered.sort((a,b)=>a.name.localeCompare(b.name,'fa'));
  const visible=compact&&!expanded&&!query&&selectedCategory==='all'?filtered.slice(0,8):filtered;
  return <div className="catalog-browser">
    <div className="catalog-search-row"><label className="catalog-search"><Search size={20}/><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="نام محصول، جنس یا کاربرد را جست‌وجو کنید…" aria-label="جست‌وجوی محصولات"/>{query&&<button type="button" onClick={()=>setQuery('')} aria-label="پاک کردن جست‌وجو"><X size={18}/></button>}</label>
      <label className="catalog-sort"><SlidersHorizontal size={17}/><span>چینش</span><select value={sort} onChange={event=>setSort(event.target.value)} aria-label="ترتیب نمایش محصولات"><option value="featured">پیشنهاد کاتالوگ</option><option value="name">نام محصول</option></select></label></div>
    <div className="catalog-category-list" role="group" aria-label="دسته‌بندی محصولات">{categories.map(item=><button key={item.id} type="button" aria-pressed={selectedCategory===item.id} className={selectedCategory===item.id?'active':''} onClick={()=>selectCategory(item.id)}>{item.name}<span className="category-count">{fa(item.id==='all'?products.length:products.filter(product=>product.category===item.id).length)}</span></button>)}</div>
    <div className="catalog-results-line"><p role="status" aria-live="polite"><span className="catalog-result-dot"/>{fa(filtered.length)} محصول{(query||selectedCategory!=='all')&&<button type="button" className="catalog-reset" onClick={reset}><X size={13}/>پاک کردن فیلترها</button>}</p><span>قیمت و شرایط تأمین با استعلام</span></div>
    {visible.length?<div className="product-grid partner-product-grid">{visible.map(product=><article className="product-card catalog-item" key={product.id}>
      <div className={'product-image '+(product.images?.length?'has-photo':'art-'+product.art)}>
        <span className="catalog-origin">{product.tag}</span>
        {onCompare&&<button className={'compare-toggle '+(compared.includes(product.id)?'selected':'')} type="button" onClick={()=>onCompare(product.id)} aria-label={'مقایسه '+product.name} aria-pressed={compared.includes(product.id)}>{compared.includes(product.id)?<Check size={18}/>:<Scale size={18}/>}</button>}
        <a className="catalog-photo-link" href={productPath(product)} aria-label={'مشخصات '+product.name}><ProductMedia product={product}/></a>
        <span className="product-code" dir="ltr">{product.id}</span>
      </div>
      <div className="product-body"><span className="product-en" dir="ltr">{product.en}</span><h3><a href={productPath(product)}>{product.name}</a></h3><p>{product.use}</p>
        <dl className="catalog-card-facts"><div><dt>فرم</dt><dd>{product.form}</dd></div><div><dt>واحد درخواست</dt><dd>{product.unit}</dd></div></dl>
        <div className="catalog-card-actions"><a href={productPath(product)}>جزئیات و تصاویر<ArrowUpLeft size={16}/></a><button className="button button-dark" onClick={()=>onInspect(product)}>استعلام محصول<ArrowLeft size={16}/></button></div>
      </div>
    </article>)}</div>:<div className="empty-state"><Search size={32}/><h3>محصولی با این انتخاب پیدا نشد</h3><p>عبارت جست‌وجو یا دسته‌بندی را تغییر دهید.</p><button className="button button-outline" onClick={reset}>نمایش همه محصولات</button></div>}
    {visible.length<filtered.length&&<button className="button button-outline catalog-load-more" onClick={()=>setExpanded(true)}>نمایش همه {fa(filtered.length)} محصول<ArrowLeft size={18}/></button>}
    <p className="catalog-order-note">واحدهای این کاتالوگ برای ثبت نیاز اولیه‌اند؛ ابعاد، مشخصات و واحد نهایی تأمین در پیش‌فاکتور تأیید می‌شوند.</p>
  </div>;
}
