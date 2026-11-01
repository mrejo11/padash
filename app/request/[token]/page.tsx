import {getQuote} from '../../../lib/quotes';
import {notFound} from 'next/navigation';
import {products,fa,type QuoteItem} from '../../../lib/catalog';
import {statusLabels} from '../../../lib/quote-validation';
import ReceiptActions from './receipt-actions';
export const dynamic='force-dynamic';
export const metadata={title:'پیگیری درخواست',robots:{index:false,follow:false}};
export default async function RequestPage({params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(token))notFound();
 let row;
 try { row=await getQuote(token); }
 catch { return <main className="subpage"><div className="document"><h1>سامانه موقتاً در دسترس نیست</h1><p>لطفاً کمی بعد همین پیوند را باز کنید.</p><a href="/" className="button button-outline">بازگشت به سایت</a></div></main>; }
 if(!row)notFound();
 const items:QuoteItem[]=JSON.parse(row.items);
 return <main className="subpage"><div className="document"><header className="document-header"><a href="/" className="brand"><img src="/favicon.svg" alt="" width="42" height="42"/><span><b>پاداش.</b><small>بازرگانی پاداش</small></span></a><span className="eyebrow">رسید درخواست تأمین</span></header><h1>خلاصه درخواست شما</h1><p>این رسید تأیید ثبت درخواست است و به معنی صدور پیش‌فاکتور یا رزرو موجودی نیست.</p><div className="document-meta"><span>کد پیگیری: <b dir="ltr">{row.id}</b></span><span>زمان ثبت: {new Date(row.created_at).toLocaleString('fa-IR',{timeZone:'Asia/Tehran',dateStyle:'medium',timeStyle:'short'})}</span></div><div className="status">وضعیت: {statusLabels[row.status]||row.status}</div>{items.length?<div style={{overflowX:'auto'}}><table><thead><tr><th>محصول</th><th>ضخامت</th><th>مقدار</th></tr></thead><tbody>{items.map((item,i)=>{const p=products.find(p=>p.id===item.productId);return <tr key={i}><td>{p?.name||item.productId}</td><td>{fa(item.thickness)} میلی‌متر</td><td>{fa(item.quantity)} {p?.unit}</td></tr>;})}</tbody></table></div>:<p>درخواست مشاوره و بررسی نیاز پروژه ثبت شده است.</p>}<p>برای حفظ حریم خصوصی، اطلاعات تماس و شرح اختصاصی پروژه در این صفحه نمایش داده نمی‌شود. این پیوند را در جای امن نگه دارید.</p><ReceiptActions/><div style={{borderTop:'1px solid #dfe5d6',marginTop:30,paddingTop:18}}><p>بازرگانی پاداش · انتخاب هوشمند عایق، آسایش ماندگار.</p></div></div></main>;
}
