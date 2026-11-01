'use client';

import { useState } from 'react';
import { ArrowLeft, Calculator, Info, Ruler } from 'lucide-react';
import { normalizeDigits } from '../lib/catalog';
import { calculateRolls, type RollGeometry } from '../lib/roll-estimate';

const number = (value: string) => {
  const normalized = normalizeDigits(value.trim()).replace(/٫/g, '.');
  return /^(?:\d+(?:\.\d{0,3})?|\.\d{1,3})$/.test(normalized) ? Number(normalized) : NaN;
};
const format = (value: number) => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 3 }).format(value);

export default function RollCalculator({ onSelect }: { onSelect?: () => void }) {
  const [mode, setMode] = useState<RollGeometry['kind']>('area');
  const [values, setValues] = useState({ area: '120', surfaceWidth: '3', surfaceLength: '8', count: '1', layers: '1',
    wrapLength: '0.65', pipeLength: '20', rollWidth: '1', rollLength: '10', extraArea: '0', waste: '10' });
  const [preset, setPreset] = useState('custom');
  const update = (key: keyof typeof values, value: string) => setValues(previous => ({ ...previous, [key]: value }));
  const geometry: RollGeometry = mode === 'area' ? { kind: mode, area: number(values.area), layers: number(values.layers) }
    : mode === 'rectangle' ? { kind: mode, width: number(values.surfaceWidth), length: number(values.surfaceLength), count: number(values.count), layers: number(values.layers) }
      : { kind: mode, wrapLength: number(values.wrapLength), pipeLength: number(values.pipeLength) };
  let result: ReturnType<typeof calculateRolls> | undefined;
  let error = '';
  try { result = calculateRolls({ geometry, rollWidth: number(values.rollWidth), rollLength: number(values.rollLength), extraArea: number(values.extraArea), wastePercent: number(values.waste) }); }
  catch (value) { error = value instanceof Error ? value.message : 'ورودی‌ها را بررسی کنید.'; }
  function field(key: keyof typeof values, label: string, unit: string) {
    return <label>{label}<span>{unit}</span><input type="text" inputMode="decimal" dir="ltr" value={values[key]} maxLength={12}
      onChange={event => { update(key, event.target.value); if (key === 'rollWidth' || key === 'rollLength') setPreset('custom'); }}/></label>;
  }
  return <div className="calculator roll-calculator">
    <div className="calculator-top"><span><Calculator size={20}/>محاسبه مقدار عایق رولی</span><span className="mini-label">متره و برآورد خرید</span></div>
    <div className="roll-modes" role="group" aria-label="روش اندازه‌گیری">{[
      ['area', 'مساحت آماده'], ['rectangle', 'سطح مستطیلی'], ['pipe', 'دورپیچ لوله'],
    ].map(([key, label]) => <button type="button" key={key} aria-pressed={mode === key} className={mode === key ? 'active' : ''} onClick={() => setMode(key as RollGeometry['kind'])}>{label}</button>)}</div>
    <div className="calc-inputs">
      {mode === 'area' && field('area', 'مساحت خالص پس از کسر بازشوها', 'مترمربع')}
      {mode === 'rectangle' && <>{field('surfaceWidth', 'عرض هر سطح', 'متر')}{field('surfaceLength', 'طول هر سطح', 'متر')}{field('count', 'تعداد سطح یکسان', 'عدد صحیح')}</>}
      {mode !== 'pipe' && field('layers', 'تعداد لایه روی سطح تخت', 'عدد صحیح')}
      {mode === 'pipe' && <>{field('wrapLength', 'طول نوارِ دورپیچ اندازه‌گیری‌شده', 'متر')}{field('pipeLength', 'طول مستقیم مسیر لوله', 'متر')}</>}
    </div>
    {mode === 'pipe' && <p className="roll-note"><Ruler size={15}/>دورپیچ را با نوار عایقِ هم‌ضخامت و بدون کشیدن اندازه بگیرید؛ قطر اسمی لوله کافی نیست. هر لایه را جدا محاسبه کنید.</p>}
    <label className="roll-preset">ابعاد واقعی رول منتخب<select value={preset} onChange={event => {
      setPreset(event.target.value);
      if (event.target.value !== 'custom') setValues(previous => ({ ...previous, rollWidth: '1', rollLength: event.target.value === 'af13' ? '8' : '6' }));
    }}><option value="custom">ابعاد دستی از برچسب یا دیتاشیت</option><option value="af13">نمونه کاتالوگ AF-13MM/E · ۱ × ۸ متر</option><option value="af19">نمونه کاتالوگ AF-19MM/E · ۱ × ۶ متر</option></select></label>
    <div className="calc-inputs">{field('rollWidth', 'عرض رول', 'متر')}{field('rollLength', 'طول رول', 'متر')}
      {field('extraArea', 'مساحت افزودهٔ کل اتصالات و قطعات خاص', 'مترمربع')}{field('waste', 'ذخیره / پرت انتخابی', 'درصد؛ ۰ تا ۵۰')}</div>
    <p className="roll-note">ابعاد اولیه و ۱۰٪ ذخیره، مثال قابل ویرایش‌اند؛ مقدار پرت استاندارد ثابت نیست. نمونه کاتالوگ، اعلام موجودی یا برند قابل تأمین نیست.</p>
    <div aria-live="polite" aria-atomic="true">
      {result ? <><div className="calc-result"><div><span>حداقل رول بر مبنای مساحت</span><strong>{format(result.areaRolls)}<small>رول</small></strong></div><div><span>مساحت هر رول</span><b>{format(result.rollArea)} مترمربع</b></div></div>
        <dl className="roll-breakdown"><div><dt>سطح خالص با تعداد لایه</dt><dd>{format(result.netArea)} م²</dd></div><div><dt>مساحت افزوده</dt><dd>{format(result.extraArea)} م²</dd></div>
          <div><dt>ذخیره انتخابی</dt><dd>{format(result.reserveArea)} م²</dd></div><div><dt>کل نیاز با ذخیره</dt><dd>{format(result.requiredArea)} م²</dd></div>
          <div><dt>مساحت خریدِ حداقل رول</dt><dd>{format(result.purchaseArea)} م²</dd></div><div><dt>مازاد ناشی از گردکردن رول</dt><dd>{format(result.surplusArea)} م²</dd></div></dl>
        {result.pipePlan && <div className="roll-cut-plan">{result.pipePlan.possible ? <><b>برش یک‌تکه دورپیچ: {format(result.pipePlan.totalRolls)} رول با ذخیرهٔ جدا</b><p>{format(result.pipePlan.segments)} قطعه در امتداد لوله؛ {format(result.pipePlan.piecesPerRoll)} دورپیچ کامل در طول هر رول؛ {format(result.pipePlan.baseRolls)} رول پایه + {format(result.pipePlan.reserveRolls)} رول برای مساحت افزوده و ذخیره. استفاده مجدد از دورریزها در این برنامه فرض نشده است.</p></> : <p>دورپیچ از طول رول بیشتر است؛ برش یک‌تکه ممکن نیست و طرح اتصال چندتکه باید جدا بررسی شود.</p>}</div>}
        <p className="roll-formula" dir="ltr">N = ceil[((A + Aextra) × (1 + p/100)) / (Wroll × Lroll)]</p>
      </> : <p className="form-error" role="status">{error}</p>}
    </div>
    <p className="roll-note"><Info size={15}/>حداقل مساحتی، تضمین چیدمان برش نیست. زانو، شیر، سه‌راهی، هم‌پوشانی موردنیاز روکش و محدودیت‌های نصب باید در متره لحاظ شوند. این ابزار ضخامت حرارتی مناسب را تعیین نمی‌کند.</p>
    <div className="roll-source-links"><a href="/guides/roll-insulation-quantity">روش محاسبه و مثال حل‌شده</a><a href="https://www.armacell.com/en-GB/armaflex-application-manual" target="_blank" rel="noreferrer">راهنمای نصب Armacell</a><a href="https://www.armacell.com/en-LV/af-armaflex-product-brochure" target="_blank" rel="noreferrer">منبع نمونه ابعاد رول</a></div>
    {onSelect ? <button className="button button-dark" disabled={!result} onClick={onSelect}>انتخاب محصول برای پروژه<ArrowLeft size={17}/></button> : <a href="/#catalog" className="button button-dark">انتخاب محصول از کاتالوگ<ArrowLeft size={17}/></a>}
  </div>;
}
