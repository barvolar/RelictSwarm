import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../src/modules/20-core/state/localization.js',import.meta.url),'utf8');
function runtime(lang){
 const ctx=vm.createContext({localStorage:{getItem:()=>lang},navigator:{language:'en-US'},WeakMap,console});
 vm.runInContext(source,ctx);return text=>vm.runInContext('localizedText('+JSON.stringify(text)+')',ctx);
}
test('English translations cover battle UI and weapon labels',()=>{
 const translate=runtime('en');
 for(const s of ['БОСС ПОВЕРЖЕН','СИНТЕЗ-АЛЬФА // ХРАНИТЕЛЬ ЯДРА','ПЕПЕЛЬНЫЙ ОХОТНИК','КРИОИЗЛУЧАТЕЛЬ','ВЫБЕРИ МОДИФИКАЦИЮ','КУЗНЕЦ: СПИРАЛЬ + ВЫЖЖЕННАЯ ЗОНА!'])
  assert.ok(!/[А-Яа-яЁё]/.test(translate(s)),s+' untranslated');
});
test('Russian localization preserves Russian source strings and translates native English HUD',()=>{
 const translate=runtime('ru');
 assert.equal(translate('БОСС ПОВЕРЖЕН'),'БОСС ПОВЕРЖЕН');
 assert.equal(translate('НАСТРОЙКИ ЗВУКА'),'НАСТРОЙКИ ЗВУКА');
 assert.equal(translate('PROTOCOL II'),'ПРОТОКОЛ II');
 assert.equal(translate('0 DESTROYED'),'0 УНИЧТОЖЕНО');
 assert.match(source,/function changeLocale\(next\)/);
});