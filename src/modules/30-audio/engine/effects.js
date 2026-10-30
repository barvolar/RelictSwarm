function sfx(id,amount=1,force=false,playRate=1){
 if(mute||document.hidden)return false;
 const limits={hit:.13,kill:.28,sawHit:.12,ui:.04,laser:.13,laserHit:.11,arc:.095,rail:.26,railCharge:.25,rocket:.20,plasma:.28,cryo:.20,flame:.24,gravity:.26,gravityCollapse:.29,mine:.12,boomer:.17,boomerReturn:.17,saw:.22,explosion:.20,heavyExplosion:.45,bossDown:.65};
 const now=performance.now()/1000;
 if(!force&&now-(soundPlayed[id]??-100)<(limits[id]??.10))return false;
 if(!force&&['laser','arc','rail','rocket','plasma','cryo','flame','gravity','mine','boomer','saw'].includes(id)){
  if(now-lastWeaponAt<.048)return false;lastWeaponAt=now;
 }
 soundPlayed[id]=now;
 if(!audio||!audioBuffers[id]){unlockAudio();return false;}
 if(audio.state!=='running'||activeVoices>=24)return false;
 try{
  const src=audio.createBufferSource(),g=audio.createGain();src.buffer=audioBuffers[id];src.playbackRate.value=playRate*(force?1:.97+Math.random()*.06);
  const vol={explosion:.37,heavyExplosion:.60,heavyExplosionDeep:.60,rail:.36,railCharge:.19,rocket:.23,mine:.30,hit:.10,laserHit:.13,kill:.13,flame:.30,cryo:.20,gravity:.37,gravityCollapse:.42,laser:.18,arc:.23,sawHit:.34,saw:.23,plasma:.15,boomer:.28,boomerReturn:.24,damage:.5,warning:.55,fusion:.78,bossDown:.80,ui:.22}[id]??.39;
  g.gain.value=clamp(amount,.08,1.4)*vol;
  src.connect(g);g.connect(sfxBus);activeVoices++;src.onended=()=>{activeVoices--;src.disconnect();g.disconnect()};src.start();return true;
 }catch(e){console.warn('[Sfx]',id,e);return false;}
}
function sfxWeapon(id){
 if(id==='flame'){flameShot();return}
 if(id==='saw'||id==='fusion_thermal'||id==='fusion_tesla'||id==='fusion_frostblade'||id==='fusion_magnetblade')return;
 const m={pulse:'laser',arc:'arc',rail:'rail',rocket:'rocket',plasma:'plasma',cryo:'cryo',flame:'flame',gravity:'gravity',mine:'mine',boomer:'boomer'};
 if(m[id]){if(id==='arc')return;if(id==='cryo')cryoAudibleUntil=performance.now()/1000+1.25;if(id!=='cryo')sfx(m[id],.90);return;}
 if(!id.startsWith('fusion_'))return;
 const recipe=HYBRIDS[id.slice(7)];if(!recipe)return;
 const sounds=[m[recipe.a],m[recipe.b]].filter(Boolean);
 // Layer only one primary shot, with quieter secondary modulation; loops follow living game objects.
 const primary=sounds.includes('rail')?'rail':sounds.includes('rocket')?'rocket':sounds.includes('laser')?'laser':sounds[0];
 if(primary&&primary!=='flame'&&primary!=='cryo')sfx(primary,.86);
 if(sounds.includes('cryo'))cryoAudibleUntil=performance.now()/1000+1.25;
 if(sounds.includes('arc')&&primary!=='arc')sfx('arc',.21);
 if(sounds.includes('plasma')&&primary!=='plasma')sfx('plasma',.20);
 if(sounds.includes('gravity')&&primary!=='gravity')sfx('gravity',.20);
}

function clickSound(){sfx('ui',.68)}
