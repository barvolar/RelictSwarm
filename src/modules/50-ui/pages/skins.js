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
