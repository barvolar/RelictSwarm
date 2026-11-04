import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');

test('a complete English privacy policy ships in web and both portal builds',()=>{
 const original=read('privacy.html');
 assert.match(original,/<html lang="en"/);
 assert.match(original,/<h1>Privacy Policy<\/h1>/);
 for(const section of ['id="local"','id="analytics"','id="choices"','id="storage"','id="platforms"','id="contact"']){
  assert.ok(original.includes(section),'Missing policy section '+section);
 }
 assert.match(original,/Cloudflare D1/);
 assert.match(original,/localStorage/);
 assert.match(original,/does not automatically erase reports already delivered/);
 assert.match(original,/no automatic expiry schedule/);
 for(const dir of ['dist','dist/crazygames','dist/yandex']){
  const path=dir+'/privacy.html';
  assert.ok(existsSync(resolve(root,path)),path+' must be packed for the portal');
  assert.equal(read(path),original,path+' must be exact copy of current policy');
 }
});

test('game settings and analytics consent explain and link privacy policy',()=>{
 const settings=read('src/modules/50-ui/pages/settings.js');
 const telemetry=read('telemetry-client.js');
 assert.match(settings,/id="privacyPolicyLink"/);
 assert.match(settings,/href="\.\/privacy\.html"/);
 assert.match(telemetry,/Read Privacy Policy/);
 assert.match(telemetry,/Privacy Policy<\/a>/);
 assert.ok((telemetry.match(/href="\.\/privacy\.html"/g)||[]).length>=2);
 assert.match(telemetry,/consent === true/);
 assert.match(telemetry,/if \(!allowed\(\)\) return/);
});

test('all release builds retain the same local policy entrypoint',()=>{
 for(const dir of ['dist','dist/crazygames','dist/yandex']){
  const html=read(dir+'/index.html');
  assert.match(html,/id="privacyPolicyLink"/);
  assert.match(html,/href="\.\/privacy\.html"/);
 }
 assert.match(read('scripts/build.mjs'),/telemetry-client\.js','privacy\.html'/);
});
