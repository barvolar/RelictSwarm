import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const bank=read('src/modules/30-audio/embedded-bank.js');
const playback=read('src/modules/30-audio/engine/playback.js');
test('historical sound bank and track playback have been restored unchanged',()=>{
 assert.ok(bank.includes('AUDIO_BANK'),'Original bank missing');
 assert.ok(bank.includes('RELICT_WAV_IDS'),'Original audio formats missing');
 assert.ok(bank.length>3000000,'Old recorded effects missing');
 assert.ok(playback.includes('decodeAudioData'),'Old audio decoding missing');
 assert.ok(playback.includes('menu_theme')&&playback.includes('combat_theme'),'Original background tracks missing');
});
test('compiled HTML contains historical audio; licensing remains unverified',()=>{
 const html=read('dist/index.html');
 assert.ok(html.length>3000000,'Compiled release does not contain former audio');
 assert.ok(html.includes('decodeAudioData'),'Expected Web Audio sample playback missing');
 assert.match(read('docs/audio-rights-audit.md'),/NOT CLEARED/);
});