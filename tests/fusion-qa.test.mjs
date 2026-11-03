import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const fusions=read('src/modules/10-data/world/fusions.js');
const specials=read('src/modules/40-game/combat/fusion-attacks.js');
const drone=read('src/modules/40-game/combat/drone-combat.js');
const fields=read('src/modules/40-game/combat/fusion-projectiles.js');
const qa=read('src/modules/40-game/training/pause-qa.js');

test('all 25 syntheses retain combat dispatch, not only database descriptions',()=>{
 const context=vm.createContext({});
 vm.runInContext(fusions+';globalThis.ids=Object.keys(HYBRIDS);',context);
 assert.equal(context.ids.length,25);
 const specialized=new Set(['frostblade','glacier','magnetblade','singularity','inferno','ion','thermal','starfall','predator','tesla']);
 for(const id of context.ids){
  if(specialized.has(id))assert.ok(drone.includes('fusion_'+id),'Missing weapon dispatch: '+id);
  else assert.ok(specials.includes("type==='"+id+"'"),'Missing fusion special: '+id);
 }
});

test('cryogenic fields no longer inherit the old automatic fire damage flag',()=>{
 const S={effects:[],fx:[]};
 const ctx=vm.createContext({S,Math});
 vm.runInContext(fields+';fusionField(3,4,50,12,2,"#adefff",{ice:true,chill:23});',ctx);
 assert.equal(S.effects[0].ice,true);
 assert.equal(S.effects[0].fire,false);
 assert.equal(S.effects[0].chill,23);
 vm.runInContext('fusionField(6,7,50,12,2,"#ff7744",{fire:true});',ctx);
 assert.equal(S.effects[1].fire,true);
 assert.equal(S.effects[1].ice,false);
});

test('frozen enemies shatter once per lockout and can be frozen again',()=>{
 const S={t:10,enemy:[]};let calls=0;
 const ctx=vm.createContext({S,Math,damageArea:()=>{calls++;},burst:()=>{}});
 vm.runInContext(fields,ctx);
 const e={hp:1000,frost:2,x:0,y:0};
 assert.equal(ctx.shatterFrozen(e,80),true);
 assert.equal(e.frost,0);
 assert.equal(calls,1);
 e.frost=2;
 assert.equal(ctx.shatterFrozen(e,80),false);
 assert.equal(calls,1);
 S.t=12;
 assert.equal(ctx.shatterFrozen(e,80),true);
 assert.equal(calls,2);
});

test('qa tools are wired into real pause and cover weapons, bosses, and cores',()=>{
 const pause=read('src/modules/40-game/lifecycle/pause-and-notices.js');
 const ordered=read('src/module-order.json');
 assert.ok(pause.includes('qaPauseHTML()')&&pause.includes('qaWirePause()'));
 assert.ok(ordered.indexOf('training/pause-qa.js')<ordered.indexOf('lifecycle/pause-and-notices.js'));
 for(const name of ['qaEquip','qaBoost','qaSpawn','qaKill','qaCore','qaEnemy','qaWeapon']){
  assert.ok(qa.includes(name),'Missing QA action: '+name);
 }
 const S={drones:[{id:'pulse',lvl:1,mods:{}}],hybrids:[],enemy:[],fusionCores:0};
 const ctx=vm.createContext({S,Math,MAX_WEAPONS:5,DRONES:{pulse:{name:'ЛАЗЕР'},fusion_ion:{name:'ИОННАЯ СЕТЬ'}},ENEMY:{scarab:{name:'СКАРАБЕЙ'},boss1:{name:'БОСС'}},wm:()=>0,weaponBranches:()=>[]});
 vm.runInContext(qa,ctx);
 const rendered=ctx.qaPauseHTML();
 assert.ok(rendered.includes('ИОННАЯ СЕТЬ')&&rendered.includes('БОСС'));
});

test('QA stand-alone build embeds optional telemetry rather than relying on sibling scripts',()=>{
 const html=read('dist/index.html');
 assert.ok(html.includes('<!-- telemetry-client.js embedded for standalone QA -->'));
 assert.ok(html.includes('qaPauseHTML()'));
 assert.ok(!html.includes('src="./telemetry-client.js"'));
 assert.ok(!html.includes('src="./telemetry-config.js"'));
});


