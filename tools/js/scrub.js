
/* ===== scrub.js: one scrubber component. A slider drives a procedural 2D morph; each topic is a config.
   Shipped: cell injury (reversible to irreversible), necrosis patterns, hypertrophy vs hyperplasia.
   Opened from a "Scrub through it" button after matching answers. Draws only when the slider moves. */
(function(){try{
const TAU=Math.PI*2,lerp=(a,b,t)=>a+(b-a)*t,cl=t=>Math.max(0,Math.min(1,t)),ss=(a,b,t)=>{t=cl((t-a)/(b-a));return t*t*(3-2*t)};
const col=(k,d)=>(getComputedStyle(document.documentElement).getPropertyValue(k)||'').trim()||d;
function rnd(s){return()=>{s=(s*16807)%2147483647;return s/2147483647}}
const CFG={
 injury:{t:'Cell injury: reversible to irreversible',m:/cell injury|reversible|irreversible|hydropic|cloudy swelling/i,
  st:[[0,'Normal cell'],[.18,'Swelling: pumps fail, water enters'],[.38,'Blebs, dilated ER, fatty change (still reversible)'],[.55,'Point of no return: membranes and mitochondria fail'],[.75,'Pyknosis, then karyorrhexis'],[.92,'Karyolysis and rupture']],
  draw(g,W,H,t){const R=rnd(7),cx=W/2,cy=H/2,r0=Math.min(W,H)*.28,sw=1+.22*ss(.05,.45,t),r=r0*sw,brk=ss(.55,.95,t);
   g.fillStyle=col('--rosy','#D98FA8');g.globalAlpha=.25+.1*(1-brk);g.beginPath();
   for(let a=0;a<=TAU+.01;a+=TAU/90){const bl=ss(.25,.45,t)*Math.max(0,Math.sin(a*7+1))*r*.12,x=cx+Math.cos(a)*(r+bl),y=cy+Math.sin(a)*(r*.82+bl);a?g.lineTo(x,y):g.moveTo(x,y)}g.closePath();g.fill();
   g.globalAlpha=1;g.strokeStyle=col('--plum2','#6B2D5C');g.lineWidth=2;
   for(let a=0;a<TAU;a+=TAU/45){if(brk>0&&R()<brk*.55)continue;const bl=ss(.25,.45,t)*Math.max(0,Math.sin(a*7+1))*r*.12;g.beginPath();g.arc(cx,cy,r+bl,a,a+TAU/45);g.stroke()}
   for(let i=0;i<9;i++){const a=R()*TAU,d=r*(.45+.35*R()),x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d*.8;g.fillStyle=col('--burgundy','#7A1F36');g.globalAlpha=.6;
    g.beginPath();g.ellipse(x,y,r*.09*(1+.5*ss(.1,.4,t)),r*.045*(1+.6*ss(.1,.4,t)),a,0,TAU);g.fill();if(t>.6){g.globalAlpha=.9;g.beginPath();g.arc(x,y,r*.018,0,TAU);g.fill()}}
   g.globalAlpha=ss(.3,.5,t)*.8*(1-brk*.6);g.fillStyle='#fff';for(let i=0;i<6;i++){const a=R()*TAU,d=r*.5*R();g.beginPath();g.arc(cx+Math.cos(a)*d,cy+Math.sin(a)*d*.8,r*(.04+.05*R()),0,TAU);g.fill()}
   const pk=ss(.6,.78,t),rx=ss(.76,.9,t),ly=ss(.9,1,t),nr=r*.24*(1-.45*pk);g.fillStyle=col('--plum','#2A1627');
   if(rx<.05){g.globalAlpha=.75+.25*pk;g.beginPath();g.arc(cx,cy,nr,0,TAU);g.fill()}
   else for(let i=0;i<7;i++){const a=i/7*TAU+.4,d=nr*1.6*rx;g.globalAlpha=(1-ly)*.9;g.beginPath();g.arc(cx+Math.cos(a)*d,cy+Math.sin(a)*d,nr*.32,0,TAU);g.fill()}g.globalAlpha=1}},
 necrosis:{t:'Patterns of necrosis',m:/necrosis|gangrene|caseous|liquefactive|coagulative|fibrinoid|fat necrosis/i,
  st:[[0,'Coagulative: ghost outlines stay (infarcts of heart, kidney)'],[.2,'Liquefactive: tissue digested to fluid (brain, abscess)'],[.4,'Caseous: cheesy debris in a granuloma (TB)'],[.6,'Fat necrosis: chalky soaps (pancreatitis)'],[.8,'Fibrinoid: pink fibrin in vessel walls (vasculitis)']],
  draw(g,W,H,t){const R=rnd(11),P=[...Array(5)].map((_,i)=>cl(1-Math.abs(t*4-i))),cs=Math.min(W,H)/7,ink=col('--plum','#2A1627'),eo=col('--rosy','#D98FA8');
   for(let j=0;j<6;j++)for(let i=0;i<8;i++){const x=W/2+(i-3.5)*cs,y=H/2+(j-2.5)*cs*.9,dc=Math.hypot(i-3.5,j-2.5)/4.3,r1=R(),r2=R();
    g.globalAlpha=1;g.fillStyle=eo;
    const a=P[0]*.55+P[1]*.12*(dc>.6)+P[2]*(dc<.55?.5:.35)+P[3]*.35+P[4]*.3;g.globalAlpha=a;g.beginPath();g.ellipse(x,y,cs*.44,cs*.36,0,0,TAU);g.fill();
    g.globalAlpha=P[0]*.7+P[2]*(dc>.55)*.6+P[3]*.4+P[4]*.5;g.strokeStyle=ink;g.lineWidth=1;g.beginPath();g.ellipse(x,y,cs*.44,cs*.36,0,0,TAU);g.stroke();
    g.globalAlpha=(P[2]*(dc>.6)+P[4]*.8)*.85+P[1]*(dc>.7)*.8;g.fillStyle=ink;g.beginPath();g.arc(x,y,cs*.12,0,TAU);g.fill();
    if(P[1]>.05&&dc<.7&&r1<.5){g.globalAlpha=P[1];g.fillStyle=ink;for(let k=0;k<3;k++){g.beginPath();g.arc(x+(r2-.5)*cs*.6+k*4,y+(r1-.5)*cs*.4,cs*.06,0,TAU);g.fill()}}
    if(P[3]>.05&&r1<.45){g.globalAlpha=P[3]*.9;g.fillStyle='#fff';g.beginPath();g.arc(x,y,cs*.3,0,TAU);g.fill();g.globalAlpha=P[3]*.6;g.fillStyle='#8fb8d8';g.beginPath();g.arc(x+cs*.1,y-cs*.08,cs*.12,0,TAU);g.fill()}}
   if(P[2]>.05){g.globalAlpha=P[2]*.85;g.fillStyle='#f3e6ee';g.beginPath();g.ellipse(W/2,H/2,cs*2.1,cs*1.6,0,0,TAU);g.fill()}
   if(P[4]>.05){g.globalAlpha=P[4];g.strokeStyle='#e0507a';g.lineWidth=cs*.35;g.beginPath();g.arc(W/2,H/2,cs*1.4,0,TAU);g.stroke()}g.globalAlpha=1}},
 growth:{t:'Hypertrophy (bigger cells) vs hyperplasia (more cells)',m:/hypertrophy|hyperplasia|adaptation/i,
  st:[[0,'Normal tissue'],[.35,'More workload or hormone signal'],[.7,'Left: same cells, larger. Right: more cells, same size']],
  draw(g,W,H,t){const half=W/2,ink=col('--plum','#2A1627'),eo=col('--rosy','#D98FA8');g.strokeStyle=col('--line2','#ccc');g.beginPath();g.moveTo(half,10);g.lineTo(half,H-10);g.stroke();
   g.fillStyle=ink;g.font='600 12px '+col('--body','sans-serif');g.textAlign='center';g.fillText('Hypertrophy',half/2,20);g.fillText('Hyperplasia',half*1.5,20);
   const cell=(x,y,s)=>{g.globalAlpha=.45;g.fillStyle=eo;g.beginPath();g.ellipse(x,y,s,s*.8,0,0,TAU);g.fill();g.globalAlpha=1;g.strokeStyle=ink;g.stroke();g.fillStyle=ink;g.beginPath();g.arc(x,y,s*.28,0,TAU);g.fill()};
   const s0=Math.min(half,H)/10,sh=s0*(1+.7*t);for(let j=0;j<3;j++)for(let i=0;i<3;i++)cell(half/2+(i-1)*sh*2.1,H/2+10+(j-1)*sh*1.75,sh);
   const n=3+Math.round(2*t),R=rnd(3);for(let j=0;j<n;j++)for(let i=0;i<n;i++){const sp=Math.min(half,H-40)/(n+.5);cell(half*1.5+(i-(n-1)/2)*sp,H/2+10+(j-(n-1)/2)*sp*.88,s0*(.96+.08*R()))}
   g.textAlign='left'}}};
let css=false,ov=null;
function open(id){const C=CFG[id];if(!C)return;close();
 if(!css){css=true;const s=document.createElement('style');s.textContent=`.sc-go{display:inline-flex;margin:10px 0 0 8px;padding:7px 13px;border-radius:99px;border:1px solid var(--line2);background:var(--panel);color:var(--lbl);font:600 .82rem var(--body);cursor:pointer}
 .sc-ov{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 12px) 14px calc(env(safe-area-inset-bottom,0px) + 14px);background:var(--bg);color:var(--text)}
 .sc-h{display:flex;align-items:center;gap:10px}.sc-h b{flex:1;font:400 1.15rem/1.2 var(--disp)}.sc-h button{min-height:38px;padding:0 12px;border-radius:11px;border:1px solid var(--line2);background:var(--panel);color:var(--text);font:600 .82rem var(--body)}
 .sc-ov canvas{flex:1;min-height:0;width:100%;border-radius:18px;background:var(--panel)}.sc-ov input{width:100%;touch-action:none}.sc-s{min-height:2.6em;margin:0;font:600 .95rem/1.35 var(--body);color:var(--lbl)}`;document.head.append(s)}
 ov=document.createElement('div');ov.className='sc-ov';ov.dataset.noSwipe='';ov.setAttribute('role','dialog');ov.setAttribute('aria-label',C.t);
 ov.innerHTML='<div class="sc-h"><b></b><button type="button">Close</button></div><canvas></canvas><p class="sc-s" aria-live="polite"></p><input type="range" min="0" max="1000" value="0" aria-label="Stage">';
 ov.querySelector('b').textContent=C.t;document.body.append(ov);
 const cv=ov.querySelector('canvas'),sl=ov.querySelector('input'),sp=ov.querySelector('.sc-s'),dpr=Math.min(2,devicePixelRatio||1);let raf=0;
 const draw=()=>{raf=0;const W=cv.clientWidth,H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;const g=cv.getContext('2d');g.scale(dpr,dpr);const t=sl.value/1000;C.draw(g,W,H,t);
  let lab=C.st[0][1];C.st.forEach(s=>{if(t>=s[0])lab=s[1]});if(sp.textContent!==lab)sp.textContent=lab};
 sl.addEventListener('input',()=>{if(!raf)raf=requestAnimationFrame(draw)});addEventListener('resize',()=>{if(ov&&!raf)raf=requestAnimationFrame(draw)});
 ov.querySelector('button').onclick=close;ov.addEventListener('keydown',e=>{if(e.key==='Escape')close()});draw();sl.focus()}
function close(){if(ov){ov.remove();ov=null}}
function mark(){document.querySelectorAll('article.card').forEach(c=>{if(c.dataset.sc)return;const h=c.querySelector('header'),a=c.querySelector('.ans');if(!h||!a)return;c.dataset.sc='1';
 for(const id in CFG)if(CFG[id].m.test(h.textContent)){const b=document.createElement('button');b.type='button';b.className='sc-go';b.dataset.sc=id;b.textContent='Scrub through it';
  b.style.cssText='display:inline-flex;margin:10px 0 0 8px;padding:7px 13px;border-radius:99px;border:1px solid var(--line2);background:var(--panel);color:var(--lbl);font:600 .82rem var(--body);cursor:pointer';
  const pw=c.querySelector('.pw-go');(pw||a).after(b);break}})}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.sc-go');if(b){e.preventDefault();open(b.dataset.sc)}});
addEventListener('hashchange',()=>{close();setTimeout(mark,500)});(window.requestIdleCallback||setTimeout)(mark,{timeout:5500});
window.zzScrub={open,cfg:CFG};
}catch(e){}})();
