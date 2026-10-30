import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import worker from '../telemetry/worker.mjs';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
function mockDB(){
 const rows=[];
 return {rows,prepare(query){
  let args=[];
  return {
   bind(...values){args=values;return this;},
   async run(){rows.push(args);return {success:true}},
   async first(){return {events:rows.length,sessions:1,completed:1}},
   async all(){return {results:[]}}
  };
 }};
}
const origin='https://barvolar.github.io';
const url='https://telemetry.example.workers.dev/ingest';
const event=(type='snapshot')=>({
 v:1,type,eventId:'test-event-'+type+'-001',sessionId:'test-session-123',
 build:'0.10.16-telemetry',
 data:{t:60,status:'playing',difficulty:2,level:10,kills:100,
  bossDamage:12000,device:{category:'phone',quality:'eco',widthBucket:400},
  perf:{count:30,avgFps:58,minFps:40,p95ms:24,slowFrames33:3}},
 details:type==='finish'?{result:{status:'win',score:1000,name:'PRIVATE'},
  totals:{killed:100},choices:[{id:'power',name:'SECRET',kind:'weapon'}],
  finalWeapons:[{id:'pulse',level:10,mods:{power:9}}],
  perfOverall:{averageFps:58,slowFrames33:7},
  perfTimeline:[{t:45,fps:48,enemies:120}],other:'DO_NOT_KEEP'}:undefined
});
test('worker returns an Origin-restricted CORS preflight',async()=>{
 const db=mockDB(),env={TELEMETRY:db,ADMIN_TOKEN:'a'.repeat(40)};
 const res=await worker.fetch(new Request(url,{method:'OPTIONS',headers:{Origin:origin}}),env);
 assert.equal(res.status,204);
 assert.equal(res.headers.get('access-control-allow-origin'),origin);
 const denied=await worker.fetch(new Request(url,{method:'OPTIONS',headers:{Origin:'https://attacker.test'}}),env);
 assert.equal(denied.status,403);
});
test('worker writes bounded anonymous snapshot and suppresses client PII fields',async()=>{
 const db=mockDB(),env={TELEMETRY:db,ADMIN_TOKEN:'a'.repeat(40)};
 const payload={...event(),ip:'192.0.2.1',userAgent:'PRIVATE','playerName':'PRIVATE'};
 const response=await worker.fetch(new Request(url,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','User-Agent':'PRIVATE'},body:JSON.stringify(payload)}),env);
 assert.equal(response.status,200);
 assert.equal(db.rows.length,1);
 assert.equal(db.rows[0][0],payload.eventId);
 assert.equal(db.rows[0][2],payload.sessionId);
 assert.equal(db.rows[0][3],'snapshot');
 assert.equal(db.rows[0][8],58);
 assert.equal(db.rows[0][13],null);
 const persisted=JSON.stringify(db.rows[0]);
 assert.ok(!persisted.includes('192.0.2.1'));
 assert.ok(!persisted.includes('PRIVATE'));
});
test('worker filters detailed reports, authenticates admin views, refuses malformed data',async()=>{
 const db=mockDB(),env={TELEMETRY:db,ADMIN_TOKEN:'a'.repeat(40)};
 const done=await worker.fetch(new Request(url,{method:'POST',headers:{Origin:origin},body:JSON.stringify(event('finish'))}),env);
 assert.equal(done.status,200);
 const details=JSON.parse(db.rows[0][13]);
 assert.equal(details.result.score,1000);
 assert.equal(details.perfOverall.averageFps,58);
 assert.equal(details.perfTimeline.length,1);
 assert.ok(!JSON.stringify(details).includes('PRIVATE'));
 assert.ok(!JSON.stringify(details).includes('SECRET'));
 assert.ok(!JSON.stringify(details).includes('DO_NOT_KEEP'));
 const unauth=await worker.fetch(new Request('https://telemetry.example.workers.dev/admin/events'),env);
 assert.equal(unauth.status,401);
 const auth=await worker.fetch(new Request('https://telemetry.example.workers.dev/admin/summary',{headers:{Authorization:'Bearer '+'a'.repeat(40)}}),env);
 assert.equal(auth.status,200);
 const invalid=await worker.fetch(new Request(url,{method:'POST',headers:{Origin:origin},body:'no-json'}),env);
 assert.equal(invalid.status,400);
});
test('player build has no FPS overlay, JSON download buttons or old export modules',()=>{
 const html=read('dist/index.html');
 const manifest=JSON.parse(read('src/module-order.json'));
 for(const name of ['perfOverlay','perfExport','balExport','perfReportText','balReportText','FPS ТЕСТ','СКАЧАТЬ ОТЧЁТ']){
  assert.ok(!html.includes(name),'Player interface still includes '+name);
 }
 for(const file of ['performance/download.js','balance/export.js','balance/panel.js']){
  assert.ok(manifest.every(x=>!x.endsWith(file)));
 }
 assert.ok(html.includes('renderQualityControls'),'Graphics quality control must remain');
 assert.ok(read('telemetry-client.js').includes('data-rs-consent'),'Consent UI is kept for online analytics');
 assert.ok(read('src/modules/60-analytics/balance/report.js').includes("report.result?.status==='in_progress'"),'Periodic snapshots must still be emitted');
});
