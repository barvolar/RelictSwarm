import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const order=JSON.parse(read('src/module-order.json'));
// Transitional single-file bundling: embed a verified, dependency-free ES module.
// Only the named export is supported. Fail loudly rather than silently drop imports.
const pureModules=[
  ['src/domain/targeting.mjs','selectCombatTarget'],
  ['src/domain/fusion-rules.mjs','eligibleFusionIds'],
  ['src/domain/boss-damage.mjs','calculateBossDamage'],
  ['src/domain/weapon-damage.mjs','calculateWeaponDamage'],
  ['src/domain/weapon-cooldown.mjs','calculateWeaponCooldown'],
  ['src/domain/fusion-transfer.mjs','createFusionWeapon']
];
const embeddedRules=pureModules.map(([file,name])=>{
  const source=read(file),signature='export function '+name+'(';
  if(source.split(signature).length!==2 || /^\s*import\s/m.test(source) || (source.match(/\bexport\b/g)||[]).length!==1) throw Error('Unsupported pure ES module: '+file);
  return source.replace(signature,'function '+name+'(');
}).join('\n');
const js=order.map((p,i)=>read(p)+(i===0?'\n'+embeddedRules+'\n':'')).join('');
const template=read('src/index.template.html');
if ((template.match(/%%RELICT_STYLE%%/g)||[]).length!==1 || (template.match(/%%RELICT_MAIN_SCRIPT%%/g)||[]).length!==1) throw Error('Invalid build template');
const styles=JSON.parse(read('src/style-order.json')).map(read).join('');
const platformCode=read('src/platform/platform-bridge.js');
const base=template.replace('%%RELICT_STYLE%%',styles)
  .replace('%%RELICT_MAIN_SCRIPT%%',js)
  .replace('%%RELICT_PLATFORM_BRIDGE%%',platformCode);
const html=base.replace('%%RELICT_SDK_LOADER%%','');
const yandexHtml=base.replace('%%RELICT_SDK_LOADER%%',
  '<script>window.RELICT_PLATFORM="yandex"</script>\n<script src="/sdk.js"></script>');
const crazygamesHtml=base.replace('%%RELICT_SDK_LOADER%%',
  '<script>window.RELICT_PLATFORM="crazygames"</script>\n<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>')
  .replace('[ 10.15: ONLINE TEST ]','[ RELICT SWARM ]')
  .replace(' · No external assets','')
  // CrazyGames supplies its own fullscreen control and prohibits in-game buttons.
  .replace('</head>','<style id="crazygames-fullscreen-controls">#fullscreenBtn,#mainFullscreen,#fullscreenSettings,#fullscreenPause,.settings-action:has(#fullscreenSettings),.button-row:has(#fullscreenPause),.orientation-picker{display:none!important}</style>\n</head>');

const dist=path.join(root,'dist'); fs.mkdirSync(dist,{recursive:true});
fs.writeFileSync(path.join(dist,'index.html'),html);
// Explicit platform edition: never point GitHub Pages at /sdk.js.
const yandexDir=path.join(dist,'yandex');fs.mkdirSync(yandexDir,{recursive:true});
fs.writeFileSync(path.join(yandexDir,'index.html'),yandexHtml);
for(const p of ['telemetry-config.js','telemetry-client.js','privacy.html'])fs.copyFileSync(path.join(root,p),path.join(yandexDir,p));
// CrazyGames standalone package (no Yandex SDK dependency).
const crazyDir=path.join(dist,'crazygames');fs.mkdirSync(crazyDir,{recursive:true});
fs.writeFileSync(path.join(crazyDir,'index.html'),crazygamesHtml);
for(const p of ['telemetry-config.js','telemetry-client.js','privacy.html'])fs.copyFileSync(path.join(root,p),path.join(crazyDir,p));
const check=path.join(dist,'game-check.js'); fs.writeFileSync(check,js);
try {execFileSync(process.execPath,['--check',check],{stdio:'pipe'});} finally {fs.rmSync(check,{force:true});}
for (const p of ['telemetry-config.js','telemetry-client.js','privacy.html','.nojekyll']) fs.copyFileSync(path.join(root,p),path.join(dist,p));
const sha=crypto.createHash('sha256').update(html).digest('hex');
if(process.argv.includes('--verify-migration')&&sha!==read('src/baseline.sha256').trim()) throw Error('Original HTML parity check failed');
console.log('Built dist/index.html ('+Buffer.byteLength(html)+' bytes), sha256: '+sha);
if(process.argv.includes('--verify-migration'))console.log('PASS: exact v0.10.15 parity');
