import { analyticsConfigured } from '../lib/analytics';
import { isPreviewDeployment } from '../lib/site-config';
import AnalyticsControls from './analytics-controls';

export function AnalyticsPreferences() {
  return analyticsConfigured && !isPreviewDeployment() ? <AnalyticsControls/> : null;
}
