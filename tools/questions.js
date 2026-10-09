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
const pk=d=>PO[d[2]]||'',ty=d=>TY[d[3]]||'V',cardOf=c=>{const m=/^([A-Z]+)(\d+)$/.exec(c);return m?[m[1],+m[2]]:[c,0]};
const letter=d=>cardOf(d[0])[0];
const cardCmp=(a,b)=>{const x=cardOf(a),y=cardOf(b);return x[0].localeCompare(y[0])||x[1]-y[1]};
const pidx=k=>{const i=PARTS.findIndex(p=>p[0]===k);return i<0?99:i};
const g={};DATA.forEach(d=>(g[d[2]]=g[d[2]]||[]).push(d));
const tids=Object.keys(g).sort((a,b)=>pidx(PO[a])-pidx(PO[b])||a.localeCompare(b));
const BOOK={};let bi=0;tids.forEach(t=>g[t].forEach(d=>BOOK[d[3]]=bi++));
const LETTERS=[...new Set(['A','B'].concat(DATA.map(letter).filter(Boolean)))].sort();
const CODES=[...new Set(DATA.map(d=>d[0]))].sort(cardCmp);

const qi=d=>`<div class="qi" data-id="${d[3]}" data-s="${esc((d[1]+' '+d[4]+' '+d[0]).toLowerCase())}"><button class="qi-h" type="button" aria-expanded="false"><span class="code">${d[0]}</span><span class="qt">${esc(d[1])}</span>${ty(d)==='W'?'<span class="tg">Written</span>':''}${chev}</button><div class="qi-a" hidden></div></div>`;
const sec=(no,title,items,attr)=>`<section class="qs" ${attr}><button class="qs-h" type="button" aria-expanded="true"><span class="no">${no}</span><b>${esc(title)}</b><span class="cnt">${items.length}</span>${chev}</button><div class="qs-b">${items.map(qi).join('')}</div></section>`;

QV.innerHTML='<div class="qwrap"><aside id="qf" aria-label="Filters"></aside><div class="qmain">'
+'<div class="qtools"><input id="qfilter" type="search" placeholder="Filter questions…" aria-label="Filter questions">'
+'<button class="qb qfbtn" id="qfopen" type="button" aria-expanded="false" aria-controls="qf">'+IC.filter+'<span>Filters</span><i id="qfn" hidden></i></button>'
+'<button class="qb" id="qexp" type="button">Expand all</button><button class="qb" id="qcol" type="button">Collapse all</button></div>'
+'<div class="qsum"><span id="qsum" aria-live="polite"></span><span id="qact" class="qact"></span></div>'
+'<div id="qlist">'+tids.map(t=>sec(t,g[t][0][4],g[t],'data-t="'+t+'"')).join('')+'</div><div id="qflat" hidden></div>'
+'<div class="empty" id="qnone" hidden><b>No question matches</b><p>Nothing fits all the filters you have set. Remove one or clear them all.</p><button class="pill" id="qclr" type="button">Clear all filters</button></div>'
+'</div></div><div id="qscrim"></div>';
const $q=id=>document.getElementById(id),qf=$q('qf');

/* ---------- state ---------- */
const F={show:'all',type:'',part:'',letter:'',card:'',sort:'book',topic:'',q:''};
let FO=false,DD=false;
const STAT={all:()=>true,fav:d=>S.fav.includes(d[3]),bm:d=>S.bm.includes(d[3]),note:d=>!!S.notes[d[3]],done:d=>S.learned.includes(d[3]),todo:d=>!S.learned.includes(d[3])};
const txt=d=>{const c=document.getElementById(d[3]);return c&&c._t?c._t:(d[1]+' '+d[4]+' '+d[0]).toLowerCase()};
const pass=(d,skip)=>(skip==='show'||STAT[F.show](d))&&(skip==='type'||!F.type||ty(d)===F.type)&&(skip==='part'||!F.part||pk(d)===F.part)
 &&(skip==='card'||((!F.letter||letter(d)===F.letter)&&(!F.card||d[0]===F.card)))&&(skip==='topic'||!F.topic||d[2]===F.topic)&&(!F.q||txt(d).includes(F.q));
