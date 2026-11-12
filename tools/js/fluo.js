
/* ===== fluorescence theme: polarised-light variant on amyloid pages (class zz-pol; tokens in refine.css) ===== */
(function(){try{const de=document.documentElement;
const pol=()=>{const v=document.querySelector('.view:not([hidden])'),t=v?(v.dataset.title||'')+' '+((v.querySelector('h1,h2')||{}).textContent||''):'';
 de.classList.toggle('zz-pol',de.dataset.tone==='fluo'&&/amyloid/i.test(location.hash+' '+t))};
addEventListener('hashchange',()=>setTimeout(pol,0));new MutationObserver(pol).observe(de,{attributes:true,attributeFilter:['data-tone']});pol();
}catch(e){}})();
