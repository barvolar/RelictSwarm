import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {selectCombatTarget} from '../src/domain/targeting.mjs';
import {eligibleFusionIds} from '../src/domain/fusion-rules.mjs';
import {calculateBossDamage} from '../src/domain/boss-damage.mjs';
import {calculateWeaponDamage} from '../src/domain/weapon-damage.mjs';
import {calculateWeaponCooldown} from '../src/domain/weapon-cooldown.mjs';
import {createFusionWeapon} from '../src/domain/fusion-transfer.mjs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');
const sourceOrder = JSON.parse(read('src/module-order.json'));
const sourceAliases = {
  'src/modules/40-game/weapons-combat.js':'src/modules/40-game/combat/',
  'src/modules/40-game/entities.js':'src/modules/40-game/entities/',
  'src/modules/40-game/upgrades.js':'src/modules/40-game/upgrades/',
  'src/modules/40-game/bosses-enemies.js':'src/modules/40-game/enemies/',
};
const sourceFor = original => {
  // Resolve a legacy source path to its ordered sub-files as the refactor progresses.
  const prefix = sourceAliases[original] || original.replace(/\.js$/, '/');
  const files = sourceOrder.filter(path => path === original || path.startsWith(prefix));
  if (!files.length) throw new Error('Missing source module: ' + original);
  return files.map(read).join('');
};
const src = [
  'src/modules/10-data/weapons.js',
  'src/modules/10-data/world.js',
  'src/modules/40-game/upgrades.js',
  'src/modules/40-game/weapons-combat.js',
  'src/modules/40-game/entities.js',
].map(sourceFor).join('\n');

function game(initial = {}) {
  const S = {
    drones: [], enemy: [], bosses: [], hybrids: [], fusionCores: 0,
    player: {x: 0, y: 0, hp: 100, maxHp: 100, speed: 100},
    fx: [], parts: [], floaters: [], lvl: 1, pendingUp: 0, t: 0, ...initial,
  };
  const calls = {choices: [], fusions: [], saves: 0};
  const ctx = vm.createContext({
    S, selectCombatTarget, eligibleFusionIds, calculateBossDamage, calculateWeaponDamage, calculateWeaponCooldown, createFusionWeapon, bal: null, mode: 'playing', trainingMode: false, TAU: 2 * Math.PI,
    rand: (a, b) => (a + b) / 2,
    save: {recipes: {}}, performance: {now: () => 1000},
    setMode: mode => {ctx.mode = mode;},
    balChoose: choice => calls.choices.push(choice),
    balFusion: id => calls.fusions.push(id),
    persist: () => {calls.saves++;},
    updateHUD() {}, burst() {}, banner() {}, sfx() {}, balDamage() {}, floatNum() {},
    showUpgrades() {},
    heal: n => {S.player.hp = Math.min(S.player.maxHp, S.player.hp + n);},
  });
  vm.runInContext(src, ctx, {timeout: 3000, filename: 'gameplay-source.js'});
  return {S, ctx, calls, run: code => vm.runInContext(code, ctx, {timeout: 3000})};
}

test('weapon and fusion databases have valid references', () => {
  const g = game();
  assert.equal(g.run('BASE_WEAPONS.length'), 11);
  assert.equal(g.run('Object.keys(HYBRIDS).length'), 25);
  const bad = g.run('Object.entries(HYBRIDS).filter(([id,h])=> !BASE_WEAPONS.includes(h.a)||!BASE_WEAPONS.includes(h.b)||h.a===h.b||!DRONES["fusion_"+id]||!WEAPON_MODS["fusion_"+id]).map(([id])=>id)');
  assert.deepEqual(Array.from(bad), []);
  const invalidBranches = g.run('Object.entries(DRONES).filter(([id])=>WEAPON_MODS[id]?.length!==4 || new Set(WEAPON_MODS[id].map(b=>b[0])).size!==4).map(([id])=>id)');
  assert.deepEqual(Array.from(invalidBranches), []);
  assert.equal(g.run('RARITIES.reduce((sum,r)=>sum+r.chance,0)'), 100);
  assert.equal(g.run('BOSS_EVENTS.at(-1).t===RUN_DURATION'), true);
  assert.equal(g.run('BOSS_EVENTS.concat(SYNTH_EVENTS).every(e=>!!ENEMY[e.id])'), true);
  assert.equal(g.run('RAID_EVENTS.every(e=>e.units.every(([id])=>!!ENEMY[id]))'), true);
});

