/* ============ Handwriting ink layer ============
   Pen, highlighter, eraser and lasso on any answer. Ink sits on a canvas over the answer text and is
   stored per question in IndexedDB (on this device only). It is anchored to the answer box: x as a
   fraction of its width, y in pixels, and re-scaled if the text size or width changes. */
const Ink=(function(){
const DBN='pathviva-ink',ST='ink',PEN=['#e5383b','#3a86ff','#2fbf71','#b388ff'],HL=['#ffd60a','#7ee081','#ff8fab','#4cc9f0'],
PS=[2,3.5,6],HS=[10,16,26];
let db=null,cache={},timers={},tool='pen',pc=0,hc=0,sz=1,sel=null,live=null,cur=null,last=null,undo=[],redo=[],raf=0,on=false,mem=false;
const fsNow=()=>+(S.pref&&S.pref.fs)||1;
function open(){return new Promise((res,rej)=>{if(db)return res(db);if(!window.indexedDB)return rej(0);const r=indexedDB.open(DBN,1);r.onupgradeneeded=()=>r.result.createObjectStore(ST,{keyPath:'id'});r.onsuccess=()=>{db=r.result;res(db)};r.onerror=()=>rej(r.error)})}
const store=m=>open().then(d=>d.transaction(ST,m).objectStore(ST));
const rq=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
async function loadAll(){try{const all=await rq((await store('readonly')).getAll());all.forEach(o=>{cache[o.id]=o})}catch(e){mem=true}}
function persist(id){clearTimeout(timers[id]);timers[id]=setTimeout(async()=>{try{const o=cache[id],st=await store('readwrite');o&&o.strokes.length?st.put(o):st.delete(id)}catch(e){mem=true}},350)}
const ansOf=id=>{const c=document.getElementById(id);return c&&c.querySelector('.ans')};
const kf=(o,w)=>{const f=fsNow();return(f*f/w)/(o.fs*o.fs/o.w)};
function rebase(o,w){const f=fsNow();if(Math.abs(o.w-w)<1&&o.fs===f)return;const k=kf(o,w);o.strokes.forEach(s=>{for(let i=1;i<s.p.length;i+=2)s.p[i]*=k;s.s*=f/o.fs});o.w=w;o.fs=f}
function canvas(ans,make){let c=ans.querySelector(':scope>canvas.ink');if(!c&&make){c=document.createElement('canvas');c.className='ink';c.setAttribute('aria-hidden','true');ans.append(c);ro.observe(ans)}return c}
function line(g,st,o,k,w){const p=st.p,h=st.t==='h';g.lineCap=h?'butt':'round';g.lineJoin='round';g.strokeStyle=st.c;g.fillStyle=st.c;g.globalAlpha=h?.35:1;g.lineWidth=st.s*(fsNow()/o.fs);
g.beginPath();if(p.length<4){g.arc(p[0]*w,p[1]*k,g.lineWidth/2,0,6.3);g.fill();return}
g.moveTo(p[0]*w,p[1]*k);for(let i=2;i<p.length-2;i+=2)g.quadraticCurveTo(p[i]*w,p[i+1]*k,(p[i]+p[i+2])/2*w,(p[i+1]+p[i+3])/2*k);g.lineTo(p[p.length-2]*w,p[p.length-1]*k);g.stroke()}
function bbox(o,idx,w,k){let a=1e9,b=1e9,c=-1e9,d=-1e9;idx.forEach(i=>{const s=o.strokes[i];if(!s)return;for(let j=0;j<s.p.length;j+=2){const x=s.p[j]*w,y=s.p[j+1]*k;a=Math.min(a,x);b=Math.min(b,y);c=Math.max(c,x);d=Math.max(d,y)}});return a>c?null:[a-8,b-8,c+8,d+8]}
function paint(ans){const card=ans.closest('.card');if(!card)return;const id=card.id,o=cache[id],mine=(sel&&sel.id===id)||(live&&live.id===id),c=canvas(ans,!!(o&&o.strokes.length)||mine);if(!c)return;
const w=ans.clientWidth,h=ans.clientHeight;if(!w||!h)return;const d=Math.min(2,window.devicePixelRatio||1),W=Math.round(w*d),H=Math.round(h*d);if(c.width!==W||c.height!==H){c.width=W;c.height=H}
const g=c.getContext('2d');g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,w,h);if(o&&o.strokes.length){const k=kf(o,w),L=o.strokes.filter(s=>s.t==='h').concat(o.strokes.filter(s=>s.t!=='h'));g.save();L.forEach(s=>line(g,s,o,k,w));g.restore()}
if(o&&sel&&sel.id===id){const k=kf(o,w),b=bbox(o,sel.idx,w,k);if(b){g.save();g.setLineDash([6,4]);g.lineWidth=1.5;g.strokeStyle='#3a86ff';g.strokeRect(b[0],b[1],b[2]-b[0],b[3]-b[1]);g.restore()}}
if(live&&live.id===id&&live.mode==='lasso'){g.save();g.setLineDash([5,4]);g.lineWidth=1.5;g.strokeStyle='#3a86ff';g.beginPath();live.pts.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.stroke();g.restore()}
if(live&&live.id===id&&(live.mode==='pen'||live.mode==='hl')){const st=mk(live),f=fsNow();g.save();line(g,{t:st.t,c:st.c,s:st.s,p:live.pts.flatMap(q=>[q[0]/w,q[1]])},{fs:f,w:w},1,w);g.restore()}}
const ro=new ResizeObserver(es=>es.forEach(e=>paint(e.target)));
const sched=ans=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;paint(ans)})};
const mk=l=>({t:l.mode==='hl'?'h':'p',c:l.mode==='hl'?HL[hc]:PEN[pc],s:l.mode==='hl'?HS[sz]:PS[sz]});
function rec(id,w){let o=cache[id];if(!o)o=cache[id]={id,w,fs:fsNow(),strokes:[]};else rebase(o,w);return o}
function push(op){undo.push(op);if(undo.length>100)undo.shift();redo.length=0;sync()}
function touched(id){last=id;persist(id);const a=ansOf(id);a&&paint(a);sync()}
function seg(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;let t=l?((px-ax)*dx+(py-ay)*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(px-ax-t*dx,py-ay-t*dy)}
function hit(s,x,y,w,r){const p=s.p;if(p.length<4)return Math.hypot(p[0]*w-x,p[1]-y)<=r;for(let i=0;i<p.length-2;i+=2)if(seg(x,y,p[i]*w,p[i+1],p[i+2]*w,p[i+3])<=r+s.s/2)return true;return false}
function inside(poly,x,y){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
function down(e){if(!on||tool==='hand'||!e.isPrimary||(e.pointerType==='mouse'&&e.button!==0))return;const ans=e.target.closest&&e.target.closest('.card .ans');if(!ans)return;e.preventDefault();
const id=ans.closest('.card').id,c=canvas(ans,true),w=ans.clientWidth;let o=cache[id];if(o)rebase(o,w);const R=()=>c.getBoundingClientRect(),pt=ev=>{const r=R();return[ev.clientX-r.left,ev.clientY-r.top]};
const p0=pt(e);cur={pid:e.pointerId};live={id,mode:tool,pts:[p0]};
if(tool==='lasso'&&sel&&sel.id===id&&o){const b=bbox(o,sel.idx,w,1);if(b&&p0[0]>=b[0]&&p0[0]<=b[2]&&p0[1]>=b[1]&&p0[1]<=b[3]){live.mode='move';live.tot=[0,0]}}
if(tool==='lasso'&&live.mode==='lasso')sel=null;
if(tool==='er'){live.gone=[]}
const erase=q=>{if(!o)return;const r=10+sz*5;for(let i=o.strokes.length-1;i>=0;i--){const s=o.strokes[i];if(hit(s,q[0],q[1],w,r)){live.gone.push({i,st:s});o.strokes.splice(i,1)}}};
if(tool==='er')erase(p0);sched(ans);
const mv=ev=>{if(ev.pointerId!==cur.pid)return;const q=pt(ev),l=live.pts[live.pts.length-1];
if(live.mode==='move'){const dx=q[0]-l[0],dy=q[1]-l[1];sel.idx.forEach(i=>{const s=o.strokes[i];for(let j=0;j<s.p.length;j+=2){s.p[j]+=dx/w;s.p[j+1]+=dy}});live.tot[0]+=dx;live.tot[1]+=dy;live.pts.push(q);sched(ans);return}
if(Math.hypot(q[0]-l[0],q[1]-l[1])<1.2)return;live.pts.push(q);if(live.mode==='er')erase(q);sched(ans)};
const up=ev=>{if(ev.pointerId!==cur.pid)return;document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',up);
const L=live,m=L.mode;live=null;cur=null;
if(m==='pen'||m==='hl'){o=rec(id,w);const st=Object.assign(mk(L),{p:L.pts.flatMap(q=>[+(q[0]/w).toFixed(4),+q[1].toFixed(1)])});o.strokes.push(st);push({t:'add',id,st})}
else if(m==='er'){if(L.gone.length){L.gone.reverse();push({t:'del',id,items:L.gone})}}
else if(m==='move'){if(Math.abs(L.tot[0])+Math.abs(L.tot[1])>1)push({t:'mv',id,sts:[...sel.idx].map(i=>o.strokes[i]),dx:L.tot[0]/w,dy:L.tot[1]});sel.idx=new Set(sel.idx)}
else if(m==='lasso'){if(o&&L.pts.length>2){const idx=new Set();o.strokes.forEach((s,i)=>{let n=0,t=s.p.length/2;for(let j=0;j<s.p.length;j+=2)if(inside(L.pts,s.p[j]*w,s.p[j+1]))n++;if(n/t>=.5)idx.add(i)});sel=idx.size?{id,idx}:null}}
touched(id)};
document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up)}
function doOp(op,rev){const o=cache[op.id];if(!o)return;const w=o.w;
if(op.t==='add'){if(rev){const i=o.strokes.indexOf(op.st);i>=0&&o.strokes.splice(i,1)}else o.strokes.push(op.st)}
else if(op.t==='del'){if(rev)op.items.slice().sort((a,b)=>a.i-b.i).forEach(x=>o.strokes.splice(Math.min(x.i,o.strokes.length),0,x.st));else op.items.forEach(x=>{const i=o.strokes.indexOf(x.st);i>=0&&o.strokes.splice(i,1)})}
else if(op.t==='mv'){const f=rev?-1:1;op.sts.forEach(s=>{for(let j=0;j<s.p.length;j+=2){s.p[j]+=f*op.dx;s.p[j+1]+=f*op.dy}})}
sel=null;touched(op.id)}
function step(fromU){const A=fromU?undo:redo,B=fromU?redo:undo,op=A.pop();if(!op)return;doOp(op,fromU);B.push(op);sync()}
function delSel(){if(!sel)return;const o=cache[sel.id];if(!o)return;const id=sel.id,items=[...sel.idx].sort((a,b)=>a-b).map(i=>({i,st:o.strokes[i]})).filter(x=>x.st);items.slice().reverse().forEach(x=>o.strokes.splice(x.i,1));sel=null;push({t:'del',id,items});touched(id)}
function clearCard(){const id=last||(typeof cur==='function'?0:0);const o=id&&cache[id];if(!o||!o.strokes.length){alert('Write on an answer first, then Clear removes all ink from it.');return}
if(!confirm('Remove all handwriting from the answer you last wrote on?'))return;const items=o.strokes.map((st,i)=>({i,st}));o.strokes=[];sel=null;push({t:'del',id,items});touched(id)}
/* toolbar */
let bar;function sync(){if(!bar)return;bar.querySelectorAll('[data-i]').forEach(b=>{const i=b.dataset.i;if(['pen','hl','er','lasso','hand'].includes(i))b.setAttribute('aria-pressed',i===tool);if(i==='undo')b.disabled=!undo.length;if(i==='redo')b.disabled=!redo.length;if(i==='del')b.hidden=!sel});
const pal=tool==='hl'?HL:PEN,ci=tool==='hl'?hc:pc,sw=bar.querySelector('.sw');sw.hidden=tool==='er'||tool==='lasso'||tool==='hand';sw.innerHTML=pal.map((c,i)=>`<button type="button" data-c="${i}" aria-label="Colour ${i+1}" aria-pressed="${i===ci}" style="--c:${c}"></button>`).join('');
bar.querySelectorAll('[data-z]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.z===sz));bar.querySelector('.zs').hidden=tool==='hand'||tool==='lasso';
document.body.className=document.body.className.replace(/\bink-\w+/g,'').trim();if(on)document.body.classList.add('inking','ink-'+tool);else document.body.classList.remove('inking')}
function setOn(v){on=v;bar.hidden=!v;const t=document.querySelector('#tools [data-t="ink"]');t&&t.setAttribute('aria-pressed',v);if(!v){sel=null;document.querySelectorAll('.card .ans').forEach(a=>a.querySelector('canvas.ink')&&paint(a))}sync()}
function build(){bar=document.createElement('div');bar.id='ink';bar.hidden=true;bar.setAttribute('role','toolbar');bar.setAttribute('aria-label','Handwriting tools');
bar.innerHTML=`<button data-i="pen">Pen</button><button data-i="hl">Highlight</button><button data-i="er">Eraser</button><button data-i="lasso">Lasso</button><button data-i="hand">Scroll</button><span class="sep"></span><span class="sw"></span><span class="zs"><button data-z="0">S</button><button data-z="1">M</button><button data-z="2">L</button></span><span class="sep"></span><button data-i="undo" aria-label="Undo">Undo</button><button data-i="redo" aria-label="Redo">Redo</button><button data-i="del" hidden>Delete selection</button><button data-i="clear">Clear</button><button data-i="done" class="done">Done</button>`;
document.body.append(bar);
bar.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.c!=null){tool==='hl'?hc=+b.dataset.c:pc=+b.dataset.c;sync();return}if(b.dataset.z!=null){sz=+b.dataset.z;sync();return}const i=b.dataset.i;
if(['pen','hl','er','lasso','hand'].includes(i)){tool=i;if(i!=='lasso')sel=null;document.querySelectorAll('.card .ans canvas.ink').forEach(c=>paint(c.parentNode));sync()}
else if(i==='undo')step(true);else if(i==='redo')step(false);else if(i==='del')delSel();else if(i==='clear')clearCard();else if(i==='done')setOn(false)};
document.querySelector('#tools').insertAdjacentHTML('afterbegin','<button data-t="ink" aria-pressed="false">Ink</button>');
document.querySelector('#tools [data-t="ink"]').addEventListener('click',()=>setOn(!on));
document.addEventListener('pointerdown',down,{passive:false});
addEventListener('keydown',e=>{if(!on||!(e.ctrlKey||e.metaKey)||e.key.toLowerCase()!=='z'||e.target.matches('input,textarea,select'))return;e.preventDefault();step(!e.shiftKey)});
sync()}
async function init(){await loadAll();build();Object.keys(cache).forEach(id=>{const a=ansOf(id);if(a){canvas(a,true);paint(a)}else delete cache[id]})}
function clean(obj){const out={};if(!obj||typeof obj!=='object')return out;for(const id in obj){const o=obj[id];if(!/^q\d+$/.test(id)||!BY[id]||!o||!(o.w>0)||!(o.fs>0)||!Array.isArray(o.strokes))continue;
const ss=o.strokes.filter(s=>s&&(s.t==='p'||s.t==='h')&&/^#[0-9a-f]{6}$/i.test(s.c)&&s.s>=.5&&s.s<=80&&Array.isArray(s.p)&&s.p.length>=2&&s.p.length%2===0&&s.p.length<=40000&&s.p.every(Number.isFinite)).map(s=>({t:s.t,c:s.c,s:+s.s,p:s.p.slice()}));
if(ss.length)out[id]={id,w:+o.w,fs:+o.fs,strokes:ss}}return out}
return{init,dump(){const d={};for(const id in cache)if(cache[id].strokes.length)d[id]={w:cache[id].w,fs:cache[id].fs,strokes:cache[id].strokes};return d},
async load(obj){const c=clean(obj);try{const st=await store('readwrite');st.clear();Object.values(c).forEach(o=>st.put(o));await new Promise(r=>{st.transaction.oncomplete=r;st.transaction.onerror=r})}catch(e){}cache=c}}})();
Ink.init();
