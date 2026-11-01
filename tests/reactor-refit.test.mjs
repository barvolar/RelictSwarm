import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');

function renderer(){
 const calls=[];
 const canvas=new Proxy({
  createRadialGradient(){return {addColorStop(){}}},
  setLineDash(){},
 },{get(t,p){if(p in t)return t[p];return (...args)=>{calls.push({method:String(p),args});return undefined;}}});
 const ctx=vm.createContext({
  cx:canvas,W:1280,H:720,S:{player:{x:0,y:0},rageTimer:0,invulnTimer:0},
  Math,TAU:Math.PI*2,ambient:4,trainingMode:false,
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  renderSimplifyEnemies:()=>false,renderGlowFactor:()=>.4,
  equippedSkin:()=>({core:'#86e5bd',coreDark:'#1a4d4e',light:'#e0faf6',
    back:'#344856',plate:'#7c8791',shell:'#354e52',edge:'#95aab0',trim:'#d7b77b'}),
  ENEMY:Object.fromEntries([
   ['scarab','#89c7a5'],['hunter','#e4b677'],['sentry','#94bbc3'],
   ['brute','#ca777a'],['hive','#b9a1d5'],['phantom','#9adfe4'],
   ['boss1','#fb8d64'],['boss2','#ba81ff'],['boss3','#ff779e'],
   ['synth1','#f1b75d'],['synth2','#65e8ff'],['synth3','#fe9fb6'],
   ['omega','#ffbc68']
  ].map(([id,col])=>[id,{col}]))
 });
 const paths=[
  'src/modules/70-render/layers/primitives.js',
  'src/modules/70-render/layers/background.js',
  'src/modules/70-render/layers/robot.js',
  'src/modules/70-render/layers/enemies.js',
  'src/modules/70-render/layers/pickups.js',
  'src/modules/70-render/layers/overlays.js'
 ];
 for(const p of paths)vm.runInContext(read(p),ctx,{timeout:2000});
 return {ctx,calls,run:code=>vm.runInContext(code,ctx,{timeout:3000})};
}
test('industrial arena draws panels and world-fixed reactor landmarks at zero and scrolled coordinates',()=>{
 const r=renderer();
 r.run('drawBackground(0,0)');
 const first=r.calls.length;
 assert.ok(first>400,'deck must draw numerous physical features, not a flat colour');
 assert.ok(first<17000,'avoid runaway per-frame draw call count');
 r.calls.length=0;
 r.run('drawBackground(-1120,1100,.65)');
 assert.ok(r.calls.length>400);
 assert.ok(r.calls.length<25000);
 assert.ok(read('src/modules/70-render/layers/background.js').includes('const tile=192'));
 assert.ok(!read('src/modules/70-render/layers/background.js').includes("'#16303c'"));
});
test('player, each enemy type, bosses and loot render without modifying combat state',()=>{
 const r=renderer();
 const p={x:0,y:0,dx:0,dy:-1,inv:0};
 r.ctx.p=p;
 const was=JSON.stringify(p);
 r.run('drawRobot(p)');
 assert.equal(JSON.stringify(p),was);
 for(const id of ['scarab','hunter','sentry','brute','hive','phantom','boss1','boss2','boss3','synth1','synth2','synth3','omega']){
  const enemy={x:50,y:50,r:id.startsWith('boss')||id.startsWith('synth')||id==='omega'?65:20,
   id,t:1,seed:8,hp:90,maxHp:120,hit:0,shock:0,burn:0,frost:0,
   chill:0,marked:0,elite:false,champion:false,phase:0,shield:0};
  const original=JSON.stringify(enemy);
  r.ctx.enemy=enemy;
  r.run('drawEnemy(enemy)');
  assert.equal(JSON.stringify(enemy),original,id+' renderer must be visual only');
 }
 for(const type of ['xp','shard','core','heal','magnet','rage','invuln']){
  const o={x:25,y:19,type};r.ctx.pickup=o;
  r.run('drawPickup(pickup)');
 }
 assert.ok(r.calls.length>350);
});
test('the minimal graphics preset still has a cheap enemy silhouette',()=>{
 const r=renderer();
 r.ctx.renderSimplifyEnemies=()=>true;
 const e={x:0,y:0,id:'scarab',r:16,hp:20,maxHp:21,
  hit:0,burn:0,shock:0,frost:0,chill:0,elite:false,champion:false};
 r.ctx.enemy=e;r.run('drawEnemy(enemy)');
 assert.ok(r.calls.length<35,'minimal enemies need a bounded drawing budget');
});
test('reactor look is integrated in published build pipeline and platform SDKs remain intact',()=>{
 const o=JSON.parse(read('src/style-order.json'));
 const css=read('src/styles/sections/reactor-refit.css');
 assert.equal(o.at(-1),'src/styles/sections/reactor-refit.css');
 assert.ok(css.includes('--ink:#090f15'));
 assert.ok(css.includes('.reactor-console'));
 assert.ok(css.includes('.upgrade-v2-screen'));
 assert.ok(css.includes('.forge-card.is-ready'));
 const game=read('dist/index.html');
 assert.ok(game.includes('function drawReactorSeal('));
 assert.ok(game.includes('function drawMachineEnemy('));
 assert.ok(game.includes('function drawReactorBoss('));
 assert.ok(game.includes('REACTOR REFIT'));
 assert.ok(read('dist/yandex/index.html').includes('RELICT_PLATFORM="yandex"'));
 assert.ok(read('dist/crazygames/index.html').includes('RELICT_PLATFORM="crazygames"'));
});

test('boss-core synthesis visually assembles a hybrid but changes no balance rules',()=>{
 const f=read('src/modules/40-game/upgrades/fusion-ui.js');
 const particles=read('src/modules/70-render/layers/projectile-effects.js');
 assert.ok(f.includes("type:'fabrication'"));
 assert.ok(particles.includes("fx.type==='fabrication'"));
 assert.ok(f.includes('Хранителя ядра (≈6:05)'));
 assert.ok(f.includes("createFusionWeapon(id,a,b"));
 assert.ok(f.includes("S.fusionCores--"));
});
