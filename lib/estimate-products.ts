export const estimateProfiles=[
  {id:'EL-R',name:'عایق الاستومری رولی',formats:['roll'],pipe:true},
  {id:'VN-1221',name:'پشم شیشه',formats:['roll','sheet'],pipe:true},
  {id:'VN-1220',name:'پشم سنگ',formats:['roll','sheet'],pipe:true},
  {id:'VN-1218',name:'فوم پلی‌اتیلن',formats:['roll'],pipe:true},
  {id:'VN-1219',name:'فویل آلومینیومی',formats:['roll'],pipe:false},
  {id:'VN-1216',name:'توری پلاستیکی و مرغی',formats:['roll'],pipe:false},
  {id:'VN-1213',name:'کارتن‌پلاست',formats:['sheet'],pipe:false},
  {id:'EPS-SHEET',name:'ورق یونولیت',formats:['sheet'],pipe:false},
] as const;
export function estimateProfile(id:string){
  const normalized=id.toUpperCase();
  const alias:Record<string,string>={'GW-F':'VN-1221','RW-S':'VN-1220','PE-R':'VN-1218'};
  return estimateProfiles.find(profile=>profile.id===(alias[normalized]||normalized));
}

export const accessoryProfiles = [
  {id:'PB-TWINE',name:'نخ پلاستیکی عایق‌بندی',kind:'cord'},
  {id:'PB-ROPE',name:'طناب پلاستیکی تابیده',kind:'cord'},
  {id:'RF-DRILL',name:'پیچ شیروانی سرمته‌ای واشردار',kind:'fastener'},
  {id:'RF-TIMBER',name:'پیچ شیروانی مخصوص چوب',kind:'fastener'},
  {id:'RF-PANEL',name:'پیچ بلند ساندویچ‌پانل',kind:'fastener'},
  {id:'EPS-ROOF',name:'یونولیت سقفی تیرچه و کرومیت',kind:'blocks'},
] as const;
export type AccessoryKind = typeof accessoryProfiles[number]['kind'];
export const calculatorProfiles = [...estimateProfiles.map(profile => ({...profile,kind:'surface' as const})), ...accessoryProfiles];
export function calculatorProfile(id:string) {
  const normalized = estimateProfile(id)?.id || id.toUpperCase();
  return calculatorProfiles.find(profile => profile.id === normalized);
}
