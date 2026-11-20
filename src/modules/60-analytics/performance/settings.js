// Keep the graphics section in the same locale as the rest of the game.
// Other platform editions remain English as before.
function renderQualityControls(){
 const ru=typeof locale!=='undefined'&&locale==='ru';
 const translations={
  high:['ВЫСОКОЕ','Максимальная детализация, эффекты и разрешение.'],
  normal:['ОБЫЧНОЕ','Детальные враги и сбалансированные эффекты.'],
  low:['НИЗКОЕ','Меньше свечения и частиц.'],
  minimal:['МИНИМУМ','Упрощённые враги и минимальная нагрузка.']
 };
 const title=ru?'КАЧЕСТВО ГРАФИКИ':'GRAPHICS QUALITY';
 const count=ru?'4 РЕЖИМА':'4 PRESETS';
 const hint=ru
  ?'Враги упрощаются <b>только в режиме «Минимум»</b>. При падении FPS разрешение может автоматически снижаться, но модели врагов останутся прежними. Графика не влияет на урон или сложность.'
  :'Enemies use simplified silhouettes <b>only on Minimum</b>. Render resolution may drop automatically when FPS falls, but normal enemy models remain unchanged. Graphics settings do not affect damage or difficulty.';
 return `<section class="graphics-settings"><div class="graphics-heading"><strong>${title}</strong><span>${count}</span></div>
  <div class="graphics-presets" role="group" aria-label="${ru?'Качество графики':'Graphics quality'}">
   ${RENDER_PRESETS.map(p=>{
    const label=ru?translations[p.id]?.[0]||p.name:p.name;
    const description=ru?translations[p.id]?.[1]||p.desc:p.desc;
    return `<button type="button" data-graphics-preset="${p.id}" aria-pressed="${renderQuality===p.id}" class="graphics-preset ${renderQuality===p.id?'selected':''}"><b>${label}</b><small>${description}</small></button>`;
   }).join('')}
  </div>
  <p class="graphics-hint">${hint}</p>
 </section>`;
}
document.addEventListener('click',e=>{
 const button=e.target?.closest?.('[data-graphics-preset]');if(!button)return;
 setRenderQuality(button.dataset.graphicsPreset);
 const section=button.closest('.graphics-settings');if(section)section.outerHTML=renderQualityControls();
});
addEventListener('visibilitychange',()=>{perf.lastRaf=0;perf.bucketFrom=0;});
