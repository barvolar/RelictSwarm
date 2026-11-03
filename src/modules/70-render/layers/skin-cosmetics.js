// Purely cosmetic attachments matching the approved Skin Lab v3.
// Every skin has the same actual body, collision radius and movement.
const SKIN_RARITY_RANK={common:0,uncommon:1,rare:2,epic:3,legendary:4};
const SKIN_COSMETIC_SCALE={common:1,uncommon:.72,rare:.55,epic:.45,legendary:.32};
let skinVisualOverride=null;
function skinWing(skin,side,rank){
 const i=skin.skinIndex||1,c=skin.core,flavor=(i-1)%8;
 const shapes=[
  [[18,-13],[31,-31],[47,-36],[38,-11],[27,12]],
  [[17,-15],[28,-44],[37,-50],[32,-7],[25,12]],
  [[19,-16],[27,-31],[44,-26],[38,-15],[51,-4],[29,17]],
  [[17,-13],[31,-30],[49,-18],[45,1],[30,17]],
  [[18,-17],[34,-42],[55,-39],[40,-16],[49,4],[26,11]],
  [[18,-12],[27,-33],[46,-35],[52,-17],[37,2],[27,17]],
  [[19,-17],[32,-37],[47,-43],[43,-20],[39,12],[25,15]],
  [[17,-11],[29,-28],[54,-32],[44,-7],[31,15]]
 ];
 cx.save();cx.scale(side,1);
 let pts=shapes[flavor];
 if(rank>=2){const spread=rank===2?1.43:rank===3?1.57:(i===32?2.06:1.72);
  pts=pts.map(([x,y])=>[x<=20?x:20+(x-20)*spread,y*(rank>=3?1.24:1.12)]);}
 const tip=pts.reduce((a,b)=>b[0]>a[0]?b:a);
 poly(pts,skin.shell,skin.edge,rank>=2?2.3:1.8);
 poly([[19,-11],[28,-22],[tip[0]-5,tip[1]+7],[tip[0]-15,-3],[26,9]],
  skin.back,rank>=2?c:skin.trim,rank>=2?1.6:1.1);
 line(22,-14,tip[0]-10,tip[1]+6,rank>=2?c:skin.edge,rank>=2?2.1:1.4);
 if(rank>=2){
  const end=tip[0];
  poly([[25,7],[end-22,3],[end-3,18],[end-10,30],[31,19]],skin.shell,c,2);
  poly([[27,9],[end-20,6],[end-9,19],[end-12,22],[34,15]],c+'46',c,1.5);
  circ(end-10,tip[1]+6,3,c);circ(end-10,21,3,c);
  glow(end-10,tip[1]+7,19,c,.17);
 }
 if(rank>=3){
  poly([[42,-15],[tip[0]+7,tip[1]-14],[tip[0]+4,tip[1]-2],[tip[0]-3,tip[1]+9]],
   skin.back,skin.trim,2);
  poly([[42,8],[tip[0]+10,22],[tip[0]+1,30],[tip[0]-7,20]],skin.shell,c,2);
 }
 if(rank===4){
  const extra=i===32?21:12;
  poly([[tip[0]+8,tip[1]-14],[tip[0]+20+extra,tip[1]-33],
        [tip[0]+32+extra,tip[1]-11],[tip[0]+13,tip[1]+8]],skin.shell,c,2.6);
  poly([[tip[0]+8,26],[tip[0]+22+extra,42],[tip[0]+35+extra,30],[tip[0]+16,18]],
   skin.back,skin.light,2.2);
 }
 cx.restore();
}
function skinOrbit(radius,color,angle,segments,width=2){
 cx.save();cx.rotate(angle);cx.strokeStyle=color;cx.lineWidth=width;
 for(let k=0;k<segments;k++){
  const a=k*TAU/segments,span=TAU/segments*.57;
  cx.beginPath();cx.arc(0,0,radius,a,a+span);cx.stroke();
  const x=Math.cos(a)*radius,y=Math.sin(a)*radius;
  cx.save();cx.translate(x,y);cx.rotate(a+Math.PI/2);
  poly([[-5,-3],[0,-8],[5,-3],[3,5],[-3,5]],color,'#dffbff',.6);cx.restore();
 }
 cx.restore();
}
function drawSkinDecor(skin,phase){
 const rank=SKIN_RARITY_RANK[skin.rarity]||0;
 if(!rank)return; // common skins: original shell with recolouring, no additions.
 const i=skin.skinIndex||1,c=skin.core,t=ambient;
 cx.save();const cosmeticScale=SKIN_COSMETIC_SCALE[skin.rarity]||1;cx.scale(cosmeticScale,cosmeticScale);
 if(phase===0){
  skinWing(skin,-1,rank);skinWing(skin,1,rank);
  if(rank>=4)glow(0,0,i===32?125:95,c,.11);
  cx.restore();return;
 }
 if(rank===1){
  for(const side of [-1,1]){circ(side*29,-9,2.4,skin.trim);line(side*22,-6,side*35,-18,skin.trim,1.15);}
 }else if(rank===2){
  glow(0,0,70,c,.15);
  cx.save();cx.globalAlpha=.55;ring(0,0,37+Math.sin(t*2+i)*1.2,c,1);cx.restore();
  for(const side of [-1,1]){const x=side*(53+i%3*5);glow(x,-12,15,c,.14);circ(x,-12,2.6,skin.light);}
 }else{
  const speed=(i%2===0?1:-1)*(i===25?.76:i===27?.55:1.03);
  const radius=i===25?57:i===26?62:i===27?64:69;
  skinOrbit(radius,i===25?'#ffdb8d':skin.trim,t*speed,i===27?8:6,i===25?3.3:2.5);
  cx.save();cx.rotate(-t*speed*.73);ring(0,0,radius-12,c,1.5);cx.restore();
  for(let k=0;k<(i===28?5:4);k++){
   const a=t*(i===27?-.53:.67)+k*TAU/(i===28?5:4),r=radius+8;
   cx.save();cx.translate(Math.cos(a)*r,Math.sin(a)*r);cx.rotate(a+t*.25);
   poly([[0,-8],[7,0],[0,8],[-7,0]],skin.shell,skin.light,1.4);circ(0,0,3,c);cx.restore();
  }
  if(rank===4){
   const primary=i===32?'#fff0aa':c,large=i===32?104:i===30?93:84;
   skinOrbit(large,primary,-t*(i===30?.31:.49),i===32?12:8,i===32?3.1:2.4);
   skinOrbit(large-17,skin.trim,t*(i===31?-.90:.70),i===32?9:7,1.8);
   if(i===30){
    cx.save();cx.rotate(t*.2);
    for(let k=0;k<12;k++){const a=k*TAU/12;line(Math.cos(a)*72,Math.sin(a)*72,Math.cos(a)*79,Math.sin(a)*79,skin.light,1.7);}
    cx.restore();cx.save();cx.rotate(-t*.22);line(0,0,0,-69,skin.trim,3);cx.restore();
   }else if(i===31){
    for(let k=0;k<6;k++){const a=t*.5+k*TAU/6;
     cx.save();cx.translate(Math.cos(a)*103,Math.sin(a)*103);cx.rotate(a+Math.PI/2);
     poly([[0,-14],[8,0],[0,13],[-8,0]],skin.back,c,2);cx.restore();}
   }else if(i===32){
    for(let k=0;k<6;k++){const a=-t*.22+k*TAU/6;
     cx.save();cx.translate(Math.cos(a)*117,Math.sin(a)*117);cx.rotate(a+Math.PI/2);
     poly([[0,-12],[10,3],[0,17],[-10,3]],'#a8a1cc','#fff3b6',2);
     circ(0,3,3,'#fffbe2');cx.restore();}
    glow(0,0,115,'#fff0a4',.13);
   }else{
    for(let k=0;k<5;k++){const a=t*.72+k*TAU/5,r=108+Math.sin(t*1.3+k)*8;
     glow(Math.cos(a)*r,Math.sin(a)*r,14,c,.12);circ(Math.cos(a)*r,Math.sin(a)*r,4,c);}
   }
  }
  glow(0,0,rank===4?100:80,c,.10);
 }
 cx.restore();
}
