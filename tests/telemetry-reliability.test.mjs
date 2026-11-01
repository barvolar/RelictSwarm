import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import worker from '../telemetry/worker.mjs';

const source=fs.readFileSync(new URL('../telemetry-client.js',import.meta.url),'utf8');
const url='https://telemetry.example.workers.dev/ingest';
const origin='https://barvolar.github.io';
const flushJobs=async()=>{for(let i=0;i<5;i++)await new Promise(resolve=>setImmediate(resolve));};
const mockDB=()=>{
 const rows=[];
 return {rows,prepare(){let args;return {bind(...v){args=v;return this;},async run(){rows.push(args);return {success:true}}};}};
};
function browser({consent='yes',savedQueue=[],online=true,fetchResponse}={}){
 const storage=new Map([
  ['relict_swarm_analytics_consent_v1',consent],
  ['relict_swarm_analytics_queue_v1',JSON.stringify(savedQueue)]
 ]);
 const payloads=[],listeners={},db=mockDB(),env={TELEMETRY:db,ADMIN_TOKEN:'a'.repeat(40)};
 let number=0;
 const context={
  window:{RELIC_TELEMETRY_CONFIG:{endpoint:url}},
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  document:{readyState:'loading',hidden:false,addEventListener(name,fn){listeners[name]=fn;}},
  navigator:{onLine:online},addEventListener(name,fn){listeners[name]=fn;},
  innerWidth:420,Date,Math,JSON,Number,
  crypto:{randomUUID:()=> 'test-id-'+String(++number).padStart(14,'0')},
  fetch:async(uri,opts)=>{
   payloads.push(JSON.parse(opts.body));
   if(fetchResponse)return fetchResponse(uri,opts,payloads.length);
   return worker.fetch(new Request(uri,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:opts.body}),env);
  }
 };
 vm.runInNewContext(source,context,{timeout:4000});
 return {storage,payloads,listeners,db,context,client:context.window.SwarmTelemetry};
}
function report(){
 return {
  difficulty:5,environment:{width:420,graphicsQuality:'low'},
  result:{status:'win',seconds:1450,level:103,kills:16891,score:200000,playerHp:7},
  totals:{killed:16891,peakEnemies:171,damageToBoss:100000},
  bosses:Array.from({length:12},(_,i)=>({
   id:'boss-'+i,kind:'boss1',status:'killed',spawnedAt:200+i*80,
   killedAt:220+i*80,initialHp:800000,damage:800000,blockedByHitCap:1200
  })),
  choices:Array.from({length:300},(_,i)=>({
   t:i*5,level:i+2,kind:'weapon',id:'pulse',name:'Лазерная дуга',
   rarity:'НЕОБЫЧНАЯ',mods:['power','rate','count','range']
  })),
  fusions:[{t:500,id:'thermal',from:['flame','saw']}],
  timeline:Array.from({length:600},(_,i)=>({
   t:i*5,level:1+i, hp:100,maxHp:120,kills:i*28,enemies:171,
   near180:16,near300:70,bullets:180,enemyBullets:250,parts:600,fx:180,
   bossIds:['boss1'],bossHpPct:[50],damageToBoss5s:200,damageToOthers5s:500
  })),
  finalWeapons:[{id:'pulse',level:120,mods:{power:45,rate:55}}],
  events:Array.from({length:400},(_,i)=>({t:i*5,what:'reroll_used',id:'free'}))
 };
}
function metrics(){
 return Array.from({length:1500},(_,i)=>({
  elapsedGameSec:i,fps:60,frameP95ms:17,slowFrames33:0,cpuUpdateMs:.4,cpuDrawMs:.5,
  enemies:171,shots:200,enemyBullets:300,fx:200,parts:600
 }));
}
test('a long victorious run is safely bounded and accepted by the unchanged deployed worker',async()=>{
 const h=browser();
 h.client.start();
 h.client.finish(report(),metrics());
 await flushJobs();
 assert.equal(h.payloads.length,1);
 const e=h.payloads[0];
 assert.equal(e.type,'finish');
 assert.ok(e.build.startsWith('0.11.2-reliable-finish'));
 assert.equal(e.data.status,'win');
 assert.ok(JSON.stringify(e).length<28000);
 assert.equal(h.db.rows.length,1,'Worker must persist the finish');
 assert.equal(h.db.rows[0][3],'finish');
 assert.equal(JSON.parse(h.db.rows[0][12]).status,'win');
 const detail=JSON.parse(h.db.rows[0][13]);
 assert.equal(detail.result.status,'win');
 assert.ok(detail.bosses.length>0);
 assert.ok(detail.finalWeapons.length>0);
 assert.ok(detail.choices.length>0);
 assert.ok(detail.timeline.length>0);
 assert.equal(JSON.parse(h.storage.get('relict_swarm_analytics_queue_v1')).length,0);
});
test('oversized finish stranded in the previous client queue recovers on the next visit',async()=>{
 const old=report();
 const previous={v:1,eventId:'legacy-event-id-123456789',sessionId:'old-session-id-1234567',
  type:'finish',build:'0.11.0-permanent-research',
  data:{status:'win',difficulty:5,t:1450,device:{category:'phone',quality:'eco'}},
  details:{...old,perfTimeline:metrics()}};
 assert.ok(JSON.stringify(previous).length>60000);
 const h=browser({savedQueue:[previous]});
 await flushJobs();
 assert.equal(h.payloads.length,1,'startup must retry, not wait for a new run');
 assert.equal(h.payloads[0].eventId,previous.eventId,'preserve event ID for idempotency');
 assert.ok(JSON.stringify(h.payloads[0]).length<28000);
 assert.equal(h.db.rows.length,1);
 assert.equal(JSON.parse(h.db.rows[0][13]).result.status,'win');
 assert.equal(JSON.parse(h.storage.get('relict_swarm_analytics_queue_v1')).length,0);
});
test('413 from the server triggers an even smaller finish retry without losing the win',async()=>{
 let failures=0;
 const h=browser({fetchResponse:async(uri,opts)=>{
  if(failures++===0)return {ok:false,status:413};
  return {ok:true,status:200};
 }});
 h.client.start();h.client.finish(report(),metrics());await flushJobs();
 assert.equal(h.payloads.length,2);
 assert.equal(h.payloads[0].eventId,h.payloads[1].eventId);
 assert.equal(h.payloads[1].details.result.status,'win');
 assert.ok(JSON.stringify(h.payloads[1]).length<JSON.stringify(h.payloads[0]).length);
 assert.equal(JSON.parse(h.storage.get('relict_swarm_analytics_queue_v1')).length,0);
});
test('permanent rejection cannot block later snapshots; temporary failures remain queued',async()=>{
 let tries=0;
 const h=browser({savedQueue:[
  {v:1,type:'snapshot',sessionId:'old-session-1234567890',eventId:'bad-event-1234567890',data:{status:'playing'}},
  {v:1,type:'snapshot',sessionId:'good-session-123456789',eventId:'good-event-1234567890',data:{status:'playing'}}
 ],fetchResponse:async()=>{
  tries++;
  return tries===1?{ok:false,status:400}:{ok:true,status:200};
 }});
 await flushJobs();
 assert.equal(h.payloads.length,2);
 assert.equal(JSON.parse(h.storage.get('relict_swarm_analytics_queue_v1')).length,0);
 assert.equal(JSON.parse(h.storage.get('relict_swarm_analytics_rejected_v1')).length,1);
 const h2=browser({savedQueue:[
  {v:1,type:'snapshot',sessionId:'old-session-1234567890',eventId:'bad-event-1234567890',data:{status:'playing'}}
 ],fetchResponse:async()=>({ok:false,status:503})});
 await flushJobs();
 assert.equal(JSON.parse(h2.storage.get('relict_swarm_analytics_queue_v1')).length,1);
});
test('without consent neither queued nor completed records are uploaded',async()=>{
 const old=report();
 const h=browser({consent:'no',savedQueue:[{v:1,type:'finish',sessionId:'old-session-12345',
  eventId:'old-event-123456',data:{status:'win'},details:{result:old.result}}]});
 await flushJobs();
 assert.equal(h.payloads.length,0);
 h.client.start();h.client.finish(old,metrics());await flushJobs();
 assert.equal(h.payloads.length,0);
});
