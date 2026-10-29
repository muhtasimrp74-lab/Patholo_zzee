export {};
type Rec=Record<string,any>;
/* ---- Textbook (Robbins) ---- */
{const T=mkView('textbook','Textbook','Textbook','Robbins Pathologic Basis of Disease, chapter by chapter. Key concepts and morphology are set apart; chapters you open are saved for offline reading.');
 const E=(t:any)=>String(t).replace(/[&<>"]/g,(c:string)=>(({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'} as Rec)[c]));
 const SKB='<div class="zsk" role="status" aria-label="Loading chapter"><i class="h"></i><i class="xs"></i><i></i><i></i><i class="s"></i><i class="b"></i><i></i><i class="s"></i><i></i><i class="xs"></i><i></i><i class="s"></i></div>',SKH='<div class="zsk" role="status" aria-label="Loading textbook"><i class="h"></i><i class="xs"></i><div class="zsk-grid">'+'<i></i>'.repeat(6)+'</div></div>';
 let IDX:any=null,tok=0,cur:any=null,tkr:any=0,hf='all',hq='',lf=0,rf=0;
 const J=(k:any)=>{try{return JSON.parse(zzStore.getItem(k)||'{}')}catch(e){return {}}},W=(k:any,o:any)=>{try{zzStore.setItem(k,JSON.stringify(o))}catch(e){}};
 const P=document.body.appendChild(Object.assign(document.createElement('div'),{id:'tbprog',innerHTML:'<i></i>'}));
 const GR:[string,string,(n:number)=>boolean][]=[['Part A','General pathology',(n:any)=>n<=10],['Part B','Haematology',(n:any)=>n===13||n===14],['Part C','Systemic pathology',()=>true]];
 const fmtMin=(m:any)=>m>=60?Math.floor(m/60)+'h'+(m%60?' '+(m%60)+'m':''):m+'m';
 const stat=(c:any,D:any,Po:any)=>D[c.id]?'done':(Po[c.id]>.02&&Po[c.id]<.97?'prog':'new');
 const tile=(c:any,D:any,Po:any)=>{const s=stat(c,D,Po),pc=Math.round((Po[c.id]||0)*100);
  return `<a class="tbtile ${s}" href="#/textbook/${c.id}"><span class="n">${c.n}</span><span class="tbt-x"><b>${E(c.title)}</b><small>${c.pages?'pp. '+c.pages[0]+'–'+c.pages[1]+' · ':''}~${fmtMin(c.min)}${c.figs?' · '+c.figs+' figures':''}</small>${s==='prog'?`<span class="tbpb" role="img" aria-label="${pc}% read"><i style="width:${pc}%"></i></span>`:''}</span><span class="tbst">${s==='done'?'✓ Read':s==='prog'?pc+'%':''}</span></a>`};

 /* ---------- scroll bar inside a chapter (draggable, with section marks) ---------- */
 const SB=document.body.appendChild(Object.assign(document.createElement('div'),{id:'tbsc',hidden:true,innerHTML:'<button type="button" class="tbsc-up" aria-label="Back to top"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 14l6-6 6 6"/></svg></button><div class="tbsc-track" role="scrollbar" aria-orientation="vertical" aria-label="Scroll through this chapter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><span class="tbsc-ticks"></span><i class="tbsc-thumb"></i><b class="tbsc-pct">0%</b></div>'}));
 const TR=SB.querySelector<HTMLElement>('.tbsc-track'),TH=SB.querySelector<HTMLElement>('.tbsc-thumb'),TP=SB.querySelector<HTMLElement>('.tbsc-pct'),TK=SB.querySelector<HTMLElement>('.tbsc-ticks'),UP=SB.querySelector<HTMLElement>('.tbsc-up');
 let drag:any=null,pt:any=0;
 const span=()=>Math.max(0,document.documentElement.scrollHeight-innerHeight);
 function layout(ticks?:any){
  if(!cur){SB.hidden=true;return}
  const H=document.documentElement.scrollHeight,vh=innerHeight,sp=span();
  if(sp<80){SB.hidden=true;return}
  SB.hidden=false;
  const tl=TR!.clientHeight;if(!tl)return;
  const th=Math.max(40,Math.min(tl,tl*vh/H)),r=Math.min(1,Math.max(0,scrollY/sp)),y=r*(tl-th);
  TH!.style.height=th+'px';TH!.style.transform='translateY('+y+'px)';
  TP!.textContent=Math.round(r*100)+'%';TP!.style.transform='translateY('+(y+th/2)+'px) translateY(-50%)';
  TR!.setAttribute('aria-valuenow',String(Math.round(r*100)));
  if(ticks)TK!.innerHTML=[...T.querySelectorAll('.tbs')].map(s=>{const t=s.querySelector('.tbs-t'),q=Math.min(1,(s.getBoundingClientRect().top+scrollY)/sp);
   return `<u style="top:${(q*(tl-th)+th/2-1).toFixed(1)}px" title="${E(t?t.textContent.trim():'')}"></u>`}).join('')}
 const jump=(clientY:any,grab:any)=>{const rc=TR!.getBoundingClientRect(),avail=rc.height-TH!.offsetHeight;if(avail<=0)return;
  scrollTo({top:Math.min(1,Math.max(0,(clientY-rc.top-grab)/avail))*span(),behavior:'instant'})};
 TR!.addEventListener('pointerdown',e=>{e.preventDefault();const rc=TH!.getBoundingClientRect(),onT=e.clientY>=rc.top&&e.clientY<=rc.bottom;
  drag={grab:onT?e.clientY-rc.top:TH!.offsetHeight/2};try{TR!.setPointerCapture(e.pointerId)}catch(x){}
  SB.classList.add('drag');if(!onT)jump(e.clientY,drag.grab);TR!.focus({preventScroll:true})});
 TR!.addEventListener('pointermove',e=>{if(drag)jump(e.clientY,drag.grab)});
 ['pointerup','pointercancel'].forEach(t=>TR!.addEventListener(t,()=>{drag=null;SB.classList.remove('drag')}));
 TR!.addEventListener('keydown',e=>{const k=e.key,s=innerHeight*.9;let y:any=null;
  if(k==='ArrowDown')y=scrollY+80;else if(k==='ArrowUp')y=scrollY-80;else if(k==='PageDown')y=scrollY+s;else if(k==='PageUp')y=scrollY-s;else if(k==='Home')y=0;else if(k==='End')y=span();
  if(y!==null){e.preventDefault();scrollTo({top:Math.max(0,Math.min(span(),y)),behavior:'instant'})}});
 UP!.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
 if(window.ResizeObserver)new ResizeObserver(()=>{cancelAnimationFrame(rf);rf=requestAnimationFrame(()=>layout(true))}).observe(T);
 addEventListener('resize',()=>{cancelAnimationFrame(rf);rf=requestAnimationFrame(()=>layout(true))});

 function onScroll(){if(!cur){P.style.display='none';layout();return}const h=document.documentElement.scrollHeight-innerHeight,r=h>0?Math.min(1,Math.max(0,scrollY/h)):0;P.style.display='block';(P.firstChild as HTMLElement).style.width=(r*100)+'%';
  if(!lf)lf=requestAnimationFrame(()=>{lf=0;layout()});
  SB.classList.add('show');clearTimeout(pt);pt=setTimeout(()=>SB.classList.remove('show'),1000);
  clearTimeout(tkr);tkr=setTimeout(()=>{if(cur&&location.hash.split('/')[2]===cur){const o=J('tbPos');o[cur]=+r.toFixed(3);W('tbPos',o);mark(cur,o[cur])}},400)}  /* only while this chapter is still open */
 /* where you are on this device (tbAt, not synced): the paragraph at the top of the screen, how far down it sits, and the sections you closed */
 function mark(ch:any,r:any){const bd:any=T.querySelector('#tbbody');if(!bd||bd.dataset.ch!==ch)return;
  let a:any=null;const hit:any=document.elementFromPoint(innerWidth/2,120);if(hit&&bd.contains(hit))a=hit.closest('[data-b]');
  if(!a)for(const e of bd.querySelectorAll('[data-b]') as any){const q=e.getBoundingClientRect();if(q.height&&q.bottom>96){a=e;break}}
  const o=J('tbAt');o[ch]={b:a?a.dataset.b:'',o:a?Math.round(a.getBoundingClientRect().top):0,r,s:[...bd.querySelectorAll('.tbs.shut')].map((x:any)=>x.dataset.a).filter(Boolean),t:Date.now()};
  const ks=Object.keys(o);if(ks.length>40)ks.sort((x,y)=>(o[x].t||0)-(o[y].t||0)).slice(0,ks.length-40).forEach(k=>delete o[k]);W('tbAt',o)}
 /* reopen a chapter as you left it: close the same sections, then put the same paragraph back at the same height; repeat briefly while
    figures load, unless you start scrolling. Falls back to the synced fraction when that is newer (read further on another device). */
 function resume(ch:any,s:any,my:any){const m:any=J('tbAt')[ch];if(!m||typeof m!=='object'||!m.b)return false;
  if(typeof s==='number'&&(s<=.02||s>=.97||(typeof m.r==='number'&&Math.abs(m.r-s)>.01)))return false;
  const bd:any=T.querySelector('#tbbody'),q=(v:any)=>String(v).replace(/["\\]/g,'');
  if(Array.isArray(m.s))m.s.forEach((a:any)=>{const x=bd.querySelector('.tbs[data-a="'+q(a)+'"]');if(x)tog(x,false)});
  const el:any=bd.querySelector('[data-b="'+q(m.b)+'"]');if(!el)return false;
  const sec=el.closest('.tbs');if(sec&&sec.classList.contains('shut'))tog(sec,true);
  const off=Number.isFinite(+m.o)?+m.o:0;let mine=false;const stop=()=>{mine=true};
  ['wheel','touchstart','keydown'].forEach(e=>addEventListener(e,stop,{once:true,passive:true,capture:true}));
  const go=()=>{if(mine||my!==tok||!el.isConnected)return;const y=scrollY+el.getBoundingClientRect().top-off;if(Math.abs(y-scrollY)>1)scrollTo(0,Math.max(0,y))};
  go();[60,250,600,1200].forEach(t=>setTimeout(go,t));return true}
 addEventListener('scroll',onScroll,{passive:true});

 /* ---------- home: progress, continue card, search + filters, chapters by part ---------- */
 function paint(){const g=document.getElementById('tbgrid');if(!g||!IDX)return;
  const C=IDX.chapters,D=J('tbDone'),Po=J('tbPos'),q=hq.trim().toLowerCase().replace(/^ch(apter)?\s*/,'');
  const ok=(c:any)=>{const s=stat(c,D,Po);if(hf==='prog'&&s!=='prog')return false;if(hf==='unread'&&s==='done')return false;if(hf==='read'&&s!=='done')return false;
   return !q||c.title.toLowerCase().includes(q)||String(c.n)===q};
  let out='';
  GR.forEach((gp,gi)=>{const all=C.filter((c:any)=>GR.findIndex(x=>x[2](c.n))===gi),cs=all.filter(ok);if(!cs.length)return;const nd=all.filter((c:any)=>D[c.id]).length;
   out+=`<div class="tbpart"><div class="tbpart-t"><span class="tbpart-k">${gp[0]}</span><b>${gp[1]}</b></div><span class="tbpart-c">${nd} of ${all.length} read</span><div class="tbmeter sm"><i style="width:${Math.round(nd/all.length*100)}%"></i></div></div><div class="tbl">${cs.map((c:any)=>tile(c,D,Po)).join('')}</div>`});
  g.innerHTML=out||'<div class="mempty"><b>No chapters match</b>Try a different word, or switch the filter back to All.</div>'}
 function home(){const C=IDX.chapters,D=J('tbDone'),Po=J('tbPos');
  const nd=C.filter((c:any)=>D[c.id]).length,ip=C.filter((c:any)=>stat(c,D,Po)==='prog').length,left=C.filter((c:any)=>!D[c.id]).reduce((a:any,c:any)=>a+c.min,0),pct=Math.round(nd/C.length*100);
  let last:any=null;try{last=zzStore.getItem('tbLast')}catch(e){}
  let l=C.find((x:any)=>x.id===last),lab='Continue reading';
  if(l&&D[l.id]){const i=C.indexOf(l);l=C.slice(i+1).find((x:any)=>!D[x.id])||C.find((x:any)=>!D[x.id])||null;lab='Up next'}
  else if(!l){l=C.find((x:any)=>!D[x.id])||null;lab='Start reading'}
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

 async function tb(){const p=location.hash.replace(/^#\/?/,'').split('/');if(p[0]!=='textbook'){cur=null;T.closest('.view')?.classList.remove('tb-on');onScroll();return}const my=++tok;cur=null;T.classList.remove('tbreading');T.closest('.view')?.classList.remove('tb-on');onScroll();
  if(!IDX)T.innerHTML=p[1]?SKB:SKH;
  try{if(!IDX){const r=await fetch('textbook/index.json');if(!r.ok)throw 0;IDX=await r.json()}}
  catch(e){if(my===tok)T.innerHTML='<div class="mempty"><b>Textbook unavailable</b>Open it once while online; chapters you read are then saved for offline use.</div>';return}
  if(my!==tok)return;const C=IDX.chapters,i=C.findIndex((x:any)=>x.id===p[1]),D=J('tbDone');
  if(i<0){homeK();return}
  const c=C[i],pv=C[i-1],nx=C[i+1];cur=c.id;T.classList.add('tbreading');T.closest('.view')?.classList.add('tb-on');/* reading: the landing banner steps aside (pagebanner.css) */try{zzStore.setItem('tbLast',c.id)}catch(e){}
  const bar=`<div class="tbbar"><a href="${pv?'#/textbook/'+pv.id:'#/textbook'}" ${pv?'':'aria-disabled="true"'}>‹ ${pv?'Ch '+pv.n:'Previous'}</a><a href="#/textbook">All chapters</a><a href="${nx?'#/textbook/'+nx.id:'#/textbook'}" ${nx?'':'aria-disabled="true"'}>${nx?'Ch '+nx.n:'Next'} ›</a></div>`;
  T.innerHTML=bar+`<header class="tbch" data-n="${c.n}"><div class="tbeyebrow">Chapter ${c.n}</div><h2>${E(c.title)}</h2><div class="tbch-m"><span>pp. ${c.pages?c.pages[0]+'–'+c.pages[1]:''}</span><span>~${c.min} min read</span><span>${c.sections} sections</span><span>${c.figs} figures</span><span>${c.tables} tables</span></div><div class="tbacts"><button type="button" class="tbdone" data-done="${c.id}" aria-pressed="${!!D[c.id]}">${D[c.id]?'✓ Read':'Mark as read'}</button><button type="button" class="tbdone" data-hl="1" aria-pressed="${!J('tbSet').off}">✎ Notes highlights</button></div></header><div id="tbbody">${SKB}</div>`+bar;
  T.classList.toggle('nohl',!!J('tbSet').off);document.title='Ch '+c.n+' | Textbook | Patholo_zzee';window.scrollTo(0,0);
  try{const h:string=await (window as any).zzChapter(c.id);if(my!==tok)return;{const bd=T.querySelector('#tbbody');bd.innerHTML=h;bd.dataset.ch=c.id;window.Annot&&Annot.tbAttach&&Annot.tbAttach()}
   if(p[2]&&goBlock(p[2],p[3],my))return;const s=J('tbPos')[c.id];if(!resume(c.id,s,my)&&s>.02&&s<.97)setTimeout(()=>{if(my===tok)scrollTo(0,s*(document.documentElement.scrollHeight-innerHeight))},60);onScroll();layout(true)}
  catch(e){if(my===tok)T.querySelector('#tbbody').innerHTML='<div class="mempty"><b>Chapter not available offline yet</b>Connect once to download it.</div>'}}
 /* deep link from an answer: #/textbook/<chapter>/<block id>/<question id> -> open the section, scroll to and flash the paragraph, offer a way back */
 function goBlock(b:any,q:any,my:any){const bd=T.querySelector('#tbbody');let el:any=null;try{el=bd.querySelector('[data-b="'+decodeURIComponent(b).replace(/"/g,'')+'"]')}catch(e){}
  if(!el)return false;const sec=el.closest('.tbs');if(sec)tog(sec,true);
  let back='';if(q&&/^q\d+$/.test(q)){let tp='';try{const d=(typeof DATA!=='undefined'?DATA:[]).find(x=>x[3]===q);if(d)tp=d[2]}catch(e){}
   back='<button type="button" class="tbback" data-back="'+(tp?'#/'+tp+'/'+q:'#/questions')+'">\u2039 Back to the answer</button>'}
  const old=T.querySelector('.tbback');if(old)old.remove();if(back)T.insertAdjacentHTML('afterbegin',back);
  setTimeout(()=>{if(my!==tok)return;el.scrollIntoView({block:'center'});el.classList.add('tbtarget');setTimeout(()=>el.classList.remove('tbtarget'),6000);onScroll()},80);return true}
 const tog=(s:any,open?:any)=>{const h=s.querySelector('.tbs-h');open=open===undefined?s.classList.contains('shut'):open;s.classList.toggle('shut',!open);h.setAttribute('aria-expanded',open)};
 T.addEventListener('click',(e:any)=>{let a:any;
  if(a=(e.target as Element).closest('[data-back]')){const h=a.dataset.back;if(history.length>1&&document.referrer.indexOf(location.host)>-1)history.back();else location.hash=h}
  else if(a=(e.target as Element).closest<HTMLElement>('[data-go]')){const e2=T.querySelector('[data-a="'+a.dataset.go+'"]');if(e2){const s=e2.closest('.tbs');if(s)tog(s,true);e2.scrollIntoView({behavior:'smooth',block:'start'})}}
  else if(a=(e.target as Element).closest('[data-all]')){const o=a.dataset.all==='1';T.querySelectorAll('.tbs').forEach((s:any)=>tog(s,!o));a.dataset.all=o?'0':'1';a.textContent=o?'Expand all':'Collapse all'}
  else if(a=(e.target as Element).closest('[data-hl]')){const S=J('tbSet');S.off=!S.off;W('tbSet',S);T.classList.toggle('nohl',!!S.off);a.setAttribute('aria-pressed',!S.off)}
  else if(a=(e.target as Element).closest('[data-done]')){const D=J('tbDone'),k=a.dataset.done;if(D[k])delete D[k];else D[k]=1;W('tbDone',D);a.setAttribute('aria-pressed',!!D[k]);a.textContent=D[k]?'✓ Read':'Mark as read'}
  else if(a=(e.target as Element).closest('[data-tbf]')){hf=a.dataset.tbf;T.querySelectorAll('[data-tbf]').forEach((x:any)=>x.setAttribute('aria-pressed',x===a));paint()}
  else if(a=(e.target as Element).closest('.tbs-h'))tog(a.parentElement)});
 T.addEventListener('input',(e:any)=>{if(e.target.id==='tbq'){hq=e.target.value;paint()}});
 T.addEventListener('keydown',(e:any)=>{if(e.key!=='Enter'&&e.key!==' ')return;const g=(e.target as Element).closest&&(e.target as Element).closest<HTMLElement>('[data-go]');if(g){e.preventDefault();g.click();return}const h=(e.target as Element).closest&&(e.target as Element).closest('.tbs-h');if(h){e.preventDefault();tog(h.parentElement)}});
 /* ready before the first swipe (like a game's loading phase): the landing is built in the background and only rebuilt when it would change */
 const homeK=()=>{const k=JSON.stringify([J('tbDone'),J('tbPos')]);if((T as any).__k===k&&T.querySelector('.tbhero'))return;(T as any).__k=k;home()};
 ((window as any).zzPre=(window as any).zzPre||{}).textbook=async()=>{if(/^#\/textbook/.test(location.hash))return;try{if(!IDX){const r=await fetch('textbook/index.json');if(!r.ok)return;IDX=await r.json()}if(!/^#\/textbook/.test(location.hash))homeK()}catch(e){}};
 addEventListener('hashchange',tb);setTimeout(tb,0)}
