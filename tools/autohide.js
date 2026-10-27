/* auto-hide bars (like Facebook): scrolling down slides the top bar, its tools and the bottom tabs away; any scroll up brings them back.
   One capture-phase listener covers the document and the swipe pager's panes. Bars always show near the top of a page, on a tab
   change and when keyboard focus enters them; the filter drawer hides them (nothing may cover its button). Vertical scroll only. */
(()=>{const de=document.documentElement,last=new WeakMap();let acc=0,dir=0;
 const set=h=>{if(de.classList.contains('zz-hide')!==h)de.classList.toggle('zz-hide',h)};
 document.addEventListener('scroll',e=>{const el=e.target===document?document.scrollingElement||de:e.target;if(!(el instanceof Element))return;
  const v=el.scrollTop,p=last.get(el);last.set(el,v);if(p==null||v===p||el.scrollHeight<=el.clientHeight+4)return;
  if(el.closest&&el.closest('#qf,.an-pop,dialog,[role=dialog]'))return;
  if(v<56){acc=0;set(false);return}const d=v-p,s=Math.sign(d);if(s!==dir){dir=s;acc=0}acc+=d;
  if(acc>24)set(true);else if(acc<-12)set(false)},{capture:true,passive:true});
 addEventListener('hashchange',()=>{set(false);if(document.body.classList.contains('qf-open')){const s=document.getElementById('qscrim');s&&s.click()}});
 document.addEventListener('focusin',e=>{if(e.target.closest&&e.target.closest('nav.nav,#tools,#bnav'))set(false)})})();
