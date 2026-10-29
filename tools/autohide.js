/* bars that follow the scroll (like Facebook): scrolling down slides the top bar, its tools, the bottom tabs and the ink buttons
   away in step with the finger; scrolling up brings them back the same way; when scrolling stops they settle fully open or closed.
   One capture-phase listener covers the document and the swipe pager's panes; vertical scroll only. Bars always show near the top
   of a page, on a tab change and when keyboard focus enters them; the filter drawer hides them. State: --zz-f (0 shown .. 1 hidden)
   on <html>, plus .zz-hide when fully hidden. */
(()=>{const de=document.documentElement,last=new WeakMap(),H=72;let f=0,snapT=0;
 const put=v=>{f=Math.max(0,Math.min(1,v));de.style.setProperty('--zz-f',f.toFixed(3));const h=f>=1;if(de.classList.contains('zz-hide')!==h)de.classList.toggle('zz-hide',h)};
 const settle=v=>{clearTimeout(snapT);de.classList.remove('zz-follow');de.classList.add('zz-snap');put(v);setTimeout(()=>de.classList.remove('zz-snap'),320)};
 document.addEventListener('scroll',e=>{const el=e.target===document?document.scrollingElement||de:e.target;if(!(el instanceof Element))return;
  const v=el.scrollTop,p=last.get(el);last.set(el,v);if(p==null||v===p||el.scrollHeight<=el.clientHeight+4)return;
  if(el.closest&&el.closest('#qf,.an-pop,dialog,[role=dialog]'))return;
  if(v<56){if(f)settle(0);return}
  de.classList.remove('zz-snap');de.classList.add('zz-follow');put(f+(v-p)/H);
  clearTimeout(snapT);snapT=setTimeout(()=>settle(f>.5?1:0),140)},{capture:true,passive:true});
 addEventListener('hashchange',()=>{settle(0);if(document.body.classList.contains('qf-open')){const s=document.getElementById('qscrim');s&&s.click()}});
 document.addEventListener('focusin',e=>{if(e.target.closest&&e.target.closest('nav.nav,#tools,#bnav'))settle(0)})})();

/* skip link (keyboard): the first Tab shows "Skip to content", which moves focus to the current tab's heading */
(()=>{const a=document.createElement('a');a.className='zz-skip';a.href='#';a.textContent='Skip to content';
 a.addEventListener('click',e=>{e.preventDefault();const v=(window.zzScroller&&zzScroller()!==document.scrollingElement)?zzScroller():document.querySelector('.view:not([hidden])')||document.body;
  const h=v.querySelector('h1,h2,main,[role=main]')||v;if(!h.hasAttribute('tabindex'))h.setAttribute('tabindex','-1');h.focus({preventScroll:false})});
 const go=()=>document.body.prepend(a);document.body?go():addEventListener('DOMContentLoaded',go)})();
