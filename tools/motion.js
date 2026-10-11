/* motion.js - tap pulse, bookmark/learned pop with sparks. Light on purpose: no per-frame work, skipped for reduced motion. */
(function(){try{
if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
const HIT='button,a,.act,.topic,.dc,.pc,.qi-h,.card>header,.tbtile,.mtile,.nh-row a,summary,label.mtile';
let last=0;
function rm(e){setTimeout(()=>e.remove(),800)}
document.addEventListener('pointerdown',e=>{if(e.button>0||!e.target.closest(HIT))return;const n=performance.now();if(n-last<60)return;last=n;
 if(document.body.classList.contains('inking'))return;
 const d=document.createElement('i');d.className='zz-tap';d.style.left=e.clientX+'px';d.style.top=e.clientY+'px';document.body.append(d);rm(d)},{passive:true});
document.addEventListener('click',e=>{const a=e.target.closest('.act');if(!a)return;a.classList.remove('pop');void a.offsetWidth;a.classList.add('pop');setTimeout(()=>a.classList.remove('pop'),520);
 const k=a.dataset.k,c=a.closest('.card');if(!c||!['learned','bm','fav'].includes(k))return;let on=false;try{on=S[k].includes(c.id)}catch(e){}if(!on)return;
 const r=a.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,col={learned:'var(--ok)',bm:'var(--lbl)',fav:'var(--clay2,var(--lbl))'}[k];
 for(let i=0;i<7;i++){const s=document.createElement('i'),t=(i/7)*Math.PI*2+Math.random()*.5,d=18+Math.random()*16;s.className='zz-spark';s.style.cssText='left:'+x+'px;top:'+y+'px;--c:'+col+';--dx:'+Math.cos(t)*d+'px;--dy:'+Math.sin(t)*d+'px';document.body.append(s);rm(s)}},false);
}catch(e){}})();
