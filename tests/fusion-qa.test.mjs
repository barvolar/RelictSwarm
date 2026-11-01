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