test('rarity thresholds are stable', () => {
  const g = game();
  for (const [roll, expected] of [
    [0, 'common'], [59.9, 'common'], [60.1, 'uncommon'],
    [86.9, 'uncommon'], [87.1, 'rare'], [97.1, 'epic'],
  ]) {
    g.ctx.rand = () => roll;
    assert.equal(g.run('rarityRoll().id'), expected);
  }
});

test('no sixth weapon can be offered or installed', () => {
  const g = game();
  g.S.drones = ['pulse','arc','saw','rocket','plasma'].map(id=>({id,lvl:1,mods:{}}));
  for(let i=0;i<10;i++) {
    const options = g.run('upgradeChoices()');
    assert.ok(Array.from(options).every(o => o.kind !== 'new'));
  }
  g.S.pendingUp = 1;
  g.S.upgrades = [{kind:'new',id:'rail'}];
  g.ctx.mode = 'upgrade';
  g.run('chooseUpgrade(0)');
  assert.equal(g.S.drones.length, 5);
  assert.equal(g.S.pendingUp, 1);
});

test('level-up adds a weapon then increases level and modifiers', () => {
  const g = game();
  g.S.pendingUp = 1;
  g.S.upgrades = [{kind:'new',id:'pulse'}];
  g.ctx.mode = 'upgrade';
  g.run('chooseUpgrade(0)');
  assert.equal(g.S.drones[0].id, 'pulse');
  assert.equal(g.S.drones[0].lvl, 1);
  g.S.pendingUp = 1;
  g.S.upgrades = [{kind:'weapon',id:'pulse',keys:['power','rate'],rarity:{name:'НЕОБЫЧНАЯ',steps:2,col:'#fff'}}];
  g.ctx.mode = 'upgrade';
  g.run('chooseUpgrade(0)');
  assert.equal(g.S.drones[0].lvl, 2);
  assert.equal(g.S.drones[0].mods.power, 1);
  assert.equal(g.S.drones[0].mods.rate, 1);
  assert.equal(g.calls.choices.length, 2);
});

test('fusion requires a core, both ingredients and an available fusion slot', () => {
  const g = game();
  g.S.drones = [{id:'pulse'}, {id:'rail'}];
  assert.equal(g.run('eligibleHybrids().includes("spear")'), false);
  g.S.fusionCores = 1;
  assert.equal(g.run('eligibleHybrids().includes("spear")'), true);
  g.S.drones.pop();
  assert.equal(g.run('eligibleHybrids().includes("spear")'), false);
  g.S.drones.push({id:'rail'});
  g.S.hybrids = [{id:'ion'}, {id:'glacier'}, {id:'tesla'}];
  assert.equal(g.run('eligibleHybrids().length'), 0);
});

test('fusion replaces inputs, consumes one core and transfers levels', () => {
  const g = game({
    fusionCores:1, drones: [
      {id:'pulse',lvl:4,mods:{power:3,rate:2}},
      {id:'rail',lvl:6,mods:{power:2,rate:1}},
      {id:'saw',lvl:1,mods:{}},
    ],
  });
  g.ctx.mode = 'forge';
  g.run('forgeHybrid("spear")');
  assert.deepEqual(g.S.drones.map(d=>d.id), ['saw','fusion_spear']);
  assert.equal(g.S.drones[1].lvl, 5);
  assert.equal(g.S.drones[1].mods.power, 3);
  assert.equal(g.S.drones[1].mods.rate, 1);
  assert.equal(g.S.fusionCores, 0);
  assert.equal(g.ctx.save.recipes.spear, true);
  assert.deepEqual(g.calls.fusions, ['spear']);
  assert.equal(g.calls.saves, 1);
  assert.equal(g.ctx.mode, 'playing');
});

test('ranged weapons prefer bosses except when danger is immediate', () => {
  const g = game();
  const boss = {id:'boss1',x:260,y:0,hp:100,elite:true};
  const small = {id:'scarab',x:150,y:0,hp:20};
  g.S.enemy = [small,boss];
  g.S.bosses = [boss];
  assert.equal(g.run('chooseCombatTarget(0,0,550,"pulse")'), boss);
  small.x=80;
  assert.equal(g.run('chooseCombatTarget(0,0,550,"pulse")'), small);
  small.x=150;
  assert.equal(g.run('chooseCombatTarget(0,0,550,"flame")'), small);
  g.ctx.trainingMode=true;
  assert.equal(g.run('chooseCombatTarget(0,0,550,"pulse")'), small);
  g.ctx.trainingMode=false;
  boss.x=650;
  assert.equal(g.run('chooseCombatTarget(0,0,550,"pulse")'), small);
});

