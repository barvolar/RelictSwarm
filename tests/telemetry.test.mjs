import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
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


test('browser client sends only after consent and does not expose personal fields',async()=>{
 const sent=[];
 const storage=new Map([['relict_swarm_analytics_consent_v1','yes']]);
 const listeners={};
 const client={
  window:{RELIC_TELEMETRY_CONFIG:{endpoint:'https://telemetry.example.workers.dev/ingest'}},
  document:{readyState:'loading',addEventListener(name,fn){listeners[name]=fn;}},
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
  navigator:{onLine:true},
  innerWidth:420,Date,Math,JSON,Number,
  crypto:{randomUUID:()=> '12345678-abcd-abcd-abcd-123456789012'},
  addEventListener(name,fn){listeners[name]=fn;},
  fetch:async(url,options)=>{sent.push({url,payload:JSON.parse(options.body)});return {ok:true}}
 };
 vm.runInNewContext(read('telemetry-client.js'),client,{timeout:3000});
 client.window.SwarmTelemetry.start();
 const report={difficulty:2,environment:{width:420,graphicsQuality:'eco'},
  result:{status:'in_progress',seconds:30,level:4,kills:21},
  totals:{peakEnemies:15,damageToBoss:300},
  timeline:[{t:30,hp:110,enemies:14,near300:2,bossHpPct:[]}]};
 const samples=[{fps:45,frameP95ms:28,slowFrames33:2,cpuUpdateMs:4,cpuDrawMs:7,elapsedGameSec:30}];
 client.window.SwarmTelemetry.sample(report,samples);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(sent.length,1);
 assert.equal(sent[0].payload.type,'snapshot');
 assert.equal(sent[0].payload.data.perf.avgFps,45);
 assert.equal(sent[0].payload.data.device.category,'phone');
 assert.ok(!JSON.stringify(sent[0].payload).includes('userAgent'));
 assert.ok(!JSON.stringify(sent[0].payload).includes('ipAddress'));
 const end={...report,result:{status:'win',seconds:45,score:1000,level:5,kills:34},
  bosses:[],choices:[],fusions:[],finalWeapons:[],events:[],timeline:[]};
 client.window.SwarmTelemetry.finish(end,samples);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(sent.length,2);
 assert.equal(sent[1].payload.type,'finish');
 assert.equal(sent[1].payload.details.perfOverall.averageFps,45);
 assert.ok(sent[1].payload.eventId);
});

test('browser client with missing endpoint never sends telemetry',async()=>{
 const sent=[],client={
  window:{RELIC_TELEMETRY_CONFIG:{endpoint:''}},
  document:{readyState:'loading',addEventListener(){}},
  localStorage:{getItem:k=>k==='relict_swarm_analytics_consent_v1'?'yes':null,setItem(){}},
  navigator:{onLine:true},Date,Math,JSON,Number,innerWidth:900,
  addEventListener(){},fetch:async()=>{sent.push(1);return {ok:true}}
 };
 vm.runInNewContext(read('telemetry-client.js'),client,{timeout:3000});
 client.window.SwarmTelemetry.start();
 client.window.SwarmTelemetry.sample({result:{status:'in_progress'},totals:{}},[]);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(sent.length,0);
});
