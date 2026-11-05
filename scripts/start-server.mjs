import { spawn } from 'node:child_process';
import { resolve, isAbsolute } from 'node:path';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd(),false);
const mode=process.env.PADASH_STORAGE;
if(mode==='sqlite'){
  if(Number(process.versions.node.split('.')[0])<24)throw new Error('Production SQLite hosting requires Node.js 24 or newer');
  if(!isAbsolute(process.env.PADASH_DATABASE_PATH||'')||!process.env.PADASH_DATABASE_PATH.endsWith('.sqlite'))throw new Error('Set PADASH_DATABASE_PATH to a .sqlite file on the mounted persistent disk');
  if(process.env.PADASH_PERSISTENT_DISK!=='true')throw new Error('Mount the persistent disk, then set PADASH_PERSISTENT_DISK=true');
}else if(mode!=='netlify'&&!process.env.NETLIFY_BLOBS_CONTEXT&&!process.env.NETLIFY){
  throw new Error('Configure production storage. The local Blobs emulator is not started in production.');
}
if(!process.env.SALES_ADMIN_PASSWORD||process.env.SALES_ADMIN_PASSWORD.length<24)throw new Error('Set SALES_ADMIN_PASSWORD to at least 24 characters in the hosting secrets');
if(!process.env.PADASH_PUBLIC_ORIGIN)throw new Error('Set PADASH_PUBLIC_ORIGIN to the HTTPS address of this deployment');
const publicOrigin=new URL(process.env.PADASH_PUBLIC_ORIGIN);
if(publicOrigin.protocol!=='https:'||publicOrigin.origin!==process.env.PADASH_PUBLIC_ORIGIN||publicOrigin.username||publicOrigin.password)throw new Error('PADASH_PUBLIC_ORIGIN must be an HTTPS origin without a path');
const port=process.env.PORT||'3000';
if(!/^\d+$/.test(port)||Number(port)<1||Number(port)>65535)throw new Error('Invalid PORT');
const child=spawn(process.execPath,[resolve('node_modules/next/dist/bin/next'),'start','--hostname','0.0.0.0','--port',port],{stdio:'inherit',env:{...process.env,NODE_ENV:'production'}});
process.on('SIGINT',()=>child.kill('SIGINT'));
process.on('SIGTERM',()=>child.kill('SIGTERM'));
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
