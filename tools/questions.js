/* Questions page: collapsible list + advanced filter panel.
   Filters: status, type (viva / written), section (part), card (A-box / B-box, or one specific card), sort, jump to topic.
   QMETA (injected by build.py) = {parts:[[key,name,letter]], partOf:{topicId:partKey}, type:{questionId:'W'}} */
const QV=mkView('questions','Questions','Questions','Only the questions. Tap one to reveal its answer, tap again to hide it.');
(function(){
const chev='<svg class="chv" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
const IC={x:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
 filter:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
 reset:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 3-6.2M4 4v5h5"/></svg>'};
const PARTS=QMETA.parts,PO=QMETA.partOf,TY=QMETA.type;
const EX=QMETA.exam||{},st=d=>(EX[d[3]]||[0])[0],yrs=d=>(EX[d[3]]||[0,'',[]])[2],YEARS=[...new Set(Object.values(EX).flatMap(x=>x[2]))].sort((a,b)=>b-a),HASEX=Object.keys(EX).length>0;
const star=on=>`<svg class="zs ${on?'on':'off'}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#zz-star"/></svg>`;
const impH=(n,box)=>`<span class="imp" role="img" aria-label="${box?'Asked '+n+(n>1?' times':' time'):'Importance: '+n+' of 3'}">${Array.from({length:Math.max(3,n)},(_,i)=>star(i<n)).join('')}</span>`;
const MAXST=Math.max(3,...Object.values(EX).map(x=>x[0]||0));
const xm=d=>{const e=EX[d[3]],t=(TREE[d[3]]||[])[2],o=[];if(t)o.push(`<span class="xs">${esc(t)}</span>`);if(e&&e[0])o.push(impH(e[0],!!e[3]));
 if(e&&e[3])e[3].forEach(b=>o.push(`<span class="ex-y"><b class="ex-p">${esc(b[0])}</b>${esc(b[1])}</span>`));
 if(e&&e[4])o.push('<span class="ex-y ex-hl">Highlighted</span>');
 if(e&&e[1]){let last=null;e[1].split(',').map(x=>x.trim()).filter(Boolean).forEach(tok=>{const m=/^([A-Za-z]+)-(.+)$/.exec(tok);if(m){last=m[1];tok=m[2]}o.push(last?`<span class="ex-y"><b class="ex-p">${esc(last)}</b>${esc(tok)}</span>`:`<span class="ex-y">${esc(tok)}</span>`)})}
 return o.length?`<small class="xm">${o.join('')}</small>`:''};
const pk=d=>PO[d[2]]||'',ty=d=>TY[d[3]]||'V',cardOf=c=>{const m=/^([A-Z]+)(\d+)$/.exec(c);return m?[m[1],+m[2]]:[c,0]};
const cds=d=>d[0]?d[0].split(' '):[],letter=d=>cds(d).map(c=>cardOf(c)[0]),hasL=(d,l)=>letter(d).includes(l);
const cardCmp=(a,b)=>{const x=cardOf(a),y=cardOf(b);return x[0].localeCompare(y[0])||x[1]-y[1]};
const pidx=k=>{const i=PARTS.findIndex(p=>p[0]===k);return i<0?99:i};
const TREE=QMETA.tree||{},CHS=QMETA.chapters||[],chOf=d=>(TREE[d[3]]||['?'])[0],subOf=d=>(TREE[d[3]]||[0,''])[1];
const g={};DATA.forEach(d=>(g[chOf(d)]=g[chOf(d)]||[]).push(d));
const CHI={};CHS.forEach((c,i)=>CHI[c[0]]=c);
const tids=CHS.map(c=>c[0]).filter(c=>g[c]);
tids.forEach(c=>{const subs=CHI[c][3];g[c].sort((a,b)=>subs.indexOf(subOf(a))-subs.indexOf(subOf(b)))});
const BOOK={};let bi=0;tids.forEach(t=>g[t].forEach(d=>BOOK[d[3]]=bi++));
const LETTERS=[...new Set(['A','B'].concat(DATA.flatMap(letter).filter(Boolean)))].sort();
const CODES=[...new Set(DATA.flatMap(cds))].sort(cardCmp);

const qi=d=>`<div class="qi" data-id="${d[3]}" data-s="${esc((d[1]+' '+d[4]+' '+d[0]).toLowerCase())}"><button class="qi-h" type="button" aria-expanded="false">${cds(d).map(c=>`<span class="code">${c}</span>`).join('')}<span class="qt">${esc(d[1])}${xm(d)}</span>${ty(d)==='W'?'<span class="tg">Written</span>':ty(d)==='B'?'<span class="tg">Written + Viva</span>':''}<span class="qgo" role="link" tabindex="0" data-go="#/${d[2]}/${d[3]}" aria-label="Open answer on its own page">Answer ›</span>${chev}</button><div class="qi-a" hidden></div></div>`;
const secC=c=>{const it=g[c],ci=CHI[c];let last=null,h='';it.forEach(d=>{const sb=subOf(d);if(sb!==last){h+=`<h5 class="qsub" data-sub="${esc(sb)}">${esc(sb)}</h5>`;last=sb}h+=qi(d)});
 return `<section class="qs" data-t="${c}"><button class="qs-h" type="button" aria-expanded="true"><span class="no">${esc(ci[2])}</span><b>${esc(ci[1])}</b><span class="cnt">${it.length}</span>${chev}</button><div class="qs-b">${h}</div></section>`};
const sec=(no,title,items,attr)=>`<section class="qs" ${attr}><button class="qs-h" type="button" aria-expanded="true"><span class="no">${no}</span><b>${esc(title)}</b><span class="cnt">${items.length}</span>${chev}</button><div class="qs-b">${items.map(qi).join('')}</div></section>`;

QV.innerHTML='<div class="qwrap"><aside id="qf" aria-label="Filters"></aside><div class="qmain">'
+'<div class="qtools"><input id="qfilter" type="search" placeholder="Filter questions…" aria-label="Filter questions">'
+'<button class="qb qfbtn" id="qfopen" type="button" aria-expanded="false" aria-controls="qf">'+IC.filter+'<span>Filters</span><i id="qfn" hidden></i></button>'
+'<button class="qb" id="qexp" type="button">Expand all</button><button class="qb" id="qcol" type="button">Collapse all</button></div>'
+'<div class="qsum"><span id="qsum" aria-live="polite"></span><span id="qact" class="qact"></span></div>'
+'<div id="qlist">'+tids.map(secC).join('')+'</div><div id="qflat" hidden></div>'
+'<div class="empty" id="qnone" hidden><b>No question matches</b><p>Nothing fits all the filters you have set. Remove one or clear them all.</p><button class="pill" id="qclr" type="button">Clear all filters</button></div>'
+'</div></div><div id="qscrim"></div>';
const $q=id=>document.getElementById(id),qf=$q('qf');

/* ---------- state ---------- */
const F={show:[],type:[],part:[],letter:[],card:[],stars:[],year:[],sort:'book',topic:[],q:''};
const has=(k,v)=>F[k].includes(String(v)),ON=['show','type','part','letter','card','stars','year','topic'];
let FO=false,DD=false;
const STAT={all:()=>true,fav:d=>S.fav.includes(d[3]),bm:d=>S.bm.includes(d[3]),note:d=>!!S.notes[d[3]],done:d=>S.learned.includes(d[3]),todo:d=>!S.learned.includes(d[3])};
const txt=d=>{const c=document.getElementById(d[3]);return c&&c._t?c._t:(d[1]+' '+d[4]+' '+d[0]).toLowerCase()};
const pass=(d,skip)=>(skip==='show'||!F.show.length||F.show.some(v=>STAT[v](d)))&&(skip==='type'||!F.type.length||F.type.some(v=>ty(d)===v||ty(d)==='B'))&&(skip==='part'||!F.part.length||F.part.includes(pk(d)))
 &&(skip==='card'||((!F.letter.length||F.letter.some(l=>hasL(d,l)))&&(!F.card.length||cds(d).some(c=>F.card.includes(c)))))&&(skip==='stars'||!F.stars.length||F.stars.includes(String(st(d))))&&(skip==='year'||!F.year.length||yrs(d).some(y=>F.year.includes(String(y))))&&(skip==='topic'||!F.topic.length||F.topic.includes(String(chOf(d))))&&(!F.q||txt(d).includes(F.q));
const cnt=(fn,skip)=>DATA.filter(d=>pass(d,skip)&&fn(d)).length;
const nAct=()=>ON.reduce((a,k)=>a+F[k].length,0)+(F.sort!=='book');
const SHOW=[['all','All'],['fav','Favourites'],['bm','Bookmarked'],['note','With note'],['done','Learned'],['todo','Not learned']];
const tname=t=>CHI[t]?CHI[t][2]+' \u00b7 '+CHI[t][1]:t;

/* ---------- panel ---------- */
const chip=(k,v,lb,on,c)=>`<button type="button" class="qfc${on?' on':''}${c===0?' z':''}" data-k="${k}" data-v="${v}" aria-pressed="${!!on}">${lb}${c!=null?`<i>${c}</i>`:''}</button>`;
function panel(){
 const a=document.activeElement,keep=a&&qf.contains(a)&&a.dataset.k?[a.dataset.k,a.dataset.v]:null;
 const n=nAct()+!!F.q,tot=DATA.filter(d=>pass(d)).length;
 const codes=CODES.filter(c=>!F.letter.length||F.letter.includes(cardOf(c)[0])),cardCnt=c=>cnt(d=>cds(d).includes(c),'card');
 qf.innerHTML=`<div class="qf-head"><b>Filters</b><span class="sp"></span><button type="button" class="qf-clr" data-k="reset"${n?'':' disabled'}>${IC.reset}<span>Clear all</span>${n?`<i>${n}</i>`:''}</button><button type="button" class="qf-x" data-k="close" aria-label="Close filters">${IC.x}</button></div><div class="qf-body">`
 +`<h4>Status</h4><div class="qfr">${SHOW.map(([v,l])=>chip('show',v,l,v==='all'?!F.show.length:has('show',v),cnt(STAT[v],'show'))).join('')}</div>`
 +`<h4>Type</h4><div class="qseg">${[['V','Viva'],['W','Written']].map(([v,l])=>`<button type="button" class="${has('type',v)?'on':''}" data-k="type" data-v="${v}" aria-pressed="${has('type',v)}">${l}<i>${cnt(d=>ty(d)===v||ty(d)==='B','type')}</i></button>`).join('')}</div>`
 +(HASEX?`<h4>Importance</h4><div class="qfr">${Array.from({length:MAXST},(_,i)=>i+1).map(n=>chip('stars',n,'<span class="imp" aria-label="'+n+(n>1?' stars':' star')+'">'+Array.from({length:Math.max(3,n)},(_,i)=>star(i<n)).join('')+'</span>',has('stars',n),cnt(d=>st(d)===n,'stars'))).join('')}</div>`
 +`<h4>Exam year</h4><div class="qfr">${YEARS.map(y=>chip('year',y,y,has('year',y),cnt(d=>yrs(d).includes(y),'year'))).join('')}</div>`:'')
 +`<h4>Section</h4><div class="qfr">${PARTS.map(p=>chip('part',p[0],p[1],has('part',p[0]),cnt(d=>pk(d)===p[0],'part'))).join('')}</div>`
 +`<h4>Card</h4><div class="qfr">${LETTERS.map(l=>chip('letter',l,l+'-box',has('letter',l),cnt(d=>hasL(d,l),'card'))).join('')}</div>`
 +`<h4>Specific card</h4><div class="qdd"><button type="button" class="qddb${DD?' o':''}${F.card.length?' has':''}" data-k="dd" aria-expanded="${DD}">${F.card.length?esc(F.card.join(', ')):'Any card'}${chev}</button>${DD?`<div class="qddl"><button type="button" class="${F.card.length?'':'on'}" data-k="card" data-v="">Any card</button>${codes.map(c=>`<button type="button" class="${has('card',c)?'on':''}" data-k="card" data-v="${c}">${c}<span>${cardCnt(c)}</span></button>`).join('')}</div>`:''}</div>`
 +`<h4>Sort</h4><div class="qseg">${[['book','Book order'],['card','Card number']].map(([v,l])=>`<button type="button" class="${F.sort===v?'on':''}" data-k="sort" data-v="${v}" aria-pressed="${F.sort===v}">${l}</button>`).join('')}</div>`
 +`<div class="qfd"><button type="button" class="qfd-h" data-k="fo" aria-expanded="${FO||!!F.topic.length}">Chapter${chev}</button>${FO||F.topic.length?`<div class="qfd-b">${tids.filter(t=>cnt(d=>String(chOf(d))===String(t),'topic')>0).map(t=>`<button type="button" class="qti${has('topic',t)?' on':''}" data-k="topic" data-v="${t}"><b>${esc(CHI[t][2]+' \u00b7 '+CHI[t][1])}</b><span>${cnt(d=>String(chOf(d))===String(t),'topic')}</span></button>`).join('')}</div>`:''}</div>`
 +`</div><div class="qf-foot"><button type="button" class="gb" data-k="close">Show ${tot} question${tot===1?'':'s'}</button></div>`;
 if(keep){const b=qf.querySelector(`[data-k="${keep[0]}"][data-v="${keep[1]}"]`);b&&b.focus()}
}

/* ---------- list ---------- */
function actChips(){const o=[];
 F.show.forEach(v=>o.push([SHOW.find(s=>s[0]===v)[1],'show',v]));
 F.type.forEach(v=>o.push([v==='W'?'Written':'Viva','type',v]));
 F.part.forEach(v=>o.push([PARTS.find(p=>p[0]===v)[1],'part',v]));
 F.letter.forEach(v=>o.push([v+'-box','letter',v]));
 F.card.forEach(v=>o.push(['Card '+v,'card',v]));
 F.stars.forEach(v=>o.push([v+(v>1?' stars':' star'),'stars',v]));
 F.year.forEach(v=>o.push(['Year '+v,'year',v]));
 F.topic.forEach(v=>o.push([tname(v),'topic',v]));
 if(F.sort!=='book')o.push(['By card number','sort','book']);
 return o}
function apply(){
 const flat=F.sort==='card',act=nAct()||F.q,hit=DATA.filter(d=>pass(d)),ok=new Set(hit.map(d=>d[3])),list=$q('qlist'),fl=$q('qflat');
 list.hidden=flat;fl.hidden=!flat;
 if(flat){const grp={};hit.slice().sort((x,y)=>cardCmp(cds(x)[0]||'',cds(y)[0]||'')||BOOK[x[3]]-BOOK[y[3]]).forEach(d=>(cds(d).length?cds(d):['']).forEach(c=>(grp[c]=grp[c]||[]).push(d)));
  fl.innerHTML=Object.keys(grp).sort((a,b)=>(!a)-(!b)||cardCmp(a,b)).map(c=>sec(c||'W',c?'Card '+c:'Written questions (no card)',grp[c],'data-c="'+c+'"')).join('');fl.querySelectorAll('.qi').forEach(lbl)}
 else{list.querySelectorAll('.qi').forEach(i=>i.hidden=!ok.has(i.dataset.id));
  list.querySelectorAll('.qsub').forEach(h=>{let n=h.nextElementSibling,v=false;while(n&&!n.classList.contains('qsub')){if(!n.hidden)v=true;n=n.nextElementSibling}h.hidden=!v});
  list.querySelectorAll('.qs').forEach(s=>{const v=s.querySelectorAll('.qi:not([hidden])').length;s.hidden=!v;if(act&&v){s.querySelector('.qs-h').setAttribute('aria-expanded',true);s.querySelector('.qs-b').hidden=false}})}
 $q('qnone').hidden=!!hit.length;
 $q('qsum').textContent=hit.length===DATA.length?DATA.length+' questions':hit.length+' of '+DATA.length+' questions';
 $q('qact').innerHTML=actChips().map(([l,k,v])=>`<button type="button" class="qchip" data-k="${k}" data-v="${v}" data-x="1" aria-label="Remove filter ${esc(l)}">${esc(l)}${IC.x}</button>`).join('');
 const n=nAct()+!!F.q,b=$q('qfn');b.hidden=!n;b.textContent=n;applyQA(hit,n);applyViews(hit,n)}
function run(){apply();panel()}
function set(k,v){
 const tg=(a,x)=>{const i=a.indexOf(String(x));i<0?a.push(String(x)):a.splice(i,1)};
 if(k==='show'){v==='all'?F.show=[]:tg(F.show,v)}
 else if(k==='type'||k==='part'||k==='stars'||k==='year'||k==='topic')tg(F[k],v);
 else if(k==='letter'){tg(F.letter,v);if(F.letter.length)F.card=F.card.filter(c=>F.letter.includes(cardOf(c)[0]))}
 else if(k==='card'){v===''?F.card=[]:tg(F.card,v)}
 else if(k==='sort')F.sort=v;
 else if(k==='dd')DD=!DD;
 else if(k==='fo')FO=!FO;
 else if(k==='reset'){ON.forEach(x=>F[x]=[]);Object.assign(F,{sort:'book',q:''});$q('qfilter').value='';DD=false}
 run()}
qf.addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(!b||b.disabled)return;if(b.dataset.k==='close')return openF(false);set(b.dataset.k,b.dataset.v)});
$q('qact').addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(!b)return;const k=b.dataset.k,v=b.dataset.v;if(ON.includes(k))F[k]=F[k].filter(x=>x!==String(v));else F[k]=v;run()});
$q('qclr').onclick=()=>set('reset');

