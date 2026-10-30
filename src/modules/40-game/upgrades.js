function eligibleHybrids(){return eligibleFusionIds(S,HYBRIDS);}
function rarityRoll(){let sum=RARITIES.reduce((a,r)=>a+r.chance,0),k=rand(0,sum);for(const r of RARITIES){k-=r.chance;if(k<=0)return r}return RARITIES[0]}
function upgradeChoices(){
 const pool=[];
 for(const id of Object.keys(DRONES)){
  const d=S.drones.find(x=>x.id===id);
  if(!d){if(BASE_WEAPONS.includes(id)&&S.drones.length<MAX_WEAPONS)pool.push({kind:'new',id,weight:4.5});}
  else {const rarity=rarityRoll(),keys=weaponBranches(id).map(b=>b[0]).sort(()=>Math.random()-.5).slice(0,rarity.steps);pool.push({kind:'weapon',id,rarity,keys,weight:7.2});}
 }
 // v0.10.10: support modules should be a meaningful option, not an ~5% lottery.
  // A repair pack appears only when at least 24 hull points are missing.
  for(const id of ['damage','speed','hp','cooldown','magnet','heal']){
    if(id==='heal' && S.player.hp>S.player.maxHp-24)continue;
    pool.push({kind:'stat',id,weight:2.2});
  }
 const out=[];
 while(out.length<3&&pool.length){let sum=pool.reduce((a,o)=>a+o.weight,0),r=rand(0,sum),chosen=pool[pool.length-1];for(const o of pool){r-=o.weight;if(r<=0){chosen=o;break}}
  out.push(chosen);pool.splice(pool.indexOf(chosen),1);
 }
 return out;
}
// The card shows individual effects, not a prose string joining unrelated stats.
function weaponBonusRows(id,key,drone){
 const entry=weaponBranches(id).find(x=>x[0]===key);
 const label=entry?.[1]||key;
 const before=wm(drone,key),after=before+1;
 const f=n=>Number(n.toFixed(1)).toLocaleString('ru');
 const delta=(fn,unit=' ед.')=>'+'+f(Math.max(0,fn(after)-fn(before)))+unit;
 const ratio=(fn)=>'+'+f(Math.max(0,100*(fn(after)/Math.max(.00001,fn(before))-1)))+'%';
 if(key==='power')return [{label:'Урон оружия',value:'+'+f(20/(1+.2*before))+'%'}];
 if(key==='spin'&&['saw','fusion_thermal','fusion_tesla','fusion_frostblade','fusion_magnetblade'].includes(id))return [
  {label:'Скорость вращения',value:ratio(n=>1+.7*Math.log1p(n))},
  {label:'Частота нанесения урона',value:ratio(n=>1+.25*Math.log1p(n))}];
 if(id==='cryo'&&key==='chill')return [
  {label:'Накопление холода',value:ratio(n=>1+.56*Math.log1p(n))},
  {label:'Бонус по охлаждённым',value:'+'+f(100*.22*(Math.log1p(after)-Math.log1p(before)))+' п.п.'}];
 if(id==='saw'&&key==='radius')return [{label:'Расстояние пилы от робота',value:delta(n=>Math.min(310,Math.max(69+n*19,Math.min(10,1+wm(drone,'count'))*21)))}];
 if(key==='rate')return [{label:'Частота атак',value:ratio(n=>1+.4*Math.log1p(n))}];
 if(id==='rocket'&&key==='blast')return [{label:'Радиус взрыва',value:delta(n=>54+22*Math.sqrt(n))}];
 if(id==='cryo'&&key==='range')return [{label:'Дальность морозного веера',value:delta(n=>230+22*Math.sqrt(n))}];
 if(id==='flame'&&key==='range')return [{label:'Длина пламени',value:delta(n=>205+24*Math.sqrt(n))}];
 if(id==='gravity'&&key==='radius')return [{label:'Радиус захвата',value:delta(n=>90+20*Math.sqrt(n))}];
 if(id==='gravity'&&key==='duration')return [{label:'Время действия',value:delta(n=>2.8+.5*Math.sqrt(n),' с')}];
 if(id==='arc'&&key==='range')return [{label:'Радиус цепной молнии',value:delta(n=>205+28*Math.sqrt(n))}];
 if(id==='rail'&&key==='width')return [{label:'Ширина луча',value:delta(n=>11+6*Math.sqrt(n))}];
 if(key==='count'&&entry?.[2].includes('устройство')){
  const type=(id.includes('blade')||id.includes('thermal')||id.includes('tesla')?'пила':id.includes('mine')||id.includes('singularity')?'мина':id.includes('disc')?'диск':'боевой элемент');
  return [{label:'Количество: '+type,value:'+1'}];
 }
 // All other single effects are shown one per line, with their original data label.
 return [{label,value:entry?.[2]||'+1 параметр'}];
}
function describeUpgrade(u){
 // UI type is intentionally independent of rarity: colours encode the action,
 // while rarity is a secondary label only on upgrades.
 if(u.kind==='weapon'){
  const d=DRONES[u.id],rank=S.drones.find(x=>x.id===u.id).lvl,r=u.rarity;
   const drone=S.drones.find(x=>x.id===u.id);
   const rows=u.keys.flatMap(k=>weaponBonusRows(u.id,k,drone));
  return {name:`${d.name} · УР. ${rank+1}`,glyph:d.glyph,kind:'УЛУЧШЕНИЕ ОРУЖИЯ',type:'weapon',rarity:r,rows};
 }
 if(u.kind==='new'){
  const d=DRONES[u.id];
  return {name:d.name,glyph:d.glyph,kind:'НОВОЕ ОРУЖИЕ',type:'new',
   desc:d.desc,rows:[{label:'Занимает слот',value:`${S.drones.length+1}/${MAX_WEAPONS}`} ]};
 }
 const stats={
  damage:{name:'Перегрузка',glyph:'ϟ',rows:[{label:'Урон всех дронов',value:'+10%'}]},
  speed:{name:'Форсаж',glyph:'➤',rows:[{label:'Скорость движения',value:'+12%'}]},
  hp:{name:'Дополнительная броня',glyph:'⬡',rows:[{label:'Максимальная прочность',value:'+24'},{label:'Ремонт корпуса',value:'+24'}]},
  cooldown:{name:'Синхронизация',glyph:'⌁',rows:[{label:'Скорость атак дронов',value:'+8%'}]},
  magnet:{name:'Поле захвата',glyph:'◎',rows:[{label:'Радиус сбора данных',value:'+40'}]},
  heal:{name:'Ремонтный пакет',glyph:'✚',rows:[{label:'Восстановить корпус',value:'+40'}]}
 };
 const data=stats[u.id];
 return {name:data.name,glyph:data.glyph,kind:'ПАССИВНЫЙ МОДУЛЬ',type:'stat',rows:data.rows};
}
function upgradeCardHtml(u,i){
 const d=describeUpgrade(u);
 const rarity=d.rarity?`<span class="up-rarity" style="--rarity-color:${d.rarity.col}"><span class="rarity-dot" aria-hidden="true"></span>${d.rarity.name.toLowerCase()} · ${d.rarity.steps} ${d.rarity.steps===1?'параметр':d.rarity.steps<5?'параметра':'параметров'}</span>`:'';
 const rows=(d.rows||[]).map(r=>`<li class="up-stat-row"><span>${r.label}</span><strong>${r.value}</strong></li>`).join('');
 return `<button type="button" class="upgrade-card upgrade-v2 upgrade-card--${d.type}" data-up="${i}" aria-label="${d.kind}: ${d.name}">
  <span class="up-type-row"><span class="kind">${d.kind}</span>${rarity}</span>
  <span class="up-heading"><span class="glyph" aria-hidden="true">${d.glyph}</span><strong class="up-name">${d.name}</strong></span>
  ${d.desc?`<span class="up-description">${d.desc}</span>`:''}
  ${rows?`<ul class="up-stats">${rows}</ul>`:''}
  <span class="number"><span class="up-action">ВЫБРАТЬ</span><span class="up-key">${i+1}</span></span>
 </button>`;
}
function showUpgrades(){
 if(S.pendingUp<1)return;
 S.upgrades=upgradeChoices();setMode('upgrade');
 $('modalContent').innerHTML=`<div class="upgrade-v2-screen">
  <div class="upgrade-topline"><div class="panel-title">ВЫБЕРИ МОДИФИКАЦИЮ</div><div class="label">УР. ${S.lvl}</div></div>
  <p class="up-short-summary">Оружие: ${S.drones.length}/${MAX_WEAPONS} · Выбери одну из трёх модификаций</p>
  <div class="upgrade-list">${S.upgrades.map((u,i)=>upgradeCardHtml(u,i)).join('')}</div>
  <p class="up-bottom-hint">Цвет рамки означает тип выбора. Редкость улучшения показана отдельно.</p>
 </div>`;
 $('modalContent').querySelectorAll('[data-up]').forEach(el=>el.onclick=()=>chooseUpgrade(+el.dataset.up));
 clickSound(810,.14,'triangle');
}
function chooseUpgrade(idx){
 if(mode!=='upgrade'||!S.upgrades[idx])return;
 const u=S.upgrades[idx],p=S.player;
 if(u.kind==='new'){if(S.drones.length>=MAX_WEAPONS||!BASE_WEAPONS.includes(u.id)||S.drones.some(d=>d.id===u.id))return;S.drones.push({id:u.id,lvl:1,cd:0,hitCd:0,mods:{}});banner('✦ НОВОЕ ОРУЖИЕ: '+DRONES[u.id].name,2.5);}
 else if(u.kind==='weapon'){
  const d=S.drones.find(x=>x.id===u.id);if(!d)return;
  for(const key of u.keys)d.mods[key]=(d.mods[key]||0)+1;
  d.lvl++;
  banner('✦ '+DRONES[u.id].name+' УР. '+d.lvl+' · '+u.rarity.name,2.4);
  burst(p.x,p.y,u.rarity.col,14+u.rarity.steps*9,150);
 }else switch(u.id){case'damage':S.playerDmg*=1.10;break;case'speed':p.speed*=1.12;break;case'hp':p.maxHp+=24;p.hp+=24;break;case'cooldown':S.haste=(S.haste||1)*1.08;break;case'magnet':S.magnet+=40;break;case'heal':heal(40);break;}
 balChoose(u);S.pendingUp--;sfx('level');
 if(S.pendingUp>0)showUpgrades();else{setMode('playing');last=performance.now();updateHUD();}
}
function forgeReadiness(id){const h=HYBRIDS[id],a=S.drones.find(d=>d.id===h.a),b=S.drones.find(d=>d.id===h.b);
 if(S.hybrids.some(z=>z.id===id))return '✓ УЖЕ СОЗДАНО';
 if(!a||!b)return 'Нужны оба исходных оружия';

 if(S.fusionCores<1)return 'Нужно ядро особого босса синтеза';
 if(S.hybrids.length>=3)return 'Предел: 3 синтеза за забег';
 return '✦ ГОТОВО К ПРЕОБРАЗОВАНИЮ';}
