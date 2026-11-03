// Reproducible headless balance harness using the exact assembled gameplay code.
// This is a controlled combat simulation; it does not measure GPU FPS.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {performance} from 'node:perf_hooks';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('dist/index.html');
const src=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));
function getFunction(name){
 const start=src.indexOf('function '+name+'(');
 if(start<0)throw Error('Missing gameplay function: '+name);
 const re=/\)\s*\{/g;re.lastIndex=start;
 const header=re.exec(src);
 if(!header)throw Error('Missing function body: '+name);
 const offset=header.index+header[0].lastIndexOf('{');
 let depth=0,quote=null,escaped=false,comment=null;
 for(let i=offset;i<src.length;i++){
  const c=src[i],next=src[i+1];
  if(comment==='line'){if(c==='\n')comment=null;continue;}
  if(comment==='block'){if(c==='*'&&next==='/'){comment=null;i++;}continue;}
  if(quote){if(escaped){escaped=false;continue;}if(c==='\\'){escaped=true;continue;}if(c===quote)quote=null;continue;}
  if(c==='/'&&next==='/'){comment='line';i++;continue;}
  if(c==='/'&&next==='*'){comment='block';i++;continue;}
  if(c==='"'||c==="'"||c==='\x60'){quote=c;continue;}
  if(c==='{')depth++;
  if(c==='}'&&--depth===0)return src.slice(start,i+1);
 }
 throw Error('Unbalanced function: '+name);
}
function getObject(name){
 const begin=src.indexOf('const '+name+'=');
 if(begin<0)throw Error('Missing weapon table: '+name);
 const end=src.indexOf('\n};',begin);
 if(end<0)throw Error('Unterminated weapon table: '+name);
 return src.slice(begin,end+3);
}
const functions=['selectCombatTarget','calculateWeaponDamage','calculateWeaponCooldown',
 'sawPositions','getDronePos','pointSegmentDist','closest','chooseCombatTarget',
 'damageArea','aimGeometry','weaponMuzzle','launchBullet','scheduleChain',
 'updateChains','fusionLine','fusionField','fusionRocket','fusionBoomer',
 'fusionMine','shatterFrozen','fireFusionSpecial','droneUpdate',
 'updateAreaWeapons','updateProjectiles','applyChill','hurtEnemy'];
const program=[getObject('DRONES'),getObject('HYBRIDS'),
 src.slice(src.indexOf('const wm='),src.indexOf('\nconst branchPoints=')),
 ...functions.map(getFunction)].join('\n');
const catalog=vm.createContext({});
vm.runInContext(getObject('DRONES')+';'+getObject('HYBRIDS')+
 ';globalThis.data={DRONES,HYBRIDS}',catalog);
const {DRONES,HYBRIDS}=catalog.data;
const randFactory=seed=>()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/2**32;};
const target=(x,y,hp,elite=false)=>({id:elite?'boss1':'scarab',x,y,hp,maxHp:hp,
 r:elite?30:16,spd:0,elite,t:0,shock:0,marked:0,hit:0,attack:999,
 fire:999,charge:0,slow:0,stun:0,burn:0,chill:0,frost:0,freezeLock:0,
 seed:0,phase:0,shield:0,value:0});
