
/* ===== pathway.js: one animator for small pathway diagrams (JSON: nodes, arrows, labels) =====
   Particles run along arrows (tier 2+; tier 1 a CSS dash flow; tier 0 still), tapping a node opens its note,
   test mode hides the labels and you drag them back. Opened from a "Watch the pathway" button under matching cards.
   Built on demand: nothing is drawn or styled until a pathway is opened. */
(function(){try{
const PW={apoptosis:{t:'Apoptosis: two roads to the same caspases',m:/apoptosis|caspase|programmed cell death/i,w:360,h:520,
 n:[
  {i:'st',x:90,y:42,l:'Cell stress',d:'DNA damage, misfolded proteins or loss of survival signals tip the balance inside the cell.'},
  {i:'bh',x:90,y:122,l:'BH3-only sensors',d:'Sensor proteins (such as BIM, PUMA, NOXA) switch on and neutralise the anti-apoptotic guards.'},
  {i:'bc',x:20,y:200,l:'BCL-2 / BCL-XL',d:'Survival guards on the mitochondrial membrane. Too much of them (as in follicular lymphoma) blocks the intrinsic road.',s:1},
  {i:'bx',x:90,y:200,l:'BAX / BAK',d:'Once freed, these effectors form pores in the outer mitochondrial membrane.'},
  {i:'cy',x:90,y:280,l:'Cytochrome c leaks',d:'Pores let cytochrome c escape from the mitochondria into the cytosol.'},
  {i:'ap',x:90,y:360,l:'Apoptosome → caspase-9',d:'Cytochrome c joins APAF-1 to build the apoptosome, which activates the initiator caspase-9.'},
  {i:'dl',x:270,y:42,l:'Death ligand',d:'A ligand such as FasL or TNF reaches its receptor on the cell surface.'},
  {i:'dr',x:270,y:122,l:'Death receptor + FADD',d:'The receptor clusters and recruits the adaptor FADD through its death domain.'},
  {i:'c8',x:270,y:200,l:'Caspase-8',d:'The initiator caspase of the extrinsic road. FLIP can block it. It can also cut BID to recruit the mitochondria.'},
  {i:'ex',x:180,y:440,l:'Caspases 3 and 7',d:'Executioner caspases cut the cytoskeleton and nuclear proteins and switch on DNA-cutting enzymes.'},
  {i:'ou',x:180,y:500,l:'Shrinks, blebs, eaten',d:'The cell shrinks, chromatin condenses, the cell breaks into bodies that phagocytes clear without inflammation.'}],
 a:[['st','bh'],['bh','bx'],['bc','bx',1],['bx','cy'],['cy','ap'],['ap','ex'],['dl','dr'],['dr','c8'],['c8','ex'],['c8','bh'],['ex','ou']]}};
const NW=124,NH=38,RM=matchMedia('(prefers-reduced-motion: reduce)'),T=()=>window.zzTier?zzTier():2;
let css=false,ov=null,raf=0;
const CSS=`.pw-go{display:inline-flex;align-items:center;gap:6px;margin:10px 0 0;padding:7px 13px;border-radius:99px;border:1px solid var(--line2,#ccc);background:var(--panel);color:var(--lbl);font:600 .82rem var(--body);cursor:pointer}
.pw-ov{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;background:var(--bg);color:var(--text);touch-action:none}
.pw-h{display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 10px) 14px 8px}.pw-h b{flex:1;font:400 1.15rem/1.2 var(--disp)}
.pw-h button{min-height:38px;padding:0 12px;border-radius:11px;border:1px solid var(--line2,#ccc);background:var(--panel);color:var(--text);font:600 .82rem var(--body);cursor:pointer}
.pw-h button[aria-pressed=true]{background:var(--btn);border-color:var(--btn);color:#fff}
.pw-svg{flex:1;min-height:0;width:100%}.pw-svg text{font:600 11px var(--body);fill:var(--text);pointer-events:none}
.pw-n rect{fill:var(--panel);stroke:var(--line2,#bbb);stroke-width:1.2}.pw-n{cursor:pointer}.pw-n.on rect{stroke:var(--burgundy);stroke-width:2}.pw-n.s rect{stroke-dasharray:4 3}
.pw-n.ok rect{stroke:var(--ok,#5A7A54);stroke-width:2}.pw-n.bad rect{stroke:#b6425f;stroke-width:2}
.pw-e{fill:none;stroke:var(--muted);stroke-width:1.6}.pw-e.i{stroke:#b6425f;stroke-dasharray:5 4}
.fx-min .pw-e:not(.i){stroke-dasharray:6 6;animation:pw-flow 1.2s linear infinite}@keyframes pw-flow{to{stroke-dashoffset:-12}}
.pw-p{fill:var(--burgundy)}.pw-d{min-height:64px;margin:0 14px;padding:10px 14px;border-radius:14px;background:var(--panel);border:1px solid var(--line);font:.92rem/1.45 var(--body)}
.pw-tr{display:flex;flex-wrap:wrap;gap:6px;padding:8px 14px calc(env(safe-area-inset-bottom,0px) + 12px)}.pw-tr:empty{display:none}
.pw-c{padding:7px 11px;border-radius:99px;background:var(--accbg);color:var(--lbl);font:600 .8rem var(--body);touch-action:none;cursor:grab;user-select:none}
.pw-c.drag{position:fixed;z-index:61;pointer-events:none;box-shadow:0 8px 20px rgba(0,0,0,.25)}
@media(prefers-reduced-motion:reduce){.pw-e{animation:none!important}}`;
const E=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function path(P,a){const f=P.n.find(n=>n.i===a[0]),t=P.n.find(n=>n.i===a[1]);let x1=f.x,y1=f.y,x2=t.x,y2=t.y;
 if(Math.abs(y2-y1)>=Math.abs(x2-x1)){y1+=(y2>y1?1:-1)*NH/2;y2-=(y2>y1?1:-1)*(NH/2+4)}else{x1+=(x2>x1?1:-1)*NW/2;x2-=(x2>x1?1:-1)*(NW/2+4)}
 const my=(y1+y2)/2;return `M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`}
function open(id){
 const P=PW[id];if(!P)return;if(!css){css=true;const s=document.createElement('style');s.textContent=CSS;document.head.append(s)}close();
 const nd=P.n.map(n=>`<g class="pw-n${n.s?' s':''}" data-i="${n.i}" tabindex="0" role="button" aria-label="${E(n.l)}"><rect x="${n.x-NW/2}" y="${n.y-NH/2}" width="${NW}" height="${NH}" rx="10"/><text x="${n.x}" y="${n.y+4}" text-anchor="middle">${E(n.l)}</text></g>`).join('');
 const ed=P.a.map((a,k)=>`<path class="pw-e${a[2]?' i':''}" id="pw-e${k}" d="${path(P,a)}" marker-end="url(#pw-${a[2]?'i':'a'})"/>`).join('');
 ov=document.createElement('div');ov.className='pw-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-label',P.t);ov.dataset.noSwipe='';
 ov.innerHTML=`<div class="pw-h"><b>${E(P.t)}</b><button type="button" data-a="test" aria-pressed="false">Test me</button><button type="button" data-a="x">Close</button></div>
 <svg class="pw-svg" viewBox="-50 0 ${P.w+20} ${P.h+20}" preserveAspectRatio="xMidYMid meet"><defs><marker id="pw-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker><marker id="pw-i" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M5 0V10" stroke="#b6425f" stroke-width="3"/></marker></defs>${ed}${nd}<g class="pw-ps"></g></svg>
 <p class="pw-d" aria-live="polite">Tap a step to read about it.</p><div class="pw-tr"></div>`;
 document.body.append(ov);const sv=ov.querySelector('svg'),dt=ov.querySelector('.pw-d'),tr=ov.querySelector('.pw-tr');
 const pick=g=>{ov.querySelectorAll('.pw-n.on').forEach(x=>x.classList.remove('on'));g.classList.add('on');const n=P.n.find(x=>x.i===g.dataset.i);dt.textContent=n.l+': '+n.d};
 ov.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&b.dataset.a==='x')close();else if(b&&b.dataset.a==='test')test(P,b,sv,tr,dt);else{const g=e.target.closest('.pw-n');if(g&&!ov.classList.contains('t'))pick(g)}});
 ov.addEventListener('keydown',e=>{if(e.key==='Escape')close();else if(e.key==='Enter'&&e.target.closest&&e.target.closest('.pw-n'))pick(e.target.closest('.pw-n'))});
 ov.querySelector('[data-a=x]').focus();
 if(T()>=2&&!RM.matches)flow(sv,P);
}
function flow(sv,P){const es=[...sv.querySelectorAll('.pw-e:not(.i)')],g=sv.querySelector('.pw-ps'),L=es.map(e=>e.getTotalLength()),dots=[];
 es.forEach((e,k)=>{for(let j=0;j<2;j++){const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('r','3');c.setAttribute('class','pw-p');g.append(c);dots.push({c,k,o:j/2})}});
 const go=t=>{if(!ov||!sv.isConnected)return;if(!document.hidden)dots.forEach(d=>{const u=(t/2200+d.o)%1,p=es[d.k].getPointAtLength(u*L[d.k]);d.c.setAttribute('cx',p.x.toFixed(1));d.c.setAttribute('cy',p.y.toFixed(1));d.c.setAttribute('opacity',String(Math.sin(u*Math.PI).toFixed(2)))});raf=requestAnimationFrame(go)};
 raf=requestAnimationFrame(go)}
