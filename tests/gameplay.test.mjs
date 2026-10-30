import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');
const src = [
  'src/modules/10-data/weapons.js',
  'src/modules/10-data/world.js',
  'src/modules/40-game/upgrades.js',
  'src/modules/40-game/weapons-combat.js',
].map(read).join('\n');

function game(initial = {}) {
  const S = {
    drones: [], enemy: [], bosses: [], hybrids: [], fusionCores: 0,
    player: {x: 0, y: 0, hp: 100, maxHp: 100, speed: 100},
    fx: [], lvl: 1, pendingUp: 0, t: 0, ...initial,
  };
  const calls = {choices: [], fusions: [], saves: 0};
  const ctx = vm.createContext({
    S, mode: 'playing', trainingMode: false, TAU: 2 * Math.PI,
    rand: (a, b) => (a + b) / 2,
    save: {recipes: {}}, performance: {now: () => 1000},
    setMode: mode => {ctx.mode = mode;},
    balChoose: choice => calls.choices.push(choice),
    balFusion: id => calls.fusions.push(id),
    persist: () => {calls.saves++;},
    updateHUD() {}, burst() {}, banner() {}, sfx() {},
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
  vm.runInContext(read('src/modules/10-data/world.js')+'\n'+read('src/modules/20-core/state.js'),ctx,{timeout:3000});
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
