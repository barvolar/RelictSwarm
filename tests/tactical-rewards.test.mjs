import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const schedule=read('src/modules/10-data/world/waves.js');
const tactics=read('src/modules/40-game/upgrades/tactics.js');
function context(initial={}){
 const S={t:190,player:{x:0,y:0,hp:60,maxHp:100,inv:0,speed:225},enemy:[],fx:[],bullets:[],tactics:{},tacticFields:[],tacticChoices:[],playerDmg:1,pendingUp:0,...initial};
 const modal={innerHTML:'',querySelectorAll:()=>[]};
 const env={S,mode:'playing',trainingMode:false,last:0,performance:{now:()=>1000},$:(id)=>modal,Math,TEAL:'#fff',BLUE:'#def',
  setMode(x){env.mode=x},updateHUD(){},showUpgrades(){},sfx(){},burst(){},
  heal(n){S.player.hp=Math.min(S.player.maxHp,S.player.hp+n)},
  applyChill(e,n){e.chill=(e.chill||0)+n},
  hurtEnemy(e,n){e.hp-=n},launchBullet(x,y,target,damage){S.bullets.push({target,damage,x,y})},
  closest(x,y,max,except){return S.enemy.find(e=>e!==except&&e.hp>0)||null}
 };
 const ctx=vm.createContext(env);vm.runInContext(schedule+'\n'+tactics,ctx);
 return {ctx,S,run:code=>vm.runInContext(code,ctx)};
}
test('boss pools shuffle independently without repeats and keep the seven encounter times',()=>{
 const c=context();
 assert.deepEqual(Array.from(c.run('BOSS_EVENTS.map(x=>x.t)')),[180,420,660,900]);
 assert.deepEqual(Array.from(c.run('SYNTH_EVENTS.map(x=>x.t)')),[365,550,765]);
 for(let i=0;i<40;i++){
  const ordinary=Array.from(c.run("shuffledBosses('boss')")),synth=Array.from(c.run("shuffledBosses('synth')"));
  assert.equal(new Set(ordinary).size,3);assert.equal(new Set(synth).size,3);
  assert.deepEqual(ordinary.sort(),['boss1','boss2','boss3']);
  assert.deepEqual(synth.sort(),['synth1','synth2','synth3']);
 }
});
test('tactical catalog has 12 unique modules with two separate tiers',()=>{
 const c=context(),catalog=Array.from(c.run('TACTICS'));
 assert.equal(catalog.length,12);
 assert.equal(new Set(catalog.map(x=>x.id)).size,12);
 for(const item of catalog){assert.ok(item.one&&item.two&&item.enOne&&item.enTwo);assert.notEqual(item.one,item.two);}
});
test('reward offer is always three unique modules and contains an owned tier-2 upgrade',()=>{
 const c=context();for(let i=0;i<20;i++){
  const choices=Array.from(c.run('tacticOptions()'));
  assert.equal(choices.length,3);assert.equal(new Set(choices.map(x=>x.id)).size,3);
 }
 c.S.tactics.echo=1;
 for(let i=0;i<20;i++)assert.ok(Array.from(c.run('tacticOptions()')).some(x=>x.id==='echo'));
 c.S.tactics.echo=2;
 assert.ok(Array.from(c.run('tacticOptions()')).every(x=>x.id!=='echo'));
});
test('taking a module never changes weapon inventory',()=>{
 const c=context({drones:[{id:'pulse'}],tacticChoices:[{id:'echo'}]});c.ctx.mode='tactic';
 c.run('chooseTactic(0)');
 assert.equal(c.S.tactics.echo,1);assert.equal(c.S.drones.length,1);
 assert.equal(c.ctx.mode,'playing');
});
test('dash echo hits nearby enemies and resonance produces an extra projectile',()=>{
 const c=context({tactics:{echo:1,resonance:1},enemy:[{x:20,y:0,r:12,hp:80},{x:500,y:0,r:12,hp:80}]});
 c.run('tacticAfterDash()');
 assert.ok(c.S.enemy[0].hp<80);assert.equal(c.S.enemy[1].hp,80);
 for(let i=0;i<6;i++)c.run("tacticWeaponFired({id:'pulse'},{x:0,y:0},S.enemy[0],2)");
 assert.equal(c.S.bullets.length,1);
});
test('marking a target produces a bounded bonus; shield prevents a single hit',()=>{
 const c=context({tactics:{mark:1,shield:1},tacticShieldReady:true});
 assert.equal(c.run('tacticAbsorbHit()'),true);
 assert.equal(c.run('tacticAbsorbHit()'),false);
 const e={hp:100,tacticMarkedUntil:300};
 c.S.enemy=[e];
 assert.ok(Math.abs(c.run('tacticModifyDamage(S.enemy[0],100,{})')-112)<1e-8);
});
