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
function scene(mode){
 if(mode.startsWith('boss'))return{enemies:[target(mode.endsWith('near')?87:290,0,2e8,true)],duration:16};
 const center=mode.endsWith('near')?0:245,enemies=[];
 for(let i=0;i<40;i++){const angle=i*Math.PI/20,r=48+(i%4)*58;
  enemies.push(target(center+Math.cos(angle)*r,Math.sin(angle)*r,mode.startsWith('clear')?1100:100000));
 }
 return{enemies,duration:16};
}
