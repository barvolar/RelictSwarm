// Cloudflare Worker + D1: anonymous gameplay telemetry, free-tier compatible.
// The client never receives ADMIN_TOKEN. Neither IP nor User-Agent is stored.
const ORIGINS=new Set(['https://barvolar.github.io','http://localhost:4173','http://127.0.0.1:4173']);
const STATUSES=new Set(['playing','in_progress','win','defeat','abandoned']);
const n=(v,min=0,max=1e9)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):null;
const str=(v,max=80)=>typeof v==='string'?v.slice(0,max):'';
const list=(v,max=200)=>Array.isArray(v)?v.slice(0,max):[];
const pick=(obj,keys)=>Object.fromEntries(keys.filter(k=>obj&&Object.hasOwn(obj,k)).map(k=>[k,obj[k]]));
const numberKeys=(obj,keys)=>Object.fromEntries(keys.map(k=>[k,n(obj?.[k])]).filter(([,v])=>v!==null));
const json=(obj)=>JSON.stringify(obj);
const reply=(obj,status=200,headers={})=>new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});
function cors(origin){return ORIGINS.has(origin)?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'}:{}}
function cleanSnapshot(raw){
 const d=raw&&typeof raw==='object'?raw:{};
 const device=d.device&&typeof d.device==='object'?d.device:{};
 const perf=d.perf&&typeof d.perf==='object'?d.perf:{};
 return {...numberKeys(d,['t','difficulty','level','kills','hp','enemies','near300','peakEnemies','bossDamage']),
  status:STATUSES.has(d.status)?d.status:'playing',
  bossPct:list(d.bossPct,3).map(x=>n(x,0,100)).filter(x=>x!==null),
  device:{category:['phone','tablet','desktop'].includes(device.category)?device.category:'unknown',
   quality:['normal','eco'].includes(device.quality)?device.quality:'unknown',
   widthBucket:n(device.widthBucket,0,10000)},
  perf:{...numberKeys(perf,['count','avgFps','minFps','p95ms','slowFrames33','avgUpdateMs','avgDrawMs'])}};
}
function cleanDetails(raw){
 if(!raw||typeof raw!=='object')return null;
 const result=raw.result&&typeof raw.result==='object'?raw.result:{};
 const totals=raw.totals&&typeof raw.totals==='object'?raw.totals:{};
 const sanitizeEvent=e=>({...numberKeys(e,['t','level','hp']),...pick(e,['what','id'])});
 const sanitizeChoice=e=>({...numberKeys(e,['t','level']),...pick(e,['kind','id','rarity']),mods:list(e.mods,8).map(x=>str(x,32))});
 const sanitizeBoss=e=>({...numberKeys(e,['spawnedAt','initialHp','killedAt','damage','rawHits','blockedByHitCap','blockedByShield','blockedByDpsCap','nearSeconds','attackRangeSeconds','timeSurrounded','peakNear','damageTakenWhilePresent','healthHalfAt','remainingHpPct','durationSeconds']),id:str(e?.id),kind:str(e?.kind),status:str(e?.status)});
 const sanitizeWeapon=w=>({id:str(w?.id),level:n(w?.level),mods:numberKeys(w?.mods,Object.keys(w?.mods||{}).filter(k=>/^[a-z]{1,24}$/.test(k)).slice(0,12))});
 return {
  result:{status:STATUSES.has(result.status)?result.status:'defeat',...numberKeys(result,['seconds','level','kills','score','playerHp'])},
  totals:numberKeys(totals,['spawned','spawnBlocked','killed','eliteKilled','champsSpawned','damageToBoss','damageToOthers','receivedHits','damageReceived','bossDamageBlocked','peakEnemies','peakNear180','peakNear300','levelUps']),
  bosses:list(raw.bosses,25).map(sanitizeBoss),
  choices:list(raw.choices,500).map(sanitizeChoice),
  fusions:list(raw.fusions,4).map(e=>({...numberKeys(e,['t']),id:str(e?.id),from:list(e?.from,2).map(v=>str(v))})),
  timeline:list(raw.timeline,220).map(e=>({...numberKeys(e,['t','level','hp','maxHp','kills','enemies','near180','near300','bullets','enemyBullets','parts','fx','damageToBoss5s','damageToOthers5s']),
    bossIds:list(e?.bossIds,3).map(v=>str(v)),bossHpPct:list(e?.bossHpPct,3).map(x=>n(x,0,100))})),
  events:list(raw.events,120).map(sanitizeEvent),
  finalWeapons:list(raw.finalWeapons,5).map(sanitizeWeapon),
  perfOverall:numberKeys(raw.perfOverall,['seconds','averageFps','minFps','slowFrames33','worstP95ms']),
  perfTimeline:list(raw.perfTimeline,80).map(e=>numberKeys(e,['t','fps','p95','cpu','enemies','shots','fx']))
 };
}
function authorized(request,env){
 const token=env.ADMIN_TOKEN;
 const value=request.headers.get('Authorization')||'';
 return typeof token==='string'&&token.length>=24&&value===('Bearer '+token);
}
export default {
 async fetch(request,env){
  const url=new URL(request.url),origin=request.headers.get('Origin')||'';
  if(url.pathname==='/ingest'){
   const headers=cors(origin);
   if(!ORIGINS.has(origin))return reply({error:'forbidden origin'},403);
   if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Max-Age':'3600'}});
   if(request.method!=='POST')return reply({error:'method'},405,headers);
   if(!env.TELEMETRY)return reply({error:'database is not configured'},503,headers);
   const length=Number(request.headers.get('Content-Length')||0);
   if(length>60000)return reply({error:'too large'},413,headers);
   let value;
   try{const body=await request.text();if(body.length>60000)return reply({error:'too large'},413,headers);value=JSON.parse(body)}catch{return reply({error:'invalid json'},400,headers)}
   if(value?.v!==1||!['snapshot','finish'].includes(value.type)||!value.eventId||!value.sessionId)
    return reply({error:'invalid event'},400,headers);
   const eventId=str(value.eventId,100),session=str(value.sessionId,100),build=str(value.build,60);
   if(!/^[a-zA-Z0-9_-]{12,100}$/.test(eventId)||!/^[a-zA-Z0-9_-]{12,100}$/.test(session))return reply({error:'bad id'},400,headers);
   const snap=cleanSnapshot(value.data),details=value.type==='finish'?cleanDetails(value.details):null;
   const jsonDetails=details?json(details):null;
   if(jsonDetails&&jsonDetails.length>45000)return reply({error:'details too large'},413,headers);
   try{
    await env.TELEMETRY.prepare('INSERT OR IGNORE INTO telemetry_events (event_id,recorded_at,session_id,event_type,build,difficulty,elapsed_sec,device_category,avg_fps,min_fps,frame_p95_ms,score,data_json,details_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
     .bind(eventId,Date.now(),session,value.type,build,n(snap.difficulty,1,5),n(snap.t,0,20000),snap.device.category,n(snap.perf.avgFps,0,300),n(snap.perf.minFps,0,300),n(snap.perf.p95ms,0,10000),n(details?.result?.score),json(snap),jsonDetails).run();
    return reply({ok:true},200,headers);
   }catch{return reply({error:'storage unavailable'},503,headers)}
  }
  if(url.pathname==='/admin/summary'||url.pathname==='/admin/events'){
   if(!authorized(request,env))return reply({error:'unauthorized'},401);
   if(!env.TELEMETRY)return reply({error:'database unavailable'},503);
   try{
    if(url.pathname==='/admin/summary'){
     const [totals,byDevice,byDifficulty]=await Promise.all([
      env.TELEMETRY.prepare("SELECT COUNT(*) events, COUNT(DISTINCT session_id) sessions, SUM(CASE WHEN event_type='finish' THEN 1 ELSE 0 END) completed, ROUND(AVG(avg_fps),1) avg_fps, ROUND(AVG(frame_p95_ms),1) frame_p95_ms FROM telemetry_events").first(),
      env.TELEMETRY.prepare("SELECT device_category device, COUNT(*) samples, ROUND(AVG(avg_fps),1) avg_fps, ROUND(AVG(frame_p95_ms),1) p95_ms FROM telemetry_events WHERE event_type='snapshot' GROUP BY device_category").all(),
      env.TELEMETRY.prepare("SELECT difficulty, COUNT(*) runs, ROUND(AVG(score),0) avg_score, ROUND(AVG(elapsed_sec),1) avg_seconds FROM telemetry_events WHERE event_type='finish' GROUP BY difficulty").all()
     ]);
     return reply({totals,byDevice:byDevice.results,byDifficulty:byDifficulty.results});
    }
    const limit=Math.min(100,Math.max(1,Math.floor(Number(url.searchParams.get('limit'))||20)));
    const rows=await env.TELEMETRY.prepare("SELECT recorded_at,session_id,event_type,build,data_json,details_json FROM telemetry_events ORDER BY recorded_at DESC LIMIT ?").bind(limit).all();
    return reply({events:rows.results.map(row=>({recordedAt:row.recorded_at,sessionId:row.session_id,type:row.event_type,build:row.build,data:JSON.parse(row.data_json),details:row.details_json?JSON.parse(row.details_json):null}))});
   }catch{return reply({error:'database unavailable'},503)}
  }
  return reply({error:'not found'},404);
 }
};
