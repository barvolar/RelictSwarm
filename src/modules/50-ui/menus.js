function skinSvg(id){
 const s=SKINS[id]||SKINS.relict;
 const fins=s.variant==='ghost'?'<path d="M28 60 5 41 10 81 31 88M92 60 115 41 110 81 89 88" fill="#285581" stroke="'+s.edge+'" stroke-width="3"/>':s.variant==='ember'?'<path d="M31 53 18 16 39 36M89 53 102 16 81 36" fill="'+s.back+'" stroke="'+s.trim+'" stroke-width="3"/>':s.variant==='void'?'<path d="M30 49 12 20 17 68 8 84 34 81M90 49 108 20 103 68 112 84 86 81" fill="'+s.back+'" stroke="'+s.edge+'" stroke-width="3"/>':'';
 return `<svg viewBox="0 0 120 150" class="skin-art" role="img" aria-label="Облик ${s.name}"><ellipse cx="60" cy="127" rx="42" ry="11" fill="${s.core}" opacity=".16"/><g stroke-linejoin="round">${fins}<path d="M32 80 21 90 23 118 39 119 45 91M88 80 99 90 97 118 81 119 75 91" fill="${s.back}" stroke="${s.edge}" stroke-width="2.5"/><path d="M26 63 16 51 17 81 32 94 42 77M94 63 104 51 103 81 88 94 78 77" fill="${s.back}" stroke="${s.plate}" stroke-width="3"/><path d="M60 13 88 26 96 66 82 104 60 116 38 104 24 66 32 26Z" fill="${s.body}" stroke="${s.edge}" stroke-width="3"/><path d="M60 20 78 30 80 46 60 39 40 46 42 30Z" fill="${s.plate}"/><path d="M31 66 48 50 60 59 72 50 89 66 77 85 60 92 43 85Z" fill="${s.shell}" stroke="${s.plate}" stroke-width="2"/><path d="M43 66 60 50 77 66 71 86 49 86Z" fill="${s.coreDark}" stroke="${s.light}" stroke-width="2.5"/><path d="M60 55 71 66 67 79 53 79 49 66Z" fill="${s.core}"/><path d="M37 78 29 88M83 78 91 88" stroke="${s.trim}" stroke-width="5"/><path d="M48 32 60 26 72 32" fill="none" stroke="${s.light}" stroke-width="3"/></g></svg>`;
}
function menu(){
 setMode('menu');
 const skin=equippedSkin();
 $('modalContent').innerHTML=`<div class="main-home"><div class="home-unit">${skinSvg(save.skin)}<div><span class="label">АКТИВНАЯ ОБОЛОЧКА</span><strong>${skin.name}</strong><small>✧ ${save.shards} кристаллов · лучший счёт ${save.best.toLocaleString('ru')}</small></div></div><div class="home-actions"><button id="mainPlay" class="btn primary home-btn">▶ ИГРАТЬ</button><button id="mainUpgrade" class="btn home-btn">⬡ ПРОКАЧКА</button><button id="mainSettings" class="btn home-btn">⚙ НАСТРОЙКИ</button></div></div>`;
 $('mainPlay').onclick=showPlayMenu;
 $('mainUpgrade').onclick=()=>showProgression('upgrades');
 $('mainSettings').onclick=showSettings;
}
function showPlayMenu(){
 setMode('menu');
 $('modalContent').innerHTML=`<div class="label">[ ПОДГОТОВКА К ЗАБЕГУ ]</div><div class="panel-title">Протокол выживания</div><p class="panel-desc">Продержись 15 минут, отражай атаки роя и собирай оружие. Облик: <b style="color:${equippedSkin().core}">${equippedSkin().name}</b>.</p><div class="threat-select"><label for="threatMode">УРОВЕНЬ УГРОЗЫ</label><select id="threatMode">${THREAT_MODES.map((x,i)=>`<option value="${i+1}" ${i+1>save.threatUnlocked?'disabled':''} ${i+1===selectedThreat?'selected':''}>${x.name}${i+1>save.threatUnlocked?' 🔒':''}</option>`).join('')}</select><small id="threatHint"></small></div><div class="button-row"><button id="startBtn" class="btn primary">▶ НАЧАТЬ ЗАБЕГ</button><button id="backHome" class="btn ghost">◂ НАЗАД</button></div><p class="tiny" style="margin-top:15px">Телефон: виртуальный джойстик и кнопка рывка. Автоатака включена.</p>`;
 const hint=()=>{$('threatHint').textContent=THREAT_MODES[selectedThreat-1].hint+' · Награда ×'+THREAT_MODES[selectedThreat-1].reward;};
 $('threatMode').onchange=()=>{selectedThreat=Number($('threatMode').value);hint()};hint();
 $('startBtn').onclick=start;$('backHome').onclick=menu;
}
function showProgression(tab='upgrades'){
 setMode('menu');
 const upgrade=tab!=='skins';
 $('modalContent').innerHTML=`<div class="section-top"><div><div class="label">[ АНГАР ]</div><div class="panel-title">Прокачка</div></div><button id="backHome" class="btn ghost small-back">◂ НАЗАД</button></div><div class="shop-head"><span class="tiny">Постоянные улучшения и облики</span><div class="wallet">✧ <span id="wallet">${save.shards}</span></div></div><div class="garage-tabs"><button id="tabUpgrades" class="btn ${upgrade?'primary':'ghost'}" aria-pressed="${upgrade}">МОДУЛИ</button><button id="tabSkins" class="btn ${!upgrade?'primary':'ghost'}" aria-pressed="${!upgrade}">СКИНЫ</button></div>${upgrade?`<div class="shop-grid" id="shop"></div><div class="line"></div><div class="label">ИССЛЕДОВАННЫЕ СИНТЕЗЫ</div><p class="tiny">Новые типы вооружения открываются в забегах.</p><div id="lab" class="lab-grid"></div>`:`<p class="tiny skin-info">Скины изменяют только внешний вид робота. Урон, здоровье и скорость не меняются. Выбранный облик сохраняется на устройстве.</p><div id="skinsGrid" class="skins-grid"></div>`}`;
 $('backHome').onclick=menu;
 $('tabUpgrades').onclick=()=>showProgression('upgrades');
 $('tabSkins').onclick=()=>showProgression('skins');
 if(upgrade){renderShop();renderLab();}else renderSkins();
}
function renderSkins(){
 const el=$('skinsGrid');if(!el)return;
 el.innerHTML=Object.entries(SKINS).map(([id,s])=>{
  const owned=save.skins.includes(id),active=save.skin===id;
  const label=active?'✓ ВЫБРАН':owned?'ВЫБРАТЬ':'✧ '+s.cost;
  return `<div class="skin-card ${active?'selected':''}" style="--skin-color:${s.core}"><div class="skin-preview">${skinSvg(id)}</div><div class="skin-copy"><strong>${s.name}</strong><p>${s.detail}</p><small>${owned?'В КОЛЛЕКЦИИ':'ЦЕНА: '+s.cost+' ✧'}</small></div><button class="btn ${active?'ghost':'primary'}" type="button" data-skin="${id}" ${active||(!owned&&save.shards<s.cost)?'disabled':''}>${label}</button></div>`;
 }).join('');
 el.querySelectorAll('[data-skin]').forEach(b=>b.onclick=()=>{
  const id=b.dataset.skin,s=SKINS[id];if(!s)return;
  if(!save.skins.includes(id)){
   if(save.shards<s.cost)return;
   save.shards-=s.cost;save.skins.push(id);
  }
  save.skin=id;persist();clickSound();$('wallet').textContent=save.shards;renderSkins();
 });
}
function showSettings(){
 setMode('menu');
 $('modalContent').innerHTML=`<div class="section-top"><div><div class="label">[ СИСТЕМА ]</div><div class="panel-title">Настройки</div></div><button id="backHome" class="btn ghost small-back">◂ НАЗАД</button></div><div class="settings-action"><button id="soundBtn" class="btn">${mute?'♪ ВКЛЮЧИТЬ ЗВУК':'♫ ВЫКЛЮЧИТЬ ЗВУК'}</button><button id="howBtn" class="btn ghost">? КАК ИГРАТЬ</button></div>${audioMixerHTML()}${balPanelHTML()}${perfSettingsHTML()}${window.SwarmTelemetry?.settingsHTML?.()||''}`;
 $('backHome').onclick=menu;$('soundBtn').onclick=soundToggle;
 $('howBtn').onclick=showHow;bindAudioMixer();bindPerfSettings();
}
function renderShop(){let el=$('shop');if(!el)return;el.innerHTML=META.map(m=>{let n=save.meta[m.id]||0,price=m.cost+n*m.step,full=n>=m.max;return `<div class="shop-item"><div class="upgrade-title"><span style="color:#5af5de">${m.glyph}</span> ${m.name}</div><p>${m.sub}</p><div class="price"><span class="rank">${n}/${m.max} УР.</span><button data-buy="${m.id}" class="btn" ${full||save.shards<price?'disabled':''}>${full?'МАКС':'✧ '+price}</button></div></div>`}).join('');el.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{let m=META.find(z=>z.id===b.dataset.buy),n=save.meta[m.id]||0,cost=m.cost+n*m.step;if(n>=m.max||save.shards<cost)return;save.shards-=cost;save.meta[m.id]=n+1;persist();clickSound(540,.13);$('wallet').textContent=save.shards;renderShop()})}
function renderLab(){
 const sh=$('lab');if(!sh)return;
 sh.innerHTML=Object.entries(HYBRIDS).map(([id,h])=>`<div class="lab-entry ${save.recipes?.[id]?'found':''}"><span style="color:${h.color}">${h.glyph}</span><div><b>${h.name}</b><small>${DRONES[h.a].name} + ${DRONES[h.b].name} · ядро особого босса</small></div><em>${save.recipes?.[id]?'ОТКРЫТО':'НЕ ИЗУЧЕНО'}</em></div>`).join('');
}
function showHow(){setMode('menu');$('modalContent').innerHTML=`<div class="label">ИНСТРУКЦИЯ</div><div class="panel-title">СОБИРАЙ НЕПОВТОРИМЫЙ БИЛД</div><p class="panel-desc">Каждая карточка оружия увеличивает его уровень на +1. Обычная улучшает один параметр, необычная два, редкая три, эпическая все четыре. Верхнего предела уровней нет. Два разных оружия любого уровня и камень сильного босса синтеза превращаются в одно совершенно новое оружие. Его тоже можно прокачивать бесконечно.</p><div class="howto"><span>WASD / стрелки</span><span>Пробел — рывок</span><span>F — синтез</span><span>ESC — пауза</span><span>Телефон: джойстик и ⚡</span></div><p class="panel-desc">Бонусы на арене: ✚ ремонт, ◎ магнит всех данных, ϟ ярость и ⬡ неуязвимость. Особые боссы синтеза появляются примерно на 3:10 и 6:10. Обычные боссы НЕ дают камни.</p><button class="btn primary" id="backFromHow">ПОНЯТНО</button>`;$('backFromHow').onclick=showSettings}
// v0.10.15: Local balance telemetry. No network requests, identifiers, or gameplay changes.
