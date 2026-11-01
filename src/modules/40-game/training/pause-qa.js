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
 '<small>Боссы создаются по одному; обычные враги ограничены лимитом игры. После настройки нажми «Продолжить».</small></details>';
}
