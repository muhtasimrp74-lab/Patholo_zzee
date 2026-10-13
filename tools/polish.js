/* polish.js - sepia theme, calm reading mode, type badges on cards, read aloud.
   Runs inside the page after the main script, so it shares S (saved state) and save(). Every feature is wrapped so one failure cannot break the others. */
(function(){
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const root=document.documentElement,pref=()=>{try{S.pref=S.pref||{};return S.pref}catch(e){return {}}},persist=()=>{try{save()}catch(e){}};
const tools=document.getElementById('tools');

/* ---------- 1. Theme: Light > Sepia > Dark ---------- */
function themeNow(){const t=root.dataset.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');return t==='dark'?'dark':root.dataset.tone==='sepia'?'sepia':'light'}
function applyTheme(n){if(n==='dark'){root.dataset.theme='dark';delete root.dataset.tone}else{root.dataset.theme='light';if(n==='sepia')root.dataset.tone='sepia';else delete root.dataset.tone}
 const m=n==='sepia'?'#EFE2C4':null;if(m)$$('meta[name=theme-color]').forEach(x=>{if(!x.dataset.o)x.dataset.o=x.content;x.content=m;x.removeAttribute('media')});
 else $$('meta[name=theme-color][data-o]').forEach(x=>{x.content=x.dataset.o});label()}
function label(){const b=tools&&$('[data-t=theme]',tools);if(b){const n=themeNow();b.textContent=n==='sepia'?'Sepia':n==='dark'?'Dark':'Light';b.title='Theme: Light, Sepia or Dark (tap to change)'}}
try{
 if(tools){
  tools.addEventListener('click',e=>{const b=e.target.closest('button[data-t=theme]');if(!b)return;e.stopPropagation();
   const n={light:'sepia',sepia:'dark',dark:'light'}[themeNow()];applyTheme(n);const p=pref();p.theme=n==='dark'?'dark':'light';if(n==='sepia')p.tone='sepia';else delete p.tone;persist()},true);
  const p=pref();if(p.theme==='light'&&p.tone==='sepia')applyTheme('sepia');else{if(p.tone&&!(p.theme==='light'))delete p.tone;label()}
 }
}catch(e){}

/* ---------- 2. Calm reading mode + tool buttons ---------- */
try{
 if(tools){
  const pr=$('[data-t=print]',tools);
  const calm=document.createElement('button');calm.type='button';calm.dataset.t='calm';calm.textContent='Calm';calm.title='Calmer reading: shorter lines, more space';
  const li=document.createElement('button');li.type='button';li.dataset.t='listen';li.textContent='Listen';li.title='Read the open answer aloud';li.setAttribute('aria-pressed','false');
  calm.setAttribute('aria-pressed',!!pref().calm);
  pr?(tools.insertBefore(calm,pr),tools.insertBefore(li,pr)):(tools.append(calm),tools.append(li));
  document.body.classList.toggle('calm',!!pref().calm);
  tools.addEventListener('click',e=>{const b=e.target.closest('button[data-t=calm]');if(!b)return;e.stopPropagation();
   const on=document.body.classList.toggle('calm');b.setAttribute('aria-pressed',on);pref().calm=on;persist()},true);
  if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined')li.hidden=true;
 }
}catch(e){}

/* ---------- 3. Colour-coded type badge on every card page ---------- */
try{
 const T=(typeof QMETA!=='undefined'&&QMETA.type)||{},N={v:'Viva',w:'Written',b:'Written + Viva'};
 $$('.card').forEach(c=>{const t=T[c.id],k=t==='W'?'w':t==='B'?'b':'v';c.dataset.k=k;const h=$('header',c);if(!h||$('.tg',h))return;
  const s=document.createElement('span');s.className='tg k-'+k;s.textContent=N[k];h.append(s)});
}catch(e){}

/* ---------- 4. Read aloud ---------- */
try{
 if(!('speechSynthesis' in window))throw 0;
 const syn=window.speechSynthesis;let q=[],i=0,gen=0,active=null,paused=false,bar=null;
 const SUB=[[/→|->|⟶/g,', then '],[/↑/g,' increased '],[/↓/g,' decreased '],[/≥/g,' at least '],[/≤/g,' at most '],[/&/g,' and '],[/%/g,' percent'],[/\bvs\.?\b/gi,'versus'],[/\be\.g\./gi,'for example'],[/\bi\.e\./gi,'that is'],[/[★⭐•·▪●◦]/g,' '],[/[()\[\]]/g,', '],[/\s+([,.;:])/g,'$1'],[/,\s*,+/g,','],[/,\s*([.!?;:])/g,'$1'],[/\s+/g,' ']];
 const clean=t=>{SUB.forEach(([a,b])=>{t=t.replace(a,b)});return t.trim()};
 const NOREAD='.acts,.rel,.note,.xm,.act,.tbbar,.tbch-m,.zsk,.ink,.an-c,.an-pop,.an-note,.an-sticky,.an-pin,.an-tx,.an-sheet,.an-cnt,.an-ws,.an-wsb,.an-wsadd,.an-cp,.an-mn,#an-fab,#an-bar,#an-pill,.sh,canvas,svg,button';
 function textOf(el,fromView){const out=[];
  $$('h1,h2,h3,h4,h5,h6,p,li,tr,dt,dd,blockquote,figcaption',el).forEach(b=>{
   if(b.closest(NOREAD))return;
   if(b.matches('p,dt,dd,blockquote')&&b.closest('li,td,th'))return;      /* read once, through its list item / table row */
   if(b.matches('li')&&b.closest('td,th'))return;
   if(fromView&&b.getBoundingClientRect().bottom<110)return;
   let t;
   if(b.matches('tr'))t=$$('th,td',b).map(c=>c.textContent.trim()).filter(Boolean).join(', ');
   else t=[...b.childNodes].filter(n=>!(n.nodeType===1&&(n.matches('ul,ol,table')||n.matches(NOREAD)))).map(n=>n.textContent).join('');
   t=clean(t);if(t.length>1)out.push(/[.!?:;]$/.test(t)?t:t+'.')});
  return out.length?out:(fromView?[]:[clean(el.textContent)].filter(Boolean))}
 function chunk(parts){const r=[];parts.forEach(p=>{let ss;try{ss=p.split(/(?<=[.!?;:])\s+(?=[A-Z0-9])/)}catch(e){ss=[p]}let cur='';
   ss.forEach(s=>{if(s.length>220){if(cur){r.push(cur);cur=''}let c='';s.split(/,\s+/).forEach(w=>{if((c+w).length>190&&c){r.push(c);c=w}else c=c?c+', '+w:w});if(c)r.push(c);return}
    if((cur+' '+s).length>200&&cur){r.push(cur);cur=s}else cur=cur?cur+' '+s:s});if(cur)r.push(cur)});return r}
 function target(){const v=$('.view:not([hidden])');if(!v)return null;
  if(v.id==='v-textbook'){const b=$('#tbbody',v);if(b&&b.textContent.trim().length>40)return {el:b,from:true}}
  const o=$('.card.open',v)||$('.qi.o .qi-a',v);if(o)return {el:$('.ans',o)||o,title:$('h4',o)&&$('h4',o).textContent,mark:o};
  const c=typeof cur==='function'?cur(v):null;if(c)return {el:$('.ans',c)||c,title:$('h4',c)&&$('h4',c).textContent,mark:c};return null}
 const voice=()=>{const vs=syn.getVoices();return vs.find(x=>/^en[-_](GB|IN|AU)/i.test(x.lang)&&x.localService)||vs.find(x=>/^en/i.test(x.lang))||null};
 function ui(on){const b=$('[data-t=listen]',tools);if(b){b.setAttribute('aria-pressed',on);b.textContent=on?'Stop':'Listen'}
  if(!bar){bar=document.createElement('div');bar.id='zz-listen';bar.hidden=true;bar.setAttribute('role','group');bar.setAttribute('aria-label','Read aloud');
   bar.innerHTML='<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span><span>Reading aloud</span><button type="button" data-l="pp">Pause</button><select aria-label="Speed"><option value="0.85">0.85x</option><option value="1">1x</option><option value="1.15">1.15x</option><option value="1.3">1.3x</option><option value="1.5">1.5x</option></select><button type="button" data-l="st">Stop</button>';
   document.body.append(bar);const sel=$('select',bar);sel.value=String(pref().rate||1);if(sel.value!==String(pref().rate||1))sel.value='1';
   sel.onchange=()=>{pref().rate=+sel.value;persist();if(active&&!paused){const k=i;speakFrom(k)}};
   bar.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.l==='st')stop();else if(b.dataset.l==='pp'){if(paused){paused=false;syn.resume();b.textContent='Pause';bar.classList.remove('paused')}else{paused=true;syn.pause();b.textContent='Resume';bar.classList.add('paused')}}}}
  bar.hidden=!on}
 function stop(){gen++;q=[];active&&active.mark&&active.mark.classList.remove('zz-reading');active=null;paused=false;try{syn.cancel()}catch(e){}ui(false);if(bar){const p=$('[data-l=pp]',bar);p&&(p.textContent='Pause');bar.classList.remove('paused')}}
 function speakFrom(k){const g=++gen;try{syn.cancel()}catch(e){}i=k;setTimeout(()=>{if(g!==gen)return;next(g)},70)}
 function next(g){if(g!==gen)return;if(i>=q.length){stop();return}const u=new SpeechSynthesisUtterance(q[i]),v=voice();if(v){u.voice=v;u.lang=v.lang}else u.lang='en-GB';u.rate=pref().rate||1;
  u.onend=()=>{if(g===gen){i++;next(g)}};u.onerror=e=>{if(g!==gen)return;if(e&&(e.error==='canceled'||e.error==='interrupted'))return;i++;next(g)};syn.speak(u)}
 function start(){const t=target();if(!t){alert('Open an answer first, then tap Listen.');return}
  let parts=textOf(t.el,!!t.from);if(t.title){const h=clean(t.title);parts=[/[.!?]$/.test(h)?h:h+'.'].concat(parts)}
  q=chunk(parts);if(!q.length){alert('There is nothing to read here.');return}
  gen++;active=t;t.mark&&t.mark.classList.add('zz-reading');ui(true);paused=false;speakFrom(0)}
 tools.addEventListener('click',e=>{const b=e.target.closest('button[data-t=listen]');if(!b)return;e.stopPropagation();active?stop():start()},true);
 addEventListener('hashchange',()=>{if(active)stop()});addEventListener('pagehide',()=>{try{syn.cancel()}catch(e){}});
}catch(e){}
})();
