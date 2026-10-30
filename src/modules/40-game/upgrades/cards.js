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
