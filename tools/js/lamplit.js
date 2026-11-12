/* SWITCHED OFF (owner): not in the build list in tools/build.py until it is redesigned; add 'lamplit.js' back to _ZZ_NEW to restore it.
   Lamplit (Textbook tab): an original, dependency-free take on the "book on a lamp-lit desk" idea, in the site's own palette.
   A burgundy hardcover lies on a dark lacquered desk under warm lamplight, beside a cappuccino and a pencil (all CSS). Tap the
   cover (or Enter / Space): the view eases in and the cover swings open onto the contents; the page arrows or the arrow keys
   turn the contents; a chapter opens the reader; Escape or "Close the book" closes it. Reduced motion or Minimal / Off effects:
   no 3D motion. Built from the chapter list below it (#tbgrid), so it never disagrees with it. */
(()=>{const PER=6,de=document.documentElement;
 const calm=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||(!!window.zzTier&&zzTier()<2);
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const chapters=v=>[...v.querySelectorAll('#tbgrid a[href^="#/textbook/ch"]')].map(a=>{const t=a.innerText.replace(/\s+/g,' ').trim(),m=t.match(/^(\d+)\s+(.*?)(?:\s+pp\.\s.*)?$/);return m?{n:m[1],t:m[2],h:a.getAttribute('href')}:null}).filter((c,i,a)=>c&&a.findIndex(d=>d&&d.h===c.h)===i).sort((a,b)=>a.n-b.n);   /* the grid is grouped, not numbered: the contents run 1..29 */
 function build(v){const main=v.querySelector('main');if(!main||main.querySelector('.ll'))return;const ch=chapters(v);if(!ch.length)return;let p=0;const pages=Math.ceil(ch.length/PER);
  const s=document.createElement('section');s.className='ll';s.setAttribute('aria-label','The textbook on your desk');s.setAttribute('data-no-swipe','');
  s.innerHTML='<div class="ll-desk"><div class="ll-light" aria-hidden="true"></div><div class="ll-cup" aria-hidden="true"><i></i></div><div class="ll-pencil" aria-hidden="true"></div>'+
   '<div class="ll-book"><button type="button" class="ll-cover" aria-expanded="false" aria-controls="ll-pages"><span class="ll-foil"><small>Robbins, Cotran &amp; Kumar</small><b>Pathologic Basis of Disease</b><em>Open the book</em></span></button>'+
   '<div class="ll-pages" id="ll-pages" hidden><div class="ll-left"><p class="ll-k">Contents</p><p class="ll-sub">'+ch.length+' chapters, saved for offline reading</p>'+
   '<div class="ll-nav"><button type="button" class="ll-prev" aria-label="Previous contents page">&lsaquo;</button><span class="ll-pn" aria-live="polite"></span><button type="button" class="ll-next" aria-label="Next contents page">&rsaquo;</button></div>'+
   '<button type="button" class="ll-close">Close the book</button></div><ol class="ll-list"></ol></div></div></div>';
  main.prepend(s);const cover=s.querySelector('.ll-cover'),pg=s.querySelector('.ll-pages'),list=s.querySelector('.ll-list'),pn=s.querySelector('.ll-pn');
  const draw=()=>{list.innerHTML=ch.slice(p*PER,(p+1)*PER).map(c=>'<li><a href="'+esc(c.h)+'"><span>'+esc(c.n)+'</span>'+esc(c.t)+'</a></li>').join('');pn.textContent='Page '+(p+1)+' of '+pages;
   s.querySelector('.ll-prev').disabled=p===0;s.querySelector('.ll-next').disabled=p>=pages-1};
  const turn=d=>{const q=Math.max(0,Math.min(pages-1,p+d));if(q===p)return;p=q;if(!calm()){list.classList.remove('ll-turn','ll-back');void list.offsetWidth;list.classList.add(d>0?'ll-turn':'ll-back')}draw()};
  const open=on=>{s.classList.toggle('calm',calm());s.classList.toggle('on',on);cover.setAttribute('aria-expanded',String(on));pg.hidden=!on;if(on){draw();setTimeout(()=>{const a=list.querySelector('a');a&&a.focus({preventScroll:true})},calm()?0:500)}else cover.focus({preventScroll:true})};
  cover.addEventListener('click',()=>open(true));s.querySelector('.ll-close').addEventListener('click',()=>open(false));
  s.querySelector('.ll-prev').addEventListener('click',()=>turn(-1));s.querySelector('.ll-next').addEventListener('click',()=>turn(1));
  s.addEventListener('keydown',e=>{if(!s.classList.contains('on'))return;if(e.key==='ArrowRight'){e.preventDefault();turn(1)}else if(e.key==='ArrowLeft'){e.preventDefault();turn(-1)}else if(e.key==='Escape'){e.preventDefault();open(false)}});
  /* the closed book leans gently toward the cursor (Full effects, mouse or pen hover only); nothing moves at rest */
  s.addEventListener('pointermove',e=>{if(s.classList.contains('on')||calm()||e.pointerType==='touch'||!(window.zzTier&&zzTier()>=3))return;const r=s.getBoundingClientRect();
   s.style.setProperty('--ly',(((e.clientX-r.left)/r.width-.5)*10).toFixed(2)+'deg');s.style.setProperty('--lx',(((e.clientY-r.top)/r.height-.5)*-6).toFixed(2)+'deg')});
  s.addEventListener('pointerleave',()=>{s.style.removeProperty('--ly');s.style.removeProperty('--lx')})}
 const go=()=>{const v=document.getElementById('v-textbook');if(!v)return;build(v);new MutationObserver(()=>build(v)).observe(v,{childList:true,subtree:true})};
 document.readyState==='loading'?addEventListener('DOMContentLoaded',go):go()})();
