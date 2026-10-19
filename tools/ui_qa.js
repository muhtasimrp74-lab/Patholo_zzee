
const QAV=mkView('qa','Chapters','Chapters','Pick a chapter to study viva and written questions together, with full answers. For one flat list to drill, use Questions.');
(function(){const H=document.getElementById('v-home'),ch=document.getElementById('pchips');QAV.append(ch);H.querySelectorAll('section.part').forEach(x=>QAV.append(x))})();

(function(){
const TYW=QMETA.type||{},esc3=t=>String(t).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const by={};DATA.forEach(d=>(by[d[2]]=by[d[2]]||[]).push(d));
const kind=d=>TYW[d[3]]==='B'?'b':TYW[d[3]]==='W'?'w':'v';
const hero=document.createElement('section');hero.className='qa-hero';
hero.innerHTML='<div class="qa-top"><div><p class="qa-k">Chapters</p><h2>Every chapter, every question</h2><p class="qa-s">Viva and written questions sit together on each chapter page, in Robbins order, with full answers.</p></div><a class="qa-go" id="qa-next" href="#/">Continue</a></div><div class="qa-stats" id="qa-stats"></div><label class="qa-sr"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input type="search" id="qa-q" placeholder="Search chapters or questions" aria-label="Search chapters or questions" autocomplete="off"></label><div class="qa-res" id="qa-res" hidden></div>';
QAV.insertBefore(hero,QAV.querySelector('#pchips')||QAV.firstChild);
const cards=[...QAV.querySelectorAll('a.topic')];
function upd(){
 const L=new Set(S.learned||[]);let n=0,l=0,v=0,w=0,b=0;
 DATA.forEach(d=>{n++;if(L.has(d[3]))l++;const k=kind(d);k==='b'?b++:k==='w'?w++:v++});
 hero.querySelector('#qa-stats').innerHTML=[[n,'questions'],[cards.length,'chapters'],[Math.round(100*l/Math.max(n,1))+'%','learned'],[v+b,'viva'],[w+b,'written']].map(x=>'<div><b>'+x[0]+'</b><span>'+x[1]+'</span></div>').join('');
 const nx=DATA.find(d=>!L.has(d[3])),go=hero.querySelector('#qa-next');
 if(nx){go.href='#/'+nx[2]+'/'+nx[3];go.textContent=l?'Continue · '+esc3(nx[4]):'Start · '+esc3(nx[4])}else{go.href='#/';go.textContent='All learned'}
 cards.forEach(c=>{const t=c.getAttribute('href').slice(2),a=by[t]||[],r=a.filter(d=>L.has(d[3])).length;let m=c.querySelector('.qa-mini');
  if(!m){m=document.createElement('span');m.className='qa-mini';c.append(m);
   const x={v:0,w:0,b:0};a.forEach(d=>x[kind(d)]++);m.dataset.t=[x.v+x.b?(x.v+x.b)+' viva':'',x.w+x.b?(x.w+x.b)+' written':''].filter(Boolean).join(' · ')}
  m.innerHTML='<i><u style="width:'+Math.round(100*r/Math.max(a.length,1))+'%"></u></i><small>'+m.dataset.t+(m.dataset.t?' · ':'')+r+'/'+a.length+' learned</small>'})}
const inp=hero.querySelector('#qa-q'),res=hero.querySelector('#qa-res');
inp.oninput=()=>{const q=inp.value.trim().toLowerCase();cards.forEach(c=>c.hidden=!!q&&!c.textContent.toLowerCase().includes(q));
 QAV.querySelectorAll('section.part').forEach(s=>s.hidden=!!q&&![...s.querySelectorAll('a.topic')].some(c=>!c.hidden));
 if(q.length<3){res.hidden=true;return}
 const m=DATA.filter(d=>d[1].toLowerCase().includes(q));
 res.hidden=false;res.innerHTML=m.length?'<p>'+m.length+' matching question'+(m.length>1?'s':'')+'</p><ul>'+m.slice(0,8).map(d=>'<li><a href="#/'+d[2]+'/'+d[3]+'"><span>'+esc3(d[1])+'</span><em>'+esc3(d[4])+'</em></a></li>').join('')+'</ul>':'<p>No question matches.</p>'};
upd();addEventListener('hashchange',()=>{if(/^#\/qa/.test(location.hash))upd()});
})();
