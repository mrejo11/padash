'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { analyticsItem, subscribeAnalytics, trackEvent, trackingPath } from '../lib/analytics';

export function useTrackingPath() {
  return useSyncExternalStore(subscribeAnalytics, trackingPath, () => '');
}

export function ProductImpression({ product }: { product: Parameters<typeof analyticsItem>[0] }) {
  const path = useTrackingPath();
  useEffect(() => {
    if (path) trackEvent('view_item', { items: [analyticsItem(product)] }, product.id);
  }, [path, product]);
  return null;
}
