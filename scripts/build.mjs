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
  ['src/domain/fusion-rules.mjs','eligibleFusionIds']
];
const embeddedRules=pureModules.map(([file,name])=>{
  const source=read(file),signature='export function '+name+'(';
  if(source.split(signature).length!==2 || /^\s*import\s/m.test(source) || (source.match(/\bexport\b/g)||[]).length!==1) throw Error('Unsupported pure ES module: '+file);
  return source.replace(signature,'function '+name+'(');
}).join('\n');
const js=order.map((p,i)=>read(p)+(i===0?'\n'+embeddedRules+'\n':'')).join('');
const template=read('src/index.template.html');
if ((template.match(/%%RELICT_STYLE%%/g)||[]).length!==1 || (template.match(/%%RELICT_MAIN_SCRIPT%%/g)||[]).length!==1) throw Error('Invalid build template');
const html=template.replace('%%RELICT_STYLE%%',read('src/styles/game.css')).replace('%%RELICT_MAIN_SCRIPT%%',js);
const dist=path.join(root,'dist'); fs.mkdirSync(dist,{recursive:true});
fs.writeFileSync(path.join(dist,'index.html'),html);
const check=path.join(dist,'game-check.js'); fs.writeFileSync(check,js);
try {execFileSync(process.execPath,['--check',check],{stdio:'pipe'});} finally {fs.rmSync(check,{force:true});}
for (const p of ['telemetry-config.js','telemetry-client.js','.nojekyll']) fs.copyFileSync(path.join(root,p),path.join(dist,p));
const sha=crypto.createHash('sha256').update(html).digest('hex');
if(process.argv.includes('--verify-migration')&&sha!==read('src/baseline.sha256').trim()) throw Error('Original HTML parity check failed');
console.log('Built dist/index.html ('+Buffer.byteLength(html)+' bytes), sha256: '+sha);
if(process.argv.includes('--verify-migration'))console.log('PASS: exact v0.10.15 parity');
