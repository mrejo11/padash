export const estimateProfiles=[
  {id:'EL-R',name:'عایق الاستومری رولی',formats:['roll'],pipe:true},
  {id:'VN-1221',name:'پشم شیشه',formats:['roll','sheet'],pipe:true},
  {id:'VN-1220',name:'پشم سنگ',formats:['roll','sheet'],pipe:true},
  {id:'VN-1218',name:'فوم پلی‌اتیلن',formats:['roll'],pipe:true},
  {id:'VN-1219',name:'فویل آلومینیومی',formats:['roll'],pipe:false},
  {id:'VN-1216',name:'توری پلاستیکی و مرغی',formats:['roll'],pipe:false},
  {id:'VN-1213',name:'کارتن‌پلاست',formats:['sheet'],pipe:false},
] as const;
export function estimateProfile(id:string){
  const normalized=id.toUpperCase();
  const alias:Record<string,string>={'GW-F':'VN-1221','RW-S':'VN-1220','PE-R':'VN-1218'};
  return estimateProfiles.find(profile=>profile.id===(alias[normalized]||normalized));
}
