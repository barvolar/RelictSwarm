function drawBackground(camX,camY,zoom=1){rect(0,0,W,H,'#08111d');const viewW=W/zoom,viewH=H/zoom,sx=camX-viewW/2,sy=camY-viewH/2;cx.save();cx.translate(W/2-camX,H/2-camY);
 // Large graphite armor hexes. Anchored in world space so the floor never swims with the camera.
 const tileRadius=84, tileStepX=tileRadius*1.5, tileStepY=tileRadius*Math.sqrt(3);
 const firstColumn=Math.floor((sx-tileRadius*2)/tileStepX);
 const lastColumn=Math.ceil((sx+viewW+tileRadius*2)/tileStepX);
 for(let column=firstColumn;column<=lastColumn;column++){
  const tileX=column*tileStepX;
  const stagger=((column%2+2)%2)*tileStepY*.5;
  const firstRow=Math.floor((sy-tileStepY-stagger)/tileStepY);
  const lastRow=Math.ceil((sy+viewH+tileStepY-stagger)/tileStepY);
  for(let row=firstRow;row<=lastRow;row++){
   const tileY=row*tileStepY;
   const cy=tileY+stagger,variation=seed(column,row),detail=seed(column+37,row-19);
   // Flat-top honeycomb: tiles meet without gaps or hard rectangular seams.
   cx.beginPath();
   for(let corner=0;corner<6;corner++){
    const angle=corner*Math.PI/3;
    const x=tileX+tileRadius*Math.cos(angle),y=cy+tileRadius*Math.sin(angle);
    if(corner===0)cx.moveTo(x,y);else cx.lineTo(x,y);
   }
   cx.closePath();
   cx.fillStyle=variation<.24?'#0b1824':variation<.75?'#0d1c29':'#10212f';
   cx.fill();
   cx.lineWidth=2;
   cx.strokeStyle='#28616c';
   cx.stroke();
   // Recessed inner bevel: armored plates, not a bright neon wireframe.
   cx.beginPath();
   for(let corner=0;corner<6;corner++){
    const angle=corner*Math.PI/3;
    const x=tileX+(tileRadius-9)*Math.cos(angle),y=cy+(tileRadius-9)*Math.sin(angle);
    if(corner===0)cx.moveTo(x,y);else cx.lineTo(x,y);
   }
   cx.closePath();
   cx.lineWidth=1;
   cx.strokeStyle='#193440';
   cx.stroke();
   // Rare service vents and cyan-lit seams for detail without overwhelming projectiles.
   if(detail>.91){
    cx.lineWidth=1.5;cx.strokeStyle='#2d6471';
    for(let slit=-1;slit<=1;slit++){
     cx.beginPath();cx.moveTo(tileX-14,cy+slit*7);
     cx.lineTo(tileX+14,cy+slit*7);cx.stroke();
    }
   }else if(detail<.09){
    cx.beginPath();
    cx.moveTo(tileX+tileRadius*.63,cy-tileRadius*.60);
    cx.lineTo(tileX+tileRadius*.85,cy-tileRadius*.21);
    cx.lineWidth=2.5;cx.strokeStyle='#48a5ad';cx.stroke();
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
