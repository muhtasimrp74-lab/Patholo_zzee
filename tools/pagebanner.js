
/* ===== cinematic banners for Questions / Chapters / MCQs / Textbook / Menu (idempotent; runs now, on load and on route change).
   Each banner also carries that page's main actions and a few live figures; actions reuse existing routes or trigger the page's own buttons. ===== */
(function(){
const IMG={questions:'questions',qa:'chapters',mcqs:'mcqs',textbook:'textbook',menu:'menu'};
const $1=(v,sel,re)=>{const m=document.querySelectorAll('#v-'+v+' main '+sel);for(const e of m)if(!re||re.test(e.textContent.trim()))return e;return null};
const num=(v,re)=>{const m=re.exec(((document.getElementById('v-'+v)||{}).textContent||'').replace(/\s+/g,' '));return m?m[1]:null};
const click=(v,sel,re)=>()=>{const e=$1(v,sel,re);if(e)e.click()};
const go=h=>()=>{location.hash=h};
/* each spec: acts = [label|fn, handler, primary?]; stats = fn returning an array of strings */
const SPEC={
 questions:{acts:[['Random question',click('questions','button',/Random question/),1],['Practice',go('#/practice')],['Chapters',go('#/qa')]],
  stats:()=>{const t=($1('questions','.qfc.on')||{}).textContent,n=t&&t.replace(/\D/g,''),l=num('questions',/(\d+ of \d[\d,]* learned)/);return[n&&n+' questions','Viva + written',l]}},
 qa:{acts:[[()=>{const e=$1('qa','a,button',/^Start/);return e?e.textContent.trim():'Start studying'},click('qa','a,button',/^Start/),1],['All questions',go('#/questions')],['Textbook',go('#/textbook')]],
  stats:()=>{const c=num('qa',/(\d+)\s*chapters/);const t=($1('qa','.qfc.on')||{}).textContent,n=t&&t.replace(/\D/g,'');return[c&&c+' chapters',n&&n+' questions','With full answers']}},
 mcqs:{acts:[['Quick 10',click('mcqs','.mx-next'),1],['Mock paper',click('mcqs','.mx-tile.t3')],['Custom practice',click('mcqs','.mx-tile.t2')]],
  stats:()=>{const n=num('mcqs',/(\d+) questions/);return[n&&n+' MCQs','Single best answer + true/false']}},
 textbook:{acts:[[()=>{const e=$1('textbook','a.tbcont');return e?(e.textContent.indexOf('Continue')>-1?'Continue reading':'Start reading'):'Start reading'},()=>{const e=$1('textbook','a.tbcont');if(e)location.hash=e.getAttribute('href')},1],['Questions',go('#/questions')]],
  stats:()=>{const n=document.querySelectorAll('#v-textbook main a.tbtile').length;return[n&&n+' chapters','Robbins 11th edition','Saved for offline']}},
 menu:{acts:[['Practice',go('#/practice')],['Bookmarks',go('#/bookmarks')],['Notes',go('#/notes')],['Account',go('#/account')],['Export backup',click('menu','button',/Export backup/)]],stats:()=>[]}
};
function build(id,box){
 const sp=SPEC[id];if(!sp)return;
 const a=document.createElement('div');a.className='pb-act';
 sp.acts.forEach(x=>{const b=document.createElement('button');b.type='button';b.className='pb-btn'+(x[2]?' pb-p':'');b.dataset.l=typeof x[0]==='function'?'1':'';b.textContent=typeof x[0]==='function'?x[0]():x[0];b.addEventListener('click',x[1]);a.appendChild(b)});
 const c=document.createElement('p');c.className='pb-chips';
 box.appendChild(a);box.appendChild(c);
 const fill=()=>{let s=[];try{s=sp.stats().filter(Boolean)}catch(e){}c.textContent='';s.forEach(t=>{const i=document.createElement('span');i.textContent=t;c.appendChild(i)});c.hidden=!s.length;
  sp.acts.forEach((x,i)=>{if(typeof x[0]==='function')a.children[i].textContent=x[0]()})};
 fill();[300,1200,3000].forEach(t=>setTimeout(fill,t));addEventListener('hashchange',()=>setTimeout(fill,250));
}
function apply(){
 for(const id in IMG){
  const v=document.getElementById('v-'+id);if(!v||v.querySelector('.pb'))continue;
  const hi=v.querySelector('.hero-in');if(!hi)continue;
  const k=IMG[id];
  const s=document.createElement('section');s.className='pb';s.dataset.pb=k;
  s.innerHTML='<div class="pb-pic"><img src="icons/pb-'+k+'.webp" srcset="icons/pb-'+k+'-900.webp 900w,icons/pb-'+k+'.webp 1672w" sizes="(max-width:640px) 140vw,100vw" width="1672" height="940" alt="" decoding="async"></div>';
  const w=document.createElement('div');w.className='pb-in';hi.before(s);s.appendChild(w);w.appendChild(hi);
  build(id,hi.firstElementChild||hi);
 }
}
apply();addEventListener('load',apply);addEventListener('hashchange',apply);
})();
