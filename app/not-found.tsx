
import Link from 'next/link';
import Brand from '../components/brand';
export default function NotFound() {
  return <main className="subpage"><section className="document management-empty">
    <Brand/>
    <h1 style={{ marginTop: 25 }}>صفحه یا درخواست پیدا نشد</h1>
    <p>نشانی را بررسی کنید یا محصول مورد نظر را در کاتالوگ پیدا کنید.</p>
    <Link href="/products" className="button button-orange" style={{ marginTop: 25 }}>مشاهده کاتالوگ محصولات</Link>
  </section></main>;
}