test('saw count is limited and coordinates remain finite', () => {
  const g = game({t:12,drones:[{id:'saw'}]});
  const positions = g.run('sawPositions({mods:{count:500,radius:500,spin:500}},0)');
  assert.equal(positions.length,10);
  for (const p of positions) {
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.a));
    assert.ok(Math.hypot(p.x,p.y) <= 311);
  }
});

test('loading older save filters invalid skins, records and threat', () => {
  const stored = new Map();
  const ctx = vm.createContext({
    localStorage: {
      getItem: key => stored.get(key) ?? null,
      setItem: (key,value) => stored.set(key,value),
    },
    innerWidth:390,innerHeight:844,devicePixelRatio:3,
    C:{style:{}},cx:{setTransform(){}},window:{},
    matchMedia:()=>({matches:false}),addEventListener(){},
  });
  vm.runInContext(sourceFor('src/modules/10-data/world.js')+'\n'+sourceFor('src/modules/20-core/state.js'),ctx,{timeout:3000});
  assert.equal(vm.runInContext('save.threatUnlocked',ctx),1);
  assert.deepEqual(Array.from(vm.runInContext('save.skins',ctx)),['relict','ghost']);
  stored.set('relictSwarm_v01_save',JSON.stringify({
    skins:['void','invalid','void'],skin:'invalid',threatUnlocked:99,
    records:[{score:17},{score:'not-a-number'}],meta:{hull:3},
  }));
  const save = vm.runInContext('readSave()',ctx);
  assert.equal(save.threatUnlocked,5);
  assert.equal(save.skin,'relict');
  assert.deepEqual(Array.from(save.skins),['relict','ghost','void']);
  assert.equal(save.records.length,1);
  assert.equal(save.meta.hull,3);
  stored.set('relictSwarm_v01_save','{invalid json');
  assert.equal(vm.runInContext('readSave().runs',ctx),0);
});


test('independent ES targeting module has no dependency on the game runtime', () => {
  const boss={id:'boss1',x:240,y:0,hp:100,elite:true};
  const nearby={id:'scarab',x:150,y:0,hp:12};
  assert.equal(selectCombatTarget(nearby,[boss],0,0,550,'pulse',false),boss);
  nearby.x=60;
  assert.equal(selectCombatTarget(nearby,[boss],0,0,550,'pulse',false),nearby);
  nearby.x=150;
  assert.equal(selectCombatTarget(nearby,[boss],0,0,550,'flame',false),nearby);
  assert.equal(selectCombatTarget(nearby,[boss],0,0,550,'pulse',true),nearby);
  assert.equal(selectCombatTarget(null,[boss],0,0,550,'pulse',false),null);
});


test('independent ES fusion module guards recipes and limit', () => {
  const recipes={spear:{a:'pulse',b:'rail'},ion:{a:'pulse',b:'arc'}};
  const state={fusionCores:1,hybrids:[],drones:[{id:'pulse'},{id:'rail'}]};
  assert.deepEqual(eligibleFusionIds(state,recipes),['spear']);
  state.drones.push({id:'arc'});
  assert.deepEqual(eligibleFusionIds(state,recipes),['spear','ion']);
  state.hybrids=[{id:'spear'}];
  assert.deepEqual(eligibleFusionIds(state,recipes),['ion']);
  state.fusionCores=0;
  assert.deepEqual(eligibleFusionIds(state,recipes),[]);
  state.fusionCores=1;
  state.hybrids=[{id:'a'},{id:'b'},{id:'c'}];
  assert.deepEqual(eligibleFusionIds(state,recipes),[]);
});

test('weapon damage formula matches base, upgrades, rank and rage', () => {
 assert.equal(calculateWeaponDamage(25,1,0,false),25);
 assert.equal(calculateWeaponDamage(25,1,2,false),35);
 assert.equal(calculateWeaponDamage(25,1,2,true),73.5);
 const rank=10,power=5,player=3;
 const expected=player*(1+Math.sqrt(rank-1)*.14)*(1+power*.20)*2.1;
 assert.equal(calculateWeaponDamage(player,rank,power,true),expected);
});

test('boss caps respect type, shield and difficulty independently of the game loop', () => {
 const base={id:'omega',shield:0,damageSecond:0,damageSecondAt:10};
 const hit=calculateBossDamage(base,500,10.2,1);
 assert.equal(hit.damage,340);
 assert.equal(hit.blockedByHitCap,160);
 assert.equal(hit.blockedByShield,0);
 assert.equal(hit.blockedByDpsCap,0);
 assert.equal(base.damageSecond,0, 'pure math must not mutate enemy');
 assert.equal(calculateBossDamage({...base,id:'synth2'},500,10.2,1).damage,190);
 const shield=calculateBossDamage({...base,shield:1},100,10.2,1);
 assert.equal(shield.damage,27);
 assert.equal(shield.blockedByShield,73);
 const hard=calculateBossDamage({...base,damageSecond:1300},500,10.2,2);
 assert.equal(hard.damage,338, 'difficulty II raises the omega 1-second budget');
});