const cnt=(fn,skip)=>DATA.filter(d=>pass(d,skip)&&fn(d)).length;
const nAct=()=>(F.show!=='all')+!!F.type+!!F.part+!!F.letter+!!F.card+(F.sort!=='book')+!!F.topic;
const SHOW=[['all','All'],['fav','Favourites'],['bm','Bookmarked'],['note','With note'],['done','Learned'],['todo','Not learned']];
const tname=t=>g[t]?g[t][0][4]:t;

/* ---------- panel ---------- */
const chip=(k,v,lb,on,c)=>`<button type="button" class="qfc${on?' on':''}${c===0?' z':''}" data-k="${k}" data-v="${v}" aria-pressed="${!!on}">${lb}${c!=null?`<i>${c}</i>`:''}</button>`;
function panel(){
 const a=document.activeElement,keep=a&&qf.contains(a)&&a.dataset.k?[a.dataset.k,a.dataset.v]:null;
 const n=nAct()+!!F.q,tot=DATA.filter(d=>pass(d)).length;
 const codes=CODES.filter(c=>!F.letter||cardOf(c)[0]===F.letter),cardCnt=c=>cnt(d=>d[0]===c,'card');
 qf.innerHTML=`<div class="qf-head"><b>Filters</b><span class="sp"></span><button type="button" class="qf-clr" data-k="reset"${n?'':' disabled'}>${IC.reset}<span>Clear all</span>${n?`<i>${n}</i>`:''}</button><button type="button" class="qf-x" data-k="close" aria-label="Close filters">${IC.x}</button></div><div class="qf-body">`
 +`<h4>Status</h4><div class="qfr">${SHOW.map(([v,l])=>chip('show',v,l,F.show===v,cnt(STAT[v],'show'))).join('')}</div>`
 +`<h4>Type</h4><div class="qseg">${[['V','Viva'],['W','Written']].map(([v,l])=>`<button type="button" class="${F.type===v?'on':''}" data-k="type" data-v="${v}" aria-pressed="${F.type===v}">${l}<i>${cnt(d=>ty(d)===v,'type')}</i></button>`).join('')}</div>`
 +`<h4>Section</h4><div class="qfr">${PARTS.map(p=>chip('part',p[0],p[1],F.part===p[0],cnt(d=>pk(d)===p[0],'part'))).join('')}</div>`
 +`<h4>Card</h4><div class="qfr">${LETTERS.map(l=>chip('letter',l,l+'-box',F.letter===l,cnt(d=>letter(d)===l,'card'))).join('')}</div>`
 +`<h4>Specific card</h4><div class="qdd"><button type="button" class="qddb${DD?' o':''}${F.card?' has':''}" data-k="dd" aria-expanded="${DD}">${F.card?esc(F.card):'Any card'}${chev}</button>${DD?`<div class="qddl"><button type="button" class="${F.card?'':'on'}" data-k="card" data-v="">Any card</button>${codes.map(c=>`<button type="button" class="${F.card===c?'on':''}" data-k="card" data-v="${c}">${c}<span>${cardCnt(c)}</span></button>`).join('')}</div>`:''}</div>`
 +`<h4>Sort</h4><div class="qseg">${[['book','Book order'],['card','Card number']].map(([v,l])=>`<button type="button" class="${F.sort===v?'on':''}" data-k="sort" data-v="${v}" aria-pressed="${F.sort===v}">${l}</button>`).join('')}</div>`
 +`<div class="qfd"><button type="button" class="qfd-h" data-k="fo" aria-expanded="${FO||!!F.topic}">Jump to topic${chev}</button>${FO||F.topic?`<div class="qfd-b">${PARTS.map(p=>{const ts=tids.filter(t=>PO[t]===p[0]&&cnt(d=>d[2]===t,'topic')>0);return ts.length?`<h5>${esc(p[1])}</h5>`+ts.map(t=>`<button type="button" class="qti${F.topic===t?' on':''}" data-k="topic" data-v="${t}"><b>${esc(tname(t))}</b><span>${cnt(d=>d[2]===t,'topic')}</span></button>`).join(''):''}).join('')}</div>`:''}</div>`
 +`</div><div class="qf-foot"><button type="button" class="gb" data-k="close">Show ${tot} question${tot===1?'':'s'}</button></div>`;
 if(keep){const b=qf.querySelector(`[data-k="${keep[0]}"][data-v="${keep[1]}"]`);b&&b.focus()}
}

