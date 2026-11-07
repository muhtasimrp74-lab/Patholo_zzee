/* Chapters: each card gets its chapter artwork (icons/ch/<id>.webp, original art from tools/gen_chapter_art.py) and a bookmark
   (saved on this device); a SAVED chip shows only bookmarked chapters. A button cannot sit inside the card's link, so each card is
   wrapped (div.zz-tw) with the link and its bookmark side by side; the wrapper mirrors the link's hidden state for the filters. */
(()=>{const K='zzChapterBm',get=()=>{try{const a=JSON.parse(localStorage.getItem(K)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}},put=a=>{try{localStorage.setItem(K,JSON.stringify(a))}catch(e){}};
 const ICON='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M7 3.5h10a1 1 0 0 1 1 1V21l-6-4.2L6 21V4.5a1 1 0 0 1 1-1z"/></svg>';
 const mirror=new MutationObserver(ms=>ms.forEach(m=>{const w=m.target.parentElement;if(w&&w.classList.contains('zz-tw'))w.hidden=m.target.hidden}));
 const idOf=a=>(a.getAttribute('href')||'').replace(/^#\//,'');
 function wrap(v){const bm=get();v.querySelectorAll('a.topic').forEach(a=>{if(a.parentElement.classList.contains('zz-tw'))return;const id=idOf(a);if(!/^[a-z0-9]+$/i.test(id))return;
   a.style.setProperty('--zz-art','url("icons/ch/'+id+'.webp")');a.classList.add('zz-art');
   const w=document.createElement('div');w.className='zz-tw';w.hidden=a.hidden;a.before(w);w.append(a);
   const b=document.createElement('button'),t=a.querySelector('h3');b.type='button';b.className='zz-bm';b.innerHTML=ICON;b.dataset.id=id;
   const on=bm.includes(id);b.setAttribute('aria-pressed',String(on));w.classList.toggle('on',on);b.setAttribute('aria-label','Bookmark: '+(t?t.textContent.trim():id));w.append(b);
   mirror.observe(a,{attributes:true,attributeFilter:['hidden']})});chip(v)}
 function chip(v){const c=v.querySelector('#pchips');if(!c||c.querySelector('.zz-saved'))return;const b=document.createElement('button');b.type='button';b.className='zz-saved';b.setAttribute('aria-pressed','false');b.textContent='Saved';
  b.addEventListener('click',e=>{e.stopPropagation();const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(on));v.classList.toggle('zz-saved-only',on);empty(v)});
  const sp=c.querySelector('.sp');sp?sp.before(b):c.append(b);
  const n=document.createElement('p');n.className='zz-saved-empty';n.textContent='No saved chapters yet. Tap the bookmark on a chapter to save it here.';c.after(n)}
 const empty=v=>v.classList.toggle('zz-saved-none',!v.querySelector('.zz-tw.on'));
 document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.zz-bm');if(!b)return;e.preventDefault();e.stopPropagation();
  const id=b.dataset.id,a=get(),on=!a.includes(id),n=on?[...a,id]:a.filter(x=>x!==id);put(n);
  document.querySelectorAll('.zz-bm[data-id="'+id+'"]').forEach(x=>{x.setAttribute('aria-pressed',String(on));x.parentElement.classList.toggle('on',on)});const v=document.getElementById('v-qa');v&&empty(v)},true);
 const go=()=>{const v=document.getElementById('v-qa');if(!v)return;wrap(v);let q=0;new MutationObserver(()=>{if(!q)q=requestAnimationFrame(()=>{q=0;wrap(v)})}).observe(v,{childList:true,subtree:true})};
 document.readyState==='loading'?addEventListener('DOMContentLoaded',go):go()})();
