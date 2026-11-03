import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const code=read('src/modules/10-data/world/challenges.js');
function fixture(){
 const save={achievements:{},challenges:{},skins:['relict','ghost'],shards:0,wins:0};
 const S={t:0,kills:0,threat:1,hybrids:[],challengeId:'',
  challengeStats:{damageTaken:0,hitsTaken:0,hitBeforeFive:false,manualHeals:0,powerupsTaken:0,
   coresCollected:0,bossesKilled:0,bossIds:[],maxWeapons:1,omegaSpawnAt:null}};
 const ctx=vm.createContext({save,S,formatTime:t=>String(t)});
 vm.runInContext(code,ctx);
 return {ctx,save,S,run:s=>vm.runInContext(s,ctx)};
}
test('eight hard contracts, distinct from previous effortless kill-count contracts',()=>{
 const {run}=fixture(),ids=Array.from(run('CHALLENGES.map(c=>c.id)'));
 assert.equal(ids.length,8);assert.equal(new Set(ids).size,8);
 assert.deepEqual(ids,['no_hit','iron_soul','minimalist_v2','no_repairs_v2',
  'double_fusion_v2','gauntlet_v2','rapid_omega_v2','no_powerups_v2']);
 assert.ok(run('CHALLENGES.every(c=>c.reward>=550)'));
 assert.equal(run('ACHIEVEMENTS.length'),14);
});
test('clean manoeuvre remains achievable without a victory, rewards paid once',()=>{
 const {ctx,save,S}=fixture();
 S.t=350;S.kills=1;S.challengeId='no_hit';
 const first=ctx.evaluateRunRewards(S,false,false);
 assert.equal(first.challenge.id,'no_hit');
 assert.equal(first.bonus,1520);
 assert.equal(save.shards,1520);
 assert.equal(save.achievements.no_hit_5,true);
 const repeat=ctx.evaluateRunRewards(S,false,false);
 assert.equal(repeat.bonus,0);
 assert.equal(save.shards,1520);
 S.challengeStats.hitBeforeFive=true;
 assert.equal(ctx.challengeValue('no_hit',S,false),0);
});
test('hard victories enforce threat, hit and peak arsenal constraints',()=>{
 const {ctx,S}=fixture();S.threat=2;
 S.challengeStats.hitsTaken=3;
 assert.equal(ctx.challengeValue('iron_soul',S,true),1);
 S.challengeStats.hitsTaken=4;
 assert.equal(ctx.challengeValue('iron_soul',S,true),0);
 S.challengeStats.maxWeapons=3;
 assert.equal(ctx.challengeValue('minimalist_v2',S,true),1);
 S.challengeStats.maxWeapons=4;
 assert.equal(ctx.challengeValue('minimalist_v2',S,true),0);
 S.challengeStats.maxWeapons=1;
 S.threat=1;
 assert.equal(ctx.challengeValue('minimalist_v2',S,true),0);
 assert.equal(ctx.challengeValue('iron_soul',S,false),0);
});
test('repair, temporary powerup and double fusion challenges require actual sacrifices',()=>{
 const {ctx,S}=fixture();S.threat=3;
 assert.equal(ctx.challengeValue('no_repairs_v2',S,true),1);
 S.challengeStats.manualHeals=1;
 assert.equal(ctx.challengeValue('no_repairs_v2',S,true),0);
 S.challengeStats.manualHeals=0;
 assert.equal(ctx.challengeValue('no_powerups_v2',S,true),1);
 S.challengeStats.powerupsTaken=1;
 assert.equal(ctx.challengeValue('no_powerups_v2',S,true),0);
 S.hybrids=[{id:'ion'},{id:'spear'}];
 assert.equal(ctx.challengeValue('double_fusion_v2',S,true),1);
 S.hybrids=[{id:'ion'},{id:'ion'}];
 assert.equal(ctx.challengeValue('double_fusion_v2',S,true),0);
});
test('titan tournament counts three synth guardians and Omega, 90-second kill tracks spawn',()=>{
 const {ctx,S}=fixture();S.threat=3;S.t=980;
 S.challengeStats.bossIds=['synth1','synth2','synth3','omega'];
 assert.equal(ctx.challengeValue('gauntlet_v2',S,true),1);
 S.challengeStats.bossIds=['synth1','synth2','omega'];
 assert.equal(ctx.challengeValue('gauntlet_v2',S,true),0);
 S.challengeStats.omegaSpawnAt=905;
 assert.equal(ctx.challengeValue('rapid_omega_v2',S,true),1);
 S.t=1000;
 assert.equal(ctx.challengeValue('rapid_omega_v2',S,true),0);
 S.challengeStats.omegaSpawnAt=null;
 assert.equal(ctx.challengeValue('rapid_omega_v2',S,true),0);
});
test('contract milestones grant permanent rerolls and exclusive cosmetic',()=>{
 const {ctx,save,S}=fixture();
 const ids=Array.from(vm.runInContext('CHALLENGES.map(c=>c.id)',ctx));
 assert.equal(ctx.challengeBonusRerolls(),0);
 for(const id of ids.slice(0,4))save.challenges[id]=true;
 assert.equal(ctx.completedChallengeCount(),4);
 assert.equal(ctx.challengeBonusRerolls(),1);
 let result=ctx.evaluateRunRewards(S,false,false);
 assert.ok(save.skins.includes('sentinel'));
 assert.equal(result.skins.includes('СТРАЖ'),true);
 for(const id of ids.slice(4))save.challenges[id]=true;
 assert.equal(ctx.challengeBonusRerolls(),2);
 result=ctx.evaluateRunRewards(S,false,false);
 assert.ok(save.skins.includes('chronos'));
 assert.equal(result.skins.includes('ХРОНОС'),true);
 const again=ctx.evaluateRunRewards(S,false,false);
 assert.equal(again.skins.length,0);
});
test('obsolete easy challenges do not count toward new hard rewards',()=>{
 const {ctx,save}=fixture();
 for(const id of ['swarm','core_hunter','boss_hunt','master_fuser','minimalist','no_repairs'])
  save.challenges[id]=true;
 assert.equal(ctx.completedChallengeCount(),0);
 assert.equal(ctx.challengeBonusRerolls(),0);
});
test('voluntary early exits or modified QA runs cannot claim bonuses',()=>{
 const {ctx,S,save}=fixture();S.t=350;S.challengeId='no_hit';
 assert.equal(ctx.evaluateRunRewards(S,false,true).bonus,0);
 S.qaModified=true;
 assert.equal(ctx.evaluateRunRewards(S,false,false).bonus,0);
 assert.equal(save.shards,0);
 assert.equal(Object.keys(save.achievements).length,0);
});
test('hard trials have real inputs in the game lifecycle',()=>{
 for(const [path,needles] of [
  ['src/modules/40-game/entities/player-progression.js',['hitsTaken=','hitBeforeFive=true']],
  ['src/modules/40-game/entities/fx-pickups.js',['powerupsTaken=','manualHeals++']],
  ['src/modules/40-game/entities/spawn.js',['omegaSpawnAt=S.t']],
  ['src/modules/40-game/entities/deaths.js',['bossIds.push(e.id)']],
  ['src/modules/40-game/lifecycle/start.js',['challengeBonusRerolls()','timeStopTimer:0']],
  ['src/modules/40-game/lifecycle/finish.js',['evaluateRunRewards(S,won,giveup)']],
  ['src/modules/50-ui/pages/main-menu.js',['showAchievementJournal']],
  ['src/modules/50-ui/pages/play-progression.js',['challengeChoiceHtml()']],
  ['src/modules/40-game/training/pause-qa.js',['S.qaModified=true']]
 ])for(const snippet of needles)assert.ok(read(path).includes(snippet),path+': '+snippet);
});
