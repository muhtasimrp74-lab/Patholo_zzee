/* ---- Textbook (Robbins) ---- */
{const T=mkView('textbook','Textbook','Textbook','Robbins Pathologic Basis of Disease, chapter by chapter. Key concepts and morphology are set apart; chapters you open are saved for offline reading.');
 const E=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const SKB='<div class="zsk" role="status" aria-label="Loading chapter"><i class="h"></i><i class="xs"></i><i></i><i></i><i class="s"></i><i class="b"></i><i></i><i class="s"></i><i></i><i class="xs"></i><i></i><i class="s"></i></div>',SKH='<div class="zsk" role="status" aria-label="Loading textbook"><i class="h"></i><i class="xs"></i><div class="zsk-grid">'+'<i></i>'.repeat(6)+'</div></div>';
 let IDX=null,tok=0,cur=null,tkr=0,hf='all',hq='',lf=0,rf=0;
 const J=(k)=>{try{return JSON.parse(localStorage.getItem(k)||'{}')}catch(e){return {}}},W=(k,o)=>{try{localStorage.setItem(k,JSON.stringify(o))}catch(e){}};
 const P=document.body.appendChild(Object.assign(document.createElement('div'),{id:'tbprog',innerHTML:'<i></i>'}));
 const GR=[['Part A','General pathology',n=>n<=10],['Part B','Haematology',n=>n===13||n===14],['Part C','Systemic pathology',()=>true]];
 const fmtMin=m=>m>=60?Math.floor(m/60)+'h'+(m%60?' '+(m%60)+'m':''):m+'m';
 const stat=(c,D,Po)=>D[c.id]?'done':(Po[c.id]>.02&&Po[c.id]<.97?'prog':'new');
 const tile=(c,D,Po)=>{const s=stat(c,D,Po),pc=Math.round((Po[c.id]||0)*100);
  return `<a class="tbtile ${s}" href="#/textbook/${c.id}"><span class="n">${c.n}</span><span class="tbt-x"><b>${E(c.title)}</b><small>${c.pages?'pp. '+c.pages[0]+'–'+c.pages[1]+' · ':''}~${fmtMin(c.min)}${c.figs?' · '+c.figs+' figures':''}</small>${s==='prog'?`<span class="tbpb" role="img" aria-label="${pc}% read"><i style="width:${pc}%"></i></span>`:''}</span><span class="tbst">${s==='done'?'✓ Read':s==='prog'?pc+'%':''}</span></a>`};

 /* ---------- scroll bar inside a chapter (draggable, with section marks) ---------- */
 const SB=document.body.appendChild(Object.assign(document.createElement('div'),{id:'tbsc',hidden:true,innerHTML:'<button type="button" class="tbsc-up" aria-label="Back to top"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 14l6-6 6 6"/></svg></button><div class="tbsc-track" role="scrollbar" aria-orientation="vertical" aria-label="Scroll through this chapter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><span class="tbsc-ticks"></span><i class="tbsc-thumb"></i><b class="tbsc-pct">0%</b></div>'}));
 const TR=SB.querySelector('.tbsc-track'),TH=SB.querySelector('.tbsc-thumb'),TP=SB.querySelector('.tbsc-pct'),TK=SB.querySelector('.tbsc-ticks'),UP=SB.querySelector('.tbsc-up');
 let drag=null,pt=0;
 const span=()=>Math.max(0,document.documentElement.scrollHeight-innerHeight);
 function layout(ticks){
  if(!cur){SB.hidden=true;return}
  const H=document.documentElement.scrollHeight,vh=innerHeight,sp=span();
  if(sp<80){SB.hidden=true;return}
  SB.hidden=false;
  const tl=TR.clientHeight;if(!tl)return;
  const th=Math.max(40,Math.min(tl,tl*vh/H)),r=Math.min(1,Math.max(0,scrollY/sp)),y=r*(tl-th);
  TH.style.height=th+'px';TH.style.transform='translateY('+y+'px)';
  TP.textContent=Math.round(r*100)+'%';TP.style.transform='translateY('+(y+th/2)+'px) translateY(-50%)';
  TR.setAttribute('aria-valuenow',Math.round(r*100));
  if(ticks)TK.innerHTML=[...T.querySelectorAll('.tbs')].map(s=>{const t=s.querySelector('.tbs-t'),q=Math.min(1,(s.getBoundingClientRect().top+scrollY)/sp);
   return `<u style="top:${(q*(tl-th)+th/2-1).toFixed(1)}px" title="${E(t?t.textContent.trim():'')}"></u>`}).join('')}
 const jump=(clientY,grab)=>{const rc=TR.getBoundingClientRect(),avail=rc.height-TH.offsetHeight;if(avail<=0)return;
  scrollTo({top:Math.min(1,Math.max(0,(clientY-rc.top-grab)/avail))*span(),behavior:'instant'})};
 TR.addEventListener('pointerdown',e=>{e.preventDefault();const rc=TH.getBoundingClientRect(),onT=e.clientY>=rc.top&&e.clientY<=rc.bottom;
  drag={grab:onT?e.clientY-rc.top:TH.offsetHeight/2};try{TR.setPointerCapture(e.pointerId)}catch(x){}
  SB.classList.add('drag');if(!onT)jump(e.clientY,drag.grab);TR.focus({preventScroll:true})});
 TR.addEventListener('pointermove',e=>{if(drag)jump(e.clientY,drag.grab)});
 ['pointerup','pointercancel'].forEach(t=>TR.addEventListener(t,()=>{drag=null;SB.classList.remove('drag')}));
 TR.addEventListener('keydown',e=>{const k=e.key,s=innerHeight*.9;let y=null;
  if(k==='ArrowDown')y=scrollY+80;else if(k==='ArrowUp')y=scrollY-80;else if(k==='PageDown')y=scrollY+s;else if(k==='PageUp')y=scrollY-s;else if(k==='Home')y=0;else if(k==='End')y=span();
  if(y!==null){e.preventDefault();scrollTo({top:Math.max(0,Math.min(span(),y)),behavior:'instant'})}});
 UP.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
 if(window.ResizeObserver)new ResizeObserver(()=>{cancelAnimationFrame(rf);rf=requestAnimationFrame(()=>layout(true))}).observe(T);
 addEventListener('resize',()=>{cancelAnimationFrame(rf);rf=requestAnimationFrame(()=>layout(true))});

 function onScroll(){if(!cur){P.style.display='none';layout();return}const h=document.documentElement.scrollHeight-innerHeight,r=h>0?Math.min(1,Math.max(0,scrollY/h)):0;P.style.display='block';P.firstChild.style.width=(r*100)+'%';
  if(!lf)lf=requestAnimationFrame(()=>{lf=0;layout()});
  SB.classList.add('show');clearTimeout(pt);pt=setTimeout(()=>SB.classList.remove('show'),1000);
  clearTimeout(tkr);tkr=setTimeout(()=>{if(cur){const o=J('tbPos');o[cur]=+r.toFixed(3);W('tbPos',o)}},400)}
 addEventListener('scroll',onScroll,{passive:true});

 /* ---------- home: progress, continue card, search + filters, chapters by part ---------- */
 function paint(){const g=document.getElementById('tbgrid');if(!g||!IDX)return;
  const C=IDX.chapters,D=J('tbDone'),Po=J('tbPos'),q=hq.trim().toLowerCase().replace(/^ch(apter)?\s*/,'');
  const ok=c=>{const s=stat(c,D,Po);if(hf==='prog'&&s!=='prog')return false;if(hf==='unread'&&s==='done')return false;if(hf==='read'&&s!=='done')return false;
   return !q||c.title.toLowerCase().includes(q)||String(c.n)===q};
  let out='';
  GR.forEach((gp,gi)=>{const all=C.filter(c=>GR.findIndex(x=>x[2](c.n))===gi),cs=all.filter(ok);if(!cs.length)return;const nd=all.filter(c=>D[c.id]).length;
   out+=`<div class="tbpart"><div class="tbpart-t"><span class="tbpart-k">${gp[0]}</span><b>${gp[1]}</b></div><span class="tbpart-c">${nd} of ${all.length} read</span><div class="tbmeter sm"><i style="width:${Math.round(nd/all.length*100)}%"></i></div></div><div class="tbl">${cs.map(c=>tile(c,D,Po)).join('')}</div>`});
  g.innerHTML=out||'<div class="mempty"><b>No chapters match</b>Try a different word, or switch the filter back to All.</div>'}
 function home(){const C=IDX.chapters,D=J('tbDone'),Po=J('tbPos');
  const nd=C.filter(c=>D[c.id]).length,ip=C.filter(c=>stat(c,D,Po)==='prog').length,left=C.filter(c=>!D[c.id]).reduce((a,c)=>a+c.min,0),pct=Math.round(nd/C.length*100);
  let last=null;try{last=localStorage.getItem('tbLast')}catch(e){}
  let l=C.find(x=>x.id===last),lab='Continue reading';
  if(l&&D[l.id]){const i=C.indexOf(l);l=C.slice(i+1).find(x=>!D[x.id])||C.find(x=>!D[x.id])||null;lab='Up next'}
  else if(!l){l=C.find(x=>!D[x.id])||null;lab='Start reading'}
  else if(!(Po[l.id]>.02))lab='Start reading';
  const lp=l?Math.round((Po[l.id]||0)*100):0,sh=lab==='Continue reading'&&lp>0;
  const fl=[['all','All',C.length],['prog','In progress',ip],['unread','Unread',C.length-nd],['read','Read',nd]];
  T.innerHTML=`<div class="tbhero" data-n="R"><div class="tbeyebrow">Robbins · 11th edition</div><h2>${E(IDX.title)}</h2><p>${C.length} chapters, cleaned for reading and linked to your question bank.</p>
   <div class="tbstats"><div><b>${nd}<small> / ${C.length}</small></b><span>chapters read</span></div><div><b>${ip}</b><span>in progress</span></div><div><b>${left?fmtMin(left):'Done'}</b><span>${left?'reading left':'everything read'}</span></div></div>
   <div class="tbmeter" role="img" aria-label="${pct}% of chapters read"><i style="width:${pct}%"></i></div><small>${pct}% complete</small></div>`
   +(l?`<a class="tbcont" href="#/textbook/${l.id}"><span class="tbcont-t"><small>${lab}</small>Ch ${l.n} · ${E(l.title)}${sh?`<span class="tbpb" role="img" aria-label="${lp}% read"><i style="width:${lp}%"></i></span>`:''}</span><span class="tbcont-go">${sh?lp+'% ':''}›</span></a>`:'')
   +`<div class="tbtools"><label class="tbsearch"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="tbq" type="search" placeholder="Search chapters, e.g. inflammation or 5" value="${E(hq)}" autocomplete="off" aria-label="Search chapters"></label>
   <div class="tbfil" role="group" aria-label="Filter chapters">${fl.map(f=>`<button type="button" data-tbf="${f[0]}" aria-pressed="${hf===f[0]}">${f[1]}<em>${f[2]}</em></button>`).join('')}</div></div><div id="tbgrid"></div>`;
  paint();document.title='Textbook | Patholo_zzee'}

 async function tb(){const p=location.hash.replace(/^#\/?/,'').split('/');if(p[0]!=='textbook'){cur=null;onScroll();return}const my=++tok;cur=null;T.classList.remove('tbreading');onScroll();
  if(!IDX)T.innerHTML=p[1]?SKB:SKH;
  try{if(!IDX){const r=await fetch('textbook/index.json');if(!r.ok)throw 0;IDX=await r.json()}}
  catch(e){if(my===tok)T.innerHTML='<div class="mempty"><b>Textbook unavailable</b>Open it once while online; chapters you read are then saved for offline use.</div>';return}
  if(my!==tok)return;const C=IDX.chapters,i=C.findIndex(x=>x.id===p[1]),D=J('tbDone');
  if(i<0){home();return}
  const c=C[i],pv=C[i-1],nx=C[i+1];cur=c.id;T.classList.add('tbreading');try{localStorage.setItem('tbLast',c.id)}catch(e){}
  const bar=`<div class="tbbar"><a href="${pv?'#/textbook/'+pv.id:'#/textbook'}" ${pv?'':'aria-disabled="true"'}>‹ ${pv?'Ch '+pv.n:'Previous'}</a><a href="#/textbook">All chapters</a><a href="${nx?'#/textbook/'+nx.id:'#/textbook'}" ${nx?'':'aria-disabled="true"'}>${nx?'Ch '+nx.n:'Next'} ›</a></div>`;
  T.innerHTML=bar+`<header class="tbch" data-n="${c.n}"><div class="tbeyebrow">Chapter ${c.n}</div><h2>${E(c.title)}</h2><div class="tbch-m"><span>pp. ${c.pages?c.pages[0]+'–'+c.pages[1]:''}</span><span>~${c.min} min read</span><span>${c.sections} sections</span><span>${c.figs} figures</span><span>${c.tables} tables</span></div><div class="tbacts"><button type="button" class="tbdone" data-done="${c.id}" aria-pressed="${!!D[c.id]}">${D[c.id]?'✓ Read':'Mark as read'}</button><button type="button" class="tbdone" data-hl="1" aria-pressed="${!J('tbSet').off}">✎ Notes highlights</button></div></header><div id="tbbody">${SKB}</div>`+bar;
  T.classList.toggle('nohl',!!J('tbSet').off);document.title='Ch '+c.n+' | Textbook | Patholo_zzee';window.scrollTo(0,0);
  try{const r=await fetch('textbook/'+c.id+'.html');if(!r.ok)throw 0;const h=await r.text();if(my!==tok)return;T.querySelector('#tbbody').innerHTML=h;
   const s=J('tbPos')[c.id];if(s>.02&&s<.97)setTimeout(()=>{if(my===tok)scrollTo(0,s*(document.documentElement.scrollHeight-innerHeight))},60);onScroll();layout(true)}
  catch(e){if(my===tok)T.querySelector('#tbbody').innerHTML='<div class="mempty"><b>Chapter not available offline yet</b>Connect once to download it.</div>'}}
 const tog=(s,open)=>{const h=s.querySelector('.tbs-h');open=open===undefined?s.classList.contains('shut'):open;s.classList.toggle('shut',!open);h.setAttribute('aria-expanded',open)};
 T.addEventListener('click',e=>{let a;
  if(a=e.target.closest('[data-go]')){const e2=T.querySelector('[data-a="'+a.dataset.go+'"]');if(e2){const s=e2.closest('.tbs');if(s)tog(s,true);e2.scrollIntoView({behavior:'smooth',block:'start'})}}
  else if(a=e.target.closest('[data-all]')){const o=a.dataset.all==='1';T.querySelectorAll('.tbs').forEach(s=>tog(s,!o));a.dataset.all=o?'0':'1';a.textContent=o?'Expand all':'Collapse all'}
  else if(a=e.target.closest('[data-hl]')){const S=J('tbSet');S.off=!S.off;W('tbSet',S);T.classList.toggle('nohl',!!S.off);a.setAttribute('aria-pressed',!S.off)}
  else if(a=e.target.closest('[data-done]')){const D=J('tbDone'),k=a.dataset.done;if(D[k])delete D[k];else D[k]=1;W('tbDone',D);a.setAttribute('aria-pressed',!!D[k]);a.textContent=D[k]?'✓ Read':'Mark as read'}
  else if(a=e.target.closest('[data-tbf]')){hf=a.dataset.tbf;T.querySelectorAll('[data-tbf]').forEach(x=>x.setAttribute('aria-pressed',x===a));paint()}
  else if(a=e.target.closest('.tbs-h'))tog(a.parentElement)});
 T.addEventListener('input',e=>{if(e.target.id==='tbq'){hq=e.target.value;paint()}});
 T.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const g=e.target.closest&&e.target.closest('[data-go]');if(g){e.preventDefault();g.click();return}const h=e.target.closest&&e.target.closest('.tbs-h');if(h){e.preventDefault();tog(h.parentElement)}});
 addEventListener('hashchange',tb);setTimeout(tb,0)}
