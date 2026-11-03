import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const bossCode=read('src/modules/40-game/enemies/boss-attacks.js');
const hazardCode=read('src/modules/40-game/enemies/hazards.js');
const ids=['boss1','boss2','boss3','synth1','synth2','synth3','omega'];
function mock(){
 const S={t:300,enemy:[],bosses:[],hazards:[],enemyBullets:[],fx:[],
  player:{x:0,y:0,rad:17,dx:0,dy:-1}};
 const seen={hits:0,banners:[],summons:0};
 const ctx=vm.createContext({S,TAU:Math.PI*2,Math,shake:0,
  clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),
  rand:(a,b)=>a+(b-a)/2,
  banner:s=>seen.banners.push(s),
  spawnEnemy:(id,ang,d)=>{
   seen.summons++;
   const e={id,hp:100,elite:false,x:0,y:0,r:16};
   S.enemy.push(e);return e;
  },
  hitPlayer:()=>seen.hits++,
  burst:()=>{},line:()=>{},circ:()=>{},ring:()=>{},
 });
 vm.runInContext(bossCode+'\n'+hazardCode,ctx);
 return {ctx,S,seen};
}
function boss(id,phase=0){
 return {id,elite:true,hp:15000,maxHp:20000,phase,
  x:240,y:0,r:60,spd:80,stun:0,special:0,
  attack:0,bossCycle:0,shield:0};
}

test('seven different bosses publish real attacks in both phases',()=>{
 for(const id of ids){
  const {ctx,S,seen}=mock();
  const e=boss(id);S.enemy.push(e);S.bosses.push(e);
  ctx.bossAttack(e,.016,-240,0,240);
  assert.ok(S.hazards.length+S.enemyBullets.length>0,id+' has no attack');
  assert.ok(e.special>=2,id+' has no recovery');
  const first=new Set(S.hazards.map(h=>h.type));
  e.special=0;e.phase=1;
  S.hazards=[];S.enemyBullets=[];
  ctx.bossAttack(e,.016,-240,0,240);
  assert.ok(S.hazards.length+S.enemyBullets.length>0,id+' phase two silent');
  assert.ok(seen.banners.length>=2,id+' telegraph absent');
  assert.ok([...first].some(t=>['dash','annulus','sweep','slash','circle','forgeMeteor'].includes(t))
   ||S.enemyBullets.length>0);
 }
});

test('Reaper dash is visible, moves to warned endpoint and can be dodged',()=>{
 const {ctx,S,seen}=mock();
 const e=boss('boss1');e.x=100;S.enemy.push(e);
 ctx.bossAttack(e,.016,-100,0,100);
 const dash=S.hazards.find(h=>h.type==='dash');
 assert.ok(dash);
 assert.equal(dash.owner,e);
 assert.ok(e.bossDashWind>0);
 S.player.x=60;S.player.y=130;
 ctx.updateHazards(1.1);
 assert.equal(seen.hits,0,'dodge perpendicular to lane avoids damage');
 assert.ok(Math.hypot(e.x-100,e.y)>100,'boss must actually dash');
});

test('annulus has a safe core, hazardous ring and safe outside',()=>{
 const {ctx,S,seen}=mock();
 const e=boss('boss2');S.enemy.push(e);
 const hazard=()=>({type:'annulus',owner:e,x:0,y:0,inner:85,r:200,
  delay:.03,life:.03,col:'#ff99bb',dmg:24});
 S.hazards=[hazard()];ctx.updateHazards(.04);
 assert.equal(seen.hits,0,'center must be safe');
 S.player.x=135;S.hazards=[hazard()];ctx.updateHazards(.04);
 assert.equal(seen.hits,1,'ring must damage');
 S.player.x=260;S.hazards=[hazard()];ctx.updateHazards(.04);
 assert.equal(seen.hits,1,'outside must be safe');
});

test('sweep warning rotates before it lands',()=>{
 const {ctx,S}=mock();
 const e=boss('omega');S.enemy.push(e);
 const h={type:'sweep',owner:e,x:0,y:0,len:440,r:28,
  ang:0,turnSpeed:Math.PI,delay:1,life:1,col:'#ffaadd',dmg:20};
 S.hazards.push(h);ctx.updateHazards(.2);
 assert.ok(h.ang>.5,'telegraphed sweep must rotate visibly');
 assert.equal(h.hit,undefined);
});

test('spawns and warning hazards remain bounded under repeated boss casts',()=>{
 const {ctx,S,seen}=mock();
 const a=boss('boss2'),b=boss('omega',1),c=boss('synth2',1);
 S.enemy.push(a,b,c);
 for(let i=0;i<100;i++){
  for(const e of [a,b,c]){e.special=0;ctx.bossAttack(e,.016,-240,0,240);}
 }
 assert.ok(S.hazards.length<=48,'too many warning zones');
 assert.ok(S.enemyBullets.length<=120,'too many projectiles');
 assert.ok(S.enemy.length<=148,'too many summoned enemies');
 assert.ok(seen.summons<=18,'up to 8 sentries, 5 phantoms and 5 hunters');
});


