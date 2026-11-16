import { cache } from 'react';
import { listPublishedNews, type PublicNews } from './news';

type NewsSnapshot = {items: PublicNews[]; unavailable: boolean};
// Request-local deduplication, not a cross-request cache: publication stays immediate.
export const publicNewsSnapshot = cache(async (): Promise<NewsSnapshot> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      listPublishedNews().then(items => ({items, unavailable: false})),
      new Promise<NewsSnapshot>(resolve => {timer = setTimeout(() => resolve({items: [], unavailable: true}), 2500);}),
    ]);
  } catch { return {items: [], unavailable: true}; }
  finally { if (timer) clearTimeout(timer); }
});
