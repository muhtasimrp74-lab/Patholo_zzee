/* ===== Subtopic headings + jump bar on every chapter page, and a grouped chapter picker ===== */
(function(){try{
if(typeof QMETA==='undefined')return;
const TREE=QMETA.tree||{},CHS=QMETA.chapters||[],PARTS=QMETA.parts||[],PART_OF=QMETA.partOf||{};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const slug=s=>String(s).toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const isTopic=v=>/^v-c?\d+$/.test(v.id)&&!!v.querySelector('main article.card[id^=q]');
const views=[...document.querySelectorAll('.view')].filter(isTopic);

/* sub-chapter order = book order from QMETA.chapters */
const rank={};let rk=0;
CHS.forEach(c=>(c[3]||[]).forEach(sb=>{const k=c[0]+'|'+sb;if(!(k in rank))rank[k]=rk++}));

/* 1. every chapter gets <h3 class="sub"> headings; cards are grouped under them */
function structure(v){
  const main=v.querySelector('main');
  if(main.querySelector(':scope > h3.sub'))return;            // hand-made headings already there
  const cards=[...main.querySelectorAll(':scope > article.card')];
  const groups=new Map();
  cards.forEach((c,i)=>{const t=TREE[c.id]||[];const k=(t[0]==null?'':t[0])+'|'+(t[1]||'Other');
    if(!groups.has(k))groups.set(k,{name:t[1]||'Other',cards:[],first:i});groups.get(k).cards.push(c)});
  const arr=[...groups.entries()].sort((a,b)=>(a[0] in rank?rank[a[0]]:1e6+a[1].first)-(b[0] in rank?rank[b[0]]:1e6+b[1].first));
  const ref=main.querySelector(':scope > .none')||main.querySelector(':scope > .pager');
  const used=new Set();
  arr.forEach(([k,g])=>{
    const h=document.createElement('h3');h.className='sub';
    let id='sub-'+v.id.slice(2)+'-'+slug(g.name),n=2;while(used.has(id))id+='-'+n++;used.add(id);
    h.id=id;h.textContent=g.name;
    main.insertBefore(h,ref);g.cards.forEach(c=>main.insertBefore(c,ref));
  });
  const after=[...main.querySelectorAll(':scope > article.card')];
  if(after.some((c,i)=>c!==cards[i])){const l=v.querySelector('.lede');
    if(l)l.textContent=l.textContent.replace(/in the same order as the NMC viva list/,'grouped by topic, in NMC order within each topic')}
}

/* 2. sticky subtopic jump bar (replaces the old chip row) */
const cnt=h=>{let n=0,e=h.nextElementSibling;while(e&&e.matches('article.card')){n++;e=e.nextElementSibling}return n};
function subnav(v){
  const bar=v.querySelector('.bar');if(!bar)return;
  bar.querySelectorAll('.chips,.subnav').forEach(x=>x.remove());
  const hs=[...v.querySelectorAll('main > h3.sub')];
  v._hs=hs;v._sn=null;
  if(hs.length<2)return;
  const sn=document.createElement('nav');sn.className='subnav';sn.setAttribute('aria-label','Jump to subtopic');
  sn.innerHTML='<div class="sn-in">'+hs.map((h,i)=>'<button type="button" class="sn-c" data-i="'+i+'"><span>'+esc(h.textContent.trim())+'</span><i>'+cnt(h)+'</i></button>').join('')+'</div>';
  bar.appendChild(sn);
  const sc=sn.firstChild,chips=[...sc.children];let cur=-1;
  const mark=i=>{if(i===cur)return;cur=i;chips.forEach((c,j)=>{c.setAttribute('aria-current',j===i?'true':'false')});
    const c=chips[i];if(c){const l=c.offsetLeft-(sc.clientWidth-c.offsetWidth)/2;sc.scrollTo({left:l,behavior:reduce?'auto':'smooth'})}};
  sn.addEventListener('click',e=>{const b=e.target.closest('.sn-c');if(!b)return;const i=+b.dataset.i;
    hs[i].scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});mark(i)});
  v._sn=()=>{const line=bar.getBoundingClientRect().bottom+16;let a=0;
    hs.forEach((h,i)=>{if(!h.classList.contains('sn-empty')&&h.getBoundingClientRect().top<=line)a=i});mark(a)};
  v._sn();
}

/* hide chips/headings with no visible card (search or filter chips) */
function refresh(v){
  if(!v._hs)return;const sc=v.querySelector('.sn-in');
  v._hs.forEach((h,i)=>{let any=false,e=h.nextElementSibling;
    while(e&&e.matches('article.card')){if(!e.classList.contains('hide')&&!e.classList.contains('tf-hide'))any=true;e=e.nextElementSibling}
    h.classList.toggle('sn-empty',!any);if(sc&&sc.children[i])sc.children[i].hidden=!any});
}

/* 3. chapter picker: one clean sheet, grouped by part, with filter */
let PK=null,opener=null;
const parts=PARTS.length?PARTS:[['gp','General Pathology','A'],['hm','Haematology','B'],['sys','Systemic Pathology','C']];
function topics(){
  return views.map(v=>{const id=v.id.slice(2);
    const no=((v.querySelector('.crumb')||{}).textContent||'').split('/').pop().trim();
    const num=parseFloat((no.match(/\d+/)||[999])[0]);
    return{id,no,num,name:((v.querySelector('h1')||{}).textContent||'').trim(),
      n:v.querySelectorAll('main article.card[id^=q]').length,part:PART_OF[id]||'sys'}});
}
function render(cur){
  const T=topics(),l=PK.querySelector('.cp-l');
  l.innerHTML=parts.map(p=>{const rows=T.filter(t=>t.part===p[0]).sort((a,b)=>a.num-b.num);if(!rows.length)return'';
    return'<section class="cp-g"><h4>'+esc(p[1])+'<small>'+rows.reduce((s,t)=>s+t.n,0)+' questions</small></h4>'+
      rows.map(t=>'<a class="cp-r" href="#/'+t.id+'"'+(t.id===cur?' aria-current="page"':'')+' data-t="'+esc((t.no+' '+t.name).toLowerCase())+'">'+
        '<b>'+esc(t.no)+'</b><span>'+esc(t.name)+'</span><i>'+t.n+'</i></a>').join('')+'</section>'}).join('');
  PK.querySelector('.cp-q').value='';PK.querySelector('.cp-e').hidden=true;
}
function build(){
  PK=document.createElement('div');PK.id='cp';PK.hidden=true;
  PK.innerHTML='<div class="cp-bd"></div><div class="cp-sh" role="dialog" aria-modal="true" aria-label="Jump to chapter">'+
    '<div class="cp-hd"><b>Jump to chapter</b><button type="button" class="cp-x" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>'+
    '<input class="cp-q" type="search" placeholder="Filter chapters…" aria-label="Filter chapters" autocomplete="off">'+
    '<div class="cp-l"></div><p class="cp-e" hidden>No chapter matches.</p></div>';
  document.body.appendChild(PK);
  PK.addEventListener('click',e=>{if(e.target.closest('.cp-bd,.cp-x')||e.target.closest('a.cp-r'))close()});
  PK.querySelector('.cp-q').addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();let n=0;
    PK.querySelectorAll('.cp-r').forEach(a=>{const ok=!q||a.dataset.t.includes(q);a.hidden=!ok;if(ok)n++});
    PK.querySelectorAll('.cp-g').forEach(g=>g.hidden=!g.querySelector('.cp-r:not([hidden])'));
    PK.querySelector('.cp-e').hidden=n>0});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!PK.hidden)close()});
  addEventListener('hashchange',()=>{if(!PK.hidden)close(true)});
}
function open(v,b){if(!PK)build();opener=b;render(v.id.slice(2));PK.hidden=false;document.body.classList.add('cp-lock');
  const l=PK.querySelector('.cp-l'),c=l.querySelector('[aria-current]');if(c)l.scrollTop=Math.max(0,c.offsetTop-l.clientHeight/2);
  if(!matchMedia('(pointer:coarse)').matches)PK.querySelector('.cp-q').focus()}
