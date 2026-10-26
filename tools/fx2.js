
/* ===== fx2.js: cinematic stage 2, the smaller touches (styles in fx.css) =====
   C19 heartbeat on the streak chip · C33 bookmark ribbon, favourite burst, learned tick · C55 a "Read" stamp on a finished chapter
   C16 back-to-top with a page-progress ring · C5 magnetic main buttons (desktop) · C9 the active tab icon draws itself
   C53 textbook figures develop as they scroll in. Only at Visual effects "Full"; reading text never moves. */
(function(){try{
const de=document.documentElement,$=(s,r)=>(r||document).querySelector(s),$$=(s,r)=>[...(r||document).querySelectorAll(s)];
const full=()=>!!(window.zzFx&&zzFx.level()==='full'),busy=()=>document.body.classList.contains('an-on');
const flash=(el,c,ms)=>{el.classList.remove(c);void el.offsetWidth;el.classList.add(c);setTimeout(()=>el.classList.remove(c),ms||900)};

/* C19: a small ECG trace on the streak chip; done today draws a bold beat and one pulse ring */
function streak(){
 const c=$('#v-home .nh-chips .nh-chip');if(!c||$('.fx-ecg',c))return;
 c.insertAdjacentHTML('afterbegin','<svg class="fx-ecg" viewBox="0 0 40 14" aria-hidden="true"><path pathLength="1" d="M0 8h11l2-6 3 11 2.5-9 2 4H40"/></svg>');
 if(full())flash(c,'fx-beat',1600);
}

/* C33: the bookmark ribbon drops, the favourite bursts, the learned tick draws (only on the tap, not when a page loads) */
document.addEventListener('click',e=>{
 const b=e.target.closest&&e.target.closest('.act[data-k]');if(!b||!full())return;
 setTimeout(()=>{if(b.getAttribute('aria-pressed')==='true')flash(b,'fx-just',900)},0);
},true);

/* C55: marking a textbook chapter as read slams a "Read" stamp onto its header, with a tiny thud */
document.addEventListener('click',e=>{
 const b=e.target.closest&&e.target.closest('.tbdone');if(!b||!full())return;
 setTimeout(()=>{if(b.getAttribute('aria-pressed')!=='true')return;
  const h=(b.closest('.tbacts')||b).parentElement||b.parentElement;   /* the chapter header card, above its button row */if(getComputedStyle(h).position==='static')h.style.position='relative';
  const s=document.createElement('span');s.className='fx-stamp';s.setAttribute('aria-hidden','true');s.textContent='Read';h.append(s);
  if(!busy()&&de.animate)setTimeout(()=>de.animate([{transform:'translateY(0)'},{transform:'translateY(2px)'},{transform:'translateY(0)'}],{duration:160,easing:'ease-out'}),260);
  setTimeout(()=>s.remove(),2600);if(window.zzFx)zzFx.haptic([18,30,10])},0);
},true);

/* C16: back to top, with a ring that fills as you go down the page */
const top=document.createElement('button');top.type='button';top.className='fx-top';top.setAttribute('aria-label','Back to top');
top.innerHTML='<svg viewBox="0 0 44 44" aria-hidden="true"><circle class="t" cx="22" cy="22" r="19"/><circle class="f" cx="22" cy="22" r="19" pathLength="100"/><path d="M15 24l7-7 7 7M22 17v12"/></svg>';
/* under the swipe pager the active pane scrolls and the window does not; scroll events do not bubble, so listen in the capture phase */
const scr=()=>window.zzScroller?zzScroller():(document.scrollingElement||de);
document.body.append(top);top.onclick=()=>scr().scrollTo({top:0,behavior:full()?'smooth':'auto'});
let tq=0;
function topSync(){tq=0;const s=scr(),pane=s!==document.scrollingElement&&s!==de,h=pane?s.scrollHeight-s.clientHeight:de.scrollHeight-innerHeight,y=pane?s.scrollTop:scrollY,show=y>600&&h>innerHeight*1.5;top.classList.toggle('on',show);
 if(show)top.style.setProperty('--sp',String(Math.max(0,Math.min(100,y/h*100))))}
addEventListener('scroll',()=>{if(!tq)tq=requestAnimationFrame(topSync)},{passive:true,capture:true});
addEventListener('hashchange',()=>setTimeout(()=>{if(!tq)tq=requestAnimationFrame(topSync)},200));   /* another tab has its own scroll position */

/* C5: main buttons lean toward the pointer (desktop) */
const MAG='.nh-go,.zz-b,.mx-go,.zq-go,.pb-act a';let mq=null,mx=0,my=0;
if(matchMedia('(hover:hover) and (pointer:fine)').matches)document.addEventListener('pointermove',e=>{
 const el=full()?(e.target.closest&&e.target.closest(MAG)):null;
 if(mq&&mq!==el){mq.style.removeProperty('--fx-mx');mq.style.removeProperty('--fx-my');mq.classList.remove('fx-mag')}
 mq=el;if(!el)return;mx=e.clientX;my=e.clientY;
 requestAnimationFrame(()=>{if(!mq)return;const r=mq.getBoundingClientRect();mq.classList.add('fx-mag');
  mq.style.setProperty('--fx-mx',((mx-r.left-r.width/2)/r.width*8).toFixed(1)+'px');mq.style.setProperty('--fx-my',((my-r.top-r.height/2)/r.height*6).toFixed(1)+'px')});
},{passive:true});

/* C9: the active bottom-bar icon draws itself in */
function draw(){
 if(!full())return;const s=$('#bnav a.on svg');if(!s)return;
 $$('path,rect,circle,line,polyline,polygon,ellipse',s).forEach(x=>{if(!x.hasAttribute('pathLength'))x.setAttribute('pathLength','1')});flash(s,'fx-draw',800);
}

/* C53: textbook figures develop (grey, stain, focus) the first time they scroll into view */
const fio=window.IntersectionObserver?new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;fio.unobserve(e.target);if(full())e.target.classList.add('fx-dev')}),{rootMargin:'0px 0px -10% 0px'}):null;
function figs(){if(!fio)return;$$('#tbbody .tbf img:not([data-fxo])').forEach(i=>{i.dataset.fxo='1';fio.observe(i)})}

const route=()=>setTimeout(()=>{streak();draw();topSync();setTimeout(figs,700)},40);
addEventListener('hashchange',route);addEventListener('load',route);route();
const hv=$('#v-home');if(hv)new MutationObserver(()=>setTimeout(streak,30)).observe(hv,{childList:true});
const tb=$('#tbbody');if(tb)new MutationObserver(()=>setTimeout(figs,200)).observe(tb,{childList:true});
}catch(e){}})();
