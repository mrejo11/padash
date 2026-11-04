'use client';

import { useState } from 'react';
import { ArrowLeft, Calculator, Info, Ruler } from 'lucide-react';
import { normalizeDigits } from '../lib/catalog';
import { calculateRolls, type RollGeometry } from '../lib/roll-estimate';
import { calculateMaterial, type MaterialEstimate } from '../lib/material-estimate';
import { estimateProfiles, estimateProfile } from '../lib/estimate-products';

const number=(value:string)=>{
  const normalized=normalizeDigits(value.trim()).replace(/٫/g,'.');
  return /^(?:\d+(?:\.\d{0,3})?|\.\d{1,3})$/.test(normalized)?Number(normalized):NaN;
};
const format=(value:number)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:6}).format(value);

export default function RollCalculator({onSelect,initialProductId='EL-R'}:{onSelect?:(id:string)=>void;initialProductId?:string}){
  const initial=estimateProfile(initialProductId)||estimateProfiles[0];
  const [productId,setProductId]=useState<string>(initial.id),[unitKind,setUnitKind]=useState<'roll'|'sheet'>(initialProductId.toUpperCase()==='RW-S'?'sheet':initial.formats[0]);
  const [mode,setMode]=useState<RollGeometry['kind']>('area'),[allowRotation,setAllowRotation]=useState(false);
  const [values,setValues]=useState({area:'120',surfaceWidth:'3',surfaceLength:'8',count:'1',layers:'1',wrapLength:'0.65',pipeLength:'20',
    rollWidth:initial.id==='EL-R'?'1':'',rollLength:initial.id==='EL-R'?'10':'',extraArea:'0',waste:'10',overlapWidth:'0',overlapLength:'0'});
  const [preset,setPreset]=useState('custom');
  const profile=estimateProfile(productId)!;
  const unit=unitKind==='roll'?'رول':'ورق';
  const pipeAllowed=profile.pipe&&unitKind==='roll';
  const update=(key:keyof typeof values,value:string)=>setValues(previous=>({...previous,[key]:value}));
  const geometry:RollGeometry=mode==='area'?{kind:mode,area:number(values.area),layers:number(values.layers)}
    :mode==='rectangle'?{kind:mode,width:number(values.surfaceWidth),length:number(values.surfaceLength),count:number(values.count),layers:number(values.layers)}
      :{kind:mode,wrapLength:number(values.wrapLength),pipeLength:number(values.pipeLength)};
  let result:MaterialEstimate|undefined,pipe:ReturnType<typeof calculateRolls>['pipePlan'],error='';
  try{
    if(geometry.kind==='pipe'){
      if(!pipeAllowed)throw new Error('برای این شکل عرضه، اندازه‌گیری سطح را انتخاب کنید.');
      const estimate=calculateRolls({geometry,rollWidth:number(values.rollWidth),rollLength:number(values.rollLength),extraArea:number(values.extraArea),wastePercent:number(values.waste)});
      result={...estimate,unitArea:estimate.rollArea,areaUnits:estimate.areaRolls};pipe=estimate.pipePlan;
    }else result=calculateMaterial({geometry,unitKind,unitWidth:number(values.rollWidth),unitLength:number(values.rollLength),
      extraArea:number(values.extraArea),wastePercent:number(values.waste),overlapWidthMm:mode==='rectangle'?number(values.overlapWidth):0,
      overlapLengthMm:mode==='rectangle'?number(values.overlapLength):0,allowRotation});
  }catch(value){error=value instanceof Error?value.message:'ورودی‌ها را بررسی کنید.';}
  function field(key:keyof typeof values,label:string,unitLabel:string){return <label>{label}<span>{unitLabel}</span><input type="text" inputMode="decimal" dir="ltr" value={values[key]} maxLength={12}
    onChange={event=>{update(key,event.target.value);if(key==='rollWidth'||key==='rollLength')setPreset('custom');}}/></label>;}
  return <div className="calculator roll-calculator">
    <div className="calculator-top"><span><Calculator size={20}/>محاسبه مقدار عایق و ملزومات</span><span className="mini-label">متره و برآورد خرید</span></div>
    <div className="material-selectors"><label className="roll-preset">محصول مورد محاسبه<select value={productId} onChange={event=>{
      const next=estimateProfile(event.target.value)!;setProductId(next.id);setUnitKind(next.formats[0]);setPreset('custom');setMode('area');setAllowRotation(false);
      setValues(previous=>({...previous,rollWidth:'',rollLength:'',overlapWidth:'0',overlapLength:'0'}));
    }}>{estimateProfiles.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
    <label className="roll-preset">شکل عرضه<select value={unitKind} onChange={event=>{const next=event.target.value as 'roll'|'sheet';setUnitKind(next);if(next==='sheet'&&mode==='pipe')setMode('rectangle');setPreset('custom');setValues(previous=>({...previous,rollWidth:'',rollLength:''}));}}>{profile.formats.map(kind=><option value={kind} key={kind}>{kind==='roll'?'رول':'ورق / تخته'}</option>)}</select></label></div>
    <div className={'roll-modes '+(!pipeAllowed?'two-modes':'')} role="group" aria-label="روش اندازه‌گیری">{[
      ['area','مساحت آماده'],['rectangle','سطح و برنامه برش'],...(pipeAllowed?[['pipe','دورپیچ لوله']]:[]),
    ].map(([key,label])=><button type="button" key={key} aria-pressed={mode===key} className={mode===key?'active':''} onClick={()=>setMode(key as RollGeometry['kind'])}>{label}</button>)}</div>
    <div className="calc-inputs">
      {mode==='area'&&field('area','مساحت خالص پس از کسر بازشوها','مترمربع')}
      {mode==='rectangle'&&<>{field('surfaceWidth','عرض هر سطح / ارتفاع حصار','متر')}{field('surfaceLength','طول هر سطح / مسیر حصار','متر')}{field('count','تعداد سطح یکسان','عدد صحیح')}</>}
      {mode!=='pipe'&&field('layers','تعداد لایه روی سطح','عدد صحیح')}
      {mode==='pipe'&&<>{field('wrapLength','طول نوارِ دورپیچ اندازه‌گیری‌شده','متر')}{field('pipeLength','طول مستقیم مسیر لوله','متر')}</>}
    </div>
    {mode==='pipe'&&<p className="roll-note"><Ruler size={15}/>دورپیچ را با نوار هم‌ضخامت و بدون کشیدن اندازه بگیرید؛ قطر اسمی کافی نیست. هر لایه جدا محاسبه می‌شود. این برنامه برای اتصال لب‌به‌لب در امتداد لوله است.</p>}
    {productId==='EL-R'&&unitKind==='roll'&&<label className="roll-preset">نمونه ابعاد از کاتالوگ سازنده<select value={preset} onChange={event=>{
      setPreset(event.target.value);if(event.target.value!=='custom')setValues(previous=>({...previous,rollWidth:'1',rollLength:event.target.value==='af13'?'8':'6'}));
    }}><option value="custom">ابعاد دستی از برچسب یا دیتاشیت</option><option value="af13">نمونه AF-13MM/E · ۱ × ۸ متر</option><option value="af19">نمونه AF-19MM/E · ۱ × ۶ متر</option></select></label>}
    <div className="calc-inputs">{field('rollWidth','عرض واقعی '+unit,'متر')}{field('rollLength','طول واقعی '+unit,'متر')}
      {field('extraArea','مساحت افزودهٔ کل اتصالات و قطعات خاص','مترمربع')}{field('waste','ذخیره / پرت انتخابی','درصد؛ ۰ تا ۵۰')}</div>
    {mode==='rectangle'&&<div className="material-layout-settings"><div className="calc-inputs">{field('overlapWidth','هم‌پوشانی در جهت عرض '+unit,'میلی‌متر صحیح')}{field('overlapLength','هم‌پوشانی در جهت طول '+unit,'میلی‌متر صحیح')}</div>
      <label className="material-rotation"><input type="checkbox" checked={allowRotation} onChange={event=>setAllowRotation(event.target.checked)}/>مقایسه دو جهت نصب با چرخش ۹۰ درجه مجاز است</label>
      <p className="roll-note">هم‌پوشانی را از جزئیات اجرایی مدل منتخب وارد کنید؛ صفر به معنی اتصال بدون هم‌پوشانی است. جهت الیاف، شیار ورق و روکش می‌تواند چرخش را محدود کند.</p></div>}
    <p className="roll-note">ابعاد را از برچسب همان ضخامت و مدل وارد کنید. اعداد سطح و ۱۰٪ ذخیره، مثال قابل ویرایش‌اند؛ درصد پرت ثابت و همگانی نیست.</p>
    <div aria-live="polite" aria-atomic="true">{result?<>
      <div className="calc-result"><div><span>حداقل {unit} بر مبنای مساحت</span><strong>{format(result.areaUnits)}<small>{unit}</small></strong></div><div><span>مساحت هر {unit}</span><b>{format(result.unitArea)} مترمربع</b></div></div>
      <dl className="roll-breakdown"><div><dt>سطح خالص با تعداد لایه</dt><dd>{format(result.netArea)} م²</dd></div><div><dt>مساحت افزوده</dt><dd>{format(result.extraArea)} م²</dd></div><div><dt>ذخیره در حداقل مساحتی</dt><dd>{format(result.reserveArea)} م²</dd></div><div><dt>کل نیاز مساحتی با ذخیره</dt><dd>{format(result.requiredArea)} م²</dd></div><div><dt>خرید بر مبنای حداقل مساحتی</dt><dd>{format(result.purchaseArea)} م²</dd></div><div><dt>مازاد گردکردن حداقل مساحتی</dt><dd>{format(result.surplusArea)} م²</dd></div></dl>
      {result.plan&&<div className="roll-cut-plan"><b>برنامه پوشش و برش: {format(result.plan.totalUnits)} {unit}</b>
        <p>{format(result.plan.across)} ردیف در عرض و {format(result.plan.along)} قطعه در طول هر سطح؛ {result.plan.rotated?'با چرخش ۹۰ درجه نسبت به سطح':'در جهت واردشدهٔ سطح'}. {format(result.plan.baseUnits)} {unit} پایه + {format(result.plan.extraUnits)} {unit} برای مساحت افزوده و ذخیره.</p>
        {unitKind==='roll'&&result.plan.piecesPerUnit>1&&<p>از هر رول {format(result.plan.piecesPerUnit)} نوار کامل به طول سطح برش می‌خورد.</p>}
        <dl className="roll-breakdown"><div><dt>مصرف برش با هم‌پوشانی و لبه‌ها</dt><dd>{format(result.plan.cutArea)} م²</dd></div><div><dt>افزایش مصرف نسبت به سطح خالص</dt><dd>{format(result.plan.overlapAndTrimArea)} م²</dd></div><div><dt>ذخیره بر مبنای مصرف برش + افزوده</dt><dd>{format(result.plan.reserveArea)} م²</dd></div><div><dt>مساحت خرید این برنامه</dt><dd>{format(result.plan.purchaseArea)} م²</dd></div></dl>
        <p>در رول، نوارهای کامل از یک رول مشترک برش می‌خورند. بخش برش‌نخوردهٔ رول ({format(result.plan.uncutStockArea)} م²) ابتدا برای ذخیره و مساحت افزوده منظور می‌شود؛ کمبود به واحد کامل گرد می‌شود. در ورق یا سطح بلندتر از رول، شبکهٔ واحدهای کامل با برش لبه فرض شده و دورریزها دوباره مصرف نمی‌شوند. شکل قطعات خاص باید جدا بررسی شود؛ این برنامه بهینه‌سازی همهٔ ترکیب‌های برش نیست.</p></div>}
      {pipe&&<div className="roll-cut-plan">{pipe.possible?<><b>برش یک‌تکه دورپیچ: {format(pipe.totalRolls)} رول</b><p>{format(pipe.segments)} قطعه در امتداد لوله؛ {format(pipe.piecesPerRoll)} دورپیچ در هر رول؛ {format(pipe.baseRolls)} رول پایه + {format(pipe.reserveRolls)} رول برای مساحت افزوده و ذخیره. دورریزها دوباره مصرف نمی‌شوند.</p></>:<p>دورپیچ از طول رول بیشتر است؛ برش یک‌تکه ممکن نیست و اتصال چندتکه باید جدا بررسی شود.</p>}</div>}
      <p className="roll-formula" dir="ltr">Nmin = ceil[((A + Aextra) × (1 + p/100)) / (W × L)]</p>
    </>:<p className="form-error" role="status">{error}</p>}</div>
    <p className="roll-note"><Info size={15}/>{mode==='area'?'برای لحاظ‌کردن هم‌پوشانی و محدودیت برش، حالت «سطح و برنامه برش» را انتخاب کنید. ':''}دقت محاسبه تابع اندازه‌های واردشده است. این ابزار ضخامت حرارتی، مقاومت حریق یا تعداد مقاطع لوله‌ای کارخانه‌ای را تعیین نمی‌کند.</p>
    <div className="roll-source-links"><a href="/guides/roll-insulation-quantity">روش محاسبه، مثال‌ها و منابع</a>{productId==='EL-R'&&<a href="https://www.armacell.com/en-LV/af-armaflex-product-brochure" target="_blank" rel="noreferrer">منبع نمونه ابعاد رول</a>}</div>
    {onSelect?<button className="button button-dark" disabled={!result} onClick={()=>onSelect(productId)}>انتخاب {profile.name}<ArrowLeft size={17}/></button>:<a href={'/products/'+productId.toLowerCase()} className="button button-dark">مشخصات و استعلام {profile.name}<ArrowLeft size={17}/></a>}
  </div>;
}
