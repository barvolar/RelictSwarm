import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import {calculateWeaponCooldown} from '../src/domain/weapon-cooldown.mjs';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('rage gives +45% attack speed without replacing its existing damage buff',()=>{
 const src=read('src/modules/40-game/combat/drone-combat.js');
 assert.ok(src.includes("const haste=(S.haste||1)*(S.rageTimer>0?1.45:1)"));
 assert.ok(src.includes("S.rageTimer>0?1.45:1"));
 assert.ok(src.includes("calculateWeaponDamage(S.playerDmg,rank,wm(d,'power'),S.rageTimer>0)"));
 const normal=calculateWeaponCooldown(.8,1,0,1).cooldown;
 const rage=calculateWeaponCooldown(.8,1.45,0,1).cooldown;
 assert.ok(rage<normal);
 assert.ok(Math.abs(rage/normal-1/1.45)<1e-10);
});

test('time stop pickup triggers 4.5 seconds of freeze',()=>{
 const S={buffDuration:1,challengeStats:{powerupsTaken:0,coresCollected:0},
  player:{x:0,y:0,hp:50,maxHp:100},parts:[],pickups:[],rageTimer:0,timeStopTimer:0,invulnTimer:0};
 const ctx=vm.createContext({S,Math,TAU:2*Math.PI,AMBER:'#ffb84f',TEAL:'#5ffaca',BLUE:'#8dbfff',
  rand:(a,b)=>(a+b)/2,clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),
  toast(){},banner(){},sfx(){}});
 vm.runInContext(read('src/modules/40-game/entities/fx-pickups.js'),ctx);
 ctx.applyPowerup({type:'rage'});
 assert.equal(S.rageTimer,13);
 ctx.applyPowerup({type:'timeStop'});
 assert.equal(S.timeStopTimer,4.5);
 ctx.applyPowerup({type:'core'});
});

test('actual hostile projectiles remain stationary, friendly projectiles still tick',()=>{
 const S={timeStopTimer:3,bullets:[],enemyBullets:[{x:100,y:0,vx:120,vy:0,life:5,r:4,dmg:5}],effects:[],chains:[],fx:[],
  enemy:[],player:{x:0,y:0,rad:17},parts:[]};
 const ctx=vm.createContext({S,Math,RED:'#f00',
  updateChains(){},burst(){},sfx(){},hurtEnemy(){}});
 vm.runInContext(read('src/modules/40-game/combat/projectiles.js'),ctx);
 ctx.updateProjectiles(.2);
 assert.equal(S.enemyBullets[0].x,100);
 assert.equal(S.enemyBullets[0].life,5);
 S.timeStopTimer=0;
 ctx.updateProjectiles(.2);
 assert.equal(S.enemyBullets[0].x,124);
 assert.ok(S.enemyBullets[0].life<5);
});

test('freeze preserves enemy AI, hazards, boss scheduling and spawns but not player movement',()=>{
 const S={t:1,spawn:1,timeStopTimer:2,
  rageTimer:0,invulnTimer:0,magnetTimer:0,powerupClock:90,
  player:{x:0,y:0,inv:0,hit:0,dashCd:0,dashTime:0,dx:0,dy:-1,speed:100,regen:0},
  cam:{x:0,y:0},threat:1,bosses:[],raidFlags:[],bossFlags:[],synthFlags:[],clock:50};
 const count={enemies:0,hazards:0,projectiles:0,drops:0};
 const ctx=vm.createContext({S,Math,mode:'playing',trainingMode:false,shake:0,
  getInput:()=>({x:1,y:0}),hypot:(x,y)=>Math.hypot(x,y)||1,
  clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),lerp:(a,b,t)=>a+(b-a)*t,
  rand:(a,b)=>(a+b)/2,RAID_EVENTS:[],BOSS_EVENTS:[],SYNTH_EVENTS:[],
  THREAT_MODES:[{name:'I'}],
  showToastUntil:1000,showBannerUntil:1000,
  $:()=>({classList:{add(){},remove(){}},style:{}}),
  droneUpdate(){},tacticUpdate(){},updateHybridCombat(){},updateAreaWeapons(){},
  updateProjectiles(){count.projectiles++},
  updateEnemies(){count.enemies++},updateHazards(){count.hazards++},
  updateDrops(){count.drops++},balTick(){},updateHUD(){}});
 vm.runInContext(read('src/modules/40-game/update/simulation.js'),ctx);
 ctx.update(.2);
 assert.equal(S.timeStopTimer,1.8);
 assert.equal(S.player.x,20);
 assert.equal(S.spawn,1,'enemy spawn clock is stopped');
 assert.deepEqual(count,{enemies:0,hazards:0,projectiles:1,drops:1});
 S.timeStopTimer=0;
 ctx.update(.2);
 assert.equal(count.enemies,1);
 assert.equal(count.hazards,1);
 assert.equal(S.spawn,.8);
});

test('rarest bonus rate is lower but includes stasis in five-way pool',()=>{
 const src=read('src/modules/40-game/entities/fx-pickups.js');
 const start=read('src/modules/40-game/lifecycle/start.js');
 const sim=read('src/modules/40-game/update/simulation.js');
 const death=read('src/modules/40-game/entities/deaths.js');
 const pickup=read('src/modules/70-render/layers/pickups.js');
 assert.ok(src.includes("'heal','timeStop'"));
 assert.ok(start.includes('powerupClock:rand(45,60)'));
 assert.ok(sim.includes('S.powerupClock=rand(60,85)'));
 assert.ok(death.includes('Math.random()<.065)spawnPowerup'));
 assert.ok(death.includes('Math.random()<.007'));
 assert.ok(pickup.includes("timeStop:'❄'"));
 assert.ok(read('src/modules/40-game/training/pause-qa.js').includes("id=\"qaTimeStop\""));
});
