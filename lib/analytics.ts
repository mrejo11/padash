type Item = { item_id: string; item_name: string; item_category: string };
type List = { item_list_id: string };
type ProductRef = { product_id?: string };
type Inquiry = { inquiry_kind: 'order' | 'consultation'; form_source: 'contact' | 'inquiry' };

type Events = {
  view_item: { items: Item[] };
  view_item_list: List & { items: Item[] };
  select_item: List & { items: Item[] };
  search: { search_term: 'catalog_search'; results_count: number };
  product_filter: { category: string; sort?: 'name' | 'featured' };
  calculator_started: ProductRef;
  calculator_completed: ProductRef;
  inquiry_started: Inquiry;
  inquiry_submitted: Inquiry;
  contact_form_submitted: Inquiry;
  whatsapp_clicked: ProductRef;
  phone_clicked: Record<string, never>;
  datasheet_downloaded: ProductRef;
};

const configuredGa = process.env.NEXT_PUBLIC_GA4_ID?.trim();
const configuredGtm = process.env.NEXT_PUBLIC_GTM_ID?.trim();
const ga = configuredGa && /^G-[A-Z0-9]{5,20}$/.test(configuredGa) ? configuredGa : null;
const gtm = configuredGtm && /^GTM-[A-Z0-9]{5,20}$/.test(configuredGtm) ? configuredGtm : null;
export const analyticsConfigured = Boolean(ga || gtm);

type AnalyticsWindow = Window & { dataLayer?: unknown[] };
const subscribers = new Set<() => void>();
const consentKey = 'padash-analytics-consent-v1';
type Preference = 'granted' | 'denied' | '';
let preference: Preference | undefined;
let loaded = false;
let activePath = '';
let lastView = '';
const pageEvents = new Set<string>();
const confirmations = new Set<string>();

export function subscribeAnalytics(callback: () => void) {
  subscribers.add(callback);
  return () => { subscribers.delete(callback); };
}

function notify() {
  for (const callback of subscribers) callback();
}

export function analyticsPreference(): Preference {
  if (preference !== undefined) return preference;
  let value: string | null = null;
  try { value = window.localStorage.getItem(consentKey); } catch { /* Storage can be restricted. */ }
  if (!value) {
    try { value = window.sessionStorage.getItem(consentKey); } catch { /* Storage can be restricted. */ }
  }
  return value === 'granted' || value === 'denied' ? value : '';
}

export function setAnalyticsPreference(value: Exclude<Preference, ''>) {
  try { window.localStorage.setItem(consentKey, value); }
  catch {
    try { window.sessionStorage.setItem(consentKey, value); } catch { /* In-memory choice still applies. */ }
  }
  applyPreference(value);
}

export function syncAnalyticsPreference(event: StorageEvent) {
  if (event.key !== null && event.key !== consentKey) return;
  const value = event.newValue;
  applyPreference(value === 'granted' || value === 'denied' ? value : '');
}

function applyPreference(value: Preference) {
  preference = value;
  if (value !== 'granted') {
    activePath = '';
    if (ga) Reflect.set(window, 'ga-disable-' + ga, true);
  }
  notify();
  if (loaded && value !== 'granted') window.location.reload();
}

export function trackingPath() {
  return activePath;
}

const gtag: (...args: unknown[]) => void = function () {
  // Google reads queued gtag calls as arguments objects.
  // eslint-disable-next-line prefer-rest-params
  (window as AnalyticsWindow).dataLayer?.push(arguments);
};

const ecommerceEvents = new Set(['view_item', 'view_item_list', 'select_item']);
function send(name: string, fields: object = {}) {
  const location = { page_location: window.location.origin + activePath, page_referrer: '' };
  if (gtm) {
    const layer = (window as AnalyticsWindow).dataLayer!;
    if (ecommerceEvents.has(name)) layer.push({ ecommerce: null }, { event: name, ...location, ecommerce: fields });
    else layer.push({ event: name, ...location, ecommerce: null, ...fields });
  } else if (ga) {
    gtag('event', name, { ...location, ...fields });
  }
}

export function startTracking(path: string) {
  if (!analyticsConfigured || analyticsPreference() !== 'granted' || window.location.pathname !== path) return;
  if (!/^\/(?:products(?:\/(?:category\/)?[a-z0-9-]+)?|guides(?:\/[a-z0-9-]+)?|news(?:\/[a-z0-9-]+)?|about|contact|calculator|privacy|quote-terms|(?:thermal|cold|sound)-insulation)?$/.test(path)) return;

  if (lastView !== path) pageEvents.clear();
  activePath = path;
  if (!loaded) {
    loaded = true;
    const layer = ((window as AnalyticsWindow).dataLayer ??= []);
    const denied = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
    gtag('consent', 'default', { ...denied, analytics_storage: 'denied' });
    gtag('consent', 'update', { ...denied, analytics_storage: 'granted' });
    const script = document.createElement('script');
    script.async = true;
    script.referrerPolicy = 'no-referrer';
    if (gtm) {
      layer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      script.src = 'https://www.googletagmanager.com/gtm.js?id=' + gtm;
    } else if (ga) {
      Reflect.set(window, 'ga-disable-' + ga, false);
      gtag('js', new Date());
      gtag('config', ga, { send_page_view: false, ignore_referrer: true, page_referrer: '',
        page_location: window.location.origin + path, allow_google_signals: false, allow_ad_personalization_signals: false });
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ga;
    }
    document.head.appendChild(script);
  }
  if (lastView !== path) {
    lastView = path;
    send('page_view');
  }
  notify();
}

export function trackEvent<K extends keyof Events>(event: K, fields: Events[K], impressionKey?: string) {
  if (!activePath || activePath !== window.location.pathname || analyticsPreference() !== 'granted') return;
  if (impressionKey !== undefined) {
    const key = event + ':' + impressionKey;
    if (pageEvents.has(key)) return;
    pageEvents.add(key);
  }
  send(event, fields);
}

export function trackConfirmedInquiry(requestId: string, inquiry: Inquiry) {
  if (confirmations.has(requestId)) return;
  confirmations.add(requestId);
  trackEvent('inquiry_submitted', inquiry);
  if (inquiry.form_source === 'contact') trackEvent('contact_form_submitted', inquiry);
}

export function analyticsItem(product: { id: string; name: string; category: string }): Item {
  return { item_id: product.id, item_name: product.name, item_category: product.category };
}
