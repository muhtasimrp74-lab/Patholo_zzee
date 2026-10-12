/* ============ Annotations v2 ============
   Pen, highlighter and eraser on question answers (more hosts and tools follow in later phases).
   - Data lives in IndexedDB "pathviva-annot" (stores: docs, meta) on this device only; nothing is sent anywhere.
   - Every object is anchored to the text block it was drawn on (hash of the block's text + occurrence), so ink follows
     the text when the font size or the width changes. An object whose block can no longer be found is kept, never dropped.
   - The old "pathviva-ink" database is only ever READ (once, to migrate); it is never written or deleted.
   - window.Ink = {dump, load} is a thin shim over this store, kept so older code and backups keep working. */
(function(){'use strict';
if(window.Annot)return;
const DBN='pathviva-annot',LEG='pathviva-ink',REF=4000,YU=10;
const MAX={docs:3000,objs:20000,all:200000,g:300000,txt:5000,bytes:80e6};
const $=(s,r=document)=>r.querySelector(s);
const fsNow=()=>{try{return+(S.pref&&S.pref.fs)||1}catch(e){return 1}};
const themeNow=()=>{const r=document.documentElement,t=r.dataset.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');return t==='dark'?'dark':r.dataset.tone==='sepia'?'sepia':'light'};
const ID=()=>Math.random().toString(36).slice(2,8);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;

/* ---------- semantic palette: stored as a token, remapped per theme so black ink stays legible in dark ---------- */
const PAL={k:['#1d1a19','#2b2216','#f2ede8','Black'],b:['#1f4fd8','#1f4a9a','#8fb0ff','Blue'],r:['#c62828','#b23a1e','#ff8f86','Red'],g:['#1e7a3c','#2d6a2a','#86d9a0','Green'],cl:['#c4573a','#b0502f','#ee9070','Clay'],sg:['#6f8a4e','#667f45','#adcb8e','Sage'],pl:['#8e4f80','#84497a','#dba2cc','Plum']};
const HLP={y:['#ffe14a','#f3d34a','#c9a91c','Yellow'],gr:['#8fe08f','#8fd48a','#4a9a58','Green'],pk:['#ff9ec4','#f2a0b5','#b85684','Pink'],o:['#ffb35c','#f0a650','#b9722a','Orange'],bl:['#7fc8ff','#86bfe8','#3a78b8','Blue'],v:['#c6a3ff','#b99be0','#7a58b8','Violet']};
const TH={light:0,sepia:1,dark:2};
let printing=false;
function col(c,hl){if(/^#[0-9a-f]{6}$/i.test(c))return c;const t=(hl?HLP:PAL)[c]||PAL.k;return t[printing?0:TH[themeNow()]]}

/* ---------- compact geometry: [x,y,pressure] ints, delta + zigzag + varint, base64 ---------- */
const zz=n=>(n<<1)^(n>>31),uz=n=>(n>>>1)^-(n&1);
function enc(p){const o=[];let a=0,b=0,c=0;const w=v=>{v=zz(v)>>>0;while(v>127){o.push(v&127|128);v>>>=7}o.push(v)};
 for(const q of p){w(q[0]-a);w(q[1]-b);w(q[2]-c);a=q[0];b=q[1];c=q[2]}let s='';for(let i=0;i<o.length;i+=8192)s+=String.fromCharCode.apply(null,o.slice(i,i+8192));return btoa(s)}
function dec(g){let s;try{s=atob(g)}catch(e){return[]}const out=[];let i=0,a=0,b=0,c=0;const r=()=>{let v=0,sh=0,x;do{x=s.charCodeAt(i++);v|=(x&127)<<sh;sh+=7}while(x&128&&i<=s.length&&sh<35);return uz(v>>>0)};
 while(i<s.length){a+=r();b+=r();c+=r();out.push([a,b,c])}return out}

/* ---------- block anchors ---------- */
const BLK='p,li,table,figure,aside,blockquote,h1,h2,h3,h4,h5,pre',BL=new WeakMap();
function fnv(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,'0')}
function mxBlocks(host){const list=[],map=new Map(),st=host.querySelector(':scope > h3');if(st){list.push({el:st,id:'s'});map.set('s',st)}
 host.querySelectorAll('.mx-opts [data-j]').forEach(b=>{const id='o'+b.dataset.j;if(!/^o[0-4]$/.test(id)||map.has(id))return;const el=b.closest('.mx-s')||b;list.push({el,id});map.set(id,el)});return{sig:'mx',list,map}}
function blocksOf(host){if(host.matches&&host.matches(MXS))return mxBlocks(host);const sig=host.childElementCount+':'+host.textContent.length;let c=BL.get(host);if(c&&c.sig===sig)return c;
 const list=[],map=new Map(),seen={};
 host.querySelectorAll(BLK).forEach(el=>{const tb=el.closest('table');if(tb&&tb!==el)return;if(el.tagName==='P'&&el.closest('li'))return;
  const t=(el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase()||('<'+el.tagName+'>'),h=fnv(t),n=seen[h]=(seen[h]||0)+1,id=n>1?h+'.'+(n-1):h;list.push({el,id});map.set(id,el)});
 c={sig,list,map};BL.set(host,c);return c}
function nearest(host,x,y){const hr=host.getBoundingClientRect();let best=null,bd=1e9,ba=1e12;
 for(const b of blocksOf(host).list){const r=b.el.getBoundingClientRect();if(!r.width&&!r.height)continue;const l=r.left-hr.left,t=r.top-hr.top,dx=Math.max(l-x,0,x-(l+r.width)),dy=Math.max(t-y,0,y-(t+r.height)),d=Math.hypot(dx,dy),ar=r.width*r.height;
  if(d<bd-.01||(Math.abs(d-bd)<=.01&&ar<ba)){best=b;bd=d;ba=ar}}return best}
function origin(host,a,hr){if(!a||!a.b)return{x:0,y:0};const el=blocksOf(host).map.get(a.b);if(!el)return null;const r=el.getBoundingClientRect(),h=hr||host.getBoundingClientRect();return{x:r.left-h.left,y:r.top-h.top}}

/* ---------- storage ---------- */
const St={db:null,docs:Object.create(null),dirty:new Set(),timer:0,mem:false,warned:false,meta:{},undo:Object.create(null),redo:Object.create(null)};
let readyRes;const ready=new Promise(r=>{readyRes=r});let isReady=false;
const rq=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const txd=tx=>new Promise((res,rej)=>{tx.oncomplete=()=>res();tx.onerror=tx.onabort=()=>rej(tx.error||new Error('tx aborted'))});
function openDb(){return new Promise((res,rej)=>{if(!window.indexedDB)return rej(new Error('no indexedDB'));const r=indexedDB.open(DBN,1);
 r.onupgradeneeded=()=>{r.result.createObjectStore('docs',{keyPath:'k'});r.result.createObjectStore('meta',{keyPath:'k'})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function warn(){if(St.warned)return;St.warned=true;try{alert('Handwriting could not be saved on this device (storage full or blocked). Your marks are still on screen until you leave this page. Use Menu > Export backup now to keep a copy.')}catch(e){}}
function touch(k,quiet){const d=St.docs[k];if(!d)return;d.rev=(d.rev||0)+1;d.upd=Date.now();St.dirty.add(k);clearTimeout(St.timer);St.timer=setTimeout(flush,300);quiet||nudges()}
async function flush(){clearTimeout(St.timer);if(!St.dirty.size)return;const keys=[...St.dirty];St.dirty.clear();
 if(!St.db){St.mem=true;warn();return}
 try{const tx=St.db.transaction('docs','readwrite'),os=tx.objectStore('docs');
  keys.forEach(k=>{const d=St.docs[k];d&&d.objs.length?os.put(d):os.delete(k)});await txd(tx)}catch(e){keys.forEach(k=>St.dirty.add(k));warn()}}
async function metaPut(k,v){if(!St.db)return;try{const tx=St.db.transaction('meta','readwrite');tx.objectStore('meta').put({k,v});await txd(tx)}catch(e){}}
const metaGet=async k=>{if(!St.db)return undefined;try{const r=await rq(St.db.transaction('meta').objectStore('meta').get(k));return r&&r.v}catch(e){return undefined}};
function setting(k,v){St.meta.set=St.meta.set||{};St.meta.set[k]=v;clearTimeout(setting.t);setting.t=setTimeout(()=>metaPut('settings',St.meta.set),400)}

/* ---------- validation of anything that comes from outside (backup files) ---------- */
const KEYRE=/^(q:q\d{1,6}|m:[0-9a-f]{8}|t:ch\d{2})$/,TYPES=['stroke','shape','text','note','sticker','mark'],KINDS=['ball','fnt','pen','hl','line','arrow','rect','ellipse','tri','brace','box','pin','star','ask','tick','cross','bulb','exam','u','s','sq','hi','conf'];
const num=(v,a,b)=>typeof v==='number'&&isFinite(v)&&v>=a&&v<=b;
function cleanObj(o){if(!o||typeof o!=='object'||Array.isArray(o))return null;
 if(typeof o.i!=='string'||!/^[\w.-]{1,16}$/.test(o.i)||!TYPES.includes(o.t)||!KINDS.includes(o.k))return null;
 if(typeof o.c!=='string'||!/^([a-z]{1,3}|#[0-9a-f]{6})$/i.test(o.c)||!num(o.w,.05,400))return null;
 const a=o.a;if(!a||typeof a!=='object'||Array.isArray(a))return null;let an={};
 if(a.b!=null){if(typeof a.b!=='string'||!/^([0-9a-f]{8}(\.\d{1,5})?|s|o[0-4])$/.test(a.b))return null;an.b=a.b}else an.b=null;
 if(a.h!=null){if(a.h!==1)return null;an.h=1}
 const r={i:o.i,t:o.t,k:o.k,c:o.c,w:+o.w,a:an};
 if(o.g!==undefined){if(typeof o.g!=='string'||o.g.length>MAX.g||!/^[A-Za-z0-9+/]*={0,2}$/.test(o.g))return null;r.g=o.g}
 if(o.al!==undefined){if(!num(o.al,.05,1))return null;r.al=+o.al}
 if(o.x!==undefined){if(typeof o.x!=='string'||o.x.length>MAX.txt)return null;r.x=o.x}
 if(o.q!==undefined){if(!o.q||typeof o.q!=='object'||Array.isArray(o.q))return null;const q={};let n=0;for(const k in o.q){if(++n>12||!/^\w{1,8}$/.test(k))return null;const v=o.q[k];if(k==='f'&&!['sans','serif','hand'].includes(v))return null;if(typeof v==='string'&&v.length<=MAX.txt)q[k]=v;else if(num(v,-1e7,1e7))q[k]=v;else return null}r.q=q}
 return r}
function validate(p){if(!p||typeof p!=='object'||Array.isArray(p)||p.v!==1||!p.docs||typeof p.docs!=='object'||Array.isArray(p.docs))return null;
 const ks=Object.keys(p.docs);if(ks.length>MAX.docs)return null;let all=0,bytes=0;const out={v:1,docs:Object.create(null)};
 for(const k of ks){if(!KEYRE.test(k))return null;const d=p.docs[k];if(!d||typeof d!=='object'||Array.isArray(d)||!Array.isArray(d.objs)||d.objs.length>MAX.objs)return null;
  const ids=new Set(),objs=[];for(const o of d.objs){const c=cleanObj(o);if(!c||ids.has(c.i))return null;ids.add(c.i);objs.push(c);bytes+=(c.g?c.g.length:0)+(c.x?c.x.length:0)+60}
  all+=objs.length;if(all>MAX.all||bytes>MAX.bytes)return null;
  out.docs[k]={k,v:2,rev:num(d.rev,0,1e9)?d.rev|0:0,upd:num(d.upd,0,4e12)?d.upd:0,objs}}
 return out}

/* ---------- legacy ink (pathviva-ink) -> v2 docs. Read-only. ---------- */
const alias=()=>{try{return typeof QALIAS==='object'?QALIAS:{}}catch(e){return{}}};
function legacyDoc(o){if(!o||!(o.w>0)||!(o.fs>0)||!Array.isArray(o.strokes))return[];const out=[];
 o.strokes.forEach((s,n)=>{if(!s||(s.t!=='p'&&s.t!=='h')||!/^#[0-9a-f]{6}$/i.test(s.c)||!(s.s>=.5&&s.s<=80)||!Array.isArray(s.p)||s.p.length<2||s.p.length%2||s.p.length>40000||!s.p.every(Number.isFinite))return;
  const pts=[];for(let j=0;j<s.p.length;j+=2)pts.push([Math.round(clamp(s.p[j],-50,50)*REF),Math.round(clamp(s.p[j+1],-1e6,1e6)*o.w/(o.fs*o.fs*800)*YU),50]);
  const r={i:'l'+n+'-'+String(o.id||'').slice(0,8),t:'stroke',k:s.t==='h'?'hl':'ball',c:s.c,w:+(s.s/o.fs).toFixed(3),a:{b:null,h:1},g:enc(pts)};if(s.t==='h')r.al=.35;out.push(r)});return out}
function fromLegacy(map){const al=alias(),docs=Object.create(null);if(!map||typeof map!=='object')return docs;
 const add=(id,o)=>{const t=al[id]||id,k='q:'+t;if(!/^q\d{1,6}$/.test(t))return;const objs=legacyDoc(Object.assign({id},o));if(!objs.length)return;(docs[k]=docs[k]||{k,v:2,rev:1,upd:Date.now(),objs:[]}).objs.push(...objs)};
 for(const id in map)if(!(id in al))add(id,map[id]);for(const id in map)if(id in al)add(id,map[id]);return docs}
function readLegacy(){return new Promise(res=>{if(!window.indexedDB)return res(null);let r;try{r=indexedDB.open(LEG)}catch(e){return res(null)}
 r.onupgradeneeded=e=>{try{e.target.transaction.abort()}catch(x){}};r.onerror=()=>res(null);r.onblocked=()=>res(null);
 r.onsuccess=()=>{const d=r.result;if(!d.objectStoreNames.contains('ink')){d.close();return res(null)}
  const q=d.transaction('ink').objectStore('ink').getAll();q.onsuccess=()=>{d.close();res(q.result||[])};q.onerror=()=>{d.close();res(null)}}})}
function mergeDocs(into,from){for(const k in from){const f=from[k],t=into[k];if(!t){into[k]=f;continue}const ids=new Set(t.objs.map(o=>o.i));f.objs.forEach(o=>{if(!ids.has(o.i))t.objs.push(o)});t.rev=(t.rev||0)+1;t.upd=Date.now()}}
async function migrate(){if(!St.db)return;if((await metaGet('migrated'))===1)return;const rec=await readLegacy();if(rec===null)return;
 const map={};rec.forEach(r=>{if(r&&typeof r.id==='string')map[r.id]=r});const docs=fromLegacy(map),keys=Object.keys(docs);
 if(keys.length){const had={};for(const k of keys)had[k]=St.docs[k]?St.docs[k].objs.length:0;mergeDocs(St.docs,docs);keys.forEach(k=>St.dirty.add(k));await flush();
  const back=await rq(St.db.transaction('docs').objectStore('docs').getAll()),by={};back.forEach(d=>{by[d.k]=d});
  for(const k of keys){const want=St.docs[k].objs.length,got=by[k]?by[k].objs.length:0;if(want!==got)return}}   /* verification failed: leave the flag unset, legacy data untouched */
 await metaPut('migrated',1)}

/* ---------- init ---------- */
async function init(){try{St.db=await openDb();const all=await rq(St.db.transaction('docs').objectStore('docs').getAll());all.forEach(d=>{if(d&&KEYRE.test(d.k)&&Array.isArray(d.objs))St.docs[d.k]=d});
  St.meta.set=(await metaGet('settings'))||{};await migrate()}catch(e){St.mem=true}
 try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
 applySettings(St.meta.set);St.meta.sinceBackup=+(await metaGet('sinceBackup'))||0;buildUi();mxInit();for(const k in St.docs){const h=hostByKey(k);h&&layerOf(h,k)}
 isReady=true;readyRes();document.dispatchEvent(new Event('annot-ready'))}

/* ---------- settings (persisted, validated on read) ---------- */
const DEFPRE=[{t:'pen',p:'ball',c:'k',z:2.2},{t:'pen',p:'fnt',c:'b',z:3.2},{t:'pen',p:'pencil',c:'r',z:3},{t:'hl',c:'y',z:14},{t:'pen',p:'ball',c:'g',z:2.2}];
const P={tool:'pen',erm:'stroke',erf:'all',font:'sans',snap:true,shape:'line',stk:'star',mk:'hi',pen:'ball',col:'k',hlc:'y',mode:'pf',gest:true,barrel:'er',smooth:.5,press:1,sizes:{ball:2.2,fnt:3.2,pencil:3,hl:14,er:14,shape:2.2,tx:16,st:30},pre:DEFPRE.map(x=>Object.assign({},x)),pos:null,mini:false,seenPen:false,hide:false};
const KIND={ball:'ball',fnt:'fnt',pencil:'pen'};
function applySettings(s){if(!s||typeof s!=='object')return;const pick=(k,ok)=>{if(k in s&&ok(s[k]))P[k]=s[k]};
 pick('tool',v=>['pen','hl','hi','shape','tx','st','nt','ls','om','sel','er','hand'].includes(v));pick('stk',v=>['star','exam','ask','tick','cross','bulb'].includes(v));pick('mk',v=>['hi','u','s','sq'].includes(v));pick('gest',v=>typeof v==='boolean');pick('barrel',v=>['er','hl','off'].includes(v));pick('shape',v=>['line','arrow','rect','ellipse','tri','brace'].includes(v));pick('snap',v=>typeof v==='boolean');pick('font',v=>['sans','serif','hand'].includes(v));pick('erm',v=>v==='stroke'||v==='precise');pick('erf',v=>v==='all'||v==='hl');pick('pen',v=>v in KIND);pick('col',v=>v in PAL||/^#[0-9a-f]{6}$/i.test(v));pick('hlc',v=>v in HLP||/^#[0-9a-f]{6}$/i.test(v));pick('mode',v=>v==='pf'||v==='po');
 pick('smooth',v=>num(v,0,1));pick('press',v=>num(v,0,1));pick('mini',v=>typeof v==='boolean');pick('hide',v=>typeof v==='boolean');pick('seenPen',v=>typeof v==='boolean');
 pick('pos',v=>Array.isArray(v)&&v.length===2&&v.every(n=>num(n,-5000,20000)));
 if(s.sizes&&typeof s.sizes==='object')for(const k in P.sizes)if(num(s.sizes[k],1,60))P.sizes[k]=s.sizes[k];
 if(Array.isArray(s.pre)&&s.pre.length===5){const okc=c=>typeof c==='string'&&(c in PAL||c in HLP||/^#[0-9a-f]{6}$/i.test(c)),ok=q=>q&&typeof q==='object'&&['pen','hl','shape'].includes(q.t)&&okc(q.c)&&num(q.z,1,60)&&(q.t!=='pen'||q.p in KIND)&&(q.t!=='shape'||['line','arrow','rect','ellipse','tri','brace'].includes(q.s));if(s.pre.every(ok))P.pre=s.pre.map(q=>({t:q.t,p:q.p,s:q.s,c:q.c,z:q.z}))}}

/* ---------- layers (one per answer) ---------- */
const layers=new Map();let active=null;
const MXS='article.mx-card[data-h]';
const hostByKey=k=>{if(!k)return null;if(k.startsWith('q:')){const id=k.slice(2),c=document.getElementById(id);return c&&/^q\d+$/.test(id)?c.querySelector('.ans'):null}if(k.startsWith('m:')&&/^m:[0-9a-f]{8}$/.test(k))return document.querySelector('article.mx-card[data-h="'+k.slice(2)+'"]');return null};
const hostById=id=>hostByKey('q:'+id);
const keyOf=h=>{if(h.matches&&h.matches(MXS)){const x=h.dataset.h;return /^[0-9a-f]{8}$/.test(x)?'m:'+x:null}const c=h.closest('.card');return c&&/^q\d+$/.test(c.id)?'q:'+c.id:null};
const hostOf=t=>{const h=t&&t.closest&&t.closest('.card .ans,'+MXS);return h&&keyOf(h)?h:null};
const ro=new ResizeObserver(es=>es.forEach(e=>{const L=layers.get(e.target);L&&sched(L)}));
function layerOf(host,key,make){let L=layers.get(host);if(L)return L;key=key||keyOf(host);if(!key)return null;
 L={host,key,hl:null,ink:null,wet:null,raf:0,fresh:true};layers.set(host,L);host.classList.add('an-host');ro.observe(host);sched(L);return L}
function cv(L,cls){let c=L[cls];if(!c){c=document.createElement('canvas');c.className='an-c '+cls;c.setAttribute('aria-hidden','true');L.host.append(c);L[cls]=c}return c}
function size(c,w,h){const d=Math.min(2,window.devicePixelRatio||1),k=Math.min(d,Math.sqrt(16e6/(w*h)),4096/Math.max(w,h)),W=Math.max(1,Math.round(w*k)),H=Math.max(1,Math.round(h*k));if(c.width!==W||c.height!==H){c.width=W;c.height=H}const g=c.getContext('2d');g.setTransform(W/w,0,0,H/h,0,0);return g}
const sched=L=>{if(L.raf)return;L.raf=requestAnimationFrame(()=>{L.raf=0;paint(L);if(sel&&sel.L===L)showSel()})};
const docOf=k=>St.docs[k];
function pxOf(L,o,hr){const host=L.host,W=host.clientWidth,f=fsNow(),a=o.a;let ox=0,oy=0;
 if(a.h){/* migrated, not yet anchored to a block */}else{const org=origin(host,a,hr);if(!org)return null;ox=org.x;oy=org.y}
 return dec(o.g||'').map(q=>a.h?[q[0]/REF*W,q[1]/YU*800*f*f/W,q[2]/100]:[ox+q[0]/REF*W,oy+q[1]/YU*f,q[2]/100])}
function adopt(L,d){const host=L.host,W=host.clientWidth;if(!W)return;let ch=0,hr=host.getBoundingClientRect();
 d.objs.forEach(o=>{if(!o.a.h||!o.g)return;const pts=pxOf(L,o,hr);if(!pts||!pts.length)return;const bl=nearest(host,pts[0][0],pts[0][1]);if(!bl)return;
  const org=origin(host,{b:bl.id},hr),f=fsNow();o.g=enc(pts.map(p=>[Math.round((p[0]-org.x)/W*REF),Math.round((p[1]-org.y)/f*YU),Math.round(p[2]*100)]));o.a={b:bl.id};o.w=+(o.w);ch=1});
 if(ch)touch(L.key,1)}
/* ---------- drawing ---------- */
function widthAt(k,base,p,tilt){const q=1+(p-.5)*.5*P.press;if(k==='fnt')return base*(.25+1.5*Math.pow(clamp(p,0,1),1+.8*(P.press))*(P.press?1:.5)+(P.press?0:.5));if(k==='pen')return base*(.8+.6*p)*(1+(tilt||0)*.8);return base*clamp(q,.6,1.4)}
function outline(pts,wf){const n=pts.length,L=[],R=[];for(let i=0;i<n;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(n-1,i+1)];let dx=b[0]-a[0],dy=b[1]-a[1];const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;const h=wf(i)/2;L.push([pts[i][0]-dy*h,pts[i][1]+dx*h]);R.push([pts[i][0]+dy*h,pts[i][1]-dx*h])}return{L,R}}
function qpath(g,a,first){if(a.length<2){return}if(first)g.moveTo(a[0][0],a[0][1]);else g.lineTo(a[0][0],a[0][1]);for(let i=1;i<a.length-1;i++)g.quadraticCurveTo(a[i][0],a[i][1],(a[i][0]+a[i+1][0])/2,(a[i][1]+a[i+1][1])/2);g.lineTo(a[a.length-1][0],a[a.length-1][1])}
const grain={};function pattern(g,color){let p=grain[color];if(!p){const c=document.createElement('canvas');c.width=c.height=48;const x=c.getContext('2d');x.fillStyle=color;let s=7;for(let i=0;i<900;i++){s=(s*16807)%2147483647;const px=s%48;s=(s*16807)%2147483647;const py=s%48;x.globalAlpha=.35+(s%60)/100;x.fillRect(px,py,1.4,1.4)}x.globalAlpha=.55;x.fillRect(0,0,48,48);p=grain[color]=g.createPattern(c,'repeat')}return p}
function drawStroke(g,pts,kind,color,w,al,fs){const f=fs||fsNow(),base=w*f;if(!pts.length)return;g.save();g.globalAlpha=al==null?1:al;
 if(kind==='hl'){g.strokeStyle=color;g.lineWidth=base;g.lineCap='butt';g.lineJoin='round';g.beginPath();if(pts.length<2){g.moveTo(pts[0][0]-base/2,pts[0][1]);g.lineTo(pts[0][0]+base/2,pts[0][1])}else qpath(g,pts,true);g.stroke();g.restore();return}
 const wf=i=>Math.max(.4,widthAt(kind,base,pts[i][2],0)),first=wf(0),last=wf(pts.length-1);g.fillStyle=kind==='pen'?pattern(g,color):color;g.strokeStyle=color;
 if(kind==='pen')g.globalAlpha*=.8;
 if(pts.length<2){g.beginPath();g.arc(pts[0][0],pts[0][1],first/2,0,6.3);g.fill();g.restore();return}
 const o=outline(pts,wf);g.beginPath();qpath(g,o.L,true);qpath(g,o.R.slice().reverse(),false);g.closePath();g.fill();
 g.beginPath();g.arc(pts[0][0],pts[0][1],first/2,0,6.3);g.arc(pts[pts.length-1][0],pts[pts.length-1][1],last/2,0,6.3);g.fill();g.restore()}
/* shapes: two corner points in anchor-relative ints, drawn as constant-width polylines */
function snapShape(k,A,B){let dx=B[0]-A[0],dy=B[1]-A[1];const len=Math.hypot(dx,dy);if(!len)return B;
 if(k==='line'||k==='arrow'){const ang=Math.atan2(dy,dx),st=Math.PI/12,n=Math.round(ang/st)*st;if(Math.abs(ang-n)<.07){B=[A[0]+Math.cos(n)*len,A[1]+Math.sin(n)*len]}}
 else if(Math.abs(Math.abs(dx)-Math.abs(dy))<.05*Math.max(Math.abs(dx),Math.abs(dy))){const m=Math.max(Math.abs(dx),Math.abs(dy));B=[A[0]+Math.sign(dx)*m,A[1]+Math.sign(dy)*m]}
 return B}
function shapePolys(k,A,B,rot){const q=.5,P3=(x,y)=>[x,y,q];let out;
 if(k==='rect')out=[[P3(A[0],A[1]),P3(B[0],A[1]),P3(B[0],B[1]),P3(A[0],B[1]),P3(A[0],A[1])]];
 else if(k==='tri'){const mx=(A[0]+B[0])/2;out=[[P3(mx,A[1]),P3(B[0],B[1]),P3(A[0],B[1]),P3(mx,A[1])]]}
 else if(k==='ellipse'){const cx=(A[0]+B[0])/2,cy=(A[1]+B[1])/2,rx=Math.abs(B[0]-A[0])/2,ry=Math.abs(B[1]-A[1])/2,o=[];for(let i=0;i<=48;i++){const t=i/48*Math.PI*2;o.push(P3(cx+Math.cos(t)*rx,cy+Math.sin(t)*ry))}out=[o]}
 else if(k==='brace'){/* a curly brace spanning the longer side, bulging towards the shorter-side direction */
  const dx=B[0]-A[0],dy=B[1]-A[1],horiz=Math.abs(dx)>=Math.abs(dy),L=Math.max(1,horiz?Math.abs(dx):Math.abs(dy)),sg=horiz?(dx<0?-1:1):(dy<0?-1:1),pv=horiz?(dy<0?-1:1):(dx<0?-1:1),r=clamp(Math.min(L*.14,(horiz?Math.abs(dy):Math.abs(dx))/2||12),5,20),h=L/2;
  const w=(u,v)=>horiz?P3(A[0]+sg*u,A[1]+pv*v):P3(A[0]+pv*v,A[1]+sg*u),o=[],qd=(a,c,b)=>{for(let t=.125;t<=1.001;t+=.125){const m=1-t;o.push(w(m*m*a[0]+2*m*t*c[0]+t*t*b[0],m*m*a[1]+2*m*t*c[1]+t*t*b[1]))}};
  o.push(w(0,0));qd([0,0],[0,r],[r,r]);o.push(w(h-r,r));qd([h-r,r],[h,r],[h,2*r]);qd([h,2*r],[h,r],[h+r,r]);o.push(w(L-r,r));qd([L-r,r],[L,r],[L,0]);out=[o]}
 else{out=[[P3(A[0],A[1]),P3(B[0],B[1])]];
  if(k==='arrow'){const ang=Math.atan2(B[1]-A[1],B[0]-A[0]),h=clamp(Math.hypot(B[0]-A[0],B[1]-A[1])*.25,9,22),a=.5;out.push([P3(B[0]-Math.cos(ang-a)*h,B[1]-Math.sin(ang-a)*h),P3(B[0],B[1]),P3(B[0]-Math.cos(ang+a)*h,B[1]-Math.sin(ang+a)*h)])}}
 if(rot&&k!=='line'&&k!=='arrow'){const cx=(A[0]+B[0])/2,cy=(A[1]+B[1])/2,c=Math.cos(rot),sn=Math.sin(rot);out=out.map(pl=>pl.map(p=>{const x=p[0]-cx,y=p[1]-cy;return[cx+x*c-y*sn,cy+x*sn+y*c,p[2]]}))}
 return out}
function shapeOf(L,o,hr){const org=origin(L.host,o.a,hr);if(!org)return null;const q=o.q;if(!q)return[];const W=L.host.clientWidth,f=fsNow();
 return shapePolys(o.k,[org.x+q.x1/REF*W,org.y+q.y1/YU*f],[org.x+q.x2/REF*W,org.y+q.y2/YU*f],(q.r||0)/1000)}
function markRects(L,o,hr){const el=blocksOf(L.host).map.get(o.a.b);if(!el||!o.q)return null;const len=el.textContent.length,a=clamp(o.q.s|0,0,len),b=clamp(o.q.e|0,a,len);if(b<=a)return[];
 const tw=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),r=document.createRange();let pos=0,n,st=false,en=false;
 while((n=tw.nextNode())){const l=n.nodeValue.length;if(!st&&a<pos+l){r.setStart(n,a-pos);st=true}if(st&&b<=pos+l){r.setEnd(n,b-pos);en=true;break}pos+=l}
 if(!st||!en)return[];const out=[];for(const c of r.getClientRects())if(c.width>0)out.push([c.left-hr.left,c.top-hr.top,c.width,c.height]);return out}
function offIn(el,node,off){const r=document.createRange();r.selectNodeContents(el);r.setEnd(node,off);return r.toString().length}
let selT=0,mkPend=null,selPop=null;
function hideSelPop(){mkPend=null;if(selPop)selPop.hidden=true}
function takeSelection(){const sel=getSelection();if(!P.on||P.tool!=='hi'||!sel||sel.isCollapsed||!sel.rangeCount){if(!selPop||!selPop.contains(document.activeElement))hideSelPop();return}const rg=sel.getRangeAt(0),ce=rg.commonAncestorContainer,host=hostOf(ce.nodeType===1?ce:ce.parentElement);if(!host)return;
 const L=layerOf(host);if(!L)return;const list=blocksOf(host).list,objs=[];
 list.forEach(b=>{if(list.some(c=>c!==b&&b.el.contains(c.el)))return;if(!rg.intersectsNode(b.el))return;const len=b.el.textContent.length,
  s=b.el.contains(rg.startContainer)?offIn(b.el,rg.startContainer,rg.startOffset):0,e=b.el.contains(rg.endContainer)?offIn(b.el,rg.endContainer,rg.endOffset):len;
  if(e-s>=1&&e>s&&!(rg.toString().trim()===''))objs.push({i:ID(),t:'mark',k:'hi',c:P.hlc,w:1,a:{b:b.id},q:{s,e}})});
 if(!objs.length){hideSelPop();return}mkPend={L,objs};showSelPop(rg.getBoundingClientRect())}
/* the style popover that appears at a text selection: highlight / underline / strikethrough / squiggle, in 6 colours */
const MKL={hi:'Highlight',u:'Underline',s:'Strikethrough',sq:'Squiggle'};
function showSelPop(rect){if(!selPop){selPop=document.createElement('div');selPop.id='an-selpop';selPop.setAttribute('role','toolbar');selPop.setAttribute('aria-label','Text mark style');selPop.addEventListener('mousedown',e=>e.preventDefault());document.body.append(selPop)}
 const mk=(cls,label,child,fn)=>{const b=document.createElement('button');b.type='button';b.className=cls;b.setAttribute('aria-label',label);b.title=label;if(child)b.append(child);b.addEventListener('click',fn);return b};
 selPop.replaceChildren();const kr=document.createElement('div');kr.className='an-spk';Object.keys(MKL).forEach(k=>kr.append(mk('an-spb',MKL[k],svg('m_'+k),()=>{P.mk=k;setting('mk',k);applyMarks(k,P.hlc)})));
 const cr=document.createElement('div');cr.className='an-spc';Object.keys(HLP).forEach(c=>{const b=mk('an-sps',HLP[c][3],null,()=>{P.hlc=c;setting('hlc',c);applyMarks(P.mk,c)});b.style.setProperty('--c',col(c,true));if(P.hlc===c)b.setAttribute('aria-current','true');cr.append(b)});
 selPop.append(kr,cr);selPop.hidden=false;const r=selPop.getBoundingClientRect(),top=rect.top-r.height-10;selPop.style.left=clamp(rect.left+rect.width/2-r.width/2,8,innerWidth-r.width-8)+'px';selPop.style.top=(top<8?Math.min(innerHeight-r.height-90,rect.bottom+10):top)+'px'}
function applyMarks(kind,c){const m=mkPend;if(!m)return;hideSelPop();const{L}=m;let d=docOf(L.key);if(!d)d=St.docs[L.key]={k:L.key,v:2,rev:0,upd:0,objs:[]};const objs=m.objs.map(o=>Object.assign({},o,{k:kind,c}));if(d.objs.length+objs.length>MAX.objs)return;
 d.objs.push(...objs);active=L.key;pushOp(L.key,{t:'addn',os:objs});touch(L.key);try{getSelection().removeAllRanges()}catch(x){}sched(L);sync()}
document.addEventListener('pointerup',e=>{if(P.on&&P.tool==='hi'&&!(e.target.closest&&e.target.closest('#an-selpop')))setTimeout(takeSelection,40)});
document.addEventListener('selectionchange',()=>{if(!P.on||P.tool!=='hi'){return}clearTimeout(selT);selT=setTimeout(takeSelection,450)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&selPop&&!selPop.hidden){hideSelPop()}});
function lineCol(c){const h=col(c,true);if(themeNow()==='dark'||!/^#[0-9a-f]{6}$/i.test(h))return h;const n=parseInt(h.slice(1),16);return'#'+[16,8,0].map(sh=>Math.round(((n>>sh)&255)*.66).toString(16).padStart(2,'0')).join('')}
function drawMark(gh,gi,o,rs){if(o.k==='hi'||!MKL[o.k]){gh.fillStyle=col(o.c,true);rs.forEach(r=>gh.fillRect(r[0]-1,r[1]+1,r[2]+2,r[3]-2));return}
 gi.save();gi.strokeStyle=lineCol(o.c);gi.lineWidth=Math.max(1.6,2*fsNow());gi.lineCap='round';gi.lineJoin='round';
 rs.forEach(r=>{gi.beginPath();if(o.k==='u'){const y=r[1]+r[3]-1;gi.moveTo(r[0],y);gi.lineTo(r[0]+r[2],y)}else if(o.k==='s'){const y=r[1]+r[3]*.55;gi.moveTo(r[0],y);gi.lineTo(r[0]+r[2],y)}
  else{const y=r[1]+r[3]-2,a=Math.max(1.4,r[3]*.07),st=Math.max(3,r[3]*.17);gi.moveTo(r[0],y);let up=true;for(let x=r[0]+st;x<r[0]+r[2]+st;x+=st){gi.lineTo(Math.min(x,r[0]+r[2]),y+(up?-a:a));up=!up}}gi.stroke()});gi.restore()}
const MEAS=document.createElement('canvas').getContext('2d'),FONTS={sans:null,serif:'Newsreader,Georgia,"Times New Roman",serif',hand:'Caveat,"Segoe Script","Bradley Hand",cursive'};let capF=0;
function fontOf(L,o){const f=o&&o.q&&o.q.f;if(f==='hand'&&!capF){capF=1;try{document.fonts&&document.fonts.load('500 16px Caveat').then(()=>repaintAll())}catch(e){}}return FONTS[f]||getComputedStyle(L.host).fontFamily}
function textLayout(L,o,hr){const org=origin(L.host,o.a,hr);if(!org||!o.q)return null;const W=L.host.clientWidth,f=fsNow(),x=org.x+o.q.x/REF*W,y=org.y+o.q.y/YU*f,fz=o.w*f,lh=fz*1.35,maxW=Math.max(60,W-x-8),ff=fontOf(L,o);
 MEAS.font=fz+'px '+ff;const lines=[];(o.x||'').split('\n').forEach(par=>{let cur='';par.split(' ').forEach(w=>{const t=cur?cur+' '+w:w;if(cur&&MEAS.measureText(t).width>maxW){lines.push(cur);cur=w}else cur=t});lines.push(cur)});
 let mw=0;lines.forEach(l=>{mw=Math.max(mw,MEAS.measureText(l).width)});return{x,y,fz,lh,lines,w:mw,h:lines.length*lh,ff}}
let txed=null,txPend=null;
/* ---------- MCQ adapter: marks on options, re-render-proof layers, accidental-answer guard ---------- */
let om=null;
function optMark(L,id){const d=docOf(L.key);return d?d.objs.find(o=>o.t==='mark'&&OPTK.includes(o.k)&&o.a.b===id&&(id==='s')===(o.k==='conf')):null}
function setOpt(L,id,k,v){let d=docOf(L.key);if(!d)d=St.docs[L.key]={k:L.key,v:2,rev:0,upd:0,objs:[]};const old=optMark(L,id);
 if(!k){if(!old)return;const i=d.objs.indexOf(old);d.objs.splice(i,1);pushOp(L.key,{t:'del',items:[{i,o:old}]})}
 else if(old){const i=d.objs.indexOf(old),n=Object.assign({},old,{k,c:'k',q:k==='conf'?{v}:{}});n.anim=performance.now();d.objs[i]=n;pushOp(L.key,{t:'rep',old,n})}
 else{const n={i:ID(),t:'mark',k,c:'k',w:1,a:{b:id},q:k==='conf'?{v}:{}};n.anim=performance.now();if(d.objs.length>=MAX.objs)return;d.objs.push(n);pushOp(L.key,{t:'add',o:n})}
 active=L.key;touch(L.key);sched(L);sync()}
function omAt(host,x,y){const hr=host.getBoundingClientRect();return blocksOf(host).list.find(b=>{const r=b.el.getBoundingClientRect();return x>=r.left-4&&x<=r.right+4&&y>=r.top-2&&y<=r.bottom+2})}
function omDown(e,host){const L=layerOf(host);if(!L)return;const b=omAt(host,e.clientX,e.clientY);if(!b)return;e.preventDefault();omEnd(true);
 om={L,id:b.id,x0:e.clientX,y0:e.clientY,t0:performance.now(),pid:e.pointerId,done:false};om.timer=setTimeout(()=>{if(om&&!om.done&&om.id!=='s'){om.done=true;toggleCross(om.L,om.id)}},450);
 document.addEventListener('pointermove',omMove,{passive:true});document.addEventListener('pointerup',omUp);document.addEventListener('pointercancel',omCancel)}
function toggleCross(L,id){const o=optMark(L,id);setOpt(L,id,o&&o.k==='cross'?null:'cross')}
function omMove(e){if(!om||e.pointerId!==om.pid||om.done)return;const dx=e.clientX-om.x0,dy=e.clientY-om.y0;if(Math.hypot(dx,dy)>12)clearTimeout(om.timer);
 if(om.id!=='s'&&Math.abs(dx)>44&&Math.abs(dy)<30){om.done=true;toggleCross(om.L,om.id)}else if(Math.abs(dy)>30)om.done=true}
function omUp(e){if(!om||e.pointerId!==om.pid)return;const m=om;omEnd();if(m.done||Math.hypot(e.clientX-m.x0,e.clientY-m.y0)>12||performance.now()-m.t0>=450)return;
 const o=optMark(m.L,m.id);if(m.id==='s'){const v=o?+(o.q&&o.q.v)||1:0;setOpt(m.L,'s',v>=3?null:'conf',v+1)}else setOpt(m.L,m.id,!o||o.k==='cross'?(o&&o.k==='cross'?null:'tick'):o.k==='tick'?'ask':null)}
function omCancel(e){if(om&&e.pointerId===om.pid)omEnd()}
function omEnd(){if(!om)return;clearTimeout(om.timer);om=null;document.removeEventListener('pointermove',omMove);document.removeEventListener('pointerup',omUp);document.removeEventListener('pointercancel',omCancel)}
function attachMx(){document.querySelectorAll(MXS).forEach(h=>{const k=keyOf(h);if(!k)return;const L=layerOf(h,k);if(L&&L.fresh){L.fresh=false;paint(L)}});
 layers.forEach((L,h)=>{if(!h.isConnected){layers.delete(h);try{ro.unobserve(h)}catch(e){}}});
 if(sel&&!sel.L.host.isConnected)clearSel();if(live&&!live.L.host.isConnected)onUp({pointerId:live.pid,type:'pointercancel'});if(txed&&!txed.L.host.isConnected){try{txed.ta.remove()}catch(e){}txed=null}omEnd()}
function mxInit(){const root=document.getElementById('v-mcqs')||document.querySelector('[id^=v-mcq]');if(root){new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1&&(n.matches(MXS)||(n.querySelector&&n.querySelector(MXS)))){attachMx();return}}).observe(root,{childList:true,subtree:true});attachMx()}
 const fab=document.createElement('div');fab.id='an-fab';const a=document.createElement('button');a.type='button';a.id='an-fab-on';a.setAttribute('aria-label','Annotate this question');a.append(svg('pen'),Object.assign(document.createElement('span'),{textContent:'Annotate'}));a.addEventListener('click',()=>setOn(!P.on));
 const ey=document.createElement('button');ey.type='button';ey.id='an-fab-eye';ey.setAttribute('aria-label','Hide annotations for a fresh attempt');ey.append(svg('eye'));ey.addEventListener('click',()=>{P.hide=!P.hide;setting('hide',P.hide);sync()});fab.append(a,ey);document.body.append(fab)}
document.addEventListener('click',e=>{if(!P.on||P.tool==='hand')return;const t=e.target;if(t.closest&&t.closest(MXS+' .mx-opts')){e.preventDefault();e.stopPropagation()}},true);
function closeText(save){if(!txed)return;const{L,ta,old,x,y,size,c}=txed;txed=null;const v=ta.value.replace(/\s+$/,'');ta.remove();if(old)delete old.editing;
 let d=docOf(L.key);if(!d)d=St.docs[L.key]={k:L.key,v:2,rev:0,upd:0,objs:[]};
 if(!save||v===(old?old.x:'')){sched(L);return}
 if(old){const i=d.objs.indexOf(old);if(i<0){sched(L);return}if(!v){d.objs.splice(i,1);pushOp(L.key,{t:'del',items:[{i,o:old}]})}else{const n=Object.assign({},old,{x:v.slice(0,MAX.txt)});d.objs[i]=n;pushOp(L.key,{t:'rep',old,n})}touch(L.key);sched(L);sync();return}
 if(!v){sched(L);return}const host=L.host,W=host.clientWidth,f=fsNow(),bl=nearest(host,x,y),org=bl?origin(host,{b:bl.id}):{x:0,y:0};
 commit(L,{i:ID(),t:'text',k:'box',c,w:+size,a:{b:bl?bl.id:null},x:v.slice(0,MAX.txt),q:Object.assign({x:Math.round((x-org.x)/W*REF),y:Math.round((y-org.y)/f*YU)},P.font!=='sans'?{f:P.font}:{})})}
function openText(host,e){const L=layerOf(host);if(!L)return;closeText(true);active=L.key;const hr=host.getBoundingClientRect(),x=e.clientX-hr.left,y=e.clientY-hr.top,d=docOf(L.key);let old=null;
 if(d)for(let i=d.objs.length-1;i>=0;i--){const o=d.objs[i];if(o.t!=='text')continue;const tl=textLayout(L,o,hr);if(tl&&x>=tl.x-4&&x<=tl.x+tl.w+4&&y>=tl.y-4&&y<=tl.y+tl.h+4){old=o;break}}
 const f=fsNow(),size=old?old.w:P.sizes.tx/f,tl=old&&textLayout(L,old,hr),px=old?tl.x:x,py=old?tl.y:y,ta=document.createElement('textarea');ta.className='an-tx';ta.setAttribute('aria-label','Text note: type, then tap elsewhere to finish');ta.rows=1;ta.value=old?old.x:'';
 ta.style.cssText='left:'+px+'px;top:'+py+'px;font-size:'+size*f+'px;font-family:'+(FONTS[old?old.q.f:P.font]||'inherit')+';color:'+col(old?old.c:P.col)+';max-width:'+Math.max(80,host.clientWidth-px-8)+'px';
 const fit=()=>{ta.style.height='auto';ta.style.height=ta.scrollHeight+'px';ta.style.width='auto';ta.style.width=Math.min(ta.scrollWidth+6,Math.max(80,host.clientWidth-px-8))+'px'};ta.addEventListener('input',fit);
 ta.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();closeText(false)}else if(ev.key==='Enter'&&(ev.ctrlKey||ev.metaKey)){ev.preventDefault();ta.blur()}});ta.addEventListener('blur',()=>setTimeout(()=>{txed&&txed.ta===ta&&closeText(true)},0));
 if(old)old.editing=true;txed={L,ta,old,x:px,y:py,size,c:old?old.c:P.col};host.append(ta);fit();ta.focus();if(old)sched(L)}
document.addEventListener('pointerup',e=>{const p=txPend;txPend=null;if(p&&P.on&&P.tool==='tx'&&Math.hypot(e.clientX-p.x,e.clientY-p.y)<10)setTimeout(()=>openText(p.host,{clientX:p.x,clientY:p.y}),0)});
/* ---------- stickers, sticky notes, laser pointer ---------- */
const STK={star:'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z',exam:'M6 3.5h8l4 4v13H6zM14 3.5v4h4M9.5 12.5h5M9.5 16h5',ask:'M9 9a3 3 0 1 1 4.6 2.5c-1 .6-1.6 1.2-1.6 2.5M12 17.5v.01',tick:'M5 12.5l4.5 4.5L19 7',cross:'M6 6l12 12M18 6L6 18',bulb:'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z'};
const STKL={star:'Important',exam:'Asked in exam',ask:'Question',tick:'Correct',cross:'Wrong',bulb:'Idea'},STKP={},PIN=26;
for(const k in STK)STKP[k]=new Path2D(STK[k]);
function drawSticker(g,k,x,y,sz,color,rot){const p=STKP[k]||STKP.star;g.save();g.translate(x,y);if(rot)g.rotate(rot);g.translate(-sz/2,-sz/2);g.scale(sz/24,sz/24);g.lineWidth=1.9;g.lineJoin='round';g.lineCap='round';g.strokeStyle=color;
 if(k==='star'||k==='bulb'||k==='exam'){g.globalAlpha=k==='exam'?.14:.35;g.fillStyle=color;g.fill(p);g.globalAlpha=1}g.stroke(p);g.restore()}
function stkPos(L,o,hr){const org=origin(L.host,o.a,hr);if(!org||!o.q)return null;const W=L.host.clientWidth,f=fsNow();return{x:org.x+o.q.x/REF*W,y:org.y+o.q.y/YU*f,s:o.w*f,r:(o.q.r||0)/1000}}
function stkRects(L,o,hr){const p=stkPos(L,o,hr);if(!p)return null;const z=o.t==='note'?PIN:p.s;return[[p.x-z/2,p.y-z/2,z,z]]}
function anchorAt(host,x,y,hr){const W=host.clientWidth,f=fsNow(),bl=nearest(host,x,y),org=bl?origin(host,{b:bl.id},hr):{x:0,y:0};return{b:bl?bl.id:null,q:{x:Math.round((x-org.x)/W*REF),y:Math.round((y-org.y)/f*YU)}}}
function placeSticker(host,cx,cy){const L=layerOf(host);if(!L)return;const hr=host.getBoundingClientRect(),an=anchorAt(host,cx-hr.left,cy-hr.top,hr);active=L.key;
 commit(L,{i:ID(),t:'sticker',k:P.stk,c:P.col,w:+(P.sizes.st/fsNow()).toFixed(3),a:{b:an.b},q:an.q})}
/* a sticky note is a small pin (a real button, so it works with a keyboard and with annotate switched off) that expands into an editor */
function syncPins(L,d,hr){const host=L.host,have=new Map(),seen=new Set();host.querySelectorAll(':scope>.an-pin').forEach(b=>have.set(b.dataset.i,b));
 (d?d.objs:[]).forEach(o=>{if(o.t!=='note')return;seen.add(o.i);const p=stkPos(L,o,hr);let b=have.get(o.i);
  if(!p){if(b)b.hidden=true;o.orphan=true;return}o.orphan=false;
  if(!b){b=document.createElement('button');b.type='button';b.className='an-pin';b.dataset.i=o.i;b.append(svg('nt'));host.append(b);b.addEventListener('click',()=>openNote(L,b.dataset.i))}
  b.hidden=false;b.style.left=(p.x-PIN/2)+'px';b.style.top=(p.y-PIN/2)+'px';b.style.setProperty('--c',col(o.c));b.setAttribute('aria-label','Sticky note: '+(o.x||'empty').slice(0,80))});
 have.forEach((b,i)=>{if(!seen.has(i))b.remove()})}
let nted=null;
function closeNote(save){if(!nted)return;const{L,el,ta,id,pos}=nted;nted=null;const v=ta.value.replace(/\s+$/,'').slice(0,MAX.txt);el.remove();const d=docOf(L.key),old=id&&d?d.objs.find(o=>o.i===id):null;
 if(!save){sched(L);return}
 if(old){if(v===old.x){sched(L);return}const i=d.objs.indexOf(old);if(!v){d.objs.splice(i,1);pushOp(L.key,{t:'del',items:[{i,o:old}]})}else{const n=Object.assign({},old,{x:v});d.objs[i]=n;pushOp(L.key,{t:'rep',old,n})}touch(L.key);sched(L);sync();return}
 if(!v){sched(L);return}commit(L,{i:ID(),t:'note',k:'pin',c:P.col,w:1,a:{b:pos.b},x:v,q:pos.q})}
function openNote(L,id,at){if(nted&&nted.L===L&&nted.id===id&&id){closeNote(true);return}closeNote(true);const host=L.host,hr=host.getBoundingClientRect(),d=docOf(L.key),old=id&&d?d.objs.find(o=>o.i===id):null;let x,y,pos=null;
 if(old){const p=stkPos(L,old,hr);if(!p)return;x=p.x;y=p.y}else{x=at.x;y=at.y;pos=anchorAt(host,x,y,hr)}
 active=L.key;const el=document.createElement('div');el.className='an-sticky';el.setAttribute('role','dialog');el.setAttribute('aria-label','Sticky note');
 const ta=document.createElement('textarea');ta.rows=4;ta.maxLength=MAX.txt;ta.value=old?old.x:'';ta.setAttribute('aria-label','Note text');ta.placeholder='Write a note...';
 const bt=(t,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=t;b.addEventListener('click',fn);return b},row=document.createElement('div');row.className='an-srow';
 row.append(bt('Done',()=>closeNote(true)));if(old)row.append(bt('Delete',()=>{ta.value='';closeNote(true)}));row.append(bt('Cancel',()=>closeNote(false)));
 ta.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();closeNote(false)}else if(ev.key==='Enter'&&(ev.ctrlKey||ev.metaKey)){ev.preventDefault();closeNote(true)}});
 el.append(ta,row);el.style.left=clamp(x-20,4,Math.max(4,host.clientWidth-232))+'px';el.style.top=(y+PIN/2+4)+'px';host.append(el);nted={L,el,ta,id:old?old.i:null,pos};ta.focus()}
document.addEventListener('pointerdown',e=>{if(nted&&!nted.el.contains(e.target)&&!(e.target.closest&&e.target.closest('.an-pin')))closeNote(true)},true);
let las=null;
function laserPt(e){const hr=las.L.host.getBoundingClientRect(),evs=e.getCoalescedEvents?e.getCoalescedEvents():[];(evs.length?evs:[e]).forEach(x=>las.pts.push({x:x.clientX-hr.left,y:x.clientY-hr.top,t:performance.now()}))}
function laserLoop(){if(!las||las.raf)return;const f=()=>{const s=las;if(!s)return;s.raf=0;const L=s.L,w=L.host.clientWidth,h=L.host.clientHeight,g=size(cv(L,'wet'),w,h),now=performance.now(),life=900;g.clearRect(0,0,w,h);s.pts=s.pts.filter(p=>now-p.t<life);const Q=s.pts;
  if(Q.length){g.save();g.lineCap='round';g.lineJoin='round';for(let i=1;i<Q.length;i++){const a=1-(now-Q[i].t)/life;g.strokeStyle='rgba(235,32,32,'+(.75*a).toFixed(3)+')';g.lineWidth=2+7*a;g.beginPath();g.moveTo(Q[i-1].x,Q[i-1].y);g.lineTo(Q[i].x,Q[i].y);g.stroke()}
   if(s.down){const q=Q[Q.length-1];g.fillStyle='rgba(255,60,60,.95)';g.shadowColor='rgba(255,40,40,.9)';g.shadowBlur=14;g.beginPath();g.arc(q.x,q.y,6,0,6.3);g.fill()}g.restore()}
  if(s.down||Q.length)s.raf=requestAnimationFrame(f);else{g.clearRect(0,0,w,h);las=null}};las.raf=requestAnimationFrame(f)}
function laserStart(e,host){const L=layerOf(host);if(!L)return;e.preventDefault();try{host.setPointerCapture(e.pointerId)}catch(x){}
 las={L,pid:e.pointerId,pts:[],raf:0,down:true};document.body.classList.add('an-drawing');laserPt(e);
 const mv=ev=>{if(las&&ev.pointerId===las.pid)laserPt(ev)},up=ev=>{if(!las||ev.pointerId!==las.pid)return;document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',up);las.down=false;document.body.classList.remove('an-drawing');laserLoop()};
 document.addEventListener('pointermove',mv,{passive:true});document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up);laserLoop()}
let tapPend=null;
document.addEventListener('pointerup',e=>{const p=tapPend;tapPend=null;if(!p||!P.on||P.tool!==p.tool||Math.hypot(e.clientX-p.x,e.clientY-p.y)>=10)return;
 if(p.tool==='st')placeSticker(p.host,p.x,p.y);else if(p.tool==='nt'){const L=layerOf(p.host),hr=p.host.getBoundingClientRect();L&&setTimeout(()=>openNote(L,null,{x:p.x-hr.left,y:p.y-hr.top}),0)}});
/* ---------- selection: lasso or tap, move, resize, duplicate, delete ---------- */
let sel=null;
function geomOf(L,o,hr){
 if(o.t==='stroke'){const p=pxOf(L,o,hr);if(!p||!p.length)return null;return{lines:[p],rects:[],pts:p.map(q=>[q[0],q[1]]),w:o.w*fsNow()}}
 if(o.t==='shape'){const ps=shapeOf(L,o,hr);if(!ps)return null;return{lines:ps,rects:[],pts:[].concat(...ps).map(q=>[q[0],q[1]]),w:o.w*fsNow()}}
 if(o.t==='text'){const t=textLayout(L,o,hr);if(!t)return null;return{lines:[],rects:[[t.x,t.y,t.w,t.h]],pts:[[t.x,t.y],[t.x+t.w,t.y+t.h]],w:0}}
 if(o.t==='sticker'||o.t==='note'){const rs=stkRects(L,o,hr);if(!rs)return null;return{lines:[],rects:rs,pts:[[rs[0][0],rs[0][1]],[rs[0][0]+rs[0][2],rs[0][1]+rs[0][3]]],w:0}}
 if(o.t==='mark'){const rs=markRects(L,o,hr);if(!rs||!rs.length)return null;return{lines:[],rects:rs,pts:[].concat(...rs.map(r=>[[r[0],r[1]],[r[0]+r[2],r[1]+r[3]]])),w:0}}
 return null}
function bbOf(g){let a=1e9,b=1e9,c=-1e9,d=-1e9;g.pts.forEach(p=>{a=Math.min(a,p[0]);b=Math.min(b,p[1]);c=Math.max(c,p[0]);d=Math.max(d,p[1])});const k=g.w/2;return[a-k,b-k,c+k,d+k]}
function selObjs(){if(!sel)return[];const d=docOf(sel.L.key);return d?d.objs.filter(o=>sel.ids.has(o.i)):[]}
function selBB(){if(!sel)return null;const hr=sel.L.host.getBoundingClientRect();let u=null;selObjs().forEach(o=>{const g=geomOf(sel.L,o,hr);if(!g)return;const b=bbOf(g);u=u?[Math.min(u[0],b[0]),Math.min(u[1],b[1]),Math.max(u[2],b[2]),Math.max(u[3],b[3])]:b});return u}
const canMove=o=>o.t==='stroke'||o.t==='shape'||o.t==='text'||o.t==='sticker'||o.t==='note';
function xform(L,o,hr,fn,ws,ang,dst){if(!canMove(o))return o;const host=L.host,dh=dst?dst.host:host,hr2=dst?dh.getBoundingClientRect():hr,W0=host.clientWidth,W=dh.clientWidth,f=fsNow(),rd=Math.round;
 const place=(x,y)=>{const bl=nearest(dh,x,y);return{bl,org:bl?origin(dh,{b:bl.id},hr2):{x:0,y:0}}};
 if(o.t==='stroke'){const pts=pxOf(L,o,hr);if(!pts||!pts.length)return o;const m=pts.map(p=>{const q=fn([p[0],p[1]]);return[q[0],q[1],p[2]]}),pl=place(m[0][0],m[0][1]);
  return Object.assign({},o,{a:{b:pl.bl?pl.bl.id:null},g:enc(m.map(p=>[rd((p[0]-pl.org.x)/W*REF),rd((p[1]-pl.org.y)/f*YU),rd(clamp(p[2],0,1)*100)]))})}
 const org0=origin(host,o.a,hr);if(!org0||!o.q)return o;
 if(o.t==='shape'){const A0=[org0.x+o.q.x1/REF*W0,org0.y+o.q.y1/YU*f],B0=[org0.x+o.q.x2/REF*W0,org0.y+o.q.y2/YU*f],line=o.k==='line'||o.k==='arrow';let A,B,r=(o.q.r||0)/1000;
  if(ang&&!line){const c=fn([(A0[0]+B0[0])/2,(A0[1]+B0[1])/2]),hx=(B0[0]-A0[0])/2,hy=(B0[1]-A0[1])/2;A=[c[0]-hx,c[1]-hy];B=[c[0]+hx,c[1]+hy];r+=ang}else{A=fn(A0);B=fn(B0)}
  const pl=place(A[0],A[1]),e=p=>[rd((p[0]-pl.org.x)/W*REF),rd((p[1]-pl.org.y)/f*YU)],ea=e(A),eb=e(B),q={x1:ea[0],y1:ea[1],x2:eb[0],y2:eb[1]};r=Math.atan2(Math.sin(r),Math.cos(r));if(Math.abs(r)>.0005&&!line)q.r=rd(r*1000);
  return Object.assign({},o,{a:{b:pl.bl?pl.bl.id:null},q})}
 const P0=fn([org0.x+o.q.x/REF*W0,org0.y+o.q.y/YU*f]),pl=place(P0[0],P0[1]),q={x:rd((P0[0]-pl.org.x)/W*REF),y:rd((P0[1]-pl.org.y)/f*YU)};
 if(o.t==='sticker'){let r=(o.q.r||0)/1000+(ang||0);r=Math.atan2(Math.sin(r),Math.cos(r));if(Math.abs(r)>.0005)q.r=rd(r*1000)}
 return Object.assign({},o,{a:{b:pl.bl?pl.bl.id:null},w:clamp(o.w*(ws||1),4/f,200),q})}
function pip(x,y,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
function clearSel(){const L=sel&&sel.L;sel=null;pasteAt=null;const b=$('#an-selbar');b&&(b.hidden=true);if(L&&L.wet){const g=L.wet.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,L.wet.width,L.wet.height)}}
function drawOverlay(g,L,lasso){const w=L.host.clientWidth,h=L.host.clientHeight;g.clearRect(0,0,w,h);g.save();const cc=getComputedStyle(document.documentElement).getPropertyValue('--clay').trim()||'#c4573a';g.strokeStyle=cc;g.fillStyle=cc;g.lineWidth=1.5;g.setLineDash([6,4]);
 if(lasso&&lasso.length>1){g.beginPath();g.moveTo(lasso[0].x,lasso[0].y);lasso.forEach(p=>g.lineTo(p.x,p.y));g.stroke()}
 const bb=selBB();if(bb&&!lasso){g.strokeRect(bb[0]-4,bb[1]-4,bb[2]-bb[0]+8,bb[3]-bb[1]+8);g.setLineDash([]);if(selObjs().some(canMove))[[bb[0]-4,bb[1]-4],[bb[2]+4,bb[1]-4],[bb[0]-4,bb[3]+4],[bb[2]+4,bb[3]+4]].forEach(c=>{g.fillStyle='#fff';g.fillRect(c[0]-6,c[1]-6,12,12);g.strokeRect(c[0]-6,c[1]-6,12,12)})}
 g.restore()}
let clip=null,pasteAt=null;
function selBar(){let b=$('#an-selbar');if(b)return b;b=document.createElement('div');b.id='an-selbar';b.setAttribute('role','toolbar');b.setAttribute('aria-label','Selection actions');
 const mk=(a,l,lab,fn)=>{const x=document.createElement('button');x.type='button';x.dataset.a=a;x.textContent=l;x.setAttribute('aria-label',lab);x.title=lab;x.addEventListener('click',fn);b.append(x)};
 mk('selcopy','Copy','Copy selection',copySel);mk('selpaste','Paste','Paste copied marks',()=>pasteClip());mk('selcol','Colour','Change colour',()=>selColourPop());mk('selthin','Thin','Thinner or smaller',()=>widthSel(.8));mk('selthick','Thick','Thicker or larger',()=>widthSel(1.25));
 mk('selrotl','↺','Rotate left 15 degrees',()=>rotSel(-1));mk('selrotr','↻','Rotate right 15 degrees',()=>rotSel(1));mk('seldup','Duplicate','Duplicate',dupSel);mk('seldel','Delete','Delete',delSel);mk('selnone','Done','Done',()=>{clearSel();closePop()});document.body.append(b);return b}
function showSel(){if(!sel)return;const L=sel.L,w=L.host.clientWidth,h=L.host.clientHeight;if(!w||!h)return;if(!selObjs().length){clearSel();return}const g=size(cv(L,'wet'),w,h);drawOverlay(g,L,null);
 const b=selBar(),os=selObjs(),mv=os.some(canMove),geo=os.some(o=>o.t!=='mark');b.querySelectorAll('button').forEach(x=>{const a=x.dataset.a;x.hidden=(a==='selcopy'||a==='selrotl'||a==='selrotr')?!mv:(a==='selthin'||a==='selthick')?!mv:a==='selcol'?!os.length:a==='selpaste'?!clip:a==='seldup'?false:false});void geo;
 b.hidden=false;const bb=selBB(),hr=L.host.getBoundingClientRect(),r=b.getBoundingClientRect();b.style.left=clamp(hr.left+(bb[0]+bb[2])/2-r.width/2,8,innerWidth-r.width-8)+'px';b.style.top=clamp(hr.top+bb[1]-r.height-14,8,innerHeight-r.height-90)+'px'}
function showPaste(L,x,y){pasteAt={L,x,y};const b=selBar();b.querySelectorAll('button').forEach(k=>{k.hidden=!(k.dataset.a==='selpaste'||k.dataset.a==='selnone')});b.hidden=false;const hr=L.host.getBoundingClientRect(),r=b.getBoundingClientRect();b.style.left=clamp(hr.left+x-r.width/2,8,innerWidth-r.width-8)+'px';b.style.top=clamp(hr.top+y-r.height-14,8,innerHeight-r.height-90)+'px'}
function applyPairs(L,fnMap){const d=docOf(L.key),pairs=[];selObjs().forEach(o=>{const n=fnMap(o);if(n&&n!==o){const i=d.objs.indexOf(o);if(i>=0){d.objs[i]=n;pairs.push({old:o,n})}}});if(!pairs.length)return;sel.ids=new Set(sel.ids);pushOp(L.key,{t:'repn',pairs});touch(L.key);sched(L);sync()}
function rotSel(dir){if(!sel)return;const L=sel.L,hr=L.host.getBoundingClientRect(),bb=selBB();if(!bb)return;const cx=(bb[0]+bb[2])/2,cy=(bb[1]+bb[3])/2,a=dir*Math.PI/12,c=Math.cos(a),sn=Math.sin(a);
 applyPairs(L,o=>canMove(o)?xform(L,o,hr,p=>{const x=p[0]-cx,y=p[1]-cy;return[cx+x*c-y*sn,cy+x*sn+y*c]},1,a):o)}
function widthSel(k){if(!sel)return;const L=sel.L,f=fsNow();applyPairs(L,o=>canMove(o)&&o.t!=='note'?Object.assign({},o,{w:+clamp(o.w*k,.3/f,o.t==='text'||o.t==='sticker'?200:60/f).toFixed(3)}):o)}
function colourSel(c,hl){if(!sel)return;const L=sel.L;applyPairs(L,o=>{const isHl=o.t==='mark'||(o.t==='stroke'&&o.k==='hl');return isHl===hl&&o.c!==c?Object.assign({},o,{c}):o})}
function selColourPop(){if(!sel)return;if(pop&&pop.dataset.for==='selcol'){closePop();return}closePop();pop=document.createElement('div');pop.className='an-pop';pop.dataset.for='selcol';pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Change colour');
 const os=selObjs(),hasHl=os.some(o=>o.t==='mark'||(o.t==='stroke'&&o.k==='hl')),hasInk=os.some(o=>!(o.t==='mark'||(o.t==='stroke'&&o.k==='hl')));
 const row=(pal,hl)=>{const g=document.createElement('div');g.className='an-cols';Object.keys(pal).forEach(k=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',pal[k][3]);b.style.setProperty('--c',col(k,hl));b.onclick=()=>{colourSel(k,hl);closePop()};g.append(b)});return g};
 if(hasInk)pop.append(row(PAL,false));if(hasHl)pop.append(row(HLP,true));document.body.append(pop);const br=$('#an-selbar').getBoundingClientRect(),pr=pop.getBoundingClientRect();pop.style.left=clamp(br.left+br.width/2-pr.width/2,8,innerWidth-pr.width-8)+'px';pop.style.top=Math.max(8,br.top-pr.height-8)+'px'}
/* copy / paste of marks (also across answers): geometry is re-anchored to the text blocks of the target answer */
function copySel(){if(!sel)return;const os=selObjs().filter(canMove);if(!os.length)return;clip={L:sel.L,objs:JSON.parse(JSON.stringify(os.map(o=>{const c=Object.assign({},o);delete c.orphan;delete c.anim;delete c.editing;return c}))),n:0};sync();showSel()}
function activeLayer(){const h=active&&hostByKey(active);return h&&layers.get(h)}
function pasteClip(){if(!clip)return;const L2=pasteAt?pasteAt.L:sel?sel.L:activeLayer();if(!L2)return;const src=clip.L,hr=src.host.getBoundingClientRect(),W2=L2.host.clientWidth,H2=L2.host.clientHeight;
 let x0=1e9,y0=1e9;clip.objs.forEach(o=>{const g=geomOf(src,o,hr);if(g){const b=bbOf(g);x0=Math.min(x0,b[0]);y0=Math.min(y0,b[1])}});if(x0>1e8){clip=null;return}
 clip.n++;let dx=16*clip.n,dy=16*clip.n;if(pasteAt){dx=pasteAt.x-x0;dy=pasteAt.y-y0}else if(L2!==src){dx=-x0+20;dy=-y0+20+16*clip.n}
 const n=[];clip.objs.forEach(o=>{const c=xform(src,o,hr,p=>[clamp(p[0]+dx,0,Math.max(0,W2-8)),clamp(p[1]+dy,0,Math.max(0,H2-8))],1,0,L2);if(c!==o)n.push(Object.assign({},c,{i:ID()}))});
 let d=docOf(L2.key);if(!d)d=St.docs[L2.key]={k:L2.key,v:2,rev:0,upd:0,objs:[]};if(!n.length||d.objs.length+n.length>MAX.objs)return;
 pasteAt=null;d.objs.push(...n);active=L2.key;pushOp(L2.key,{t:'addn',os:n});touch(L2.key);P.tool='sel';setting('tool','sel');sel={L:L2,ids:new Set(n.map(o=>o.i))};sched(L2);sync()}
function delSel(){if(!sel)return;const d=docOf(sel.L.key);if(!d)return;const items=[];selObjs().map(o=>d.objs.indexOf(o)).sort((a,b)=>b-a).forEach(i=>{items.push({i,o:d.objs[i]});d.objs.splice(i,1)});if(!items.length)return;pushOp(sel.L.key,{t:'del',items});touch(sel.L.key);const L=sel.L;clearSel();sched(L);sync()}
function dupSel(){if(!sel)return;const L=sel.L,d=docOf(L.key),hr=L.host.getBoundingClientRect(),n=[];selObjs().forEach(o=>{const c=canMove(o)?xform(L,o,hr,p=>[p[0]+16,p[1]+16],1):Object.assign({},o);n.push(Object.assign({},c,{i:ID()}))});
 if(!n.length||d.objs.length+n.length>MAX.objs)return;d.objs.push(...n);pushOp(L.key,{t:'addn',os:n});touch(L.key);sel.ids=new Set(n.map(o=>o.i));sched(L)}
function selStart(e){const L=live.L,host=L.host,hr=host.getBoundingClientRect(),x=e.clientX-hr.left,y=e.clientY-hr.top;live.hr=hr;live.sx=x;live.sy=y;live.mode='lasso';
 if(sel&&sel.L===L){const bb=selBB();if(bb){const cs=[[bb[0]-4,bb[1]-4,bb[2]+4,bb[3]+4],[bb[2]+4,bb[1]-4,bb[0]-4,bb[3]+4],[bb[0]-4,bb[3]+4,bb[2]+4,bb[1]-4],[bb[2]+4,bb[3]+4,bb[0]-4,bb[1]-4]];
   if(selObjs().some(canMove)){const c=cs.find(c=>Math.hypot(c[0]-x,c[1]-y)<=(e.pointerType==='mouse'?12:22));if(c){live.mode='scale';live.o=[c[2],c[3]];live.d0=Math.max(8,Math.hypot(x-c[2],y-c[3]))}}
   if(live.mode==='lasso'&&x>=bb[0]-6&&x<=bb[2]+6&&y>=bb[1]-6&&y<=bb[3]+6&&selObjs().some(canMove))live.mode='move'}}
 if(live.mode!=='lasso'){const d=docOf(L.key);live.orig=selObjs().map(o=>({o,i:d.objs.indexOf(o)}))}}
function selMove(){const q=live.pts[live.pts.length-1];if(live.mode==='lasso')return;const L=live.L,d=docOf(L.key);let fn,ws=1;
 if(live.mode==='move'){const dx=q.rx-live.sx,dy=q.ry-live.sy;fn=p=>[p[0]+dx,p[1]+dy]}else{const k=clamp(Math.hypot(q.rx-live.o[0],q.ry-live.o[1])/live.d0,.2,5),ox=live.o[0],oy=live.o[1];ws=k;fn=p=>[ox+(p[0]-ox)*k,oy+(p[1]-oy)*k]}
 live.orig.forEach(it=>{if(it.i>=0&&canMove(it.o))d.objs[it.i]=xform(L,it.o,live.hr,fn,ws)});sched(L)}
function selUp(l,cancel){const L=l.L,d=docOf(L.key);
 if(l.mode!=='lasso'){const pairs=[];(l.orig||[]).forEach(it=>{if(it.i<0||!canMove(it.o))return;const n=d.objs[it.i];if(cancel)d.objs[it.i]=it.o;else if(n!==it.o)pairs.push({old:it.o,n})});
  if(pairs.length&&!cancel){pushOp(L.key,{t:'repn',pairs});touch(L.key)}sched(L);sync();return}
 if(cancel){showSel();return}const poly=l.pts.map(q=>({x:q.rx,y:q.ry})),hr=L.host.getBoundingClientRect();let len=0;for(let i=1;i<poly.length;i++)len+=Math.hypot(poly[i].x-poly[i-1].x,poly[i].y-poly[i-1].y);
 const ids=new Set();if(d)if(len<10){const x=poly[0].x,y=poly[0].y;for(let i=d.objs.length-1;i>=0;i--){const o=d.objs[i],g=geomOf(L,o,hr);if(!g)continue;
   if(g.lines.some(pl=>hit(pl,x,y,Math.max(8,g.w/2+4)))||g.rects.some(r=>x>=r[0]-4&&x<=r[0]+r[2]+4&&y>=r[1]-4&&y<=r[1]+r[3]+4)){ids.add(o.i);break}}}
  else{const pp=poly.map(p=>[p.x,p.y]);d.objs.forEach(o=>{const g=geomOf(L,o,hr);if(!g||!g.pts.length)return;const bb=bbOf(g),inn=g.pts.filter(p=>pip(p[0],p[1],pp)).length;if(inn/g.pts.length>=.4||pip((bb[0]+bb[2])/2,(bb[1]+bb[3])/2,pp))ids.add(o.i)})}
 sel=ids.size?{L,ids}:null;const g=L.wet&&L.wet.getContext('2d');g&&g.clearRect(0,0,L.wet.width,L.wet.height);if(sel)showSel();else{clearSel();if(clip&&len<10)showPaste(L,poly[0].x,poly[0].y)}}
function commit(L,o){let d=docOf(L.key);if(!d)d=St.docs[L.key]={k:L.key,v:2,rev:0,upd:0,objs:[]};if(d.objs.length>=MAX.objs){alert('This answer has the maximum number of marks. Delete some to add more.');return false}
 d.objs.push(o);pushOp(L.key,{t:'add',o});touch(L.key);sched(L);sync();return true}
const OPTK=['cross','tick','ask','conf'],CONFL=['','Guess','Fairly sure','Sure'],CONFC=['','#c62828','#d98a00','#2e8b4f'];
const mxCalm=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
function optLines(el){const sp=el.querySelector('span')||el,r=document.createRange();r.selectNodeContents(sp);return[...r.getClientRects()].filter(c=>c.width>2&&c.height>4)}
function paintOpt(L,o,g,hr){const el=blocksOf(L.host).map.get(o.a.b);if(!el){o.orphan=true;return}o.orphan=false;const b=el.getBoundingClientRect(),bx=b.left-hr.left,by=b.top-hr.top,f=fsNow();g.save();g.lineCap='round';g.lineJoin='round';
 if(o.k==='cross'){const ls=optLines(el);let tot=0;ls.forEach(c=>tot+=c.width);const p=o.anim&&!mxCalm()?clamp((performance.now()-o.anim)/320,0,1):1;let left=tot*p;g.strokeStyle=col('r');g.lineWidth=2.2*Math.max(1,f);g.globalAlpha=.9;
  ls.forEach(c=>{if(left<=0)return;const w=Math.min(c.width,left);left-=w;const y=c.top-hr.top+c.height*.55,x=c.left-hr.left;g.beginPath();g.moveTo(x-2,y);g.lineTo(x+w+2,y);g.stroke()});
  g.globalAlpha=.06*p;g.fillStyle='#000';g.fillRect(bx,by,b.width,b.height);if(p<1)sched(L);else delete o.anim}
 else if(o.k==='tick'||o.k==='ask'){const s=20*Math.max(1,f),x=bx+b.width-s-6,y=by+Math.min(8,Math.max(0,b.height/2-s/2)),pop=o.anim&&!mxCalm()?clamp((performance.now()-o.anim)/220,0,1):1;g.translate(x+s/2,y+s/2);g.scale(.6+.4*pop,.6+.4*pop);g.translate(-s/2,-s/2);g.fillStyle=o.k==='tick'?'#2e8b4f':'#3b6fd8';g.beginPath();g.arc(s/2,s/2,s/2,0,6.3);g.fill();g.strokeStyle='#fff';g.fillStyle='#fff';g.lineWidth=2;
  if(o.k==='tick'){g.beginPath();g.moveTo(s*.27,s*.53);g.lineTo(s*.43,s*.69);g.lineTo(s*.74,s*.32);g.stroke()}else{g.font='700 '+s*.72+'px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('?',s/2,s/2+1)}if(pop<1)sched(L);else delete o.anim}
 else if(o.k==='conf'){const v=clamp(+(o.q&&o.q.v)||1,1,3),t=CONFL[v],ff='600 '+11.5*Math.max(1,f)+'px system-ui,sans-serif';g.font=ff;const w=g.measureText(t).width+30*Math.max(1,f),h=22*Math.max(1,f),x=bx+b.width-w-4,y=by-2;g.fillStyle=CONFC[v];g.beginPath();g.roundRect?g.roundRect(x,y,w,h,h/2):g.rect(x,y,w,h);g.fill();g.fillStyle='#fff';g.beginPath();g.moveTo(x+9,y+5);g.lineTo(x+9,y+h-5);g.moveTo(x+9,y+5);g.lineTo(x+18,y+8.5);g.lineTo(x+9,y+12);g.strokeStyle='#fff';g.lineWidth=1.6;g.stroke();g.textAlign='left';g.textBaseline='middle';g.fillText(t,x+23*Math.max(1,f)*.9,y+h/2+.5)}
 g.restore()}
function paint(L){const host=L.host,d=docOf(L.key),w=host.clientWidth,h=host.clientHeight;if(!w||!h){return}
 if(d&&d.objs.some(o=>o.a.h))adopt(L,d);
 syncPins(L,d,host.getBoundingClientRect());
 const has=d&&d.objs.length;if(!has&&!L.ink&&!L.hl)return;const gh=size(cv(L,'hl'),w,h),gi=size(cv(L,'ink'),w,h);gh.clearRect(0,0,w,h);gi.clearRect(0,0,w,h);
 if(!has)return;const hr=host.getBoundingClientRect();
 for(const o of d.objs){if(o.editing)continue;if(o.t==='text'){const tl=textLayout(L,o,hr);o.orphan=!tl;if(tl){gi.save();gi.font=tl.fz+'px '+tl.ff;gi.fillStyle=col(o.c);gi.textBaseline='top';tl.lines.forEach((l,i)=>gi.fillText(l,tl.x,tl.y+i*tl.lh));gi.restore()}continue}
  if(o.t==='mark'&&OPTK.includes(o.k)){paintOpt(L,o,gi,hr);continue}
  if(o.t==='mark'){const rs=markRects(L,o,hr);o.orphan=!rs;if(rs)drawMark(gh,gi,o,rs);continue}
  if(o.t==='sticker'){const sp=stkPos(L,o,hr);o.orphan=!sp;if(sp)drawSticker(gi,o.k,sp.x,sp.y,sp.s,col(o.c),sp.r);continue}
  if(o.t==='shape'){const ps=shapeOf(L,o,hr);o.orphan=!ps;ps&&ps.forEach(pl=>drawStroke(gi,pl,'ball',col(o.c),o.w,o.al,null));continue}
  if(o.t!=='stroke')continue;const pts=pxOf(L,o,hr);if(!pts||!pts.length){o.orphan=!pts;continue}o.orphan=false;
  if(o.k==='hl')drawStroke(gh,pts,'hl',col(o.c,true),o.w,o.al,null);else drawStroke(gi,pts,o.k,col(o.c),o.w,o.al,null)}}
const repaintAll=()=>layers.forEach(sched);
/* ---------- input ---------- */
let live=null,lastPen=0,drawing=false;
const penRecent=()=>performance.now()-lastPen<1200;
function simPress(L,x,y,t){const l=live.pts[live.pts.length-1];if(!l)return .5;const dt=Math.max(1,t-l.t),v=Math.hypot(x-l.x,y-l.y)/dt;return clamp(.95-v*.45,.25,.95)}
function addPoint(ev,host,L){const hr=host.getBoundingClientRect(),x=ev.clientX-hr.left,y=ev.clientY-hr.top,l=live.pts[live.pts.length-1],pen=ev.pointerType==='pen';
 const min=pen?.6:1.2;if(l&&Math.hypot(x-l.rx,y-l.ry)<min)return;
 let p=pen?(ev.pressure>0?ev.pressure:.5):simPress(L,x,y,ev.timeStamp);if(l)p=l.p*.6+p*.4;
 const k=clamp(P.smooth,0,1)*.55,sx=l?l.x+(x-l.x)*(1-k):x,sy=l?l.y+(y-l.y)*(1-k):y;
 live.pts.push({x:sx,y:sy,rx:x,ry:y,p,t:ev.timeStamp,tilt:Math.hypot(ev.tiltX||0,ev.tiltY||0)/90});live.moved=performance.now()}
function wetFrame(){const L=live&&live.L;if(!L||live.raf)return;live.raf=requestAnimationFrame(()=>{if(!live)return;live.raf=0;const w=L.host.clientWidth,h=L.host.clientHeight,g=size(cv(L,'wet'),w,h);g.clearRect(0,0,w,h);
 let pts=live.pts.map(q=>[q.x,q.y,q.p]);if(live.pred)pts=pts.concat(live.pred);const t=live.tool;
 if(t==='sel'){drawOverlay(g,L,live.mode==='lasso'?live.pts:null);return}
 if(t==='er'){const q=live.pts[live.pts.length-1];g.save();g.strokeStyle=col('k');g.globalAlpha=.6;g.lineWidth=1;g.beginPath();g.arc(q.x,q.y,P.sizes.er/2,0,6.3);g.stroke();g.restore();return}
 if(t==='shape'){const a=live.pts[0],b=live.pts[live.pts.length-1],A=[a.rx,a.ry];shapePolys(P.shape,A,snapShape(P.shape,A,[b.rx,b.ry])).forEach(pl=>drawStroke(g,pl,'ball',col(P.col),P.sizes.shape,null,null));return}
 if(live.snap){shapePolys(live.snap.k,live.snap.A,live.snap.B).forEach(pl=>drawStroke(g,pl,'ball',col(P.col),sizeOf('pen'),null,null));return}
 if(live.straight&&pts.length>1)pts=[pts[0],pts[pts.length-1]];
 drawStroke(g,pts,t==='hl'?'hl':KIND[P.pen],col(t==='hl'?P.hlc:P.col,t==='hl'),sizeOf(t),null,null)})}
const sizeOf=t=>t==='hl'?P.sizes.hl:t==='shape'?P.sizes.shape:P.sizes[P.pen];
function rdp(p,e){if(p.length<3)return p;const keep=new Uint8Array(p.length);keep[0]=keep[p.length-1]=1;const st=[[0,p.length-1]];
 while(st.length){const[a,b]=st.pop();let m=0,mi=-1;const A=p[a],B=p[b],dx=B[0]-A[0],dy=B[1]-A[1],l=dx*dx+dy*dy;
  for(let i=a+1;i<b;i++){let t=l?((p[i][0]-A[0])*dx+(p[i][1]-A[1])*dy)/l:0;t=clamp(t,0,1);const d=Math.hypot(p[i][0]-A[0]-t*dx,p[i][1]-A[1]-t*dy);if(d>m){m=d;mi=i}}
  if(m>e&&mi>0){keep[mi]=1;st.push([a,mi],[mi,b])}}return p.filter((_,i)=>keep[i])}
function segd(px,py,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy;let t=l?((px-a[0])*dx+(py-a[1])*dy)/l:0;t=clamp(t,0,1);return Math.hypot(px-a[0]-t*dx,py-a[1]-t*dy)}
function hit(pts,x,y,r){if(pts.length<2)return pts.length&&Math.hypot(pts[0][0]-x,pts[0][1]-y)<=r;for(let i=0;i<pts.length-1;i++)if(segd(x,y,pts[i],pts[i+1])<=r)return true;return false}
/* stylus buttons: eraser end / eraser button (buttons&32) erases while held; the barrel button (buttons&2) switches to a configurable tool while held. Needs hardware that reports these bits. */
function stylusTool(e){const t=P.tool;if(e.pointerType!=='pen')return t;if(!['pen','hl','shape'].includes(t))return t;if(e.buttons&32||e.button===5)return 'er';if(e.buttons&2&&P.barrel!=='off')return P.barrel;return t}
function commitShape(L,host,k,A,B,sz){const W=host.clientWidth,f=fsNow(),bl=nearest(host,A[0],A[1]),org=bl?origin(host,{b:bl.id}):{x:0,y:0},e=p=>[Math.round((p[0]-org.x)/W*REF),Math.round((p[1]-org.y)/f*YU)],ea=e(A),eb=e(B);
 commit(L,{i:ID(),t:'shape',k,c:P.col,w:+sz/f,a:{b:bl?bl.id:null},q:{x1:ea[0],y1:ea[1],x2:eb[0],y2:eb[1]}})}
/* draw and hold (~500 ms): a rough closed or straight stroke becomes a clean shape. Returns {k,A,B} in host px, or null. */
function recognise(pts){const n=pts.length;if(n<6)return null;let a=1e9,b=1e9,c=-1e9,d=-1e9,len=0;pts.forEach((q,i)=>{a=Math.min(a,q[0]);c=Math.max(c,q[0]);b=Math.min(b,q[1]);d=Math.max(d,q[1]);if(i)len+=Math.hypot(q[0]-pts[i-1][0],q[1]-pts[i-1][1])});
 const w=c-a,h=d-b,diag=Math.hypot(w,h);if(diag<24)return null;const F=pts[0],Z=pts[n-1],chord=Math.hypot(Z[0]-F[0],Z[1]-F[1]);
 let dev=0;pts.forEach(q=>{dev=Math.max(dev,segd(q[0],q[1],F,Z))});
 if(chord>.6*len&&dev<.09*chord)return{k:'line',A:[F[0],F[1]],B:snapShape('line',[F[0],F[1]],[Z[0],Z[1]])};
 if(chord>.3*len)return null;
 const S=rdp(pts,.075*diag),V=S.slice();if(V.length>2&&Math.hypot(V[0][0]-V[V.length-1][0],V[0][1]-V[V.length-1][1])<.3*diag)V.pop();
 const cx=(a+c)/2,cy=(b+d)/2,ra=w/2||1,rb=h/2||1;let err=0;pts.forEach(q=>{const u=(q[0]-cx)/ra,v=(q[1]-cy)/rb;err+=Math.abs(Math.sqrt(u*u+v*v)-1)});err/=n;
 const box=(k,flip)=>({k,A:[a,flip?d:b],B:[c,flip?b:d]});
 if(V.length>=6||(err<.1&&V.length>=5))return err<.2?box('ellipse'):null;
 if(V.length===3&&err>.1){const up=V.filter(q=>q[1]<cy).length===1;return box('tri',!up)}
 if(V.length===4){const an=(p,q,r)=>{const x1=p[0]-q[0],y1=p[1]-q[1],x2=r[0]-q[0],y2=r[1]-q[1],m=Math.hypot(x1,y1)*Math.hypot(x2,y2);return m?Math.acos(clamp((x1*x2+y1*y2)/m,-1,1))*180/Math.PI:0};
  const ok=V.every((q,i)=>{const g=an(V[(i+3)%4],q,V[(i+1)%4]);return g>62&&g<118});if(ok){const e0=Math.atan2(V[1][1]-V[0][1],V[1][0]-V[0][0])*180/Math.PI,m=((e0%90)+90)%90;if(m<14||m>76)return box('rect')}}
 return err<.14?box('ellipse'):null}
function onDown(e){if(!P.on||!e.isPrimary||P.tool==='hand'||P.tool==='hi'||(e.pointerType==='mouse'&&e.button!==0))return;const host=hostOf(e.target);if(!host)return;if(P.tool==='om'){if(host.matches(MXS)&&!e.target.closest('.mx-meta,.mx-qa,.mx-nbox'))omDown(e,host);return}if(e.target.closest&&e.target.closest('.an-tx,.an-pin,.an-sticky,'+MXS+' .mx-meta,'+MXS+' .mx-qa,'+MXS+' .mx-nbox'))return;
 if(e.pointerType==='pen'){lastPen=performance.now();offerPenOnly()}
 if(e.pointerType==='touch'&&(P.mode==='po'||penRecent()))return;
 if(P.tool==='tx'){txPend={host,x:e.clientX,y:e.clientY};return}
 if(P.tool==='st'||P.tool==='nt'){tapPend={host,x:e.clientX,y:e.clientY,tool:P.tool};return}
 if(P.tool==='ls'){laserStart(e,host);return}
 const L=layerOf(host);if(!L)return;e.preventDefault();try{host.setPointerCapture(e.pointerId)}catch(x){}
 active=L.key;drawing=true;document.body.classList.add('an-drawing');
 const T=stylusTool(e);live={L,pid:e.pointerId,tool:T,touch:e.pointerType==='touch',pts:[],gone:[],added:[],px:null};addPoint(e,host,L);if(!live.pts.length)return;
 if(live.tool==='sel')selStart(e);
 if(live.tool==='er'){const hr=host.getBoundingClientRect();live.hr0=hr;live.px=(docOf(L.key)||{objs:[]}).objs.map(o=>({o,pts:o.t==='stroke'?pxOf(L,o,hr):null,lines:o.t==='shape'?shapeOf(L,o,hr):null,rects:o.t==='mark'?markRects(L,o,hr):o.t==='text'?(t=>t?[[t.x,t.y,t.w,t.h]]:null)(textLayout(L,o,hr)):(o.t==='sticker'||o.t==='note')?stkRects(L,o,hr):null}));erase(e)}
 wetFrame();document.addEventListener('pointermove',onMove,{passive:true});document.addEventListener('pointerup',onUp);document.addEventListener('pointercancel',onUp)}
/* eraser: whole object, or "precise" (cuts strokes where the eraser passes). "Highlights only" leaves ink, shapes, text and stickers alone. */
const isHlObj=o=>o.t==='mark'||(o.t==='stroke'&&o.k==='hl');
function cutPts(pts,samp,rad){const dense=[];for(let i=0;i<pts.length;i++){dense.push(pts[i]);if(i<pts.length-1){const a=pts[i],b=pts[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]),k=Math.floor(l/Math.max(1.5,rad*.5));for(let m=1;m<=k;m++){const t=m/(k+1);dense.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t])}}}
 let hit=false;const out=[];let cur=[];dense.forEach(d=>{let near=false;for(let q=0;q<samp.length;q++){const dx=d[0]-samp[q][0],dy=d[1]-samp[q][1];if(dx*dx+dy*dy<=rad*rad){near=true;break}}if(near){hit=true;if(cur.length)out.push(cur);cur=[]}else cur.push(d)});if(cur.length)out.push(cur);
 return hit?out.filter(a=>a.length>=2):null}
function restroke(L,hr,o,pts){const host=L.host,W=host.clientWidth,f=fsNow(),q=rdp(pts,.22),bl=nearest(host,q[0][0],q[0][1]),org=bl?origin(host,{b:bl.id},hr):{x:0,y:0};
 return Object.assign({},o,{i:ID(),a:{b:bl?bl.id:null},g:enc(q.map(p=>[Math.round((p[0]-org.x)/W*REF),Math.round((p[1]-org.y)/f*YU),Math.round(clamp(p[2],0,1)*100)]))})}
function erase(){const n=live.pts.length,q=live.pts[n-1],p=n>1?live.pts[n-2]:q,L=live.L,d=docOf(L.key);if(!d)return;const r=P.sizes.er/2,steps=Math.max(1,Math.ceil(Math.hypot(q.rx-p.rx,q.ry-p.ry)/Math.max(2,r/2)));let ch=0;
 const samp=[];for(let k=0;k<=steps;k++)samp.push([p.rx+(q.rx-p.rx)*k/steps,p.ry+(q.ry-p.ry)*k/steps]);const hlOnly=P.erf==='hl',next=[];
 const drop=o=>{const i=d.objs.indexOf(o);if(i<0)return;d.objs.splice(i,1);const ai=live.added.indexOf(o);if(ai>=0)live.added.splice(ai,1);else live.gone.push({i,o});ch=1};
 for(const it of live.px){const o=it.o;if(hlOnly&&!isHlObj(o)){next.push(it);continue}
  if(it.rects){if(samp.some(sp=>it.rects.some(c=>sp[0]>=c[0]-r&&sp[0]<=c[0]+c[2]+r&&sp[1]>=c[1]-r&&sp[1]<=c[1]+c[3]+r))){drop(o);continue}next.push(it);continue}
  if(it.pts&&P.erm==='precise'){const pieces=cutPts(it.pts,samp,r+(o.w*fsNow())/2);if(!pieces){next.push(it);continue}
   const news=pieces.map(pc=>restroke(L,live.hr0,o,pc));drop(o);news.forEach((no,k)=>{d.objs.push(no);live.added.push(no);next.push({o:no,pts:pxOf(L,no,live.hr0),lines:null,rects:null})});ch=1;continue}
  const ls=it.lines||(it.pts?[it.pts]:null);if(!ls){next.push(it);continue}
  if(samp.some(sp=>ls.some(pl=>hit(pl,sp[0],sp[1],r+(it.o.w*fsNow())/2)))){drop(o);continue}next.push(it)}
 live.px=next;if(ch)sched(L)}
function onMove(e){if(!live||e.pointerId!==live.pid)return;const host=live.L.host;const evs=e.getCoalescedEvents?e.getCoalescedEvents():[];(evs.length?evs:[e]).forEach(x=>addPoint(x,host,live.L));
 live.pred=null;try{const pe=e.getPredictedEvents?e.getPredictedEvents():[];if(pe.length&&(live.tool==='pen'||live.tool==='hl')){const hr=host.getBoundingClientRect();live.pred=pe.slice(0,3).map(x=>[x.clientX-hr.left,x.clientY-hr.top,live.pts[live.pts.length-1].p])}}catch(x){}
 if(live.tool==='er')erase();
 if(live.tool==='sel')selMove();
 if(live.tool==='hl'){clearTimeout(live.hold);live.straight=false;live.hold=setTimeout(()=>{if(live){live.straight=true;wetFrame()}},520)}
 else if(live.tool==='pen'&&P.snap){clearTimeout(live.hold);live.snap=null;live.hold=setTimeout(()=>{if(live&&live.tool==='pen'){const r=recognise(live.pts.map(q=>[q.rx,q.ry]));if(r){live.snap=r;wetFrame()}}},500)}
 wetFrame()}
function onUp(e){if(!live||(e&&e.pointerId!==live.pid))return;document.removeEventListener('pointermove',onMove);document.removeEventListener('pointerup',onUp);document.removeEventListener('pointercancel',onUp);
 const l=live;live=null;clearTimeout(l.hold);cancelAnimationFrame(l.raf);drawing=false;document.body.classList.remove('an-drawing');const L=l.L,host=L.host;
 const wg=L.wet&&L.wet.getContext('2d');wg&&wg.clearRect(0,0,L.wet.width,L.wet.height);
 if(l.tool==='sel'){selUp(l,!!(e&&e.type==='pointercancel'));return}
 if(e&&e.type==='pointercancel'){if(l.gone.length||l.added.length){const d=docOf(L.key),ids=new Set(l.added.map(o=>o.i));d.objs=d.objs.filter(o=>!ids.has(o.i));l.gone.slice().reverse().forEach(x=>d.objs.splice(Math.min(x.i,d.objs.length),0,x.o))}sched(L);return}
 if(l.tool==='er'){if(l.gone.length||l.added.length){pushOp(L.key,l.added.length?{t:'ers',items:l.gone,added:l.added}:{t:'del',items:l.gone});touch(L.key)}sched(L);sync();return}
 if(l.tool==='shape'){const a=l.pts[0],b=l.pts[l.pts.length-1],A=[a.rx,a.ry],B=snapShape(P.shape,A,[b.rx,b.ry]);if(Math.hypot(B[0]-A[0],B[1]-A[1])<6){sched(L);return}
  commitShape(L,host,P.shape,A,B,P.sizes.shape);return}
 if(l.snap){commitShape(L,host,l.snap.k,l.snap.A,l.snap.B,sizeOf('pen'));return}
 let pts=l.pts.map(q=>[q.x,q.y,q.p]);if(!pts.length)return;if(l.straight&&pts.length>1){let a=pts[0],b=pts[pts.length-1];const ang=Math.atan2(b[1]-a[1],b[0]-a[0]);if(Math.abs(Math.sin(ang))<.1)b=[b[0],a[1],b[2]];pts=[a,b]}
 pts=rdp(pts,.22);const W=host.clientWidth,f=fsNow(),bl=nearest(host,pts[0][0],pts[0][1]),org=bl?origin(host,{b:bl.id}):{x:0,y:0};
 const o={i:ID(),t:'stroke',k:l.tool==='hl'?'hl':KIND[P.pen],c:l.tool==='hl'?P.hlc:P.col,w:+sizeOf(l.tool)/f,a:{b:bl?bl.id:null},
  g:enc(pts.map(p=>[Math.round((p[0]-org.x)/W*REF),Math.round((p[1]-org.y)/f*YU),Math.round(clamp(p[2],0,1)*100)]))};
 let d=docOf(L.key);if(!d)d=St.docs[L.key]={k:L.key,v:2,rev:0,upd:0,objs:[]};if(d.objs.length>=MAX.objs){alert('This answer has the maximum number of marks. Delete some to add more.');return}
 d.objs.push(o);pushOp(L.key,{t:'add',o});touch(L.key);sched(L);sync()}
/* ---------- undo / redo (per answer, depth 200) ---------- */
function pushOp(k,op){(St.undo[k]=St.undo[k]||[]).push(op);if(St.undo[k].length>200)St.undo[k].shift();St.redo[k]=[]}
function apply(k,op,rev){const d=docOf(k);if(!d)return;
 if(op.t==='addn'){if(rev){const ids=new Set(op.os.map(o=>o.i));d.objs=d.objs.filter(o=>!ids.has(o.i))}else d.objs.push(...op.os)}else
 if(op.t==='add'){if(rev){const i=d.objs.findIndex(x=>x.i===op.o.i);i>=0&&d.objs.splice(i,1)}else d.objs.push(op.o)}
 else if(op.t==='repn'){op.pairs.forEach(q=>{const i=d.objs.findIndex(o=>o.i===q.old.i);if(i>=0)d.objs[i]=rev?q.old:q.n})}
 else if(op.t==='rep'){const i=d.objs.findIndex(o=>o.i===op.old.i);if(i>=0)d.objs[i]=rev?op.old:op.n}
 else if(op.t==='ers'){if(rev){const ids=new Set(op.added.map(o=>o.i));d.objs=d.objs.filter(o=>!ids.has(o.i));op.items.slice().reverse().forEach(x=>d.objs.splice(Math.min(x.i,d.objs.length),0,x.o))}else{const ids=new Set(op.items.map(x=>x.o.i));d.objs=d.objs.filter(o=>!ids.has(o.i));d.objs.push(...op.added)}}
 else if(op.t==='del'){if(rev)op.items.slice().reverse().forEach(x=>d.objs.splice(Math.min(x.i,d.objs.length),0,x.o));else op.items.forEach(x=>{const i=d.objs.findIndex(y=>y.i===x.o.i);i>=0&&d.objs.splice(i,1)})}
 touch(k);const h=hostByKey(k),L=h&&layers.get(h);L&&sched(L)}
function step(fromU){const k=active;if(!k)return;const A=(fromU?St.undo:St.redo)[k],B=(fromU?St.redo:St.undo)[k]||(fromU?St.redo[k]=[]:St.undo[k]=[]);const op=A&&A.pop();if(!op)return;apply(k,op,fromU);B.push(op);sync()}
function clearActive(){const k=active,d=k&&docOf(k);if(!d||!d.objs.length){alert('Write on an answer first, then Clear removes all handwriting from it.');return}
 if(!confirm('Remove all handwriting from the answer you last wrote on? You can undo this.'))return;const items=d.objs.map((o,i)=>({i,o})).reverse();d.objs=[];pushOp(k,{t:'del',items});touch(k);const h=hostByKey(k),L=h&&layers.get(h);L&&sched(L);sync()}
/* ---------- toolbar ---------- */
const IC={om:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12.5l2.7 2.7L16.5 9"/>',pen:'<path d="M4 20l1-4L16 5a2.1 2.1 0 0 1 3 3L8 19z"/><path d="M14 7l3 3"/>',hl:'<path d="M9 14l7-9 3 3-8 8z"/><path d="M9 14l-3 4 4-1"/><path d="M4 21h7"/>',tx:'<path d="M5 6h14M12 6v13M9 19h6"/>',sel:'<path d="M4 9V6a2 2 0 0 1 2-2h3M15 4h3a2 2 0 0 1 2 2v3M20 15v3a2 2 0 0 1-2 2h-3M9 20H6a2 2 0 0 1-2-2v-3" stroke-dasharray="2.2 2.2"/><path d="M10 10l7 3-3 1-1 3z"/>',hi:'<path d="M4 7h16M4 12h10M4 17h16"/><path d="M14 12h6" stroke-width="4" opacity=".45"/>',shape:'<rect x="3.5" y="4" width="9" height="9" rx="1.5"/><circle cx="15.5" cy="15.5" r="5"/>',er:'<path d="M8 20h11M5 14l8-8 6 6-6 6H9z"/><path d="M8 11l6 6"/>',hand:'<path d="M8 12V6a1.5 1.5 0 0 1 3 0v5m0-6a1.5 1.5 0 0 1 3 0v6m0-4a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-1a5 5 0 0 1-4-2l-3-4a1.5 1.5 0 0 1 2.3-1.9L8 15"/>',
 undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',redo:'<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',eyeoff:'<path d="M3 3l18 18M10.6 6.1A9.6 9.6 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.6 6.6A16.6 16.6 0 0 0 2 12s4 7 10 7a9.5 9.5 0 0 0 4-.9"/>',
 grip:'<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',min:'<path d="M6 12h12"/>',done:'<path d="M5 12l5 5L19 7"/>',st:'<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z"/>',nt:'<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5M8.5 9h7M8.5 12.5h4"/>',ls:'<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',fav:'<path d="M12 20.5l-1.2-1.1C6 15.2 3.5 12.9 3.5 9.9A4.4 4.4 0 0 1 8 5.5c1.7 0 3.3.9 4 2.2.7-1.3 2.3-2.2 4-2.2a4.4 4.4 0 0 1 4.5 4.4c0 3-2.5 5.3-7.3 9.5z"/>'};
for(const k in STK)IC['s_'+k]='<path d="'+STK[k]+'"/>';
IC.m_hi='<path d="M4 7h16M4 12h10M4 17h16"/><path d="M14 12h6" stroke-width="4" opacity=".45"/>';IC.m_u='<path d="M7 4v7a5 5 0 0 0 10 0V4M5 20h14"/>';IC.m_s='<path d="M4 12h16M16.5 6.5C15.5 5 14 4.5 12 4.5c-2.5 0-4.5 1.3-4.5 3.3 0 4.2 9 2.3 9 6.5 0 2-2 3.2-4.5 3.2-2.2 0-3.9-.8-4.8-2.3"/>';IC.m_sq='<path d="M3 17l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2M7 5v7a5 5 0 0 0 10 0V5" transform="translate(0 -3)"/>';
function svg(n){const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('width','24');s.setAttribute('height','24');s.setAttribute('aria-hidden','true');s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');s.setAttribute('stroke-width','1.7');s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round');
 const p=new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">'+IC[n]+'</svg>','image/svg+xml').documentElement;[...p.childNodes].forEach(c=>s.appendChild(document.importNode(c,true)));return s}
let bar=null,pop=null;
function btn(id,label,ic,fn){const b=document.createElement('button');b.type='button';b.dataset.a=id;b.setAttribute('aria-label',label);b.title=label;b.append(svg(ic));b.addEventListener('click',fn);return b}
function buildUi(){
 bar=document.createElement('div');bar.id='an-bar';bar.hidden=true;bar.setAttribute('role','toolbar');bar.setAttribute('aria-label','Annotation tools');
 const grip=btn('grip','Move toolbar (drag, or use arrow keys)','grip',()=>{});grip.classList.add('an-grip');
 const tool=(id,label,ic)=>btn(id,label,ic,()=>{if(P.tool===id&&id!=='hand'&&id!=='ls')togglePop(id==='hi'?'hl':id);else{P.tool=id;closePop();setting('tool',id);sync()}});
 const sw=document.createElement('button');sw.type='button';sw.className='an-sw';sw.dataset.a='col';sw.setAttribute('aria-label','Colour and size');sw.addEventListener('click',()=>{if(P.tool!=='ls')togglePop(P.tool==='er'?'er':P.tool==='hi'?'hl':P.tool)});
 const sep=()=>{const s=document.createElement('span');s.className='an-sep';s.setAttribute('role','separator');return s};
 const items=[grip,tool('pen','Pen (P)','pen'),tool('hl','Highlighter (H)','hl'),tool('hi','Highlight selected text (T)','hi'),tool('shape','Shapes (S)','shape'),tool('tx','Text note (X)','tx'),tool('st','Stickers (K)','st'),tool('nt','Sticky note (N)','nt'),tool('ls','Laser pointer (J), never saved','ls'),tool('om','Mark answer options: tap to tick or ?, hold or swipe to cross out (M)','om'),tool('sel','Select, move and resize (L)','sel'),tool('er','Eraser (E)','er'),tool('hand','Scroll and pan (V)','hand'),sw,sep(),
  btn('fav','Favourite pens','fav',()=>presetPop()),btn('undo','Undo','undo',()=>step(true)),btn('redo','Redo','redo',()=>step(false)),btn('clear','Clear this answer','trash',clearActive),btn('eye','Hide or show annotations','eye',()=>{P.hide=!P.hide;setting('hide',P.hide);sync()}),
  btn('min','Collapse toolbar','min',()=>{P.mini=true;setting('mini',true);sync()}),btn('done','Done','done',()=>setOn(false))];
 items.forEach(i=>bar.append(i));
 const pill=document.createElement('button');pill.type='button';pill.id='an-pill';pill.setAttribute('aria-label','Expand annotation toolbar');pill.addEventListener('click',()=>{P.mini=false;setting('mini',false);sync()});pill.append(svg('pen'));const dot=document.createElement('i');pill.append(dot);
 document.body.append(bar,pill);
 bar.addEventListener('keydown',e=>{const bs=[...bar.querySelectorAll('button:not([disabled])')],i=bs.indexOf(document.activeElement);if(i<0)return;
  if(document.activeElement.classList.contains('an-grip')&&e.key.startsWith('Arrow')){e.preventDefault();const s=e.shiftKey?40:10,r=bar.getBoundingClientRect();place(r.left+(e.key==='ArrowRight'?s:e.key==='ArrowLeft'?-s:0),r.top+(e.key==='ArrowDown'?s:e.key==='ArrowUp'?-s:0),true);return}
  const n=e.key==='ArrowRight'||e.key==='ArrowDown'?1:e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:0;if(!n)return;e.preventDefault();bs[(i+n+bs.length)%bs.length].focus()});
 let dr=null;grip.addEventListener('pointerdown',e=>{const r=bar.getBoundingClientRect();dr={x:e.clientX-r.left,y:e.clientY-r.top};e.preventDefault();try{grip.setPointerCapture(e.pointerId)}catch(x){}});
 grip.addEventListener('pointermove',e=>{if(dr)place(e.clientX-dr.x,e.clientY-dr.y,false)});const end=()=>{if(dr){dr=null;const r=bar.getBoundingClientRect();P.pos=[Math.round(r.left),Math.round(r.top)];setting('pos',P.pos)}};
 grip.addEventListener('pointerup',end);grip.addEventListener('pointercancel',end);
 addEventListener('resize',()=>place());
 const tl=$('#tools');if(tl&&!$('[data-t=ink]',tl)){const b=document.createElement('button');b.type='button';b.dataset.t='ink';b.setAttribute('aria-pressed','false');b.textContent='Annotate';b.title='Write, highlight and erase on answers';b.addEventListener('click',()=>setOn(!P.on));tl.insertBefore(b,tl.firstChild)}
 sync()}
function place(x,y,save){const el=P.mini?$('#an-pill'):bar,r=el.getBoundingClientRect(),nav=$('#bnav'),nb=nav&&nav.offsetParent!==null?nav.getBoundingClientRect().height:0,m=8;
 if(x==null){const p=P.pos;x=p?p[0]:(innerWidth-r.width)/2;y=p?p[1]:innerHeight-r.height-nb-14-(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sab'))||0)}
 const maxY=innerHeight-r.height-nb-m;x=clamp(x,m,Math.max(m,innerWidth-r.width-m));y=clamp(y,m,Math.max(m,maxY));
 el.style.left=x+'px';el.style.top=y+'px';el.style.bottom='auto';if(save){P.pos=[Math.round(x),Math.round(y)];setting('pos',P.pos)}}
function togglePop(id){if(pop&&pop.dataset.for===id){closePop();return}closePop();pop=document.createElement('div');pop.className='an-pop';pop.dataset.for=id;pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Tool options');
 const row=(t,el)=>{const r=document.createElement('div');r.className='an-row';const l=document.createElement('span');l.textContent=t;r.append(l,el);return r};
 if(id==='pen'){const g=document.createElement('div');g.className='an-seg';[['ball','Ballpoint'],['fnt','Fountain'],['pencil','Pencil']].forEach(([k,n])=>{const b=document.createElement('button');b.type='button';b.textContent=n;b.setAttribute('aria-pressed',P.pen===k);b.onclick=()=>{P.pen=k;setting('pen',k);closePop();sync()};g.append(b)});pop.append(g)}
 if(id==='er'){const mk=(key,opts,label,tip)=>{const g=document.createElement('div');g.className='an-seg';opts.forEach(([v,n])=>{const b=document.createElement('button');b.type='button';b.textContent=n;b.setAttribute('aria-pressed',P[key]===v);b.onclick=()=>{P[key]=v;setting(key,v);g.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b))};g.append(b)});g.title=tip;pop.append(row(label,g))};
  mk('erm',[['stroke','Stroke'],['precise','Precise']],'Erase by','Stroke removes a whole mark; Precise only rubs out the part you touch');mk('erf',[['all','Everything'],['hl','Highlights']],'Affects','Highlights only leaves ink, shapes and text alone')}
 if(id==='tx'){const g=document.createElement('div');g.className='an-seg';[['sans','Sans'],['serif','Serif'],['hand','Hand']].forEach(([k,n])=>{const b=document.createElement('button');b.type='button';b.textContent=n;b.style.fontFamily=FONTS[k]||'inherit';b.setAttribute('aria-pressed',P.font===k);b.onclick=()=>{P.font=k;setting('font',k);g.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));if(typeof drawPv==='function')drawPv()};g.append(b)});pop.append(g)}
 if(id==='st'){const g=document.createElement('div');g.className='an-seg an-stks';Object.keys(STK).forEach(k=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',STKL[k]);b.title=STKL[k];b.setAttribute('aria-pressed',P.stk===k);b.append(svg('s_'+k));b.onclick=()=>{P.stk=k;setting('stk',k);g.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));drawPv()};g.append(b)});pop.append(g)}
 if(id==='shape'){const g=document.createElement('div');g.className='an-seg';[['line','Line'],['arrow','Arrow'],['rect','Box'],['ellipse','Oval'],['tri','Triangle'],['brace','Brace']].forEach(([k,n])=>{const b=document.createElement('button');b.type='button';b.textContent=n;b.setAttribute('aria-pressed',P.shape===k);b.onclick=()=>{P.shape=k;setting('shape',k);closePop();sync()};g.append(b)});pop.append(g)}
 if(id!=='er'){const g=document.createElement('div');g.className='an-cols';const pal=id==='hl'?HLP:PAL,cur=id==='hl'?P.hlc:P.col;Object.keys(pal).forEach(k=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',pal[k][3]);b.setAttribute('aria-pressed',cur===k);b.style.setProperty('--c',col(k,id==='hl'));b.onclick=()=>{id==='hl'?P.hlc=k:P.col=k;setting(id==='hl'?'hlc':'col',k);closePop();sync()};g.append(b)});
  const cu=document.createElement('input');cu.type='color';cu.setAttribute('aria-label','Custom colour');cu.value=/^#/.test(cur)?cur:col(cur,id==='hl');cu.oninput=()=>{id==='hl'?P.hlc=cu.value:P.col=cu.value;sync()};cu.onchange=()=>setting(id==='hl'?'hlc':'col',cu.value);g.append(cu);pop.append(g)}
 const key=id==='pen'?P.pen:id,rg=document.createElement('input');rg.type='range';rg.min=id==='hl'?6:id==='er'?6:id==='tx'?10:id==='st'?16:1;rg.max=id==='hl'?40:id==='er'?60:id==='tx'?40:id==='st'?64:12;rg.step=.5;rg.value=P.sizes[key];rg.setAttribute('aria-label','Size');
 const pv=document.createElement('canvas');pv.width=160;pv.height=36;const drawPv=()=>{P.sizes[key]=+rg.value;const g=pv.getContext('2d');g.clearRect(0,0,160,36);if(id==='st'){drawSticker(g,P.stk,80,18,Math.min(34,+rg.value),col(P.col));return}if(id==='tx'){g.fillStyle=col(P.col);g.textBaseline='middle';g.font=Math.min(30,+rg.value)+'px '+(FONTS[P.font]||'system-ui,sans-serif');g.fillText('Aa Text',10,18);return}if(id==='er'){g.strokeStyle=col('k');g.beginPath();g.arc(80,18,Math.min(16,P.sizes.er/2),0,6.3);g.stroke();return}
  const pts=[];for(let i=0;i<=24;i++)pts.push([10+i*6.25,18+Math.sin(i/3.2)*8,.35+.55*Math.sin(i/24*Math.PI)]);drawStroke(g,pts,id==='hl'?'hl':KIND[P.pen],col(id==='hl'?P.hlc:P.col,id==='hl'),+rg.value/fsNow(),id==='hl'?.6:null,fsNow())};
 rg.oninput=drawPv;rg.onchange=()=>setting('sizes',P.sizes);if(id!=='nt')drawPv();if(id!=='nt')pop.append(row('Size',rg),pv);
 if(id!=='er'&&id!=='st'&&id!=='nt'){const sm=document.createElement('input');sm.type='range';sm.min=0;sm.max=1;sm.step=.05;sm.value=P.smooth;sm.setAttribute('aria-label','Smoothing');sm.oninput=()=>{P.smooth=+sm.value;setting('smooth',P.smooth)};pop.append(row('Smoothing',sm))}
 if(id==='pen'){const pr=document.createElement('input');pr.type='range';pr.min=0;pr.max=1;pr.step=.1;pr.value=P.press;pr.setAttribute('aria-label','Pressure sensitivity');pr.oninput=()=>{P.press=+pr.value;setting('press',P.press)};pop.append(row('Pressure',pr))}
 const md=document.createElement('div');md.className='an-seg';[['pf','Pen + finger'],['po','Pen only']].forEach(([k,n])=>{const b=document.createElement('button');b.type='button';b.textContent=n;b.setAttribute('aria-pressed',P.mode===k);b.onclick=()=>{P.mode=k;setting('mode',k);md.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));sync()};md.append(b)});pop.append(row('Input',md));
 const gs=document.createElement('div');gs.className='an-seg';[[true,'On'],[false,'Off']].forEach(([v,n])=>{const b=document.createElement('button');b.type='button';b.textContent=n;b.setAttribute('aria-pressed',P.gest===v);b.onclick=()=>{P.gest=v;setting('gest',v);gs.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b))};gs.append(b)});gs.title='Two-finger tap undoes, three-finger tap redoes';pop.append(row('Gestures',gs));
if(id==='pen'){const sn=document.createElement('div');sn.className='an-seg';[[true,'On'],[false,'Off']].forEach(([v,n])=>{const b=document.createElement('button');b.type='button';b.textContent=n;b.setAttribute('aria-pressed',P.snap===v);b.onclick=()=>{P.snap=v;setting('snap',v);sn.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b))};sn.append(b)});sn.title='Hold the pen still for half a second to turn a rough shape into a clean one';pop.append(row('Hold to snap',sn))}
 if(id==='pen'||id==='hl'||id==='shape'){const bs=document.createElement('div');bs.className='an-seg';[['er','Erase'],['hl','Marker'],['off','Off']].forEach(([v,n])=>{const b=document.createElement('button');b.type='button';b.textContent=n;b.setAttribute('aria-pressed',P.barrel===v);b.onclick=()=>{P.barrel=v;setting('barrel',v);bs.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b))};bs.append(b)});bs.title='What the stylus side button does while held (needs a stylus that reports it)';pop.append(row('Pen button',bs))}
 document.body.append(pop);const br=bar.getBoundingClientRect(),pr=pop.getBoundingClientRect();pop.style.left=clamp(br.left+br.width/2-pr.width/2,8,innerWidth-pr.width-8)+'px';pop.style.top=Math.max(8,br.top-pr.height-8)+'px'}
function closePop(){if(pop){pop.remove();pop=null}}
/* favourites: 5 slots. Tap = use, press and hold (or Shift+click / Shift+Enter) = save the current tool into the slot */
function curPreset(){const t=P.tool;if(t==='hl'||t==='hi')return{t:'hl',c:P.hlc,z:P.sizes.hl};if(t==='shape')return{t:'shape',s:P.shape,c:P.col,z:P.sizes.shape};return{t:'pen',p:P.pen,c:P.col,z:P.sizes[P.pen]}}
function usePreset(i){const q=P.pre[i];if(!q)return;if(q.t==='hl'){P.tool='hl';P.hlc=q.c;P.sizes.hl=q.z}else if(q.t==='shape'){P.tool='shape';P.shape=q.s;P.col=q.c;P.sizes.shape=q.z}else{P.tool='pen';P.pen=q.p;P.col=q.c;P.sizes[q.p]=q.z}
 setting('tool',P.tool);setting('pen',P.pen);setting('col',P.col);setting('hlc',P.hlc);setting('shape',P.shape);setting('sizes',P.sizes);sync()}
function savePreset(i){P.pre[i]=curPreset();setting('pre',P.pre)}
function presetPop(){if(pop&&pop.dataset.for==='fav'){closePop();return}closePop();pop=document.createElement('div');pop.className='an-pop';pop.dataset.for='fav';pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Favourite pens');
 const g=document.createElement('div');g.className='an-cols an-fav';const hint=document.createElement('p');hint.className='an-hint';hint.setAttribute('role','status');hint.textContent='Tap to use. Press and hold, or Shift+click, to save the current pen here.';
 const draw=()=>{g.replaceChildren();P.pre.forEach((q,i)=>{const b=document.createElement('button');b.type='button';b.className='an-fv';b.style.setProperty('--c',col(q.c,q.t==='hl'));b.append(svg(q.t==='hl'?'hl':q.t==='shape'?'shape':'pen'));b.setAttribute('aria-label','Favourite '+(i+1)+': '+(q.t==='hl'?'highlighter':q.t==='shape'?'shape':q.p==='fnt'?'fountain pen':q.p==='pencil'?'pencil':'ballpoint'));
  let tm=0,held=false;const save=()=>{savePreset(i);draw();const nb=g.children[i];nb&&nb.focus();hint.textContent='Saved to favourite '+(i+1)+'.'};
  b.addEventListener('pointerdown',()=>{held=false;clearTimeout(tm);tm=setTimeout(()=>{held=true;save()},600)});['pointerup','pointerleave','pointercancel'].forEach(n=>b.addEventListener(n,()=>clearTimeout(tm)));
  b.addEventListener('click',ev=>{if(held){held=false;return}if(ev.shiftKey){save();return}usePreset(i);closePop()});
  b.addEventListener('keydown',ev=>{if(ev.key==='Enter'&&ev.shiftKey){ev.preventDefault();save()}});g.append(b)})};
 draw();pop.append(g,hint);document.body.append(pop);const br=bar.getBoundingClientRect(),pr=pop.getBoundingClientRect();pop.style.left=clamp(br.left+br.width/2-pr.width/2,8,innerWidth-pr.width-8)+'px';pop.style.top=Math.max(8,br.top-pr.height-8)+'px'}
let offered=false;function offerPenOnly(){if(offered||P.seenPen||P.mode==='po')return;offered=true;P.seenPen=true;setting('seenPen',true);
 const n=document.createElement('div');n.className='an-note';n.setAttribute('role','status');const t=document.createElement('span');t.textContent='Stylus detected. Use pen only so your palm and fingers just scroll?';
 const y=document.createElement('button');y.type='button';y.textContent='Pen only';y.onclick=()=>{P.mode='po';setting('mode','po');n.remove();sync()};const x=document.createElement('button');x.type='button';x.textContent='Keep both';x.onclick=()=>n.remove();n.append(t,y,x);document.body.append(n);setTimeout(()=>n.remove(),12000)}
const HLT=()=>P.tool==='hl'||P.tool==='hi';
function sync(){if(!bar)return;{const f=$('#an-fab-on'),e2=$('#an-fab-eye');if(f){f.setAttribute('aria-pressed',!!P.on);e2.setAttribute('aria-pressed',!!P.hide);e2.replaceChildren(svg(P.hide?'eyeoff':'eye'))}}if(P.tool!=='hi')hideSelPop();if(P.tool!=='sel'){if(sel)clearSel();else{pasteAt=null;const sb=$('#an-selbar');sb&&(sb.hidden=true)}}const b=document.body,on=!!P.on;b.classList.toggle('an-on',on);b.classList.toggle('an-pf',P.mode==='pf');b.classList.toggle('an-po',P.mode==='po');b.classList.toggle('an-hidden',!!P.hide);
 ['pen','hl','hi','shape','tx','st','nt','ls','om','sel','er','hand'].forEach(t=>b.classList.toggle('an-t-'+t,P.tool===t));
 bar.hidden=!on||P.mini;const pill=$('#an-pill');pill.hidden=!on||!P.mini;
 bar.querySelectorAll('[data-a=pen],[data-a=hl],[data-a=hi],[data-a=shape],[data-a=tx],[data-a=st],[data-a=nt],[data-a=ls],[data-a=om],[data-a=sel],[data-a=er],[data-a=hand]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.a===P.tool));
 const u=bar.querySelector('[data-a=undo]'),r=bar.querySelector('[data-a=redo]');u.disabled=!(active&&(St.undo[active]||[]).length);r.disabled=!(active&&(St.redo[active]||[]).length);
 const e=bar.querySelector('[data-a=eye]');e.replaceChildren(svg(P.hide?'eyeoff':'eye'));e.setAttribute('aria-pressed',!!P.hide);
 const sw=bar.querySelector('.an-sw');sw.style.setProperty('--c',col(HLT()?P.hlc:P.col,HLT()));sw.hidden=P.tool==='hand'||P.tool==='ls';
 pill.querySelector('i').style.background=col(HLT()?P.hlc:P.col,HLT());pill.firstChild.replaceWith(svg(P.tool in IC?P.tool:'pen'));
 const tb=$('#tools [data-t=ink]');tb&&tb.setAttribute('aria-pressed',on);
 requestAnimationFrame(()=>place())}
function setOn(v){closeText(true);P.on=v;if(!v){closePop();if(live)onUp({pointerId:live.pid,type:'pointercancel'})}else{document.querySelectorAll('.card .ans,'+MXS).forEach(h=>layerOf(h))}sync()}
/* ---------- finger scroll vs stylus (touch-action strategy lives in annot.css; this closes the gap for styluses that scroll) ---------- */
document.addEventListener('touchstart',e=>{if(!P.on||P.tool==='hand'||P.tool==='hi'||!hostOf(e.target))return;for(const t of e.changedTouches)if(t.touchType==='stylus'&&e.cancelable){e.preventDefault();return}},{passive:false});
document.addEventListener('pointerdown',onDown,{passive:false,capture:true});
document.addEventListener('pointerover',e=>{/* a hovering pen means this contact is a stylus: stop it scrolling on browsers that only expose pointerType, not touchType */if(P.on&&e.pointerType==='pen'&&hostOf(e.target))document.body.classList.add('an-pen-near')},true);
document.addEventListener('pointerout',e=>{if(e.pointerType==='pen')document.body.classList.remove('an-pen-near')},true);
document.addEventListener('keydown',e=>{if(!P.on||e.target.closest&&e.target.closest('input,textarea,select,[contenteditable]'))return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();step(!e.shiftKey);return}
 if(P.tool==='sel'&&sel){if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();delSel();return}if(e.key==='Escape'){clearSel();return}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){e.preventDefault();dupSel();return}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='c'&&getSelection().isCollapsed){e.preventDefault();copySel();return}}
 if(P.tool==='sel'&&clip&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='v'){e.preventDefault();pasteClip();return}
 if(e.ctrlKey||e.metaKey||e.altKey)return;const m={p:'pen',h:'hl',t:'hi',s:'shape',x:'tx',k:'st',n:'nt',j:'ls',m:'om',l:'sel',e:'er',v:'hand'}[e.key.toLowerCase()];if(m){P.tool=m;setting('tool',m);closePop();sync();if(document.body.classList.contains('mx-live'))e.stopPropagation()}
 else if(e.key==='['||e.key===']'){const k=P.tool==='hl'?'hl':P.tool==='er'?'er':P.pen;P.sizes[k]=clamp(P.sizes[k]+(e.key===']'?1:-1),1,60);setting('sizes',P.sizes)}else if(e.key==='Escape')closePop()});
