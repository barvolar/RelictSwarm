import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = name => fs.readFileSync(new URL(name, root), 'utf8');
const exists = name => fs.existsSync(new URL(name, root));
const moduleOrder = JSON.parse(read('src/module-order.json'));
const styleOrder = JSON.parse(read('src/style-order.json'));

test('module order references unique existing source files', () => {
 assert.ok(moduleOrder.length >= 60);
 assert.equal(new Set(moduleOrder).size,moduleOrder.length);
 assert.equal(moduleOrder[0],'src/modules/00-bootstrap/context.js');
 assert.equal(moduleOrder.at(-1),'src/modules/90-bootstrap/start.js');
 for(const filename of moduleOrder) {
  assert.match(filename,/^src\/modules\/[\w/-]+\.js$/);
  assert.ok(exists(filename),'Missing module: '+filename);
  assert.ok(read(filename).length>0,'Empty module: '+filename);
 }
});

test('all major gameplay systems have a dedicated source group', () => {
 const groups=[
  'src/modules/10-data/weapons/','src/modules/10-data/world/',
  'src/modules/20-core/state/','src/modules/20-core/input/',
  'src/modules/30-audio/engine/','src/modules/40-game/training/',
  'src/modules/40-game/lifecycle/','src/modules/40-game/entities/',
  'src/modules/40-game/upgrades/','src/modules/40-game/combat/',
  'src/modules/40-game/enemies/','src/modules/40-game/update/',
  'src/modules/50-ui/pages/','src/modules/60-analytics/balance/',
  'src/modules/60-analytics/performance/','src/modules/70-render/layers/',
 ];
 for(const group of groups)assert.ok(moduleOrder.some(p=>p.startsWith(group)),group);
});

test('ordered CSS sections preserve their exact combined output', () => {
 assert.ok(styleOrder.length>=5);
 assert.equal(new Set(styleOrder).size,styleOrder.length);
 for(const file of styleOrder){
  assert.match(file,/^src\/styles\/sections\/[\w-]+\.css$/);
  assert.ok(exists(file),'Missing stylesheet: '+file);
 }
 const style=styleOrder.map(read).join('');
 const html=read('dist/index.html');
 assert.ok(html.includes('<style>'+style+'</style>'),'Production CSS differs from ordered source styles');
});

test('production entry remains a classic inline script and telemetry assets are packaged', () => {
 const html=read('dist/index.html');
 const template=read('src/index.template.html');
 assert.ok(!html.includes('%%RELICT_MAIN_SCRIPT%%'));
 assert.ok(!html.includes('%%RELICT_STYLE%%'));
 assert.ok(template.includes('<script>%%RELICT_MAIN_SCRIPT%%</script>'));
 for(const file of ['telemetry-config.js','telemetry-client.js','.nojekyll']){
  assert.ok(exists('dist/'+file),'Missing packaged runtime asset: '+file);
 }
});
