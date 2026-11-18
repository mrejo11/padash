import {adminConfigured,isAdmin} from '../../../../lib/admin-auth';
import {json} from '../../../../lib/http';
import {clientAddress,onNetlify,onVercel} from '../../../../lib/platform';
import {REQUEST_LIMITS} from '../../../../lib/request-limits';
import {storageAvailable} from '../../../../lib/service-status';
export const dynamic='force-dynamic';
export async function GET(request:Request){
  if(!adminConfigured())return json({code:'not_configured',error:'ورود مدیر هنوز فعال نشده است.'},503);
  if(!isAdmin(request))return json({code:'signin',error:'برای مشاهده وضعیت وارد شوید.'},401);
  const storage=await storageAvailable();
  let identity='unavailable';try{clientAddress(request);identity=onVercel()?'vercel':onNetlify()?'netlify':'local';}catch{}
  return json({checkedAt:new Date().toISOString(),storage:storage?'ok':'unavailable',platform:onVercel()?'vercel':onNetlify()?'netlify':'local',clientIdentification:identity,limits:{quotes:REQUEST_LIMITS.quotes.limit,quoteWindowHours:REQUEST_LIMITS.quotes.windowMs/3_600_000,login:REQUEST_LIMITS.login.limit,loginWindowMinutes:REQUEST_LIMITS.login.windowMs/60_000}});
}
