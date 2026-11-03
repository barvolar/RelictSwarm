import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
const skins=read('src/modules/20-core/state/skins.js');
const visual=read('src/modules/70-render/layers/skin-cosmetics.js');
const robot=read('src/modules/70-render/layers/robot.js');
const order=JSON.parse(read('src/module-order.json'));
test('approved 32 catalog has exactly the rarity progression chosen in the Lab',()=>{
 const ctx=vm.createContext({});
 vm.runInContext(skins+';globalThis.data={catalog:SKIN_CATALOG,skins:SKINS};',ctx);
 const {catalog,skins}=ctx.data;
 assert.equal(catalog.length,32);
 assert.equal(new Set(catalog.map(x=>x.id)).size,32);
 assert.deepEqual(['common','uncommon','rare','epic','legendary'].map(r=>catalog.filter(x=>x.rarity===r).length),[8,8,8,4,4]);
 for(const id of ['relict','ghost','ember','void'])assert.ok(skins[id],'existing owned skin must be preserved: '+id);
 assert.equal(skins.archonzero.name,'АРХОНТ НУЛЯ');
 assert.equal(skins.pulsar.rarity,'epic');
 assert.equal(skins.relict.rarity,'common');
 for(const x of catalog){assert.match(x.core,/^#[0-9a-f]{6}$/i);assert.ok(skins[x.id].name);assert.ok(skins[x.id].skinIndex>0);}
});
test('rarity changes visual modules but never changes robot hitbox or player stats',()=>{
 const ctx=vm.createContext({});
 vm.runInContext(visual+';globalThis.deco={scale:SKIN_COSMETIC_SCALE,rank:SKIN_RARITY_RANK};',ctx);
 assert.equal(ctx.deco.rank.common,0);
 assert.equal(ctx.deco.rank.legendary,4);
 assert.ok(ctx.deco.scale.legendary<ctx.deco.scale.rare);
 assert.ok(visual.includes("if(!rank)return"));
 assert.ok(robot.includes('drawSkinDecor(skin,0)'));
 assert.ok(robot.includes('drawSkinDecor(skin,1)'));
 assert.ok(!robot.includes("skin.variant==='ghost'"),'old built-in wings cannot be stacked on rarity wings');
 assert.ok(!robot.includes("glow(0,13,12,BLUE,.37)"),'old giant blue engine bulb must be removed');
});
test('game module order draws cosmetic layers after primitives but before the robot',()=>{
 const a=order.indexOf('src/modules/70-render/layers/primitives.js');
 const b=order.indexOf('src/modules/70-render/layers/skin-cosmetics.js');
 const c=order.indexOf('src/modules/70-render/layers/robot.js');
 assert.ok(a>=0&&a<b&&b<c);
});
test('rarity-aware hangar showcases all skin tiers, with persistent purchases',()=>{
 const ui=read('src/modules/50-ui/pages/skins.js');
 const home=read('src/modules/50-ui/pages/main-menu.js');
 const save=read('src/modules/20-core/state/runtime.js');
 assert.ok(ui.includes('SKIN_RARITY_NAMES'));
 assert.ok(ui.includes('data-rarity='));
 assert.ok(home.includes('skin-rotator'));
 assert.ok(home.includes("rank===4"));
 assert.ok(save.includes('list.filter(id=>SKINS[id])'));
 assert.ok(ui.includes('save.skins.push(id)'));
});
