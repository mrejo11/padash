import { storage } from '../../../lib/storage';
export const dynamic='force-dynamic';
export async function GET(){
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
    await Promise.race([
      storage().get('health/readiness',{type:'json'}),
      new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Readiness timeout')),2500);}),
    ]);
    return Response.json({status:'ok'},{headers:{'Cache-Control':'no-store'}});
  }
  catch{return Response.json({status:'unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
  finally{if(timer)clearTimeout(timer);}
}
