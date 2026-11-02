'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),$=s=>document.querySelector(s);
let W=900,H=600,photo=null,customBg=null,bg='street',paused=false,charging=false,chargeStart=0,last=0,shots=0,hits=0;
const target={x:250,y:140,w:180,h:180,vx:115,vy:85},aim={x:450,y:200},balls=[],marks=[];
const images={};
const sceneNames={street:'Улица',stage:'Сцена',basement:'Подвал',custom:'Свой фон'};
let assetError='';
function updateBackgroundUI(){
  document.querySelectorAll('[data-bg]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.bg===bg)));
  $('#custom-background').dataset.active=String(bg==='custom');
  $('#scene-name').textContent=sceneNames[bg];
}
for(const name of ['street','stage','basement','tomato','slingshot']){
  const im=new Image();images[name]=im;
  im.onerror=()=>{assetError='Не удалось загрузить картинки игры. Обновите страницу.';$('#message').textContent=assetError};
  im.src='assets/'+name+(['tomato','slingshot'].includes(name)?'.png':'.jpg');
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function resize(){const r=canvas.getBoundingClientRect();W=r.width;H=r.height;canvas.width=Math.round(W*devicePixelRatio);canvas.height=Math.round(H*devicePixelRatio);ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);fit();target.x=clamp(target.x,0,W-target.w);target.y=clamp(target.y,0,H-target.h-100)}
function fit(){const ratio=photo?photo.width/photo.height:1;target.w=Math.min(190,W*.28);target.h=target.w/ratio;if(target.h>H*.4){target.h=H*.4;target.w=target.h*ratio}}
new ResizeObserver(resize).observe(canvas);
function origin(){return{x:W*.5,y:H-125}}
function loadFile(input,done){const file=input.files[0];if(!file)return;const url=URL.createObjectURL(file),im=new Image();im.onload=()=>{done(im);URL.revokeObjectURL(url);$('#message').textContent=assetError;input.value=''};im.onerror=()=>{URL.revokeObjectURL(url);$('#message').textContent='Не удалось открыть изображение. Попробуйте PNG или JPG.';input.value=''};im.src=url}
$('#photo').onchange=e=>loadFile(e.target,im=>{photo=im;marks.length=0;fit();target.x=clamp(target.x,0,Math.max(0,W-target.w));target.y=clamp(target.y,0,Math.max(0,H-target.h-110))});
$('#background').onchange=e=>loadFile(e.target,im=>{customBg=im;bg='custom';updateBackgroundUI()});
document.querySelectorAll('[data-bg]').forEach(b=>b.onclick=()=>{bg=b.dataset.bg;updateBackgroundUI()});
$('#clear').onclick=()=>{marks.length=0};
$('#pause').onclick=()=>{paused=!paused;charging=false;$('#pause').textContent=paused?'Продолжить':'Пауза';$('#pause').setAttribute('aria-pressed',String(paused))};
function point(e){const r=canvas.getBoundingClientRect();aim.x=e.clientX-r.left;aim.y=e.clientY-r.top}
canvas.onpointermove=point;
canvas.onpointerdown=e=>{if(e.button!==0||paused)return;if(!photo){$('#message').textContent='Сначала загрузите фотографию.';return}point(e);charging=true;chargeStart=performance.now();canvas.setPointerCapture(e.pointerId)};
canvas.onpointerup=e=>{if(!charging)return;point(e);charging=false;const p=clamp((performance.now()-chargeStart)/1500,0,1),o=origin(),dx=aim.x-o.x,dy=aim.y-o.y,d=Math.hypot(dx,dy)||1,speed=300+650*p,duration=Math.max(.12,d/speed);balls.push({x:o.x,y:o.y,startX:o.x,startY:o.y,endX:aim.x,endY:aim.y,duration,life:0});shots++;updateScore()};
canvas.onpointercancel=()=>{charging=false};window.addEventListener('blur',()=>{charging=false});
function updateScore(){$('#score').textContent=`Попадания: ${hits} · Выстрелы: ${shots}`}
function impactAt(x,y,tx,ty,w,h){return x>=tx&&x<=tx+w&&y>=ty&&y<=ty+h}
function splat(x,y){const drops=Array.from({length:16},()=>{const a=Math.random()*Math.PI*2,r=8+Math.random()*28;return{x:Math.cos(a)*r,y:Math.sin(a)*r,r:2+Math.random()*6}});marks.push({u:x/target.w,v:y/target.h,drops});if(marks.length>250)marks.shift()}
function background(){
  const image=bg==='custom'?customBg:images[bg];
  ctx.fillStyle='#29241f';ctx.fillRect(0,0,W,H);
  if(image&&image.complete&&image.naturalWidth){
    const scale=Math.max(W/image.width,H/image.height);
    ctx.drawImage(image,(W-image.width*scale)/2,(H-image.height*scale)/2,image.width*scale,image.height*scale);
  }
}
function drawTarget(){ctx.save();ctx.translate(target.x,target.y);ctx.shadowColor='#0006';ctx.shadowBlur=20;ctx.fillStyle='#c6c6bd';ctx.fillRect(-4,-4,target.w+8,target.h+8);ctx.shadowBlur=0;ctx.beginPath();ctx.rect(0,0,target.w,target.h);ctx.clip();if(photo)ctx.drawImage(photo,0,0,target.w,target.h);else{ctx.fillStyle='#e8e8db';ctx.fillRect(0,0,target.w,target.h);ctx.fillStyle='#574f42';ctx.textAlign='center';ctx.font='bold 14px Courier New';ctx.fillText('Загрузите фото',target.w/2,target.h/2)}for(const m of marks){ctx.save();ctx.translate(m.u*target.w,m.v*target.h);ctx.fillStyle='rgba(188,28,19,.85)';ctx.beginPath();ctx.ellipse(0,0,17,14,.4,0,Math.PI*2);ctx.fill();for(const d of m.drops){ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#ff9a4b';ctx.fillRect(-5,-4,4,2);ctx.restore()}ctx.restore()}
function tomato(x,y,size=32){
  const image=images.tomato;
  if(image.complete&&image.naturalWidth)ctx.drawImage(image,x-size/2,y-size/2,size,size);
}
function slingshot(o,p){
  const image=images.slingshot;
  if(image.complete&&image.naturalWidth)ctx.drawImage(image,o.x-63,o.y-44,126,180);
  ctx.lineWidth=5;ctx.strokeStyle='#442918';ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(o.x-31,o.y-25);ctx.lineTo(o.x,o.y+35*p);ctx.lineTo(o.x+31,o.y-25);ctx.stroke();
  tomato(o.x,o.y+35*p,40);
}
function frame(now){const dt=Math.min((now-last)/1000||0,.035);last=now;const ox=target.x,oy=target.y;if(!paused){target.x+=target.vx*dt;target.y+=target.vy*dt;const maxX=Math.max(0,W-target.w),maxY=Math.max(0,H-target.h-110);if(target.x<0||target.x>maxX){target.x=clamp(target.x,0,maxX);target.vx*=-1}if(target.y<0||target.y>maxY){target.y=clamp(target.y,0,maxY);target.vy*=-1}for(let i=balls.length-1;i>=0;i--){const b=balls[i],previous=b.life;b.life+=dt;const t=clamp(b.life/b.duration,0,1);b.x=b.startX+(b.endX-b.startX)*t;b.y=b.startY+(b.endY-b.startY)*t-115*b.duration*b.duration*t*(1-t);if(b.life>=b.duration){const fraction=dt?clamp((b.duration-previous)/dt,0,1):1,tx=ox+(target.x-ox)*fraction,ty=oy+(target.y-oy)*fraction;if(photo&&impactAt(b.endX,b.endY,tx,ty,target.w,target.h)){splat(b.endX-tx,b.endY-ty);hits++;updateScore()}balls.splice(i,1)}}}background();drawTarget();const o=origin(),p=charging?clamp((now-chargeStart)/1500,0,1):0;slingshot(o,p);for(const b of balls)tomato(b.x,b.y);ctx.strokeStyle='#ffffffa0';ctx.lineWidth=1;ctx.beginPath();ctx.arc(aim.x,aim.y,12,0,Math.PI*2);ctx.moveTo(aim.x-18,aim.y);ctx.lineTo(aim.x+18,aim.y);ctx.moveTo(aim.x,aim.y-18);ctx.lineTo(aim.x,aim.y+18);ctx.stroke();$('.meter').setAttribute('aria-valuenow',String(Math.round(p*100)));$('#charge').style.width=`${p*100}%`;$('#power').textContent=charging?`Заряд: ${Math.round(p*100)}%`:'Удерживай для заряда';requestAnimationFrame(frame)}
requestAnimationFrame(frame);
