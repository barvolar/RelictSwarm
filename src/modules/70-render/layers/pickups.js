function drawPickup(o){
 const t=ambient+.25*o.x+o.y,colors={xp:TEAL,shard:AMBER,heal:'#84ffaa',magnet:'#78e9ff',rage:'#ff9e54',invuln:'#d5a6ff',core:'#ffe38e'},col=colors[o.type]||TEAL;
 cx.save();cx.translate(o.x,o.y+Math.sin(t*2)*2.4);glow(0,0,o.type==='xp'?22:o.type==='core'?56:38,col,.38);cx.rotate(t*.75);
 if(o.type==='xp'){poly([[0,-8],[7,0],[0,8],[-7,0]],'#55f2d0','#c5fff7',1.4);poly([[0,-4],[3,0],[0,4],[-3,0]],'#dffffd');}
 else if(o.type==='shard'){poly([[0,-13],[9,-3],[6,10],[-6,10],[-9,-3]],'#e59542','#ffe4a6',1.7);line(-3,0,4,5,'#ffefc8',2);}
 else{ring(0,0,14,col,3);circ(0,0,10,'#152c3b',col,2);cx.rotate(-t*.75);cx.fillStyle=col;cx.textAlign='center';cx.textBaseline='middle';cx.font='bold 19px Trebuchet MS';cx.fillText({heal:'✚',magnet:'◎',rage:'ϟ',invuln:'⬡',core:'◈'}[o.type]||'✚',0,0);}
 cx.restore();}
