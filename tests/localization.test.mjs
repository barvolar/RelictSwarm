import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../src/modules/20-core/state/localization.js',import.meta.url),'utf8');
function runtime(lang){const ctx=vm.createContext({localStorage:{getItem:()=>lang},navigator:{language:'en-US'},WeakMap,console});vm.runInContext(source,ctx);return text=>vm.runInContext('localizedText('+JSON.stringify(text)+')',ctx)}
test('English translations cover important gameplay screens and weapon labels',()=>{
 const translate=runtime('en');
 for(const s of ['БОСС ПОВЕРЖЕН','СИНТЕЗ-АЛЬФА // ХРАНИТЕЛЬ ЯДРА','ПЕПЕЛЬНЫЙ ОХОТНИК','КРИОИЗЛУЧАТЕЛЬ','ВЫБЕРИ МОДИФИКАЦИЮ','КУЗНЕЦ: СПИРАЛЬ + ВЫЖЖЕННАЯ ЗОНА!'])
  assert.ok(!/[А-Яа-яЁё]/.test(translate(s)),s+' was not translated');
});
test('Russian locale preserves original text and dictionary is nonempty',()=>{
 const translate=runtime('ru');
 assert.equal(translate('БОСС ПОВЕРЖЕН'),'БОСС ПОВЕРЖЕН');
 assert.match(source,/function changeLocale\(next\)/);
 assert.match(source,/I18N_PAIRS.sort/);
});