new MutationObserver(()=>{repaintAll();sync()}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','data-tone']});
matchMedia('(prefers-color-scheme:dark)').addEventListener&&matchMedia('(prefers-color-scheme:dark)').addEventListener('change',()=>repaintAll());
new MutationObserver(()=>repaintAll()).observe(document.documentElement,{attributes:true,attributeFilter:['style','class']});
addEventListener('beforeprint',()=>{printing=true;layers.forEach(L=>paint(L))});addEventListener('afterprint',()=>{printing=false;repaintAll()});
const flushNow=()=>{flush()};document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushNow()});addEventListener('pagehide',flushNow);
/* ---------- gestures ---------- */
const gt={n:new Map(),max:0,moved:false,t0:0};
document.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;if(!gt.n.size){gt.max=0;gt.moved=false;gt.t0=performance.now()}gt.n.set(e.pointerId,[e.clientX,e.clientY]);gt.max=Math.max(gt.max,gt.n.size);
 if(gt.n.size>=2&&live&&live.touch&&P.on)onUp({pointerId:live.pid,type:'pointercancel'})},true);
document.addEventListener('pointermove',e=>{const o=gt.n.get(e.pointerId);if(o&&Math.hypot(e.clientX-o[0],e.clientY-o[1])>14)gt.moved=true},true);
const gEnd=e=>{if(e.pointerType!=='touch'||!gt.n.has(e.pointerId))return;gt.n.delete(e.pointerId);if(gt.n.size)return;
 if(P.on&&P.gest&&e.type==='pointerup'&&!gt.moved&&performance.now()-gt.t0<380&&!(document.activeElement&&document.activeElement.matches&&document.activeElement.matches('textarea,input'))){if(gt.max===2)step(true);else if(gt.max===3)step(false)}gt.max=0};