const scenarios=['boss_near','boss_far','horde_near','horde_far','clear_near','clear_far'];
const tier=(process.argv.find(arg=>arg.startsWith('--tier='))||'--tier=invested').slice(7);
if(!['starting','invested'].includes(tier))throw Error('Unknown balance tier: '+tier);
function scene(mode){
 if(mode.startsWith('boss'))return{enemies:[target(mode.endsWith('near')?87:290,0,2e8,true)],duration:16};
 const center=mode.endsWith('near')?0:245,enemies=[];
 for(let i=0;i<40;i++){const angle=i*Math.PI/20,r=48+(i%4)*58;
  enemies.push(target(center+Math.cos(angle)*r,Math.sin(angle)*r,mode.startsWith('clear')?1100:100000));
 }
 return{enemies,duration:16};
}
function simulate(weapons,mode,seed=123){
 const layout=scene(mode),initial=layout.enemies.reduce((sum,e)=>sum+e.hp,0);
 const rng=randFactory(seed),dt=1/30,steps=Math.round(layout.duration/dt);
 const S={t:0,enemy:layout.enemies,
  bosses:mode.startsWith('boss')?[layout.enemies[0]]:[],
  player:{x:0,y:0,rad:16,hp:100,maxHp:100},playerDmg:1,
  critChance:0,critMultiplier:1.5,haste:1,rageTimer:0,chains:[],
  bullets:[],enemyBullets:[],gravityWells:[],mines:[],effects:[],
  parts:[],fx:[],floaters:[],hazards:[],
  drones:weapons.map((id,i)=>({id,
   lvl:tier==='starting'?1:(weapons.length===1&&id.startsWith('fusion_')?15:8),
   mods:{power:tier==='starting'?0:(weapons.length===1&&id.startsWith('fusion_')?4:2)},
   cd:i*.1,hitCd:0})),
  hybrids:[],cam:{x:0,y:0},threat:1};
 let controlTime=0,maxObjects=0,maxFX=0;
 const math=Object.create(Math);math.random=()=>rng();
 const ctx={Math:math,S,TAU:2*Math.PI,RED:'#ff667e',
  TEAL:'#50f2db',AMBER:'#ffc174',PURPLE:'#b988ff',BLUE:'#6dbbff',
  W:960,H:540,trainingMode:false,touching:false,bal:null,shake:0,
  lastLaserImpact:-1000,performance:{now:()=>0},audioBuffers:{},
  sfx:()=>{},sfxWeapon:()=>{},clickSound:()=>{},banner:()=>{},
  toast:()=>{},balDamage:()=>{},balSpawn:()=>{},balFusion:()=>{},
  killEnemy:()=>{},floatNum:()=>{},burst:()=>{},
  rand:(a=0,b=1)=>a+(b-a)*rng(),
  hypot:(x,y)=>Math.max(.0000001,Math.hypot(x,y)),
  clamp:(n,lo,hi)=>Math.max(lo,Math.min(hi,n)),
  lerp:(a,b,t)=>a+(b-a)*t,
  // Raw potential damage is intentionally measured without boss damage caps.
  calculateBossDamage:(e,n)=>({damage:n,damageSecondAt:0,damageSecond:0,
   blockedByHitCap:0,blockedByShield:0,blockedByDpsCap:0,blockedTotal:0})};
 const vmContext=vm.createContext(ctx);
 vm.runInContext(program,vmContext);
 const start=performance.now();
 for(let frame=0;frame<steps;frame++){
  S.t+=dt;
  vmContext.droneUpdate(dt);
  vmContext.updateAreaWeapons(dt);
  vmContext.updateProjectiles(dt);
  for(const e of S.enemy){
   e.slow=Math.max(0,e.slow-dt);
   e.stun=Math.max(0,e.stun-dt);
   e.frost=Math.max(0,e.frost-dt);
   e.freezeLock=Math.max(0,e.freezeLock-dt);
   e.marked=Math.max(0,e.marked-dt);
   e.chill=Math.max(0,e.chill-7*dt);
   if(e.burn>0){
    e.burn=Math.max(0,e.burn-dt);
    e.burnClock=(e.burnClock||0)+dt;
    if(e.burnClock>=1){
     const ticks=Math.floor(e.burnClock);e.burnClock-=ticks;
     vmContext.hurtEnemy(e,ticks*(e.burnStrength||16),{silentHit:true});
    }
   }else{e.burnClock=0;e.burnStrength=0;}
   if(e.slow>0||e.stun>0||e.frost>0)controlTime+=dt;
   if(!mode.startsWith('boss')&&e.hp>0&&e.stun<=0){
    const dist=Math.hypot(e.x,e.y);
    if(dist>8){
     const speed=58*(e.slow>0?.59:1);
     e.x-=e.x/dist*Math.min(dist-8,speed*dt);
     e.y-=e.y/dist*Math.min(dist-8,speed*dt);
    }
   }
  }
  maxObjects=Math.max(maxObjects,S.bullets.length+S.effects.length+
   S.mines.length+S.gravityWells.length+S.chains.length);
  maxFX=Math.max(maxFX,S.fx.length);
 }
 const elapsedMs=performance.now()-start;
 const damage=initial-S.enemy.reduce((sum,e)=>sum+Math.max(0,e.hp),0);
 return {dps:Math.round(damage/layout.duration),damage:Math.round(damage),
  kills:S.enemy.filter(e=>e.hp<=0).length,
  averageControlledEnemies:Math.round(controlTime/layout.duration*100)/100,
  maxObjects,maxFX,msPerTick:Math.round(elapsedMs/steps*10000)/10000};
}
const baseIds=Object.keys(DRONES).filter(id=>!id.startsWith('fusion_'));
const rows=[],failures=[];
for(const id of [...baseIds,...Object.keys(HYBRIDS).map(id=>'fusion_'+id)]){
 const row={id,name:DRONES[id].name},recipe=id.startsWith('fusion_')?HYBRIDS[id.slice(7)]:null;
 if(recipe)row.ingredients=[recipe.a,recipe.b];
 for(const mode of scenarios){
  try{row[mode]=simulate([id],mode);}
  catch(error){failures.push({id,mode,error:String(error)});}
  if(recipe)try{row['parents_'+mode]=simulate([recipe.a,recipe.b],mode);}
  catch(error){failures.push({id,mode:'parents_'+mode,error:String(error)});}
 }
 rows.push(row);
}
if(failures.length)throw Error('Balance audit failed: '+JSON.stringify(failures.slice(0,5)));
const metadata={source:'QA modular gameplay from dist/index.html',
 durationSeconds:16,stepHz:30,tier,
 weaponLevels:tier==='starting'?'1 + 1 to fused level 1':'8 + 8 to fused level 15',
 powerModifiers:tier==='starting'?'0 + 0 to fused 0':'2 + 2 to fused 4',
 targetModes:'near/far boss, moving horde, moving clear wave',
 enemySpeed:58,rawBossDamage:true,realRenderer:false,
 note:'Controlled synthetic comparison; not browser FPS or live-player retention data'};
