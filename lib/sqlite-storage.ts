import { mkdirSync, chmodSync } from 'node:fs';
import { dirname, isAbsolute } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

const connections=new Map<string,DatabaseSync>();
type Conditions={onlyIfNew?:boolean;onlyIfMatch?:string};
type Row={body:string;etag:string};

/** Atomic, durable JSON records on a persistent local disk (one service replica). */
export class SqliteJsonStore {
  private database:DatabaseSync;
  private name:string;
  constructor(path:string,name:string){
    this.name=name;
    if(!isAbsolute(path)||!path.endsWith('.sqlite'))throw new Error('PADASH_DATABASE_PATH must be an absolute .sqlite path on a persistent disk');
    if(!/^[a-zA-Z0-9_-]{1,100}$/.test(name))throw new Error('Invalid storage namespace');
    const cached=connections.get(path);
    if(cached){this.database=cached;return;}
    mkdirSync(dirname(path),{recursive:true,mode:0o700});
    // Load SQLite only when selected; existing Netlify deployments keep their driver.
    const sqlite=process.getBuiltinModule('node:sqlite') as typeof import('node:sqlite')|undefined;
    if(!sqlite)throw new Error('SQLite requires Node.js 24 or newer');
    const {DatabaseSync:Database}=sqlite;
    const database=new Database(path);
    try{
      chmodSync(path,0o600);
      database.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;');
      database.exec('CREATE TABLE IF NOT EXISTS padash_records (store TEXT NOT NULL, blob_key TEXT NOT NULL, body TEXT NOT NULL, etag TEXT NOT NULL, PRIMARY KEY(store,blob_key)) STRICT');
    }catch(error){database.close();throw error;}
    connections.set(path,database);this.database=database;
  }
  private key(value:string){if(!value||value.length>1024)throw new Error('Invalid storage key');return value;}
  async get<T=unknown>(key:string,_options:{type:'json'}) :Promise<T|null>{
    const row=this.database.prepare('SELECT body FROM padash_records WHERE store=? AND blob_key=?').get(this.name,this.key(key)) as {body:string}|undefined;
    return row?JSON.parse(row.body) as T:null;
  }
  async getWithMetadata<T=unknown>(key:string,_options:{type:'json'}){
    const row=this.database.prepare('SELECT body,etag FROM padash_records WHERE store=? AND blob_key=?').get(this.name,this.key(key)) as Row|undefined;
    return row?{data:JSON.parse(row.body) as T,etag:row.etag,metadata:{}}:null;
  }
  async list(options:{prefix?:string}={}){
    const prefix=options.prefix||'';
    const rows=this.database.prepare('SELECT blob_key,etag FROM padash_records WHERE store=? AND substr(blob_key,1,?)=? ORDER BY blob_key').all(this.name,prefix.length,prefix) as {blob_key:string;etag:string}[];
    return {blobs:rows.map(row=>({key:row.blob_key,etag:row.etag})),directories:[]};
  }
  async setJSON(key:string,value:unknown,conditions:Conditions={}){
    this.key(key);
    if(conditions.onlyIfNew&&conditions.onlyIfMatch)throw new Error('Conflicting write conditions');
    if(conditions.onlyIfMatch!==undefined&&!conditions.onlyIfMatch)throw new Error('A nonempty storage version is required');
    const body=JSON.stringify(value);if(body===undefined)throw new Error('JSON value required');
    const etag=randomUUID();
    const result=conditions.onlyIfNew
      ?this.database.prepare('INSERT INTO padash_records(store,blob_key,body,etag) VALUES(?,?,?,?) ON CONFLICT(store,blob_key) DO NOTHING').run(this.name,key,body,etag)
      :conditions.onlyIfMatch
        ?this.database.prepare('UPDATE padash_records SET body=?,etag=? WHERE store=? AND blob_key=? AND etag=?').run(body,etag,this.name,key,conditions.onlyIfMatch)
        :this.database.prepare('INSERT INTO padash_records(store,blob_key,body,etag) VALUES(?,?,?,?) ON CONFLICT(store,blob_key) DO UPDATE SET body=excluded.body,etag=excluded.etag').run(this.name,key,body,etag);
    return result.changes?{modified:true,etag}:{modified:false};
  }
}
