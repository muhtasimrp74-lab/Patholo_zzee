
/* ===== pager.js: the six bottom-bar tabs as one side-by-side track (native scroll-snap, no JS transforms) =====
   route() and the hash stay the source of truth: after every route the six tab views sit in #zz-pager in bottom-bar order,
   the active one scrolls into place, the others stay [hidden] (shown by CSS), inert and aria-hidden. A swipe that settles on
   another pane sets location.hash. Non-tab routes hide the track and keep the old window scrolling. S.pref.pager=false: off.
   window.zzScroller() returns the element that scrolls the page you are on (active pane, or the document). */
(function(){try{
const de=document.documentElement,TABS=['home','questions','qa','mcqs','textbook','menu'],HREF=['#/','#/questions','#/qa','#/mcqs','#/textbook','#/menu'];
const st=()=>typeof S!=='undefined'?S:null,want=()=>{const s=st();return !(s&&s.pref&&s.pref.pager===false)};
const RM=matchMedia('(prefers-reduced-motion: reduce)'),quick=()=>RM.matches||!!(window.zzFx&&zzFx.level()==='off');
const bare=()=>!location.hash.replace(/^#\/?/,'').split('/')[1],V=i=>document.getElementById('v-'+TABS[i]),tabOf=v=>v?TABS.indexOf(v.id.slice(2)):-1;
let touching=false,T=null,act=-1,prog=false,end=0,pt=0,last={},pre=new Set(),first=true;
window.zzPre=window.zzPre||{};
window.zzScroller=()=>{if(T&&de.classList.contains('zz-pg')){const v=T.querySelector(':scope>.view:not([hidden])');if(v)return v}return document.scrollingElement||de};
function make(){
 if(T)return;T=document.createElement('div');T.id='zz-pager';
 const f=V(0)||document.querySelector('.view');f.parentNode.insertBefore(T,f);
 T.addEventListener('scroll',liveSoon,{passive:true});if('onscrollend' in T)T.addEventListener('scrollend',settle);
 ['pointerdown','touchstart','wheel'].forEach(e=>T.addEventListener(e,()=>{prog=false;touching=e!=='wheel';geo=null;window.zzSlideT=performance.now();see([act-1,act+1])},{passive:true}));
 ['pointerup','touchend','pointercancel'].forEach(e=>T.addEventListener(e,()=>{touching=false;setTimeout(rest,260)},{passive:true}));
}
function adopt(){for(let i=0;i<6;i++){const v=V(i);if(!v||v.parentNode===T)continue;let nx=null;for(let j=i+1;j<6;j++){const w=V(j);if(w&&w.parentNode===T){nx=w;break}}T.insertBefore(v,nx);v.classList.add('zz-pane')}}
/* footer.sf follows the page: inside the active pane while the pager is on, after the last view in body flow otherwise */
let FT=null;
function place(){
 const f=document.querySelector('footer.sf')||FT;if(!f)return;FT=f;
 const v=T&&de.classList.contains('zz-pg')?T.querySelector(':scope>.view:not([hidden])'):null;
 if(v){if(f.parentNode!==v)v.appendChild(f);return}
 if(f.parentNode===document.body)return;
 const vs=[...document.body.children].filter(e=>e===T||e.classList.contains('view')),l=vs[vs.length-1];
 if(l)l.after(f);else document.body.appendChild(f)
}
function teardown(){if(!T)return;de.classList.remove('zz-pg');place();[...T.children].forEach(v=>{v.classList.remove('zz-pane');v.removeAttribute('inert');v.removeAttribute('aria-hidden');T.parentNode.insertBefore(v,T)});T.remove();T=null;act=-1;de.classList.remove('zz-pg')}
const bar=()=>{const b=document.getElementById('bnav');if(!b)return;const cs=getComputedStyle(b);if(cs.display==='none'){if(!document.body.classList.contains('mx-live'))de.style.setProperty('--zz-pgb','0px');return}
 de.style.setProperty('--zz-pgb',Math.max(0,Math.round(innerHeight-b.getBoundingClientRect().top))+'px')};
function sync(){
 if(!want()){teardown();return}
 const v=document.querySelector('.view:not([hidden])'),i=bare()?tabOf(v):-1;   /* only a tab's own page; its sub-pages (reader, sessions, deep links) scroll the window as before */
 if(i<0){if(T)de.classList.remove('zz-pg');place();return}
 make();adopt();
 if(!de.classList.contains('zz-pg')){de.classList.add('zz-pg');if(scrollY)scrollTo({top:0,left:0,behavior:'instant'})}
 place();
 const P=[...T.children],k=P.indexOf(v);
 P.forEach(p=>{if(p===v){p.removeAttribute('inert');p.removeAttribute('aria-hidden')}else{p.setAttribute('inert','');p.setAttribute('aria-hidden','true')}});
 last[TABS[i]]=location.hash||'#/';
 const x=k*T.clientWidth;
 if(Math.abs(T.scrollLeft-x)>2){prog=true;geo=null;window.zzSlideT=performance.now();see([act,k]);T.scrollTo({left:x,behavior:quick()||act<0||Math.abs(k-act)>1?'instant':'smooth'})   /* only neighbours slide; farther tabs jump */}
 act=k;rest();
 if(first){first=false;const p=location.hash.replace(/^#\/?/,'').split('/'),t=document.getElementById(v.id==='v-home'&&p[0]!=='home'?p[0]:p[1]||'');if(t&&v.contains(t))t.scrollIntoView({behavior:'instant',block:'start'})}
 requestAnimationFrame(bar);
 (window.requestIdleCallback||setTimeout)(()=>{P.forEach(n=>{const id=n&&n.id.slice(2);if(!id||pre.has(id)||!zzPre[id])return;pre.add(id);try{zzPre[id]()}catch(e){}});ready()},{timeout:2500});
}
const see=l=>{if(T)[...T.children].forEach((p,i)=>p.classList.toggle('zz-see',de.classList.contains('zz-ready')||l.includes(i)))};
/* instant tabs (like a game that preloads): after the first route every tab is built (zzPre), its pictures are loaded and decoded,
   and every tab stays painted, so a swipe never reveals a tab mid-gesture; .zz-ready also lifts deferred rendering (perf.css) */
const ready=()=>{if(de.classList.contains('zz-ready')||!T)return;T.querySelectorAll('img').forEach(i=>{try{i.loading='eager';i.decode&&i.decode().catch(()=>{})}catch(e){}});de.classList.add('zz-ready');see([])};   /* only panes under the viewport show while moving */
const pillTo=k=>{const n=document.getElementById('bnav'),P=T?[...T.children]:[],a=anchor(P[k]),p=n&&n.querySelector('.fx-pill');if(!a||!p||getComputedStyle(n).display==='none')return;
 const nr=n.getBoundingClientRect(),r=a.getBoundingClientRect();p.style.transition='';p.style.width=r.width+'px';p.style.transform='translate('+Math.round(r.left-nr.left)+'px,'+Math.round(r.top-nr.top)+'px)'};   /* settle on the tab, unstretched */
const rest=()=>{if(T&&Math.abs(T.scrollLeft-act*T.clientWidth)<2){see([]);pillTo(act)}};
const anchor=v=>{const i=tabOf(v);return i<0?null:document.querySelector('#bnav a[href="'+HREF[i]+'"]')};
/* smooth swipes: tab geometry relative to the bar is measured once per gesture (and after a resize), so the per-frame update below
   reads no layout; scroll events are folded into one update per animation frame */
let geo=null,liveQ=0;
const measure=()=>{const n=document.getElementById('bnav');if(!n||!T||getComputedStyle(n).display==='none'){geo={on:false};return geo}
 const nr=n.getBoundingClientRect(),P=[...T.children];geo={on:true,n,p:n.querySelector('.fx-pill'),links:[...n.querySelectorAll('a')],a:P.map(v=>{const a=anchor(v);if(!a)return null;const r=a.getBoundingClientRect();return {el:a,x:r.left-nr.left,y:r.top-nr.top,w:r.width}})};return geo};
addEventListener('resize',()=>{geo=null},{passive:true});
const liveSoon=()=>{if(!liveQ)liveQ=requestAnimationFrame(()=>{liveQ=0;live()})};
/* the bottom-bar pill (fx.js) and highlight follow the finger */
function live(){
 if(!de.classList.contains('zz-pg'))return;
 const P=[...T.children],w=T.clientWidth||1,sl=T.scrollLeft,f=Math.max(0,Math.min(P.length-1,sl/w)),g=geo||measure();   /* reads first */
 see([Math.floor(f),Math.ceil(f)]);
 if(g.on){const i0=Math.floor(f),near=g.a[Math.round(f)];g.links.forEach(a=>a.classList.toggle('on',!!near&&a===near.el));
  const p=g.p,r0=g.a[i0],r1=g.a[Math.min(P.length-1,i0+1)];
  if(p&&r0&&r1){const u=f-i0;
   p.style.transition='none';p.style.width=(r0.w+(r1.w-r0.w)*u)+'px';const sq=Math.sin(Math.PI*u);   /* liquid: the pill stretches between tabs and settles on one */
   p.style.transform='translate('+Math.round(r0.x+(r1.x-r0.x)*u)+'px,'+Math.round(r0.y)+'px) scale('+(1+.22*sq).toFixed(3)+','+(1-.1*sq).toFixed(3)+')';
   g.n.classList.add('zz-drag');clearTimeout(pt);pt=setTimeout(()=>{p.style.transition='';g.n.classList.remove('zz-drag')},180)}}
 clearTimeout(end);end=setTimeout(settle,160);
 if(!touching&&Math.abs(T.scrollLeft-act*w)<2){prog=false;rest()}   /* landed on its pane: neighbours hide again at once */
}
function settle(){
 clearTimeout(end);if(!T||!de.classList.contains('zz-pg'))return;
 const P=[...T.children],k=Math.max(0,Math.min(P.length-1,Math.round(T.scrollLeft/(T.clientWidth||1))));
 if(k===act){prog=false;rest();return}if(prog)return;
 const i=tabOf(P[k]);if(i<0)return;
 act=k;if(window.zzFx)zzFx.haptic(6);
 location.hash=last[TABS[i]]||HREF[i];
}
window.zzPager={sync,foot:place,on:()=>!!T&&de.classList.contains('zz-pg'),
 keep:v=>!!T&&want()&&bare()&&tabOf(v)>=0,
 tabs:h=>{if(!T||!de.classList.contains('zz-pg'))return false;const q=(h||'').replace(/^#\/?/,'').split('/'),k=q[0];if(q[1])return false;return ['','home','questions','qa','topics','mcqs','textbook','menu'].includes(k)}};
addEventListener('hashchange',sync);
addEventListener('resize',()=>{if(T&&de.classList.contains('zz-pg')&&act>=0){T.scrollTo({left:act*T.clientWidth,behavior:'instant'});bar()}});
sync();
}catch(e){}})();
