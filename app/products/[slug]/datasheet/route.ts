import { findProductBySlug } from '../../../../lib/catalog';
import { getPublicDatasheet } from '../../../../lib/product-specs';

const headers = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; sandbox",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow',
};

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const product = findProductBySlug((await params).slug);
  if (!product) return new Response(null, { status: 404, headers });
  try {
    const bytes = await getPublicDatasheet(product.id);
    if (!bytes) return new Response(null, { status: 404, headers });
    return new Response(bytes, { headers: {
      ...headers, 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${product.id}-datasheet.pdf"`,
    } });
  } catch {
    return new Response(null, { status: 503, headers });
  }
}