function openForge(){if(trainingMode){renderTrainingPanel(true);return;}if(!S||mode!=='playing')return;setMode('forge');const ready=eligibleHybrids();$('modalContent').innerHTML=`<div class="label">◈ ПРОТОКОЛ СИНТЕЗА</div><div class="panel-title">ДВА ОРУЖИЯ → ОДНО НОВОЕ</div><p class="panel-desc">Ядра: <b style="color:#ffcb71">◈ ${S.fusionCores}</b>. Уровень оружия не важен: даже оружия 1-го уровня подходят. За камень победи и подбери добычу Хранителя ядра (≈4:25), Кузнеца хаоса (≈9:10) или Сбоя реактора (≈12:45). Синтез <b>уничтожит два исходных оружия</b> и создаст одно уникальное с новой механикой и последующей бесконечной прокачкой.</p><div class="label">${ready.length} РЕЦЕПТОВ ДОСТУПНО · ${Object.keys(HYBRIDS).length} ВСЕГО</div><div class="forge-filter"><label for="recipeFilter">ФИЛЬТР</label><select id="recipeFilter"><option value="all">Все 25 рецептов</option><option value="ready">Только доступные</option>${BASE_WEAPONS.map(id=>`<option value="${id}">${DRONES[id].name}</option>`).join('')}</select><button type="button" id="allRecipes">СБРОСИТЬ</button></div><div class="forge-grid">${Object.entries(HYBRIDS).sort(([id1],[id2])=>Number(ready.includes(id2))-Number(ready.includes(id1))).map(([id,h])=>{const ok=ready.includes(id),done=S.hybrids.some(z=>z.id===id);return `<${ok?'button type="button"':'div'} data-a="${h.a}" data-b="${h.b}" data-ready="${ok}" class="forge-card ${done?'is-done':ok?'is-ready':'is-locked'}" ${ok?`data-forge="${id}"`:''}><b style="color:${h.color}">${h.glyph} ${h.name}</b><small>${DRONES[h.a].name} + ${DRONES[h.b].name}</small><p>${h.desc}</p><small>${forgeReadiness(id)}</small></${ok?'button':'div'}>`}).join('')}</div><button class="btn primary" id="backForge">◂ НАЗАД В БОЙ</button>`;$('modalContent').querySelectorAll('[data-forge]').forEach(el=>el.onclick=()=>forgeHybrid(el.dataset.forge));$('backForge').onclick=()=>{setMode('playing');last=performance.now()};const applyRecipeFilter=()=>{const val=$('recipeFilter').value;for(const el of $('modalContent').querySelectorAll('.forge-card'))el.hidden=val==='all'?false:val==='ready'?el.dataset.ready!=='true':(el.dataset.a!==val&&el.dataset.b!==val)};$('recipeFilter').onchange=applyRecipeFilter;$('allRecipes').onclick=()=>{$('recipeFilter').value='all';applyRecipeFilter()};}
function forgeHybrid(id){if(mode!=='forge'||!eligibleHybrids().includes(id))return;const h=HYBRIDS[id],a=S.drones.find(d=>d.id===h.a),b=S.drones.find(d=>d.id===h.b);
 const newWeapon=createFusionWeapon(id,a,b,weaponBranches('fusion_'+id));
 S.drones=S.drones.filter(d=>d!==a&&d!==b);
 S.drones.push(newWeapon);
 S.fusionCores--;S.hybrids.push({id});balFusion(id);save.recipes[id]=true;persist();
 setMode('playing');last=performance.now();burst(S.player.x,S.player.y,h.color,100,340);S.fx.push({type:'ring',x:S.player.x,y:S.player.y,r:80,life:1.2,max:1.2,col:h.color});shake=15;banner('◈ НОВОЕ ОРУЖИЕ: '+h.name,5);sfx('fusion');updateHUD();
}