/* ---------- list ---------- */
function actChips(){const o=[];
 if(F.show!=='all')o.push([SHOW.find(s=>s[0]===F.show)[1],'show','all']);
 if(F.type)o.push([F.type==='W'?'Written':'Viva','type','']);
 if(F.part)o.push([PARTS.find(p=>p[0]===F.part)[1],'part','']);
 if(F.letter)o.push([F.letter+'-box','letter','']);
 if(F.card)o.push(['Card '+F.card,'card','']);
 if(F.topic)o.push([tname(F.topic),'topic','']);
 if(F.sort!=='book')o.push(['By card number','sort','book']);
 return o}
function apply(){
 const flat=F.sort==='card',act=nAct()||F.q,hit=DATA.filter(d=>pass(d)),ok=new Set(hit.map(d=>d[3])),list=$q('qlist'),fl=$q('qflat');
 list.hidden=flat;fl.hidden=!flat;
 if(flat){const grp={};hit.slice().sort((x,y)=>cardCmp(x[0],y[0])||BOOK[x[3]]-BOOK[y[3]]).forEach(d=>(grp[d[0]]=grp[d[0]]||[]).push(d));
  fl.innerHTML=Object.keys(grp).sort(cardCmp).map(c=>sec(c,'Card '+c,grp[c],'data-c="'+c+'"')).join('');fl.querySelectorAll('.qi').forEach(lbl)}
 else{list.querySelectorAll('.qi').forEach(i=>i.hidden=!ok.has(i.dataset.id));
  list.querySelectorAll('.qs').forEach(s=>{const v=s.querySelectorAll('.qi:not([hidden])').length;s.hidden=!v;if(act&&v){s.querySelector('.qs-h').setAttribute('aria-expanded',true);s.querySelector('.qs-b').hidden=false}})}
 $q('qnone').hidden=!!hit.length;
 $q('qsum').textContent=hit.length===DATA.length?DATA.length+' questions':hit.length+' of '+DATA.length+' questions';
 $q('qact').innerHTML=actChips().map(([l,k,v])=>`<button type="button" class="qchip" data-k="${k}" data-v="${v}" data-x="1" aria-label="Remove filter ${esc(l)}">${esc(l)}${IC.x}</button>`).join('');
 const n=nAct()+!!F.q,b=$q('qfn');b.hidden=!n;b.textContent=n}
function run(){apply();panel()}
function set(k,v){
 if(k==='show')F.show=v;
 else if(k==='type')F.type=F.type===v?'':v;
 else if(k==='part')F.part=F.part===v?'':v;
 else if(k==='letter'){F.letter=F.letter===v?'':v;if(F.letter&&F.card&&cardOf(F.card)[0]!==F.letter)F.card=''}
 else if(k==='card'){F.card=v;if(v)F.letter=cardOf(v)[0];DD=false}
 else if(k==='sort')F.sort=v;
 else if(k==='topic')F.topic=F.topic===v?'':v;
 else if(k==='dd')DD=!DD;
 else if(k==='fo')FO=!FO;
 else if(k==='reset'){Object.assign(F,{show:'all',type:'',part:'',letter:'',card:'',sort:'book',topic:'',q:''});$q('qfilter').value='';DD=false}
 run()}
qf.addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(!b||b.disabled)return;if(b.dataset.k==='close')return openF(false);set(b.dataset.k,b.dataset.v)});
$q('qact').addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(!b)return;const k=b.dataset.k;if(k==='type'||k==='part'||k==='letter'||k==='topic')F[k]='';else if(k==='card')F.card='';else F[k]=b.dataset.v;run()});
$q('qclr').onclick=()=>set('reset');

/* drawer (tablet) / bottom sheet (phone) / docked sidebar (wide) */
function openF(o){document.body.classList.toggle('qf-open',o);$q('qfopen').setAttribute('aria-expanded',o);if(o)setTimeout(()=>{const f=qf.querySelector('.qf-x');f&&f.offsetParent&&f.focus()},60);else if(document.activeElement&&qf.contains(document.activeElement))$q('qfopen').focus()}
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
