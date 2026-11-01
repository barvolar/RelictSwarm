// Atmospheric edge tint for a mechanical indoor arena.
function drawScreenTint(){
 const g=cx.createRadialGradient(W*.5,H*.4,Math.min(W,H)*.23,W*.5,H*.5,Math.max(W,H)*.9);
 g.addColorStop(0,'#050b1000');g.addColorStop(.8,'#0104093b');g.addColorStop(1,'#000307b8');
 cx.fillStyle=g;cx.fillRect(0,0,W,H);
}
// Menu hangar: an inactive assembly reactor behind the foreground controls.
function drawMenuVisual(){
 drawBackground(ambient*1.5,ambient*.7);
 cx.save();cx.translate(W*.5,H*.51);
 cx.rotate(-.23);
 drawReactorSeal(0,0,155,7);
 for(const side of [-1,1]){
  rect(side*205-12,-210,24,420,'#101b22');
  rect(side*205-4,-206,8,412,'#53616a');
  for(let i=-3;i<=3;i++){
   rect(side*205-17,i*53-12,34,8,'#775934');
  }
 }
 cx.restore();
 drawScreenTint();
}
function arenaZoom(){if(!touching)return 1;if(W<=390)return .52;if(W<=430)return .56;if(W<=650)return .62;return .82;}
