/* ---- MCQs: home, custom practice (faceted filter), practice, timed exam, reading mode, results ---- */
{const CH=MCQDATA.ch,Q=MCQDATA.q;
 const M=mkView('mcqs','MCQs','MCQs','Practise by topic, build your own set, sit a timed mock paper, or read every question with the answers shown.');
 const V=M.closest('.view');M.classList.add('mx');
 const E=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const BY={};Q.forEach(q=>BY[q.h]=q);
 const L='ABCDE',PAPERS=['May 2026','Nov 2025','May 2025','DU-24N','DU-24M','DU-23N','DU-23M','DU-22N','DU-22M','DU-21M','DU-20N/M','DU-19Nov'];
 const ST=()=>{const m=S.mcq=S.mcq&&typeof S.mcq==='object'?S.mcq:{};m.p=m.p||{};m.bm=m.bm||[];m.hist=m.hist||[];m.o=m.o||{};m.day=m.day||{d:'',n:0};m.rd=m.rd&&typeof m.rd==='object'&&!Array.isArray(m.rd)?m.rd:{};m.rv=Array.isArray(m.rv)?m.rv:[];m.nt=m.nt&&typeof m.nt==='object'&&!Array.isArray(m.nt)?m.nt:{};m.ms=Array.isArray(m.ms)?m.ms:[];
  if(!m.msInit){m.msInit=1;Object.keys(m.p).forEach(h=>{const x=m.p[h];if(x&&x.n>(x.k||0)&&!m.ms.includes(h))m.ms.push(h)})}return m};
 const P=()=>ST().p, tn=q=>CH[q.c][1][q.t], tk=q=>q.c+'.'+q.t;
 const ok=(q,a)=>q.y?Array.isArray(a)&&a.length===5&&a.every((v,j)=>v===q.a[j]):a===q.a;
 const fmt=s=>{s=Math.max(0,Math.round(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return(h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0')};
 const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
 const today=()=>new Date().toLocaleDateString('en-CA');
 const ic={bm:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z"/></svg>',
  ok:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16.2 9.5"/></svg>',
  note:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM8.5 9h7M8.5 13h7M8.5 17h4"/></svg>',
  rev:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/></svg>',
  x:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  grid:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>',
  go:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'};
 const SR=[1,3,7,21],DAYMS=864e5;
 const record=(q,good)=>{const m=ST(),p=m.p[q.h]=m.p[q.h]||{n:0,k:0};p.n++;if(good)p.k++;p.r=good?1:0;p.ts=Date.now();if(!good&&!m.ms.includes(q.h))m.ms.push(q.h);
  {const sr=m.sr=m.sr||{},x=sr[q.h];if(!good)sr[q.h]={s:0,d:Date.now()+SR[0]*DAYMS};else if(x){const k=x.s+1;if(k>=SR.length)delete sr[q.h];else sr[q.h]={s:k,d:Date.now()+SR[k]*DAYMS}}}
  if(m.day.d!==today())m.day={d:today(),n:0};m.day.n++;window.actLog&&window.actLog(1);save()};
 const stOf=q=>{const m=ST(),p=m.p[q.h],a=[];a.push(!p||!p.n?'new':p.r?'right':'wrong');if(m.bm.includes(q.h))a.push('bm');if(q.w||q.k)a.push('key');a.push(m.rd[q.h]?'read':'unread');if(m.rv.includes(q.h))a.push('rev');if(m.nt[q.h])a.push('nt');if(m.ms.includes(q.h))a.push('ms');return a};

 /* ---------- filters ---------- */
 const emptyF=()=>({tp:new Set(),ty:new Set(),src:new Set(),tg:new Set(),pp:new Set(),st:new Set(),txt:''});
 let F=emptyF(),O={n:20,shuffle:true,mode:'practice',tpq:0};
 try{const f=ST().f;if(f){F.tp=new Set(f.tp);F.ty=new Set(f.ty);F.src=new Set(f.src);F.tg=new Set(f.tg||[]);F.pp=new Set(f.pp);F.st=new Set(f.st);F.txt=f.txt||''}Object.assign(O,ST().o)}catch(e){}
 const saveF=()=>{const m=ST();m.f={tp:[...F.tp],ty:[...F.ty],src:[...F.src],tg:[...F.tg],pp:[...F.pp],st:[...F.st],txt:F.txt};m.o=O;save()};
 const TXT=Q.map(q=>(q.q+' '+q.o.join(' ')+' '+tn(q)).toLowerCase());
 const FKEYS=['tp','ty','src','tg','pp','st'];
 const isDU=q=>(q.g||[]).some(g=>g.startsWith('DU-')),tagOf=q=>q.s==='N'?'rel':isDU(q)?'du':'oth';
 const hit=(q,f,v)=>f==='tp'?tk(q)===v:f==='ty'?q.y===+v:f==='src'?q.s===v:f==='tg'?tagOf(q)===v:f==='pp'?(q.g||[]).includes(v):stOf(q).includes(v);
 const pass=(q,i,skip)=>{for(const f of FKEYS){if(f===skip||!F[f].size)continue;let m=false;for(const v of F[f])if(hit(q,f,f==='ty'?+v:v)){m=true;break}if(!m)return false}
  return !F.txt||TXT[i].includes(F.txt)};
 const matches=()=>Q.filter((q,i)=>pass(q,i));
 const cname=['SBA (one best answer)','True / False (5 statements)'];

 /* ---------- sessions ---------- */
 let sess=null,tid=0,readN=30,readOpt={show:true,notes:true};
 const persist=()=>{if(!sess||sess.review)return;const m=ST();sess.el=elapsed();m.sess=sess;save()};
 const elapsed=()=>sess?(sess.paused?sess.el:(Date.now()-sess.t0)/1000):0;
 const nav=h=>{const t='#/mcqs'+(h?'/'+h:'');if(location.hash===t)mq();else location.hash=t};
 function start(ids,o){o=o||{};if(!ids.length){if(window.zzMcqLocked&&zzMcqLocked())(window.zzUpgrade||window.zzSignIn||Object)();return}
  sess={ids,i:0,ans:{},chk:{},mode:o.mode||'practice',t0:Date.now(),el:0,limit:o.limit||0,scope:o.scope||'Practice',n:ids.length,fl:{}};persist();nav('run')}
 const pickSet=()=>{let a=matches();if(O.shuffle)a=shuf(a);if(O.n>0)a=a.slice(0,O.n);return a.map(q=>q.h)};
 const lim=(n)=>O.tpq?n*O.tpq:0;
 const answered=(q,s)=>{const a=s.ans[q.h];return q.y?Array.isArray(a)&&a.some(v=>v>=0):a!==undefined};
 function finish(){if(!sess)return;clearInterval(tid);const m=ST(),s=sess;s.el=elapsed();
  if(s.mode==='exam')s.ids.forEach(h=>{const q=BY[h];if(answered(q,s))record(q,ok(q,s.ans[h]))});
  const last={ids:s.ids,ans:s.ans,mode:s.mode,el:Math.round(s.el),limit:s.limit,scope:s.scope,ts:Date.now()};
  m.last=last;let right=0;s.ids.forEach(h=>{if(ok(BY[h],s.ans[h]))right++});
  m.hist.unshift({ts:last.ts,scope:s.scope,mode:s.mode,n:s.ids.length,ok:right,el:last.el});m.hist=m.hist.slice(0,30);
  m.sess=null;sess=null;save();nav('result')}

 /* ---------- question card ---------- */
 const metaRow=(q,x)=>`<div class="mx-meta"><span class="mx-chip c">${E(tn(q))}</span><span class="mx-chip">${q.y?'T / F':'SBA'}</span>${(q.g||[]).map(g=>`<span class="mx-chip p">${E(g)}</span>`).join('')}${x||''}</div>`;
 const bmBtn=q=>`<button type="button" class="mx-bm" data-a="bm" data-h="${q.h}" aria-pressed="${ST().bm.includes(q.h)}" aria-label="Bookmark">${ic.bm}</button>`;
 /* per-question tools: mark as read, my note, revise later (stored in S.mcq.rd / .nt / .rv) */
 const nOpen=new Set();let ntT=0;
 const noteBox=q=>nOpen.has(q.h)?`<div class="mx-nbox"><label for="nt-${q.h}">My note</label><textarea class="mx-nt" id="nt-${q.h}" data-h="${q.h}" rows="3" placeholder="Write a note for this question (a mnemonic, why you got it wrong...)">${E(ST().nt[q.h]||'')}</textarea><small>Saved on this device and included in your backup</small></div>`:'';
 const qaRow=q=>{const m=ST(),h=q.h,rd=!!m.rd[h],rv=m.rv.includes(h),nt=!!m.nt[h],ms=m.ms.includes(h);
  return `<div class="mx-qa" role="group" aria-label="Question tools"><button type="button" class="mx-qb mx-qb-rd" data-a="rd" data-h="${h}" aria-pressed="${rd}">${ic.ok}<span>${rd?'Read':'Mark as read'}</span></button><button type="button" class="mx-qb mx-qb-nt${nt?' has':''}" data-a="nt" data-h="${h}" aria-expanded="${nOpen.has(h)}">${ic.note}<span>Notes</span></button><button type="button" class="mx-qb mx-qb-rv" data-a="rv" data-h="${h}" aria-pressed="${rv}">${ic.rev}<span>${rv?'In revise list':'Revise later'}</span></button>${ms||(m.p[h]&&m.p[h].n)?`<button type="button" class="mx-qb mx-qb-ms" data-a="ms" data-h="${h}" aria-pressed="${ms}">${ic.x}<span>${ms?'In mistake bank, tap to remove':'Add to mistake bank'}</span></button>`:''}</div>${noteBox(q)}`};
 const saveNote=(h,v)=>{clearTimeout(ntT);const m=ST();if(v.trim())m.nt[h]=v;else delete m.nt[h];save();
  M.querySelectorAll('.mx-qb-nt[data-h="'+h+'"]').forEach(x=>x.classList.toggle('has',!!m.nt[h]))};
 function body(q,o){ // o: ans, fb, lock, notes
  const fb=o.fb,a=o.ans,nt=o.notes!==false;let h='';
  const warn=j=>q.w&&q.w[j]?`<small class="mx-w">Note on the key: ${E(q.w[j])}</small>`:'';
  if(!q.y){
   h=q.o.map((t,j)=>{const sel=a===j,c='mx-o'+(sel?' sel':'')+(fb&&j===q.a?' ok':'')+(fb&&sel&&j!==q.a?' no':'');
    const note=fb&&nt&&q.e&&q.e[j]?`<small>${E(q.e[j])}</small>`:'';
    return `<button type="button" class="${c}" data-a="pick" data-j="${j}" ${o.lock?'disabled':''} aria-pressed="${sel}"><b>${L[j]}</b><span>${E(t)}${note}${fb?warn(j):''}</span></button>`}).join('');
  }else{
   h=q.o.map((t,j)=>{const v=a?a[j]:-1,tr=q.a[j];const c='mx-s'+(fb&&!o.st?(v===tr?' ok':v<0?' un':' no'):'');
    const note=fb&&nt&&q.e&&q.e[j]?`<small>${E(q.e[j])}</small>`:'';
    const bt=(val,lb)=>`<button type="button" data-a="tf" data-j="${j}" data-v="${val}" ${o.lock?'disabled':''} aria-pressed="${v===val}" class="${fb&&tr===val?'key':''}">${lb}</button>`;
    return `<div class="${c}"><p><b>${j+1}</b><span>${E(t)}${note}${fb?warn(j):''}</span></p><div class="mx-tf" role="group" aria-label="Statement ${j+1}">${bt(1,'True')}${bt(0,'False')}</div></div>`}).join('');
  }
  return h+(fb&&q.k?`<p class="mx-k">${E(q.k)}</p>`:'')}
 const bareAns=q=>q.e||q.y?'':`<p class="mx-ans">Answer: <b>${L[q.a]}</b>. ${E(q.o[q.a])}</p>`;

 /* ---------- run / review ---------- */
 let _ri='';
 function cntHtml(s){const n=s.ids.length,nA=s.ids.filter(h=>answered(BY[h],s)).length,f=Object.keys(s.fl||{}).length;return `<b>${nA}</b> of ${n} answered${f?` &nbsp; <b>${f}</b> flagged`:''}`}
 const usable=s=>{if(!s||!Array.isArray(s.ids))return null;const ids=s.ids.filter(h=>BY[h]);if(!ids.length)return null;
  if(ids.length!==s.ids.length){const cur=s.ids[s.i];s.ids=ids;s.n=ids.length;s.i=Math.max(0,ids.indexOf(cur));if(s.i<0)s.i=0}return s};
 function runView(review){
  const s=sess=usable(sess);if(!s){nav();return}const _y=window.scrollY,_k=s.i+(review||s.review?'r':'p');
  const q=BY[s.ids[s.i]],n=s.ids.length,rv=!!review||s.review,exam=s.mode==='exam'&&!rv;
  const fb=rv||(!exam&&!!s.chk[q.h]),lock=rv||(!exam&&!!s.chk[q.h]);
  const a=s.ans[q.h],good=fb&&ok(q,a);
  const last=s.i===n-1;
  let verdict='';
  if(fb&&!rv||rv){const ua=q.y?Array.isArray(a)&&a.some(v=>v>=0):a!==undefined;verdict=`<p class="mx-v ${good?'ok':'no'}">${good?'Correct':ua?(q.y?'Not quite: '+q.a.filter((v,j)=>a[j]===v).length+' of 5 statements right':'Not quite'):'Not answered'}</p>`}
  const act=rv?`<button type="button" class="mx-btn ghost" data-a="prev" ${s.i?'':'disabled'}>Previous</button><button type="button" class="mx-btn ghost" data-a="results">Results</button><button type="button" class="mx-btn" data-a="next" ${last?'disabled':''}>Next</button>`
   :exam?`<button type="button" class="mx-btn ghost" data-a="prev" ${s.i?'':'disabled'}>Previous</button>${last?`<button type="button" class="mx-btn" data-a="finish">Finish exam</button>`:`<button type="button" class="mx-btn" data-a="next">Next</button>`}`
   :fb?`<button type="button" class="mx-btn ghost" data-a="prev" ${s.i?'':'disabled'}>Previous</button><button type="button" class="mx-btn" data-a="${last?'finish':'next'}">${last?'See results':'Next'}</button>`
   :q.y?`<button type="button" class="mx-btn ghost" data-a="prev" ${s.i?'':'disabled'}>Previous</button><button type="button" class="mx-btn" data-a="check">Check answer</button>`
   :`<button type="button" class="mx-btn ghost" data-a="prev" ${s.i?'':'disabled'}>Previous</button><button type="button" class="mx-btn ghost" data-a="skip">Skip</button>`;
  const fl=s.fl||{},mode=rv?'Review':exam?(s.limit?'Mock exam':'Test'):'Practice';
  const strip=s.ids.map((h,i)=>{const qq=BY[h],an=answered(qq,s);let c='';if(rv||(!exam&&s.chk[h]))c=ok(qq,s.ans[h])?'ok':an?'no':'un';else if(an)c='an';if(fl[h])c+=' fg';if(i===s.i)c+=' cur';return `<button type="button" class="${c.trim()}" data-a="jump" data-i="${i}" aria-label="Question ${i+1}">${i+1}</button>`}).join('');
  const tm=!rv&&s.limit?`<span class="mx-timer" id="mx-timer" aria-live="off">${fmt(s.limit-elapsed())}</span>`:(!rv?`<span class="mx-timer" id="mx-timer">${fmt(elapsed())}</span>`:'');
  M.innerHTML=`<div class="mx-run"><div class="mx-top"><button type="button" class="mx-ib" data-a="exit" aria-label="${rv?'Close review':'Exit session'}">${ic.x}</button>
   <div class="mx-pg"><span><em class="mx-mode m-${mode.split(' ')[0].toLowerCase()}">${mode}</em><span class="mx-sc">${E(s.scope)}</span><span class="mx-of"> · ${s.i+1} of ${n}</span></span><i style="--w:${((s.i+1)/n*100).toFixed(1)}%"></i></div>${tm}
   <button type="button" class="mx-ib" data-a="pal" aria-label="Question list">${ic.grid}</button></div>
   <div class="mx-strip" role="group" aria-label="Questions">${strip}</div>${exam||s.limit?`<p class="mx-cnt">${cntHtml(s)}</p>`:''}
   <article class="mx-card" data-h="${q.h}">${metaRow(q,(rv?'':`<button type="button" class="mx-bm mx-fg" data-a="flag" aria-pressed="${!!fl[q.h]}" aria-label="Flag for review" title="Flag to come back to (F)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21V4M6 5h11l-2 4 2 4H6"/></svg></button>`)+bmBtn(q))}<h3>${E(q.q)}</h3>${q.y?'<p class="mx-hint">Mark each statement True or False.</p>':''}
   <div class="mx-opts">${body(q,{ans:a,fb,lock,notes:true})}</div>${fb?verdict+bareAns(q):''}${qaRow(q)}</article>
   <div class="mx-act">${act}</div><div class="mx-pal" id="mx-pal" hidden></div></div>`;
  if(!rv)startTimer();if(WIDE.matches)palette(true);if(_ri===_k)window.scrollTo(0,_y);else window.scrollTo(0,0);_ri=_k;const cu=M.querySelector('.mx-strip .cur');if(cu&&cu.scrollIntoView)cu.scrollIntoView({inline:'center',block:'nearest'})}
 function startTimer(){clearInterval(tid);if(!sess||sess.review)return;tid=setInterval(()=>{if(!sess){clearInterval(tid);return}
  const e=elapsed(),t=document.getElementById('mx-timer');if(sess.limit&&e>=sess.limit){finish();return}
  if(t){t.textContent=sess.limit?fmt(sess.limit-e):fmt(e);t.classList.toggle('low',!!sess.limit&&sess.limit-e<60)}
  if(((e|0)%10)===0)persist()},1000)}
 /* wide screens (desktop, Android tablets in landscape) keep the question list open as a side column (mcq.css), redrawn with each question */
 const WIDE=matchMedia('(min-width:1100px)');
 WIDE.addEventListener('change',()=>{const el=document.getElementById('mx-pal');if(!el||!sess)return;if(WIDE.matches)palette(true);else el.hidden=true});
 function palette(keep){const s=sess,el=document.getElementById('mx-pal');if(!el)return;
  if(!keep&&!el.hidden){el.hidden=true;return}
  const rv=s.review,exam=s.mode==='exam'&&!rv;
  el.innerHTML=`<div class="mx-pal-in" role="dialog" aria-label="Question list"><div class="mx-pal-h"><b>Questions</b><button type="button" class="mx-ib" data-a="pal" aria-label="Close">${ic.x}</button></div><div class="mx-pal-g">`+
   s.ids.map((h,i)=>{const q=BY[h],an=answered(q,s);let c='';
    if(rv||(!exam&&s.chk[h]))c=ok(q,s.ans[h])?'ok':an?'no':'un';else if(an)c='an';
    if(s.fl&&s.fl[h])c+=' fg';return `<button type="button" class="${c}${i===s.i?' cur':''}" data-a="jump" data-i="${i}">${i+1}</button>`}).join('')+
   `</div><p class="mx-leg2"><span><i class="an"></i>Answered</span><span><i class="un"></i>Not answered</span><span><i class="fg"></i>Flagged</span></p>${rv?'':`<button type="button" class="mx-btn" data-a="finish">${exam?'Finish exam':'Finish and see results'}</button>`}</div>`;
  el.hidden=false}
 function setAns(q,j,v){const s=sess;if(!s||s.review)return;const exam=s.mode==='exam';if(!exam&&s.chk[q.h])return;
  if(!q.y){s.ans[q.h]=j;if(!exam){s.chk[q.h]=1;record(q,ok(q,j))}}
  else{const a=s.ans[q.h]=s.ans[q.h]||[-1,-1,-1,-1,-1];a[j]=a[j]===v?-1:v}
  persist();runView()}
 function check(){const s=sess,q=BY[s.ids[s.i]];if(s.chk[q.h])return;const a=s.ans[q.h]=s.ans[q.h]||[-1,-1,-1,-1,-1];s.chk[q.h]=1;record(q,ok(q,a));persist();runView()}
 const step=d=>{const s=sess;s.i=Math.min(s.ids.length-1,Math.max(0,s.i+d));persist();runView()};
 function tryFinish(){const s=sess;const un=s.ids.filter(h=>!answered(BY[h],s)).length;
  const fg=Object.keys(s.fl||{}).length;if((un||fg)&&s.mode==='exam'&&!confirm((un?un+' question'+(un>1?'s are':' is')+' unanswered':'')+(un&&fg?' and ':'')+(fg?fg+' flagged for review':'')+'. Finish anyway?'))return;finish()}

 /* ---------- results ---------- */
 function result(){
  const l=ST().last;if(!l){nav();return}
  const qs=l.ids.map(h=>BY[h]).filter(Boolean),n=qs.length,good=qs.filter(q=>ok(q,l.ans[q.h]));
  const un=qs.filter(q=>{const a=l.ans[q.h];return q.y?!(Array.isArray(a)&&a.some(v=>v>=0)):a===undefined}).length;
  const pct=n?Math.round(good.length/n*100):0,sba=qs.filter(q=>!q.y),tf=qs.filter(q=>q.y);
  const sg=sba.filter(q=>ok(q,l.ans[q.h])).length,tg=tf.filter(q=>ok(q,l.ans[q.h])).length;
  let st=0,sa=0;tf.forEach(q=>{const a=l.ans[q.h];if(Array.isArray(a))q.a.forEach((v,j)=>{if(a[j]>=0){sa++;if(a[j]===v)st++}})});
  const wrong=qs.filter(q=>!ok(q,l.ans[q.h]));
  const byC={};qs.forEach(q=>{const c=byC[q.c]=byC[q.c]||[0,0];c[1]++;if(ok(q,l.ans[q.h]))c[0]++});
  const R=46,C=2*Math.PI*R,msg=pct>=80?'Strong result':pct>=60?'Getting there':pct>=40?'Worth another pass':'Keep going, this is how it sticks';
  M.innerHTML=`<div class="mx-res"><div class="mx-ring"><svg viewBox="0 0 110 110" aria-hidden="true"><circle cx="55" cy="55" r="${R}" class="bg"/><circle cx="55" cy="55" r="${R}" class="fg" style="stroke-dasharray:${(C*pct/100).toFixed(1)} ${C.toFixed(1)}"/></svg><div><b>${pct}%</b><small>${good.length} of ${n}</small></div></div>
   <div class="mx-rs"><h2>${msg}</h2><p>${E(l.scope)} · ${l.mode==='exam'?'Timed exam':'Practice'} · ${fmt(l.el)}${un?` · ${un} not answered`:''}</p>
   <div class="mx-kv"><span><b>${sba.length?sg+' / '+sba.length:'–'}</b>SBA correct</span><span><b>${tf.length?tg+' / '+tf.length:'–'}</b>T / F fully correct</span><span><b>${sa?st+' / '+sa:'–'}</b>T / F statements</span></div></div></div>
   <div class="mx-ctas"><button type="button" class="mx-btn" data-a="rev" data-i="0">Review answers</button>${wrong.length?`<button type="button" class="mx-btn ghost" data-a="retry">Retry ${wrong.length} missed</button>`:''}<button type="button" class="mx-btn ghost" data-a="home">Back to MCQs</button></div>
   <p class="mx-h">By chapter</p><div class="mx-bars">${Object.keys(byC).sort((a,b)=>a-b).map(c=>{const v=byC[c];return `<div><span>${E(CH[c][0])}</span><i style="--w:${(v[0]/v[1]*100).toFixed(0)}%"></i><em>${v[0]}/${v[1]}</em></div>`}).join('')}</div>
   <p class="mx-h">All questions</p><div class="mx-pal-g static">${qs.map((q,i)=>`<button type="button" class="${ok(q,l.ans[q.h])?'ok':(q.y?Array.isArray(l.ans[q.h])&&l.ans[q.h].some(v=>v>=0):l.ans[q.h]!==undefined)?'no':'un'}" data-a="rev" data-i="${i}" title="${E(q.q)}">${i+1}</button>`).join('')}</div>`;
  window.scrollTo(0,0)}
 function review(i){const l=ST().last;if(!l){nav();return}sess={ids:l.ids,ans:l.ans,chk:{},mode:l.mode,i:+i||0,review:true,scope:l.scope,limit:0,t0:Date.now(),el:0};nav('review')}

 /* ---------- home ---------- */
 const dueIds=()=>{const sr=ST().sr||{},t=Date.now();return Object.keys(sr).filter(h=>sr[h].d<=t&&BY[h]).sort((x,y)=>sr[x].d-sr[y].d)};
 const weakIds=()=>{const p=P(),by={};Q.forEach(q=>{const x=p[q.h];if(!x||!x.n)return;const k=tk(q),o=by[k]=by[k]||{a:0,r:0};o.a++;if(x.r)o.r++});
  const bad=new Set(Object.keys(by).filter(k=>by[k].a>=3&&by[k].r/by[k].a<.7));return shuf(Q.filter(q=>bad.has(tk(q))&&!(p[q.h]&&p[q.h].r)).map(q=>q.h)).slice(0,10)};
 function stats(){const p=P();let att=0,right=0,wrong=0;Q.forEach(q=>{const x=p[q.h];if(x&&x.n){att++;x.r?right++:wrong++}});return{att,right,wrong}}
function home(){
  const m=ST(),p=P(),n=Q.length;
  let att=0,right=0,wrong=0;const ty=[[0,0],[0,0]];
  Q.forEach(q=>{const x=p[q.h];if(!x||!x.n)return;att++;ty[q.y][0]++;if(x.r){right++;ty[q.y][1]++}else wrong++});
  const left=n-att,acc=att?Math.round(right/att*100):0,sba=ty[0][0]?Math.round(ty[0][1]/ty[0][0]*100):null,tf=ty[1][0]?Math.round(ty[1][1]/ty[1][0]*100):null;
  const goal=m.goal||20,td=m.day.d===today()?m.day.n:0,gp=Math.min(100,Math.round(td/goal*100));
  const nMs=m.ms.filter(h=>BY[h]).length,nRev=m.rv.filter(h=>BY[h]).length,nNt=Object.keys(m.nt).filter(h=>BY[h]).length,nRd=Object.keys(m.rd).filter(h=>BY[h]).length;
  const sv=m.sess,svv=sv&&!sv.review?usable(sv):null;
  const byC=CH.map((c,ci)=>{const t=c[1].map((tn_,ti)=>{const qs=Q.filter(q=>q.c===ci&&q.t===ti);let a=0,r=0;qs.forEach(q=>{const x=p[q.h];if(x&&x.n){a++;if(x.r)r++}});return{ti,name:tn_,n:qs.length,a,r}});
   return{ci,name:c[0],t,n:t.reduce((x,y)=>x+y.n,0),a:t.reduce((x,y)=>x+y.a,0),r:t.reduce((x,y)=>x+y.r,0)}});
  const weak=byC.flatMap(c=>c.t.map(t=>({...t,ci:c.ci}))).filter(t=>t.a>=3&&t.r/t.a<.7).sort((a,b)=>a.r/a.a-b.r/b.a).slice(0,4);
  const tile=(a,t,sub,x,cls,badge)=>`<button type="button" class="mx-tile ${cls||''}" data-a="${a}" ${x||''}><b>${t}${badge?`<em>${badge}</em>`:''}</b><small>${sub}</small></button>`;
  const best=g=>{let r=null;m.hist.forEach(h=>{if(h.scope==='Paper '+g&&h.n){const v=Math.round(h.ok/h.n*100);if(r===null||v>r)r=v}});return r};
  const pp=PAPERS.map(g=>{const qs=Q.filter(q=>(q.g||[]).includes(g)),bs=best(g);return `<button type="button" class="mx-paper${bs!==null?' done':''}" data-a="paper" data-g="${E(g)}"><b>${E(g)}</b><small>${qs.length} questions${bs!==null?` · best ${bs}%`:''}</small></button>`}).join('');
  /* one suggestion for what to do next */
  let nx=null;
  if(nMs>=5)nx=['mist','','','Redo your mistake bank',nMs+' questions you have got wrong stay here until you remove them. Fixing these is the fastest way to gain marks.'];
  else if(weak.length)nx=['topic',weak[0].ci,weak[0].ti,'Strengthen '+E(weak[0].name),Math.round(weak[0].r/weak[0].a*100)+'% right so far. A short set will lift it.'];
  else if(!att)nx=['quick','','','Start with Quick 10','Ten mixed questions, answer shown after each. A good way to find your level.'];
  else nx=['mock','','','Sit a mock paper','20 questions in 30 minutes, marked at the end.'];
  const seg=(r,w)=>`<span class="mx-st" role="img" aria-label="${right} right, ${wrong} missed, ${left} not tried"><u class="r" style="width:${r}%"></u><u class="w" style="width:${w}%"></u></span>`;
  M.innerHTML=`<section class="mx-dash"><div class="mx-acc"><p class="mx-eb">Your accuracy</p><div class="mx-pc">${att?acc:'–'}<small>${att?'%':''}</small></div>${seg(n?right/n*100:0,n?wrong/n*100:0)}
    <p class="mx-leg"><span><i class="r"></i>${right} right</span><span><i class="w"></i>${wrong} missed</span><span><i></i>${left} not tried</span></p>
    <div class="mx-kv"><span><b>${att}<small> / ${n}</small></b>attempted</span><span><b>${sba===null?'–':sba+'%'}</b>SBA right</span><span><b>${tf===null?'–':tf+'%'}</b>True / False right</span></div></div>
   <div class="mx-day"><p class="mx-eb">Today</p><div class="mx-pc">${td}<small> / ${goal}</small></div><span class="mx-st g"><u class="r" style="width:${gp}%"></u></span>
    <p class="mx-sub2">${td>=goal?'Daily goal reached. Anything more is a bonus.':(goal-td)+' more to reach today\'s goal.'}</p>
    <div class="mx-goal" role="group" aria-label="Daily goal"><span>Goal</span>${[10,20,30,50].map(v=>`<button type="button" data-a="goal" data-v="${v}" aria-pressed="${v===goal}">${v}</button>`).join('')}</div></div></section>
   <p class="mx-about">${n} questions · ${Q.filter(q=>q.s==='P').length} from past papers · ${Q.filter(q=>q.s==='N').length} practice bank · ${Q.filter(q=>!q.y).length} SBA · ${Q.filter(q=>q.y).length} True / False${nRd?` · ${nRd} marked as read`:''}</p>
   ${svv?`<button type="button" class="mx-resume" data-a="resume"><span><small>Pick up where you left off</small>${E(svv.scope)} · question ${svv.i+1} of ${svv.ids.length}</span>${ic.go}</button>`:''}
   <button type="button" class="mx-next" data-a="${nx[0]}" ${nx[1]!==''?`data-c="${nx[1]}" data-t="${nx[2]}"`:''}><span><small class="mx-eb">Suggested next</small><b>${nx[3]}</b>${nx[4]}</span>${ic.go}</button>
   <p class="mx-h">Practise</p>
   <div class="mx-tiles">${dueIds().length?tile('due','Due for review',dueIds().length+' mistake'+(dueIds().length>1?'s':'')+' to revisit today','','t1 mx-due'):''}${weakIds().length?tile('fix','Fix weak spots',weakIds().length+' questions from your weakest topics','','t2 mx-fix'):''}${tile('quick','Quick 10','Mixed questions, answer shown after each','','t1')}${tile('custom','Custom practice','Pick topics, type, paper, status','','t2')}${tile('mock','Mock paper','20 questions, 30 minutes, marked at the end','','t3')}${tile('read','Reading mode','All questions with the answers shown','','t4')}${tile('mist','Mistake bank','Every question you got wrong, kept until you remove it',nMs?'':'disabled','t5',nMs||'')}${tile('saved','Bookmarks',m.bm.length+' saved',m.bm.length?'':'disabled','t6',m.bm.length||'')}${tile('revl','Revise later',nRev?'Questions you flagged to come back to':'Flag questions with Revise later',nRev?'':'disabled','t7',nRev||'')}${tile('mynotes','My notes',nNt?'Read every question you wrote a note on':'Add notes under any question',nNt?'':'disabled','t8',nNt||'')}</div>
   ${weak.length?`<p class="mx-h">Weak spots</p><div class="mx-weak">${weak.map(t=>`<button type="button" data-a="topic" data-c="${t.ci}" data-t="${t.ti}"><span>${E(t.name)}</span><small>${t.r}/${t.a}</small><em>${Math.round(t.r/t.a*100)}%</em></button>`).join('')}</div>`:''}
   <p class="mx-h">Browse by chapter</p><div class="mx-chs">${byC.map(c=>`<details class="mx-chd"><summary><span><b>${E(c.name)}</b><small>${c.n} questions · ${c.a?Math.round(c.r/c.a*100)+'% right of '+c.a+' tried':'not started'}</small></span>${seg2(c)}</summary>
    <div class="mx-tps">${c.t.map(t=>`<div class="mx-tp"><span>${E(t.name)}<small>${t.n} · ${t.a?Math.round(t.r/t.a*100)+'% right':'new'}</small></span><button type="button" data-a="topic" data-c="${c.ci}" data-t="${t.ti}">Practise</button><button type="button" data-a="topicread" data-c="${c.ci}" data-t="${t.ti}">Read</button></div>`).join('')}
    <div class="mx-tp all"><span>Whole chapter</span><button type="button" data-a="chap" data-c="${c.ci}">Practise</button><button type="button" data-a="chapread" data-c="${c.ci}">Read</button></div></div></details>`).join('')}</div>
   <p class="mx-h">Past papers</p><p class="mx-note">Each paper is 20 questions from one sitting. Sit it as a timed exam. Your best score is shown once you have sat one.</p><div class="mx-papers">${pp}</div>
   ${m.hist.length?`<p class="mx-h">Recent sessions</p><div class="mx-hist">${m.hist.slice(0,5).map(h=>`<div><span>${E(h.scope)}<small>${new Date(h.ts).toLocaleDateString('en-GB',{day:'numeric',month:'short'})} · ${h.mode==='exam'?'timed':'practice'} · ${fmt(h.el)}</small></span><b>${h.ok}/${h.n}</b></div>`).join('')}</div>`:''}
   <div class="mx-foot"><button type="button" class="mx-link" data-a="resetp">Reset MCQ progress</button></div>`;
  function seg2(c){const r=c.n?c.r/c.n*100:0,w=c.n?(c.a-c.r)/c.n*100:0;return `<span class="mx-st sm"><u class="r" style="width:${r}%"></u><u class="w" style="width:${w}%"></u></span>`}}

 /* ---------- custom practice (faceted filter) ---------- */
 function chip(f,v,label,x){return `<label class="mx-f"><input type="checkbox" data-f="${f}" data-v="${E(v)}"><span>${label}</span><em></em></label>`}
 function builder(){
  const stL={new:'Not attempted',ms:'In my mistake bank',wrong:'Missed last time',right:'Answered right',bm:'Bookmarked',rev:'Revise later',read:'Marked as read',unread:'Not marked as read',nt:'Has my note',key:'Has a key note'};
  M.innerHTML=`<div class="mx-bld"><div class="mx-fl">
   <label class="mx-search"><input type="search" id="mx-q" placeholder="Search question text" value="${E(F.txt)}" autocomplete="off"></label>
   <div class="mx-fs"><p class="mx-fh">Chapter and topic</p><div class="mx-chl">${CH.map((c,ci)=>`<div class="mx-chd2${[...F.tp].some(k=>k.split('.')[0]==ci)?' open':''}"><div class="mx-chh"><label class="mx-f ch"><input type="checkbox" data-f="ch" data-v="${ci}"><span>${E(c[0])}</span><em></em></label><button type="button" class="mx-tg" data-a="tg" aria-label="Show topics in ${E(c[0])}" aria-expanded="false">${ic.go}</button></div><div class="mx-tpl">${c[1].map((t,ti)=>chip('tp',ci+'.'+ti,E(t))).join('')}</div></div>`).join('')}</div></div>
   <div class="mx-fs"><p class="mx-fh">Question type</p><div class="mx-fc">${chip('ty','0','SBA')}${chip('ty','1','True / False')}</div></div>
   <div class="mx-fs"><p class="mx-fh">Relevant or DU</p><div class="mx-fc">${chip('tg','rel','Relevant')}${chip('tg','du','DU')}${chip('tg','oth','Other past papers (May / Nov)')}</div></div>
   <div class="mx-fs"><p class="mx-fh">Source</p><div class="mx-fc">${chip('src','P','Past papers')}${chip('src','N','Practice bank')}</div></div>
   <div class="mx-fs"><p class="mx-fh">Past paper</p><div class="mx-fc">${PAPERS.map(g=>chip('pp',g,E(g))).join('')}</div></div>
   <div class="mx-fs"><p class="mx-fh">Your progress</p><div class="mx-fc">${Object.keys(stL).map(k=>chip('st',k,stL[k])).join('')}</div></div></div>
  <aside class="mx-side"><div class="mx-sum"><p class="mx-cnt"><b id="mx-n">0</b> questions match</p><p class="mx-sub" id="mx-nb"></p><button type="button" class="mx-link" data-a="clear">Clear all filters</button>
   <p class="mx-fh">How many</p><div class="mx-seg" data-o="n">${[10,20,30,50,0].map(v=>`<button type="button" data-v="${v}">${v||'All'}</button>`).join('')}</div>
   <p class="mx-fh">Order</p><div class="mx-seg" data-o="shuffle"><button type="button" data-v="1">Shuffled</button><button type="button" data-v="0">In syllabus order</button></div>
   <p class="mx-fh">Feedback</p><div class="mx-seg" data-o="mode"><button type="button" data-v="practice">After each question</button><button type="button" data-v="exam">At the end (exam)</button></div>
   <p class="mx-fh">Timer</p><div class="mx-seg" data-o="tpq"><button type="button" data-v="0">None</button><button type="button" data-v="30">30 s / question</button><button type="button" data-v="60">1 min</button><button type="button" data-v="90">90 s</button></div>
   <p class="mx-sub" id="mx-est"></p>
   <div class="mx-go"><button type="button" class="mx-btn" data-a="gostart">Start practice</button><button type="button" class="mx-btn ghost" data-a="goread">Read instead</button></div></div></aside></div>`;
  refresh();window.scrollTo(0,0)}
 function refresh(){
  const L0={};FKEYS.forEach(f=>L0[f]=Q.filter((q,i)=>pass(q,i,f)));
  const tally=(f)=>{const c={};L0[f].forEach(q=>{if(f==='tp')c[tk(q)]=(c[tk(q)]||0)+1;else if(f==='ty')c[q.y]=(c[q.y]||0)+1;else if(f==='src')c[q.s]=(c[q.s]||0)+1;else if(f==='tg')c[tagOf(q)]=(c[tagOf(q)]||0)+1;else if(f==='pp')(q.g||[]).forEach(g=>c[g]=(c[g]||0)+1);else stOf(q).forEach(g=>c[g]=(c[g]||0)+1)});return c};
  const T={};FKEYS.forEach(f=>T[f]=tally(f));
  M.querySelectorAll('input[data-f]').forEach(i=>{const f=i.dataset.f,v=i.dataset.v;let n,on,part=false;
   if(f==='ch'){const keys=CH[v][1].map((_,t)=>v+'.'+t);n=keys.reduce((a,k)=>a+(T.tp[k]||0),0);const k=keys.filter(x=>F.tp.has(x)).length;on=k===keys.length;part=k>0&&!on}
   else{n=T[f][v]||0;on=F[f].has(f==='ty'?+v:v)||F[f].has(v)}
   i.checked=on;i.indeterminate=part;const lb=i.closest('label');lb.classList.toggle('zero',!n&&!on);lb.querySelector('em').textContent=n})
  const hits=matches(),sb=hits.filter(q=>!q.y).length;
  document.getElementById('mx-n').textContent=hits.length;
  document.getElementById('mx-nb').textContent=hits.length?`${sb} SBA · ${hits.length-sb} True / False`:'Nothing matches. Loosen a filter.';
  const k=O.n>0?Math.min(O.n,hits.length):hits.length;document.getElementById('mx-est').textContent=hits.length?`This session: ${k} questions${O.tpq?' · '+fmt(k*O.tpq)+' timer':''}`:'';
  M.querySelectorAll('.mx-seg').forEach(g=>{const o=g.dataset.o,cur=String(o==='shuffle'?(O.shuffle?1:0):O[o]);g.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===cur))});
  M.querySelectorAll('.mx-go button').forEach(b=>b.disabled=!hits.length);saveF()}

 /* ---------- reading mode ---------- */
 let readCh=-1;
 function reading(){
  const all=matches(),cnt={};all.forEach(q=>cnt[q.c]=(cnt[q.c]||0)+1);
  const present=Object.keys(cnt).map(Number).sort((x,y)=>x-y);
  if(readCh!==-2&&!present.includes(readCh))readCh=present.length?present[0]:-2;
  const whole=readCh===-2&&present.length>0||false;
  const hits=readCh>=0?all.filter(q=>q.c===readCh):all,sh=readCh>=0?hits:hits.slice(0,readN);let last=-1,out='';
  sh.forEach(q=>{if(ST().nt[q.h])nOpen.add(q.h)});   /* questions you have written a note on show it while reading */
  sh.forEach((q,i)=>{const g=tk(q);if(g!==last){last=g;out+=`<h3 class="mx-rt">${E(CH[q.c][0])}<small>${E(tn(q))}</small></h3>`}
   out+=`<article class="mx-card read" data-h="${q.h}"><div class="mx-qn">${i+1}</div>${metaRow(q,bmBtn(q))}<h3>${E(q.q)}</h3><div class="mx-opts">${body(q,{fb:readOpt.show,lock:true,notes:readOpt.notes,st:true})}</div>${readOpt.show?bareAns(q):''}${qaRow(q)}</article>`});
  const pi=present.indexOf(readCh),pv=pi>0?present[pi-1]:null,nx=pi>=0&&pi<present.length-1?present[pi+1]:null;
  const sel=`<select class="mx-sel" id="mx-rc" aria-label="Chapter"><option value="-2" ${readCh===-2?'selected':''}>All chapters (${all.length})</option>${present.map(c=>`<option value="${c}" ${c===readCh?'selected':''}>${c+1}. ${E(CH[c][0])} (${cnt[c]})</option>`).join('')}</select>`;
  const pager=readCh>=0?`<div class="mx-more"><button type="button" class="mx-btn ghost" data-a="rch" data-c="${pv}" ${pv===null?'disabled':''}>‹ Previous chapter</button><button type="button" class="mx-btn" data-a="rch" data-c="${nx}" ${nx===null?'disabled':''}>Next chapter ›</button></div>`:'';
  M.innerHTML=`<div class="mx-rbar"><button type="button" class="mx-link" data-a="custom">‹ Filters</button>${sel}<div class="mx-seg sm"><button type="button" data-a="rshow" aria-pressed="${readOpt.show}">Answers</button><button type="button" data-a="rnotes" aria-pressed="${readOpt.notes}">Notes</button></div><button type="button" class="mx-btn sm" data-a="goprac">Practise ${readCh>=0?'this chapter':'these'}</button></div>
   <p class="mx-note">${hits.length} questions${readCh>=0?' in this chapter':''}</p>
   ${all.length?out:'<div class="mempty"><b>No questions match</b>Change the filters to see more.</div>'}
   ${readCh<0&&hits.length>readN?`<div class="mx-more"><button type="button" class="mx-btn ghost" data-a="more">Show ${Math.min(30,hits.length-readN)} more</button><button type="button" class="mx-link" data-a="moreall">Show all ${hits.length}</button></div>`:''}${pager}`}

 /* ---------- events ---------- */
 function setF(f,v,on){if(f==='ch'){CH[v][1].forEach((_,t)=>{const k=v+'.'+t;on?F.tp.add(k):F.tp.delete(k)})}else{const x=f==='ty'?+v:v;on?F[f].add(x):F[f].delete(x)}}
 const reset=()=>{F=emptyF()};
 const only=(c,t)=>{reset();F.tp.add(c+'.'+t);saveF()};
 const topicIds=(c,t,limitN)=>{let a=Q.filter(q=>q.c==c&&(t===undefined||q.t==t));const p=P();a=shuf(a).sort((x,y)=>(p[x.h]&&p[x.h].n?(p[x.h].r?2:0):1)-(p[y.h]&&p[y.h].n?(p[y.h].r?2:0):1));return a.map(q=>q.h)};
 M.addEventListener('click',e=>{
  const b=e.target.closest('[data-a]');
  if(!b){const sg=e.target.closest('.mx-seg button[data-v]');if(sg){const g=sg.parentNode.dataset.o,v=sg.dataset.v;O[g]=g==='mode'?v:g==='shuffle'?v==='1':+v;refresh()}return}
  const a=b.dataset.a,s=sess;
  switch(a){
   case 'due':reset();start(dueIds().slice(0,20),{scope:'Due for review'});break;
   case 'fix':reset();start(weakIds(),{scope:'Weak spots'});break;
   case 'quick':reset();start(shuf(Q.filter(q=>!(P()[q.h]&&P()[q.h].r)).map(q=>q.h)).slice(0,10),{scope:'Quick 10'});break;
   case 'custom':nav('custom');break;
   case 'mock':{const ids=shuf(Q.filter(q=>!q.y).map(q=>q.h)).slice(0,5).concat(shuf(Q.filter(q=>q.y).map(q=>q.h)).slice(0,15));start(shuf(ids),{mode:'exam',limit:1800,scope:'Mock paper'});break}
   case 'read':reset();readN=30;readCh=-1;saveF();nav('read');break;
   case 'mist':start(shuf(ST().ms.filter(h=>BY[h])),{scope:'Mistake bank'});break;
   case 'ms':{const m=ST(),h=b.dataset.h,i=m.ms.indexOf(h);i<0?m.ms.push(h):m.ms.splice(i,1);save();b.setAttribute('aria-pressed',i<0);b.lastChild.textContent=i<0?'In mistake bank, tap to remove':'Add to mistake bank';break}
   case 'flag':{const s=sess;if(!s||s.review)break;s.fl=s.fl||{};const h=s.ids[s.i];s.fl[h]?delete s.fl[h]:s.fl[h]=1;persist();b.setAttribute('aria-pressed',!!s.fl[h]);const st=M.querySelector('.mx-strip [data-i="'+s.i+'"]');if(st)st.classList.toggle('fg',!!s.fl[h]);const c=M.querySelector('.mx-cnt');if(c)c.innerHTML=cntHtml(s);break}
   case 'saved':start(shuf(ST().bm.filter(h=>BY[h])),{scope:'Bookmarks'});break;
   case 'revl':start(shuf(ST().rv.filter(h=>BY[h])),{scope:'Revise later'});break;
   case 'mynotes':reset();F.st.add('nt');saveF();readN=30;readCh=-1;nav('read');break;
   case 'rd':{const m=ST(),h=b.dataset.h,on=!m.rd[h];if(on)m.rd[h]=1;else delete m.rd[h];save();b.setAttribute('aria-pressed',on);b.lastChild.textContent=on?'Read':'Mark as read';break}
   case 'rv':{const m=ST(),h=b.dataset.h,i=m.rv.indexOf(h);if(i<0)m.rv.push(h);else m.rv.splice(i,1);save();b.setAttribute('aria-pressed',i<0);b.lastChild.textContent=i<0?'In revise list':'Revise later';break}
   case 'nt':{const h=b.dataset.h,card=b.closest('.mx-card'),bx=card.querySelector('.mx-nbox');
    if(bx){const t=bx.querySelector('textarea');if(t)saveNote(h,t.value);bx.remove();nOpen.delete(h);b.setAttribute('aria-expanded','false')}
    else{nOpen.add(h);card.insertAdjacentHTML('beforeend',noteBox(BY[h]));b.setAttribute('aria-expanded','true');const t=card.querySelector('.mx-nt');if(t)t.focus()}
    break}
   case 'goal':{const m=ST();m.goal=+b.dataset.v;save();home();break}
   case 'resume':sess=usable(ST().sess);if(sess){sess.t0=Date.now()-sess.el*1000;nav('run')}break;
   case 'topic':start(topicIds(+b.dataset.c,+b.dataset.t).slice(0,25),{scope:CH[b.dataset.c][1][b.dataset.t]});break;
   case 'chap':start(topicIds(+b.dataset.c).slice(0,25),{scope:CH[b.dataset.c][0]});break;
   case 'topicread':only(b.dataset.c,b.dataset.t);readN=30;readCh=-1;nav('read');break;
   case 'chapread':reset();setF('ch',b.dataset.c,true);saveF();readN=30;readCh=+b.dataset.c;nav('read');break;
   case 'paper':{const g=b.dataset.g;start(Q.filter(q=>(q.g||[]).includes(g)).map(q=>q.h),{mode:'exam',limit:1800,scope:'Paper '+g});break}
   case 'resetp':if(confirm('Clear all MCQ answers, bookmarks, mistake bank, read and revise-later marks and history on this device? Your notes are kept.')){const m=ST();m.p={};m.bm=[];m.rd={};m.rv=[];m.ms=[];m.hist=[];m.sess=null;m.last=null;m.day={d:'',n:0};save();home()}break;
   case 'tg':{const d=b.closest('.mx-chd2');b.setAttribute('aria-expanded',d.classList.toggle('open'));break}
   case 'clear':reset();document.getElementById('mx-q').value='';refresh();break;
   case 'gostart':{const ids=pickSet();O.mode=O.mode||'practice';const n=ids.length;saveF();start(ids,{mode:O.mode,limit:lim(n),scope:'Custom practice'});break}
   case 'goread':readN=30;readCh=-1;nav('read');break;
   case 'goprac':{const ids=matches().filter(q=>readCh<0||q.c===readCh).map(q=>q.h);start(O.shuffle?shuf(ids):ids,{scope:'Custom practice'});break}
   case 'rch':if(b.dataset.c!=='null'){readCh=+b.dataset.c;reading();window.scrollTo(0,0)}break;
   case 'more':readN+=30;reading();break;
   case 'moreall':readN=1e9;reading();break;
   case 'rshow':readOpt.show=!readOpt.show;reading();break;
   case 'rnotes':readOpt.notes=!readOpt.notes;reading();break;
   case 'bm':{const m=ST(),h=b.dataset.h,i=m.bm.indexOf(h);i<0?m.bm.push(h):m.bm.splice(i,1);save();b.setAttribute('aria-pressed',i<0);break}
   case 'pick':{const q=BY[b.closest('.mx-card').dataset.h];setAns(q,+b.dataset.j);break}
   case 'tf':{const q=BY[b.closest('.mx-card').dataset.h];setAns(q,+b.dataset.j,+b.dataset.v);break}
   case 'check':check();break;
   case 'next':step(1);break;
   case 'prev':step(-1);break;
   case 'skip':step(1);break;
   case 'finish':tryFinish();break;
   case 'pal':palette();break;
   case 'jump':sess.i=+b.dataset.i;persist();runView();break;
   case 'exit':if(s&&s.review){nav('result')}else if(confirm('Leave this session? Your place is saved so you can resume.')){persist();clearInterval(tid);sess=null;nav()}break;
   case 'results':nav('result');break;
   case 'rev':review(b.dataset.i);break;
   case 'retry':{const l=ST().last;const ids=l.ids.filter(h=>!ok(BY[h],l.ans[h]));start(shuf(ids),{scope:'Retry missed'});break}
   case 'home':nav();break}});
 M.addEventListener('change',e=>{const i=e.target;if(i.id==='mx-rc'){readCh=+i.value;reading();window.scrollTo(0,0);return}if(!i.dataset.f)return;setF(i.dataset.f,i.dataset.v,i.checked);refresh()});
 M.addEventListener('input',e=>{const t=e.target;if(t.id==='mx-q'){F.txt=t.value.trim().toLowerCase();refresh()}
  else if(t.classList&&t.classList.contains('mx-nt')){const h=t.dataset.h,v=t.value;clearTimeout(ntT);ntT=setTimeout(()=>saveNote(h,v),400)}});
 M.addEventListener('focusout',e=>{const t=e.target;if(t.classList&&t.classList.contains('mx-nt'))saveNote(t.dataset.h,t.value)});
 {let sx=0,sy=0,st=0;M.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY;st=Date.now()},{passive:true});
  M.addEventListener('touchend',e=>{const B=document.body.classList;if(!sess||!B.contains('mx-live')||B.contains('an-on')||e.target.closest('textarea,input,.mx-pal,canvas,svg'))return;  // never while annotating or drawing
  const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;
   if(Date.now()-st<600&&Math.abs(dx)>70&&Math.abs(dy)<Math.abs(dx)*.5)step(dx<0?1:-1)},{passive:true})}
 addEventListener('keydown',e=>{if(!sess||document.body.classList.contains('mx-live')===false||/INPUT|TEXTAREA/.test(e.target.tagName)||(e.target.closest&&e.target.closest('.mx-qa')))return;
  const q=BY[sess.ids[sess.i]],rv=sess.review,exam=sess.mode==='exam'&&!rv,k=e.key;
  if(k==='ArrowRight'){step(1)}else if(k==='ArrowLeft'){step(-1)}
  else if(!q.y&&/^[a-eA-E]$/.test(k)){if(!rv)setAns(q,'abcde'.indexOf(k.toLowerCase()))}
  else if(k==='Enter'){const bt=M.querySelector('.mx-act .mx-btn:not(.ghost):not([disabled])');if(bt)bt.click()}
  else if(k==='b'||k==='B'){const bt=M.querySelector('.mx-bm:not(.mx-fg)');if(bt)bt.click()}
  else if((k==='f'||k==='F')&&!rv){const bt=M.querySelector('.mx-fg');if(bt)bt.click()}});

 /* ---------- router ---------- */
 function leave(){clearInterval(tid);if(sess&&!sess.review){persist();sess=null}document.body.classList.remove('mx-live')}
 function mq(){const p=location.hash.replace(/^#\/?/,'').split('/');if(p[0]!=='mcqs'){leave();return}
  if(window.zzMcqLoad&&zzMcqLoad(Q,()=>{Q.forEach(q=>{BY[q.h]=q});mq()},V,M))return;
  const r=p[1]||'';clearInterval(tid);if(r!=='run'&&sess&&!sess.review){persist();sess=null}document.body.classList.toggle('mx-live',r==='run'||r==='review');
  V.dataset.mx=r||'home';
  if(r==='run'){if(!sess||sess.review){const sv=usable(ST().sess);if(sv){sess=sv;sess.t0=Date.now()-(sess.el||0)*1000}else{sess=null}}if(!sess){nav();return}runView()}
  else if(r==='review'){if(!sess||!sess.review){nav('result');return}runView(true)}
  else if(r==='result')result();
  else if(r==='custom')builder();
  else if(r==='read')reading(),window.scrollTo(0,0);
  else homeK()}
 (window.zzPre=window.zzPre||{}).mcqs=()=>{if(!/^#\/mcqs/.test(location.hash))homeK()};
 /* build the MCQ home only when what it shows has changed: a tab that was ready before the swipe is not rebuilt on arrival */
 function homeK(){let k='';try{k=JSON.stringify([Q.length,P(),ST(),new Date().toDateString()])}catch(e){}if(k&&M.__k===k&&M.firstElementChild)return;M.__k=k;home()}   /* pager: draw the MCQ home while it is only a neighbour */
 addEventListener('hashchange',mq);setTimeout(mq,0)}
