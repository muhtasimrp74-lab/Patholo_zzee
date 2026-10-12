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
function blocksOf(host){const sig=host.childElementCount+':'+host.textContent.length;let c=BL.get(host);if(c&&c.sig===sig)return c;
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
const KEYRE=/^(q:q\d{1,6}|m:[0-9a-f]{8}|t:ch\d{2})$/,TYPES=['stroke','shape','text','note','sticker','mark'],KINDS=['ball','fnt','pen','hl','line','arrow','rect','ellipse','tri','brace','box','pin','star','ask','tick','cross','bulb','u','s','sq','hi'];
const num=(v,a,b)=>typeof v==='number'&&isFinite(v)&&v>=a&&v<=b;
function cleanObj(o){if(!o||typeof o!=='object'||Array.isArray(o))return null;
 if(typeof o.i!=='string'||!/^[\w.-]{1,16}$/.test(o.i)||!TYPES.includes(o.t)||!KINDS.includes(o.k))return null;
 if(typeof o.c!=='string'||!/^([a-z]{1,3}|#[0-9a-f]{6})$/i.test(o.c)||!num(o.w,.05,400))return null;
 const a=o.a;if(!a||typeof a!=='object'||Array.isArray(a))return null;let an={};
 if(a.b!=null){if(typeof a.b!=='string'||!/^[0-9a-f]{8}(\.\d{1,5})?$/.test(a.b))return null;an.b=a.b}else an.b=null;
 if(a.h!=null){if(a.h!==1)return null;an.h=1}
 const r={i:o.i,t:o.t,k:o.k,c:o.c,w:+o.w,a:an};
 if(o.g!==undefined){if(typeof o.g!=='string'||o.g.length>MAX.g||!/^[A-Za-z0-9+/]*={0,2}$/.test(o.g))return null;r.g=o.g}
 if(o.al!==undefined){if(!num(o.al,.05,1))return null;r.al=+o.al}
 if(o.x!==undefined){if(typeof o.x!=='string'||o.x.length>MAX.txt)return null;r.x=o.x}
 if(o.q!==undefined){if(!o.q||typeof o.q!=='object'||Array.isArray(o.q))return null;const q={};let n=0;for(const k in o.q){if(++n>12||!/^\w{1,8}$/.test(k))return null;const v=o.q[k];if(typeof v==='string'&&v.length<=MAX.txt)q[k]=v;else if(num(v,-1e7,1e7))q[k]=v;else return null}r.q=q}
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
 applySettings(St.meta.set);St.meta.sinceBackup=+(await metaGet('sinceBackup'))||0;buildUi();for(const k in St.docs)if(k[0]==='q'){const h=hostById(k.slice(2));h&&layerOf(h,k)}
 isReady=true;readyRes();document.dispatchEvent(new Event('annot-ready'))}

/* ---------- settings (persisted, validated on read) ---------- */
const P={tool:'pen',shape:'line',pen:'ball',col:'k',hlc:'y',mode:'pf',smooth:.5,press:1,sizes:{ball:2.2,fnt:3.2,pencil:3,hl:14,er:14,shape:2.2},pos:null,mini:false,seenPen:false,hide:false};
const KIND={ball:'ball',fnt:'fnt',pencil:'pen'};
function applySettings(s){if(!s||typeof s!=='object')return;const pick=(k,ok)=>{if(k in s&&ok(s[k]))P[k]=s[k]};
 pick('tool',v=>['pen','hl','hi','shape','er','hand'].includes(v));pick('shape',v=>['line','arrow','rect','ellipse'].includes(v));pick('pen',v=>v in KIND);pick('col',v=>v in PAL||/^#[0-9a-f]{6}$/i.test(v));pick('hlc',v=>v in HLP||/^#[0-9a-f]{6}$/i.test(v));pick('mode',v=>v==='pf'||v==='po');
 pick('smooth',v=>num(v,0,1));pick('press',v=>num(v,0,1));pick('mini',v=>typeof v==='boolean');pick('hide',v=>typeof v==='boolean');pick('seenPen',v=>typeof v==='boolean');
 pick('pos',v=>Array.isArray(v)&&v.length===2&&v.every(n=>num(n,-5000,20000)));
 if(s.sizes&&typeof s.sizes==='object')for(const k in P.sizes)if(num(s.sizes[k],1,60))P.sizes[k]=s.sizes[k]}

/* ---------- layers (one per answer) ---------- */
const layers=new Map();let active=null;
const hostById=id=>{const c=document.getElementById(id);return c&&/^q\d+$/.test(id)?c.querySelector('.ans'):null};
const keyOf=h=>{const c=h.closest('.card');return c&&/^q\d+$/.test(c.id)?'q:'+c.id:null};
const hostOf=t=>{const h=t&&t.closest&&t.closest('.card .ans');return h&&keyOf(h)?h:null};
const ro=new ResizeObserver(es=>es.forEach(e=>{const L=layers.get(e.target);L&&sched(L)}));
function layerOf(host,key,make){let L=layers.get(host);if(L)return L;key=key||keyOf(host);if(!key)return null;
 L={host,key,hl:null,ink:null,wet:null,raf:0};layers.set(host,L);host.classList.add('an-host');ro.observe(host);sched(L);return L}
function cv(L,cls){let c=L[cls];if(!c){c=document.createElement('canvas');c.className='an-c '+cls;c.setAttribute('aria-hidden','true');L.host.append(c);L[cls]=c}return c}
function size(c,w,h){const d=Math.min(2,window.devicePixelRatio||1),k=Math.min(d,Math.sqrt(16e6/(w*h)),4096/Math.max(w,h)),W=Math.max(1,Math.round(w*k)),H=Math.max(1,Math.round(h*k));if(c.width!==W||c.height!==H){c.width=W;c.height=H}const g=c.getContext('2d');g.setTransform(W/w,0,0,H/h,0,0);return g}
const sched=L=>{if(L.raf)return;L.raf=requestAnimationFrame(()=>{L.raf=0;paint(L)})};
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
 if(k==='line'||k==='arrow'){const ang=Math.atan2(dy,dx),st=Math.PI/4,n=Math.round(ang/st)*st;if(Math.abs(ang-n)<.055){B=[A[0]+Math.cos(n)*len,A[1]+Math.sin(n)*len]}}
 else if(Math.abs(Math.abs(dx)-Math.abs(dy))<.05*Math.max(Math.abs(dx),Math.abs(dy))){const m=Math.max(Math.abs(dx),Math.abs(dy));B=[A[0]+Math.sign(dx)*m,A[1]+Math.sign(dy)*m]}
 return B}
function shapePolys(k,A,B){const q=.5,P3=(x,y)=>[x,y,q];
 if(k==='rect')return[[P3(A[0],A[1]),P3(B[0],A[1]),P3(B[0],B[1]),P3(A[0],B[1]),P3(A[0],A[1])]];
 if(k==='ellipse'){const cx=(A[0]+B[0])/2,cy=(A[1]+B[1])/2,rx=Math.abs(B[0]-A[0])/2,ry=Math.abs(B[1]-A[1])/2,o=[];for(let i=0;i<=48;i++){const t=i/48*Math.PI*2;o.push(P3(cx+Math.cos(t)*rx,cy+Math.sin(t)*ry))}return[o]}
 const out=[[P3(A[0],A[1]),P3(B[0],B[1])]];
 if(k==='arrow'){const ang=Math.atan2(B[1]-A[1],B[0]-A[0]),h=clamp(Math.hypot(B[0]-A[0],B[1]-A[1])*.25,9,22),a=.5;out.push([P3(B[0]-Math.cos(ang-a)*h,B[1]-Math.sin(ang-a)*h),P3(B[0],B[1]),P3(B[0]-Math.cos(ang+a)*h,B[1]-Math.sin(ang+a)*h)])}
 return out}
function shapeOf(L,o,hr){const org=origin(L.host,o.a,hr);if(!org)return null;const q=o.q;if(!q)return[];const W=L.host.clientWidth,f=fsNow();
 return shapePolys(o.k,[org.x+q.x1/REF*W,org.y+q.y1/YU*f],[org.x+q.x2/REF*W,org.y+q.y2/YU*f])}
function markRects(L,o,hr){const el=blocksOf(L.host).map.get(o.a.b);if(!el||!o.q)return null;const len=el.textContent.length,a=clamp(o.q.s|0,0,len),b=clamp(o.q.e|0,a,len);if(b<=a)return[];
 const tw=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),r=document.createRange();let pos=0,n,st=false,en=false;
 while((n=tw.nextNode())){const l=n.nodeValue.length;if(!st&&a<pos+l){r.setStart(n,a-pos);st=true}if(st&&b<=pos+l){r.setEnd(n,b-pos);en=true;break}pos+=l}
 if(!st||!en)return[];const out=[];for(const c of r.getClientRects())if(c.width>0)out.push([c.left-hr.left,c.top-hr.top,c.width,c.height]);return out}
function offIn(el,node,off){const r=document.createRange();r.selectNodeContents(el);r.setEnd(node,off);return r.toString().length}
let selT=0;
function takeSelection(){const sel=getSelection();if(!P.on||P.tool!=='hi'||!sel||sel.isCollapsed||!sel.rangeCount)return;const rg=sel.getRangeAt(0),ce=rg.commonAncestorContainer,host=hostOf(ce.nodeType===1?ce:ce.parentElement);if(!host)return;
 const L=layerOf(host);if(!L)return;const list=blocksOf(host).list,objs=[];
 list.forEach(b=>{if(list.some(c=>c!==b&&b.el.contains(c.el)))return;if(!rg.intersectsNode(b.el))return;const len=b.el.textContent.length,
  s=b.el.contains(rg.startContainer)?offIn(b.el,rg.startContainer,rg.startOffset):0,e=b.el.contains(rg.endContainer)?offIn(b.el,rg.endContainer,rg.endOffset):len;
  if(e-s>=1&&e>s&&!(rg.toString().trim()===''))objs.push({i:ID(),t:'mark',k:'hi',c:P.hlc,w:1,a:{b:b.id},q:{s,e}})});
 if(!objs.length)return;let d=docOf(L.key);if(!d)d=St.docs[L.key]={k:L.key,v:2,rev:0,upd:0,objs:[]};if(d.objs.length+objs.length>MAX.objs)return;
 d.objs.push(...objs);active=L.key;pushOp(L.key,{t:'addn',os:objs});touch(L.key);try{sel.removeAllRanges()}catch(x){}sched(L);sync()}
document.addEventListener('pointerup',()=>{if(P.on&&P.tool==='hi')setTimeout(takeSelection,40)});
document.addEventListener('selectionchange',()=>{if(!P.on||P.tool!=='hi')return;clearTimeout(selT);selT=setTimeout(takeSelection,900)});
function commit(L,o){let d=docOf(L.key);if(!d)d=St.docs[L.key]={k:L.key,v:2,rev:0,upd:0,objs:[]};if(d.objs.length>=MAX.objs){alert('This answer has the maximum number of marks. Delete some to add more.');return false}
 d.objs.push(o);pushOp(L.key,{t:'add',o});touch(L.key);sched(L);sync();return true}
function paint(L){const host=L.host,d=docOf(L.key),w=host.clientWidth,h=host.clientHeight;if(!w||!h){return}
 if(d&&d.objs.some(o=>o.a.h))adopt(L,d);
 const has=d&&d.objs.length;if(!has&&!L.ink&&!L.hl)return;const gh=size(cv(L,'hl'),w,h),gi=size(cv(L,'ink'),w,h);gh.clearRect(0,0,w,h);gi.clearRect(0,0,w,h);
 if(!has)return;const hr=host.getBoundingClientRect();
 for(const o of d.objs){if(o.t==='mark'){const rs=markRects(L,o,hr);o.orphan=!rs;if(rs){gh.fillStyle=col(o.c,true);rs.forEach(r=>gh.fillRect(r[0]-1,r[1]+1,r[2]+2,r[3]-2))}continue}
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
 if(t==='er'){const q=live.pts[live.pts.length-1];g.save();g.strokeStyle=col('k');g.globalAlpha=.6;g.lineWidth=1;g.beginPath();g.arc(q.x,q.y,P.sizes.er/2,0,6.3);g.stroke();g.restore();return}
 if(t==='shape'){const a=live.pts[0],b=live.pts[live.pts.length-1],A=[a.rx,a.ry];shapePolys(P.shape,A,snapShape(P.shape,A,[b.rx,b.ry])).forEach(pl=>drawStroke(g,pl,'ball',col(P.col),P.sizes.shape,null,null));return}
 if(live.straight&&pts.length>1)pts=[pts[0],pts[pts.length-1]];
 drawStroke(g,pts,t==='hl'?'hl':KIND[P.pen],col(t==='hl'?P.hlc:P.col,t==='hl'),sizeOf(t),null,null)})}
const sizeOf=t=>t==='hl'?P.sizes.hl:t==='shape'?P.sizes.shape:P.sizes[P.pen];
function rdp(p,e){if(p.length<3)return p;const keep=new Uint8Array(p.length);keep[0]=keep[p.length-1]=1;const st=[[0,p.length-1]];
 while(st.length){const[a,b]=st.pop();let m=0,mi=-1;const A=p[a],B=p[b],dx=B[0]-A[0],dy=B[1]-A[1],l=dx*dx+dy*dy;
  for(let i=a+1;i<b;i++){let t=l?((p[i][0]-A[0])*dx+(p[i][1]-A[1])*dy)/l:0;t=clamp(t,0,1);const d=Math.hypot(p[i][0]-A[0]-t*dx,p[i][1]-A[1]-t*dy);if(d>m){m=d;mi=i}}
  if(m>e&&mi>0){keep[mi]=1;st.push([a,mi],[mi,b])}}return p.filter((_,i)=>keep[i])}
function segd(px,py,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy;let t=l?((px-a[0])*dx+(py-a[1])*dy)/l:0;t=clamp(t,0,1);return Math.hypot(px-a[0]-t*dx,py-a[1]-t*dy)}
function hit(pts,x,y,r){if(pts.length<2)return pts.length&&Math.hypot(pts[0][0]-x,pts[0][1]-y)<=r;for(let i=0;i<pts.length-1;i++)if(segd(x,y,pts[i],pts[i+1])<=r)return true;return false}
function onDown(e){if(!P.on||!e.isPrimary||P.tool==='hand'||P.tool==='hi'||(e.pointerType==='mouse'&&e.button!==0))return;const host=hostOf(e.target);if(!host)return;
 if(e.pointerType==='pen'){lastPen=performance.now();offerPenOnly()}
 if(e.pointerType==='touch'&&(P.mode==='po'||penRecent()))return;
 const L=layerOf(host);if(!L)return;e.preventDefault();try{host.setPointerCapture(e.pointerId)}catch(x){}
 active=L.key;drawing=true;document.body.classList.add('an-drawing');
 live={L,pid:e.pointerId,tool:P.tool,pts:[],gone:[],px:null};addPoint(e,host,L);if(!live.pts.length)return;
 if(live.tool==='er'){const hr=host.getBoundingClientRect();live.px=(docOf(L.key)||{objs:[]}).objs.map(o=>({o,pts:o.t==='stroke'?pxOf(L,o,hr):null,lines:o.t==='shape'?shapeOf(L,o,hr):null,rects:o.t==='mark'?markRects(L,o,hr):null}));erase(e)}
 wetFrame();document.addEventListener('pointermove',onMove,{passive:true});document.addEventListener('pointerup',onUp);document.addEventListener('pointercancel',onUp)}
function erase(){const n=live.pts.length,q=live.pts[n-1],p=n>1?live.pts[n-2]:q,d=docOf(live.L.key);if(!d)return;const r=P.sizes.er/2,steps=Math.max(1,Math.ceil(Math.hypot(q.rx-p.rx,q.ry-p.ry)/Math.max(2,r/2)));let ch=0;
 live.px=live.px.filter(it=>{if(it.rects){let hh=false;for(let k=0;k<=steps&&!hh;k++){const x=p.rx+(q.rx-p.rx)*k/steps,y=p.ry+(q.ry-p.ry)*k/steps;hh=it.rects.some(c=>x>=c[0]-r&&x<=c[0]+c[2]+r&&y>=c[1]-r&&y<=c[1]+c[3]+r)}if(hh){const i=d.objs.indexOf(it.o);if(i>=0){d.objs.splice(i,1);live.gone.push({i,o:it.o});ch=1}return false}return true}const ls=it.lines||(it.pts?[it.pts]:null);if(!ls)return true;let h=false;for(let k=0;k<=steps&&!h;k++){const x=p.rx+(q.rx-p.rx)*k/steps,y=p.ry+(q.ry-p.ry)*k/steps;h=ls.some(pl=>hit(pl,x,y,r+(it.o.w*fsNow())/2))}
  if(h){const i=d.objs.indexOf(it.o);if(i>=0){d.objs.splice(i,1);live.gone.push({i,o:it.o});ch=1}return false}return true});if(ch)sched(live.L)}
function onMove(e){if(!live||e.pointerId!==live.pid)return;const host=live.L.host;const evs=e.getCoalescedEvents?e.getCoalescedEvents():[];(evs.length?evs:[e]).forEach(x=>addPoint(x,host,live.L));
 live.pred=null;try{const pe=e.getPredictedEvents?e.getPredictedEvents():[];if(pe.length&&(live.tool==='pen'||live.tool==='hl')){const hr=host.getBoundingClientRect();live.pred=pe.slice(0,3).map(x=>[x.clientX-hr.left,x.clientY-hr.top,live.pts[live.pts.length-1].p])}}catch(x){}
 if(live.tool==='er')erase();
 if(live.tool==='hl'){clearTimeout(live.hold);live.straight=false;live.hold=setTimeout(()=>{if(live){live.straight=true;wetFrame()}},520)}
 wetFrame()}
function onUp(e){if(!live||(e&&e.pointerId!==live.pid))return;document.removeEventListener('pointermove',onMove);document.removeEventListener('pointerup',onUp);document.removeEventListener('pointercancel',onUp);
 const l=live;live=null;clearTimeout(l.hold);cancelAnimationFrame(l.raf);drawing=false;document.body.classList.remove('an-drawing');const L=l.L,host=L.host;
 const wg=L.wet&&L.wet.getContext('2d');wg&&wg.clearRect(0,0,L.wet.width,L.wet.height);
 if(e&&e.type==='pointercancel'){if(l.gone.length){const d=docOf(L.key);l.gone.slice().reverse().forEach(x=>d.objs.splice(Math.min(x.i,d.objs.length),0,x.o))}sched(L);return}
 if(l.tool==='er'){if(l.gone.length){pushOp(L.key,{t:'del',items:l.gone});touch(L.key)}sched(L);sync();return}
 if(l.tool==='shape'){const a=l.pts[0],b=l.pts[l.pts.length-1],A=[a.rx,a.ry],B=snapShape(P.shape,A,[b.rx,b.ry]);if(Math.hypot(B[0]-A[0],B[1]-A[1])<6){sched(L);return}
  const W=host.clientWidth,f=fsNow(),bl=nearest(host,A[0],A[1]),org=bl?origin(host,{b:bl.id}):{x:0,y:0},e=p=>[Math.round((p[0]-org.x)/W*REF),Math.round((p[1]-org.y)/f*YU)],ea=e(A),eb=e(B);
  commit(L,{i:ID(),t:'shape',k:P.shape,c:P.col,w:+P.sizes.shape/f,a:{b:bl?bl.id:null},q:{x1:ea[0],y1:ea[1],x2:eb[0],y2:eb[1]}});return}
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
 else if(op.t==='del'){if(rev)op.items.slice().reverse().forEach(x=>d.objs.splice(Math.min(x.i,d.objs.length),0,x.o));else op.items.forEach(x=>{const i=d.objs.findIndex(y=>y.i===x.o.i);i>=0&&d.objs.splice(i,1)})}
 touch(k);const h=hostById(k.slice(2)),L=h&&layers.get(h);L&&sched(L)}
function step(fromU){const k=active;if(!k)return;const A=(fromU?St.undo:St.redo)[k],B=(fromU?St.redo:St.undo)[k]||(fromU?St.redo[k]=[]:St.undo[k]=[]);const op=A&&A.pop();if(!op)return;apply(k,op,fromU);B.push(op);sync()}
function clearActive(){const k=active,d=k&&docOf(k);if(!d||!d.objs.length){alert('Write on an answer first, then Clear removes all handwriting from it.');return}
 if(!confirm('Remove all handwriting from the answer you last wrote on? You can undo this.'))return;const items=d.objs.map((o,i)=>({i,o})).reverse();d.objs=[];pushOp(k,{t:'del',items});touch(k);const h=hostById(k.slice(2)),L=h&&layers.get(h);L&&sched(L);sync()}
/* ---------- toolbar ---------- */
const IC={pen:'<path d="M4 20l1-4L16 5a2.1 2.1 0 0 1 3 3L8 19z"/><path d="M14 7l3 3"/>',hl:'<path d="M9 14l7-9 3 3-8 8z"/><path d="M9 14l-3 4 4-1"/><path d="M4 21h7"/>',hi:'<path d="M4 7h16M4 12h10M4 17h16"/><path d="M14 12h6" stroke-width="4" opacity=".45"/>',shape:'<rect x="3.5" y="4" width="9" height="9" rx="1.5"/><circle cx="15.5" cy="15.5" r="5"/>',er:'<path d="M8 20h11M5 14l8-8 6 6-6 6H9z"/><path d="M8 11l6 6"/>',hand:'<path d="M8 12V6a1.5 1.5 0 0 1 3 0v5m0-6a1.5 1.5 0 0 1 3 0v6m0-4a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-1a5 5 0 0 1-4-2l-3-4a1.5 1.5 0 0 1 2.3-1.9L8 15"/>',
 undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',redo:'<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',eyeoff:'<path d="M3 3l18 18M10.6 6.1A9.6 9.6 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.6 6.6A16.6 16.6 0 0 0 2 12s4 7 10 7a9.5 9.5 0 0 0 4-.9"/>',
 grip:'<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',min:'<path d="M6 12h12"/>',done:'<path d="M5 12l5 5L19 7"/>'};
function svg(n){const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('width','24');s.setAttribute('height','24');s.setAttribute('aria-hidden','true');s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');s.setAttribute('stroke-width','1.7');s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round');
 const p=new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">'+IC[n]+'</svg>','image/svg+xml').documentElement;[...p.childNodes].forEach(c=>s.appendChild(document.importNode(c,true)));return s}
let bar=null,pop=null;
function btn(id,label,ic,fn){const b=document.createElement('button');b.type='button';b.dataset.a=id;b.setAttribute('aria-label',label);b.title=label;b.append(svg(ic));b.addEventListener('click',fn);return b}
function buildUi(){
 bar=document.createElement('div');bar.id='an-bar';bar.hidden=true;bar.setAttribute('role','toolbar');bar.setAttribute('aria-label','Annotation tools');
 const grip=btn('grip','Move toolbar (drag, or use arrow keys)','grip',()=>{});grip.classList.add('an-grip');
 const tool=(id,label,ic)=>btn(id,label,ic,()=>{if(P.tool===id&&id!=='hand')togglePop(id==='hi'?'hl':id);else{P.tool=id;closePop();setting('tool',id);sync()}});
 const sw=document.createElement('button');sw.type='button';sw.className='an-sw';sw.dataset.a='col';sw.setAttribute('aria-label','Colour and size');sw.addEventListener('click',()=>togglePop(P.tool==='er'?'er':P.tool==='hi'?'hl':P.tool));
 const sep=()=>{const s=document.createElement('span');s.className='an-sep';s.setAttribute('role','separator');return s};
 const items=[grip,tool('pen','Pen (P)','pen'),tool('hl','Highlighter (H)','hl'),tool('hi','Highlight selected text (T)','hi'),tool('shape','Shapes (S)','shape'),tool('er','Eraser (E)','er'),tool('hand','Scroll and pan (V)','hand'),sw,sep(),
  btn('undo','Undo','undo',()=>step(true)),btn('redo','Redo','redo',()=>step(false)),btn('clear','Clear this answer','trash',clearActive),btn('eye','Hide or show annotations','eye',()=>{P.hide=!P.hide;setting('hide',P.hide);sync()}),
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
 if(id==='shape'){const g=document.createElement('div');g.className='an-seg';[['line','Line'],['arrow','Arrow'],['rect','Box'],['ellipse','Oval']].forEach(([k,n])=>{const b=document.createElement('button');b.type='button';b.textContent=n;b.setAttribute('aria-pressed',P.shape===k);b.onclick=()=>{P.shape=k;setting('shape',k);closePop();sync()};g.append(b)});pop.append(g)}
 if(id!=='er'){const g=document.createElement('div');g.className='an-cols';const pal=id==='hl'?HLP:PAL,cur=id==='hl'?P.hlc:P.col;Object.keys(pal).forEach(k=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',pal[k][3]);b.setAttribute('aria-pressed',cur===k);b.style.setProperty('--c',col(k,id==='hl'));b.onclick=()=>{id==='hl'?P.hlc=k:P.col=k;setting(id==='hl'?'hlc':'col',k);closePop();sync()};g.append(b)});
  const cu=document.createElement('input');cu.type='color';cu.setAttribute('aria-label','Custom colour');cu.value=/^#/.test(cur)?cur:col(cur,id==='hl');cu.oninput=()=>{id==='hl'?P.hlc=cu.value:P.col=cu.value;sync()};cu.onchange=()=>setting(id==='hl'?'hlc':'col',cu.value);g.append(cu);pop.append(g)}
 const key=id==='pen'?P.pen:id,rg=document.createElement('input');rg.type='range';rg.min=id==='hl'?6:id==='er'?6:1;rg.max=id==='hl'?40:id==='er'?60:12;rg.step=.5;rg.value=P.sizes[key];rg.setAttribute('aria-label','Size');
 const pv=document.createElement('canvas');pv.width=160;pv.height=36;const drawPv=()=>{P.sizes[key]=+rg.value;const g=pv.getContext('2d');g.clearRect(0,0,160,36);if(id==='er'){g.strokeStyle=col('k');g.beginPath();g.arc(80,18,Math.min(16,P.sizes.er/2),0,6.3);g.stroke();return}
  const pts=[];for(let i=0;i<=24;i++)pts.push([10+i*6.25,18+Math.sin(i/3.2)*8,.35+.55*Math.sin(i/24*Math.PI)]);drawStroke(g,pts,id==='hl'?'hl':KIND[P.pen],col(id==='hl'?P.hlc:P.col,id==='hl'),+rg.value/fsNow(),id==='hl'?.6:null,fsNow())};
 rg.oninput=drawPv;rg.onchange=()=>setting('sizes',P.sizes);drawPv();pop.append(row('Size',rg),pv);
 if(id!=='er'){const sm=document.createElement('input');sm.type='range';sm.min=0;sm.max=1;sm.step=.05;sm.value=P.smooth;sm.setAttribute('aria-label','Smoothing');sm.oninput=()=>{P.smooth=+sm.value;setting('smooth',P.smooth)};pop.append(row('Smoothing',sm))}
 if(id==='pen'){const pr=document.createElement('input');pr.type='range';pr.min=0;pr.max=1;pr.step=.1;pr.value=P.press;pr.setAttribute('aria-label','Pressure sensitivity');pr.oninput=()=>{P.press=+pr.value;setting('press',P.press)};pop.append(row('Pressure',pr))}
 const md=document.createElement('div');md.className='an-seg';[['pf','Pen + finger'],['po','Pen only']].forEach(([k,n])=>{const b=document.createElement('button');b.type='button';b.textContent=n;b.setAttribute('aria-pressed',P.mode===k);b.onclick=()=>{P.mode=k;setting('mode',k);md.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));sync()};md.append(b)});pop.append(row('Input',md));
 document.body.append(pop);const br=bar.getBoundingClientRect(),pr=pop.getBoundingClientRect();pop.style.left=clamp(br.left+br.width/2-pr.width/2,8,innerWidth-pr.width-8)+'px';pop.style.top=Math.max(8,br.top-pr.height-8)+'px'}
function closePop(){if(pop){pop.remove();pop=null}}
let offered=false;function offerPenOnly(){if(offered||P.seenPen||P.mode==='po')return;offered=true;P.seenPen=true;setting('seenPen',true);
 const n=document.createElement('div');n.className='an-note';n.setAttribute('role','status');const t=document.createElement('span');t.textContent='Stylus detected. Use pen only so your palm and fingers just scroll?';
 const y=document.createElement('button');y.type='button';y.textContent='Pen only';y.onclick=()=>{P.mode='po';setting('mode','po');n.remove();sync()};const x=document.createElement('button');x.type='button';x.textContent='Keep both';x.onclick=()=>n.remove();n.append(t,y,x);document.body.append(n);setTimeout(()=>n.remove(),12000)}
const HLT=()=>P.tool==='hl'||P.tool==='hi';
function sync(){if(!bar)return;const b=document.body,on=!!P.on;b.classList.toggle('an-on',on);b.classList.toggle('an-pf',P.mode==='pf');b.classList.toggle('an-po',P.mode==='po');b.classList.toggle('an-hidden',!!P.hide);
 ['pen','hl','hi','shape','er','hand'].forEach(t=>b.classList.toggle('an-t-'+t,P.tool===t));
 bar.hidden=!on||P.mini;const pill=$('#an-pill');pill.hidden=!on||!P.mini;
 bar.querySelectorAll('[data-a=pen],[data-a=hl],[data-a=hi],[data-a=shape],[data-a=er],[data-a=hand]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.a===P.tool));
 const u=bar.querySelector('[data-a=undo]'),r=bar.querySelector('[data-a=redo]');u.disabled=!(active&&(St.undo[active]||[]).length);r.disabled=!(active&&(St.redo[active]||[]).length);
 const e=bar.querySelector('[data-a=eye]');e.replaceChildren(svg(P.hide?'eyeoff':'eye'));e.setAttribute('aria-pressed',!!P.hide);
 const sw=bar.querySelector('.an-sw');sw.style.setProperty('--c',col(HLT()?P.hlc:P.col,HLT()));sw.hidden=P.tool==='er'||P.tool==='hand'?P.tool==='hand':false;
 pill.querySelector('i').style.background=col(HLT()?P.hlc:P.col,HLT());pill.firstChild.replaceWith(svg(P.tool==='er'?'er':P.tool==='hl'?'hl':P.tool==='shape'?'shape':P.tool==='hi'?'hi':P.tool==='hand'?'hand':'pen'));
 const tb=$('#tools [data-t=ink]');tb&&tb.setAttribute('aria-pressed',on);
 requestAnimationFrame(()=>place())}
function setOn(v){P.on=v;if(!v){closePop();if(live)onUp({pointerId:live.pid,type:'pointercancel'})}else{document.querySelectorAll('.card .ans').forEach(h=>layerOf(h))}sync()}
/* ---------- finger scroll vs stylus (touch-action strategy lives in annot.css; this closes the gap for styluses that scroll) ---------- */
document.addEventListener('touchstart',e=>{if(!P.on||P.tool==='hand'||P.tool==='hi'||!hostOf(e.target))return;for(const t of e.changedTouches)if(t.touchType==='stylus'&&e.cancelable){e.preventDefault();return}},{passive:false});
document.addEventListener('pointerdown',onDown,{passive:false,capture:true});
document.addEventListener('pointerover',e=>{/* a hovering pen means this contact is a stylus: stop it scrolling on browsers that only expose pointerType, not touchType */if(P.on&&e.pointerType==='pen'&&hostOf(e.target))document.body.classList.add('an-pen-near')},true);
document.addEventListener('pointerout',e=>{if(e.pointerType==='pen')document.body.classList.remove('an-pen-near')},true);
document.addEventListener('keydown',e=>{if(!P.on||e.target.closest&&e.target.closest('input,textarea,select,[contenteditable]'))return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();step(!e.shiftKey);return}
 if(e.ctrlKey||e.metaKey||e.altKey)return;const m={p:'pen',h:'hl',t:'hi',s:'shape',e:'er',v:'hand'}[e.key.toLowerCase()];if(m){P.tool=m;setting('tool',m);closePop();sync()}
 else if(e.key==='['||e.key===']'){const k=P.tool==='hl'?'hl':P.tool==='er'?'er':P.pen;P.sizes[k]=clamp(P.sizes[k]+(e.key===']'?1:-1),1,60);setting('sizes',P.sizes)}else if(e.key==='Escape')closePop()});
new MutationObserver(()=>{repaintAll();sync()}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','data-tone']});
matchMedia('(prefers-color-scheme:dark)').addEventListener&&matchMedia('(prefers-color-scheme:dark)').addEventListener('change',()=>repaintAll());
new MutationObserver(()=>repaintAll()).observe(document.documentElement,{attributes:true,attributeFilter:['style','class']});
addEventListener('beforeprint',()=>{printing=true;layers.forEach(L=>paint(L))});addEventListener('afterprint',()=>{printing=false;repaintAll()});
const flushNow=()=>{flush()};document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushNow()});addEventListener('pagehide',flushNow);
/* ---------- gentle nudges: install on iOS, back up after lots of new work ---------- */
let nud=0;async function nudges(){if(nud||!St.db)return;nud=1;try{const ios=/iP(ad|hone|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),sa=navigator.standalone||matchMedia('(display-mode:standalone)').matches;
 St.meta.sinceBackup=(St.meta.sinceBackup||0)+1;let msg=null;
 if(ios&&!sa&&!(await metaGet('nudged')))msg=['Safari can erase site data if you do not visit for about a week. Add this site to your Home Screen, and use Menu > Export backup now to keep a copy of your handwriting.','nudged'];
 else if(St.meta.sinceBackup>=150&&!(await metaGet('remind-'+Math.floor(St.meta.sinceBackup/150))))msg=['You have added a lot of handwriting since your last backup. Menu > Export backup now keeps a safe copy.','remind-'+Math.floor(St.meta.sinceBackup/150)];
 if(msg){await metaPut(msg[1],1);const n=document.createElement('div');n.className='an-note';n.setAttribute('role','status');const t=document.createElement('span');t.textContent=msg[0];const b=document.createElement('button');b.type='button';b.textContent='Got it';b.onclick=()=>n.remove();n.append(t,b);document.body.append(n)}
 metaPut('sinceBackup',St.meta.sinceBackup)}catch(e){}setTimeout(()=>{nud=0},4000)}
/* ---------- public API ---------- */
function dump(mark){const docs={};for(const k in St.docs){const d=St.docs[k];if(d.objs.length)docs[k]={rev:d.rev||0,upd:d.upd||0,objs:JSON.parse(JSON.stringify(d.objs.map(o=>{const c=Object.assign({},o);delete c.orphan;return c})))}}if(mark){St.meta.sinceBackup=0;metaPut('sinceBackup',0)}return{v:1,docs}}
async function load(payload){const v=validate(payload);if(!v)throw new Error('invalid annotation data');const docs=Object.create(null);for(const k in v.docs)if(v.docs[k].objs.length)docs[k]=v.docs[k];
 if(!St.db){Object.keys(St.docs).forEach(k=>delete St.docs[k]);Object.assign(St.docs,docs);repaintAll();return}
 const prev=dump(),tx=St.db.transaction(['docs','meta'],'readwrite');tx.objectStore('meta').put({k:'prev',v:{at:Date.now(),data:prev}});const os=tx.objectStore('docs');os.clear();Object.values(docs).forEach(d=>os.put(d));await txd(tx);
 Object.keys(St.docs).forEach(k=>delete St.docs[k]);Object.assign(St.docs,docs);St.dirty.clear();St.undo=Object.create(null);St.redo=Object.create(null);for(const k in docs)if(k[0]==='q'){const h=hostById(k.slice(2));h&&layerOf(h,k)}repaintAll();sync()}
const API={ready,isReady:()=>isReady,dump,load,validate,flush,fromLegacy,state:()=>P,
 _debug:{markRects:(L,o)=>markRects(L,o,L.host.getBoundingClientRect()),docs:()=>St.docs,layer:k=>{const h=hostById(k.slice(2));return h&&layers.get(h)},px:(k,i)=>{const L=API._debug.layer(k);return L&&pxOf(L,St.docs[k].objs[i])},blocks:k=>{const h=hostById(k.slice(2));return blocksOf(h).list.map(b=>b.id)},setOn,P,color:c=>col(c),undoDepth:k=>(St.undo[k]||[]).length,dirty:()=>[...St.dirty],mem:()=>St.mem,legacy:readLegacy}};
window.Annot=API;
window.Ink={ready,dump:()=>dump(),async load(obj){if(obj&&obj.v===1&&obj.docs)return load(obj);
  const map={};if(obj&&typeof obj==='object')for(const id in obj){const o=obj[id];const t=alias()[id]||id;if(/^q\d+$/.test(id)&&(typeof BY==='undefined'||BY[t])&&o&&typeof o==='object')map[id]=o}
  const docs=fromLegacy(map),p={v:1,docs:{}};for(const k in docs)p.docs[k]=docs[k];return load(p)}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()})();
