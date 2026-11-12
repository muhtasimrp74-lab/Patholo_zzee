
/* ===== morph.js: shared-element morphs on top of fx.js View Transitions (Full tier only).
   Topic tile -> page banner, list row -> reader heading, bookmark button -> the shelf (Menu tab). One name at a time
   ('zz-morph'), set on the tapped element and on its destination, cleared as soon as the transition is over. */
(function(){try{
const N='zz-morph',ok=()=>!!document.startViewTransition&&window.zzFx&&zzFx.level()==='full'&&(!window.zzTier||zzTier()>=2)&&!document.body.classList.contains('an-on');
let src=null,kind='',tm=0;
const clear=()=>{document.querySelectorAll('[data-zz-morph]').forEach(e=>{e.style.viewTransitionName='';delete e.dataset.zzMorph})};
const tag=e=>{if(!e)return;e.style.viewTransitionName=N;e.dataset.zzMorph='1'};
document.addEventListener('click',e=>{if(!ok())return;const t=e.target.closest&&e.target.closest('a.topic,.tbtile,a.nh-t4,#res li a,.row a,.tbtoc a');if(!t||!/^#\//.test(t.getAttribute('href')||''))return;
 if(window.zzPager&&zzPager.tabs(t.getAttribute('href'))&&zzPager.tabs(location.hash))return;   /* tab to tab: the pager slides instead */
 clear();src=t;kind=t.closest('#res,.row,.tbtoc')?'row':'tile';tag(t);clearTimeout(tm);tm=setTimeout(clear,1500)},true);
addEventListener('hashchange',()=>{if(!src)return;const old=src;src=null;old.style.viewTransitionName='';delete old.dataset.zzMorph;
 const v=document.querySelector('.view:not([hidden])');if(!v)return;
 const dst=kind==='row'?(v.querySelector('#tbbody h1,#tbbody h2')||v.querySelector('.card.hl header')||v.querySelector('h1,h2')):(v.querySelector('.pb')||v.querySelector('h1,h2'));
 tag(dst);clearTimeout(tm);tm=setTimeout(clear,900)});
/* bookmark -> shelf: the button morphs into the Menu tab, where Bookmarks live */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.act[data-k=bm],.mx-bm:not(.mx-fg)');if(!b||!ok()||b.getAttribute('aria-pressed')==='true')return;
 const shelf=document.querySelector('#bnav a[href="#/menu"]')||document.querySelector('.nav .links a[href="#/menu"]');if(!shelf||!shelf.offsetParent)return;
 clear();tag(b);requestAnimationFrame(()=>{try{const t=document.startViewTransition(()=>{b.style.viewTransitionName='';delete b.dataset.zzMorph;tag(shelf)});t.finished.finally(clear)}catch(x){clear()}})});
}catch(e){}})();