const report={metadata,rows};
fs.writeFileSync(path.join(root,'dist','balance-report-'+tier+'.json'),JSON.stringify(report,null,2));
if(tier==='invested')fs.writeFileSync(path.join(root,'dist','balance-report.json'),JSON.stringify(report,null,2));
const fmt=n=>Number(n).toFixed(2);
let md='# Relict Swarm: headless weapon balance audit\n\n';
md+='36 weapons; 25 synthesis recipes; 16 s/scene; tier '+tier+'; 30 simulated ticks/s.\\n\\n';
md+='**Caveat:** no graphics rendering or live enemy AI; CPU duration is a relative Node benchmark, not FPS. Boss damage caps disabled to expose underlying damage.\n\n';
md+='| Synthesis | Boss near DPS | Boss far DPS | Horde DPS | Parent pair DPS | Ratio | Clear kills | Objects |\n|---|---:|---:|---:|---:|---:|---:|---:|\n';
for(const r of rows.filter(x=>x.ingredients)){
 const h=r.horde_near.dps,p=r.parents_horde_near.dps;
 md+='| '+r.name+' | '+r.boss_near.dps+' | '+r.boss_far.dps+' | '+
  h+' | '+p+' | '+fmt(h/Math.max(1,p))+'× | '+
  r.clear_near.kills+'/40 | '+r.horde_near.maxObjects+' |\n';
}
md+='\n## Important\n\n';
md+='Ratios compare one fused weapon with its two consumed base weapons under identical, synthetic conditions. Low boss DPS may reflect short attack range rather than bad balance.\n';
fs.writeFileSync(path.join(root,'dist','balance-report-'+tier+'.md'),md);
if(tier==='invested')fs.writeFileSync(path.join(root,'dist','balance-report.md'),md);
const violations=[];
for(const row of rows.filter(r=>r.ingredients)){
 for(const mode of scenarios){
  const fusion=row[mode],original=row['parents_'+mode];
  if(fusion.damage+1<original.damage ||
    (mode.startsWith('clear')&&fusion.kills<original.kills)){
   violations.push({id:row.id,mode,
    fusedDamage:fusion.damage,parentsDamage:original.damage,
    fusedKills:fusion.kills,parentsKills:original.kills});
  }
 }
}
if(violations.length)throw Error('Fusion parity regression '+tier+': '+JSON.stringify(violations.slice(0,10)));
console.log('Fusion >= parent pair: '+rows.filter(r=>r.ingredients).length+' recipes × '+scenarios.length+' scenarios, tier '+tier+' PASS');
console.log('Balance audit: '+rows.length+' weapons, '+scenarios.length+
 ' scenarios, '+failures.length+' failures; reports in dist/.');