/* ---------- Q&A tab shares the same filters ---------- */
const A=typeof QAV!=='undefined'?QAV:null;
if(A){const main=document.createElement('div');main.className='qmain';while(A.firstChild)main.appendChild(A.firstChild);
 const wrap=document.createElement('div');wrap.className='qwrap';wrap.id='qawrap';wrap.append(main);A.append(wrap);
 main.insertAdjacentHTML('afterbegin','<div class="qtools"><button class="qb qfbtn" id="qfopen2" type="button" aria-expanded="false" aria-controls="qf">'+IC.filter+'<span>Filters</span><i id="qfn2" hidden></i></button></div><div class="qsum"><span id="qsum2" aria-live="polite"></span><span id="qact2" class="qact"></span></div><div class="empty" id="qanone" hidden><b>No chapter matches</b><p>Nothing fits all the filters you have set. Remove one or clear them all.</p><button class="pill" id="qclr2" type="button">Clear all filters</button></div>');
 document.body.appendChild($q('qscrim'));}
function applyQA(hit,n){if(!A)return;
 const per={};hit.forEach(d=>per[d[2]]=(per[d[2]]||0)+1);const act=n>0;let shown=0;
 A.querySelectorAll('a.topic').forEach(a=>{const t=(a.getAttribute('href')||'').replace('#/',''),c=a.querySelector('.cnt');
  if(c&&!c.dataset.o)c.dataset.o=c.textContent;const tot=DATA.filter(d=>d[2]===t).length,k=per[t]||0;
  a.hidden=act&&!k;if(!a.hidden)shown++;if(c)c.textContent=act?k+' of '+tot+' questions':c.dataset.o});
 A.querySelectorAll('section.part').forEach(sec=>{const cards=sec.querySelectorAll('a.topic');sec.hidden=act&&(!cards.length||![...cards].some(a=>!a.hidden))});
 $q('qanone').hidden=!(act&&!shown);
 $q('qsum2').textContent=hit.length===DATA.length?DATA.length+' questions':hit.length+' of '+DATA.length+' questions';
 $q('qact2').innerHTML=actChips().map(([l,k,v])=>`<button type="button" class="qchip" data-k="${k}" data-v="${v}" data-x="1" aria-label="Remove filter ${esc(l)}">${esc(l)}${IC.x}</button>`).join('');
 const b=$q('qfn2');b.hidden=!n;b.textContent=n}
