import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=[
 read('src/modules/40-game/combat/fusion-projectiles.js'),
 read('src/modules/40-game/combat/fusion-attacks.js'),
 read('src/modules/40-game/combat/area-weapons.js')
].join('\n');

function scene(){
 const S={enemy:[],gravityWells:[],effects:[],fx:[],mines:[],timeStopTimer:0,player:{x:0,y:0}};
 const hits=[],bursts=[],ctx=vm.createContext({
  S,DRONES:{fusion_prism:{color:'#8dfde9'}},Math,shake:0,
  wm:(d,key)=>d.mods?.[key]||0,
  burst:(...args)=>bursts.push(args),
  hurtEnemy:(enemy,damage,opts={})=>{hits.push({enemy,damage,opts});enemy.hp-=damage;},
  closest:()=>null,damageArea:()=>{},sfx:()=>{},shatterFrozen:()=>{},applyChill:()=>{}
 });
 vm.runInContext(source,ctx,{timeout:2000});
 const fire=(mods={},target=S.enemy[0]||{x:100,y:0,r:12,hp:1e5},rank=1,base=1.5)=>{
  ctx.d={id:'fusion_prism',mods};
  ctx.target=target;
  ctx.rank=rank;ctx.base=base;
  return vm.runInContext('fireFusionSpecial(d,{x:0,y:0},target,base,rank)',ctx,{timeout:2000});
 };
 const step=(seconds,dt=.02)=>{
  for(let i=0;i<Math.round(seconds/dt);i++)vm.runInContext('updateAreaWeapons('+dt+')',ctx,{timeout:2000});
 };
 const beamHits=()=>hits.filter(h=>h.opts.slow===.35);
 return {S,hits,bursts,ctx,fire,step,beamHits};
}
const foe=(x,y,elite=false)=>({x,y,r:12,hp:1e5,elite,slow:0});

test('prism creates a 2.8s well with no front-loaded damage and repeated visible laser volleys',()=>{
 const t=scene();
 const e=foe(100,0);
 t.S.enemy.push(e);
 assert.equal(t.fire(),true);
 assert.equal(t.S.gravityWells.length,1);
 const g=t.S.gravityWells[0];
 assert.equal(g.prism,true);
 assert.equal(g.life,2.8);
 assert.equal(g.r,100);
 assert.equal(g.prismBeams,3);
 assert.equal(t.hits.length,0,'no front-loaded laser damage');
 t.step(.12);
 assert.equal(t.beamHits().length,1,'first pulse should be visible shortly after spawning');
 assert.equal(t.S.fx.filter(x=>x.type==='beam').length,1);
 assert.equal(t.S.fx.find(x=>x.type==='beam').col,'#8dfde9');
 t.step(2.8);
 assert.equal(t.S.gravityWells.length,0,'well expires instead of persisting indefinitely');
 assert.equal(t.beamHits().length,5,'five balanced beam pulses in one well lifetime');
 const beamDamage=t.beamHits().reduce((n,h)=>n+h.damage,0);
 const baseline=1.5*(32+Math.sqrt(1)*7);
 assert.ok(beamDamage>baseline*2&&beamDamage<baseline*3,'laser damage bounded close to old single-burst budget');
 t.step(1);
 assert.equal(t.beamHits().length,5,'no attacks after expiry');
});

test('prism acquires newly arriving targets during its life; excludes dead and out-of-range enemies',()=>{
 const t=scene(),anchor=foe(100,0),late=foe(650,0),dead=foe(100,0),far=foe(900,0);
 dead.hp=0;t.S.enemy.push(anchor,late,dead,far);t.fire();
 t.step(.3);assert.equal(t.beamHits().filter(h=>h.enemy===late).length,0);
 late.x=125;late.y=22;
 t.step(.5);
 assert.ok(t.beamHits().some(h=>h.enemy===late),'new target is hit by later pulses');
 assert.ok(t.beamHits().every(h=>h.enemy!==dead&&h.enemy!==far),'dead/outside targets never get ray damage');
});

