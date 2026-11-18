import {storage} from './storage';
export async function storageAvailable(){
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{await Promise.race([storage().get('health/readiness',{type:'json'}),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Readiness timeout')),2500);})]);return true;}
  catch{return false;}finally{if(timer)clearTimeout(timer);}
}
