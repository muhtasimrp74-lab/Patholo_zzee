
/* ===== cinematic banners for Questions / Chapters / MCQs / Textbook / Menu (idempotent; runs now, on load and on route change) ===== */
(function(){
const SET={questions:1,qa:'chapters',mcqs:1,textbook:1,menu:1};
const IMG={questions:'questions',qa:'chapters',mcqs:'mcqs',textbook:'textbook',menu:'menu'};
function apply(){
 for(const id in SET){
  const v=document.getElementById('v-'+id);if(!v||v.querySelector('.pb'))continue;
  const hi=v.querySelector('.hero-in');if(!hi)continue;
  const k=IMG[id];
  const s=document.createElement('section');s.className='pb';s.dataset.pb=k;
  s.innerHTML='<div class="pb-pic"><picture><source media="(max-width:1000px)" srcset="icons/pb-'+k+'-900.webp" width="900" height="506"><img src="icons/pb-'+k+'.webp" width="1672" height="940" alt="" decoding="async"></picture></div>';
  const w=document.createElement('div');w.className='pb-in';hi.before(s);s.appendChild(w);w.appendChild(hi);
 }
}
apply();addEventListener('load',apply);addEventListener('hashchange',apply);
})();
