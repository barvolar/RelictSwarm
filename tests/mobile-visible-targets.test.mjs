import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {selectCombatTarget} from '../src/domain/targeting.mjs';

const source=fs.readFileSync(new URL('../src/modules/40-game/combat/targeting-and-chains.js',import.meta.url),'utf8');
function runTargeting({touching=true,W=390,H=844,cam={x:0,y:0},zoom=.64,enemies=[],bosses=[],weapon='pulse',from={x:250,y:0}}={}){
 const S={enemy:enemies,bosses,cam,t:1,tacticBossLockUntil:0};
 const ctx=vm.createContext({Math,console,touching,W,H,S,trainingMode:false,
  tacticLv:()=>0,arenaZoom:()=>zoom,selectCombatTarget});
 vm.runInContext(source,ctx,{timeout:2000});
 ctx.from=from;ctx.weapon=weapon;
 return {ctx,S,result:vm.runInContext('chooseCombatTarget(from.x,from.y,550,weapon)',ctx)};
}

test('narrow portrait mode attacks enemies visible on screen, not a nearer offscreen one',()=>{
 const onScreen={x:140,y:0,hp:100,r:15};
 const outside={x:360,y:0,hp:100,r:15};
 const mobile=runTargeting({enemies:[outside,onScreen]});
 assert.equal(mobile.result,onScreen);
 const desktop=runTargeting({touching:false,enemies:[outside,onScreen]});
 assert.equal(desktop.result,outside,'desktop keeps its existing long-range targeting');
});

test('mobile does not shoot into empty space when all candidates are offscreen',()=>{
 const outside={x:360,y:0,hp:100,r:15};
 const t=runTargeting({enemies:[outside]});
 assert.equal(t.result,null);
 const landscape=runTargeting({W:844,H:390,zoom:.82,enemies:[outside],from:{x:100,y:0}});
 assert.equal(landscape.result,outside,'wide viewport still sees target within range');
});

test('on-screen boss priority stays active, off-screen boss cannot steal targeting',()=>{
 const near={x:110,y:0,hp:100,r:15};
 const hiddenBoss={x:370,y:0,hp:1200,elite:true,r:40};
 const boss={x:240,y:20,hp:1200,elite:true,r:40};
 const a=runTargeting({enemies:[near,hiddenBoss],bosses:[hiddenBoss]});
 assert.equal(a.result,near);
 const b=runTargeting({enemies:[near,boss],bosses:[boss]});
 assert.equal(b.result,boss,'visible bosses remain the preferred ranged target');
});
