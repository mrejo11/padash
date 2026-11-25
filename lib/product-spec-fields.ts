import type { CatalogCategoryId } from './catalog';

type SpecificationField = { label: string; unitHint?: string };

export const specificationFields: Record<string, SpecificationField> = {
  productCode: { label: 'کد محصول سازنده' },
  material: { label: 'جنس' },
  density: { label: 'دانسیته', unitHint: 'kg/m³' },
  thickness: { label: 'ضخامت', unitHint: 'mm' },
  dimensions: { label: 'ابعاد', unitHint: 'mm / m' },
  conductivity: { label: 'ضریب هدایت حرارتی', unitHint: 'W/(m·K)' },
  temperature: { label: 'دمای کارکرد', unitHint: '°C' },
  fire: { label: 'رده واکنش در برابر آتش' },
  acoustic: { label: 'خواص صوتی', unitHint: 'dB' },
  absorption: { label: 'جذب آب', unitHint: '%' },
  packaging: { label: 'نوع بسته‌بندی' },
  applications: { label: 'کاربردهای اعلام‌شده' },
  facing: { label: 'نوع روکش' },
  meshOpening: { label: 'اندازه چشمه', unitHint: 'mm' },
  linearMass: { label: 'جرم خطی', unitHint: 'g/m' },
  diameter: { label: 'قطر', unitHint: 'mm' },
  drillCapacity: { label: 'ظرفیت سوراخ‌کاری', unitHint: 'mm' },
};

const common = ['productCode', 'material', 'dimensions', 'packaging', 'applications'];
const insulation = ['density', 'thickness', 'conductivity', 'temperature', 'fire', 'absorption'];
const categoryFields: Record<CatalogCategoryId, string[]> = {
  polymer: [...insulation, 'acoustic', 'facing'],
  elastomeric: [...insulation, 'diameter', 'facing'],
  rockwool: [...insulation, 'acoustic', 'diameter', 'facing'],
  glasswool: [...insulation, 'acoustic', 'diameter', 'facing'],
  eps: [...insulation, 'acoustic'],
  facing: ['thickness', 'temperature', 'facing', 'fire'],
  mesh: ['meshOpening', 'diameter', 'facing'],
  sheets: ['thickness', 'linearMass'],
  cord: ['diameter', 'linearMass'],
  fasteners: ['diameter', 'drillCapacity', 'facing'],
};

export const productFieldKeys = (category: string) => [...common, ...(categoryFields[category as CatalogCategoryId] ?? [])];
export const MAX_DATASHEET_BYTES = 2 * 1024 * 1024;

export type ProductSpecFields = {
  status: 'draft' | 'published';
  source: string;
  sourceUrl: string;
  manufacturer: string;
  model: string;
  values: Record<string, { value: string; unit: string }>;
};

export type ProductSpecForm = ProductSpecFields & {
  revision: number | null;
  hasDatasheet: boolean;
};

export const emptyProductSpecs: ProductSpecForm = {
  revision: null, status: 'draft', source: '', sourceUrl: '', manufacturer: '', model: '',
  values: {}, hasDatasheet: false,
};
