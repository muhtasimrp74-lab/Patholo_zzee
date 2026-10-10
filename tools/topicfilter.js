/* ===== filter chips on every topic page ===== */
(function(){
const FILT=[['all','All'],['imp','Important'],['fav','Favourites'],['bm','Bookmarked'],['note','With note'],['nl','Not learned'],['l','Learned']];
const has=(c,id)=>Array.isArray(c)?c.includes(id):!!(c&&c[id]);
function test(k,card){const id=card.id;
 if(k==='imp')return !!card.querySelector('.xm .imp');
 if(k==='fav')return has(S.fav,id);if(k==='bm')return has(S.bm,id);if(k==='note')return has(S.notes,id)&&String(S.notes[id]).trim()!=='';
 if(k==='l')return has(S.learned,id);if(k==='nl')return !has(S.learned,id);return true}
function apply(v){const k=v.dataset.tf||'all';let n=0;
 v.querySelectorAll('article.card[id^=q]').forEach(c=>{const ok=test(k,c);c.classList.toggle('tf-hide',!ok);if(ok)n++});
 const m=v.querySelector('.tf-n');if(m)m.textContent=k==='all'?'':n+' shown';
 let e=v.querySelector('.tf-empty');if(k!=='all'&&!n){if(!e){e=document.createElement('p');e.className='tf-empty';e.textContent='No questions match this filter.';v.querySelector('.tf-row').after(e)}}else if(e)e.remove()}
document.querySelectorAll('.view').forEach(v=>{const bar=v.querySelector('.bar');if(!bar||!v.querySelector('article.card[id^=q]'))return;
 const row=document.createElement('div');row.className='tf-row';row.setAttribute('role','group');row.setAttribute('aria-label','Filter questions');
 row.innerHTML=FILT.map((f,i)=>'<button type="button" class="tf-c" data-k="'+f[0]+'" aria-pressed="'+(i===0)+'">'+f[1]+'</button>').join('')+'<span class="tf-n"></span>';
 bar.after(row);
 row.addEventListener('click',e=>{const b=e.target.closest('.tf-c');if(!b)return;v.dataset.tf=b.dataset.k;row.querySelectorAll('.tf-c').forEach(x=>x.setAttribute('aria-pressed',x===b));apply(v)});
 v.addEventListener('click',()=>setTimeout(()=>{if(v.dataset.tf&&v.dataset.tf!=='all')apply(v)},60));
});
})();
