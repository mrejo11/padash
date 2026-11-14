'use client';

import Link from 'next/link';

import { useRef, useState } from 'react';
import { ArrowLeft, Info, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { normalizeDigits, products } from '../lib/catalog';
import { type AccessoryKind } from '../lib/estimate-products';
import { calculateCord, calculateFasteners, calculateRoofBlocks, type MeasuredRun, type PackageEstimate } from '../lib/accessory-estimate';
import EstimateInquiry from './estimate-inquiry';

const number = (value:string) => {
  const normalized = normalizeDigits(value.trim()).replace(/٫/g, '.');
  return /^(?:\d+(?:\.\d{0,3})?|\.\d{1,3})$/.test(normalized) ? Number(normalized) : NaN;
};
const format = (value:number) => new Intl.NumberFormat('fa-IR', { maximumFractionDigits:6 }).format(value);
const blank = { ties:'', tieLength:'', allowance:'0', extraLength:'0', coilLength:'', spacing:'', sheets:'', supports:'', screws:'', extraCount:'0', waste:'5', pack:'1', blockLength:'' };
type Values = typeof blank;
type Run = { id:number; length:string; count:string };

export default function AccessoryCalculator({kind,productId,onSelect}:{kind:AccessoryKind;productId:string;onSelect?:(id:string)=>void}) {
  const [values,setValues] = useState<Values>(blank);
  const [mode,setMode] = useState(kind==='cord'?'ties':'count');
  const [runs,setRuns] = useState<Run[]>([{id:0,length:'',count:'1'}]);
  const nextRun = useRef(1);
  const product = products.find(item=>item.id===productId)!;
  const measuredRuns:MeasuredRun[] = runs.map(run=>({length:number(run.length),count:number(run.count)}));
  const update = (key:keyof Values,value:string) => setValues(previous=>({...previous,[key]:value}));
  let cord:ReturnType<typeof calculateCord>|undefined, fasteners:PackageEstimate|undefined, blocks:ReturnType<typeof calculateRoofBlocks>|undefined, error='';
  try {
    if (kind==='cord') cord=calculateCord({
      geometry:mode==='ties'?{kind:'ties',ties:number(values.ties),tieLength:number(values.tieLength)}
        :mode==='spaced'?{kind:'spaced',runs:measuredRuns,spacing:number(values.spacing),tieLength:number(values.tieLength)}:{kind:'runs',runs:measuredRuns},
      allowance:number(values.allowance),extraLength:number(values.extraLength),coilLength:number(values.coilLength),wastePercent:number(values.waste),
    });
    else if (kind==='fastener') fasteners=calculateFasteners({
      geometry:mode==='count'?{kind:'count',sheets:number(values.sheets),supportsPerSheet:number(values.supports),screwsPerSupport:number(values.screws)}
        :{kind:'spacing',runs:measuredRuns,spacing:number(values.spacing),screwsPerPoint:number(values.screws)},
      extraCount:number(values.extraCount),wastePercent:number(values.waste),packSize:number(values.pack),
    });
    else blocks=calculateRoofBlocks({runs:measuredRuns,blockLength:number(values.blockLength),extraCount:number(values.extraCount),wastePercent:number(values.waste),packSize:number(values.pack)});
  } catch(value) { error=value instanceof Error?value.message:'اندازه‌ها را بررسی کنید.'; }

  function field(key:keyof Values,label:string,unit:string) {
    return <label>{label}<span>{unit}</span><input type="text" inputMode="decimal" dir="ltr" value={values[key]} maxLength={12} onChange={event=>update(key,event.target.value)}/></label>;
  }
  function loadExample() {
    setValues({...blank,ties:'100',tieLength:'0.6',allowance:'0.1',coilLength:'100',spacing:'0.5',sheets:'20',supports:'4',screws:'3',extraCount:kind==='fastener'?'12':'0',pack:kind==='fastener'?'100':'1',blockLength:'2'});
    setMode(kind==='cord'?'ties':'count');
    setRuns([{id:nextRun.current++,length:kind==='blocks'?'5.2':'10',count:kind==='blocks'?'12':'2'}]);
  }
  function reset() { setValues(blank); setRuns([{id:nextRun.current++,length:'',count:'1'}]); }
  const packageResult=fasteners||blocks;
  const result=cord||packageResult;
  const method = kind==='cord'?'طول مصرف و برش کلاف':kind==='fastener'?'شمارش اتصال و بسته‌بندی':'ردیف‌های خالص و برش بلوک سقفی';

  return <div className="accessory-estimator">
    <div className="estimator-method"><div><span>روش متره</span><h2>{method}</h2></div><div><button type="button" onClick={loadExample}>بارگذاری مثال</button><button type="button" onClick={reset} aria-label="پاک کردن اندازه‌های متره"><RotateCcw size={15}/></button></div></div>
    {kind!=='blocks'&&<div className={'roll-modes '+(kind==='fastener'?'two-modes':'')} role="group" aria-label="روش اندازه‌گیری">
      {(kind==='cord'?[['ties','بست‌های شمرده‌شده'],['spaced','بست با فاصله معلوم'],['runs','مسیرهای مستقیم']]:[['count','ورق و تکیه‌گاه'],['spacing','ردیف اتصال با فاصله معلوم']]).map(([id,label])=><button key={id} type="button" aria-pressed={mode===id} className={mode===id?'active':''} onClick={()=>setMode(id)}>{label}</button>)}
    </div>}

    {kind==='cord'&&<>
      {mode==='ties'&&<div className="calc-inputs">{field('ties','تعداد بست‌های مورد نیاز','عدد صحیح')}{field('tieLength','طول اندازه‌گیری‌شده هر بست، بدون گره','متر')}</div>}
      {mode!=='ties'&&<RunEditor runs={runs} onChange={setRuns} onAdd={()=>setRuns(previous=>[...previous,{id:nextRun.current++,length:'',count:'1'}])}/>}
      {mode==='spaced'&&<div className="calc-inputs">{field('spacing','حداکثر فاصله بست‌ها طبق جزئیات نصب','متر')}{field('tieLength','طول اندازه‌گیری‌شده هر بست، بدون گره','متر')}</div>}
      <div className="calc-inputs">{field('allowance',mode==='runs'?'اضافه کل گره و سربندی هر مسیر':'اضافه کل گره و سربندی هر بست','متر')}{field('coilLength','طول واقعی هر کلاف','متر')}{field('extraLength','طول افزوده برای مصارف جداگانه','متر')}{field('waste','ذخیره انتخابی','درصد؛ ۰ تا ۵۰')}</div>
      <p className="roll-note"><Info size={15}/>{mode==='spaced'?'در ابتدا و انتهای هر مسیر یک بست منظور می‌شود؛ تعداد فاصله‌ها رو به بالا گرد می‌شود. ':''}طول هر بست را دور عایق نصب‌شده اندازه بگیرید. اضافه گره را فقط یک بار، در فیلد جدا وارد کنید. طول کلاف از روی وزن قابل تعیین نیست.</p>
    </>}

    {kind==='fastener'&&<>
      {mode==='count'?<div className="calc-inputs">{field('sheets','تعداد ورق یا پانل','عدد صحیح')}{field('supports','تعداد تکیه‌گاه اتصال برای هر ورق','عدد صحیح')}{field('screws','پیچ هر ورق در هر تکیه‌گاه','عدد صحیح')}</div>:<>
        <RunEditor runs={runs} onChange={setRuns} onAdd={()=>setRuns(previous=>[...previous,{id:nextRun.current++,length:'',count:'1'}])}/>
        <div className="calc-inputs">{field('spacing','حداکثر فاصله اتصال‌ها طبق نقشه','متر')}{field('screws','تعداد پیچ در هر نقطه اتصال','عدد صحیح')}</div>
      </>}
      <div className="calc-inputs">{field('extraCount','پیچ افزوده درز، لبه و قطعات خاص','عدد صحیح؛ بدون موارد تکراری')}{field('pack','تعداد واقعی پیچ در هر بسته','عدد صحیح؛ فروش تکی = ۱')}{field('waste','ذخیره انتخابی','درصد؛ ۰ تا ۵۰')}</div>
      <p className="roll-note"><Info size={15}/>آرایش و فاصله پیچ‌ها را از نقشه اتصال یا دستور نصب همان سیستم وارد کنید؛ ابزار، ظرفیت اتصال یا فاصله مجاز سازه‌ای را طراحی نمی‌کند. هر اتصال را یک بار بشمارید. مدل‌های مختلف پیچ را جدا محاسبه کنید.{mode==='spacing'?' ابتدا و انتهای هر ردیف نیز اتصال دارند.':''}</p>
    </>}

    {kind==='blocks'&&<>
      <p className="roll-note">ردیف‌های هم‌طول را گروه‌بندی کنید. طول‌ها باید خالص باشند: تیرها، کلاف‌ها، نوارهای توپر و بازشوها جزو طول پرشونده نیستند. دو طرف هر بازشو را به‌صورت دو مسیر مستقل وارد کنید.</p>
      <RunEditor runs={runs} onChange={setRuns} onAdd={()=>setRuns(previous=>[...previous,{id:nextRun.current++,length:'',count:'1'}])}/>
      <div className="calc-inputs">{field('blockLength','طول مفید هر بلوک در جهت ردیف','متر')}{field('pack','تعداد بلوک در واحد خرید','عدد صحیح؛ فروش تکی = ۱')}{field('extraCount','بلوک افزوده برای قطعات خاص','عدد صحیح')}{field('waste','ذخیره انتخابی','درصد؛ ۰ تا ۵۰')}</div>
      <p className="roll-note"><Info size={15}/>عرض، ارتفاع و نشیمن بلوک را طبق نقشه با نوع تیرچه تطبیق دهید. تعداد با گردکردن جداگانه هر ردیف محاسبه می‌شود؛ برش انتهایی در ردیف دیگر دوباره مصرف نمی‌شود. برای چند نوع یا طول بلوک، متره جدا انجام دهید.</p>
    </>}

    <div aria-live="polite" aria-atomic="true">
      {cord&&<>
        <div className="calc-result"><div><span>{cord.cutPlan?'خرید طبق برنامه برش':'حداقل کلاف صرفاً از جمع طول'}</span><strong>{format(cord.cutPlan?.totalCoils??cord.minimumCoils)}<small>کلاف</small></strong></div><div><span>طول خرید</span><b>{format(cord.cutPlan?.purchasedLength??cord.purchasedLength)} متر</b></div></div>
        <dl className="roll-breakdown"><Result label="تعداد قطعات پایه" value={cord.pieces} unit="قطعه"/><Result label="مصرف پایه با گره و سربندی" value={cord.baseLength} unit="متر"/><Result label="طول افزوده" value={cord.extraLength} unit="متر"/><Result label="ذخیره طولی" value={cord.reserveLength} unit="متر"/><Result label="نیاز طولی با ذخیره" value={cord.requiredLength} unit="متر"/><Result label="حداقل کلاف بر مبنای جمع طول" value={cord.minimumCoils} unit="کلاف"/></dl>
        {cord.cutPlan?<div className="roll-cut-plan"><b>برنامه برش یک‌تکه: {format(cord.cutPlan.totalCoils)} کلاف</b><p>{format(cord.cutPlan.baseCoils)} کلاف برای قطعات پایه و {format(cord.cutPlan.extraCoils)} کلاف افزوده برای ذخیره و طول اضافی؛ {format(cord.cutPlan.reservePieces)} قطعه کامل ذخیره در برنامه منظور شده است.</p><p>هر بست یا مسیر باید از یک کلاف یک‌تکه دربیاید. قطعات هم‌اندازه از کلاف مشترک بریده می‌شوند؛ گروه‌های طول متفاوت جدا محاسبه شده‌اند. باقی‌مانده طولی برای مصرف افزودهٔ آزاد قابل استفاده فرض شده؛ اگر آن مصرف هم قطعات یک‌تکه می‌خواهد، آن را در گروه مسیرها وارد کنید. این برنامه بهینه‌سازی همه ترکیب‌های برش نیست.</p></div>:<p className="form-error" role="status">طول یک قطعه با اضافه گره از طول کلاف بیشتر است؛ برش یک‌تکه ممکن نیست. عدد بالا فقط حداقل طولی است و برنامه خرید اجرایی نیست.</p>}
        <p className="roll-formula" dir="ltr">Nlength = ceil[(Lbase + Lextra) × (1 + p/100) / Lcoil]</p>
      </>}
      {packageResult&&<>
        <div className="calc-result"><div><span>تعداد خرید با بسته‌بندی</span><strong>{format(packageResult.purchaseCount)}<small>{kind==='blocks'?'بلوک':'پیچ'}</small></strong></div><div><span>تعداد بسته / واحد خرید</span><b>{format(packageResult.packs)}</b></div></div>
        <dl className="roll-breakdown"><Result label="تعداد پایه از چیدمان" value={packageResult.baseCount} unit="عدد"/><Result label="تعداد افزوده" value={packageResult.extraCount} unit="عدد"/><Result label="ذخیره گرد‌شده به قطعه کامل" value={packageResult.reserveCount} unit="عدد"/><Result label="نیاز پیش از گردکردن بسته" value={packageResult.requiredCount} unit="عدد"/><Result label="مازاد بسته‌بندی" value={packageResult.surplusCount} unit="عدد"/></dl>
        <p className="roll-formula" dir="ltr">Nbuy = pack × ceil[ceil((Nbase + Nextra) × (1 + p/100)) / pack]</p>
      </>}
      {blocks&&<div className="roll-cut-plan"><b>ریز برش ردیف‌های سقف</b><ul className="estimator-row-results">{blocks.rows.map((row,index)=><li key={runs[index].id}>گروه {format(index+1)}: {format(row.count)} ردیف × {format(row.perRun)} بلوک = {format(row.total)} بلوک؛ طول قطعه آخر هر ردیف: {format(row.lastPieceLength)} متر.</li>)}</ul><p>طول خالص کل ردیف‌ها: {format(blocks.netLength)} متر؛ مجموع دورریز طولی انتهای ردیف‌ها، بدون استفاده دوباره: {format(blocks.offcutLength)} متر.</p></div>}
      {!result&&<p className="form-error" role="status">{error}</p>}
    </div>
    <p className="roll-note">دقت نتیجه تابع اندازه‌ها و جزئیات ورودی است. ۵٪ ذخیره یک مقدار قابل ویرایش است؛ برای مشاهده روش کار می‌توانید مثال را بارگذاری کنید.</p>
    <div className="roll-source-links"><Link href="/guides/construction-material-quantities">روش محاسبه و مثال‌های نخ، پیچ و یونولیت</Link></div>
    {onSelect?<button className="button button-dark" disabled={!result||(kind==='cord'&&!cord?.cutPlan)} onClick={()=>onSelect(productId)}>انتخاب {product.name}<ArrowLeft size={17}/></button>:<a href={'/products/'+productId.toLowerCase()} className="button button-dark">مشخصات و استعلام {product.name}<ArrowLeft size={17}/></a>}
    {!onSelect&&result&&(kind!=='cord'||cord?.cutPlan)&&<EstimateInquiry productId={productId}
      quantity={cord?.cutPlan?.totalCoils??packageResult?.purchaseCount??0}
      note={`برآورد اولیه ${product.name}؛ روش ${method}. ${kind==='cord'?`طول هر کلاف ${values.coilLength} متر، طول نیاز با ذخیره ${format(cord!.requiredLength)} متر`: `تعداد در بسته ${values.pack}؛ خرید ${format(packageResult!.purchaseCount)} عدد`}. ذخیره ${values.waste}٪. مشخصات نهایی و شرایط نصب باید تأیید شوند.`}/>}
  </div>;
}

function Result({label,value,unit}:{label:string;value:number;unit:string}) {
  return <div><dt>{label}</dt><dd>{format(value)} {unit}</dd></div>;
}
function RunEditor({runs,onChange,onAdd}:{runs:Run[];onChange:(runs:Run[])=>void;onAdd:()=>void}) {
  return <div className="estimator-runs"><div className="estimator-runs-heading"><b>مسیرها / ردیف‌های هم‌طول</b><span>هر گروه، طول و تعداد تکرار مستقل دارد</span></div>
    {runs.map((run,index)=><fieldset className="estimator-run" key={run.id}><legend>گروه {format(index+1)}</legend><div className="calc-inputs">
      <label>طول خالص هر مسیر<span>متر</span><input type="text" inputMode="decimal" dir="ltr" maxLength={12} value={run.length} onChange={event=>onChange(runs.map(item=>item.id===run.id?{...item,length:event.target.value}:item))}/></label>
      <label>تعداد مسیر هم‌طول<span>عدد صحیح</span><input type="text" inputMode="numeric" dir="ltr" maxLength={6} value={run.count} onChange={event=>onChange(runs.map(item=>item.id===run.id?{...item,count:event.target.value}:item))}/></label>
    </div><button className="estimator-run-remove" type="button" disabled={runs.length===1} onClick={()=>onChange(runs.filter(item=>item.id!==run.id))} aria-label={'حذف گروه '+format(index+1)}><Trash2 size={16}/></button></fieldset>)}
    <button className="text-button" type="button" onClick={onAdd} disabled={runs.length>=50}><Plus size={16}/>افزودن گروه مسیر</button>
  </div>;
}
