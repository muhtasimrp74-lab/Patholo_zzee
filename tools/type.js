
/* ===== type.js (19): type in motion, Full level only, never on answer text.
   Ink-bleed: a page's main heading resolves from a soft bleed the first time it is shown this session (heading only, while animating).
   Hand notes: margin notes (.an-mn) and [data-hand] text write themselves in Caveat with an animated stroke, then settle. */
(function(){try{
const full=()=>window.zzFx&&zzFx.level()==='full'&&!document.body.classList.contains('an-on'),seen=new WeakSet();
function bleed(){if(!full())return;const v=document.querySelector('.view:not([hidden])'),h=v&&[...v.querySelectorAll('h1,h2')].find(x=>!x.closest('.ans')&&x.offsetParent);
 if(!h||seen.has(h)||!h.animate)return;seen.add(h);
 h.animate([{filter:'blur(5px)',opacity:.15,letterSpacing:'.05em',textShadow:'0 0 14px var(--rosy)'},{filter:'blur(1px)',opacity:.85,offset:.6},{filter:'blur(0)',opacity:1,letterSpacing:'normal',textShadow:'0 0 0 transparent'}],{duration:800,easing:'cubic-bezier(.2,.7,.2,1)'})}
const NS='http://www.w3.org/2000/svg';
function write(el){if(seen.has(el)||el.closest('.ans')&&!el.matches('.an-mn'))return;seen.add(el);const txt=(el.textContent||'').trim();if(!txt||txt.length>140)return;
 const r=el.getBoundingClientRect();if(!r.width)return;const sv=document.createElementNS(NS,'svg'),t=document.createElementNS(NS,'text');
 const fs=parseFloat(getComputedStyle(el).fontSize)||16;sv.setAttribute('width',r.width);sv.setAttribute('height',r.height);sv.style.cssText='position:absolute;left:0;top:0;overflow:visible;pointer-events:none';
 t.setAttribute('x','0');t.setAttribute('y',String(fs));t.textContent=txt.slice(0,60);t.style.cssText=`font:700 ${fs*1.15}px Caveat,cursive;fill:transparent;stroke:var(--lbl);stroke-width:.8;stroke-dasharray:600;stroke-dashoffset:600`;
 sv.append(t);if(getComputedStyle(el).position==='static')el.style.position='relative';el.style.color='transparent';el.append(sv);
 t.animate([{strokeDashoffset:600,fill:'transparent'},{strokeDashoffset:0,fill:'transparent',offset:.8},{strokeDashoffset:0,fill:'var(--lbl)'}],{duration:1400,easing:'ease-out'}).finished.then(()=>{sv.remove();el.style.color=''},()=>{sv.remove();el.style.color=''})}
const io='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){io.unobserve(e.target);if(full())write(e.target)}})):null;
const scan=()=>{bleed();if(!io)return;document.querySelectorAll('.an-mn,[data-hand]').forEach(el=>{if(!seen.has(el))io.observe(el)})};
addEventListener('hashchange',()=>setTimeout(scan,120));setTimeout(scan,900);
}catch(e){}})();
