function renderQualityControls(){
 return `<section class="graphics-settings"><div class="graphics-heading"><strong>КАЧЕСТВО ГРАФИКИ</strong><span>4 ПРЕСЕТА</span></div>
  <div class="graphics-presets" role="group" aria-label="Качество графики">
   ${RENDER_PRESETS.map(p=>`<button type="button" data-graphics-preset="${p.id}" aria-pressed="${renderQuality===p.id}" class="graphics-preset ${renderQuality===p.id?'selected':''}"><b>${p.name}</b><small>${p.desc}</small></button>`).join('')}
  </div>
  <p class="graphics-hint">Враги упрощаются <b>только на «Минимальном»</b>. При падении FPS разрешение может снижаться автоматически, но обычные модели врагов сохраняются. Настройки не меняют урон и сложность.</p>
 </section>`;
}
document.addEventListener('click',e=>{
 const button=e.target?.closest?.('[data-graphics-preset]');if(!button)return;
 setRenderQuality(button.dataset.graphicsPreset);
 const section=button.closest('.graphics-settings');if(section)section.outerHTML=renderQualityControls();
});
addEventListener('visibilitychange',()=>{perf.lastRaf=0;perf.bucketFrom=0;});
