export type SurfaceGeometry =
  | { kind:'area'; area:number; layers:number }
  | { kind:'rectangle'; width:number; length:number; count:number; layers:number };
export type MaterialInput = {
  geometry:SurfaceGeometry; unitKind:'roll'|'sheet'; unitWidth:number; unitLength:number;
  extraArea:number; wastePercent:number; overlapWidthMm:number; overlapLengthMm:number; allowRotation:boolean;
};
export type MaterialPlan = {
  across:number; along:number; piecesPerUnit:number; baseUnits:number; extraUnits:number; totalUnits:number;
  rotated:boolean; cutArea:number; overlapAndTrimArea:number; uncutStockArea:number; reserveArea:number; purchaseArea:number; unusedArea:number;
};
export type MaterialEstimate = {
  netArea:number; extraArea:number; reserveArea:number; requiredArea:number; unitArea:number;
  areaUnits:number; purchaseArea:number; surplusArea:number; plan?:MaterialPlan;
};
const valid=(n:number,min:number,max:number)=>Number.isFinite(n)&&n>=min&&n<=max&&Math.abs(n*1000-Math.round(n*1000))<.00001;
const mm=(n:number)=>BigInt(Math.round(n*1000));
const sq=(n:number)=>BigInt(Math.round(n*1_000_000));
const ceil=(a:bigint,b:bigint)=>(a+b-BigInt(1))/b;
const area=(n:bigint)=>Number(n)/1_000_000;
const basis=BigInt(100000);

/** Exact integer millimetres. A cutting plan is a feasible layout, not global nesting optimisation. */
export function calculateMaterial(input:MaterialInput):MaterialEstimate {
  const {geometry:g,unitWidth,unitLength,extraArea,wastePercent,overlapWidthMm,overlapLengthMm}=input;
  if(!['roll','sheet'].includes(input.unitKind)||!valid(unitWidth,.001,10)||!valid(unitLength,.001,1000)
    ||!valid(extraArea,0,1_000_000)||!valid(wastePercent,0,50))throw new Error('ابعاد واقعی واحد خرید، مساحت افزوده و ذخیره را بررسی کنید؛ حداکثر سه رقم اعشار مجاز است.');
  if(!Number.isInteger(g.layers)||g.layers<1||g.layers>10)throw new Error('تعداد لایه باید عدد صحیح بین ۱ و ۱۰ باشد.');
  const w=mm(unitWidth),l=mm(unitLength),unit=w*l;
  if(!Number.isInteger(overlapWidthMm)||!Number.isInteger(overlapLengthMm)||overlapWidthMm<0||overlapLengthMm<0
    ||BigInt(overlapWidthMm)>=w||BigInt(overlapLengthMm)>=l)throw new Error('هم‌پوشانی باید میلی‌متر صحیح، نامنفی و کمتر از بُعد متناظر واحد خرید باشد.');
  let net:bigint;
  if(g.kind==='area'){
    if(!valid(g.area,.001,1_000_000))throw new Error('مساحت خالص باید مثبت و حداکثر یک میلیون مترمربع باشد.');
    if(overlapWidthMm||overlapLengthMm)throw new Error('برای محاسبه هم‌پوشانی، حالت سطح مستطیلی و ابعاد واقعی سطح را انتخاب کنید.');
    net=sq(g.area)*BigInt(g.layers);
  }else{
    if(!valid(g.width,.001,10_000)||!valid(g.length,.001,10_000)||!Number.isInteger(g.count)||g.count<1||g.count>100_000)
      throw new Error('ابعاد سطح و تعداد سطوح مستطیلی معتبر نیست.');
    net=mm(g.width)*mm(g.length)*BigInt(g.count)*BigInt(g.layers);
  }
  const extra=sq(extraArea),percent=BigInt(Math.round(wastePercent*1000));
  const required=(net+extra)*(basis+percent);
  if(required>BigInt(10000000)*BigInt(1000000)*basis)throw new Error('مساحت کل از محدوده محاسبه بیشتر است.');
  const areaUnits=Number(ceil(required,unit*basis));
  const result:MaterialEstimate={netArea:area(net),extraArea,reserveArea:Number((net+extra)*percent)/Number(basis)/1_000_000,
    requiredArea:Number(required)/Number(basis)/1_000_000,unitArea:area(unit),areaUnits,
    purchaseArea:area(BigInt(areaUnits)*unit),surplusArea:Number(BigInt(areaUnits)*unit*basis-required)/Number(basis)/1_000_000};
  if(g.kind==='rectangle'){
    const span=(target:bigint,size:bigint,overlap:bigint)=>target<=size?BigInt(1):BigInt(1)+ceil(target-size,size-overlap);
    function layout(rotated:boolean):MaterialPlan {
      if(g.kind!=='rectangle')throw new Error('Invalid geometry');
      const acrossTarget=mm(rotated?g.length:g.width),alongTarget=mm(rotated?g.width:g.length);
      const across=span(acrossTarget,w,BigInt(overlapWidthMm)),along=span(alongTarget,l,BigInt(overlapLengthMm));
      const surfaces=BigInt(g.count)*BigInt(g.layers);
      // Full-width strips can share a roll if the entire required length fits.
      // Longer surfaces and sheets use a full-unit grid, without reusing offcuts.
      const shortStrips=input.unitKind==='roll'&&along===BigInt(1);
      const piecesPerUnit=shortStrips?l/alongTarget:BigInt(1);
      const pieces=across*along*surfaces;
      const baseUnits=ceil(pieces,piecesPerUnit);
      const cut=shortStrips?pieces*w*alongTarget:baseUnits*unit;
      const reserve=(cut+extra)*percent;
      const uncutStock=baseUnits*unit-cut;
      const deficit=extra*basis+reserve-uncutStock*basis;
      const extraUnits=deficit>BigInt(0)?ceil(deficit,unit*basis):BigInt(0);
      const total=baseUnits+extraUnits;
      return {across:Number(across),along:Number(along),piecesPerUnit:Number(piecesPerUnit),baseUnits:Number(baseUnits),extraUnits:Number(extraUnits),totalUnits:Number(total),rotated,
        cutArea:area(cut),overlapAndTrimArea:area(cut-net),uncutStockArea:area(uncutStock),reserveArea:Number(reserve)/Number(basis)/1_000_000,
        purchaseArea:area(total*unit),unusedArea:Number(total*unit*basis-(cut+extra)*basis-reserve)/Number(basis)/1_000_000};
    }
    const first=layout(false),second=input.allowRotation?layout(true):undefined;
    result.plan=second&&(second.totalUnits<first.totalUnits||(second.totalUnits===first.totalUnits&&second.cutArea<first.cutArea))?second:first;
  }
  return result;
}
