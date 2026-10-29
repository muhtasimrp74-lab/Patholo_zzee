/* bars that follow the scroll (like Facebook): scrolling down slides the top bar, its tools, the bottom tabs and the ink buttons
   away in step with the finger; scrolling up brings them back the same way; when scrolling stops they settle fully open or closed.
   One capture-phase listener covers the document and the swipe pager's panes; vertical scroll only. Bars always show near the top
   of a page, on a tab change and when keyboard focus enters them; the filter drawer hides them.
   Cost: --zz-f (0 shown .. 1 hidden) is written once a frame and only on the bar elements themselves. Written on <html>, the
   inherited variable restyled every element on the page each frame (about 190-480 ms per second of scrolling). */
(()=>{const de=document.documentElement,last=new WeakMap(),H=72,RM=matchMedia('(prefers-reduced-motion: reduce)');let f=0,want=0,raf=0,snapT=0,els=null,elsAt=0,follow=false;
 const bars=()=>{const now=performance.now();if(!els||now-elsAt>1000){els=[...document.querySelectorAll('nav.nav,#tools,#bnav,#an-fab,.bar')];elsAt=now}return els};
 const write=()=>{raf=0;f=want;const v=f.toFixed(3);for(const e of bars())e.style.setProperty('--zz-f',v);const h=f>=1;if(de.classList.contains('zz-hide')!==h)de.classList.toggle('zz-hide',h)};
 const put=v=>{want=Math.max(0,Math.min(1,v));if(!raf)raf=requestAnimationFrame(write)};
 const ease=on=>{for(const e of bars())e.style.transition=on?(RM.matches?'none':'translate .3s cubic-bezier(.2,.8,.2,1),top .3s cubic-bezier(.2,.8,.2,1)'):'none'};
 const settle=v=>{clearTimeout(snapT);follow=false;ease(true);put(v);setTimeout(()=>{if(!follow)for(const e of bars())e.style.transition=''},340)};
 document.addEventListener('scroll',e=>{const el=e.target===document?document.scrollingElement||de:e.target;if(!(el instanceof Element))return;
  const v=el.scrollTop,p=last.get(el);last.set(el,v);if(p==null||v===p||el.scrollHeight<=el.clientHeight+4)return;
  if(el.closest&&el.closest('#qf,.an-pop,dialog,[role=dialog]'))return;
  if(v<56){if(want||f)settle(0);return}
  if(!follow){follow=true;ease(false)}put(want+(v-p)/H);
  clearTimeout(snapT);snapT=setTimeout(()=>settle(want>.5?1:0),140)},{capture:true,passive:true});
 addEventListener('hashchange',()=>{els=null;settle(0);if(document.body.classList.contains('qf-open')){const s=document.getElementById('qscrim');s&&s.click()}});
 document.addEventListener('focusin',e=>{if(e.target.closest&&e.target.closest('nav.nav,#tools,#bnav'))settle(0)})})();

/* skip link (keyboard): the first Tab shows "Skip to content", which moves focus to the current tab's heading */
(()=>{const a=document.createElement('a');a.className='zz-skip';a.href='#';a.textContent='Skip to content';
 a.addEventListener('click',e=>{e.preventDefault();const v=(window.zzScroller&&zzScroller()!==document.scrollingElement)?zzScroller():document.querySelector('.view:not([hidden])')||document.body;
  const h=v.querySelector('h1,h2,main,[role=main]')||v;if(!h.hasAttribute('tabindex'))h.setAttribute('tabindex','-1');h.focus({preventScroll:false})});
 const go=()=>document.body.prepend(a);document.body?go():addEventListener('DOMContentLoaded',go)})();