test('ion fusion raises chain damage per jump and applies a real target marker',()=>{
 const src=read('src/modules/40-game/combat/targeting-and-chains.js');
 const first={x:30,y:0,hp:1000},second={x:80,y:0,hp:1000},third={x:130,y:0,hp:1000};
 const hits=[];const S={enemy:[first,second,third],chains:[],fx:[]};
 const ctx=vm.createContext({S,touching:false,Math,PURPLE:'#b59cff',
  sfx(){},burst(){},rand(){return 0;},hurtEnemy(e,n){hits.push(n);}});
 vm.runInContext(src,ctx);
 ctx.scheduleChain({x:0,y:0},first,3,100,220,'#d5afff',.18,1.08);
 for(let i=0;i<3;i++)ctx.updateChains(.1);
 assert.equal(hits.length,3);
 assert.ok(hits[1]>hits[0]&&hits[2]>hits[1],'ion chain grows on consecutive hops');
 assert.ok(drone.includes('target.marked=Math.max(target.marked||0,3.5)'),'ion target is actually marked');
});

test('polar residue chills, rail plasma ignites, and base plasma burns',()=>{
 const S={enemy:[],fx:[],effects:[],gravityWells:[],player:{x:0,y:0},t:0};
 const ctx=vm.createContext({S,Math,TAU:Math.PI*2,
  wm:(d,k)=>d.mods?.[k]||0,
  DRONES:{fusion_polar:{color:'#adefff'},fusion_railplasma:{color:'#b5caff'}},
  fusionLine:()=>({origin:{x:0,y:0},a:{dx:1,dy:0},hits:[{x:100,y:0,hp:1000}]}),
  fusionField:(x,y,r,damage,life,col,opts={})=>S.effects.push({x,y,r,damage,life,col,fire:!!opts.fire,ice:!!opts.ice,chill:opts.chill||0}),
  shatterFrozen(){},applyChill(){},burst(){}});
 vm.runInContext(specials,ctx);
 ctx.fireFusionSpecial({id:'fusion_polar',mods:{}},{x:0,y:0},{x:200,y:0},1,3);
 assert.equal(S.effects.length,4);
 assert.ok(S.effects.every(e=>e.ice===true&&e.fire===false&&e.chill>0));
 S.effects=[];S.fx=[];
 ctx.fireFusionSpecial({id:'fusion_railplasma',mods:{}},{x:0,y:0},{x:200,y:0},1,3);
 assert.equal(S.effects.length,1);
 assert.equal(S.effects[0].fire,true);
 assert.ok(drone.includes('col:BLUE,fire:true'),'base plasma fire effect is restored');
});

test('displayed fusion names agree between the forge and equipped weapon HUD',()=>{
 const ctx=vm.createContext({});
 vm.runInContext(fusions+'\n'+read('src/modules/10-data/weapons/catalog.js')+
 ';globalThis.mismatched=Object.entries(HYBRIDS).filter(([id,h])=>h.name!==DRONES["fusion_"+id].name).map(([id])=>id)',ctx);
 assert.deepEqual(Array.from(ctx.mismatched),[]);
});


test('shatter quota prevents overlapping AoE cascades in packed crowds',()=>{
 const S={t:3,enemy:[]};let explosions=0;
 const ctx=vm.createContext({S,Math,damageArea:()=>{explosions++;},burst:()=>{}});
 vm.runInContext(fields,ctx);
 const frozen=Array.from({length:12},()=>({hp:1000,frost:2,x:0,y:0}));
 for(const e of frozen)ctx.shatterFrozen(e,30);
 assert.equal(explosions,3,'at most three area shatters per quarter second');
 S.t+=.26;
 for(const e of frozen)ctx.shatterFrozen(e,30);
 assert.equal(explosions,6,'quota refreshes, allowing a later shatter wave');
});

test('thermoshock does not scale as a quadratic number of area explosions',()=>{
 const enemies=Array.from({length:25},(_,i)=>({x:70+i*2,y:0,r:12,hp:1000,frost:2,burn:0}));
 const S={t:0,enemy:enemies,fx:[]};let waves=0,contacts=0;
 const ctx=vm.createContext({S,Math,TAU:Math.PI*2,DRONES:{fusion_thermoshock:{color:'#ffbb77'}},
  wm:()=>0,aimGeometry:()=>({dx:1,dy:0}),damageArea:()=>{waves++;},
  hurtEnemy:()=>{contacts++;}});
 vm.runInContext(specials,ctx);
 assert.equal(ctx.fireFusionSpecial({id:'fusion_thermoshock',shockCycle:1,mods:{}},
  {x:0,y:0},{x:100,y:0},1,8),true);
 assert.equal(waves,3);
 assert.equal(contacts,25,'all enemies in the cone still receive direct damage');
});

test('glacial blades emit bounded freezing wakes instead of recoloured saws',()=>{
 assert.ok(drone.includes('frostBladeWake'));
 assert.ok(drone.includes('frostBladeWake).length<18'));
 assert.ok(drone.includes('ice:true,chill:16'));
});