test('splitting upgrade increases targets from 3 to 7, not damage per target, and caps at 7',()=>{
 function count(beams){
  const t=scene(),enemies=Array.from({length:10},(_,i)=>foe(90+i*3,i*2));
  t.S.enemy.push(...enemies);t.fire({beams});t.step(.12);
  return {count:t.beamHits().length,damage:t.beamHits()[0].damage,well:t.S.gravityWells[0]};
 }
 const base=count(0),extra=count(1),max=count(50);
 assert.equal(base.count,3);assert.equal(extra.count,4);assert.equal(max.count,7);
 assert.equal(base.damage,extra.damage,'splitting must not quietly multiply damage per target');
 assert.equal(max.well.prismBeams,7);
});

test('radius expands 16 units per modifier, caps at 210, and changes ray reach',()=>{
 const c=scene(),target=foe(100,0),edge=foe(239,0);
 c.S.enemy=[target,edge];c.fire();
 c.step(.12);
 assert.equal(c.beamHits().filter(h=>h.enemy===edge).length,0);
 c.fire({radius:1});assert.equal(c.S.gravityWells.at(-1).r,116);
 c.step(.12);
 assert.ok(c.beamHits().some(h=>h.enemy===edge),'radius upgrade must reach a newly available foe');
 c.fire({radius:50});assert.equal(c.S.gravityWells.at(-1).r,210);
 assert.equal(c.S.gravityWells.at(-1).prismBeams,3);
});

test('ordinary enemies are pulled, while bosses stay stationary and still receive laser damage',()=>{
 const t=scene(),normal=foe(190,0),boss=foe(200,0,true);
 t.S.enemy.push(normal,boss);t.fire({},foe(100,0));
 const nx=normal.x,bx=boss.x;
 t.step(.8);
 assert.ok(normal.x<nx,'normal enemy pulled toward gravity well');
 assert.equal(boss.x,bx,'boss is not displaced by prism gravity');
 assert.ok(t.beamHits().some(h=>h.enemy===boss),'boss remains vulnerable to prism rays');
});

test('large fire rates cannot accumulate unlimited prism wells or FX rays',()=>{
 const t=scene(),victims=Array.from({length:15},(_,i)=>foe(90+i*2,i*3));
 t.S.enemy.push(...victims);
 for(let i=0;i<25;i++)t.fire({beams:9},victims[i%victims.length]);
 assert.equal(t.S.gravityWells.filter(g=>g.prism).length,8);
 const unrelated={x:-900,y:-900,life:10,r:50,force:0,damage:0,clock:9};
 t.S.gravityWells.push(unrelated);
 t.fire();
 assert.equal(t.S.gravityWells.filter(g=>g.prism).length,8);
 assert.ok(t.S.gravityWells.includes(unrelated),'other gravity weapons remain untouched');
 t.step(.12);
 assert.ok(t.S.fx.length<=160,'visible effects remain bounded');
 assert.ok(t.beamHits().length<=8*7,'one pulse attacks at most 7 targets per active well');
});

test('existing non-prism gravity wells retain their DOT logic',()=>{
 const t=scene(),target=foe(20,0);
 t.S.enemy.push(target);
 t.S.gravityWells.push({x:0,y:0,r:100,force:100,damage:12,life:1.5,clock:.01,col:'#beadff'});
 t.step(.35);
 assert.ok(t.hits.some(h=>h.damage===12),'original periodic well damage preserved');
 assert.equal(t.beamHits().length,0,'ordinary wells must not acquire prism lasers');
});

test('player-facing descriptions and upgrade values match actual mechanics in both languages',()=>{
 const fusion=read('src/modules/10-data/world/fusions.js');
 const catalog=read('src/modules/10-data/weapons/catalog.js');
 const mods=read('src/modules/10-data/weapons/modifiers.js');
 const i18n=read('src/modules/20-core/state/localization.js');
 for(const code of [fusion,catalog])assert.match(code,/2,8 секунды.*0,58 секунды/);
 assert.match(mods,/fusion_prism:.*\+16 к радиусу \(до 210\).*\+1 цель за залп \(до 7\)/);
 assert.match(i18n,/2\.8-second gravity well.*0\.58 seconds/);
 assert.match(i18n,/\+1 target per volley \(up to 7\)/);
 assert.match(read('src/modules/70-render/layers/projectile-effects.js'),/g\.prism\?g\.col/);
});