test('Chaos Smith cycles three different attack types instead of repeating one spiral',()=>{
 const {ctx,S,seen}=mock();
 const smith=boss('synth2'); S.enemy.push(smith);S.bosses.push(smith);
 S.player.moving=true;S.player.dx=1;S.player.dy=0;
 ctx.bossAttack(smith,.016,-240,0,240);
 assert.equal(smith.bossCycle,1);
 assert.ok(S.hazards.filter(h=>h.type==='forgeMeteor').length>=3);
 assert.equal(S.enemyBullets.length,0,'first attack is the forecast meteor chase, not a bullet fan');
 // At 1.04 seconds a straight run would place the player inside the predicted strike.
 const meteor=S.hazards.find(h=>h.type==='forgeMeteor');
 assert.ok(Math.abs(meteor.x-225*meteor.delay)<10,'meteor predicts straight-line movement');
 S.hazards=[];smith.special=0;
 ctx.bossAttack(smith,.016,-240,0,240);
 assert.equal(smith.bossCycle,2);
 assert.ok(S.hazards.filter(h=>h.type==='slash').length>=2,'second attack uses anvil press lines');
 assert.ok(S.hazards.some(h=>h.type==='forgeMeteor'),'press finishes with a delayed meteor');
 S.hazards=[];smith.special=0;
 ctx.bossAttack(smith,.016,-240,0,240);
 assert.equal(smith.bossCycle,3);
 assert.ok(S.enemyBullets.length>=9,'third attack uses a bullet spiral');
 assert.ok(S.hazards.some(h=>h.type==='forgeMeteor'),'spiral must also deny camping its gap');
 assert.ok(seen.banners.some(s=>s.includes('МЕНЯЙ НАПРАВЛЕНИЕ')));
 assert.ok(seen.banners.some(s=>s.includes('ПРЕСС')));
 assert.ok(seen.banners.some(s=>s.includes('СПИРАЛЬ')));
});

test('Chaos Smith meteors punish continuous forward movement but allow a deliberate sidestep',()=>{
 const {ctx,S,seen}=mock();const smith=boss('synth2'); S.enemy.push(smith);
 S.player.moving=true;S.player.dx=1;S.player.dy=0;
 ctx.bossAttack(smith,.016,-240,0,240);
 const meteor=S.hazards.find(h=>h.type==='forgeMeteor');
 const forecastX=meteor.x,forecastY=meteor.y;
 S.player.x=225*meteor.delay;S.player.y=0;
 ctx.updateHazards(meteor.delay+.015);
 assert.ok(seen.hits>=1,'a player running straight into the forecast must be hit');
 assert.equal(meteor.type,'forgeScorch','meteor becomes a distinct temporary hazard');
 assert.ok(meteor.life>1,'scorch has positive life after impact');
 // Replaying the very same attack, a lateral change in direction clears the blast.
 const alt=mock();const second=boss('synth2');alt.S.enemy.push(second);
 alt.S.player.moving=true;alt.S.player.dx=1;alt.S.player.dy=0;
 alt.ctx.bossAttack(second,.016,-240,0,240);
 const warned=alt.S.hazards.find(h=>h.type==='forgeMeteor');
 alt.S.player.x=forecastX-115;alt.S.player.y=forecastY+130;
 alt.ctx.updateHazards(warned.delay+.015);
 assert.equal(alt.seen.hits,0,'sidestepping forecast area must avoid the damage');
});

test('Chaos Smith burn pools persist briefly and are removed when finished',()=>{
 const {ctx,S,seen}=mock();const smith=boss('synth2');S.enemy.push(smith);
 S.hazards.push({type:'forgeMeteor',owner:smith,x:0,y:0,r:70,delay:.1,life:.1,
  col:'#ffad61',dmg:27,linger:1.35,hit:false});
 ctx.updateHazards(.11);
 assert.equal(S.hazards[0].type,'forgeScorch');
 assert.equal(seen.hits,1);
 ctx.updateHazards(.42);
 assert.equal(seen.hits,2,'standing on the glowing hot ground deals further damage');
 S.player.x=180;
 ctx.updateHazards(.43);
 assert.equal(seen.hits,2,'leaving the hot ground prevents further hits');
 ctx.updateHazards(.9);
 assert.equal(S.hazards.length,0,'finished burn pools are cleaned up');
});

test('Smith phase two adds delayed pressure, without exceeding hazard or bullet caps',()=>{
 const {ctx,S}=mock();const smith=boss('synth2',1);S.enemy.push(smith);
 for(let i=0;i<90;i++){smith.special=0;ctx.bossAttack(smith,.016,-240,0,240);}
 assert.ok(S.hazards.length<=48);
 assert.ok(S.enemyBullets.length<=120);
 assert.ok(S.enemy.length<=148);
 assert.ok(S.hazards.some(h=>h.type==='annulus'||h.type==='slash'||h.type==='forgeMeteor'));
});

test('boss death cancels unresolved owner-linked hazards',()=>{
 const {ctx,S,seen}=mock();
 const e=boss('boss1');e.hp=0;
 S.hazards.push({type:'slash',owner:e,x:0,y:0,ang:0,len:300,
  r:70,delay:.1,life:.1,col:'#ff7e9b',dmg:999});
 ctx.updateHazards(.2);
 assert.equal(seen.hits,0);
 assert.equal(S.hazards.length,0);
});

test('laser beams are short muzzle flashes, while real projectiles deal damage',()=>{
 const source=read('src/modules/40-game/combat/drone-combat.js');
 const collisions=read('src/modules/40-game/combat/projectiles.js');
 assert.ok(source.includes('source.x+muzzleDir.dx*27'));
 assert.ok(source.includes('source.x+ionMuzzle.dx*32'));
 assert.ok(!source.includes("b:{x:target.x,y:target.y},life:.18,max:.18,col:TEAL"));
 assert.ok(collisions.includes("b.type==='pulse'||b.type==='fusion_ion'"));
});
