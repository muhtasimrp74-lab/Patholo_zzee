
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
let T=null,act=-1,prog=false,end=0,pt=0,last={},pre=new Set(),first=true;
window.zzPre=window.zzPre||{};
window.zzScroller=()=>{if(T&&de.classList.contains('zz-pg')){const v=T.querySelector(':scope>.view:not([hidden])');if(v)return v}return document.scrollingElement||de};
function make(){
 if(T)return;T=document.createElement('div');T.id='zz-pager';
 const f=V(0)||document.querySelector('.view');f.parentNode.insertBefore(T,f);
 T.addEventListener('scroll',live,{passive:true});if('onscrollend' in T)T.addEventListener('scrollend',settle);
 ['pointerdown','touchstart','wheel'].forEach(e=>T.addEventListener(e,()=>{prog=false},{passive:true}));
}
function adopt(){for(let i=0;i<6;i++){const v=V(i);if(!v||v.parentNode===T)continue;let nx=null;for(let j=i+1;j<6;j++){const w=V(j);if(w&&w.parentNode===T){nx=w;break}}T.insertBefore(v,nx);v.classList.add('zz-pane')}}
function teardown(){if(!T)return;[...T.children].forEach(v=>{v.classList.remove('zz-pane');v.removeAttribute('inert');v.removeAttribute('aria-hidden');T.parentNode.insertBefore(v,T)});T.remove();T=null;act=-1;de.classList.remove('zz-pg')}
const bar=()=>{const b=document.getElementById('bnav');if(!b)return;const cs=getComputedStyle(b);if(cs.display==='none'){if(!document.body.classList.contains('mx-live'))de.style.setProperty('--zz-pgb','0px');return}
 de.style.setProperty('--zz-pgb',Math.max(0,Math.round(innerHeight-b.getBoundingClientRect().top))+'px')};
function sync(){
 if(!want()){teardown();return}
 const v=document.querySelector('.view:not([hidden])'),i=bare()?tabOf(v):-1;   /* only a tab's own page; its sub-pages (reader, sessions, deep links) scroll the window as before */
 if(i<0){if(T)de.classList.remove('zz-pg');return}
 make();adopt();
 if(!de.classList.contains('zz-pg')){de.classList.add('zz-pg');if(scrollY)scrollTo({top:0,left:0,behavior:'instant'})}
 const P=[...T.children],k=P.indexOf(v);
 P.forEach(p=>{if(p===v){p.removeAttribute('inert');p.removeAttribute('aria-hidden')}else{p.setAttribute('inert','');p.setAttribute('aria-hidden','true')}});
 last[TABS[i]]=location.hash||'#/';
 const x=k*T.clientWidth;
 if(Math.abs(T.scrollLeft-x)>2){prog=true;T.scrollTo({left:x,behavior:quick()||act<0?'instant':'smooth'})}
 act=k;
 if(first){first=false;const p=location.hash.replace(/^#\/?/,'').split('/'),t=document.getElementById(v.id==='v-home'&&p[0]!=='home'?p[0]:p[1]||'');if(t&&v.contains(t))t.scrollIntoView({behavior:'instant',block:'start'})}
 requestAnimationFrame(bar);
 (window.requestIdleCallback||setTimeout)(()=>[P[k-1],P[k+1]].forEach(n=>{const id=n&&n.id.slice(2);if(!id||pre.has(id)||!zzPre[id])return;pre.add(id);try{zzPre[id]()}catch(e){}}),{timeout:2500});
}
const anchor=v=>{const i=tabOf(v);return i<0?null:document.querySelector('#bnav a[href="'+HREF[i]+'"]')};
/* the bottom-bar pill (fx.js) and highlight follow the finger */
function live(){
 if(!de.classList.contains('zz-pg'))return;
 const n=document.getElementById('bnav'),P=[...T.children],w=T.clientWidth||1,f=Math.max(0,Math.min(P.length-1,T.scrollLeft/w));
 if(n&&n.offsetParent){const near=anchor(P[Math.round(f)]);n.querySelectorAll('a').forEach(a=>a.classList.toggle('on',a===near));
  const p=n.querySelector('.fx-pill'),i0=Math.floor(f),a0=anchor(P[i0]),a1=anchor(P[Math.min(P.length-1,i0+1)]);
  if(p&&a0&&a1){const u=f-i0,nr=n.getBoundingClientRect(),r0=a0.getBoundingClientRect(),r1=a1.getBoundingClientRect();
   p.style.transition='none';p.style.width=(r0.width+(r1.width-r0.width)*u)+'px';p.style.transform='translate('+Math.round(r0.left+(r1.left-r0.left)*u-nr.left)+'px,'+Math.round(r0.top-nr.top)+'px)';
   clearTimeout(pt);pt=setTimeout(()=>{p.style.transition=''},180)}}
 clearTimeout(end);end=setTimeout(settle,160);
}
function settle(){
 clearTimeout(end);if(!T||!de.classList.contains('zz-pg'))return;
 const P=[...T.children],k=Math.max(0,Math.min(P.length-1,Math.round(T.scrollLeft/(T.clientWidth||1))));
 if(k===act){prog=false;return}if(prog)return;
 const i=tabOf(P[k]);if(i<0)return;
 act=k;if(window.zzFx)zzFx.haptic(6);
 location.hash=last[TABS[i]]||HREF[i];
}
window.zzPager={sync,on:()=>!!T&&de.classList.contains('zz-pg'),
 keep:v=>!!T&&want()&&bare()&&tabOf(v)>=0,
 tabs:h=>{if(!T||!de.classList.contains('zz-pg'))return false;const q=(h||'').replace(/^#\/?/,'').split('/'),k=q[0];if(q[1])return false;return ['','home','questions','qa','topics','mcqs','textbook','menu'].includes(k)}};
addEventListener('hashchange',sync);
addEventListener('resize',()=>{if(T&&de.classList.contains('zz-pg')&&act>=0){T.scrollTo({left:act*T.clientWidth,behavior:'instant'});bar()}});
sync();
}catch(e){}})();
