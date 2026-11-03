// Isolated gameplay QA build only: debug controls appear during ordinary pause.
let qaWeapon='pulse',qaEnemy='scarab',qaSlot='new',qaCount=12,qaLevel=1;
function qaPauseHTML(){
 const opts=(map,picked)=>Object.entries(map).map(([id,v])=>'<option value="'+id+'"'+(id===picked?' selected':'')+'>'+v.name+'</option>').join('');
 const slots='<option value="new">Свободный слот</option>'+S.drones.map((d,i)=>'<option value="'+i+'"'+(qaSlot===String(i)?' selected':'')+'>'+(i+1)+': '+DRONES[d.id].name+'</option>').join('');
 const active=S.drones[Number(qaSlot)];
 const mods=active?weaponBranches(active.id).map(([key,name])=>'<option value="'+key+'">'+name+' +'+wm(active,key)+'</option>').join(''):'';
 return '<details class="qa-pause" id="qaPause" open><summary>⚙ ТЕСТОВАЯ ПАНЕЛЬ: ОРУЖИЕ И ВРАГИ</summary>'+
 '<p>Меняй арсенал и создавай врагов прямо во время паузы. Текущий опубликованный билд не затрагивается.</p>'+
 '<div class="qa-inventory">'+(S.drones.map((d,i)=>'<span>'+(i+1)+'. '+DRONES[d.id].name+' ур.'+d.lvl+'</span>').join('')||'Оружия нет')+'</div>'+
 '<label>Оружие<select id="qaWeapon">'+opts(DRONES,qaWeapon)+'</select></label>'+
 '<label>Слот<select id="qaSlot">'+slots+'</select></label>'+
 '<div class="qa-row"><label>Уровень<input id="qaLevel" type="number" min="1" max="150" value="'+qaLevel+'"></label><button id="qaEquip" type="button">ДОБАВИТЬ / ЗАМЕНИТЬ</button></div>'+
 (active?'<div class="qa-row"><select id="qaMod">'+mods+'</select><button id="qaBoost" type="button">+5 УЛУЧШЕНИЙ</button></div>':'')+
 '<div class="qa-row"><button id="qaRemove" type="button">УБРАТЬ СЛОТ</button><button id="qaEmpty" type="button">ОЧИСТИТЬ АРСЕНАЛ</button></div>'+
 '<label>Тип врага<select id="qaEnemy">'+opts(ENEMY,qaEnemy)+'</select></label>'+
 '<div class="qa-row"><label>Количество<input id="qaCount" type="number" min="1" max="40" value="'+qaCount+'"></label><button id="qaSpawn" type="button">СОЗДАТЬ ВРАГОВ</button></div>'+
 '<div class="qa-row"><button id="qaKill" type="button">УБРАТЬ ВРАГОВ</button><button id="qaCore" type="button">+1 ЯДРО</button></div>'+ 
 '<div class="qa-row"><button type="button" id="qaRage">ϟ ЯРОСТЬ</button><button type="button" id="qaTimeStop">❄ ОСТАНОВКА ВРЕМЕНИ</button></div>'+
 '<div class="qa-row"><button id="qaBossPhase" type="button">БОСС: 2-Я ФАЗА</button><button id="qaClearHazards" type="button">УБРАТЬ УГРОЗЫ</button></div>'+
 '<small>Боссы создаются по одному; обычные враги ограничены лимитом игры. После настройки нажми «Продолжить».</small></details>';
}

function qaWirePause(){
 const el=id=>document.getElementById(id);
 const refresh=()=>{el('qaPause').outerHTML=qaPauseHTML();qaWirePause();updateHUD();};
 el('qaWeapon').onchange=()=>qaWeapon=el('qaWeapon').value;
 el('qaEnemy').onchange=()=>qaEnemy=el('qaEnemy').value;
 el('qaSlot').onchange=()=>{qaSlot=el('qaSlot').value;refresh();};
 el('qaLevel').onchange=()=>qaLevel=Math.max(1,Math.min(150,+el('qaLevel').value||1));
 el('qaCount').onchange=()=>qaCount=Math.max(1,Math.min(40,+el('qaCount').value||1));
 el('qaEquip').onclick=()=>{S.qaModified=true;
  qaLevel=Math.max(1,Math.min(150,+el('qaLevel').value||1));
  if(qaSlot==='new'&&S.drones.length>=MAX_WEAPONS){toast('ВЫБЕРИ СЛОТ ДЛЯ ЗАМЕНЫ',2);return;}
  const d={id:qaWeapon,lvl:qaLevel,mods:{},cd:0,hitCd:0};
  if(qaSlot==='new')S.drones.push(d);else S.drones[+qaSlot]=d;
  qaSlot=String(S.drones.indexOf(d));qaSyncFusions();refresh();
 };
 if(el('qaBoost'))el('qaBoost').onclick=()=>{S.qaModified=true;
  const d=S.drones[+qaSlot],key=el('qaMod').value;if(!d||!key)return;
  d.mods[key]=(d.mods[key]||0)+5;d.lvl+=5;refresh();
 };
 el('qaRemove').onclick=()=>{S.qaModified=true;if(qaSlot!=='new'&&S.drones[+qaSlot]){S.drones.splice(+qaSlot,1);qaSlot='new';qaSyncFusions();refresh();}};
 el('qaEmpty').onclick=()=>{S.qaModified=true;S.drones=[];S.hybrids=[];qaSlot='new';refresh();};
 el('qaSpawn').onclick=()=>{S.qaModified=true;
  qaCount=Math.max(1,Math.min(40,+el('qaCount').value||1));
  const boss=qaEnemy.startsWith('boss')||qaEnemy.startsWith('synth')||qaEnemy==='omega';
  const n=boss?1:qaCount;
  for(let i=0;i<n;i++)spawnEnemy(qaEnemy,TAU*(i+.5)/n,210+(i%4)*62);
  refresh();
 };
 el('qaKill').onclick=()=>{S.qaModified=true;S.enemy=[];S.bosses=[];S.enemyBullets=[];S.hazards=[];S.chains=[];S.bullets=[];S.effects=[];S.mines=[];S.gravityWells=[];refresh();};
 el('qaClearHazards').onclick=()=>{S.qaModified=true;S.enemyBullets=[];S.hazards=[];S.chains=[];refresh();};
 el('qaBossPhase').onclick=()=>{S.qaModified=true;
  const boss=[...S.bosses].reverse().find(e=>e.hp>0);
  if(!boss){toast('СНАЧАЛА СОЗДАЙ БОССА',2);return;}
  boss.hp=Math.min(boss.hp,boss.maxHp*.49);
  boss.phase=1;boss.shield=0;boss.special=0;boss.bossCycle=0;boss.bossDashWind=0;
  S.hazards=S.hazards.filter(h=>h.owner!==boss);
  banner('⚠ QA: ВТОРАЯ ФАЗА '+ENEMY[boss.id].name,2);
  refresh();
 };
 el('qaCore').onclick=()=>{S.qaModified=true;S.fusionCores++;refresh();};
 el('qaRage').onclick=()=>{S.qaModified=true;applyPowerup({type:'rage'});refresh();};
 el('qaTimeStop').onclick=()=>{S.qaModified=true;applyPowerup({type:'timeStop'});refresh();};
}
function qaSyncFusions(){
 S.hybrids=S.drones.filter(d=>d.id.startsWith('fusion_')).map(d=>({id:d.id.slice(7)}));
}
