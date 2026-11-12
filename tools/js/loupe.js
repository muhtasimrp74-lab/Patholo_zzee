
/* ===== loupe.js: a round lens over figures and tags (tier 2+). Mouse: follows the pointer over a figure or [data-loupe] tag.
   Touch: long-press a figure or tag, move to look around, lift to close. Figures are magnified 2.5x with their label;
   [data-loupe] tags reveal their hidden text (mnemonics, high-yield notes). Never over answer text; never while annotating. */
(function(){try{
const Z=2.5,R=78,FIG='.view img:not([width="16"]):not([width="20"]):not([width="24"]), .view svg.fig',TAG='[data-loupe]';
const ok=()=>(!window.zzTier||zzTier()>=2)&&!document.body.classList.contains('an-on');
let L=null,im=null,cap=null,on=null,lp=0,touch=false;
function make(){if(L)return;L=document.createElement('div');L.className='zz-loupe';L.setAttribute('aria-hidden','true');
 L.innerHTML='<img alt=""><span></span>';im=L.firstChild;cap=L.lastChild;
 const s=document.createElement('style');s.textContent=`.zz-loupe{position:fixed;z-index:70;width:${2*R}px;height:${2*R}px;margin:${-R}px 0 0 ${-R}px;border-radius:50%;overflow:hidden;pointer-events:none;display:none;
 background:var(--panel);border:2px solid rgba(255,255,255,.85);box-shadow:0 0 0 1px rgba(0,0,0,.25),0 14px 34px rgba(0,0,0,.35),inset 0 0 18px rgba(0,0,0,.25)}
 .zz-loupe.on{display:block}.zz-loupe img{position:absolute;max-width:none;transform-origin:0 0}
 .zz-loupe span{position:absolute;left:10%;right:10%;bottom:12%;text-align:center;font:600 11px/1.3 var(--body);color:var(--text);background:color-mix(in srgb,var(--panel) 85%,transparent);border-radius:8px;padding:2px 4px}
 .zz-loupe.t span{top:50%;bottom:auto;transform:translateY(-50%);font-size:13px}.zz-loupe span:empty{display:none}`;document.head.append(s);document.body.append(L)}
function target(el){if(!el||!el.closest)return null;if(el.closest('.ans')&&!el.closest('img,svg.fig'))return null;
 const t=el.closest(TAG);if(t)return t;const f=el.closest(FIG);if(f&&(f.naturalWidth||f.clientWidth)>=120)return f;return null}
function show(t,x,y){make();on=t;L.style.left=x+'px';L.style.top=y+'px';L.classList.add('on');
 if(t.matches(TAG)){L.classList.add('t');im.style.display='none';cap.textContent=t.dataset.loupe||t.textContent;return}
 L.classList.remove('t');const r=t.getBoundingClientRect();
 if(t.tagName==='IMG'){if(im.getAttribute('src')!==t.currentSrc&&t.currentSrc)im.src=t.currentSrc||t.src;im.style.display='';im.style.width=r.width+'px';im.style.height=r.height+'px';
  im.style.transform='translate('+(R-(x-r.left)*Z)+'px,'+(R-(y-r.top)*Z)+'px) scale('+Z+')'}else im.style.display='none';
 const fg=t.closest('figure'),fc=fg&&fg.querySelector('figcaption');cap.textContent=(t.getAttribute('alt')||(fc&&fc.textContent)||'').trim().slice(0,80)}
function hide(){on=null;if(L)L.classList.remove('on','t')}
document.addEventListener('pointermove',e=>{if(e.pointerType==='touch'){if(touch&&on)show(on,e.clientX,e.clientY);return}
 if(!ok()){if(on)hide();return}const t=target(e.target);if(t)show(t,e.clientX,e.clientY);else if(on)hide()},{passive:true});
document.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||!ok())return;const t=target(e.target);if(!t)return;clearTimeout(lp);
 const x=e.clientX,y=e.clientY;lp=setTimeout(()=>{touch=true;show(t,x,y);if(window.zzFx)zzFx.haptic(8)},480)},{passive:true});
const up=()=>{clearTimeout(lp);if(touch){touch=false;hide()}};
['pointerup','pointercancel'].forEach(e=>document.addEventListener(e,up,{passive:true}));
document.addEventListener('touchmove',e=>{if(touch&&e.cancelable)e.preventDefault()},{passive:false});
document.addEventListener('contextmenu',e=>{if(touch)e.preventDefault()});
addEventListener('scroll',()=>{if(!touch)hide()},{passive:true,capture:true});addEventListener('hashchange',up);
}catch(e){}})();
