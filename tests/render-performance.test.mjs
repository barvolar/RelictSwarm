import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
function runtime(stored='normal',touch=false){
 const calls=[],ctx=vm.createContext({
  window:{},localStorage:{getItem:()=>stored,setItem(){}},
  innerWidth:1920,innerHeight:919,devicePixelRatio:1,
  matchMedia:()=>({matches:touch}),addEventListener(){},
  C:{width:0,height:0,style:{}},
  cx:{setTransform:(...args)=>calls.push(args)},
  S:{enemy:[],player:{x:0,y:0}},
  Math,console
 });
 vm.runInContext(read('src/modules/20-core/state/render-settings.js'),ctx);
 return {ctx,calls,run:s=>vm.runInContext(s,ctx)};
}
function readings(from,count,fps,enemies){
 return Array.from({length:count},(_,i)=>({elapsedGameSec:from+i,fps,enemies}));
}
test('legacy ECO migrates to LOW, preserving detailed enemies and reducing resolution',()=>{
 const q=runtime('eco');
 assert.equal(q.run('renderQuality'),'low');
 assert.equal(q.run('effectiveRenderDpr()'),.9);
 assert.equal(q.ctx.C.width,1728);
 assert.equal(q.ctx.C.height,827);
 assert.equal(q.ctx.C.style.width,'1920px');
 assert.equal(q.ctx.C.style.height,'919px');
 assert.equal(q.run('renderIsLite()'),true);
 assert.equal(q.run('renderSimplifyEnemies()'),false);
 const standard=runtime('normal');
 assert.equal(standard.run('effectiveRenderDpr()'),1);
 assert.equal(standard.ctx.C.width,1920);
});
test('adaptive resolution reacts only to sustained high-load low FPS',()=>{
 const r=runtime();
 assert.equal(r.run('renderIsLite()'),false);
 const samples=readings(8,5,14,100);
 r.ctx.samples=samples;
 r.run('adjustRenderFidelity(samples)');
 assert.equal(r.run('adaptiveRenderScale'),.65);
 assert.equal(r.ctx.C.width,1248);
 assert.equal(r.run('renderIsLite()'),true);
 assert.equal(r.run('renderSimplifyEnemies()'),false,'automatic scaling must never simplify enemies');
 const previousCalls=r.calls.length;
 r.ctx.samples=readings(11,5,70,10);
 r.run('adjustRenderFidelity(samples)');
 assert.equal(r.run('adaptiveRenderScale'),.65,'hysteresis prevents rapid changes');
 assert.equal(r.calls.length,previousCalls);
 r.ctx.samples=readings(29,5,70,10);
 r.run('adjustRenderFidelity(samples)');
 assert.equal(r.run('adaptiveRenderScale'),1,'quality recovers after sustained headroom');
 assert.equal(r.ctx.C.width,1920);
});
test('low FPS alone does not degrade quality without gameplay pressure',()=>{
 const r=runtime();
 r.ctx.samples=readings(1,6,17,8);
 r.run('adjustRenderFidelity(samples)');
 assert.equal(r.run('adaptiveRenderScale'),1);
 r.run('setRenderQuality("low")');
 assert.equal(r.run('renderIsLite()'),true);
 r.run('setRenderQuality("normal")');
 assert.equal(r.run('renderIsLite()'),false);
});
test('simplified enemy renderer does not change enemy gameplay state',()=>{
 const q=runtime('minimal');
 const calls=[];
 q.ctx.cx=new Proxy({}, {get:(target,key)=>target[key]||((...args)=>calls.push([key,...args]))});
 q.ctx.ENEMY={scarab:{col:'#65dbbc'}};
 q.ctx.TAU=Math.PI*2;
 q.ctx.clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 const enemy={x:50,y:70,id:'scarab',r:18,hit:0,shock:0,frost:0,burn:0,chill:0,hp:100,maxHp:100};
 q.ctx.entity=enemy;
 const snapshot=JSON.stringify(enemy);
 vm.runInContext(read('src/modules/70-render/layers/enemies.js')+'\ndrawEnemy(entity);',q.ctx);
 assert.equal(JSON.stringify(enemy),snapshot);
 assert.ok(calls.some(c=>c[0]==='fill'));
 assert.ok(calls.length<35,'the simplified enemy should use a small constant number of canvas operations');
});
test('rendering changes are isolated from spawn and balance mechanics',()=>{
 const html=read('dist/index.html');
 assert.ok(html.includes('function adjustRenderFidelity'));
 assert.ok(html.includes('function drawLiteEnemy'));
 assert.ok(html.includes('function drawBullets'));
 assert.ok(html.includes('function updateEnemies'));
 assert.ok(html.includes("function hurtEnemy"));
 assert.ok(!html.includes('perfOverlay'));
});

test('four graphics presets have distinct budgets and manual-only enemy simplification',()=>{
 for(const [id,dpr,simplify,lite,glow] of [
  ['high',1,false,false,1],
  ['normal',1,false,false,.85],
  ['low',.9,false,true,.4],
  ['minimal',.72,true,true,0]
 ]){
  const r=runtime(id);
  assert.equal(r.run('renderQuality'),id);
  assert.equal(r.run('effectiveRenderDpr()'),dpr);
  assert.equal(r.run('renderSimplifyEnemies()'),simplify);
  assert.equal(r.run('renderIsLite()'),lite);
  assert.equal(r.run('renderGlowFactor()'),glow);
 }
 const r=runtime('high');
 r.run('setRenderQuality("minimal")');
 assert.equal(r.run('renderSimplifyEnemies()'),true);
 r.run('setRenderQuality("high")');
 assert.equal(r.run('renderSimplifyEnemies()'),false);
 r.run('setRenderQuality("invalid")');
 assert.equal(r.run('renderQuality'),'high');
});
test('graphics picker is accessible in settings and pause',()=>{
 const s=read('src/modules/60-analytics/performance/settings.js');
 const p=read('src/modules/40-game/lifecycle/pause-and-notices.js');
 assert.ok(s.includes("data-graphics-preset"));
 assert.ok(s.includes("aria-pressed"));
 assert.ok(p.includes("renderQualityControls()"));
 assert.ok(!s.includes('qualityToggle'));
});
test('automatic scaling never engages simplified enemy silhouettes',()=>{
 const source=read('src/modules/70-render/layers/enemies.js');
 assert.ok(source.includes('if(renderSimplifyEnemies()'));
 assert.ok(!source.includes('if(renderIsLite()&&!e.elite'));
 const r=runtime('high');
 r.ctx.samples=readings(15,5,12,150);
 r.run('adjustRenderFidelity(samples)');
 assert.equal(r.run('adaptiveRenderScale'),.65);
 assert.equal(r.run('renderSimplifyEnemies()'),false);
});