function place(){const h=location.hash,inQ=/^#\/questions/.test(h),inA=!!A&&/^#\/qa/.test(h);
 const into=inQ?QV.querySelector('.qwrap'):inA?$q('qawrap'):document.body;
 qf.classList.toggle('dr',!(inQ||inA));if(qf.parentNode!==into)(into===document.body?into.appendChild(qf):into.prepend(qf))}
if(A){$q('qact2').addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(!b)return;const k=b.dataset.k,v=b.dataset.v;if(ON.includes(k))F[k]=F[k].filter(x=>x!==String(v));else F[k]=v;run()});
 $q('qclr2').onclick=()=>set('reset');
 $q('qfopen2').onclick=()=>openF(!document.body.classList.contains('qf-open'))}

/* ---------- every other page (topic pages, bookmarks, favourites, notes, home) uses the same filters through a drawer ---------- */
function applyViews(hit,n){const ok=new Set(hit.map(d=>d[3])),act=n>0;
 document.querySelectorAll('.view').forEach(v=>{
  const cards=v.querySelectorAll('article.card[id^=q]');
  if(cards.length){let k=0;cards.forEach(c=>{const o=!act||ok.has(c.id);c.classList.toggle('tf-hide',!o);if(o)k++});
   let e=v.querySelector('.tf-empty');
   if(act&&!k){if(!e){e=document.createElement('p');e.className='tf-empty';e.textContent='No question on this page matches the filters.';const r=v.querySelector('.tf-row');r&&r.after(e)}}else if(e)e.remove()}
  v.querySelectorAll('[data-list] .row').forEach(r=>{const a=r.querySelector('a'),id=a&&a.getAttribute('href').split('/').pop();r.classList.toggle('tf-hide',act&&!ok.has(id))});
  v.querySelectorAll('.nh-map a.s').forEach(a=>{const id=a.getAttribute('href').split('/').pop();a.classList.toggle('tf-dim',act&&!ok.has(id))})});
 const chips=actChips().map(([l,k,v])=>`<button type="button" class="qchip" data-k="${k}" data-v="${v}" data-x="1" aria-label="Remove filter ${esc(l)}">${esc(l)}${IC.x}</button>`).join('');
 document.querySelectorAll('.qsum-x').forEach(x=>x.textContent=act?hit.length+' of '+DATA.length+' questions match':'');
 document.querySelectorAll('.qact-x').forEach(x=>x.innerHTML=chips);
 document.querySelectorAll('.qfn-x').forEach(i=>{i.hidden=!n;i.textContent=n})}
