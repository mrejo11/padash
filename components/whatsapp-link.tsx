import { MessageCircle } from 'lucide-react';
import { whatsappUrl } from '../lib/whatsapp';

export function WhatsAppLink({ href, label, productId, floating = false }: {
  href: string | null; label: string; productId?: string; floating?: boolean;
}) {
  if (!href) return null;
  return <a href={href} target="_blank" rel="noopener noreferrer"
    className={floating ? 'whatsapp-float' : 'button button-outline'} aria-label={label}
    data-analytics-whatsapp="" data-analytics-product={productId}>
    <MessageCircle size={floating ? 25 : 18} aria-hidden="true"/>
    {!floating && label}
  </a>;
}

export function FloatingWhatsApp() {
  return <WhatsAppLink floating label="مشاوره با پاداش در واتس‌اپ"
    href={whatsappUrl('سلام، برای مشاوره یا استعلام محصولات پاداش پیام می‌دهم.')}/>;
}
