/* header: on narrow screens the secondary controls (theme, text and reading, fullscreen, listen, ...) sit behind one settings
   button, so the header is not crowded against Start revising; Annotate (and the reader's prev / next) stay visible. The buttons
   stay inside #tools, so its delegated click handler and '#tools [data-t=...]' lookups keep working. Wide screens show them inline. */
(()=>{const go=()=>{const t=document.getElementById('tools');if(!t||t.querySelector('.zz-more'))return;
 const keep=new Set(['ink','prev','next']),sec=[...t.children].filter(b=>b.tagName==='BUTTON'&&!keep.has(b.dataset.t));if(sec.length<2)return;
 const btn=document.createElement('button');btn.type='button';btn.className='zz-more-t';btn.setAttribute('aria-label','Display settings');btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls','zz-more');
 btn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>';
 const box=document.createElement('div');box.className='zz-more';box.id='zz-more';box.setAttribute('role','group');box.setAttribute('aria-label','Display settings');sec.forEach(b=>box.append(b));t.append(btn,box);
 const set=o=>{t.classList.toggle('zz-more-on',o);btn.setAttribute('aria-expanded',String(o))};
 btn.addEventListener('click',e=>{e.stopPropagation();set(!t.classList.contains('zz-more-on'))});
 document.addEventListener('click',e=>{if(t.classList.contains('zz-more-on')&&!t.contains(e.target))set(false)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&t.classList.contains('zz-more-on')){set(false);btn.focus()}});addEventListener('hashchange',()=>set(false))};
 document.readyState==='loading'?addEventListener('DOMContentLoaded',go):go()})();