document.addEventListener('pointerup',gEnd,true);document.addEventListener('pointercancel',gEnd,true);
/* ---------- gentle nudges: install on iOS, back up after lots of new work ---------- */
let nud=0;async function nudges(){if(nud||!St.db)return;nud=1;try{const ios=/iP(ad|hone|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),sa=navigator.standalone||matchMedia('(display-mode:standalone)').matches;
 St.meta.sinceBackup=(St.meta.sinceBackup||0)+1;let msg=null;
 if(ios&&!sa&&!(await metaGet('nudged')))msg=['Safari can erase site data if you do not visit for about a week. Add this site to your Home Screen, and use Menu > Export backup now to keep a copy of your handwriting.','nudged'];
 else if(St.meta.sinceBackup>=150&&!(await metaGet('remind-'+Math.floor(St.meta.sinceBackup/150))))msg=['You have added a lot of handwriting since your last backup. Menu > Export backup now keeps a safe copy.','remind-'+Math.floor(St.meta.sinceBackup/150)];
 if(msg){await metaPut(msg[1],1);const n=document.createElement('div');n.className='an-note';n.setAttribute('role','status');const t=document.createElement('span');t.textContent=msg[0];const b=document.createElement('button');b.type='button';b.textContent='Got it';b.onclick=()=>n.remove();n.append(t,b);document.body.append(n)}
 metaPut('sinceBackup',St.meta.sinceBackup)}catch(e){}setTimeout(()=>{nud=0},4000)}
