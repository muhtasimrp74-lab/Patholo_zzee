/* "Continue where you left off" (Home) reads S.recent, which only changed when a question was opened from a link (#/02/q918):
   reading a chapter, the normal way to study, never counted, so Home always showed "Start here". Now the card being read is
   recorded when scrolling settles on a chapter page (the first card near the top of the screen), and when a card is tapped. */
(()=>{let t=0;
 const rec=id=>{try{if(!id||typeof S==='undefined'||!S||!Array.isArray(S.recent))return;if(typeof BY!=='undefined'&&!BY[id])return;if(S.recent[0]===id)return;
  S.recent=[id,...S.recent.filter(x=>x!==id)].slice(0,5);if(typeof save==='function')save()}catch(e){}};
 const reading=()=>{const v=document.querySelector('.view:not([hidden]) article.card')?document.querySelector('.view:not([hidden])'):null;if(!v)return null;
  const y=Math.max(170,innerHeight*.3);   /* the card under the reading line, not one whose last lines are still on screen */
  for(const c of v.querySelectorAll('article.card')){const r=c.getBoundingClientRect();if(r.height&&r.top<=y&&r.bottom>y)return c.id}return null};
 addEventListener('scroll',()=>{clearTimeout(t);t=setTimeout(()=>rec(reading()),900)},{capture:true,passive:true});
 document.addEventListener('click',e=>{const h=e.target.closest&&e.target.closest('article.card header');if(h)rec(h.parentElement.id)},true)})();
