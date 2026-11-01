function drawBackground(camX,camY,zoom=1){rect(0,0,W,H,'#08111d');const viewW=W/zoom,viewH=H/zoom,sx=camX-viewW/2,sy=camY-viewH/2;cx.save();cx.translate(W/2-camX,H/2-camY);
 // Alien basalt floor: irregular rock fragments and rare violet energy fissures.
 // Each fragment is generated from fixed world coordinates, with no repeating grid artwork.
 cx.fillStyle='#0e141e';
 cx.fillRect(sx-3,sy-3,viewW+6,viewH+6);
 const rockStep=196;
 const rockFirstX=Math.floor((sx-180)/rockStep),rockLastX=Math.ceil((sx+viewW+180)/rockStep);
 const rockFirstY=Math.floor((sy-180)/rockStep),rockLastY=Math.ceil((sy+viewH+180)/rockStep);
 for(let ix=rockFirstX;ix<=rockLastX;ix++)for(let iy=rockFirstY;iy<=rockLastY;iy++){
  const rockX=ix*rockStep+rockStep*.5+(seed(ix+11,iy+17)-.5)*104;
  const rockY=iy*rockStep+rockStep*.5+(seed(ix-23,iy+5)-.5)*104;
  const rockSize=96+seed(ix+43,iy-19)*41;
  const corners=7+Math.floor(seed(ix+29,iy+31)*3);
  const angleOffset=seed(ix+73,iy+61)*TAU;
  const shade=seed(ix-7,iy+47);
  cx.beginPath();
  for(let corner=0;corner<corners;corner++){
   const angle=angleOffset+corner*TAU/corners;
   const jagged=.77+seed(ix*13+corner+71,iy*19-corner-31)*.34;
   const x=rockX+Math.cos(angle)*rockSize*jagged;
   const y=rockY+Math.sin(angle)*rockSize*jagged;
   if(corner===0)cx.moveTo(x,y);else cx.lineTo(x,y);
  }
  cx.closePath();
  cx.fillStyle=shade<.26?'#131b26':shade<.58?'#171e29':shade<.86?'#1b222d':'#121a24';
  cx.fill();
  cx.lineWidth=1;
  cx.strokeStyle='#202a35';
  cx.stroke();
  // Jagged cracks break up the silhouettes; most stay almost black.
  const crackSeed=seed(ix+67,iy-89);
  if(crackSeed>.21){
   const direction=seed(ix-17,iy+37)*TAU;
   const crackLength=75+seed(ix+47,iy-59)*111;
   const ax=rockX-Math.cos(direction)*crackLength*.5;
   const ay=rockY-Math.sin(direction)*crackLength*.5;
   const sideX=-Math.sin(direction),sideY=Math.cos(direction);
   const glowing=seed(ix+113,iy-71)>.86;
   let branchX=rockX,branchY=rockY;
   cx.beginPath();
   for(let step=0;step<=5;step++){
    const offset=(seed(ix*31+step+19,iy*41-step-7)-.5)*22;
    const x=ax+Math.cos(direction)*crackLength*step/5+sideX*offset;
    const y=ay+Math.sin(direction)*crackLength*step/5+sideY*offset;
    if(step===0)cx.moveTo(x,y);else cx.lineTo(x,y);
    if(step===3){branchX=x;branchY=y;}
   }
   cx.lineWidth=glowing?5:3;
   cx.strokeStyle=glowing?'#382746':'#0a1019';
   cx.stroke();
   cx.lineWidth=glowing?1.65:1;
   cx.strokeStyle=glowing?'#865aa7':'#2b313c';
   cx.stroke();
   if(glowing){
    cx.beginPath();
    cx.moveTo(branchX,branchY);
    const bend=direction+(seed(ix+31,iy+97)>.5?1:-1)*1.15;
    cx.lineTo(branchX+Math.cos(bend)*37,branchY+Math.sin(bend)*37);
    cx.lineWidth=3;cx.strokeStyle='#392848';cx.stroke();
    cx.lineWidth=1.2;cx.strokeStyle='#785296';cx.stroke();
   }
  }
  // Sparse stone chips add surface detail without hiding hostile projectiles.
  if(seed(ix-59,iy+79)>.46){
   cx.fillStyle='#27303c';
   const chips=2+Math.floor(seed(ix+19,iy+109)*3);
   for(let chip=0;chip<chips;chip++){
    const px=rockX+(seed(ix*17+chip,iy-13)-.5)*rockSize*1.3;
    const py=rockY+(seed(ix-29,iy*23+chip)-.5)*rockSize*1.3;
    cx.fillRect(px,py,2+seed(ix+chip,iy-7)*3,1.4);
   }
  }
 }
 // Arena perimeter: contrast stripes, unmistakable boundary, and a muted outer danger zone.
  const edge=1785;
  if(sx< -edge+100 || sy< -edge+100 || sx+viewW>edge-100 || sy+viewH>edge-100){
  cx.save();
  cx.fillStyle='#03101adc';
  cx.fillRect(-edge-220,-edge-220,220,2*(edge+220));
  cx.fillRect(edge,-edge-220,220,2*(edge+220));
  cx.fillRect(-edge,-edge-220,2*edge,220);
  cx.fillRect(-edge,edge,2*edge,220);
  cx.strokeStyle='#1c8f9e';cx.lineWidth=14;cx.strokeRect(-edge,-edge,edge*2,edge*2);
  cx.strokeStyle='#8ef9ec';cx.lineWidth=3;cx.strokeRect(-edge+3,-edge+3,edge*2-6,edge*2-6);
  cx.strokeStyle='#ffcc78';cx.lineWidth=2;cx.setLineDash([18,20]);cx.strokeRect(-edge+25,-edge+25,edge*2-50,edge*2-50);cx.setLineDash([]);
  cx.fillStyle='#ffe2a0';cx.font='bold 15px Trebuchet MS';cx.textAlign='center';
  for(let k=-1600;k<=1600;k+=400){
   cx.fillText('⚠ ГРАНИЦА СЕКТОРА',k,-edge+56);
   cx.fillText('⚠ ГРАНИЦА СЕКТОРА',k,edge-42);
   cx.save();cx.translate(-edge+53,k);cx.rotate(-Math.PI/2);cx.fillText('⚠ ГРАНИЦА СЕКТОРА',0,0);cx.restore();
   cx.save();cx.translate(edge-53,k);cx.rotate(Math.PI/2);cx.fillText('⚠ ГРАНИЦА СЕКТОРА',0,0);cx.restore();
  }
  cx.restore();
  }if(trainingMode){cx.save();for(const r of [150,300,450]){ring(0,0,r,'#355f66',1.5)}for(let q=-4;q<=4;q++){line(q*80,-420,q*80,420,'#244f5633',1);line(-420,q*80,420,q*80,'#244f5633',1)}cx.font='bold 14px Trebuchet MS';cx.fillStyle='#74cfc4aa';cx.textAlign='center';cx.fillText('ИСПЫТАТЕЛЬНЫЙ СЕКТОР // 08',0,-315);cx.restore()}cx.restore()}
