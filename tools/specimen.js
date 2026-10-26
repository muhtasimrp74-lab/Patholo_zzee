
/* ===== specimen.js: a small procedural scene under the header of six chapters, driven by scrolling (fxgl.js scheduler).
   Tier 2+: canvas; tier 1: one static SVG of the same scene; tier 0: nothing. Built per chapter, only when opened.
   Each scene is a function of t (0..1) returning shapes in a 600x140 world, so canvas and SVG draw the same thing. */
(function(){try{
const TAU=Math.PI*2,cl=t=>Math.max(0,Math.min(1,t)),ss=(a,b,t)=>{t=cl((t-a)/(b-a));return t*t*(3-2*t)};
const C=(k,d)=>(getComputedStyle(document.documentElement).getPropertyValue(k)||'').trim()||d;
const rnd=s=>()=>{s=(s*16807)%2147483647;return s/2147483647};
const ci=(x,y,r,f,a=1)=>({k:'c',x,y,r,f,a}),ln=(x,y,x2,y2,s,lw=1.5,a=1)=>({k:'l',x,y,x2,y2,s,lw,a}),rc=(x,y,w,h,f,a=1)=>({k:'r',x,y,w,h,f,a});
const SC=[
 [/amyloid/i,'Amyloid: apple-green under polarised light',t=>{const o=[rc(0,0,600,140,'#101010')],R=rnd(5),g=.2+.8*Math.abs(Math.sin(t*TAU));
  for(let i=0;i<18;i++){let x=20+R()*560,y=10+R()*110,a=R()*TAU;for(let j=0;j<10;j++){const nx=x+Math.cos(a)*9,ny=y+Math.sin(a)*9;o.push(ln(x,y,nx,ny,'#9BE15D',2,g));x=nx;y=ny;a+=(R()-.5)*.6}}return o}],
 [/inflamm/i,'Neutrophils roll, stick and cross the vessel wall',t=>{const eo=C('--rosy','#D98FA8'),ink=C('--plum','#2A1627'),o=[rc(0,18,600,72,eo,.18),ln(0,90,600,90,ink,2),ln(0,18,600,18,ink,1,.5)];
  for(let i=0;i<5;i++){const x=70+i*110-260*(1-ss(0,.5,t)),y=54+26*ss(.3,.55,t)+36*ss(.62+i*.05,.9+i*.02,t);o.push(ci(x,y,13,'#f4f0f6',1),ci(x,y,13,ink,.15));for(let k=0;k<3;k++)o.push(ci(x-6+k*6,y+(k%2?3:-2),3.6,'#5b3a8f',.9))}return o}],
 [/hemodynamic|thrombo|haemodynamic/i,'Platelets build a thrombus at an injured wall',t=>{const eo=C('--rosy','#D98FA8'),ink=C('--plum','#2A1627'),o=[rc(0,20,600,90,eo,.16),ln(0,110,600,110,ink,2)],R=rnd(9);
  for(let j=0;j<34;j++){const sx=R()*600,sy=30+R()*70,a=j/34*.6,u=ss(a,a+.3,t),tx=290+(R()-.5)*90*(1-j/40),ty=104-Math.sqrt(j)*6;o.push(ci(sx+(tx-sx)*u,sy+(ty-sy)*u,4,'#c9a8d9',.95))}
  if(t>.6)for(let k=0;k<7;k++)o.push(ln(245+k*14,108,262+k*12,70,'#e0507a',1.2,ss(.6,.9,t)));return o}],
 [/neoplas|tumou?r/i,'Pleomorphic cells, mitoses and an invading front',t=>{const eo=C('--rosy','#D98FA8'),ink=C('--plum','#2A1627'),R=rnd(13),o=[];const gap=ss(.3,.9,t)*160;
  o.push(ln(0,100,300-gap/2,100,ink,2.5),ln(300+gap/2,100,600,100,ink,2.5));
  for(let i=0;i<22;i++){const x=20+(i%11)*54+R()*14,deep=i>=11,y=deep?100+ss(.35+R()*.3,1,t)*28:35+R()*40,r=8+R()*9;if(deep&&Math.abs(x-300)>gap/2+10)continue;
   o.push(ci(x,y,r,eo,.5),ci(x,y,r*(.45+R()*.25),ink,.85));if(i%7===3)o.push(ln(x-r*.6,y,x+r*.6,y,'#fff',2,ss(.1,.5,t)))}return o}],
 [/immun/i,'Antibodies find and bind their antigen',t=>{const ink=C('--plum','#2A1627'),eo=C('--rosy','#D98FA8'),o=[rc(0,112,600,28,eo,.35),ln(0,112,600,112,ink,2)];
  for(let i=0;i<6;i++){const ax=60+i*96;o.push(ci(ax,107,6,'#e0a03a',1));const y=14+ss(.15+i*.06,.6+i*.06,t)*70,x=ax+(1-ss(.15,.7,t))*(i%2?18:-18);
   o.push(ln(x,y+18,x,y+6,'#3b6fd0',3),ln(x,y+6,x-8,y-6,'#3b6fd0',3),ln(x,y+6,x+8,y-6,'#3b6fd0',3));if(y>80)o.push(ci(ax,107,10,'#e0a03a',.3*ss(.6,.9,t)))}return o}],
 [/genetic/i,'A chromosome ideogram, banding in',t=>{const ink=C('--plum','#2A1627'),o=[rc(40,48,520,44,'#f2eef3',1)],R=rnd(21),n=Math.round(t*26);let x=40;
  for(let i=0;i<26;i++){const w=8+R()*24;if(i<n&&i%2)o.push(rc(x,48,Math.min(w,560-x),44,ink,.85));x+=w;if(x>=560)break}
  o.push(rc(205,44,10,4,C('--bg','#fff'),1),rc(205,92,10,4,C('--bg','#fff'),1));return o}]];
function canvasDraw(g,W,H,sh){g.clearRect(0,0,W,H);g.save();g.scale(W/600,H/140);for(const s of sh){g.globalAlpha=s.a;
 if(s.k==='c'){g.fillStyle=s.f;g.beginPath();g.arc(s.x,s.y,s.r,0,TAU);g.fill()}else if(s.k==='r'){g.fillStyle=s.f;g.fillRect(s.x,s.y,s.w,s.h)}else{g.strokeStyle=s.s;g.lineWidth=s.lw;g.lineCap='round';g.beginPath();g.moveTo(s.x,s.y);g.lineTo(s.x2,s.y2);g.stroke()}}g.restore();g.globalAlpha=1}
const svg=sh=>'<svg viewBox="0 0 600 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'+sh.map(s=>s.k==='c'?`<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${s.r.toFixed(1)}" fill="${s.f}" opacity="${s.a}"/>`:s.k==='r'?`<rect x="${s.x.toFixed(1)}" y="${s.y}" width="${s.w.toFixed(1)}" height="${s.h}" fill="${s.f}" opacity="${s.a}"/>`:`<line x1="${s.x.toFixed(1)}" y1="${s.y.toFixed(1)}" x2="${s.x2.toFixed(1)}" y2="${s.y2.toFixed(1)}" stroke="${s.s}" stroke-width="${s.lw}" stroke-linecap="round" opacity="${s.a}"/>`).join('')+'</svg>';
function mount(){
 const v=document.querySelector('.view:not([hidden])'),tier=window.zzTier?zzTier():2;if(!v||tier<1||v.querySelector('.zz-spec')||!/^v-\d\d$/.test(v.id))return;
 const ttl=(v.dataset.title||'')+' '+((v.querySelector('h1,h2')||{}).textContent||''),sc=SC.find(s=>s[0].test(ttl));if(!sc)return;
 const hd=v.querySelector('.pb')||v.querySelector('h1,h2');if(!hd)return;
 const box=document.createElement('figure');box.className='zz-spec';box.setAttribute('aria-label',sc[1]);
 box.style.cssText='margin:10px 0 14px;height:120px;border-radius:16px;overflow:hidden;background:var(--panel);border:1px solid var(--line)';
 hd.after(box);
 if(tier<2||!(window.zzFxGl&&zzFxGl.sys)){box.innerHTML=svg(sc[2](.6));box.firstChild.style.cssText='width:100%;height:100%;display:block';return}
 const cv=document.createElement('canvas');cv.style.cssText='width:100%;height:100%;display:block';box.append(cv);
 const dpr=Math.min(2,devicePixelRatio||1);let last=-1;
 const sy={step(){if(!cv.isConnected||v.hidden){zzFxGl.sys.delete(sy);return false}const sc2=window.zzScroller?zzScroller():document.scrollingElement,t=cl(sc2.scrollTop/700);
  if(Math.abs(t-last)<.002&&cv.width)return true;last=t;const W=cv.clientWidth,H=cv.clientHeight;if(cv.width!==Math.round(W*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr)}
  canvasDraw(cv.getContext('2d'),cv.width,cv.height,sc[2](t));return true}};
 zzFxGl.sys.add(sy);zzFxGl.wake(1500);
}
addEventListener('hashchange',()=>setTimeout(mount,200));setTimeout(mount,600);
}catch(e){}})();
