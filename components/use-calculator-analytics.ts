'use client';

import { useEffect, useState } from 'react';
import { trackEvent } from '../lib/analytics';
import { useTrackingPath } from './analytics-impression';

export default function useCalculatorAnalytics(productId: string, hasResult: boolean) {
  const activePath = useTrackingPath();
  const [changes, setChanges] = useState(0);

  useEffect(() => {
    if (!activePath || !changes || !hasResult) return;
    const timer = setTimeout(() => trackEvent('calculator_completed', { product_id: productId }, productId), 650);
    return () => clearTimeout(timer);
  }, [activePath, changes, hasResult, productId]);

  function recordChange() {
    if (!activePath) return;
    trackEvent('calculator_started', { product_id: productId }, productId);
    setChanges(count => count + 1);
  }

  return {
    onChangeCapture: recordChange,
    onClickCapture: (event: React.MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('[data-calculator-input]')) recordChange();
    },
  };
}
