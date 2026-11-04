import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const source=read('src/modules/20-core/state/localization.js');
const settings=read('src/modules/50-ui/pages/settings.js');
const template=read('src/index.template.html');
const progression=read('src/modules/10-data/world/progression.js');
const pickup=read('src/modules/40-game/entities/fx-pickups.js');
const drone=read('src/modules/40-game/combat/drone-combat.js');
function context(lang='ru',system='ru-RU'){
 const store=new Map([['relictswarm_ui_locale_v1',lang]]);
 const c=vm.createContext({WeakMap,console,navigator:{language:system},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},window:{RelicPlatform:{provider:'crazygames'}}});
 vm.runInContext(source,c);return {c,store};
}
test('English is mandatory, even with saved Russian locale, mobile system RU and platform RU',()=>{
 assert.doesNotMatch(settings,/id="langBtn"/);
 assert.doesNotMatch(settings,/changeLocale\(locale/);
 for(const provider of ['web','crazygames','yandex']){
  const {c,store}=context('ru','ru-RU');
  c.window.RelicPlatform.provider=provider;
  assert.equal(vm.runInContext('locale',c),'en');
  assert.equal(store.get('relictswarm_ui_locale_v1'),'en');
  assert.equal(vm.runInContext("localizedText('БОСС ПОВЕРЖЕН')",c),'BOSS DEFEATED');
  assert.equal(vm.runInContext("changeLocale('ru')",c),false);
  assert.equal(vm.runInContext('locale',c),'en');
  assert.equal(typeof c.window.RelicOnPlatformLocale,'function');
  c.window.RelicOnPlatformLocale('ru');
  assert.equal(vm.runInContext('locale',c),'en');
 }
 assert.ok(drone.includes('S.rageTimer>0?1.45:1'));
 assert.ok(pickup.includes("'timeStop'"));
 assert.ok(progression.includes("'PROTOCOL I'"));
});
test('mobile browser translation is disabled for this English-only game',()=>{
 assert.match(template,/<html lang="en" translate="no" class="notranslate">/);
 assert.match(template,/<body translate="no" class="notranslate">/);
 assert.match(template,/<meta name="google" content="notranslate"\/>/);
});
test('English translation covers every known static Russian UI template',()=>{
 const {c}=context('ru','ru-RU');
 for(const path of ['src/index.template.html','src/modules/50-ui/pages/play-progression.js','src/modules/50-ui/pages/main-menu.js','src/modules/50-ui/pages/shop-and-lab.js','src/modules/50-ui/pages/help.js','src/modules/40-game/training/pause-qa.js']){
  for(const line of read(path).split('\n')){
   if(!/[А-Яа-яЁё]/.test(line)||line.trim().startsWith('//'))continue;
   const en=vm.runInContext('localizedText('+JSON.stringify(line)+')',c);
   assert.ok(!/[А-Яа-яЁё]/.test(en),'Untranslated '+path+': '+en.slice(0,160));
  }
 }
});
