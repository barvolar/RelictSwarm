// A reroll grant is intentionally independent of ads: a rewarded-ad callback
// can call grantReroll(1) after the platform confirms the reward. No ads yet.
function grantReroll(count=1){
 if(!S)return false;
 const amount=Math.max(0,Math.min(3,Math.floor(Number(count)||0)));
 if(amount<1)return false;
 S.rerollsRemaining=Math.min(3,(S.rerollsRemaining||0)+amount);
 return true;
}
function canUseReroll(){
 return !!S&&mode==='upgrade'&&S.pendingUp>0&&S.rerollsRemaining>0&&S.upgrades?.length===3;
}
function consumeReroll(){
 if(!canUseReroll())return false;
 S.rerollsRemaining--;S.rerollsUsed=(S.rerollsUsed||0)+1;
 return true;
}
function rerollCardKey(u){return u.kind+':'+u.id}
function rerollCardLog(u){return u.kind+':'+u.id+(u.rarity?':'+(u.rarity.id||u.rarity.name):'')+(u.keys?.length?':'+u.keys.join(','):'')}
function logReroll(before,after){
 if(typeof bal==='undefined'||!bal||trainingMode)return;
 const t=balR(S.t),level=S.lvl;
 // Existing Worker already preserves event.what and event.id on finish.
 for(const [what,cards] of [['reroll_before',before],['reroll_after',after]]){
  bal.events.push({t,level,what,id:cards.map(rerollCardLog).join('|')});
 }
 bal.events.push({t,level,what:'reroll_used',id:'free'});
}
function requestReroll(){
 if(!canUseReroll())return false;
 const before=S.upgrades.slice();
 const after=upgradeChoices(before);
 if(after.length!==3||new Set(after.map(rerollCardKey)).size!==3||
    after.some(u=>before.some(prev=>rerollCardKey(prev)===rerollCardKey(u))))return false;
 if(!consumeReroll())return false;
 S.upgrades=after;
 logReroll(before,after);
 renderUpgradeScreen();
 clickSound(640,.13,'triangle');
 return true;
}