function mountBars(){document.querySelectorAll('.view').forEach(v=>{
 if(v.id==='v-questions'||v.id==='v-qa'||v.id==='v-home'||v.querySelector('.qfb-x'))return;
 let anchor=v.querySelector('.bar'),before=false;
 if(!anchor){anchor=v.querySelector('[data-list]');before=true}
 if(!anchor||!(v.querySelector('article.card[id^=q]')||v.querySelector('[data-list]')))return;
 const html='<div class="tf-row"><button class="qb qfbtn qfb-x" type="button" aria-expanded="false" aria-controls="qf">'+IC.filter+'<span>Filters</span><i class="qfn-x" hidden></i></button><span class="qsum-x tf-n" aria-live="polite"></span><span class="qact-x qact"></span></div>';
 anchor.insertAdjacentHTML(before?'beforebegin':'afterend',html)})}
document.addEventListener('click',e=>{
 if(e.target.closest('.qfb-x'))return openF(!document.body.classList.contains('qf-open'));
 const x=e.target.closest('.qact-x [data-x]');if(x){const k=x.dataset.k,v=x.dataset.v;if(ON.includes(k))F[k]=F[k].filter(y=>y!==String(v));else F[k]=v;run();return}
 if(e.target.closest('.act,.qlearn'))setTimeout(()=>{if(nAct())apply()},90)});
