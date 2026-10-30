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