/* ---------- public API ---------- */
function dump(mark){const docs={};for(const k in St.docs){const d=St.docs[k];if(d.objs.length)docs[k]={rev:d.rev||0,upd:d.upd||0,objs:JSON.parse(JSON.stringify(d.objs.map(o=>{const c=Object.assign({},o);delete c.orphan;delete c.editing;delete c.anim;return c})))}}if(mark){St.meta.sinceBackup=0;metaPut('sinceBackup',0)}return{v:1,docs}}
async function load(payload){const v=validate(payload);if(!v)throw new Error('invalid annotation data');const docs=Object.create(null);for(const k in v.docs)if(v.docs[k].objs.length)docs[k]=v.docs[k];
 if(!St.db){Object.keys(St.docs).forEach(k=>delete St.docs[k]);Object.assign(St.docs,docs);repaintAll();return}
 const prev=dump(),tx=St.db.transaction(['docs','meta'],'readwrite');tx.objectStore('meta').put({k:'prev',v:{at:Date.now(),data:prev}});const os=tx.objectStore('docs');os.clear();Object.values(docs).forEach(d=>os.put(d));await txd(tx);
 Object.keys(St.docs).forEach(k=>delete St.docs[k]);Object.assign(St.docs,docs);St.dirty.clear();St.undo=Object.create(null);St.redo=Object.create(null);for(const k in docs){const h=hostByKey(k);h&&layerOf(h,k)}repaintAll();sync()}
