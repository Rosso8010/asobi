(function () {
  'use strict';
  var WIDTH=1000, HEIGHT=750;
  function canvas(w,h){var c=document.createElement('canvas');c.width=w||WIDTH;c.height=h||HEIGHT;return c;}
  function image(src){return new Promise(function(ok,no){var im=new Image();im.onload=function(){ok(im);};im.onerror=function(){no(new Error('画像を読み込めません'));};im.src=src;});}
  function button(text,fn){var b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',fn);return b;}
  function database(){return new Promise(function(ok,no){var r=indexedDB.open('asobi-studio-v1',1);r.onupgradeneeded=function(){r.result.createObjectStore('drafts');};r.onsuccess=function(){ok(r.result);};r.onerror=function(){no(r.error);};});}
  function draftIO(value){return database().then(function(db){return new Promise(function(ok,no){var tx=db.transaction('drafts',value?'readwrite':'readonly'),s=tx.objectStore('drafts'),r=value?s.put(value,'current'):s.get('current');var result;r.onsuccess=function(){result=r.result;};tx.oncomplete=function(){db.close();ok(result);};tx.onerror=tx.onabort=function(){db.close();no(tx.error||new Error('保存できません'));};});});}
  window.createStudio=function(){
    var screen=document.getElementById('scr-oekaki'),stage=document.getElementById('oe-stage'),view=document.getElementById('oe-cv'),vctx=view.getContext('2d');
    var mixSource=null;
    var layers=[],active=1,tool='pen',stamp='🐶',lastStamp=null,color='#ee6677',size=14,opacity=1,zoom=1,angle=0,pan={x:0,y:0},history=[],future=[],pointer=null,selection=null,floating=null,pointers={},gesture=null,ready=false,busy=false,revision=0,savedRevision=-1,saveTimer=null,saveChain=Promise.resolve(),workChain=Promise.resolve(),artId=null,cardMeta=null,editingCard=false;
    var toolbar=document.getElementById('oe-tools');toolbar.innerHTML='';
    var status=document.createElement('div');status.className='studio-status';status.setAttribute('role','status');stage.appendChild(status);
    var side=document.createElement('aside');side.className='studio-panel hidden';side.setAttribute('aria-label','どうぐとレイヤー');stage.appendChild(side);
    function note(t){status.textContent=t;}
    function layer(name){return {name:name,visible:true,opacity:1,canvas:canvas()};}
    function current(){return layers[active];}
    function pack(){return {format:1,width:WIDTH,height:HEIGHT,layers:layers.map(function(l){return {name:l.name,visible:l.visible,opacity:l.opacity,image:l.canvas.toDataURL('image/png')};}),active:active,artId:artId,card:cardMeta};}
    function validate(p){if(!p||p.format!==1||p.width!==WIDTH||p.height!==HEIGHT||!Array.isArray(p.layers)||!p.layers.length||p.layers.length>6)throw new Error('この作品の形式には対応していません');p.layers.forEach(function(l){if(!l||typeof l.name!=='string'||l.name.length>60||typeof l.visible!=='boolean'||!Number.isFinite(l.opacity)||l.opacity<0||l.opacity>1||typeof l.image!=='string'||l.image.length>16000000||!/^data:image\/png;base64,/.test(l.image))throw new Error('作品データが不正です');});}
    function unpack(p){validate(p);return Promise.all(p.layers.map(function(l){return image(l.image).then(function(im){if(im.width!==WIDTH||im.height!==HEIGHT)throw new Error('画像サイズが不正です');var n=layer(l.name);n.visible=l.visible;n.opacity=l.opacity;n.canvas.getContext('2d').drawImage(im,0,0);return n;});})).then(function(a){layers=a;active=Math.min(a.length-1,Math.max(0,Number(p.active)||0));artId=typeof p.artId==='string'?p.artId:null;cardMeta=p.card||null;selection=null;floating=null;render();layerUI();});}
    function snapshot(){return {layers:layers.map(function(l){var c=canvas();c.getContext('2d').drawImage(l.canvas,0,0);return {name:l.name,visible:l.visible,opacity:l.opacity,canvas:c};}),active:active};}
    function remember(){if(busy||!ready)return;history.push(snapshot());if(history.length>6)history.shift();future=[];updateButtons();}
    function restore(s){layers=s.layers;active=s.active;selection=null;floating=null;render();layerUI();changed();}
    function changed(){queueCardGlow();revision++;render();updateButtons();clearTimeout(saveTimer);saveTimer=setTimeout(saveDraft,650);note('✎ へんこうあり · じどうほぞんします');}
    function saveDraft(){clearTimeout(saveTimer);if(!ready)return Promise.resolve();commitSelection();if(savedRevision===revision)return saveChain;var data=pack(),r=revision;saveChain=saveChain.catch(function(){}).then(function(){return draftIO(data);}).then(function(){savedRevision=r;note(revision===r?'✓ したがき ほぞんずみ':'✎ つづきを ほぞんします');}).catch(function(){note('保存できません。バックアップで外に残してください');throw new Error('下書きの保存に失敗しました');});saveChain.catch(function(){});return saveChain;}
    function composite(){var c=canvas(),x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,WIDTH,HEIGHT);layers.forEach(function(l){if(l.visible){x.globalAlpha=l.opacity;x.drawImage(l.canvas,0,0);}});x.globalAlpha=1;return c;}
    function fit(){var r=stage.getBoundingClientRect();return Math.min((r.width-32)/WIDTH,(r.height-58)/HEIGHT)*zoom;}
    function render(){if(!layers.length)return;var r=stage.getBoundingClientRect();if(!r.width||!r.height)return;var d=Math.min(devicePixelRatio||1,1.5);if(view.width!==Math.round(r.width*d)||view.height!==Math.round(r.height*d)){view.width=Math.round(r.width*d);view.height=Math.round(r.height*d);}vctx.setTransform(d,0,0,d,0,0);vctx.clearRect(0,0,r.width,r.height);vctx.save();vctx.translate(r.width/2+pan.x,r.height/2+pan.y);vctx.rotate(angle);var s=fit();vctx.scale(s,s);vctx.translate(-WIDTH/2,-HEIGHT/2);vctx.fillStyle='#fff';vctx.fillRect(0,0,WIDTH,HEIGHT);layers.forEach(function(l){if(l.visible){vctx.globalAlpha=l.opacity;vctx.drawImage(l.canvas,0,0);}});vctx.globalAlpha=1;if(floating){vctx.save();vctx.translate(floating.x+floating.w/2,floating.y+floating.h/2);vctx.rotate(floating.angle);vctx.drawImage(floating.canvas,-floating.w/2,-floating.h/2,floating.w,floating.h);vctx.restore();}if(pointer&&pointer.shape){vctx.save();vctx.beginPath();vctx.rect(0,0,WIDTH,HEIGHT);vctx.clip();drawGeometry(vctx,pointer.shape,pointer.start,pointer.p);vctx.restore();}if(selection){vctx.strokeStyle='#3259b8';vctx.lineWidth=2/s;vctx.setLineDash([8/s,5/s]);vctx.strokeRect(selection.x,selection.y,selection.w,selection.h);}vctx.restore();}
    function point(e){var r=view.getBoundingClientRect(),x=e.clientX-r.left-r.width/2-pan.x,y=e.clientY-r.top-r.height/2-pan.y,s=fit(),co=Math.cos(-angle),si=Math.sin(-angle);return{x:(x*co-y*si)/s+WIDTH/2,y:(x*si+y*co)/s+HEIGHT/2};}
    function inside(p){return p.x>=0&&p.y>=0&&p.x<WIDTH&&p.y<HEIGHT;}
    function commitSelection(){if(!floating)return;var x=current().canvas.getContext('2d');x.save();x.translate(floating.x+floating.w/2,floating.y+floating.h/2);x.rotate(floating.angle);x.drawImage(floating.canvas,-floating.w/2,-floating.h/2,floating.w,floating.h);x.restore();floating=null;selection=null;render();}
    function lift(){if(!selection||floating)return;var r=selection;if(r.w<2||r.h<2)return;var c=canvas(Math.ceil(r.w),Math.ceil(r.h));c.getContext('2d').drawImage(current().canvas,r.x,r.y,r.w,r.h,0,0,c.width,c.height);current().canvas.getContext('2d').clearRect(r.x,r.y,r.w,r.h);floating={canvas:c,x:r.x,y:r.y,w:r.w,h:r.h,angle:0};}
    function drawGeometry(ctx,kind,a,b){
      var r=Math.max(6,size*1.35);
      ctx.save();ctx.beginPath();ctx.globalAlpha=opacity;ctx.lineWidth=size;ctx.lineCap='round';ctx.strokeStyle=color;ctx.fillStyle=color;
      if(kind==='line'){ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
      else if(kind==='circle'){ctx.arc(a.x,a.y,Math.hypot(b.x-a.x,b.y-a.y),0,Math.PI*2);ctx.stroke();}
      else{
        ctx.translate(b.x,b.y);
        if(kind==='dot')ctx.arc(0,0,r,0,Math.PI*2);
        else if(kind==='square')ctx.rect(-r,-r,r*2,r*2);
        else if(kind==='heart'){
          ctx.moveTo(0,r);ctx.bezierCurveTo(-r*2,-r*.4,-r*.75,-r*1.5,0,-r*.45);
          ctx.bezierCurveTo(r*.75,-r*1.5,r*2,-r*.4,0,r);
        }else{
          var star=kind==='star',count=star?10:3;
          for(var i=0;i<count;i++){
            var angle=i*Math.PI*2/count-Math.PI/2,reach=star&&i%2?r*.45:r;
            if(i)ctx.lineTo(Math.cos(angle)*reach,Math.sin(angle)*reach);
            else ctx.moveTo(Math.cos(angle)*reach,Math.sin(angle)*reach);
          }
        }
        ctx.closePath();ctx.fill();
      }
      ctx.restore();
    }
    function brush(a,b){var x=current().canvas.getContext('2d');x.save();if(tool==='stamp'){if(lastStamp&&Math.hypot(b.x-lastStamp.x,b.y-lastStamp.y)<Math.max(30,size*2)){x.restore();return;}x.globalAlpha=opacity;x.font=Math.max(32,size*3)+'px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(stamp,b.x,b.y);lastStamp=b;x.restore();return;}x.lineCap='round';x.lineJoin='round';x.lineWidth=size;x.globalAlpha=opacity;x.strokeStyle=color;x.fillStyle=color;if(tool==='rainbow'){x.strokeStyle=x.fillStyle='hsl('+((Date.now()/8)%360)+',80%,60%)';}if(tool==='eraser')x.globalCompositeOperation='destination-out';if(tool==='mix'){
        x.restore();
        var radius=Math.max(10,Math.round(size)),distance=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.max(1,Math.ceil(distance/Math.max(2,radius*.5)));
        for(var step=1;step<=steps;step++)mixAt(x,a.x+(b.x-a.x)*step/steps,a.y+(b.y-a.y)*step/steps,radius);
        return;
      }

      if(tool==='blur'||tool==='smudge'){
        var rad=Math.max(6,Math.round(size/2));
        if(tool==='smudge'&&a.x===b.x&&a.y===b.y){x.restore();return;}
        x.beginPath();x.arc(b.x,b.y,rad,0,Math.PI*2);x.clip();
        if(tool==='blur'){
          var patch=canvas(rad*2,rad*2),small=canvas(Math.max(2,Math.round(rad/4)),Math.max(2,Math.round(rad/4)));
          patch.getContext('2d').drawImage(current().canvas,rad-b.x,rad-b.y);
          small.getContext('2d').drawImage(patch,0,0,small.width,small.height);
          x.globalAlpha=opacity*.8;
          x.drawImage(small,b.x-rad,b.y-rad,rad*2,rad*2);
        }else{
          var pulled=canvas(rad*2,rad*2);
          pulled.getContext('2d').drawImage(current().canvas,rad-a.x,rad-a.y);
          x.globalAlpha=opacity*.75;
          x.drawImage(pulled,b.x-rad,b.y-rad);
        }
      }
      else {x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke();if(a.x===b.x&&a.y===b.y){x.beginPath();x.arc(b.x,b.y,size/2,0,Math.PI*2);x.fill();}}x.restore();}
    // A painter's hue wheel brings yellow and blue through green, with a darker mixed pigment.
    var screenHue=[0,30,60,120,180,240,270,300,360],paintHue=[0,30,60,145,185,225,295,325,360];
    function mapHue(h,from,to){
      for(var i=1;i<from.length;i++)if(h<=from[i])return to[i-1]+(h-from[i-1])/(from[i]-from[i-1])*(to[i]-to[i-1]);
      return 0;
    }
    function pigment(r,g,b){
      r/=255;g/=255;b/=255;
      var hi=Math.max(r,g,b),lo=Math.min(r,g,b),d=hi-lo,l=(hi+lo)/2,h=0;
      if(d)h=hi===r?(g-b)/d:hi===g?(b-r)/d+2:(r-g)/d+4;
      return [mapHue((h*60+360)%360,screenHue,paintHue)*Math.PI/180,d?d/(1-Math.abs(2*l-1)):0,l];
    }
    function pigmentRgb(angle,s,l){
      var h=mapHue((angle*180/Math.PI+360)%360,paintHue,screenHue)/60,c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs(h%2-1)),m=l-c/2;
      return [[c,x,0],[x,c,0],[0,c,x],[0,x,c],[x,0,c],[c,0,x]][Math.floor(h)].map(function(v){return (v+m)*255;});
    }
    function mixAt(ctx,cx,cy,r){
      var left=Math.max(0,Math.floor(cx-r)),top=Math.max(0,Math.floor(cy-r)),w=Math.min(WIDTH-left,2*r+1),h=Math.min(HEIGHT-top,2*r+1);
      if(w<1||h<1)return;
      var patch=ctx.getImageData(left,top,w,h),dst=patch.data,stride=Math.max(1,Math.floor(r/6)),xx=0,yy=0,sat=0,light=0,weight=0,first=null,varied=false;
      mixSource.forEach(function(source){
        var src=source.ctx.getImageData(left,top,w,h).data;
        for(var y=0;y<h;y+=stride)for(var x=0;x<w;x+=stride){
          var i=(y*w+x)*4,d=Math.hypot(left+x-cx,top+y-cy)/r;
          if(d>=1||!src[i+3])continue;
          var rgb=[src[i],src[i+1],src[i+2]];
          if(!first)first=rgb;
          else if(Math.max(Math.abs(rgb[0]-first[0]),Math.abs(rgb[1]-first[1]),Math.abs(rgb[2]-first[2]))>12)varied=true;
          var p=pigment(rgb[0],rgb[1],rgb[2]),a=src[i+3]*source.opacity*(1-d*.55);
          xx+=Math.cos(p[0])*p[1]*a;yy+=Math.sin(p[0])*p[1]*a;sat+=p[1]*a;light+=p[2]*a;weight+=a;
        }
      });
      if(!weight||!varied)return;
      var coherence=sat?Math.min(1,Math.hypot(xx,yy)/sat):0;
      var mixed=pigmentRgb(Math.atan2(yy,xx),sat/weight*Math.min(1,coherence*4),light/weight*(.75+.25*coherence));
      for(var j=0;j<dst.length;j+=4){
        if(!dst[j+3])continue;
        var distance=Math.hypot(left+(j/4)%w-cx,top+Math.floor(j/(4*w))-cy)/r;
        var strength=Math.min(1,Math.max(0,(1-distance)*2))*opacity;
        for(var k=0;k<3;k++)dst[j+k]+=(mixed[k]-dst[j+k])*strength;
      }
      ctx.putImageData(patch,left,top);
    }
    function bucket(p){var src=composite().getContext('2d').getImageData(0,0,WIDTH,HEIGHT).data,x=current().canvas.getContext('2d'),dest=x.getImageData(0,0,WIDTH,HEIGHT),data=dest.data,seed=Math.floor(p.y)*WIDTH+Math.floor(p.x),base=Array.prototype.slice.call(src,seed*4,seed*4+4),seen=new Uint8Array(WIDTH*HEIGHT),queue=new Int32Array(WIDTH*HEIGHT),head=0,tail=1,n=parseInt(color.slice(1),16),rgb=[n>>16,(n>>8)&255,n&255];queue[0]=seed;seen[seed]=1;
      function visit(i){if(seen[i])return;seen[i]=1;var j=i*4;if(Math.abs(src[j]-base[0])+Math.abs(src[j+1]-base[1])+Math.abs(src[j+2]-base[2])<80)queue[tail++]=i;}
      while(head<tail){var i=queue[head++],j=i*4;data[j]=rgb[0];data[j+1]=rgb[1];data[j+2]=rgb[2];data[j+3]=Math.round(opacity*255);if(i%WIDTH)visit(i-1);if(i%WIDTH<WIDTH-1)visit(i+1);if(i>=WIDTH)visit(i-WIDTH);if(i<WIDTH*(HEIGHT-1))visit(i+WIDTH);}x.putImageData(dest,0,0);
    }
    function gestureState(){var a=Object.keys(pointers).map(function(k){return pointers[k];});if(a.length<2)return null;return{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2,d:Math.max(1,Math.hypot(a[1].x-a[0].x,a[1].y-a[0].y)),a:Math.atan2(a[1].y-a[0].y,a[1].x-a[0].x)};}
    view.addEventListener('pointerdown',function(e){if(!ready||busy)return;e.preventDefault();pointers[e.pointerId]={x:e.clientX,y:e.clientY};try{view.setPointerCapture(e.pointerId);}catch(ignore){}if(Object.keys(pointers).length===2){if(pointer&&pointer.drawing&&history.length){var original=history.pop();layers=original.layers;active=original.active;}pointer=null;var g=gestureState();gesture={start:g,zoom:zoom,angle:angle,pan:{x:pan.x,y:pan.y}};render();return;}if(gesture)return;var p=point(e);if(tool==='pan'){pointer={id:e.pointerId,p:p,screen:{x:e.clientX,y:e.clientY},pan:{x:pan.x,y:pan.y}};return;}if(!inside(p)||!current().visible){note('えがくレイヤーの目をひらいてね');return;}if(tool==='select'){if(floating){pointer={id:e.pointerId,p:p,moving:true};return;}commitSelection();remember();selection={x:p.x,y:p.y,w:0,h:0};pointer={id:e.pointerId,p:p,start:p,selecting:true};return;}commitSelection();
      if(tool==='line'||tool==='circle'){pointer={id:e.pointerId,start:p,p:p,shape:tool};render();return;}
      remember();pointer={id:e.pointerId,p:p,drawing:true};
      if(tool==='shapeStamp'){drawGeometry(current().canvas.getContext('2d'),stampChoice.value,p,p);render();return;}lastStamp=null;mixSource=tool==='mix'?layers.filter(function(l){return l.visible&&l.opacity>0;}).map(function(l){var copy=l===current()?canvas():l.canvas;if(l===current())copy.getContext('2d').drawImage(l.canvas,0,0);return {ctx:copy.getContext('2d'),opacity:l.opacity};}):null;if(tool==='bucket')bucket(p);else brush(p,p);render();});
    view.addEventListener('pointermove',function(e){if(pointers[e.pointerId])pointers[e.pointerId]={x:e.clientX,y:e.clientY};if(gesture){var g=gestureState();if(!g)return;zoom=Math.max(.35,Math.min(5,gesture.zoom*g.d/gesture.start.d));angle=gesture.angle+g.a-gesture.start.a;pan.x=gesture.pan.x+g.x-gesture.start.x;pan.y=gesture.pan.y+g.y-gesture.start.y;render();return;}if(!pointer||pointer.id!==e.pointerId)return;var p=point(e);if(tool==='pan'){pan.x=pointer.pan.x+e.clientX-pointer.screen.x;pan.y=pointer.pan.y+e.clientY-pointer.screen.y;}else if(pointer.selecting){selection={x:Math.max(0,Math.min(pointer.start.x,p.x)),y:Math.max(0,Math.min(pointer.start.y,p.y)),w:Math.min(WIDTH,Math.max(pointer.start.x,p.x))-Math.max(0,Math.min(pointer.start.x,p.x)),h:Math.min(HEIGHT,Math.max(pointer.start.y,p.y))-Math.max(0,Math.min(pointer.start.y,p.y))};}else if(pointer.moving&&floating){floating.x+=p.x-pointer.p.x;floating.y+=p.y-pointer.p.y;selection.x=floating.x;selection.y=floating.y;}else if(pointer.drawing&&tool!=='bucket'&&tool!=='shapeStamp'){var smooth={x:pointer.p.x+(p.x-pointer.p.x)*.65,y:pointer.p.y+(p.y-pointer.p.y)*.65};brush(pointer.p,smooth);p=smooth;}pointer.p=p;render();});
    function end(e){delete pointers[e.pointerId];if(gesture){if(!Object.keys(pointers).length){gesture=null;changed();}return;}if(!pointer||pointer.id!==e.pointerId)return;if(pointer.selecting){lift();note('選んだ絵をドラッグ。選択どうぐで大きさ・回転を変えられます');}var edited=pointer.drawing||pointer.moving;
      if(pointer.shape&&e.type==='pointerup'){
        var finish=point(e);
        if(Math.hypot(finish.x-pointer.start.x,finish.y-pointer.start.y)>=2){
          remember();drawGeometry(current().canvas.getContext('2d'),pointer.shape,pointer.start,finish);edited=true;
        }
      }
      pointer=null;mixSource=null;if(edited){changed();}else render();}
    view.addEventListener('pointerup',end);view.addEventListener('pointercancel',end);view.addEventListener('lostpointercapture',end);
    var toolLabel=document.createElement('strong');toolLabel.className='studio-active-tool';toolLabel.textContent='✏ ペン 選択中';toolbar.before(toolLabel);
    var toolExample=document.createElement('canvas');toolExample.width=178;toolExample.height=25;toolExample.style.cssText='max-width:100%;display:block;visibility:hidden';
    toolLabel.after(toolExample);
    var toolHint={line:'はしから はしへ ドラッグ',circle:'まんなかから 外へ ドラッグ',shapeStamp:'図形をえらんで 紙をタップ',blur:'線のふちをやわらかく',smudge:'色から外へ引っぱる',mix:'2色の境目をなぞる'};
    function explainTool(label){
      var hint=toolHint[tool];toolLabel.textContent=label+(hint?' · '+hint:' 選択中');
      var hasExample=tool==='blur'||tool==='smudge'||tool==='mix';
      toolExample.style.visibility=hasExample?'visible':'hidden';stampChoice.hidden=tool!=='shapeStamp';
      if(!hasExample)return;
      var x=toolExample.getContext('2d');x.clearRect(0,0,178,25);
      x.fillStyle='#f04b68';x.fillRect(3,4,32,17);
      if(tool==='mix'){x.fillStyle='#405bea';x.fillRect(35,4,32,17);}
      x.font='17px sans-serif';x.fillStyle='#54707a';x.fillText('→',78,19);
      if(tool==='blur'){
        var soft=x.createLinearGradient(104,0,159,0);
        soft.addColorStop(0,'rgba(240,75,104,0)');soft.addColorStop(.35,'#f04b68');soft.addColorStop(.65,'#f04b68');soft.addColorStop(1,'rgba(240,75,104,0)');
        x.fillStyle=soft;x.fillRect(104,4,55,17);
      }else if(tool==='smudge'){
        x.fillStyle='#f04b68';x.beginPath();x.moveTo(104,4);x.lineTo(130,4);x.lineTo(172,12);x.lineTo(130,21);x.lineTo(104,21);x.fill();
      }else{
        x.fillStyle='#f04b68';x.fillRect(104,4,17,17);x.fillStyle='#9346b6';x.fillRect(121,4,30,17);x.fillStyle='#405bea';x.fillRect(151,4,17,17);
      }
      toolExample.setAttribute('aria-label',hint+'の見本');
    }
    var toolButtons={};[['pen','✏ ペン'],['line','╱ 直線'],['circle','○ 丸'],['shapeStamp','◆ 図形スタンプ'],['eraser','▱ けす'],['bucket','▣ バケツ'],['select','▧ えらぶ'],['pan','✋ うごかす'],['blur','◌ ぼかす'],['smudge','〰 のばす'],['mix','◐ いろをまぜる']].forEach(function(t){var b=button(t[1],function(){commitSelection();tool=t[0];Object.keys(toolButtons).forEach(function(k){toolButtons[k].setAttribute('aria-pressed',k===tool?'true':'false');});explainTool(t[1]);note(toolHint[tool]||'２本指で拡大・回転できます');render();});b.dataset.tool=t[0];b.setAttribute('aria-pressed',t[0]===tool?'true':'false');toolbar.appendChild(b);toolButtons[t[0]]=b;});
    var stampChoice=document.createElement('select');stampChoice.setAttribute('aria-label','図形スタンプの形');stampChoice.hidden=true;
    [['dot','● 丸'],['square','■ 四角'],['triangle','▲ 三角'],['star','★ 星'],['heart','♥ ハート']].forEach(function(shape){
      var option=document.createElement('option');option.value=shape[0];option.textContent=shape[1];stampChoice.appendChild(option);
    });
    toolButtons.shapeStamp.after(stampChoice);
    function extraTool(id,label){var b=button(label,function(){commitSelection();tool=id;Object.keys(toolButtons).forEach(function(k){toolButtons[k].setAttribute('aria-pressed',k===tool?'true':'false');});explainTool(label);note(label);});toolButtons[id]=b;b.setAttribute('aria-pressed','false');side.appendChild(b);return b;}
    extraTool('rainbow','🌈 にじいろペン');extraTool('stamp','★ スタンプ');
    var stamps=document.createElement('details'),summary=document.createElement('summary');summary.textContent='スタンプをえらぶ';stamps.appendChild(summary);Array.from('🐶🐱🐭🐰🦊🐻🐼🐸🐵🐥🦁🐮🐷🐨🦄🐟🐬🐙🦋🐞🦖🦕🌸🌷🌻🍀🌈⭐🌙☀️☁️⛄❄️🔥🍎🍌🍓🍉🍦🍩🍰🍭🚗🚌🚒🚂✈️🚀⛵⚽🏀🎈🎁🎀🎵🎹🥁👑💎💖✨😀😆😍😺🤖👻').forEach(function(ch){stamps.appendChild(button(ch,function(){stamp=ch;toolButtons.stamp.click();}));});side.appendChild(stamps);
    var colorInput=document.createElement('input');colorInput.type='color';colorInput.value=color;colorInput.setAttribute('aria-label','いろ');colorInput.addEventListener('input',function(){color=colorInput.value;});toolbar.appendChild(colorInput);
    function range(label,min,max,value,fn,parent){var box=document.createElement('label');box.textContent=label;var r=document.createElement('input');r.type='range';r.min=min;r.max=max;r.value=value;r.setAttribute('aria-label',label);r.addEventListener('input',function(){fn(Number(r.value));});box.appendChild(r);(parent||side).appendChild(box);return r;}
    range('ふとさ',2,100,size,function(v){size=v;},toolbar);
    var clearAll=button('全消し',function(){if(!ready||busy)return;confirmDialog('全部のレイヤーの絵を消す？','保存済みのカードは消えません。この紙の絵を全消しします。「ひとつ戻す」で取り消せます。',function(){commitSelection();remember();layers.forEach(function(l){l.canvas.getContext('2d').clearRect(0,0,WIDTH,HEIGHT);});selection=null;floating=null;changed();return Promise.resolve();},'全消しする');});clearAll.dataset.action='clear-all';toolbar.appendChild(clearAll);
    toolbar.appendChild(button('☷ どうぐ',function(){side.classList.toggle('hidden');}));
    side.appendChild(button('× とじる',function(){side.classList.add('hidden');}));
    var intro=document.createElement('p');intro.textContent='レイヤーは上から重なります。２本指で拡大・回転。';side.appendChild(intro);
    range('ペンのこさ',5,100,100,function(v){opacity=v/100;});
    var layerOpacity;var layerBox=document.createElement('div');layerBox.className='studio-layers';side.appendChild(layerBox);
    function layerUI(){if(layerOpacity)layerOpacity.value=Math.round(current().opacity*100);layerBox.innerHTML='';layers.slice().reverse().forEach(function(l,rev){var i=layers.length-1-rev,row=document.createElement('div');row.className='studio-layer'+(i===active?' selected':'');row.appendChild(button(l.visible?'◉':'○',function(){commitSelection();remember();l.visible=!l.visible;layerUI();changed();}));row.appendChild(button(l.name,function(){commitSelection();active=i;layerUI();}));row.appendChild(button('↑',function(){if(i===layers.length-1)return;commitSelection();remember();layers.splice(i,1);layers.splice(i+1,0,l);active=i+1;layerUI();changed();}));layerBox.appendChild(row);});}
    side.appendChild(button('＋ レイヤー',function(){if(layers.length>=6){note('この端末では６枚までです');return;}commitSelection();remember();layers.push(layer('レイヤー '+(layers.length+1)));active=layers.length-1;layerUI();changed();}));
    layerOpacity=range('レイヤーのこさ',0,100,100,function(v){commitSelection();if(!side.dataset.opacityEdit){remember();side.dataset.opacityEdit='1';}current().opacity=v/100;changed();});side.addEventListener('change',function(){delete side.dataset.opacityEdit;});
    side.appendChild(button('レイヤーを削除',function(){if(layers.length===1){note('最後の１枚は残します');return;}if(!confirm('選んでいるレイヤーを削除しますか？ 元に戻すこともできます。'))return;commitSelection();remember();layers.splice(active,1);active=Math.min(active,layers.length-1);layerUI();changed();}));
    side.appendChild(button('選んだ絵を大きく',function(){if(!floating)return;floating.w*=1.15;floating.h*=1.15;selection.w=floating.w;selection.h=floating.h;render();}));side.appendChild(button('選んだ絵を小さく',function(){if(!floating)return;floating.w/=1.15;floating.h/=1.15;selection.w=floating.w;selection.h=floating.h;render();}));side.appendChild(button('選んだ絵を回転 ↻',function(){if(!floating)return;floating.angle+=Math.PI/12;render();}));side.appendChild(button('選択を確定 ✓',function(){commitSelection();changed();}));
    side.appendChild(button('表示をもどす ⤢',function(){zoom=1;angle=0;pan={x:0,y:0};render();}));
    var redo=button('↪ やりなおす',function(){if(!future.length||busy)return;commitSelection();history.push(snapshot());restore(future.pop());});toolbar.prepend(redo);toolbar.prepend(document.getElementById('oe-undo'));var fresh=document.getElementById('oe-clear');fresh.classList.add('studio-new');side.appendChild(fresh);var modeNav=document.createElement('nav');modeNav.className='studio-mode-tabs';modeNav.setAttribute('aria-label','お絵描きのモード');var free=button('✏ 自由に描く',function(){});free.setAttribute('aria-current','page');modeNav.appendChild(free);document.querySelectorAll('#scr-oekaki .oe-modebtn').forEach(function(b){modeNav.appendChild(b);});document.querySelector('#scr-oekaki .topbar').after(modeNav);
    function updateButtons(){document.getElementById('oe-undo').disabled=!history.length||busy;redo.disabled=!future.length||busy;}
    document.getElementById('oe-undo').addEventListener('click',function(){if(!history.length||busy)return;commitSelection();future.push(snapshot());restore(history.pop());});
    document.getElementById('oe-clear').textContent='＋ あたらしい絵';document.getElementById('oe-clear').addEventListener('click',function(){if(!ready||busy)return;saveDraft().then(function(){confirmDialog('新しい絵をはじめる？','今の絵を作品として保存してから、新しい紙をひらきます。',function(){return saveWork().then(function(){history=[];future=[];layers=[layer('背景'),layer('色'),layer('線')];active=2;artId=null;cardMeta=null;zoom=1;angle=0;pan={x:0,y:0};layerUI();changed();});});}).catch(function(){note('保存できないため、新しい絵に切り替えません');});});
    document.getElementById('oe-save').addEventListener('click',function(){saveWork().then(function(){note('✓ さくひんてんに保存しました');}).catch(function(e){note(e.message);});});
    var cardGlowTimer;
    function queueCardGlow(){
      clearTimeout(cardGlowTimer);
      cardBtn.classList.remove('studio-card-ready');
      if(cardMeta)return;
      cardGlowTimer=setTimeout(function(){
        if(!ready||busy||pointer||gesture||cur!=='oekaki')return;
        var sample=canvas(48,36),ctx=sample.getContext('2d'),pixels=0;
        layers.forEach(function(l){if(l.visible&&l.opacity>0){ctx.globalAlpha=l.opacity;ctx.drawImage(l.canvas,0,0,48,36);}});
        var data=ctx.getImageData(0,0,48,36).data;
        for(var i=3;i<data.length;i+=4)if(data[i]>=32&&++pixels>=8){
          cardBtn.classList.add('studio-card-ready');break;
        }
      },1600);
    }
    view.addEventListener('pointerdown',function(){
      clearTimeout(cardGlowTimer);cardBtn.classList.remove('studio-card-ready');
    });
    view.addEventListener('pointerup',queueCardGlow);
    view.addEventListener('pointercancel',queueCardGlow);
    var cardBtn=button('▣ カードにする',function(){if(!ready||busy)return;clearTimeout(cardGlowTimer);cardBtn.classList.remove('studio-card-ready');commitSelection();saveDraft().then(function(){editCard();}).catch(function(e){note(e.message);});});cardBtn.className='studio-primary';document.getElementById('oe-save').after(cardBtn);
    var bookBtn=button('▦ カードちょう',openBook);document.querySelector('#scr-oekaki .topbar .spacer').before(bookBtn);
    function saveWork(meta,updateCard){workChain=workChain.catch(function(){}).then(function(){if(!ready)throw new Error('読み込み中です');commitSelection();var p=pack(),c=composite(),img=c.toDataURL('image/png');p.card=meta||null;return (p.card&&!p.card.number?ASOBI_BACKUP.nextCardNumber().then(function(n){p.card.number=n;}):Promise.resolve()).then(function(){var id=(updateCard||(!meta&&!cardMeta))&&artId||Date.now()+'-'+Math.floor(Math.random()*1000000);p.artId=id;var row={id:id,at:Date.now(),kind:'free',title:p.card?p.card.name:'じゆうおえかき',img:img,payload:p};return window.ASOBI_BACKUP.putWork(row).then(function(){artId=id;cardMeta=p.card;editingCard=false;revision++;return saveDraft();}).then(function(){return row;});});});return workChain;}
    function dialog(title){var ov=document.createElement('div');ov.className='studio-overlay';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label',title);var box=document.createElement('section');box.className='studio-dialog';var head=document.createElement('header'),h=document.createElement('h2');h.textContent=title;head.appendChild(h);var previous=document.activeElement;function close(){ov.remove();document.removeEventListener('keydown',key);if(previous&&previous.focus)previous.focus();}head.appendChild(button('× とじる',close));box.appendChild(head);ov.appendChild(box);document.body.appendChild(ov);function key(e){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}if(e.key==='Tab'){var a=Array.prototype.slice.call(box.querySelectorAll('button,input,textarea,select')).filter(function(x){return !x.disabled;});if(!a.length)return;if(e.shiftKey&&document.activeElement===a[0]){a[a.length-1].focus();e.preventDefault();}else if(!e.shiftKey&&document.activeElement===a[a.length-1]){a[0].focus();e.preventDefault();}}}document.addEventListener('keydown',key);head.querySelector('button').focus();return{box:box,close:close,overlay:ov};}
    function confirmDialog(title,text,fn,confirmLabel){var d=dialog(title),p=document.createElement('p');p.textContent=text;d.box.appendChild(p);var yes=button(confirmLabel||'保存して はじめる',function(){yes.disabled=true;Promise.resolve().then(fn).then(d.close).catch(function(e){p.textContent=e.message;yes.disabled=false;});});d.box.appendChild(yes);}
    var kanaDictionary=null,kanaDictionaryRequest;
    function loadKanaDictionary(){
      if(!kanaDictionaryRequest)kanaDictionaryRequest=fetch('studio-kana-dictionary.json').then(function(response){
        if(!response.ok)throw new Error('辞書を読み込めません');
        return response.json();
      }).then(function(data){kanaDictionary=data;return data;}).catch(function(){kanaDictionaryRequest=null;return null;});
      return kanaDictionaryRequest;
    }
    function addKanaKeys(name){
      var keys=document.createElement('details'),summary=document.createElement('summary'),grid=document.createElement('div'),actions=document.createElement('div'),choices=document.createElement('div');
      keys.className='studio-kana';summary.textContent='あいうえおキーボード';keys.appendChild(summary);
      grid.className='studio-kana-grid';actions.className='studio-kana-actions';choices.className='studio-kana-actions';choices.setAttribute('aria-label','変換候補');
      keys.appendChild(grid);keys.appendChild(actions);keys.appendChild(choices);
      name.parentNode.after(keys);
      name.inputMode='none';
      function openKeys(){
        Array.from(name.closest('.studio-dialog').querySelectorAll('.studio-kana')).forEach(function(other){other.open=other===keys;});
        loadKanaDictionary();
      }
      name.addEventListener('focus',openKeys);
      name.addEventListener('click',openKeys);
      var words={'なまえ':['名前'],'そら':['空'],'ほし':['星'],'にじ':['虹'],'ねこ':['猫'],'いぬ':['犬'],'うさぎ':['兎'],'りゅう':['竜','龍'],'きょうりゅう':['恐竜'],'でんしゃ':['電車'],'ひこうき':['飛行機'],'くるま':['車'],'おうち':['お家'],'あそび':['遊び'],'たのしい':['楽しい']};
      WORLD_CORE.kanji.forEach(function(pair){var list=words[pair[1]]||(words[pair[1]]=[]);if(list.indexOf(pair[0])<0)list.push(pair[0]);});
      var position=name.value.length,end=position,extra=false;
      function capture(){position=name.selectionStart;end=name.selectionEnd;choices.replaceChildren();}
      ['input','click','keyup','select'].forEach(function(event){name.addEventListener(event,function(e){if(event!=='keyup'||e.key!==' ')capture();});});
      function replace(value,start,stop){
        if(name.value.length-(stop-start)+value.length>name.maxLength)return;
        name.setRangeText(value,start,stop,'end');position=name.selectionStart;end=position;choices.replaceChildren();
      }
      function showKeys(){
        grid.replaceChildren();
        var columns=extra?['がぎぐげご','ざじずぜぞ','だぢづでど','ばびぶべぼ','ぱぴぷぺぽ','ぁぃぅぇぉ','ゃ ゅ ょ','っー   ']:['あいうえお','かきくけこ','さしすせそ','たちつてと','なにぬねの','はひふへほ','まみむめも','や ゆ よ','らりるれろ','わ を ん'];
        columns.forEach(function(column,index){
          Array.from(column).forEach(function(ch,row){
            if(ch===' ')return;
            var key=button(ch,function(){replace(ch,position,end);});
            key.style.gridColumn=10-index;key.style.gridRow=row+1;grid.appendChild(key);
          });
        });
      }
      function convert(){
        var selected=name.value.slice(position,end),match=selected?selected.match(/^[ぁ-ゖー]+$/):name.value.slice(0,position).match(/[ぁ-ゖー]+$/);
        if(!match)return false;
        var reading=match[0],from=selected?position:position-reading.length,to=end,snapshot=name.value,cursor=position;
        function renderCandidates(){
          var text=reading,start=from;
          function lookup(k){return (words[k]||[]).concat(kanaDictionary&&kanaDictionary[k]||[]);}
          var found=lookup(text);
          if(!found.length&&!selected){
            for(var i=1;i<reading.length-1;i++){
              found=lookup(reading.slice(i));
              if(found.length){text=reading.slice(i);start=from+i;break;}
            }
          }
          var kata=text.replace(/[ぁ-ゖ]/g,function(ch){return String.fromCharCode(ch.charCodeAt(0)+96);});
          choices.replaceChildren();
          Array.from(new Set(found.concat([kata]))).slice(0,10).forEach(function(word){
            if(word!==text)choices.appendChild(button(word,function(){replace(word,start,to);}));
          });
        }
        renderCandidates();
        if(!kanaDictionary)loadKanaDictionary().then(function(data){
          if(data&&keys.open&&name.value===snapshot&&position===cursor&&end===to&&choices.children.length)renderCandidates();
        });
        return true;
      }
      actions.appendChild(button('が・ゃ・っ',function(){extra=!extra;showKeys();this.textContent=extra?'あ・い・う':'が・ゃ・っ';}));
      actions.appendChild(button('⌫ けす',function(){replace('',position===end?Math.max(0,position-1):position,end);}));
      actions.appendChild(button('スペース／変換',function(){if(!convert())replace(' ',position,end);}));
      actions.appendChild(button('空白',function(){replace(' ',position,end);}));
      ['、','。'].forEach(function(ch){actions.appendChild(button(ch,function(){replace(ch,position,end);}));});
      actions.appendChild(button('端末キーボード',function(){name.inputMode='text';name.blur();name.focus();}));
      name.addEventListener('keydown',function(e){
        if(e.key===' '&&!e.isComposing&&e.keyCode!==229){capture();if(convert())e.preventDefault();}
      });
      showKeys();
    }
    function editCard(){var previous=editingCard?cardMeta:null,d=dialog(previous?'カードを編集':'じぶんの カードをつくる'),preview=document.createElement('img');preview.src=composite().toDataURL();preview.className='studio-card-preview';d.box.appendChild(preview);function field(label,tag,max,value){var l=document.createElement('label');l.textContent=label;var e=document.createElement(tag);e.maxLength=max;e.value=value||'';l.appendChild(e);d.box.appendChild(l);return e;}var name=field('なまえ（あとでもOK）','input',40,previous&&previous.name),description=field('どんなもの？','textarea',180,previous&&previous.description),frame=document.createElement('select');frame.setAttribute('aria-label','カードのわく');var frames=[['berry','いちご'],['sky','ほしぞら'],['rainbow','にじ']];[['auto','🎲 おまかせ']].concat(frames).forEach(function(a){var o=document.createElement('option');o.value=a[0];o.textContent=a[1];frame.appendChild(o);});frame.value=previous?previous.frame:'auto';d.box.appendChild(frame);var message=document.createElement('p');message.textContent='名前はあとから変えられます。絵はそのまま残ります。';d.box.appendChild(message);var save=button(previous?'✓ カードを更新':'✓ カードちょうに しまう',function(){save.disabled=true;saveWork({name:name.value.trim()||'ななしのカード',description:description.value.trim(),frame:frame.value==='auto'?frames[Math.floor(Math.random()*frames.length)][0]:frame.value,number:previous&&previous.number,createdAt:previous&&previous.createdAt||Date.now()},!!previous).then(function(row){d.close();celebrateCard(row);note('✓ カードができた！');}).catch(function(e){message.textContent=e.message;save.disabled=false;});});d.box.appendChild(save);addKanaKeys(name);addKanaKeys(description);}
    var examples=[{name:'いちごドラゴン',description:'いちごをたべると、ピンクのひをはく。',frame:'berry',sample:0},{name:'そらとぶおうち',description:'よるになると、おつきさまへあそびにいく。',frame:'sky',sample:1},{name:'にじジュース',description:'のむと、すきないろのくもにのれる。',frame:'rainbow',sample:2}];
    function sampleArt(i){var c=canvas(),x=c.getContext('2d');x.fillStyle=['#fff3df','#e9f5ff','#fff5f5'][i];x.fillRect(0,0,WIDTH,HEIGHT);x.lineWidth=9;x.lineJoin='round';x.lineCap='round';function shape(points,fill){x.beginPath();points.forEach(function(p,j){if(j)x.lineTo(p[0],p[1]);else x.moveTo(p[0],p[1]);});x.closePath();x.fillStyle=fill;x.fill();x.strokeStyle='#654d65';x.stroke();}function oval(px,py,rx,ry,fill){x.beginPath();x.ellipse(px,py,rx,ry,.03,0,Math.PI*2);x.fillStyle=fill;x.fill();x.strokeStyle='#654d65';x.stroke();}
      if(i===0){shape([[343,440],[215,295],[398,350]],'#ffb5ad');shape([[590,402],[714,245],[690,473]],'#ffb5ad');oval(510,480,175,146,'#ee6e80');oval(620,300,123,109,'#ef7786');shape([[555,220],[570,139],[613,202]],'#f5c24d');shape([[665,203],[721,151],[710,246]],'#f5c24d');shape([[367,501],[217,565],[398,565]],'#ef7786');oval(472,496,83,105,'#ffd8a8');oval(575,606,52,25,'#ef7786');oval(425,604,52,24,'#ef7786');oval(584,286,10,14,'#3e3546');oval(665,283,10,14,'#3e3546');x.beginPath();x.arc(626,312,32,.1,Math.PI-.1);x.stroke();shape([[761,326],[812,285],[806,339],[863,320],[822,378]],'#ff98c2');}
      if(i===1){shape([[288,427],[145,352],[189,478],[295,505]],'#fff');shape([[708,420],[846,338],[813,489],[703,512]],'#fff');shape([[307,350],[691,346],[699,609],[304,614]],'#ffd88a');shape([[260,354],[499,152],[743,355]],'#ed8795');shape([[445,614],[445,461],[551,458],[553,612]],'#af91cf');shape([[340,409],[406,407],[407,476],[341,477]],'#a7e1eb');shape([[585,406],[651,409],[650,477],[586,475]],'#a7e1eb');x.fillStyle='#f7d661';x.beginPath();x.arc(786,155,55,0,Math.PI*2);x.fill();x.fillStyle='#e9f5ff';x.beginPath();x.arc(812,135,51,0,Math.PI*2);x.fill();}
      if(i===2){shape([[374,287],[632,290],[601,624],[404,621]],'#fff');var cs=['#ef7e99','#f7b95d','#e5d574','#8acba7','#7abadd','#b699d5'];cs.forEach(function(cl,j){x.fillStyle=cl;x.fillRect(414+j*2,318+j*46,180-j*4,48);});shape([[414,621],[601,624],[630,291],[374,287]],'rgba(255,255,255,.13)');x.strokeStyle='#67b6b1';x.lineWidth=21;x.beginPath();x.moveTo(541,417);x.lineTo(594,190);x.lineTo(692,156);x.stroke();oval(367,291,69,69,'#ffbb70');x.strokeStyle='#fff';x.lineWidth=8;x.beginPath();x.moveTo(349,249);x.lineTo(385,328);x.moveTo(326,294);x.lineTo(411,287);x.stroke();}
      x.fillStyle='#9c8ba2';x.font='28px sans-serif';x.fillText('じぶんの せかいを かいてみよう',50,710);return c.toDataURL('image/png');}
    var sampleImages=null;
    function celebrateCard(row){
      var d=dialog('カードができた！'),stage=document.createElement('div');
      d.box.classList.add('studio-reveal-dialog');stage.className='studio-reveal-stage';
      var art=document.createElement('img');art.src=row.img;art.alt='';art.className='studio-reveal-art';
      var card=document.createElement('img');card.alt=row.payload.card.name;card.className='studio-reveal-card';
      stage.appendChild(art);stage.appendChild(card);d.box.appendChild(stage);
      d.box.appendChild(button('カードちょうへ',function(){d.close();openBook();}));
      drawCard(row,'No. '+String(row.payload.card.number).padStart(3,'0')).then(function(c){
        card.onload=function(){stage.classList.add('studio-reveal-playing');};
        card.src=c.toDataURL('image/png');
      }).catch(function(){art.alt=row.payload.card.name;});
    }
    var cardTrim;
    function drawCard(row,number){var m=row.payload.card,c=canvas(600,850),x=c.getContext('2d'),pal={berry:['#5e163f','#c95777'],sky:['#142747','#416caa'],rainbow:['#143f42','#378a80']},cs=pal[m.frame]||pal.berry,g=x.createLinearGradient(0,0,600,850);g.addColorStop(0,'#fbdf8c');g.addColorStop(.18,cs[1]);g.addColorStop(.48,cs[0]);g.addColorStop(.84,cs[1]);g.addColorStop(1,'#e6bc61');x.fillStyle=g;x.fillRect(0,0,600,850);
      x.save();x.globalAlpha=.18;
      for(var band=-850;band<600;band+=46){
        x.fillStyle=band%3===0?'#fff5ad':'#fff';
        x.beginPath();x.moveTo(band,850);x.lineTo(band+17,850);x.lineTo(band+867,0);x.lineTo(band+850,0);x.fill();
      }
      x.restore();
      var gold=x.createLinearGradient(0,0,580,850);
      gold.addColorStop(0,'#83501a');gold.addColorStop(.26,'#fff5ac');gold.addColorStop(.53,'#b97926');gold.addColorStop(.74,'#fff1a6');gold.addColorStop(1,'#96601e');
      x.strokeStyle=gold;x.lineWidth=12;x.strokeRect(7,7,586,836);
      [25,575].forEach(function(px){[25,825].forEach(function(py){x.save();x.translate(px,py);x.rotate(Math.PI/4);x.fillStyle=gold;x.fillRect(-10,-10,20,20);x.restore();});});
x.lineWidth=5;x.strokeStyle='#e7c974';x.strokeRect(13,13,574,824);x.strokeStyle='#fff0b1';x.lineWidth=2;x.strokeRect(25,25,550,800);x.fillStyle=cs[0];x.fillRect(34,35,532,84);x.fillStyle='#fff1c8';x.font='bold 30px sans-serif';var title=m.name;while(x.measureText(title).width>465&&title.length>1)title=title.slice(0,-1);x.fillText(title,49,82);x.font='16px sans-serif';x.fillText('ORIGINAL ART  /  '+(number||'MY COLLECTION'),49,108);for(var i=0;i<5;i++){x.fillStyle='#f6d673';x.beginPath();x.arc(450+i*22,137,7,0,Math.PI*2);x.fill();}return image(row.img).then(function(im){x.fillStyle=gold;x.fillRect(32,155,536,404);x.fillStyle='#fff';x.fillRect(39,162,522,390);var fit=Math.min(522/im.width,390/im.height),iw=im.width*fit,ih=im.height*fit;x.drawImage(im,300-iw/2,357-ih/2,iw,ih);x.fillStyle='#fbf1d4';x.fillRect(34,578,532,188);x.strokeStyle='#d5b45d';x.lineWidth=3;x.strokeRect(34,578,532,188);x.fillStyle='#4b3540';x.font='bold 19px sans-serif';x.fillText('✦  じぶんだけのものがたり',50,610);x.fillStyle='#a07937';x.fillRect(50,622,500,2);x.fillStyle='#4b3540';x.font='21px sans-serif';var text=m.description||'まだ ひみつの カード',line='',y=646;Array.from(text).forEach(function(ch){if(ch==='\n'||x.measureText(line+ch).width>495){if(y<=742)x.fillText(line,50,y);line=ch==='\n'?'':ch;y+=25;}else line+=ch;});if(line&&y<=742)x.fillText(line,50,y);x.fillStyle='#fff2bf';x.font='17px sans-serif';x.fillText('ASOBI  •  ARTIST COLLECTION',38,800);x.textAlign='right';x.fillText('✦ '+String(m.number||number||1),560,800);
      if(!cardTrim)cardTrim=image('studio-card-filigree.webp').catch(function(){return null;});
      return cardTrim.then(function(trim){
        if(trim){
          // Keep the generated foil at the perimeter so it cannot cover the art or text.
          x.save();x.beginPath();x.rect(0,0,600,850);x.rect(31,50,538,754);x.clip('evenodd');
          x.drawImage(trim,0,0,600,850);x.restore();
        }
        return c;
      });
    });}
    function openBook(){if(!sampleImages)sampleImages=examples.map(function(e){return sampleArt(e.sample);});var d=dialog('カードちょう'),tabs=document.createElement('nav'),grid=document.createElement('div'),msg=document.createElement('p');grid.className='studio-book';d.box.classList.add('studio-book-dialog');d.box.appendChild(tabs);d.box.appendChild(msg);d.box.appendChild(grid);var page=0,rows=[],sample=false,loading=0;
      var prev=button('◀ まえ',function(){page=Math.max(0,page-1);paint();}),next=button('つぎ ▶',function(){page++;paint();});
      function paint(){grid.classList.remove('page-turn');void grid.offsetWidth;grid.classList.add('page-turn');grid.innerHTML='';var data=sample?examples.map(function(m,i){return{id:'sample-'+i,img:sampleImages[i],at:0,payload:{card:m}};}):rows;page=Math.min(page,Math.max(0,Math.ceil(data.length/6)-1));msg.textContent=sample?'おてほん３枚 · 自分の枚数には入りません':data.length+'まい · '+(page+1)+'ページ';prev.disabled=page===0;next.disabled=(page+1)*6>=data.length;if(!data.length){var empty=document.createElement('p');empty.textContent='さいしょの１まいを つくろう！';grid.appendChild(empty);}data.slice(page*6,page*6+6).forEach(function(row,j){var m=row.payload.card,b=button('',function(){detail(row,sample,page*6+j+1);});b.className='studio-card frame-'+m.frame;var im=document.createElement('img');im.alt=m.name;drawCard(row,'No. '+String(m.number||page*6+j+1).padStart(3,'0')).then(function(c){im.src=c.toDataURL('image/png');}).catch(function(){im.src=row.img;});var n=document.createElement('strong');n.textContent=m.name;var tag=document.createElement('small');tag.textContent=(sample?'おてほん':'No. '+String(m.number||page*6+j+1).padStart(3,'0'))+' · タップでひらく';b.appendChild(im);b.setAttribute('aria-label',m.name+'・カードを開く');b.appendChild(tag);grid.appendChild(b);});for(var slot=data.slice(page*6,page*6+6).length;slot<6;slot++){var pocket=document.createElement('div');pocket.className='studio-empty-pocket';pocket.textContent='◇';pocket.setAttribute('aria-label','空のカードポケット');grid.appendChild(pocket);}}
      tabs.appendChild(button('じぶんのカード',function(){sample=false;page=0;paint();}));tabs.appendChild(button('おてほん３枚',function(){sample=true;page=0;paint();}));tabs.appendChild(button('＋ えをかく',d.close));d.box.appendChild(prev);d.box.appendChild(next);msg.textContent='よみこみちゅう…';var token=++loading;ARTSAVE.all().then(function(a){if(token!==loading)return;rows=a.filter(function(w){return w.payload&&w.payload.card;});paint();}).catch(function(){msg.textContent='カードを読み込めません。閉じてもう一度開いてください。';});
      function detail(row,isSample,number){var dd=dialog(isSample?'おてほん':row.payload.card.name),im=document.createElement('img'),text=document.createElement('p');im.alt=row.payload.card.name;drawCard(row,'No. '+String(row.payload.card.number||number).padStart(3,'0')).then(function(c){im.src=c.toDataURL('image/png');}).catch(function(){im.src=row.img;});im.className='studio-card-preview';text.textContent=row.payload.card.description;dd.box.classList.add('studio-card-detail');dd.box.appendChild(im);dd.box.appendChild(text);dd.box.appendChild(button('🔊 よんで',function(){if(window.speak)speak(row.payload.card.name+'。'+row.payload.card.description,'ja-JP',.9);}));if(isSample){dd.box.appendChild(button('じぶんのカードをつくる',function(){dd.close();d.close();note('すきなものを かいてみよう！');}));return;}
        dd.box.appendChild(button('画像で保存',function(){drawCard(row,'No. '+String(row.payload.card.number||number).padStart(3,'0')).then(function(c){c.toBlob(function(blob){ASOBI_BACKUP.download(blob,'カード-'+row.payload.card.name+'.png');},'image/png');}).catch(function(){text.textContent='画像を書き出せませんでした';});}));
        dd.box.appendChild(button('つづきをかく・名前を変える',function(){if(busy)return;busy=true;saveDraft().then(function(){return saveWork();}).then(function(){return unpack(Object.assign({},row.payload,{artId:row.id}));}).then(function(){history=[];future=[];editingCard=true;revision++;dd.close();d.close();changed();}).catch(function(e){text.textContent=e.message;}).finally(function(){busy=false;updateButtons();});}));
      }
    }
    side.appendChild(button('原画をPNGで保存',function(){commitSelection();composite().toBlob(function(b){ASOBI_BACKUP.download(b,'おえかき.png');},'image/png');}));
    side.appendChild(button('作品バックアップ',function(){note('作品をまとめています…');ASOBI_BACKUP.exportAll().then(function(ok){note(ok?'書き出しを開始しました。「ファイル」で確認してください':'書き出せませんでした。設定のメッセージを確認してください');});}));
    var input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';input.hidden=true;side.appendChild(input);side.appendChild(button('画像をレイヤーに追加',function(){if(layers.length>=6){note('レイヤーは６枚までです');return;}input.click();}));input.addEventListener('change',function(){var f=input.files[0];if(!f)return;if(f.size>12*1024*1024){note('画像は12MB以下にしてください');input.value='';return;}var url=URL.createObjectURL(f);image(url).then(function(im){commitSelection();remember();var l=layer('とりこみ');var s=Math.min(WIDTH/im.width,HEIGHT/im.height);l.canvas.getContext('2d').drawImage(im,(WIDTH-im.width*s)/2,(HEIGHT-im.height*s)/2,im.width*s,im.height*s);layers.push(l);active=layers.length-1;layerUI();changed();}).catch(function(){note('この画像は読み込めません');}).finally(function(){URL.revokeObjectURL(url);input.value='';});});
    layers=[layer('背景'),layer('色'),layer('線')];active=2;busy=true;draftIO().then(function(p){if(p)return unpack(p);}).then(function(){ready=true;busy=false;layerUI();render();updateButtons();queueCardGlow();note('✓ ２本指で拡大・回転 · カードもつくれるよ');}).catch(function(){ready=true;busy=false;layerUI();render();note('前の下書きを読み込めません。バックアップを確認してください');});
    document.addEventListener('visibilitychange',function(){if(document.hidden)saveDraft().catch(function(){});});window.addEventListener('pagehide',function(){saveDraft().catch(function(){});});
    return {suspend:function(){ready=false;busy=true;clearTimeout(saveTimer);note('復元しました。アプリを開き直してください');},resize:function(){render();queueCardGlow();},leave:function(){clearTimeout(cardGlowTimer);cardBtn.classList.remove('studio-card-ready');pointer=null;pointers={};gesture=null;saveDraft().catch(function(){});},saveDraft:saveDraft,validate:validate,pack:pack,openBook:openBook};
  };
})();
