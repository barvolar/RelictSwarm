let activeMetaTab='hull';
function renderShop(){
 const root=$('shop');if(!root)return;
 const group=META_GROUPS.find(g=>g.id===activeMetaTab)||META_GROUPS[0];
 const total=META.reduce((a,m)=>a+metaLevel(m.id),0),max=META.reduce((a,m)=>a+m.max,0);
 const tabs=META_GROUPS.map(g=>{
  const mods=META.filter(m=>m.group===g.id);
  const invested=mods.reduce((a,m)=>a+metaLevel(m.id),0),maximum=mods.reduce((a,m)=>a+m.max,0);
  return `<button type="button" class="research-tab ${g.id===group.id?'selected':''}" data-meta-tab="${g.id}" aria-pressed="${g.id===group.id}"><strong>${g.glyph} ${g.name}</strong><small>${invested}/${maximum}</small></button>`;
 }).join('');
 const rows=META.filter(m=>m.group===group.id).map(m=>{
  const n=metaLevel(m.id),full=n>=m.max,price=metaCost(m,n),canBuy=!full&&save.shards>=price;
  const next=metaBonus(m.id,Math.min(m.max,n+1)),current=metaBonus(m.id,n);
  const progress=Math.round(n/m.max*100);
  const format=v=>Number(v.toFixed(3)).toLocaleString('ru');
  const percentIds=['power','armor','repair','haste','critChance','critDamage','speed','dash','duration','xp','shards','score'];
  const unit=percentIds.includes(m.id)?' п.п.':'';
  const delta=percentIds.includes(m.id)?(next-current)*100:next-current;
  return `<div class="shop-item research-item">
   <div class="upgrade-title"><span style="color:#5af5de">${m.glyph}</span> ${m.name}</div>
   <p>${m.sub}</p>
   <div class="research-progress" role="progressbar" aria-valuenow="${n}" aria-valuemin="0" aria-valuemax="${m.max}"><span style="width:${progress}%"></span></div>
   <div class="research-details"><span>УР. ${n}/${m.max}</span><span>${full?'ИЗУЧЕНО':m.id==='rarity'?'РЕДКОСТЬ КАРТОЧЕК':'Следующий: +'+format(delta)+unit}</span></div>
   <button data-buy="${m.id}" type="button" class="btn research-buy" ${canBuy?'':'disabled'}>${full?'✓ МАКСИМУМ':'✧ '+price.toLocaleString('ru')+' · УЛУЧШИТЬ'}</button>
  </div>`;
 }).join('');
 root.innerHTML=`<div class="research-summary"><strong>◈ ЦЕНТР ИССЛЕДОВАНИЙ</strong><span>Изучено ${total} из ${max} уровней</span><small>Исследования действуют в каждом новом забеге.</small></div>
 <div class="research-tabs">${tabs}</div><div class="research-category"><b>${group.name}</b><span>${group.desc}</span></div>
 <div class="shop-grid research-grid">${rows}</div>`;
 root.querySelectorAll('[data-meta-tab]').forEach(b=>b.onclick=()=>{activeMetaTab=b.dataset.metaTab;renderShop();});
 root.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{
  const m=META.find(z=>z.id===b.dataset.buy);if(!m)return;
  const n=metaLevel(m.id),cost=metaCost(m,n);if(n>=m.max||save.shards<cost)return;
  save.shards-=cost;save.meta[m.id]=n+1;persist();clickSound(540,.13);
  $('wallet').textContent=save.shards.toLocaleString('ru');renderShop();
 });
}
function renderLab(){
 const sh=$('lab');if(!sh)return;
 sh.innerHTML=Object.entries(HYBRIDS).map(([id,h])=>`<div class="lab-entry ${save.recipes?.[id]?'found':''}"><span style="color:${h.color}">${h.glyph}</span><div><b>${h.name}</b><small>${DRONES[h.a].name} + ${DRONES[h.b].name} · ядро особого босса</small></div><em>${save.recipes?.[id]?'ОТКРЫТО':'НЕ ИЗУЧЕНО'}</em></div>`).join('');
}
