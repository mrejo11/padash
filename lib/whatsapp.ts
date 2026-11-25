import { normalizeDigits, type Product } from './catalog';

export function normalizeWhatsAppNumber(value: string | undefined) {
  if (!value) return null;
  const cleaned = normalizeDigits(value.trim()).replace(/[\s()-]/g, '');
  const international = cleaned.replace(/^\+|^00/, '');
  const digits = /^09\d{9}$/.test(cleaned) ? '98' + cleaned.slice(1) : international;
  return /^[1-9]\d{7,14}$/.test(digits) && !/^(\d)\1+$/.test(digits)
    && (!digits.startsWith('98') || /^98[1-9]\d{9}$/.test(digits)) ? digits : null;
}

export function whatsappUrl(message: string) {
  const number = normalizeWhatsAppNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);
  return number ? 'https://wa.me/' + number + '?text=' + encodeURIComponent(message) : null;
}

export function productWhatsAppUrl(product: Pick<Product, 'name' | 'id'>, canonical: string) {
  return whatsappUrl(`سلام، برای دریافت قیمت یا مشاوره دربارهٔ ${product.name} (کد ${product.id}) پیام می‌دهم.\n${canonical}`);
}
