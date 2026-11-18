import {isIP} from 'node:net';
type RuntimeEnvironment=Record<string,string|undefined>;
export const onVercel=(env:RuntimeEnvironment=process.env)=>env.VERCEL==='1';
// Vercel takes precedence even when external Netlify storage credentials exist.
export const onNetlify=(env:RuntimeEnvironment=process.env)=>!onVercel(env)&&(Boolean(env.SITE_ID&&env.SITE_NAME)||env.NETLIFY==='true');
export const onManagedHost=()=>onVercel()||onNetlify();

export function clientAddress(request:Request,env:RuntimeEnvironment=process.env) {
  let address:string|null;
  if(onVercel(env))address=request.headers.get('x-vercel-forwarded-for')??request.headers.get('x-forwarded-for');
  else if(onNetlify(env))address=request.headers.get('x-nf-client-connection-ip');
  else if(env.PADASH_LOCAL_RUNTIME==='1'||env.NODE_ENV==='development')return 'local';
  else throw new Error('No trusted client address provider configured');
  const ip=address?.trim()||'';
  const version=isIP(ip);
  // Never put all production customers in a shared "unknown" quota, or trust
  // arbitrary forwarded headers on an unrecognised/self-hosted deployment.
  if(!version)throw new Error('Trusted client address is missing or invalid');
  if(version===4)return ip;
  const normalized=new URL('http://['+ip+']/').hostname.slice(1,-1);
  const mapped=normalized.match(/^::ffff:([\da-f]+):([\da-f]+)$/);
  if(mapped){const first=parseInt(mapped[1],16),last=parseInt(mapped[2],16);return [first>>8,first&255,last>>8,last&255].join('.');}
  return normalized;
}