function close(quiet){PK.hidden=true;document.body.classList.remove('cp-lock');if(!quiet&&opener&&opener.focus)opener.focus()}
function picker(v){
  const old=v.querySelector('.bar .dd')||v.querySelector('.bar select.jump');if(!old)return;
  const no=((v.querySelector('.crumb')||{}).textContent||'').split('/').pop().trim(),nm=((v.querySelector('h1')||{}).textContent||'').trim();
  const b=document.createElement('button');b.type='button';b.className='cp-btn';b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-label','Jump to chapter. Current: '+no+' '+nm);
  b.innerHTML='<b>'+esc(no)+'</b><span>'+esc(nm)+'</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  b.addEventListener('click',()=>open(v,b));
  old.replaceWith(b);
}

views.forEach(v=>{structure(v);subnav(v);picker(v);refresh(v);
  v.addEventListener('input',()=>setTimeout(()=>refresh(v),30));
  v.addEventListener('click',()=>setTimeout(()=>refresh(v),90));
});
let raf=0;
addEventListener('scroll',()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;const v=document.querySelector('.view:not([hidden])');if(v&&v._sn)v._sn()})},{passive:true});
addEventListener('hashchange',()=>setTimeout(()=>{const v=document.querySelector('.view:not([hidden])');if(v&&v._sn)v._sn()},120));
}catch(err){console.error('subnav',err)}})();
