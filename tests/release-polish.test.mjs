import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');

function fusionHarness(){
 const S={enemy:[
  {x:350,y:-30,hp:100000,r:14},
  {x:350,y:0,hp:100000,r:14},
  {x:350,y:30,hp:100000,r:14}
 ],fx:[],effects:[],bullets:[],t:0};
 const hits=[];
 const ctx=vm.createContext({
  S,Math,TAU:Math.PI*2,
  DRONES:{fusion_polar:{color:'#a6f4ff'},fusion_spear:{color:'#f8dea0'}},
  wm:(d,key)=>d.mods?.[key]||0,
  aimGeometry:(p,t)=>{const dx=t.x-p.x,dy=t.y-p.y,len=Math.hypot(dx,dy)||1;return {dx:dx/len,dy:dy/len};},
  weaponMuzzle:(p,t,offset=0,length=0)=>({x:p.x+length,y:p.y+offset}),
  pointSegmentDist:(px,py,x0,y0,x1,y1)=>{
   const dx=x1-x0,dy=y1-y0;
   const t=Math.max(0,Math.min(1,((px-x0)*dx+(py-y0)*dy)/(dx*dx+dy*dy||1)));
   return Math.hypot(px-x0-t*dx,py-y0-t*dy);
  },
  hurtEnemy:(e,dmg)=>{e.hp-=dmg;hits.push({y:e.y,damage:dmg})},
  closest:()=>null,
  launchBullet:()=>{},
  damageArea:()=>{},
  applyChill:()=>{},
  burst:()=>{},
  Math,console
 });
 vm.runInContext(read('src/modules/40-game/combat/fusion-projectiles.js')+'\n'+read('src/modules/40-game/combat/fusion-attacks.js'),ctx);
 return {S,hits,ctx,fire:(type,beams)=>ctx.fireFusionSpecial({id:'fusion_'+type,mods:{beams}}, {x:0,y:0},{x:350,y:0},1,4)};
}
test('polar splitting produces visibly separate rays and damages additional lanes',()=>{
 const baseline=fusionHarness();
 assert.equal(baseline.fire('polar',0),true);
 assert.equal(baseline.S.fx.filter(f=>f.type==='rail').length,1);
 assert.deepEqual([...new Set(baseline.hits.map(h=>h.y))],[0]);
 const multiple=fusionHarness();
 assert.equal(multiple.fire('polar',2),true);
 const rails=multiple.S.fx.filter(f=>f.type==='rail');
 assert.equal(rails.length,3);
 assert.deepEqual(rails.map(f=>f.a.y),[-30,0,30]);
 assert.deepEqual([...new Set(multiple.hits.map(h=>h.y))].sort((a,b)=>a-b),[-30,0,30]);
 assert.equal(multiple.S.effects.length,12);
 const maxed=fusionHarness();maxed.fire('polar',50);
 assert.equal(maxed.S.fx.filter(f=>f.type==='rail').length,5,'max 5 separate rays');
});
test('ion spear splitting grows rays instead of granting a dead upgrade',()=>{
 const one=fusionHarness();one.fire('spear',0);
 const three=fusionHarness();three.fire('spear',2);
 assert.equal(one.S.fx.filter(f=>f.type==='rail').length,1);
 assert.equal(three.S.fx.filter(f=>f.type==='rail').length,3);
 assert.deepEqual(three.S.fx.filter(f=>f.type==='rail').map(f=>f.a.y),[-30,0,30]);
 assert.deepEqual([...new Set(three.hits.map(h=>h.y))].sort((a,b)=>a-b),[-30,0,30]);
});
test('player audio settings have only volume sliders; sound laboratory requires developer URL',()=>{
 const ctx=vm.createContext({
  audioSettings:{sfx:.7,music:.3,on:true},
  URLSearchParams,
  location:{search:''},
  BASE_WEAPONS:['pulse','cryo'],
  DRONES:{pulse:{name:'ЛАЗЕР',glyph:'~'},cryo:{name:'КРИО',glyph:'❄'}},
  Math
 });
 vm.runInContext(read('src/modules/30-audio/engine/mixer.js'),ctx);
 const normal=ctx.audioMixerHTML();
 assert.ok(normal.includes('sfxVolume'));
 assert.ok(normal.includes('musicVolume'));
 assert.ok(normal.includes('НАСТРОЙКИ ЗВУКА'));
 for(const id of ['data-sound-test','musicMenuPreview','musicCombatPreview','audioPreview','flamePreview'])assert.ok(!normal.includes(id),'developer-only '+id);
 ctx.location.search='?dev=1';
 const debug=ctx.audioMixerHTML();
 assert.ok(debug.includes('data-sound-test'));
 assert.ok(debug.includes('musicMenuPreview'));
 assert.ok(debug.includes('flamePreview'));
});
test('cryo upgrade has readable damage bonus and sane break point',()=>{
 const ctx=vm.createContext({
  S:{drones:[{id:'cryo',lvl:3,mods:{chill:1}}]},
  DRONES:{cryo:{name:'КРИОИЗЛУЧАТЕЛЬ',glyph:'❄'}},
  MAX_WEAPONS:5,
  weaponBranches:()=>[['chill','НАКОПЛЕНИЕ','+1 холод']],
  wm:(d,key)=>d.mods[key]||0,
  Math
 });
 vm.runInContext(read('src/modules/40-game/upgrades/cards.js'),ctx);
 const rows=ctx.weaponBonusRows('cryo','chill',ctx.S.drones[0]);
 assert.equal(rows[1].label,'Доп. урон по охлаждённым');
 assert.ok(rows[1].value.endsWith('%'));
 assert.ok(!rows[1].value.includes('п.п.'));
 const html=ctx.upgradeCardHtml({kind:'new',id:'cryo'},0);
 assert.ok(html.includes('КРИО<wbr>ИЗЛУЧАТЕЛЬ'));
 assert.ok(html.includes('Занимает слот'));
});
test('enemy hazard warning is red and boss warning cannot share healthbar placement',()=>{
 const danger=read('src/modules/40-game/enemies/hazards.js');
 assert.ok(danger.includes("'#ff6779'"));
 assert.ok(danger.includes("'#ff6475'"));
 assert.ok(danger.includes('h.delay<.32'));
 const css=read('src/styles/sections/controls-and-diagnostics.css');
 assert.ok(css.includes('#hud .boss-track>div'));
 assert.ok(css.includes('#hud .wavebanner'));
 assert.ok(css.includes('top:152px'));
 assert.ok(css.includes('top:calc(192px'));
 const code=read('src/modules/40-game/update/simulation.js');
 assert.ok(code.includes('bossPct=clamp('));
});
