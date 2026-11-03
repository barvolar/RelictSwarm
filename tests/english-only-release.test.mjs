import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../src/modules/20-core/state/localization.js',import.meta.url),'utf8');
const settings=fs.readFileSync(new URL('../src/modules/50-ui/pages/settings.js',import.meta.url),'utf8');
const progression=fs.readFileSync(new URL('../src/modules/10-data/world/progression.js',import.meta.url),'utf8');
const pickup=fs.readFileSync(new URL('../src/modules/40-game/entities/fx-pickups.js',import.meta.url),'utf8');
const drone=fs.readFileSync(new URL('../src/modules/40-game/combat/drone-combat.js',import.meta.url),'utf8');
const pages=['src/index.template.html','src/modules/50-ui/pages/play-progression.js','src/modules/50-ui/pages/main-menu.js','src/modules/50-ui/pages/shop-and-lab.js','src/modules/50-ui/pages/help.js','src/modules/40-game/training/pause-qa.js'];
const root=new URL('../',import.meta.url);
const c=vm.createContext({WeakMap,console});vm.runInContext(source,c);
test('English-only release has no RU switch and no English-breaking legacy preference',()=>{
 assert.ok(source.includes("const locale='en'"));
 assert.ok(!settings.includes('langBtn'));
 assert.ok(!source.includes('localStorage.getItem(localeKey)'));
 assert.ok(progression.includes("'PROTOCOL I'"));
 assert.ok(progression.includes("'PROTOCOL V'"));
 assert.ok(c.localizedText('НУЛЕВОЙ ПРОТОКОЛ').includes('ZERO PROTOCOL'));
 assert.ok(drone.includes('S.rageTimer>0?1.45:1'));
 assert.ok(pickup.includes("'timeStop'"));
});
test('all visible UI templates translate their Cyrillic lines to English',()=>{
 for(const path of pages){
  const src=fs.readFileSync(new URL(path,root),'utf8');
  for(const line of src.split('\n')){
   if(!/[А-Яа-яЁё]/.test(line)||line.trim().startsWith('//'))continue;
   const en=c.localizedText(line);
   assert.ok(!/[А-Яа-яЁё]/.test(en),'Untranslated '+path+': '+en.slice(0,180));
  }
 }
});
