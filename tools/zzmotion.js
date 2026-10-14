/* ===== premium motion layer (see zzmotion.css). Everything here is skipped when the device asks for reduced motion. ===== */
(function(){
try{
if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
const de=document.documentElement,EASE='cubic-bezier(.2,.7,.2,1)';
/* 4. answers open/close with a height + fade instead of snapping */
let skip=false;
document.addEventListener('click',e=>{
 if(skip){skip=false;return}
 const h=e.target.closest&&e.target.closest('.qi-h');if(!h)return;
 const a=h.parentElement&&h.parentElement.querySelector('.qi-a');if(!a)return;
 if(h.getAttribute('aria-expanded')==='true'){
  const hh=a.offsetHeight;if(!hh)return;
  e.stopImmediatePropagation();e.preventDefault();
  a.style.overflow='hidden';
  const an=a.animate([{height:hh+'px',opacity:1},{height:'0px',opacity:0}],{duration:220,easing:EASE});
  an.onfinish=an.oncancel=()=>{a.style.overflow='';skip=true;h.click()};
 }else{
  requestAnimationFrame(()=>{if(a.hidden)return;const hh=a.scrollHeight;if(!hh)return;
   a.style.overflow='hidden';
   const an=a.animate([{height:'0px',opacity:0},{height:hh+'px',opacity:1}],{duration:280,easing:EASE});
   an.onfinish=an.oncancel=()=>{a.style.overflow=''}});
 }
},true);
/* 9. a tiny tick when something is marked learned */
document.addEventListener('click',e=>{
 const b=e.target.closest&&e.target.closest('.act[data-k=learned],.qlearn');if(!b||!navigator.vibrate)return;
 setTimeout(()=>{if(b.getAttribute('aria-pressed')==='true')navigator.vibrate(10)},30);
},true);
/* 7. header shadow after scrolling */
let sc=false;
const onS=()=>{sc=false;de.classList.toggle('zz-scrolled',scrollY>8)};
addEventListener('scroll',()=>{if(!sc){sc=true;requestAnimationFrame(onS)}},{passive:true});onS();
/* 8. gentle banner parallax, desktop only */
if(matchMedia('(min-width:641px) and (hover:hover)').matches){
 de.classList.add('zz-par');let pf=false;
 const par=()=>{pf=false;const img=document.querySelector('.view:not([hidden]) .pb-pic img,.view:not([hidden]) .nh-bn-pic img');if(!img)return;
  const t=img.parentElement.getBoundingClientRect().top;img.style.setProperty('--zzp',Math.max(0,Math.min(18,-t*.12)).toFixed(1)+'px')};
 addEventListener('scroll',()=>{if(!pf){pf=true;requestAnimationFrame(par)}},{passive:true});
}
/* 6. numbers count up and bars fill the first time they come into view (once per visit) */
const done=new Set(),seen=new WeakSet();
const io='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(en=>{
 if(!en.isIntersecting)return;io.unobserve(en.target);const el=en.target;
 if(el.matches('.nh-bar2 i')){const w=el.dataset.zw;el.style.width=w}
 else count(el)}),{threshold:.3}):null;
function count(el){
 let n=null;for(const c of el.childNodes)if(c.nodeType===3&&/\d/.test(c.data)){n=c;break}
 if(!n)return;const m=n.data.match(/^(\s*)([\d,]+(?:\.\d+)?)(.*)$/s);if(!m)return;
 const raw=m[2],val=parseFloat(raw.replace(/,/g,'')),dec=(raw.split('.')[1]||'').length,comma=raw.includes(',');
 if(!isFinite(val)||val<=0||val>1e6)return;
 const t0=performance.now(),D=700;
 const fmt=v=>comma?v.toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec}):v.toFixed(dec);
 const step=t=>{const p=Math.min(1,(t-t0)/D),v=val*(1-Math.pow(1-p,3));n.data=m[1]+fmt(v)+m[3];if(p<1)requestAnimationFrame(step)};
 n.data=m[1]+fmt(0)+m[3];requestAnimationFrame(step)}
function scan(){
 if(!io)return;
 const root=document.querySelector('.view:not([hidden])');if(!root)return;
 root.querySelectorAll('.nh-pc,.stats b,.dc .big,.nh-bar2 i').forEach((el,i)=>{
  if(seen.has(el))return;seen.add(el);
  const key=(el.className||el.tagName)+'|'+i+'|'+location.hash.split('/')[1];
  if(done.has(key))return;done.add(key);
  if(el.matches('.nh-bar2 i')){el.dataset.zw=el.style.width;el.style.width='0%'}
  io.observe(el)})}
addEventListener('hashchange',()=>{setTimeout(scan,60);setTimeout(scan,500)});
setTimeout(scan,700);setTimeout(scan,1800);
/* 5. shimmer placeholder while the textbook chapter list loads */
const tv=document.getElementById('v-textbook');
if(tv)new MutationObserver(()=>{const g=document.getElementById('tbgrid');
 if(g&&!g.firstChild)g.innerHTML='<div class="zsk zsk-grid" role="status" aria-label="Loading chapters">'+'<i></i>'.repeat(9)+'</div>'}).observe(tv,{childList:true,subtree:true});
}catch(e){}
})();
