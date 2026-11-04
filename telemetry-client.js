/* Relict Swarm v0.11.2: consent-based, anonymous test telemetry.
   Sends only game measurements. No IP, raw user-agent, name, or persistent player ID. */
(() => {
  'use strict';
  const config = window.RELIC_TELEMETRY_CONFIG || {};
  const endpoint = typeof config.endpoint === 'string' ? config.endpoint.trim() : '';
  const configured = /^https:\/\/[^/?#]+\//.test(endpoint);
  const CONSENT_KEY = 'relict_swarm_analytics_consent_v1';
  const QUEUE_KEY = 'relict_swarm_analytics_queue_v1';
  let consent = null;
  let sessionId = '';
  let sending = false;
  let queue = [];
  try {
    const val = localStorage.getItem(CONSENT_KEY);
    consent = val === 'yes' ? true : val === 'no' ? false : null;
    queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    if (!Array.isArray(queue)) queue = [];
  } catch { queue = []; }
  function storeQueue() { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-12))); } catch {} }
  function randomId() { return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'rs-'+Date.now()+'-'+Math.random().toString(36).slice(2); }
  const round = (v, n = 1) => Number.isFinite(+v) ? +(+v).toFixed(n) : null;
  function screenCategory(width) { return width <= 650 ? 'phone' : width <= 1000 ? 'tablet' : 'desktop'; }
  function perfView(samples) {
    if (!samples?.length) return null;
    const recent = samples.slice(-30), fps = recent.map(x => x.fps).filter(Number.isFinite);
    return { count: recent.length,
      avgFps: fps.length ? round(fps.reduce((a,b)=>a+b,0)/fps.length) : null,
      minFps: fps.length ? round(Math.min(...fps)) : null,
      p95ms: round(Math.max(...recent.map(x => x.frameP95ms || 0))),
      slowFrames33: recent.reduce((sum, x) => sum + (x.slowFrames33 || 0), 0),
      avgUpdateMs: round(recent.reduce((sum,x)=>sum+(x.cpuUpdateMs||0),0)/recent.length,2),
      avgDrawMs: round(recent.reduce((sum,x)=>sum+(x.cpuDrawMs||0),0)/recent.length,2) };
  }
  function compactSnapshot(report, samples) {
    const last = report.timeline?.at(-1) || {};
    return {
      t: round(report.result?.seconds ?? last.t ?? 0),
      status: report.result?.status || 'playing',
      difficulty: Number(report.difficulty || 1),
      level: Number(report.result?.level ?? last.level ?? 1),
      kills: Number(report.result?.kills ?? last.kills ?? 0),
      hp: round(last.hp), enemies: Number(last.enemies || 0),
      near300: Number(last.near300 || 0), peakEnemies: Number(report.totals?.peakEnemies || 0),
      bossDamage: round(report.totals?.damageToBoss || 0),
      bossPct: Array.isArray(last.bossHpPct) ? last.bossHpPct.slice(0,3) : [],
      perf: perfView(samples),
      device: { category: screenCategory(report.environment?.width || innerWidth),
        widthBucket: Math.round((report.environment?.width || innerWidth) / 100) * 100,
        quality: ['low','minimal','eco'].includes(report.environment?.graphicsQuality)?'eco':'normal' }
    };
  }
  // The deployed Worker accepts up to 60k request chars / 45k sanitized detail chars.
  // Keep a much smaller safety margin for UTF-8, mobile keepalive and long (>25m) runs.
  const MAX_FINISH_SIZE = 27000;
  const REJECTED_KEY = 'relict_swarm_analytics_rejected_v1';
  function thinArray(array, limit) {
    if (!Array.isArray(array) || !limit) return [];
    if (array.length <= limit) return array;
    if (limit === 1) return [array.at(-1)];
    return Array.from({length:limit},(_,i)=>array[Math.floor(i*(array.length-1)/(limit-1))]);
  }
  function finishDetails(raw={},tier=0) {
    // Preserve the outcome even if the detailed report becomes enormous.
    const caps=[
      {bosses:25,choices:140,timeline:65,events:85,perf:35},
      {bosses:20,choices:95,timeline:32,events:36,perf:18},
      {bosses:12,choices:55,timeline:14,events:18,perf:8},
      {bosses:6,choices:25,timeline:5,events:8,perf:3},
    ][Math.min(3,tier)];
    return {
      result:raw.result||{},
      totals:raw.totals||{},
      bosses:(raw.bosses||[]).slice(0,caps.bosses),
      choices:(raw.choices||[]).slice(-caps.choices),
      fusions:(raw.fusions||[]).slice(0,4),
      timeline:thinArray(raw.timeline,caps.timeline),
      finalWeapons:(raw.finalWeapons||[]).slice(0,5),
      events:(raw.events||[]).slice(-caps.events),
      perfOverall:raw.perfOverall||{},
      perfTimeline:thinArray(raw.perfTimeline,caps.perf)
    };
  }
  function compactFinish(event,minimum=false) {
    if (event.type!=='finish') return event;
    const raw=event.details||{};
    if (minimum) {
      return {...event,details:{result:raw.result||{status:event.data?.status||'defeat'},
        totals:raw.totals||{},bosses:(raw.bosses||[]).slice(0,4),
        finalWeapons:(raw.finalWeapons||[]).slice(0,5),
        fusions:(raw.fusions||[]).slice(0,4),
        perfOverall:raw.perfOverall||{}}};
    }
    for (let tier=0;tier<=3;tier++) {
      const candidate={...event,details:finishDetails(raw,tier)};
      if (JSON.stringify(candidate).length<=MAX_FINISH_SIZE) return candidate;
    }
    return compactFinish(event,true);
  }
  function stashRejected(event) {
    // Never keep a permanently invalid payload at the front of the send queue.
    try {
      const saved=JSON.parse(localStorage.getItem(REJECTED_KEY)||'[]');
      const failed=Array.isArray(saved)?saved:[];
      failed.push(compactFinish(event,true));
      localStorage.setItem(REJECTED_KEY,JSON.stringify(failed.slice(-4)));
    } catch {}
  }
  function allowed() { return configured && consent === true; }
  function enqueue(payload) {
    if (!allowed()) return;
    const event=compactFinish({...payload,eventId:randomId()});
    queue.push(event);
    if (queue.length>12) {
      // Prefer completed run results over old periodic samples if offline.
      while(queue.length>12) {
        const index=queue.findIndex(item=>item.type==='snapshot');
        queue.splice(index<0?0:index,1);
      }
    }
    storeQueue(); flush();
  }
  async function flush() {
    if (!allowed() || sending || !navigator.onLine || !queue.length) return;
    sending = true;
    try {
      while (queue.length && allowed()) {
        if(!queue[0].eventId)queue[0].eventId=randomId();
        // Repair oversized finished runs already trapped in the old on-device queue.
        if(queue[0].type==='finish')queue[0]=compactFinish(queue[0]);
        storeQueue();
        const data=JSON.stringify(queue[0]);
        const resp=await fetch(endpoint,{method:'POST',mode:'cors',
          headers:{'Content-Type':'application/json'},body:data,keepalive:data.length<50000,
          credentials:'omit',cache:'no-store'});
        if(!resp.ok) {
          if(resp.status===413&&queue[0].type==='finish'&&!queue[0]._minimized){
            queue[0]={...compactFinish(queue[0],true),_minimized:true};
            storeQueue();continue;
          }
          // Retry network/5xx/rate-limit problems later. Do not poison later
          // batches with permanently rejected 4xx responses.
          if(resp.status<400||resp.status>=500||resp.status===429)break;
          stashRejected(queue.shift());storeQueue();continue;
        }
        queue.shift();storeQueue();
      }
    } catch { /* Keep pending batches for the next connection. */ }
    finally { sending=false; }
  }
  function setConsent(next) {
    consent = !!next;
    try {localStorage.setItem(CONSENT_KEY, consent ? 'yes' : 'no');} catch {}
    if (!consent) { queue = []; storeQueue(); try{localStorage.removeItem(REJECTED_KEY)}catch{} }
    renderConsent();
    if (consent) flush();
  }
  function consentHtml() {
    if (!configured) return '<div class="rs-privacy"><b>Anonymous analytics</b><p>Online collection is not configured. Metrics are processed locally without appearing in the game interface.</p></div>';
    const label = consent === true ? 'Enabled' : consent === false ? 'Disabled' : 'Not selected';
    return `<div class="rs-privacy"><b>Anonymous analytics</b><p>Optional anonymous performance, difficulty, weapon and run statistics. No names or permanent player IDs. Status: <b>${label}</b>.</p><div class="rs-privacy-buttons"><button type="button" class="btn" data-rs-consent="yes">Allow</button><button type="button" class="btn ghost" data-rs-consent="no">Disable</button></div><small>You can change this choice in Settings. Changing it does not delete previously submitted reports. <a href="./privacy.html" target="_blank" rel="noopener noreferrer">Read Privacy Policy</a>.</small></div>`;
  }
  function renderConsent() {
    const modal = document.getElementById('rs-consent-banner');
    if (!modal) return;
    if (!configured || consent !== null) { modal.hidden = true; return; }
    modal.hidden = false;
  }
  function buildBanner() {
    if (!document.body || document.getElementById('rs-consent-banner')) return;
    const style = document.createElement('style');
    style.textContent = `.rs-privacy{margin:12px 0;padding:12px;border:1px solid #49737e;border-radius:10px;background:#0b1b2b;color:#dcecf3;font:13px/1.5 system-ui,sans-serif}.rs-privacy p{margin:6px 0 10px}.rs-privacy small{display:block;color:#93adbb;margin-top:8px}.rs-privacy-buttons{display:flex;gap:8px;flex-wrap:wrap}#rs-consent-banner{position:fixed;z-index:10000;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));max-width:520px;margin:auto;padding:16px;border:1px solid #59bfb4;border-radius:12px;background:#0c1e30f5;color:#e9ffff;box-shadow:0 8px 32px #0009;font:14px/1.4 system-ui,sans-serif}#rs-consent-banner[hidden]{display:none}#rs-consent-banner button{border:1px solid #5dcac0;border-radius:8px;background:#15354b;color:white;padding:10px 14px;font:inherit;cursor:pointer}#rs-consent-banner .rs-allow{background:#257c76}#rs-consent-banner a,.rs-privacy a{color:#96ffe9;text-decoration:underline;text-underline-offset:2px}`;
    document.head.appendChild(style);
    const div = document.createElement('div'); div.id = 'rs-consent-banner'; div.hidden = true;
    div.innerHTML = '<b>Help improve Relict Swarm?</b><p>May we send anonymous run and FPS statistics to our server? No personal information is submitted. Change your choice anytime in Settings. <a href="./privacy.html" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</p><button class="rs-allow" data-rs-consent="yes">Allow</button> <button data-rs-consent="no">Do not send</button>';
    document.body.appendChild(div); renderConsent();
    document.addEventListener('click', (e) => {
      const btn = e.target.closest?.('[data-rs-consent]');
      if (btn) setConsent(btn.getAttribute('data-rs-consent') === 'yes');
    });
  }
  function start() { sessionId = randomId(); }
  function sample(report, samples) {
    if (!allowed() || !report?.totals || !sessionId) return;
    enqueue({v:1,type:'snapshot',sessionId,build:'0.11.2-reliable-finish-'+(report.environment?.graphicsQuality||'normal'),data:compactSnapshot(report,samples)});
  }
  function finish(report, samples) {
    if (!allowed() || !report?.result || !sessionId) return;
    const summary = compactSnapshot(report,samples);
    // Keep detailed boss encounters, choices and progression; no raw user-agent or user input.
    const all=samples||[];
    const fps=all.map(x=>x.fps).filter(Number.isFinite);
    const perfOverall={seconds:all.length,
      averageFps:fps.length?round(fps.reduce((a,b)=>a+b,0)/fps.length):null,
      minFps:fps.length?round(Math.min(...fps)):null,
      slowFrames33:all.reduce((sum,x)=>sum+(x.slowFrames33||0),0),
      worstP95ms:all.length?round(Math.max(...all.map(x=>x.frameP95ms||0))):null};
    const perfTimeline=all.filter((x,i)=>i%15===0).slice(-80).map(x=>({
      t:round(x.elapsedGameSec),fps:round(x.fps),p95:round(x.frameP95ms),
      cpu:round((x.cpuUpdateMs||0)+(x.cpuDrawMs||0),2),
      enemies:x.enemies||0,shots:(x.shots||0)+(x.enemyBullets||0),fx:(x.fx||0)+(x.parts||0)}));
    const details={result:report.result,totals:report.totals,bosses:report.bosses,
      choices:report.choices,fusions:report.fusions,timeline:report.timeline,
      finalWeapons:report.finalWeapons,events:report.events,perfOverall,perfTimeline};
    enqueue({v:1,type:'finish',sessionId,build:'0.11.2-reliable-finish-'+(report.environment?.graphicsQuality||'normal'),data:summary,details});
  }
  window.SwarmTelemetry = { start, sample, finish, settingsHTML:consentHtml };
  addEventListener('online',flush);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',buildBanner);
  else buildBanner();
  // A player may have won on their phone and closed the tab while an oversized
  // finish was stuck locally. Retry that saved event on their next visit.
  if(consent===true)flush();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)flush();});
})();
