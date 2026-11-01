import { normalizeDigits, products, type QuoteItem } from './catalog';

export const statusLabels = {
  new: 'در انتظار بررسی',
  reviewing: 'در حال بررسی',
  quoted: 'پیش‌فاکتور ارائه شده',
  confirmed: 'سفارش تأیید شده',
  closed: 'بسته شده',
  cancelled: 'لغو شده',
} as const;
export type QuoteStatus = keyof typeof statusLabels;
export type RequestKind = 'order' | 'consultation';
export const kindLabels: Record<RequestKind, string> = { order: 'سفارش و استعلام', consultation: 'درخواست مشاوره' };
export type HistoryEntry = { at: string; changes: string[] };
export type Quote = {
  id: string; token: string; name: string; company: string; phone: string;
  city: string; items: string; message: string; status: QuoteStatus; created_at: string;
  kind?: RequestKind; revision?: number; updated_at?: string;
  internal_note?: string; assignee?: string; follow_up_date?: string; history?: HistoryEntry[];
};
export type ManagementFilters = {
  q: string; status: string; kind: string; from: string; to: string; followUp: string;
};
export type ManagementStats = {
  total: number; orders: number; consultations: number; pending: number; today: number;
  followUps: number; lineItems: number;
  statuses: { status: QuoteStatus; count: number }[];
  volumes: { unit: string; quantity: number }[];
  products: { id: string; name: string; unit: string; quantity: number; requests: number }[];
  daily: { date: string; orders: number; consultations: number }[];
};
export type ManagementResponse = {
  items: Quote[]; total: number; page: number; pageSize: number; stats: ManagementStats;
};

export function quoteItems(quote: Pick<Quote, 'items'>): QuoteItem[] {
  try {
    const parsed: unknown = JSON.parse(quote.items);
    return Array.isArray(parsed) ? parsed.filter((item): item is QuoteItem =>
      Boolean(item && typeof item.productId === 'string' && Number.isFinite(item.thickness)
        && Number.isFinite(item.quantity) && item.quantity > 0 && typeof item.note === 'string')) : [];
  } catch { return []; }
}

export function requestKind(quote: Quote): RequestKind {
  return quote.kind || (quoteItems(quote).length ? 'order' : 'consultation');
}

export function tehranDate(value: string | Date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(value));
}

export function isOpen(quote: Quote) { return quote.status !== 'closed' && quote.status !== 'cancelled'; }
export function needsFollowUp(quote: Quote, today = tehranDate()) {
  return Boolean(isOpen(quote) && quote.follow_up_date && quote.follow_up_date <= today);
}

export function quantities(quote: Quote) {
  const units: Record<string, number> = {};
  for (const item of quoteItems(quote)) {
    const unit = products.find(p => p.id === item.productId)?.unit || 'واحد';
    units[unit] = (units[unit] || 0) + item.quantity;
  }
  return Object.entries(units).map(([unit, quantity]) => ({ unit, quantity }));
}

function searchable(value: string) {
  return normalizeDigits(value).replace(/ي/g, 'ی').replace(/ك/g, 'ک').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function filterQuotes(rows: Quote[], filters: ManagementFilters, today = tehranDate()) {
  const query = searchable(filters.q);
  return rows.filter(row => {
    if (filters.status && row.status !== filters.status) return false;
    if (filters.kind && requestKind(row) !== filters.kind) return false;
    const date = tehranDate(row.created_at);
    if (filters.from && date < filters.from || filters.to && date > filters.to) return false;
    if (filters.followUp === 'due' && !needsFollowUp(row, today)) return false;
    if (filters.followUp === 'unassigned' && row.assignee) return false;
    if (!query) return true;
    const text = [row.id, row.name, row.company, row.phone, row.city, row.message, row.assignee || '',
      ...quoteItems(row).map(i => products.find(p => p.id === i.productId)?.name || i.productId)].join(' ');
    return searchable(text).includes(query);
  });
}

export function managementStats(rows: Quote[], now = new Date()): ManagementStats {
  const today = tehranDate(now);
  const stats: ManagementStats = {
    total: rows.length, orders: 0, consultations: 0, pending: 0, today: 0,
    followUps: 0, lineItems: 0, statuses: Object.keys(statusLabels).map(status => ({ status: status as QuoteStatus, count: 0 })),
    volumes: [], products: [], daily: [],
  };
  for (let i = 6; i >= 0; i--) stats.daily.push({
    date: tehranDate(new Date(now.getTime() - i * 86_400_000)), orders: 0, consultations: 0,
  });
  const volumes: Record<string, number> = {};
  const demand = new Map<string, ManagementStats['products'][number]>();
  for (const row of rows) {
    const kind = requestKind(row);
    const date = tehranDate(row.created_at);
    if (kind === 'order') stats.orders++; else stats.consultations++;
    if (row.status === 'new') stats.pending++;
    if (date === today) stats.today++;
    if (needsFollowUp(row, today)) stats.followUps++;
    const status = stats.statuses.find(s => s.status === row.status);
    if (status) status.count++;
    const day = stats.daily.find(d => d.date === date);
    if (day) { if (kind === 'order') day.orders++; else day.consultations++; }
    // Requested quantities use separate units. Cancelled requests are excluded.
    if (kind !== 'order' || row.status === 'cancelled') continue;
    const items = quoteItems(row);
    stats.lineItems += items.length;
    const seen = new Set<string>();
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      const unit = product?.unit || 'واحد';
      volumes[unit] = (volumes[unit] || 0) + item.quantity;
      const current = demand.get(item.productId) || {
        id: item.productId, name: product?.name || item.productId, unit, quantity: 0, requests: 0,
      };
      current.quantity += item.quantity;
      if (!seen.has(item.productId)) current.requests++;
      seen.add(item.productId);
      demand.set(item.productId, current);
    }
  }
  stats.volumes = Object.entries(volumes).map(([unit, quantity]) => ({ unit, quantity }));
  stats.products = [...demand.values()].sort((a, b) => b.requests - a.requests || a.name.localeCompare(b.name));
  return stats;
}