test('boss one-second damage budget resets at window boundary', () => {
 let enemy={id:'omega',shield:0,damageSecond:0,damageSecondAt:10};
 for(let i=0;i<4;i++) {
  const result=calculateBossDamage(enemy,500,10.2,1);
  Object.assign(enemy,{damageSecond:result.damageSecond,damageSecondAt:result.damageSecondAt});
  assert.equal(result.damage,340);
 }
 const capped=calculateBossDamage(enemy,500,10.3,1);
 assert.equal(capped.damage,40);
 enemy.damageSecond=capped.damageSecond;
 assert.equal(calculateBossDamage(enemy,500,10.4,1).damage,0);
 const reset=calculateBossDamage(enemy,500,11.2,1);
 assert.equal(reset.damage,340);
 assert.equal(reset.damageSecondAt,11.2);
});

test('hurtEnemy integrates pure boss caps with analytics counters', () => {
 const g=game({threat:1,t:10,playerDmg:1});
 const boss={id:'omega',hp:20000,maxHp:20000,elite:true,shield:0,balId:'boss-1',x:300,y:0};
 g.S.enemy=[boss];
 const record={id:'boss-1',blockedByHitCap:0,blockedByShield:0,blockedByDpsCap:0};
 g.ctx.bal={bosses:[record],totals:{bossDamageBlocked:0}};
 for(let i=0;i<5;i++)g.run('hurtEnemy(S.enemy[0],500,{silentHit:true})');
 assert.equal(boss.hp,18600);
 assert.equal(boss.damageSecond,1400);
 assert.equal(record.blockedByHitCap,800);
 assert.equal(record.blockedByDpsCap,300);
 assert.equal(g.ctx.bal.totals.bossDamageBlocked,1100);
 g.S.t=11.2;
 g.run('hurtEnemy(S.enemy[0],500,{silentHit:true})');
 assert.equal(boss.hp,18260);
 assert.equal(boss.damageSecond,340);
});

test('cooldown keeps base pace and compensates extremely high firing speed', () => {
 const original=calculateWeaponCooldown(1.5,1,0,1);
 assert.equal(original.cooldown,1.5);
 assert.equal(original.attackOverflow,1);
 const haste=1.6,rank=20,levels=8,base=1.8;
 const raw=base/(haste*(1+Math.log1p(levels)*.40)*(1+Math.log1p(rank-1)*.16));
 const boosted=calculateWeaponCooldown(base,haste,levels,rank);
 assert.equal(boosted.cooldown,Math.max(.19,raw));
 assert.equal(boosted.attackOverflow,Math.max(1,.19/Math.max(.0001,raw)));
 const extreme=calculateWeaponCooldown(.5,4,200,500);
 assert.equal(extreme.cooldown,.19);
 assert.ok(extreme.attackOverflow>1);
});

test('fusion output transfers only matching branches without mutating inputs', () => {
 const a={id:'pulse',lvl:7,mods:{power:5,rate:3,pierce:9}};
 const b={id:'rail',lvl:10,mods:{power:4,rate:6,width:20}};
 const output=createFusionWeapon('spear',a,b,[['power'],['rate'],['beams']]);
 assert.deepEqual(output,{id:'fusion_spear',lvl:8,mods:{power:5,rate:5,beams:0},cd:.2,hitCd:0});
 assert.deepEqual(a.mods,{power:5,rate:3,pierce:9});
 assert.deepEqual(b.mods,{power:4,rate:6,width:20});
 const minimum=createFusionWeapon('polar',{lvl:1,mods:{}},{lvl:1,mods:{}},[['freeze']]);
 assert.equal(minimum.lvl,1);
 assert.equal(minimum.mods.freeze,0);
});

test('production HTML remains standalone with inline domain rules', () => {
 const html=read('dist/index.html');
 for(const fn of ['selectCombatTarget','eligibleFusionIds','calculateBossDamage','calculateWeaponDamage','calculateWeaponCooldown','createFusionWeapon']){
  assert.match(html,new RegExp('function '+fn+'\\('));
  assert.doesNotMatch(html,new RegExp('export function '+fn+'\\('));
 }
 assert.ok(html.includes('telemetry-client.js'));
});
