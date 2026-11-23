import Link from 'next/link';
import { productPath, type Product } from '../lib/catalog';
import type { BuyingGuide } from '../lib/catalog-buying-guides';
import { categoryPath } from '../lib/catalog-seo';
import { calculatorProfile } from '../lib/estimate-products';
import InquiryAction from './inquiry-action';

export default function CatalogBuyingGuide({ guide, categoryName, items }: { guide: BuyingGuide; categoryName: string; items: Product[] }) {
  return <div className="catalog-buying-guide">
    <section aria-labelledby="buying-options">
      <h2 id="buying-options">{guide.comparisonHeading}</h2>
      <div className="buying-option-grid">{guide.choices.map(choice => {
        const product = items.find(item => item.id === choice.productId);
        if (!product) return null;
        return <article className="buying-option" key={product.id}>
          <h3><Link href={productPath(product)}>{choice.label}</Link></h3>
          <p>{choice.check}</p>
          {calculatorProfile(product.id) && <Link className="buying-calculator" href={`/calculator?product=${product.id.toLowerCase()}`}>محاسبه مقدار {product.name}</Link>}
        </article>;
      })}</div>
    </section>
    <section className="buying-quote" aria-labelledby="buying-price">
      <h2 id="buying-price">{guide.priceHeading}</h2>
      <p>{guide.priceDetails}</p>
      <p>{guide.requestDetails}</p>
      <div className="buying-actions">
        <InquiryAction topic={categoryName} label={`استعلام قیمت ${categoryName}`}/>
        <Link className="button button-outline" href="/contact">تماس برای استعلام</Link>
      </div>
    </section>
    <section className="insulation-faq" aria-labelledby="buying-faq">
      <h2 id="buying-faq">پرسش‌های خرید {categoryName}</h2>
      {guide.questions.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
    </section>
    {guide.relatedCategory && <section className="article-related">
      <h2>محصول مرتبط</h2>
      <p>{guide.relatedCategory.description}</p>
      <Link href={categoryPath(guide.relatedCategory.id)}>{guide.relatedCategory.label}</Link>
    </section>}
  </div>;
}
