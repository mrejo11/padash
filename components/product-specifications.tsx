import { Download } from 'lucide-react';
import { fa, productPath, type Product } from '../lib/catalog';
import { productFieldKeys, specificationFields, type ProductSpecForm } from '../lib/product-spec-fields';
import { absoluteUrl } from '../lib/seo';
import JsonLd from './json-ld';

type SpecificationRow = { label: string; value: string; unit?: string };

export default function ProductSpecifications({ product, verified }: { product: Product; verified: ProductSpecForm | null }) {
  const catalogRows: SpecificationRow[] = [
    { label: 'کد کاتالوگ پاداش', value: product.id },
    { label: 'جنس', value: product.material },
    { label: 'شکل عرضه', value: product.form },
    { label: 'کاربرد عمومی', value: product.use },
    { label: 'واحد درخواست اولیه', value: product.unit },
    { label: 'پوشش قابل بررسی', value: product.cover },
    ...(product.thicknesses.length ? [{ label: 'ضخامت قابل استعلام', value: product.thicknesses.map(fa).join('، '), unit: 'میلی‌متر' }] : []),
    ...(product.specifications ?? []),
  ];
  const verifiedRows = productFieldKeys(product.category).flatMap(key => {
    const row = verified?.values[key];
    return row ? [{ label: specificationFields[key].label, ...row }] : [];
  });
  const path = productPath(product);
  return <>
    <h2 id="product-specs">مشخصات محصول</h2>
    <SpecificationTable rows={catalogRows} caption="مشخصات عمومی خانواده محصول"/>
    {verified && <section aria-labelledby="verified-specifications">
      <h3 id="verified-specifications">مشخصات مستند سازنده</h3>
      {verified.model && <p>مدل <bdi>{verified.model}</bdi></p>}
      {verified.manufacturer && <p>سازنده <bdi>{verified.manufacturer}</bdi></p>}
      {verifiedRows.length > 0 && <SpecificationTable rows={verifiedRows} caption="مقادیر فنی اعلام‌شده در منبع"/>}
      <p className="article-note">منبع {verified.sourceUrl
        ? <a href={verified.sourceUrl} rel="noreferrer">{verified.source}</a>
        : verified.source}</p>
      {verified.hasDatasheet && <a className="button button-outline" href={path + '/datasheet'} data-analytics-product={product.id} download>
        <Download size={18} aria-hidden="true"/>دانلود دیتاشیت PDF
      </a>}
      {verified.model && verified.manufacturer && <JsonLd value={{
        '@context': 'https://schema.org',
        '@type': 'Product',
        '@id': absoluteUrl(path + '#manufacturer-model'),
        url: absoluteUrl(path),
        name: verified.model,
        model: verified.model,
        manufacturer: { '@type': 'Organization', name: verified.manufacturer },
        ...(verifiedRows.length ? { additionalProperty: verifiedRows.map(row => ({
          '@type': 'PropertyValue', name: row.label, value: row.value, ...(row.unit ? { unitText: row.unit } : {}),
        })) } : {}),
      }}/>}
    </section>}
  </>;
}

function SpecificationTable({ rows, caption }: { rows: SpecificationRow[]; caption: string }) {
  return <table className="product-technical-table">
    <caption>{caption}</caption>
    <tbody>{rows.map(row => <tr key={row.label}>
      <th scope="row">{row.label}</th>
      <td><bdi>{row.value}</bdi>{row.unit && <> <bdi>{row.unit}</bdi></>}</td>
    </tr>)}</tbody>
  </table>;
}
