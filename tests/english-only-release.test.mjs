import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const source=read('src/modules/20-core/state/localization.js');
const settings=read('src/modules/50-ui/pages/settings.js');
const progression=read('src/modules/10-data/world/progression.js');
const pickup=read('src/modules/40-game/entities/fx-pickups.js');
const drone=read('src/modules/40-game/combat/drone-combat.js');
function context(lang){
 const store=new Map([['relictswarm_ui_locale_v1',lang]]);
 const c=vm.createContext({WeakMap,console,navigator:{language:'en-US'},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}});
 vm.runInContext(source,c);return c;
}
test('RU/EN switch, saved preference and gameplay patches are preserved',()=>{
 assert.match(source,/function changeLocale\(next\)/);
 assert.match(source,/relictswarm_ui_locale_v1/);
 assert.match(settings,/id="langBtn"/);
 assert.match(settings,/changeLocale\(locale==='ru'\?'en':'ru'\)/);
 const ru=context('ru'),en=context('en');
 assert.equal(vm.runInContext('locale',ru),'ru');
 assert.equal(vm.runInContext('locale',en),'en');
 assert.equal(vm.runInContext("localizedText('БОСС ПОВЕРЖЕН')",ru),'БОСС ПОВЕРЖЕН');
 assert.equal(vm.runInContext("localizedText('БОСС ПОВЕРЖЕН')",en),'BOSS DEFEATED');
 assert.equal(vm.runInContext("localizedText('PROTOCOL I')",ru),'ПРОТОКОЛ I');
 assert.ok(drone.includes('S.rageTimer>0?1.45:1'));
 assert.ok(pickup.includes("'timeStop'"));
 assert.ok(progression.includes("'PROTOCOL I'"));
});
test('English rendering remains complete for every static Russian UI template',()=>{
 const c=context('en');
 for(const path of ['src/index.template.html','src/modules/50-ui/pages/play-progression.js','src/modules/50-ui/pages/main-menu.js','src/modules/50-ui/pages/shop-and-lab.js','src/modules/50-ui/pages/help.js','src/modules/40-game/training/pause-qa.js']){
  for(const line of read(path).split('\n')){
   if(!/[А-Яа-яЁё]/.test(line)||line.trim().startsWith('//'))continue;
   const en=vm.runInContext('localizedText('+JSON.stringify(line)+')',c);
   assert.ok(!/[А-Яа-яЁё]/.test(en),'Untranslated '+path+': '+en.slice(0,160));
  }
 }
});