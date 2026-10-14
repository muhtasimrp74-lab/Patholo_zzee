/* motion.js - tap pulse, bookmark/learned pop with sparks. Light on purpose: no per-frame work, skipped for reduced motion. */
(function(){try{
if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
const HIT='button,a,.act,.topic,.dc,.pc,.qi-h,.card>header,.tbtile,.mtile,.nh-row a,summary,label.mtile';
let last=0;
function rm(e){setTimeout(()=>e.remove(),800)}
document.addEventListener('pointerdown',e=>{if(e.button>0||!e.target.closest(HIT)||e.target.closest('.act'))return;const n=performance.now();if(n-last<60)return;last=n;
 if(document.body.classList.contains('an-on'))return;
 const d=document.createElement('i');d.className='zz-tap';d.style.left=e.clientX+'px';d.style.top=e.clientY+'px';document.body.append(d);rm(d)},{passive:true});
document.addEventListener('click',e=>{const a=e.target.closest('.act');if(!a)return;a.classList.remove('pop');requestAnimationFrame(()=>{a.classList.add('pop');setTimeout(()=>a.classList.remove('pop'),460)});},false);
}catch(e){}})();
