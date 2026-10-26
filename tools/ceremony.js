
/* ===== ceremony.js =====
   11 topic completion: when the last question of a topic (h3.sub group) is marked learned, its heading pulls from blur to
      crisp while an eosin wash sweeps across it. Heading only; cards and answers never move or filter.
   12 unlock: locked chapters (.zz-locked) rest as frosted, unstained slides (an overlay, no filter at rest). When a chapter
      unlocks after zz:chunk / zz:auth, the whole tray stains in. Listeners and CSS only; gating logic untouched. */
(function(){try{
const T=()=>window.zzTier?zzTier():2,st=()=>typeof S!=='undefined'?S:null,done=new Set();
const s=document.createElement('style');s.textContent=`.zz-locked{position:relative}
.zz-locked::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:1;
 background:linear-gradient(135deg,rgba(255,255,255,.62),rgba(240,236,240,.48)),repeating-linear-gradient(45deg,rgba(120,110,120,.08) 0 2px,transparent 2px 7px)}
:root[data-theme=dark] .zz-locked::before{background:linear-gradient(135deg,rgba(30,22,28,.62),rgba(20,16,20,.5)),repeating-linear-gradient(45deg,rgba(255,255,255,.05) 0 2px,transparent 2px 7px)}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]) .zz-locked::before{background:linear-gradient(135deg,rgba(30,22,28,.62),rgba(20,16,20,.5)),repeating-linear-gradient(45deg,rgba(255,255,255,.05) 0 2px,transparent 2px 7px)}}
h3.sub.zz-done{background-image:linear-gradient(90deg,color-mix(in srgb,var(--rosy) 40%,transparent),transparent);background-repeat:no-repeat;background-size:0 100%;transition:background-size .9s ease}
h3.sub.zz-done.zz-wash{background-size:100% 100%}`;document.head.append(s);
/* 11 */
function topicOf(card){let h=card.previousElementSibling;while(h&&!(h.matches('h3.sub')))h=h.previousElementSibling;if(!h)return null;
 const cs=[];for(let n=h.nextElementSibling;n&&!n.matches('h3.sub');n=n.nextElementSibling)if(n.matches('article.card'))cs.push(n);return{h,cs}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.act[data-k=learned]');if(!b)return;
 setTimeout(()=>{if(b.getAttribute('aria-pressed')!=='true'||T()<1)return;const c=b.closest('article.card'),tp=c&&topicOf(c),sv=st();if(!tp||!sv)return;
  const L=new Set(sv.learned||[]);if(!tp.cs.every(x=>L.has(x.id))||done.has(tp.h))return;done.add(tp.h);
  const h=tp.h;h.classList.add('zz-done');requestAnimationFrame(()=>h.classList.add('zz-wash'));
  if(T()>=2&&h.animate)h.animate([{filter:'blur(6px)',opacity:.55},{filter:'blur(0)',opacity:1}],{duration:900,easing:'cubic-bezier(.2,.7,.2,1)'}).finished.then(()=>{h.style.filter=''}).catch(()=>{});
  if(window.zzFx)zzFx.haptic([10,40,16]);
  setTimeout(()=>h.classList.remove('zz-wash','zz-done'),2600)},80)},true);
/* 12 */
let armed=0,mo=null;
function arm(){armed=Date.now()+5000;if(mo)return;mo=new MutationObserver(ms=>{if(Date.now()>armed){mo.disconnect();mo=null;return}
 ms.forEach(m=>{const el=m.target;if(m.oldValue&&/\bzz-locked\b/.test(m.oldValue)&&!el.classList.contains('zz-locked'))stain(el)})});
 mo.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class'],attributeOldValue:true})}
function stain(el){if(T()<2||!el.animate)return;const tray=el.parentElement?[...el.parentElement.children]:[el];
 tray.forEach((x,i)=>x.animate([{filter:'grayscale(1) blur(1.5px)',opacity:.7},{filter:'none',opacity:1}],{duration:700,delay:i*45,easing:'ease-out',fill:'backwards'}))}
['zz:chunk','zz:auth'].forEach(ev=>{addEventListener(ev,arm);document.addEventListener(ev,arm)});
}catch(e){}})();
