
/* ===== mood.js (17): as the exam (S.pref.exam) nears, the page warms slightly and the countdown fills like a vessel.
   CSS variables only (tier 1+): --zz-warm 0..1 on <html>, --zz-fill on .nh-ex. Read-only. */
(function(){try{const de=document.documentElement;
function set(){const s=typeof S!=='undefined'?S:null,e=s&&s.pref&&Date.parse(s.pref.exam);
 if(!e||(window.zzTier&&zzTier()<1)){de.style.removeProperty('--zz-warm');de.classList.remove('zz-warm');return}
 const days=(e-Date.now())/864e5,w=days<0?0:Math.max(0,Math.min(1,1-days/60)),f=days<0?1:Math.max(0,Math.min(1,1-days/90));
 de.style.setProperty('--zz-warm',w.toFixed(3));de.style.setProperty('--zz-fill',(f*100).toFixed(1)+'%');de.classList.toggle('zz-warm',w>0)}
const s=document.createElement('style');s.textContent=`html.zz-warm body{background-color:color-mix(in srgb,var(--bg) calc(100% - var(--zz-warm)*7%),#E8955A)!important}
html.zz-warm .nh-ex,html[style*="--zz-fill"] .nh-ex{background-image:linear-gradient(to top,color-mix(in srgb,var(--rosy) 32%,transparent) var(--zz-fill,0%),transparent var(--zz-fill,0%))!important;background-repeat:no-repeat}`;
document.head.append(s);set();addEventListener('hashchange',()=>setTimeout(set,50));document.addEventListener('visibilitychange',set);
}catch(e){}})();
