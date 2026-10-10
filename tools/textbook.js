/* ---- Textbook (Robbins) ---- */
{const T=mkView('textbook','Textbook','Textbook','Robbins Pathologic Basis of Disease, chapter by chapter. Key concepts and morphology are set apart; chapters you open are saved for offline reading.');
 const E=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 let IDX=null,tok=0,cur=null,tkr=0;
 const J=(k)=>{try{return JSON.parse(localStorage.getItem(k)||'{}')}catch(e){return {}}},W=(k,o)=>{try{localStorage.setItem(k,JSON.stringify(o))}catch(e){}};
 const P=document.body.appendChild(Object.assign(document.createElement('div'),{id:'tbprog',innerHTML:'<i></i>'}));
 const GR=[['Part A','General pathology',n=>n<=10],['Part B','Haematology',n=>n===13||n===14],['Part C','Systemic pathology',()=>true]];
 const tile=(c,d)=>`<a class="tbtile${d[c.id]?' done':''}" href="#/textbook/${c.id}"><span class="n">${c.n}</span><span><b>${E(c.title)}</b><small>${c.pages?'pp. '+c.pages[0]+'–'+c.pages[1]+' · ':''}~${c.min} min</small></span><span class="ck"></span></a>`;
 function onScroll(){if(!cur){P.style.display='none';return}const h=document.documentElement.scrollHeight-innerHeight,r=h>0?Math.min(1,Math.max(0,scrollY/h)):0;P.style.display='block';P.firstChild.style.width=(r*100)+'%';clearTimeout(tkr);tkr=setTimeout(()=>{if(cur){const o=J('tbPos');o[cur]=+r.toFixed(3);W('tbPos',o)}},400)}
 addEventListener('scroll',onScroll,{passive:true});
 async function tb(){const p=location.hash.replace(/^#\/?/,'').split('/');if(p[0]!=='textbook'){cur=null;onScroll();return}const my=++tok;cur=null;onScroll();
  try{if(!IDX){const r=await fetch('textbook/index.json');if(!r.ok)throw 0;IDX=await r.json()}}
  catch(e){if(my===tok)T.innerHTML='<div class="mempty"><b>Textbook unavailable</b>Open it once while online; chapters you read are then saved for offline use.</div>';return}
  if(my!==tok)return;const C=IDX.chapters,i=C.findIndex(x=>x.id===p[1]),D=J('tbDone');
  if(i<0){const nd=C.filter(c=>D[c.id]).length,l=C.find(x=>x.id===(()=>{try{return localStorage.getItem('tbLast')}catch(e){return null}})());
   T.innerHTML=`<div class="tbhero" data-n="R"><div class="tbeyebrow">Robbins · 11th edition</div><h2>${E(IDX.title)}</h2><p>${C.length} chapters, cleaned for reading and linked to your question bank.</p><div class="tbmeter"><i style="width:${Math.round(nd/C.length*100)}%"></i></div><small>${nd} of ${C.length} chapters read</small></div>`
    +(l?`<a class="tbcont" href="#/textbook/${l.id}"><span><small>Continue reading</small>Ch ${l.n} · ${E(l.title)}</span><span>›</span></a>`:'')
    +GR.map((g,gi)=>{const cs=C.filter(c=>GR.findIndex(x=>x[2](c.n))===gi);return cs.length?`<p class="mh">${g[0]} · ${g[1]}</p><div class="tbl">${cs.map(c=>tile(c,D)).join('')}</div>`:''}).join('');
   document.title='Textbook | Patholo_zzee';return}
  const c=C[i],pv=C[i-1],nx=C[i+1];cur=c.id;try{localStorage.setItem('tbLast',c.id)}catch(e){}
  const bar=`<div class="tbbar"><a href="${pv?'#/textbook/'+pv.id:'#/textbook'}" ${pv?'':'aria-disabled="true"'}>‹ ${pv?'Ch '+pv.n:'Previous'}</a><a href="#/textbook">All chapters</a><a href="${nx?'#/textbook/'+nx.id:'#/textbook'}" ${nx?'':'aria-disabled="true"'}>${nx?'Ch '+nx.n:'Next'} ›</a></div>`;
  T.innerHTML=bar+`<header class="tbch" data-n="${c.n}"><div class="tbeyebrow">Chapter ${c.n}</div><h2>${E(c.title)}</h2><div class="tbch-m"><span>pp. ${c.pages?c.pages[0]+'–'+c.pages[1]:''}</span><span>~${c.min} min read</span><span>${c.sections} sections</span><span>${c.figs} figures</span><span>${c.tables} tables</span></div><button type="button" class="tbdone" data-done="${c.id}" aria-pressed="${!!D[c.id]}">${D[c.id]?'✓ Read':'Mark as read'}</button></header><div id="tbbody"><div class="tbi"><p>Loading…</p></div></div>`+bar;
  document.title='Ch '+c.n+' | Textbook | Patholo_zzee';window.scrollTo(0,0);
  try{const r=await fetch('textbook/'+c.id+'.html');if(!r.ok)throw 0;const h=await r.text();if(my!==tok)return;T.querySelector('#tbbody').innerHTML=h;
   const s=J('tbPos')[c.id];if(s>.02&&s<.97)setTimeout(()=>{if(my===tok)scrollTo(0,s*(document.documentElement.scrollHeight-innerHeight))},60);onScroll()}
  catch(e){if(my===tok)T.querySelector('#tbbody').innerHTML='<div class="mempty"><b>Chapter not available offline yet</b>Connect once to download it.</div>'}}
 const tog=(s,open)=>{const h=s.querySelector('.tbs-h');open=open===undefined?s.classList.contains('shut'):open;s.classList.toggle('shut',!open);h.setAttribute('aria-expanded',open)};
 T.addEventListener('click',e=>{let a;
  if(a=e.target.closest('[data-go]')){const e2=T.querySelector('[data-a="'+a.dataset.go+'"]');if(e2){const s=e2.closest('.tbs');if(s)tog(s,true);e2.scrollIntoView({behavior:'smooth',block:'start'})}}
  else if(a=e.target.closest('[data-all]')){const o=a.dataset.all==='1';T.querySelectorAll('.tbs').forEach(s=>tog(s,!o));a.dataset.all=o?'0':'1';a.textContent=o?'Expand all':'Collapse all'}
  else if(a=e.target.closest('[data-done]')){const D=J('tbDone'),k=a.dataset.done;if(D[k])delete D[k];else D[k]=1;W('tbDone',D);a.setAttribute('aria-pressed',!!D[k]);a.textContent=D[k]?'✓ Read':'Mark as read'}
  else if(a=e.target.closest('.tbs-h'))tog(a.parentElement)});
 T.addEventListener('keydown',e=>{const h=e.target.closest&&e.target.closest('.tbs-h');if(h&&(e.key==='Enter'||e.key===' ')){e.preventDefault();tog(h.parentElement)}});
 addEventListener('hashchange',tb);setTimeout(tb,0)}
