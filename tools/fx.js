
/* ===== fx.js: the "specimen bench" motion we can ship with the platform alone (no libraries, nothing downloaded) =====
   Five verbs from the motion brief: stain, focus, slide, pulse, ink. Shipped here:
   - effect levels (Menu > Display > Visual effects): Full (default), Minimal (cross-fades only), Off; reduced motion forces Minimal
   - focus-pull route transitions (View Transitions API), direction from the bottom-bar order
   - the theme switch as a lamp: a circle of the new theme opening from the button
   - a pill that slides between bottom-bar tabs, with a haptic tick
   - banner pictures develop (grey to stained, soft to sharp) the first time they are seen this session
   - a reading-progress hairline on long reading pages (CSS scroll-driven animation)
   - haptics (Menu switch, where navigator.vibrate exists): learned, correct, wrong, tab change
   Styles in fx.css. Reading text never moves: every effect sits in transitions, backgrounds or chrome. */
(function(){try{
const de=document.documentElement,$=(s,r)=>(r||document).querySelector(s),st=()=>typeof S!=='undefined'?S:null;
const RM=matchMedia('(prefers-reduced-motion: reduce)');
/* tier ladder: 0 static (Off), 1 CSS (Minimal), 2 canvas, 3 WebGL (Full). "Auto" (default) picks from the device; a manual choice wins */
function autoTier(){const n=navigator,c=n.connection;if(c&&c.saveData)return 1;const m=n.deviceMemory,k=n.hardwareConcurrency||4;
 if((m&&m<=2)||k<=2)return 1;if((m&&m<=4)||k<=4)return 2;return 3}
function tier(){const s=st(),v=(s&&s.pref&&s.pref.fx)||'auto';if(v==='off')return 0;if(RM.matches||de.classList.contains('zz-still'))return 1;
 return v==='min'?1:v==='full'?3:autoTier()}
window.zzTier=tier;
function level(){const t=tier();return t===0?'off':t===1?'min':'full'}
function apply(){const l=level();['full','min','off'].forEach(x=>de.classList.toggle('fx-'+x,l===x));pill()}
const haptic=p=>{const s=st();if((s&&s.pref&&s.pref.hap===false)||level()==='off')return;try{if(navigator.vibrate)navigator.vibrate(p)}catch(e){}try{if(window.zzSound)zzSound(p)}catch(e){}};   /* sound.js: synthesised, only once the switch is turned on */
window.zzFx={level,apply,haptic};
const busy=()=>document.body.classList.contains('an-on')||document.hidden;   /* never during annotation or in the background */

/* --- route transitions: the old page softens out of focus, the new one resolves (focus verb) --- */
const MENU=['practice','bookmarks','favourites','notes','howto','search','menu','account'];
const tab=h=>{const k=(h||'').replace(/^#\/?/,'').split('/')[0];return k===''||k==='home'?0:k==='questions'?1:k==='mcqs'?3:k==='textbook'?4:MENU.includes(k)?5:2};
window.zzGo=function(href){
 if(!href||href===location.hash)return;
 if(!document.startViewTransition||level()==='off'||busy()||(window.zzPager&&zzPager.tabs(href)&&zzPager.tabs(location.hash))){location.hash=href;return}   /* tab to tab in the pager: the track slides instead */
 const d=tab(href)-tab(location.hash);de.dataset.fxDir=d>0?'fwd':d<0?'back':'same';de.classList.add('fx-vt');
 let t;try{t=document.startViewTransition(()=>new Promise(res=>{let ok=false;const done=()=>{if(ok)return;ok=true;removeEventListener('hashchange',done);setTimeout(res,0)};   /* not requestAnimationFrame: rendering is paused until this resolves */
  addEventListener('hashchange',done);location.hash=href;setTimeout(done,600)}))}catch(e){de.classList.remove('fx-vt');location.hash=href;return}
 t.finished.finally(()=>de.classList.remove('fx-vt'));
};
document.addEventListener('click',e=>{
 if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
 const a=e.target.closest&&e.target.closest('a[href^="#/"]');if(!a||a.target||a.hasAttribute('download'))return;
 const h=a.getAttribute('href');if(h===location.hash)return;e.preventDefault();zzGo(h);
});

/* --- theme switch as a lamp: the new theme opens as a circle from the button pressed --- */
function lamp(el,run){
 if(!document.startViewTransition||level()!=='full'||busy()){run();return}
 const r=el.getBoundingClientRect();de.style.setProperty('--fx-x',Math.round(r.left+r.width/2)+'px');de.style.setProperty('--fx-y',Math.round(r.top+r.height/2)+'px');
 de.classList.add('fx-lamp');let t;try{t=document.startViewTransition(run)}catch(e){de.classList.remove('fx-lamp');run();return}t.finished.finally(()=>de.classList.remove('fx-lamp'));
}
document.addEventListener('click',e=>{
 const b=e.target.closest&&e.target.closest('#tools [data-t=theme], .zm-seg [data-th]');if(!b||!e.isTrusted||b.dataset.fxGo)return;
 if(b.matches('[data-th]')&&b.getAttribute('aria-checked')==='true')return;
 e.stopImmediatePropagation();e.preventDefault();
 lamp(b,()=>{b.dataset.fxGo='1';b.click();delete b.dataset.fxGo});
},true);

/* --- bottom bar: one pill that slides to the tab you are on (slide verb), and a haptic tick on a tab change --- */
function pill(){
 const n=$('#bnav');if(!n)return;let p=$('.fx-pill',n);
 if(!p){const a0=$('a.on',n);if(a0)n.style.setProperty('--fx-tab',getComputedStyle(a0).backgroundColor);p=document.createElement('span');p.className='fx-pill';p.setAttribute('aria-hidden','true');n.prepend(p);n.classList.add('fx-pilled')}
 const a=$('a.on',n);if(!a||!a.offsetParent){p.style.opacity='0';return}
 const nr=n.getBoundingClientRect(),r=a.getBoundingClientRect();
 p.style.opacity='1';p.style.width=r.width+'px';p.style.height=r.height+'px';p.style.transform='translate('+Math.round(r.left-nr.left)+'px,'+Math.round(r.top-nr.top)+'px)';
}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#bnav a'))haptic(6)},true);

/* --- banner pictures develop the first time they are seen this session (stain + focus verbs) --- */
const seen=new Set();
function develop(){
 if(level()!=='full'||window.zzSlideT&&performance.now()-zzSlideT<4000)return;   /* already on screen during the swipe: no re-develop */
 const img=$('.view:not([hidden]) .pb-pic img')||$('.view:not([hidden]) .nh-bn-pic img');if(!img)return;   /* the Home hero develops too: the focus pull of C17 */const k=img.getAttribute('src');if(seen.has(k))return;seen.add(k);
 const go=()=>{img.classList.remove('fx-dev');void img.offsetWidth;img.classList.add('fx-dev')};
 if(img.complete)go();else img.addEventListener('load',go,{once:true});
}

/* --- reading pages get a progress hairline (CSS scroll-driven animation; nothing runs in JS) --- */
if(!$('.fx-read')){const r=document.createElement('div');r.className='fx-read';r.setAttribute('aria-hidden','true');document.body.append(r)}
const reading=()=>de.classList.toggle('fx-rd',/^#\/(\d\d|c\d+|questions|textbook\/[^/]+)/.test(location.hash||''));

/* --- haptics on answers and on marking a question as learned --- */
document.addEventListener('click',e=>{
 const o=e.target.closest&&e.target.closest('.mx-o');
 if(o)setTimeout(()=>{const s=$('.mx-o.sel');if(!s)return;if(s.classList.contains('ok'))haptic(12);else if(s.classList.contains('no'))haptic([25,40,25])},30);
 const l=e.target.closest&&e.target.closest('.act[data-k=learned]');
 if(l)setTimeout(()=>{if(l.getAttribute('aria-pressed')==='true')haptic(10)},30);
},true);

const route=()=>{reading();setTimeout(()=>{pill();develop()},0)};
apply();route();
addEventListener('hashchange',route);addEventListener('resize',()=>pill());addEventListener('load',()=>{pill();develop()});
if(RM.addEventListener)RM.addEventListener('change',apply);
}catch(e){}})();
