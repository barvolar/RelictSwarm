import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const base=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,base),'utf8');
const logic=[
 'src/modules/40-game/upgrades/choices.js',
 'src/modules/40-game/upgrades/reroll.js',
 'src/modules/40-game/upgrades/apply-upgrades.js'
].map(read).join('\n');

function harness(){
 const buttons=[];
 const modal={
  innerHTML:'',
  querySelectorAll:()=>[],
  querySelector:(selector)=>selector==='[data-reroll]'?{onclick:null}:null
 };
 const drones=Object.fromEntries(['pulse','rocket','rail','arc','saw','flame','cryo','gravity'].map(id=>
  [id,{name:id,glyph:'◈',color:'#c0ffee',desc:id}]));
 const S={
  drones:['pulse','rocket','rail','arc'].map(id=>({id,lvl:1,mods:{}})),
  player:{x:0,y:0,hp:100,maxHp:120,speed:200},
  upgrades:[],pendingUp:2,rerollsRemaining:1,rerollsUsed:0,lvl:5,t:180,
  magnet:100,playerDmg:1
 };
 const bal={events:[],choices:[]};
 const RARITIES=[
  {id:'common',name:'ОБЫЧНАЯ',chance:60,steps:1,col:'#eee'},
  {id:'uncommon',name:'НЕОБЫЧНАЯ',chance:27,steps:2,col:'#0f0'},
  {id:'rare',name:'РЕДКАЯ',chance:10,steps:3,col:'#09f'},
  {id:'epic',name:'ЭПИЧЕСКАЯ',chance:3,steps:4,col:'#f9f'},
 ];
 const ctx=vm.createContext({
  S,bal,trainingMode:false,mode:'playing',
  RARITIES,DRONES:drones,BASE_WEAPONS:Object.keys(drones),MAX_WEAPONS:5,
  Math,console,rand:(a,b)=>a+(b-a)*.47,metaBonus:()=>0,
  weaponBranches:()=>[['power'],['rate'],['range'],['count']],
  $:()=>modal,upgradeCardHtml:(u)=>'<button data-up="0">'+u.kind+':'+u.id+'</button>',
  clickSound:()=>{},burst:()=>{},banner:()=>{},sfx:()=>{},
  balR:n=>Math.round(n*10)/10,
  balChoose:choice=>bal.choices.push(choice),
  setMode:mode=>{ctx.mode=mode;},last:0,performance:{now:()=>3},
  updateHUD(){},heal:n=>{S.player.hp=Math.min(S.player.maxHp,S.player.hp+n)}
 });
 vm.runInContext(logic,ctx,{timeout:3000});
 return {S,ctx,bal,modal,run:source=>vm.runInContext(source,ctx,{timeout:3000})};
}
function keys(cards){return cards.map(u=>u.kind+':'+u.id)}
test('one free reroll exchanges all three cards with no immediately repeated choice',()=>{
 const h=harness();
 h.run('showUpgrades()');
 assert.equal(h.ctx.mode,'upgrade');
 const previous=keys(h.S.upgrades);
 assert.equal(previous.length,3);
 assert.ok(h.modal.innerHTML.includes('ПЕРЕБРОСИТЬ 3 КАРТОЧКИ'));
 assert.equal(h.run('requestReroll()'),true);
 const next=keys(h.S.upgrades);
 assert.equal(next.length,3);
 assert.equal(new Set(next).size,3);
 assert.ok(next.every(id=>!previous.includes(id)), 'new offers may not repeat any previous card');
 assert.equal(h.S.rerollsRemaining,0);
 assert.equal(h.S.rerollsUsed,1);
 assert.equal(h.bal.events.length,3);
 assert.deepEqual(h.bal.events.map(e=>e.what),['reroll_before','reroll_after','reroll_used']);
 assert.ok(h.bal.events[0].id.includes(':'));
 assert.ok(h.modal.innerHTML.includes('РЕРОЛЛ ИСПОЛЬЗОВАН'));
 assert.equal(h.bal.choices.length,0,'reroll is not a level-up choice');
 assert.equal(h.run('requestReroll()'),false,'cannot reroll twice');
});
test('reroll does not refresh across queued upgrades and only available during selection',()=>{
 const h=harness();
 assert.equal(h.run('requestReroll()'),false,'not available in play mode');
 h.run('showUpgrades()');
 assert.equal(h.run('requestReroll()'),true);
 h.run('chooseUpgrade(0)');
 assert.equal(h.ctx.mode,'upgrade','a queued next upgrade displays automatically');
 assert.equal(h.S.pendingUp,1);
 assert.equal(h.S.rerollsRemaining,0);
 assert.equal(h.run('canUseReroll()'),false);
 assert.equal(h.run('requestReroll()'),false);
 h.run('chooseUpgrade(0)');
 assert.equal(h.ctx.mode,'playing');
 assert.equal(h.S.pendingUp,0);
 assert.equal(h.S.rerollsUsed,1);
 assert.equal(h.run('requestReroll()'),false);
});
test('a consumed reroll does not affect the weapon slot limit or player attributes',()=>{
 const h=harness();
 h.run('showUpgrades()');
 const original={drones:h.S.drones.length,health:h.S.player.hp,speed:h.S.player.speed,damage:h.S.playerDmg};
 h.run('requestReroll()');
 assert.equal(h.S.drones.length,original.drones);
 assert.equal(h.S.player.hp,original.health);
 assert.equal(h.S.player.speed,original.speed);
 assert.equal(h.S.playerDmg,original.damage);
 assert.ok(h.S.upgrades.filter(x=>x.kind==='new').every(x=>!h.S.drones.some(d=>d.id===x.id)));
 h.S.drones.push({id:'flame',lvl:1,mods:{}});
 assert.equal(h.run("upgradeChoices().some(u=>u.kind==='new')"),false,'no new weapon with full slots');
});
test('grant interface is suitable for later verified ad rewards, without showing ads now',()=>{
 const h=harness();
 assert.equal(h.run('grantReroll(0)'),false);
 h.S.rerollsRemaining=0;
 assert.equal(h.run('grantReroll(1)'),true);
 assert.equal(h.S.rerollsRemaining,1);
 assert.equal(h.run('grantReroll(20)'),true);
 assert.equal(h.S.rerollsRemaining,3);
 assert.equal(h.run('grantReroll(-2)'),false);
 assert.equal(h.S.rerollsRemaining,3);
});
test('new runs each reset free reroll; keyboard and responsive button exist',()=>{
 const start=read('src/modules/40-game/lifecycle/start.js');
 const keys=read('src/modules/20-core/input/keyboard.js');
 const css=read('src/styles/sections/upgrade-cards.css');
 const order=JSON.parse(read('src/module-order.json'));
 const reroll=order.indexOf('src/modules/40-game/upgrades/reroll.js');
 assert.ok(start.includes('rerollsRemaining:1+challengeBonusRerolls()'));
 assert.ok(start.includes('rerollStartCount:1+challengeBonusRerolls()'));
 assert.ok(keys.includes("e.code==='KeyR'"));
 assert.ok(css.includes('.upgrade-reroll-row'));
 assert.ok(reroll>order.indexOf('src/modules/40-game/upgrades/choices.js'));
 assert.ok(reroll<order.indexOf('src/modules/40-game/upgrades/apply-upgrades.js'));
});
