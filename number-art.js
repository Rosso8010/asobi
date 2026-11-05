(function(root){
 'use strict';
 var units=['#fffaf4','#e7493e','#f5a129','#f3d333','#65c83f','#31b9d7','#8346b5','#8c55bf','#e95a9a','#a4afb1'];
 var rainbow=['#e7493e','#f5a129','#f3d333','#65c83f','#31b9d7','#3e64bd','#9252b2'];
 var tens={10:'#fffdf8',20:'#efc347',30:'#f0ed95',40:'#77c768',50:'#69cdbb',60:'#9064c4',70:'#f3d333',80:'#dc449b',90:'#acb5b9',100:'#e9514e'};
 var descriptions={11:'白い十＋赤い一・低い位置の顔',12:'十＋オレンジの二・３×４',13:'十＋黄色の三・長い体',14:'十＋緑の四・緑の眼鏡',15:'十＋水色の五・階段・星の眼鏡',16:'十＋紫の六・４×４・紫のマスク',17:'十＋虹色の七・絵の具パレット',18:'十＋ピンクの八・３×６',19:'十＋灰色の九・細長い体',20:'金色の二十・紫のシルクハット',30:'淡い黄色・３列・３つの髪とまつげ',40:'緑・４列・角のある目元',50:'青緑・５列・横長の目元と片寄った口',60:'紫・６列・曲がった腕',70:'縦の虹色７列・上の飾り',80:'濃いピンク・８列・波形の側面',90:'灰色の九十・９×10',100:'赤い百・10×10・大きな１つ目',1:'赤・大きな１つ目・小さな手足',2:'オレンジ・丸い眼鏡・縦２個',3:'黄色・３つの冠・３つのボタン',4:'緑・四角い眼鏡・２×２',5:'水色・星の眼鏡・５本指の手',6:'紫・サイコロ模様・２×３',7:'７色・カラフルな冠・縦７個',8:'ピンク・８本の腕・２×４',9:'灰色・３段の髪・３×３',10:'白・赤い区切り・星の眼鏡・２×５'};
 // Face height is measured from the top, independently of the grid's bottom-up rows.
 var faces={
  1:[.48,1,'joy','single'],2:[.25,1,'smile','glasses'],3:[.23,1,'grin','goggles'],4:[.39,1.65,'joy','square'],5:[.16,1,'joy','star'],
  6:[.43,1.6,'laugh','glasses'],7:[.10,1,'joy','round'],8:[.18,1.65,'confident','round'],9:[.46,2.15,'grin','square'],10:[.12,1.55,'laugh','stars'],
  11:[.87,1.1,'smile','glasses'],12:[.64,1.15,'smile','glasses'],13:[.83,1.1,'smile','glasses'],14:[.88,1.35,'grin','glasses'],
  15:[.12,1.15,'joy','star'],16:[.80,2.4,'calm','mask'],17:[.79,1.3,'smile','glasses'],18:[.84,1.3,'surprise','lashes'],19:[.86,1.3,'smile','glasses'],20:[.84,1.65,'joy','glasses'],
  30:[.18,1.85,'smile','lashes'],40:[.20,2.2,'grin','square'],50:[.28,2.75,'side','visor'],60:[.22,2.8,'calm','lashes'],
  70:[.19,2.8,'joy','lashes'],80:[.18,3,'surprise','sleepy'],90:[.28,3.25,'grin','square'],100:[.31,4.6,'joy','single-panel']
 };
 function spec(n){WORLD_CORE.number(n);var f=faces[n];return {expression:f[2],faceHeight:f[0],faceScale:f[1],n:n,label:String(n),name:descriptions[n],eye:f[3],crown:n===3?'three':n===7?'rainbow':null,arms:n===8?8:2,hat:n===20,steps:n===15,body:n<10?units[n]:tens[n]||tens[10]};}
 function cellColor(n,index,p,cells){
  if(n===7)return rainbow[index];
  if(n===70){var width=Math.max.apply(null,cells.map(function(q){return q[0];}))+1;return width===7?rainbow[p[0]]:rainbow[Math.min(6,Math.floor(index/10))];}
  if(n===90)return ['#d8dcda','#a7afaf','#7d878a'][Math.floor((index%9)/3)];
  if(n===100)return (p[0]+p[1])%2?'#f58e8b':'#e9514e';
  if(n<10)return units[n];
  if(n>=20)return tens[n];
  var w=Math.max.apply(null,cells.map(function(q){return q[0];}))+1,h=Math.max.apply(null,cells.map(function(q){return q[1];}))+1;
  var base=WORLD_CORE.defaultCells(n),basic=JSON.stringify(cells)===JSON.stringify(WORLD_CORE.normalize(base)),accent=index>=10;
  if(basic){
   if(n===12)accent=p[0]===1&&(p[1]===1||p[1]===2);
   if(n===13)accent=p[0]===1&&p[1]<3;
   if(n===15)accent=p[0]===4;
   if(n===16)accent=p[1]===0||(p[1]===1&&(p[0]===1||p[0]===2));
   if(n===17){var order={'0,3':0,'0,4':1,'0,5':2,'1,5':3,'2,5':4,'3,5':5,'3,6':6};return order[p.join(',')]==null?tens[10]:rainbow[order[p.join(',')]];}
   if(n===18)accent=p[0]===2||p[1]===0;
   if(n===19)accent=p[0]===1;
  }
  return accent?(n===17?rainbow[index-10]:units[n-10]):tens[10];
 }
 function star(ctx,x,y,r,fill,stroke){ctx.beginPath();for(var i=0;i<10;i++){var a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.46:r,px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);}ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
 function face(ctx,x,y,size,n){
  var s=spec(n),rim=({1:'#982934',2:'#81365f',3:'#a57f26',4:'#215a35',6:'#b52b57',8:'#71204c',9:'#40535d',10:'#bd3c4c',11:'#bd3c4c',12:'#b77e31',13:'#be4698',14:'#43834a',16:'#632d86',17:'#6d3d87',18:'#8b245f',19:'#4f555b',20:'#a27433',30:'#a79b46',40:'#367c3e',50:'#397f73',60:'#67428b',70:'#84913a',80:'#81205c',90:'#627078',100:'#982934'})[n];
  ctx.save();ctx.translate(x,y);ctx.scale(size,size);ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=.045;
  function eye(ex,r){
   ctx.fillStyle='#fff';ctx.strokeStyle=rim;ctx.beginPath();
   if(s.eye==='square'||s.eye==='mask')ctx.rect(ex-r,-.13-r,r*2,r*1.9);
   else if(s.eye==='visor')ctx.ellipse(ex,-.13,r*1.22,r*.63,ex<0?-.15:.15,0,Math.PI*2);
   else ctx.ellipse(ex,-.13,r,r*1.09,0,0,Math.PI*2);ctx.fill();ctx.stroke();
   ctx.fillStyle='#252a30';ctx.beginPath();ctx.ellipse(ex+(n===50?-.035:.008),-.11,r*.43,r*.56,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ex-.025,-.17,r*.13,0,Math.PI*2);ctx.fill();
   if(s.eye==='sleepy'){ctx.fillStyle='#b73583';ctx.beginPath();ctx.ellipse(ex,-.22,r*.97,r*.54,0,Math.PI,Math.PI*2);ctx.fill();ctx.strokeStyle=rim;ctx.beginPath();ctx.moveTo(ex-r,-.20);ctx.lineTo(ex+r,-.20);ctx.stroke();}
  }
  if(n===50){ctx.strokeStyle='#286b61';ctx.lineWidth=.14;ctx.beginPath();ctx.moveTo(-.34,-.29);ctx.bezierCurveTo(-.10,-.52,.45,-.49,.43,-.13);ctx.quadraticCurveTo(.42,.02,.26,-.04);ctx.stroke();star(ctx,-.25,-.13,.31,'#f4e8a8','#817e49');ctx.lineWidth=.045;}
  if(s.eye==='mask'){ctx.fillStyle='#6f338d';ctx.fillRect(-.55,-.43,1.1,.61);}
  if(s.eye==='star'||s.eye==='stars'){star(ctx,-.23,-.13,.37,n===10?'#fffdf8':'#35619a',rim);if(s.eye==='stars')star(ctx,.23,-.13,.37,'#fffdf8',rim);}
  if(s.eye==='single-panel'){
   ctx.fillStyle='#a82d38';ctx.strokeStyle='#812431';ctx.lineWidth=.06;ctx.beginPath();ctx.moveTo(-.38,-.27);ctx.quadraticCurveTo(-.38,-.48,0,-.48);ctx.quadraticCurveTo(.38,-.48,.38,-.27);ctx.lineTo(.38,.22);ctx.quadraticCurveTo(.38,.43,0,.43);ctx.quadraticCurveTo(-.38,.43,-.38,.22);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.fillStyle='#fffdf8';ctx.beginPath();ctx.moveTo(-.31,-.05);ctx.lineTo(-.31,-.27);ctx.quadraticCurveTo(-.31,-.41,0,-.41);ctx.quadraticCurveTo(.31,-.41,.31,-.27);ctx.lineTo(.31,-.05);ctx.closePath();ctx.fill();
   ctx.fillStyle='#222b2b';ctx.beginPath();ctx.ellipse(0,-.27,.135,.10,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-.04,-.30,.03,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle='#c4454a';ctx.lineWidth=.035;ctx.beginPath();ctx.moveTo(-.29,.27);ctx.quadraticCurveTo(0,.37,.29,.27);ctx.stroke();
  }else if(s.eye==='single')eye(0,.29);else{eye(-.23,.18);eye(.23,.18);}
  if(s.eye==='glasses'||s.eye==='goggles'||s.eye==='square'){
   ctx.strokeStyle=rim;ctx.lineWidth=n===4||n===9?.075:.055;
   [-.23,.23].forEach(function(ex){ctx.beginPath();if(s.eye==='square')ctx.rect(ex-.235,-.39,.47,.49);else ctx.ellipse(ex,-.13,.23,.25,0,0,Math.PI*2);ctx.stroke();});ctx.beginPath();ctx.moveTo(-.02,-.13);ctx.lineTo(.02,-.13);ctx.stroke();
  }
  if([4,8,9,20,40,90].indexOf(n)>=0){ctx.strokeStyle=rim;ctx.lineWidth=.07;ctx.beginPath();ctx.moveTo(-.43,-.45);ctx.lineTo(-.13,n===8?-.52:-.40);ctx.moveTo(.13,n===8?-.52:-.40);ctx.lineTo(.43,-.45);ctx.stroke();}
  if(s.eye==='lashes'||s.eye==='sleepy'){ctx.strokeStyle=rim;ctx.lineWidth=.035;[-.23,.23].forEach(function(ex){for(var i=0;i<3;i++){ctx.beginPath();ctx.moveTo(ex+(i-1)*.1,-.31);ctx.lineTo(ex+(i-1)*.14,-.43-(i===1?.03:0));ctx.stroke();}});}
  if(n!==100){ctx.fillStyle=n===80?'#71154b':'#632d37';ctx.strokeStyle=rim;ctx.lineWidth=.035;
  if(s.expression==='calm'){ctx.beginPath();ctx.moveTo(-.19,.25);ctx.quadraticCurveTo(0,.35,.19,.25);ctx.stroke();}
  else if(s.expression==='side'){ctx.beginPath();ctx.ellipse(-.12,.29,.09,.12,-.4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f28b9c';ctx.beginPath();ctx.ellipse(-.14,.35,.045,.03,0,0,Math.PI*2);ctx.fill();}
  else if(s.expression==='surprise'){ctx.beginPath();ctx.ellipse(0,.30,.13,.17,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
  else{var wide=s.expression==='laugh'?.30:.24,bottom=s.expression==='smile'?.36:s.expression==='confident'?.39:.50;ctx.beginPath();ctx.moveTo(-wide,.20);ctx.quadraticCurveTo(0,.26,wide,.20);ctx.quadraticCurveTo(.13,bottom,0,bottom);ctx.quadraticCurveTo(-.15,bottom,-wide,.20);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.fillRect(-.13,.235,.26,.055);if(s.expression!=='smile'){ctx.fillStyle='#ee8196';ctx.beginPath();ctx.ellipse(.02,bottom-.05,.09,.03,0,0,Math.PI*2);ctx.fill();}}
  }
  if(n===100){ctx.translate(.20,0);ctx.fillStyle='#632d37';ctx.beginPath();ctx.moveTo(-.21,.72);ctx.quadraticCurveTo(.06,.84,.25,.61);ctx.quadraticCurveTo(.25,.99,0,.99);ctx.quadraticCurveTo(-.15,.97,-.21,.72);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(-.12,.76);ctx.lineTo(.18,.71);ctx.lineTo(.11,.82);ctx.closePath();ctx.fill();}
  ctx.restore();
 }
 function draw(ctx,n,input,u,x,y,options){var opt=options||{},s=spec(n),cells=WORLD_CORE.normalize(input),w=Math.max.apply(null,cells.map(function(p){return p[0];}))+1,h=Math.max.apply(null,cells.map(function(p){return p[1];}))+1;ctx.save();ctx.translate(x,y);ctx.lineJoin='round';ctx.lineCap='round';
  var edge=n>=10&&n<20?'#ca5b68':'rgba(49,64,78,.56)';
  cells.forEach(function(p,i){var px=p[0]*u,py=(h-1-p[1])*u;ctx.fillStyle=cellColor(n,i,p,cells);ctx.fillRect(px+u*.025,py+u*.025,u*.95,u*.95);ctx.lineWidth=Math.max(.7,u*.035);ctx.strokeStyle=edge;ctx.strokeRect(px+u*.025,py+u*.025,u*.95,u*.95);ctx.fillStyle='rgba(255,255,255,.16)';ctx.fillRect(px+u*.06,py+u*.06,u*.88,u*.09);if(n===6){ctx.fillStyle='#d8b4e2';ctx.beginPath();ctx.arc(px+u*.5,py+u*.5,u*.16,0,Math.PI*2);ctx.fill();}});
  var rows={};cells.forEach(function(p){(rows[p[1]]||(rows[p[1]]=[])).push(p);});
  var faceRow=Math.max(0,Math.min(h-1,h-1-Math.floor(h*s.faceHeight))),head=rows[faceRow]||rows[0],scale=Math.min(s.faceScale,Math.max(1,head.length*1.1));
  if(n===15){faceRow=0;head=[cells.filter(function(p){return p[0]===w-1;})[0]];scale=1.1;}
  if(n===12){head=[rows[faceRow].filter(function(p){return p[0]===Math.floor(w/2);})[0]||head[0]];scale=1.1;}
  var first=head[0],last=head[head.length-1],fx=(first[0]+last[0]+1)*u/2,fy=(h-faceRow-.5)*u;
  var limb=n===1?'#b92f39':n===2?'#b76f2f':n===3?'#a84244':n===5?'#2d649a':n===6?'#bd315d':n===8?'#883260':n===10?'#b83d4c':n===4||n===40?'#367b3c':n===30?'#a49d52':n===50?'#508f81':n===60?'#774b97':n===70?'#8c9160':n===80?'#8a2b68':n===90?'#677780':'#596278';ctx.strokeStyle=limb;ctx.fillStyle=limb;ctx.lineWidth=Math.max(1.3,u*.095);
  function hand(hx,hy,side,fingers){ctx.save();ctx.translate(hx,hy);var reach=n>=30?2.1:1;ctx.scale(reach,reach);ctx.lineWidth/=reach;hx=0;hy=0;ctx.beginPath();ctx.moveTo(hx,hy);ctx.quadraticCurveTo(hx+side*u*.24,hy-u*.12,hx+side*u*.38,hy-u*.06);ctx.stroke();if(fingers){for(var i=0;i<5;i++){ctx.beginPath();ctx.moveTo(hx+side*u*.38,hy-u*.06);ctx.lineTo(hx+side*u*(.46+.12*Math.cos(i*.6)),hy+u*(i-2)*.12);ctx.stroke();}}else{ctx.beginPath();ctx.arc(hx+side*u*.38,hy-u*.06,u*.06,0,Math.PI*2);ctx.fill();}ctx.restore();}
  if(n===12){[0,w*u].forEach(function(hx,i){var side=i?1:-1;ctx.strokeStyle='#a43e4c';ctx.lineWidth=Math.max(1.3,u*.10);ctx.beginPath();ctx.moveTo(hx,(h-.95)*u);ctx.quadraticCurveTo(hx+side*u*.04,(h-.40)*u,hx+side*u*.13,(h-.12)*u);ctx.stroke();ctx.fillStyle='#a43e4c';ctx.beginPath();ctx.ellipse(hx+side*u*.13,(h-.12)*u,u*.10,u*.16,0,0,Math.PI*2);ctx.fill();});}
  else if(n===15){var armY=(h-.40)*u;hand(0,armY,-1,false);ctx.beginPath();ctx.moveTo(w*u,armY-u*.15);ctx.quadraticCurveTo(w*u+u*.45,armY+u*.10,w*u+u*.04,armY+u*.26);ctx.stroke();}
  else if(n===60||n===80){[-1,1].forEach(function(side){var hx=side<0?0:w*u,hy=h*u*.2;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx+side*u*.6,hy+u*.6);ctx.lineTo(hx+side*u*.16,hy+u*.95);ctx.lineTo(hx+side*u*.65,hy+u*1.3);ctx.lineTo(hx+side*u*.35,hy+u*1.7);ctx.stroke();});}
  else if(n===8){for(var arm=0;arm<4;arm++){var armY=h*u*(arm+.5)/4,r=Math.max(0,Math.min(h-1,h-1-Math.floor(armY/u))),rr=rows[r],left=Math.min.apply(null,rr.map(function(p){return p[0];})),right=Math.max.apply(null,rr.map(function(p){return p[0];}));hand(left*u,armY,-1,false);hand((right+1)*u,armY,1,false);}}
  else{hand(first[0]*u,fy+u*.2,-1,n===10||n===90||n===100);hand((last[0]+1)*u,fy+u*.2,1,n===5||n===10||n===90||n===100);}
  var bottom=rows[0],mid=(bottom[0][0]+bottom[bottom.length-1][0]+1)*u/2;[-.2,.2].forEach(function(dx){ctx.beginPath();ctx.moveTo(mid+dx*u,h*u);ctx.lineTo(mid+dx*u,h*u+u*.22);ctx.lineTo(mid+(dx+.10)*u,h*u+u*.22);ctx.stroke();});
  face(ctx,fx,fy,u*scale*.95,n);
  var topRow=rows[h-1],topCenter=(topRow[0][0]+topRow[topRow.length-1][0]+1)*u/2;
  if(n===1||n===2){ctx.strokeStyle=n===1?'#8e2934':'#7c4761';ctx.lineWidth=u*.055;for(var stalk=0;stalk<n;stalk++){var sx=topCenter+(stalk-(n-1)/2)*u*.35;ctx.beginPath();ctx.moveTo(sx,u*.02);ctx.lineTo(sx+u*(stalk===0?-.08:.08),-u*.28);ctx.stroke();}}
  if(n===3||n===7){var count=n===3?3:7;for(var i=0;i<count;i++){var xx=topCenter+u*(i-(count-1)/2)*(n===7?.16:.27);ctx.fillStyle=n===3?'#df4351':rainbow[i];ctx.strokeStyle='#694258';ctx.lineWidth=u*.035;ctx.beginPath();ctx.moveTo(xx-u*.14,u*.04);ctx.lineTo(xx-u*.11,-u*(.24+(i%2)*.14));ctx.lineTo(xx+u*.12,u*.04);ctx.closePath();ctx.fill();ctx.stroke();}}
  if(n===3&&h>=3){ctx.fillStyle='#d93b43';for(var dot=0;dot<3;dot++){ctx.beginPath();ctx.arc(topCenter,u*(1.4+dot*.45),u*.085,0,Math.PI*2);ctx.fill();}}
  if(n===9||n===30){ctx.fillStyle=n===30?'#b9b25c':n===40?'#418b42':n===90?'#74848a':'#4b5868';for(var hair=0;hair<3;hair++)ctx.fillRect(topCenter+u*(hair-1.5)*.5,-u*(.16+(hair%2)*.13),u*.48,u*.21);}
  if(n===14||n===40){ctx.strokeStyle=n===14?'#518c49':'#428f4b';ctx.lineWidth=u*.10;ctx.beginPath();ctx.moveTo(0,u*.5);ctx.lineTo(0,u*.15);ctx.quadraticCurveTo(0,-u*.22,u*.5,-u*.22);ctx.lineTo(w*u-u*.5,-u*.22);ctx.quadraticCurveTo(w*u,-u*.22,w*u,u*.15);ctx.lineTo(w*u,u*.5);ctx.stroke();}
  if(n===90){ctx.fillStyle='#849298';ctx.fillRect((w*.35)*u,-u*.35,w*.3*u,u*.38);ctx.strokeStyle='#627078';ctx.lineWidth=u*.07;ctx.strokeRect((w*.35)*u,-u*.35,w*.3*u,u*.38);}
  if(n===70){ctx.strokeStyle='#a2a574';ctx.lineWidth=u*.13;ctx.beginPath();ctx.moveTo(topCenter-u*.22,0);ctx.lineTo(topCenter-u*.22,-u*.7);ctx.quadraticCurveTo(topCenter,-u*1.25,topCenter+u*.22,-u*.7);ctx.lineTo(topCenter+u*.22,0);ctx.stroke();ctx.fillStyle='#f8df50';ctx.beginPath();ctx.arc(topCenter,-u*.4,u*.2,0,Math.PI*2);ctx.fill();}
  if(n===80){ctx.strokeStyle='#992a70';ctx.lineWidth=u*.09;[0,w*u].forEach(function(sx){ctx.beginPath();ctx.moveTo(sx,0);for(var iy=0;iy<h;iy++)ctx.lineTo(sx+(iy%2?u*.12:-u*.12),(iy+1)*u);ctx.stroke();});}
  if(n===20){ctx.fillStyle='#8d5795';ctx.strokeStyle='#59375e';ctx.lineWidth=u*.04;ctx.save();ctx.translate(topCenter-u*.5,-u*.06);ctx.rotate(-.3);ctx.fillRect(-u*.35,-u*.55,u*.7,u*.6);ctx.strokeRect(-u*.35,-u*.55,u*.7,u*.6);ctx.fillRect(-u*.52,0,u*1.04,u*.1);ctx.restore();}
  if(n===17){ctx.fillStyle='#d7ad6c';ctx.beginPath();ctx.ellipse(w*u+u*.3,fy+u*.3,u*.27,u*.36,.35,0,Math.PI*2);ctx.fill();[1,3,5,6].forEach(function(c,i){ctx.fillStyle=units[c];ctx.beginPath();ctx.arc(w*u+u*(.22+(i%2)*.17),fy+u*(.13+Math.floor(i/2)*.22),u*.055,0,Math.PI*2);ctx.fill();});}
  if(opt.label!==false){ctx.fillStyle='#263b4c';ctx.font='bold '+Math.max(12,u*.48)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText(String(n),topCenter,-u*(n===3||n===7?.48:n===9||n===1||n===2?.35:.13));}
  ctx.restore();return {width:w,height:h};
 }
 var api={spec:spec,cellColor:cellColor,draw:draw,units:units,tens:tens};root.NUMBER_ART=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
