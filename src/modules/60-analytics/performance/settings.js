function renderQualityControls(){
 return `<section class="graphics-settings"><div class="graphics-heading"><strong>GRAPHICS QUALITY</strong><span>4 PRESETS</span></div>
  <div class="graphics-presets" role="group" aria-label="Graphics quality">
   ${RENDER_PRESETS.map(p=>`<button type="button" data-graphics-preset="${p.id}" aria-pressed="${renderQuality===p.id}" class="graphics-preset ${renderQuality===p.id?'selected':''}"><b>${p.name}</b><small>${p.desc}</small></button>`).join('')}
  </div>
  <p class="graphics-hint">Enemies use simplified silhouettes <b>only on Minimum</b>. Render resolution may drop automatically when FPS falls, but normal enemy models remain unchanged. Graphics settings do not affect damage or difficulty.</p>
 </section>`;
}
document.addEventListener('click',e=>{
 const button=e.target?.closest?.('[data-graphics-preset]');if(!button)return;
 setRenderQuality(button.dataset.graphicsPreset);
 const section=button.closest('.graphics-settings');if(section)section.outerHTML=renderQualityControls();
});
addEventListener('visibilitychange',()=>{perf.lastRaf=0;perf.bucketFrom=0;});
