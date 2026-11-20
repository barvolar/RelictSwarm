function showSettings(){
 setMode('menu');
 const portal=window.RelicPlatform?.provider==='playgama';
 const privacyTitle=portal&&locale==='ru'?'↗ ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ':'↗ PRIVACY POLICY';
 const privacyInfo=portal?(locale==='ru'?'Прогресс сохраняется через Playgama Bridge. Реклама управляется игровой платформой.':'Game progress uses Playgama Bridge Storage. Ads follow the host platform policy.'):'Game saves, optional analytics and data choices';
 const languageSelector=portal?`<div class="settings-action"><button id="languageBtn" class="btn ghost">${locale==='ru'?'🌐 ЯЗЫК: РУССКИЙ · СМЕНИТЬ НА ENGLISH':'🌐 LANGUAGE: ENGLISH · SWITCH TO РУССКИЙ'}</button></div>`:'';
 $('modalContent').innerHTML=`<div class="section-top"><div><div class="label">[ СИСТЕМА ]</div><div class="panel-title">Настройки</div></div><button id="backHome" class="btn ghost small-back">◂ НАЗАД</button></div><div class="settings-action"><button id="soundBtn" class="btn">${mute?'♪ ВКЛЮЧИТЬ ЗВУК':'♫ ВЫКЛЮЧИТЬ ЗВУК'}</button><button id="howBtn" class="btn ghost">? КАК ИГРАТЬ</button></div>${isAppleTouchDevice?'':`<div class="settings-action"><button id="fullscreenSettings" type="button" class="btn ghost">${fullscreenButtonText()}</button></div>`}${orientationPickerHTML()}${languageSelector}${audioMixerHTML()}${renderQualityControls()}${window.SwarmTelemetry?.settingsHTML?.()||''}<div class="privacy-policy-row"><a class="privacy-policy-link" id="privacyPolicyLink" href="./privacy.html" target="_blank" rel="noopener noreferrer" title="Read the Relict Swarm Privacy Policy" >${privacyTitle}</a><span>${privacyInfo}</span></div>`;
 $('backHome').onclick=menu;$('soundBtn').onclick=soundToggle;
 $('howBtn').onclick=showHow;const fullscreenSettings=$('fullscreenSettings');if(fullscreenSettings)fullscreenSettings.onclick=toggleFullscreen;bindOrientationPicker();bindAudioMixer();
 const languageButton=$('languageBtn');if(languageButton)languageButton.onclick=()=>{if(changeLocale(locale==='ru'?'en':'ru'))showSettings()};
}
