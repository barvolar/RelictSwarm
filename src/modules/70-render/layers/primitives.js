function poly(points,fill,stroke=null,width=1){cx.beginPath();cx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)cx.lineTo(points[i][0],points[i][1]);cx.closePath();if(fill){cx.fillStyle=fill;cx.fill()}if(stroke){cx.strokeStyle=stroke;cx.lineWidth=width;cx.stroke()}}
function circ(x,y,r,fill,stroke=null,w=1){cx.beginPath();cx.arc(x,y,r,0,TAU);if(fill){cx.fillStyle=fill;cx.fill()}if(stroke){cx.lineWidth=w;cx.strokeStyle=stroke;cx.stroke()}}
function line(x1,y1,x2,y2,col,w=1){cx.beginPath();cx.moveTo(x1,y1);cx.lineTo(x2,y2);cx.strokeStyle=col;cx.lineWidth=w;cx.stroke()}
function glow(x,y,r,col,alpha=.36){cx.save();cx.globalAlpha=alpha;let g=cx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(.28,col+'75');g.addColorStop(1,col+'00');cx.fillStyle=g;cx.beginPath();cx.arc(x,y,r,0,TAU);cx.fill();cx.restore()}
function rect(x,y,w,h,col){cx.fillStyle=col;cx.fillRect(x,y,w,h)}
function ring(x,y,r,col,w=2){cx.beginPath();cx.arc(x,y,r,0,TAU);cx.strokeStyle=col;cx.lineWidth=w;cx.stroke()}
function seed(x,y){let n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n)}
