
/* ===== deck.js (practice, #v-practice) =====
   13 deck physics: the card rests on a stack (shadow layers, no transforms). Once the answer is shown, swipe right = Easy,
      left = Hard, up = Medium: the card follows the finger (transform only while dragging), springs back or flies off,
      then the existing rating button is pressed. Transforms are removed at rest.
   14 Leitner boxes: six boxes (b = 0..5, intervals 0, 2, 4, 8, 16, 30 days) under the deck; after a rating the card drops
      into the box rate() put it in (hard = box 0). Reads S.sr only; rate() is unchanged. */
(function(){try{
const T=()=>window.zzTier?zzTier():2,IV=[0,2,4,8,16,30],st=()=>typeof S!=='undefined'?S:null;
const css=document.createElement('style');css.textContent=`#v-practice .pc.zz-deck{box-shadow:0 7px 0 -3px var(--panel),0 7px 0 -2px var(--line2),0 14px 0 -7px var(--panel),0 14px 0 -6px var(--line),var(--sh1,none)}
#v-practice .pc.zz-deck .ans:not([hidden])~.prow{touch-action:pan-y}
.zz-lb{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:22px 0 8px}
.zz-lb div{position:relative;padding:8px 4px 6px;border:1px solid var(--line2);border-top:0;border-radius:0 0 10px 10px;text-align:center;font:600 .72rem/1.25 var(--body);color:var(--muted);background:var(--soft)}
.zz-lb b{display:block;font:400 1.1rem var(--disp);color:var(--text);font-variant-numeric:tabular-nums}
.zz-lb div.hit{border-color:var(--burgundy);color:var(--lbl)}
.zz-fly{position:fixed;z-index:65;border-radius:8px;background:var(--panel);border:1px solid var(--line2);box-shadow:0 8px 20px rgba(0,0,0,.2);pointer-events:none}`;document.head.append(css);
/* 14: the boxes */
function boxes(){const v=document.getElementById('v-practice');if(!v)return null;const pc=v.querySelector('.pc');if(!pc)return null;let lb=v.querySelector('.zz-lb');
 const s=st(),n=[0,0,0,0,0,0];if(s&&s.sr)for(const k in s.sr){const b=s.sr[k]&&s.sr[k].b;if(b>=0&&b<=5)n[b|0]++}
 if(!lb){lb=document.createElement('div');lb.className='zz-lb';lb.setAttribute('aria-label','Leitner boxes');pc.parentNode.append(lb)}
 lb.innerHTML=n.map((c,i)=>'<div data-b="'+i+'"><b>'+c+'</b>'+(IV[i]?IV[i]+' d':'today')+'</div>').join('');return lb}
function drop(from,b){const lb=boxes(),bx=lb&&lb.querySelector('[data-b="'+b+'"]');if(!bx)return;bx.classList.add('hit');setTimeout(()=>bx.classList.remove('hit'),900);
 if(T()<2||!from||!document.body.animate)return;const r=from,t=bx.getBoundingClientRect(),f=document.createElement('div');f.className='zz-fly';
 f.style.cssText+=';left:'+r.left+'px;top:'+r.top+'px;width:'+r.width+'px;height:'+Math.min(r.height,160)+'px';document.body.append(f);
 const dx=t.left+t.width/2-(r.left+r.width/2),dy=t.top-(r.top+Math.min(r.height,160)/2),sc=t.width/r.width;
 f.animate([{transform:'none',opacity:1},{transform:'translate('+dx*.6+'px,'+(dy*.6-40)+'px) scale('+(.5+sc/2)+')',opacity:1,offset:.6},{transform:'translate('+dx+'px,'+dy+'px) scale('+sc+')',opacity:0}],{duration:620,easing:'cubic-bezier(.3,.1,.3,1)'}).finished.then(()=>f.remove(),()=>f.remove())}
let pend=null;
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#v-practice .prow [data-r]');if(!b||!/^[emh]$/.test(b.dataset.r))return;
 const id=typeof PR!=='undefined'&&PR&&PR.q&&PR.q[0],pc=b.closest('.pc');pend={id,r:pc?pc.getBoundingClientRect():null};
 setTimeout(()=>{const s=st(),o=pend&&s&&s.sr&&s.sr[pend.id];if(o)drop(pend.r,Math.max(0,Math.min(5,o.b|0)));pend=null},0)},true);
/* 13: drag with a spring */
let d=null;
const spring=(el,x,y,r)=>{if(T()<2||!el.animate){el.style.transform='';return}const k=[];for(let i=0;i<=12;i++){const u=i/12,a=Math.exp(-5*u)*Math.cos(9*u);k.push({transform:'translate('+x*a+'px,'+y*a+'px) rotate('+r*a+'deg)'})}
 el.style.transform='';el.animate(k,{duration:520,easing:'linear'})};
document.addEventListener('pointerdown',e=>{const pc=e.target.closest&&e.target.closest('#v-practice .pc.zz-deck');if(!pc||T()<1||document.body.classList.contains('an-on'))return;
 if(!pc.querySelector('.prow [data-r=e]')||e.target.closest('button,input,select,textarea,canvas,a'))return;d={pc,x:e.clientX,y:e.clientY,on:false,id:e.pointerId}},{passive:true});
document.addEventListener('pointermove',e=>{if(!d||e.pointerId!==d.id)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;
 if(!d.on){if(Math.hypot(dx,dy)<12)return;if(Math.abs(dy)>Math.abs(dx)&&dy>0){d=null;return}d.on=true;d.pc.style.willChange='transform';try{d.pc.setPointerCapture(e.pointerId)}catch(x){}}
 d.dx=dx;d.dy=Math.min(0,dy);d.pc.style.transform='translate('+dx+'px,'+d.dy+'px) rotate('+dx/18+'deg)'},{passive:true});
const end=e=>{if(!d||(e&&e.pointerId!==d.id))return;const g=d;d=null;if(!g.on)return;const pc=g.pc,dx=g.dx||0,dy=g.dy||0,W=pc.clientWidth;
 const r=dx>W*.28?'e':dx<-W*.28?'h':dy<-110?'m':null;pc.style.willChange='';
 if(!r){spring(pc,dx,dy,dx/18);return}
 const go=()=>{pc.style.transform='';const b=pc.querySelector('.prow [data-r='+r+']');if(b)b.click()};if(window.zzFx)zzFx.haptic(r==='h'?[18,30,18]:10);
 if(T()<2||!pc.animate){go();return}const ox=r==='e'?innerWidth:r==='h'?-innerWidth:dx,oy=r==='m'?-innerHeight:dy;
 pc.animate([{transform:pc.style.transform},{transform:'translate('+ox+'px,'+oy+'px) rotate('+(ox/18)+'deg)',opacity:.2}],{duration:220,easing:'ease-in'}).finished.then(go,go)};
document.addEventListener('pointerup',end,true);document.addEventListener('pointercancel',end,true);
/* tag new cards for the stack and refresh the boxes */
const mark=()=>{const v=document.getElementById('v-practice');if(!v)return;v.dataset.noSwipe='';const pc=v.querySelector('.pc');if(pc&&pc.querySelector('.pmeta'))pc.classList.add('zz-deck');if(pc&&pc.querySelector('.pmeta'))boxes()};
const host=typeof P!=='undefined'&&P&&P.nodeType===1?P:document.getElementById('v-practice');if(host)new MutationObserver(mark).observe(host,{childList:true});mark();   /* childList only: the boxes' own updates do not re-trigger */
}catch(e){}})();
