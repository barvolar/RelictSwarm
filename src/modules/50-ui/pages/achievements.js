// Local achievement journal. All entries are completed by playing, not by buying.
function challengeChoiceHtml(){
 const chosen=CHALLENGES.find(c=>c.id===selectedChallengeId);
 return '<div class="challenge-select"><label for="challengeMode">✥ ИСПЫТАНИЕ ЗАБЕГА</label>'+
 '<select id="challengeMode"><option value="">Обычный забег · без испытания</option>'+
 CHALLENGES.map(c=>'<option value="'+c.id+'"'+(c.id===selectedChallengeId?' selected':'')+
 (save.challenges[c.id]?' disabled':'')+'>'+c.glyph+' '+c.name+(save.challenges[c.id]?' ✓':'')+'</option>').join('')+
 '</select><small id="challengeHint">'+(chosen?chosen.desc+' · Награда: '+chosen.reward+' ✧':'Выбери одно испытание. Награда выдаётся только один раз.')+'</small></div>';
}
function pauseChallengeHtml(){
 const c=CHALLENGES.find(x=>x.id===S?.challengeId);
 if(!c)return '';
 return '<div class="active-challenge"><b>'+c.glyph+' ИСПЫТАНИЕ: '+c.name+'</b><span>'+
  challengeProgressLabel(c.id)+'</span></div>';
}
function showAchievementJournal(){
 setMode('menu');
 const unlocked=ACHIEVEMENTS.filter(a=>save.achievements[a.id]).length;
 const complete=CHALLENGES.filter(c=>save.challenges[c.id]).length;
 const completedAchievement=(a)=>!!save.achievements[a.id];
 const rows=ACHIEVEMENTS.map(a=>'<div class="achievement-entry '+(completedAchievement(a)?'achieved':'')+'">'+
 '<span class="ach-glyph">'+a.glyph+'</span><div class="ach-copy"><b>'+a.name+'</b><small>'+a.desc+
 '</small></div><div class="ach-status">'+(completedAchievement(a)?'✓ ГОТОВО':'✧ '+a.reward)+'</div></div>').join('');
 const contracts=CHALLENGES.map(c=>'<div class="achievement-entry '+(save.challenges[c.id]?'achieved':'')+'">'+
 '<span class="ach-glyph">'+c.glyph+'</span><div class="ach-copy"><b>'+c.name+'</b><small>'+c.desc+
 '</small></div><div class="ach-status">'+(save.challenges[c.id]?'✓ ГОТОВО':'✧ '+c.reward)+'</div></div>').join('');
 $('modalContent').innerHTML='<div class="section-top"><div><div class="label">[ АРХИВ РОЯ ]</div>'+
 '<div class="panel-title">Достижения и испытания</div></div>'+
 '<button class="btn ghost small-back" type="button" id="backFromJournal">◂ НАЗАД</button></div>'+
 '<p class="panel-desc">Выполняй задания в настоящих забегах и получай кристаллы и новые облики. Награды выдаются один раз и сохраняются на устройстве.</p>'+
 '<div class="challenge-summary"><span>★ ДОСТИЖЕНИЯ <b>'+unlocked+'/'+ACHIEVEMENTS.length+'</b></span>'+
 '<span>✥ ИСПЫТАНИЯ <b>'+complete+'/'+CHALLENGES.length+'</b></span></div>'+
 '<div class="challenge-unlocks"><b>НАГРАДНЫЕ ОБЛИКИ</b><small>НОВА: '+Math.min(8,unlocked)+'/8 достижений '+(save.skins.includes('nova')?'✓':'')+
 ' · СТРАЖ РОЯ: '+Math.min(4,complete)+'/4 испытаний '+(save.skins.includes('sentinel')?'✓':'')+' · ХРОНОС: '+Math.min(8,complete)+'/8 испытаний'+(save.skins.includes('chronos')?' ✓':'')+' · 4/8 испытаний дают +1/+2 бесплатных переброса за каждый будущий забег'+'</small></div>'+ 
 '<div class="label">★ ДОСТИЖЕНИЯ</div><div class="achievement-list">'+rows+'</div>'+
 '<div class="label" style="margin-top:16px">✥ ИСПЫТАНИЯ (ВЫБИРАЮТСЯ ПЕРЕД ЗАБЕГОМ)</div>'+
 '<div class="achievement-list">'+contracts+'</div>';
 $('backFromJournal').onclick=menu;
}
