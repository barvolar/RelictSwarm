import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const data=read('src/modules/10-data/world/enemies.js');
const runtime=read('src/modules/20-core/state/runtime.js');

function createSave(old){
 const stored=old===undefined?null:JSON.stringify(old);
 const map=new Map(stored===null?[]:[['relictSwarm_v01_save',stored]]);
 const localStorage={getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value)};
 const ctx=vm.createContext({
  localStorage,innerWidth:480,innerHeight:700,devicePixelRatio:1,
  SKINS:{relict:{},ghost:{}},Math,console
 });
 vm.runInContext("const saveKey='relictSwarm_v01_save';\n"+data+'\n'+runtime,ctx);
 return {ctx,map,run:s=>vm.runInContext(s,ctx)};
}
test('four categories provide exactly 16 affordable long-term upgrade lines',()=>{
 const r=createSave();
 assert.equal(r.run('META.length'),16);
 assert.equal(r.run('META.reduce((n,m)=>n+m.max,0)'),365);
 assert.deepEqual([...r.run('META_GROUPS.map(g=>g.id)')],['hull','weapons','systems','research']);
 assert.equal(r.run('new Set(META.map(m=>m.id)).size'),16);
 for(const group of ['hull','weapons','systems','research']){
  assert.equal(r.run(`META.filter(m=>m.group==='${group}').length`),4);
 }
 for(const key of ['hull','regen','power','magnet']){
  assert.ok(r.run(`META.find(m=>m.id==='${key}').max`)>6);
 }
});
test('older purchased modules and currencies migrate unchanged',()=>{
 const old={shards:830,runs:14,wins:2,best:9200,
   meta:{hull:6,regen:5,power:4,magnet:6},
   recipes:{ion:true},threatUnlocked:3,skin:'ghost',skins:['relict','ghost']};
 const r=createSave(old);
 assert.equal(r.run('save.shards'),830);
 assert.equal(r.run('save.runs'),14);
 assert.equal(r.run('save.wins'),2);
 assert.equal(r.run('save.meta.hull'),6);
 assert.equal(r.run('save.meta.regen'),5);
 assert.equal(r.run('save.meta.power'),4);
 assert.equal(r.run('save.meta.magnet'),6);
 assert.equal(r.run('save.meta.armor'),0);
 assert.equal(r.run('save.recipes.ion'),true);
 assert.equal(r.run('save.threatUnlocked'),3);
 assert.equal(r.run('save.skin'),'ghost');
 r.run('persist()');
 const saved=JSON.parse(r.map.get('relictSwarm_v01_save'));
 assert.equal(saved.meta.hull,6);
 assert.equal(saved.shards,830);
});
test('legacy bonuses stay numerically identical and levels beyond six are diminishing',()=>{
 const r=createSave();
 assert.equal(r.run("metaBonus('hull',6)"),90);
 assert.equal(r.run("metaBonus('power',6)"),.36);
 assert.equal(r.run("metaBonus('magnet',6)"),96);
 assert.equal(r.run("metaBonus('regen',5)"),.6);
 assert.equal(r.run("metaBonus('hull',7)"),97);
 assert.ok(Math.abs(r.run("metaBonus('power',7)")-.372)<1e-9);
 assert.equal(r.run("metaBonus('magnet',7)"),104);
 assert.ok(Math.abs(r.run("metaBonus('regen',6)")-.64)<1e-9);
 assert.equal(r.run("metaBonus('armor',20)"),.08);
 assert.ok(Math.abs(r.run("metaBonus('critChance',20)")-.07)<1e-9);
 assert.equal(r.run("metaBonus('shards',25)"),.5);
});
test('research levels are sanitized and costs increase',()=>{
 const r=createSave({shards:9000,meta:{hull:500,power:-2,armor:'bad',regen:4.9}});
 assert.equal(r.run('save.meta.hull'),30);
 assert.equal(r.run('save.meta.power'),0);
 assert.equal(r.run('save.meta.armor'),0);
 assert.equal(r.run('save.meta.regen'),4);
 assert.equal(r.run("metaLevel('hull')"),30);
 assert.ok(r.run("metaCost(META[0],29)")>r.run("metaCost(META[0],8)"));
 assert.equal(r.run("metaCost(META[0],5)"),85);
});
test('critical research affects ordinary hits but not silent damage-over-time ticks',()=>{
 const ctx=vm.createContext({
   S:{t:12,threat:1,critChance:1,critMultiplier:1.8,player:{x:0,y:0}},
   Math:Object.assign(Object.create(Math),{random:()=>0}),
   bal:null,trainingMode:false,
   balDamage(){},sfx(){},floatNum(){},killEnemy(){},burst(){},banner(){},
   clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
   ENEMY:{scarab:{col:'#fff'}},AMBER:'#ff0',RED:'#f00',
   rand:()=>0,shake:0,console
 });
 vm.runInContext(read('src/modules/40-game/entities/damage-status.js'),ctx);
 ctx.enemy={hp:1000,maxHp:1000,elite:false,id:'scarab',x:10,y:20};
 vm.runInContext('hurtEnemy(enemy,100,{silentHit:true})',ctx);
 assert.equal(ctx.enemy.hp,900);
 vm.runInContext('hurtEnemy(enemy,100,{})',ctx);
 assert.equal(ctx.enemy.hp,720);
});
test('all 16 effects connect to gameplay and purchases do not change existing levels',()=>{
 const start=read('src/modules/40-game/lifecycle/start.js');
 const finish=read('src/modules/40-game/lifecycle/finish.js');
 const shop=read('src/modules/50-ui/pages/shop-and-lab.js');
 const xp=read('src/modules/40-game/entities/player-progression.js');
 const effects=read('src/modules/40-game/entities/fx-pickups.js');
 const movement=read('src/modules/40-game/lifecycle/movement.js');
 const choices=read('src/modules/40-game/upgrades/choices.js');
 const dmg=read('src/modules/40-game/entities/damage-status.js');
 for(const id of ['hull','regen','armor','repair','power','haste','critChance','critDamage','speed','dash','magnet','duration','xp']){
  assert.ok(start.includes(`metaBonus('${id}')`),`missing run bonus: ${id}`);
 }
 for(const id of ['score','shards'])assert.ok(finish.includes(`metaBonus('${id}')`));
 assert.ok(choices.includes("metaBonus('rarity')"));
 assert.ok(xp.includes('S.xpBonus'));
 assert.ok(effects.includes('S.buffDuration'));
 assert.ok(dmg.includes('S.critChance'));
 assert.ok(movement.includes('S.dashCooldown'));
 assert.ok(shop.includes('metaCost(m,n)'));
 assert.ok(shop.includes('save.meta[m.id]=n+1'));
 assert.ok(shop.includes('activeMetaTab'));
});
