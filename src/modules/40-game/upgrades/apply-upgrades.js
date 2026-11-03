function showUpgrades(){
 if(S.pendingUp<1)return;
 S.upgrades=upgradeChoices();setMode('upgrade');
 renderUpgradeScreen();
 clickSound(810,.14,'triangle');
}
function renderUpgradeScreen(){
 const available=canUseReroll();
 $('modalContent').innerHTML=`<div class="upgrade-v2-screen">
  <div class="upgrade-topline"><div class="panel-title">ВЫБЕРИ МОДИФИКАЦИЮ</div><div class="label">УР. ${S.lvl}</div></div>
  <p class="up-short-summary">Оружие: ${S.drones.length}/${MAX_WEAPONS} · Выбери одну из трёх модификаций</p>
  <div class="upgrade-list">${S.upgrades.map((u,i)=>upgradeCardHtml(u,i)).join('')}</div>
  <div class="upgrade-reroll-row">
   <button type="button" class="btn upgrade-reroll" data-reroll="free" ${available?'':'disabled'}>${available?'↻ ПЕРЕБРОСИТЬ 3 КАРТОЧКИ':'↻ РЕРОЛЛ ИСПОЛЬЗОВАН'}</button>
   <span class="up-reroll-count">Бесплатных перебросов: ${Math.max(0,S.rerollsRemaining||0)} / ${S.rerollStartCount||1} за забег</span>
  </div>
  <p class="up-bottom-hint">Реролл заменяет все три карточки без повторов. Цвет рамки означает тип выбора, редкость показана отдельно.</p>
 </div>`;
 $('modalContent').querySelectorAll('[data-up]').forEach(el=>el.onclick=()=>chooseUpgrade(+el.dataset.up));
 const reroll=$('modalContent').querySelector('[data-reroll]');if(reroll)reroll.onclick=requestReroll;
}
function chooseUpgrade(idx){
 if(mode!=='upgrade'||!S.upgrades[idx])return;
 const u=S.upgrades[idx],p=S.player;
 if(u.kind==='new'){if(S.drones.length>=MAX_WEAPONS||!BASE_WEAPONS.includes(u.id)||S.drones.some(d=>d.id===u.id))return;S.drones.push({id:u.id,lvl:1,cd:0,hitCd:0,mods:{}});if(S.challengeStats)S.challengeStats.maxWeapons=Math.max(S.challengeStats.maxWeapons,S.drones.length);banner('✦ НОВОЕ ОРУЖИЕ: '+DRONES[u.id].name,2.5);}
 else if(u.kind==='weapon'){
  const d=S.drones.find(x=>x.id===u.id);if(!d)return;
  for(const key of u.keys)d.mods[key]=(d.mods[key]||0)+1;
  d.lvl++;
  banner('✦ '+DRONES[u.id].name+' УР. '+d.lvl+' · '+u.rarity.name,2.4);
  burst(p.x,p.y,u.rarity.col,14+u.rarity.steps*9,150);
 }else switch(u.id){case'damage':S.playerDmg*=1.10;break;case'speed':p.speed*=1.12;break;case'hp':p.maxHp+=24;p.hp+=24;break;case'cooldown':S.haste=(S.haste||1)*1.08;break;case'magnet':S.magnet+=40;break;case'heal':if(S.challengeStats)S.challengeStats.manualHeals++;heal(40);break;}
 balChoose(u);S.pendingUp--;sfx('level');
 if(S.pendingUp>0)showUpgrades();else{setMode('playing');last=performance.now();updateHUD();}
}
