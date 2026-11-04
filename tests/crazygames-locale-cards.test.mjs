import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

// Regression: dynamically generated upgrade cards must not leak Russian
// rarity labels or number formatting when CrazyGames selects English.
const source=fs.readFileSync(new URL('../src/modules/40-game/upgrades/cards.js',import.meta.url),'utf8');

function renderCard(locale){
 const ctx=vm.createContext({
  locale,
  S:{drones:[{id:'rail',lvl:2,mods:{}}]},
  DRONES:{rail:{name:'RAILGUN',glyph:'➥',desc:''}},
  weaponBranches:()=>[['rate','Attack rate']],
  wm:()=>0,
  MAX_WEAPONS:5
 });
 vm.runInContext(source,ctx);
 return vm.runInContext(
  "upgradeCardHtml({kind:'weapon',id:'rail',rarity:{id:'rare',name:'РЕДКАЯ',steps:3,col:'#6baaff'},keys:['rate']},0)",
  ctx
 );
}

test('English upgrade cards translate lowercase rarity and decimals',()=>{
 const html=renderCard('en');
 assert.match(html,/rare · 3 stats/);
 assert.match(html,/\+27\.7%/);
 assert.match(html,/lang="en"/);
 assert.doesNotMatch(html,/редкая|параметра|\+27,7%/i);
});

test('Russian upgrade cards retain original rarity and number conventions',()=>{
 const html=renderCard('ru');
 assert.match(html,/редкая · 3 параметра/);
 assert.match(html,/\+27,7%/);
 assert.match(html,/lang="ru"/);
});