mountBars();place();
addEventListener('hashchange',()=>{place();apply()});
window.qfApply=()=>{if(nAct())apply()};
if(typeof render==='function'){const r0=render;render=function(k){r0(k);if(nAct())apply()}}

/* drawer (tablet) / bottom sheet (phone) / docked sidebar (wide) */
function openF(o){document.body.classList.toggle('qf-open',o);document.querySelectorAll('.qfb-x,#qfopen,#qfopen2').forEach(b=>b.setAttribute('aria-expanded',o));if(o)setTimeout(()=>{const f=qf.querySelector('.qf-x');f&&f.offsetParent&&f.focus()},60);else if(document.activeElement&&qf.contains(document.activeElement))$q('qfopen').focus()}
$q('qfopen').onclick=()=>openF(!document.body.classList.contains('qf-open'));
$q('qscrim').onclick=()=>openF(false);
addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('qf-open'))openF(false)});
addEventListener('hashchange',()=>{openF(false);if(/^#\/questions/.test(location.hash))sync()});

/* ---------- answers ---------- */
function fill(i){const a=i.querySelector('.qi-a');if(a.dataset.f)return;a.dataset.f=1;const id=i.dataset.id,c=document.getElementById(id),d=BY[id];
 a.innerHTML='<div class="ans">'+c.querySelector('.ans').innerHTML+'</div><div class="qa-f"><button class="qlearn" type="button"></button><a href="#/'+d[2]+'/'+id+'">Open in topic page</a></div>';
 a.querySelectorAll('canvas').forEach(x=>x.remove());lbl(i)}
function lbl(i){const on=S.learned.includes(i.dataset.id),b=i.querySelector('.qlearn');i.classList.toggle('dn',on);if(b){b.setAttribute('aria-pressed',on);b.textContent=on?'Learned ✓':'Mark as learned'}}
function open1(i,open){fill(i);i.querySelector('.qi-h').setAttribute('aria-expanded',open);i.querySelector('.qi-a').hidden=!open;i.classList.toggle('o',open)}
function sync(){QV.querySelectorAll('.qi').forEach(lbl);run()}
QV.querySelectorAll('.qi').forEach(lbl);
QV.addEventListener('keydown',e=>{const g=e.target.closest&&e.target.closest('.qgo');if(g&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopPropagation();location.hash=g.dataset.go}});
QV.addEventListener('click',e=>{
 const h=e.target.closest('.qi-h');if(h){const i=h.parentNode;open1(i,h.getAttribute('aria-expanded')!=='true');return}
 const s=e.target.closest('.qs-h');if(s){const o=s.getAttribute('aria-expanded')!=='true';s.setAttribute('aria-expanded',o);s.nextElementSibling.hidden=!o;return}
 const b=e.target.closest('.qlearn');if(b){const i=b.closest('.qi'),id=i.dataset.id,k=S.learned.indexOf(id);k<0?(S.learned.push(id),touch()):S.learned.splice(k,1);save();
  QV.querySelectorAll('.qi[data-id="'+id+'"]').forEach(lbl);const c=document.getElementById(id);if(c)paint(c);counts();panel()}});
const vis=()=>$q('qflat').hidden?$q('qlist'):$q('qflat');
$q('qexp').onclick=()=>{const v=vis();v.querySelectorAll('.qs:not([hidden])').forEach(s=>{s.querySelector('.qs-h').setAttribute('aria-expanded',true);s.querySelector('.qs-b').hidden=false});v.querySelectorAll('.qi:not([hidden])').forEach(i=>open1(i,true))};
$q('qcol').onclick=()=>QV.querySelectorAll('.qi').forEach(i=>open1(i,false));
$q('qfilter').addEventListener('input',e=>{F.q=e.target.value.trim().toLowerCase();run()});
run();
})();