const API={ready,isReady:()=>isReady,dump,load,validate,flush,fromLegacy,state:()=>P,
 _debug:{sel:()=>sel?[...sel.ids]:[],clip:()=>clip?clip.objs.length:0,shapeOf:(L,o)=>shapeOf(L,o,L.host.getBoundingClientRect()),selBB,textLayout:(L,o)=>textLayout(L,o,L.host.getBoundingClientRect()),markRects:(L,o)=>markRects(L,o,L.host.getBoundingClientRect()),docs:()=>St.docs,layer:k=>{const h=hostByKey(k);return h&&layers.get(h)},px:(k,i)=>{const L=API._debug.layer(k);return L&&pxOf(L,St.docs[k].objs[i])},blocks:k=>{const h=hostByKey(k);return blocksOf(h).list.map(b=>b.id)},setOn,P,color:c=>col(c),undoDepth:k=>(St.undo[k]||[]).length,dirty:()=>[...St.dirty],mem:()=>St.mem,legacy:readLegacy}};
window.Annot=API;
window.Ink={ready,dump:()=>dump(),async load(obj){if(obj&&obj.v===1&&obj.docs)return load(obj);
  const map={};if(obj&&typeof obj==='object')for(const id in obj){const o=obj[id];const t=alias()[id]||id;if(/^q\d+$/.test(id)&&(typeof BY==='undefined'||BY[t])&&o&&typeof o==='object')map[id]=o}
  const docs=fromLegacy(map),p={v:1,docs:{}};for(const k in docs)p.docs[k]=docs[k];return load(p)}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()})();
