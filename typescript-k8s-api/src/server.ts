/** Small HTTP adapter; binds only to localhost. Not production-ready. */
import {createServer, type IncomingMessage, type ServerResponse} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';
import {analyzeSnapshot, type Snapshot} from './analyzer.js';
const fixture = resolve(dirname(fileURLToPath(import.meta.url)), '../../fixtures/incident.json');
function respond(res:ServerResponse, status:number, body:unknown):void {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(JSON.stringify(body));
}
function validSnapshot(x:unknown): x is Snapshot {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return false;
  const value=x as Record<string,unknown>;
  for(const key of ['pods','events']) {
    if(value[key] === undefined) continue;
    const section=value[key];
    if(!section || typeof section !== 'object' || Array.isArray(section)) return false;
    const items=(section as Record<string,unknown>).items;
    if(items !== undefined && (!Array.isArray(items) || items.length>1000 ||
      items.some(item=>!item || typeof item!=='object' || Array.isArray(item)))) return false;
  }
  return true;
}
async function readBody(req:IncomingMessage):Promise<unknown> {
  let body='';
  for await (const chunk of req) {
    body += chunk.toString('utf8');
    if(Buffer.byteLength(body)>131072) throw new Error('Request body too large');
  }
  return JSON.parse(body);
}
export function makeServer() {
  return createServer(async(req,res)=>{
    try {
      const url=new URL(req.url ?? '/', 'http://localhost');
      if(req.method==='GET' && url.pathname==='/health')
        return respond(res,200,{status:'ok',service:'typescript-k8s-incident-api'});
      if(req.method==='GET' && url.pathname==='/api/incidents/sample') {
        const snapshot=JSON.parse(await readFile(fixture,'utf8')) as Snapshot;
        return respond(res,200,analyzeSnapshot(snapshot));
      }
      if(req.method==='POST' && url.pathname==='/api/incidents/analyze') {
        if(!(req.headers['content-type'] ?? '').startsWith('application/json'))
          return respond(res,415,{error:'Expected application/json'});
        const data=await readBody(req);
        if(!validSnapshot(data)) return respond(res,400,{error:'Invalid snapshot'});
        return respond(res,200,analyzeSnapshot(data));
      }
      return respond(res,404,{error:'Not found'});
    } catch(e) {
      return respond(res,400,{error:e instanceof Error ? e.message : 'Bad request'});
    }
  });
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const port=Number(process.env.PORT ?? 3000);
  if(!Number.isInteger(port)||port<1||port>65535) throw new Error('Invalid PORT');
  makeServer().listen(port,'127.0.0.1',()=>console.log('Listening at http://127.0.0.1:'+port));
}
