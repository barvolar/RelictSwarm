import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../src/modules/20-core/state/localization.js',import.meta.url),'utf8');
function runtime(saved='ru',system='ru-RU'){
 const store=new Map([['relictswarm_ui_locale_v1',saved]]);
 const ctx=vm.createContext({localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},navigator:{language:system},WeakMap,console});
 vm.runInContext(source,ctx);
 return {ctx,store,translate:text=>vm.runInContext('localizedText('+JSON.stringify(text)+')',ctx)};
}
test('English translations cover combat and weapon UI',()=>{
 const {translate}=runtime();
 for(const s of ['БОСС ПОВЕРЖЕН','СИНТЕЗ-АЛЬФА // ХРАНИТЕЛЬ ЯДРА','ПЕПЕЛЬНЫЙ ОХОТНИК','КРИОИЗЛУЧАТЕЛЬ','ВЫБЕРИ МОДИФИКАЦИЮ','КУЗНЕЦ: СПИРАЛЬ + ВЫЖЖЕННАЯ ЗОНА!']){
  assert.ok(!/[А-Яа-яЁё]/.test(translate(s)),s+' untranslated');
 }
});
test('Russian preference and Russian system language cannot enable Russian UI',()=>{
 const {ctx,store,translate}=runtime('ru','ru-RU');
 assert.equal(vm.runInContext('locale',ctx),'en');
 assert.equal(store.get('relictswarm_ui_locale_v1'),'en');
 assert.equal(translate('БОСС ПОВЕРЖЕН'),'BOSS DEFEATED');
 assert.equal(translate('PROTOCOL II'),'PROTOCOL II');
 assert.equal(vm.runInContext("changeLocale('ru')",ctx),false);
 assert.equal(vm.runInContext('locale',ctx),'en');
});
