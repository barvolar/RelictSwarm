


'use strict';
(()=>{
const $=id=>document.getElementById(id),C=$('world');
// Mutable only while rendering a static skin preview into a private offscreen canvas.
let cx=C.getContext('2d',{alpha:false});
const RED='#ff667e',TEAL='#50f2db',AMBER='#ffc174',PURPLE='#b988ff',BLUE='#6dbbff';