function test(P,b,sv,tr,dt){
 const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(on));ov.classList.toggle('t',on);
 sv.querySelectorAll('.pw-n').forEach(g=>{g.classList.remove('ok','bad','on');g.querySelector('text').style.visibility=on?'hidden':''});
 tr.innerHTML='';if(!on){dt.textContent='Tap a step to read about it.';return}
 dt.textContent='Drag each label onto its step.';
 [...P.n].sort(()=>Math.random()-.5).forEach(n=>{const c=document.createElement('span');c.className='pw-c';c.textContent=n.l;c.dataset.i=n.i;tr.append(c)});
 tr.onpointerdown=e=>{const c=e.target.closest('.pw-c');if(!c)return;e.preventDefault();const g=c.cloneNode(true);g.classList.add('drag');document.body.append(g);
  const mv=ev=>{g.style.left=(ev.clientX-g.offsetWidth/2)+'px';g.style.top=(ev.clientY-g.offsetHeight/2)+'px'};mv(e);
  const up=ev=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);g.remove();
   const hit=document.elementsFromPoint(ev.clientX,ev.clientY).map(x=>x.closest&&x.closest('.pw-n')).find(Boolean);if(!hit)return;
   if(hit.dataset.i===c.dataset.i){hit.classList.add('ok');hit.querySelector('text').style.visibility='';c.remove();if(window.zzFx)zzFx.haptic(10);
    if(!tr.children.length)dt.textContent='All steps placed. Well done.'}
   else{hit.classList.add('bad');setTimeout(()=>hit.classList.remove('bad'),600);if(window.zzFx)zzFx.haptic([20,30,20])}};
  addEventListener('pointermove',mv);addEventListener('pointerup',up)};
}
function close(){cancelAnimationFrame(raf);raf=0;if(ov){ov.remove();ov=null}}
/* a "Watch the pathway" button after the answer of matching cards (never inside the answer) */
function mark(){for(const id in PW){const P=PW[id];document.querySelectorAll('article.card').forEach(c=>{if(c.dataset.pw)return;const h=c.querySelector('header'),a=c.querySelector('.ans');if(!h||!a)return;c.dataset.pw='1';
 if(!P.m.test(h.textContent))return;const b=document.createElement('button');b.type='button';b.className='pw-go';b.dataset.pw=id;b.textContent='Watch the pathway';a.after(b)})}
 if(!css&&document.querySelector('.pw-go')){css=true;const s=document.createElement('style');s.textContent=CSS;document.head.append(s)}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.pw-go');if(b){e.preventDefault();open(b.dataset.pw)}});
addEventListener('hashchange',()=>{close();setTimeout(mark,400)});(window.requestIdleCallback||setTimeout)(mark,{timeout:5000});
window.zzPathway={open,data:PW};
}catch(e){}})();
