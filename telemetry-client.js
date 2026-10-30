/* Relict Swarm v0.10.15: consent-based, anonymous test telemetry.
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
        quality: report.environment?.graphicsQuality || 'unknown' }
    };
  }
  function allowed() { return configured && consent === true; }
  function enqueue(payload) {
    if (!allowed()) return;
    queue.push({...payload,eventId:randomId()});
    if (queue.length > 12) queue = queue.slice(-12);
    storeQueue(); flush();
  }
  async function flush() {
    if (!allowed() || sending || !navigator.onLine || !queue.length) return;
    sending = true;
    try {
      while (queue.length && allowed()) {
        if(!queue[0].eventId)queue[0].eventId=randomId();
        const data = JSON.stringify(queue[0]);
        const resp = await fetch(endpoint, {method:'POST', mode:'cors',
          headers:{'Content-Type':'application/json'}, body:data, keepalive:data.length < 50000,
          credentials:'omit', cache:'no-store'});
        if (!resp.ok) break;
        queue.shift(); storeQueue();
      }
    } catch (err) { /* Retain pending batches for the next connection. */ }
    finally { sending = false; }
  }
  function setConsent(next) {
    consent = !!next;
    try {localStorage.setItem(CONSENT_KEY, consent ? 'yes' : 'no');} catch {}
    if (!consent) { queue = []; storeQueue(); }
    renderConsent();
    if (consent) flush();
  }
  function consentHtml() {
    if (!configured) return '<div class="rs-privacy"><b>Анонимная статистика</b><p>Онлайн-приём пока не настроен. Показатели собираются локально, не отображаясь в интерфейсе.</p></div>';
    const label = consent === true ? 'Включена' : consent === false ? 'Отключена' : 'Не выбрано';
    return `<div class="rs-privacy"><b>Анонимная статистика</b><p>Автоматическая отправка показателей производительности, сложности, оружия и результатов забегов. Без имён и постоянных идентификаторов. Статус: <b>${label}</b>.</p><div class="rs-privacy-buttons"><button type="button" class="btn" data-rs-consent="yes">Разрешить</button><button type="button" class="btn ghost" data-rs-consent="no">Отключить</button></div><small>Можно изменить выбор в настройках. Уже отправленные отчёты не удаляются этим переключателем.</small></div>`;
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
    style.textContent = `.rs-privacy{margin:12px 0;padding:12px;border:1px solid #49737e;border-radius:10px;background:#0b1b2b;color:#dcecf3;font:13px/1.5 system-ui,sans-serif}.rs-privacy p{margin:6px 0 10px}.rs-privacy small{display:block;color:#93adbb;margin-top:8px}.rs-privacy-buttons{display:flex;gap:8px;flex-wrap:wrap}#rs-consent-banner{position:fixed;z-index:10000;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));max-width:520px;margin:auto;padding:16px;border:1px solid #59bfb4;border-radius:12px;background:#0c1e30f5;color:#e9ffff;box-shadow:0 8px 32px #0009;font:14px/1.4 system-ui,sans-serif}#rs-consent-banner[hidden]{display:none}#rs-consent-banner button{border:1px solid #5dcac0;border-radius:8px;background:#15354b;color:white;padding:10px 14px;font:inherit;cursor:pointer}#rs-consent-banner .rs-allow{background:#257c76}`;
    document.head.appendChild(style);
    const div = document.createElement('div'); div.id = 'rs-consent-banner'; div.hidden = true;
    div.innerHTML = '<b>Поможешь улучшить «Реликтовый рой»?</b><p>Можно анонимно отправлять статистику забегов и FPS на наш сервер. Без личных данных. Выбор можно изменить в настройках.</p><button class="rs-allow" data-rs-consent="yes">Разрешить</button> <button data-rs-consent="no">Не отправлять</button>';
    document.body.appendChild(div); renderConsent();
    document.addEventListener('click', (e) => {
      const btn = e.target.closest?.('[data-rs-consent]');
      if (btn) setConsent(btn.getAttribute('data-rs-consent') === 'yes');
    });
  }
  function start() { sessionId = randomId(); }
  function sample(report, samples) {
    if (!allowed() || !report?.totals || !sessionId) return;
    enqueue({v:1,type:'snapshot',sessionId,build:'0.10.16-telemetry',data:compactSnapshot(report,samples)});
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
    const details = {result:report.result,totals:report.totals,bosses:report.bosses,
      choices:report.choices,fusions:report.fusions,timeline:report.timeline,
      finalWeapons:report.finalWeapons,events:report.events,perfOverall,perfTimeline};
    enqueue({v:1,type:'finish',sessionId,build:'0.10.16-telemetry',data:summary,details});
  }
  window.SwarmTelemetry = { start, sample, finish, settingsHTML:consentHtml };
  addEventListener('online',flush);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',buildBanner);
  else buildBanner();
})();
