import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','dist');
const port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
http.createServer((req,res)=>{
const name=(new URL(req.url||'/','http://localhost')).pathname.replace(/^\/+/, '')||'index.html';
const file=path.resolve(root,name);
if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
fs.readFile(file,(err,data)=>{
if(err){res.writeHead(err.code==='ENOENT'?404:500).end('Not found');return;}
res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-cache'}).end(data);
});}).listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+port+'/'));
