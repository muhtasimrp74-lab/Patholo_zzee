
/* ===== new home page + Q&A topics page ===== */
(function(){
const H=document.getElementById('v-home');if(!H)return;
const NOW=()=>Date.now();
const CH=QMETA.chapters,TR=QMETA.tree;
const cidx={};CH.forEach((c,i)=>cidx[c[0]]=i);
const ORDER=DATA.filter(d=>TR[d[3]]).slice().sort((a,b)=>cidx[TR[a[3]][0]]-cidx[TR[b[3]][0]]||(+a[3].slice(1))-(+b[3].slice(1)));
const NUM={};ORDER.forEach((d,i)=>NUM[d[3]]=i+1);
const byCh={};ORDER.forEach(d=>(byCh[TR[d[3]][0]]=byCh[TR[d[3]][0]]||[]).push(d));
function pageOf(c){const a=byCh[c];if(!a)return null;const n={};a.forEach(d=>n[d[2]]=(n[d[2]]||0)+1);return Object.keys(n).sort((x,y)=>n[y]-n[x])[0]}
const missing=id=>{const e=document.querySelector('#'+id+' .ans');return !!e&&/Answer to be added/.test(e.textContent)};
function esc2(t){return String(t).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function st(id,L,now){const r=S.sr[id];
 if(missing(id))return 'm';if(r&&r.b===0)return 'f';if(r&&r.d<=now)return 'd';return L.has(id)?'r':'u'}
const wrap=document.createElement('div');wrap.id='nh';H.append(wrap);
H.classList.add('nh-on');
function render(){
  if(document.activeElement&&document.activeElement.id==='nhq'&&document.activeElement.value)return;
 const now=NOW(),L=new Set(S.learned),BM=new Set(S.bm),tot=ORDER.length;
 const read=ORDER.filter(d=>L.has(d[3])).length,pc=tot?Math.round(100*read/tot):0;
 const due=Object.values(S.sr).filter(o=>o.d<=now).length,mist=Object.values(S.sr).filter(o=>o.b===0).length;
 const nxt=ORDER.find(d=>!L.has(d[3]));
 const fs=Math.round(100*((S.pref&&S.pref.fs)||1));
 let h='<div class="nh-bar"><button class="nh-btn" id="nhc" aria-expanded="false">☰ Contents</button><div class="nh-s"><input id="nhq" type="search" placeholder="Search questions and answers" aria-label="Search questions"><ul id="nhr" hidden></ul></div><button class="nh-btn qfb-x" type="button" aria-expanded="false" aria-controls="qf">Filters <i class="qfn-x" hidden></i></button><div class="nh-t"><button data-t="fm" aria-label="Smaller text">A−</button><span>'+fs+'%</span><button data-t="fp" aria-label="Larger text">A+</button><button data-t="theme" aria-label="Dark mode">◐</button></div></div>';
 h+='<div class="nh-toc" id="nhtoc" hidden>'+CH.map(c=>byCh[c[0]]?'<a href="#" data-go="nhch'+c[0]+'"><b>'+esc2(c[2])+'</b> '+esc2(c[1])+'</a>':'').join('')+'</div>';
 h+='<div class="nh-w"><header class="nh-hero"><p class="nh-eb">NMC viva list · Robbins &amp; Cotran 11th edition</p><h1>Pathology<em>Read. Recall. Answer.</em></h1><p class="nh-lede">Every viva and written question arranged by Robbins chapter, sub-chapter and topic. Read an answer, mark it, and the dashboard shows what is left, what is due and what you keep forgetting. Works offline; your progress stays on this device.</p></header>';
 h+='<section class="nh-top"><div class="nh-start"><p class="nh-k">START HERE</p>';
 if(nxt){const t=TR[nxt[3]];h+='<p class="nh-crumb">Q.'+NUM[nxt[3]]+' · '+esc2(CH[cidx[t[0]]][1])+' → '+esc2(t[1])+'</p><h2>'+esc2(nxt[1])+'</h2><div class="nh-b"><a class="nh-go" href="#/'+nxt[2]+'/'+nxt[3]+'">'+(read?'Continue studying':'Begin studying')+'</a><a href="#/questions">Browse all questions</a><a href="#" id="nhrnd">Random unread</a></div>'}
 else h+='<h2>Every question has been read.</h2><div class="nh-b"><a class="nh-go" href="#/practice">Rapid Recall</a><a href="#/questions">Browse all questions</a></div>';
 h+='</div><div class="nh-prog"><p class="nh-k">OVERALL PROGRESS</p><div class="nh-pc">'+pc+'<small>%</small></div><div class="nh-bar2"><i style="width:'+pc+'%"></i></div><p class="nh-mu">'+read+' / '+tot+' questions read</p><div class="nh-g"><div><b>'+tot+'</b>Total questions</div><div><b>'+read+'</b>Completed</div><div><b>'+(tot-read)+'</b>Remaining</div><div><b>'+Object.keys(S.notes).length+'</b>With notes</div></div></div></section>';
 h+='<section class="nh-row"><a href="#/practice"><b>'+due+'</b><span>Due for review</span></a><a href="#/practice"><b>'+mist+'</b><span>In mistake vault</span></a><a href="#/bookmarks"><b>'+S.bm.length+'</b><span>Revise later</span></a><a class="nh-rr" href="#/practice">Rapid Recall →</a></section>';
 h+='<section><h3 class="nh-h">Question map</h3><p class="nh-leg"><i class="u"></i>Unread <i class="r"></i>Read <i class="d"></i>Due for review <i class="f"></i>Forgot <i class="m"></i>Missing answer <i class="u fl"></i>Flagged</p><div class="nh-map">';
 CH.forEach(c=>{const a=byCh[c[0]];if(!a)return;h+='<div class="nh-mr"><span>'+esc2(c[2])+'</span><div>'+a.map(d=>'<a class="s '+st(d[3],L,now)+(BM.has(d[3])?' fl':'')+'" href="#/'+d[2]+'/'+d[3]+'" title="Q.'+NUM[d[3]]+' '+esc2(d[1])+'"></a>').join('')+'</div></div>'});
 h+='</div></section><section><h3 class="nh-h">Topics and progress</h3><div class="nh-chs">';
 CH.forEach((c,i)=>{const a=byCh[c[0]]||[],pg=pageOf(c[0]),r=a.filter(d=>L.has(d[3])).length,p=a.length?Math.round(100*r/a.length):0;
  h+='<article class="nh-ch" id="nhch'+c[0]+'"><div class="nh-n">'+String(i+1).padStart(2,'0')+'</div><div class="nh-cb"><h4>'+(pg?'<a href="#/'+pg+'">'+esc2(c[1])+'</a>':esc2(c[1]))+'</h4><p class="nh-mu">'+esc2(c[2])+' · '+r+' / '+a.length+' read · '+p+'%</p><div class="nh-bar2"><i style="width:'+p+'%"></i></div><ul>';
  c[3].forEach(sn=>{const q=a.filter(d=>TR[d[3]][1]===sn);if(q.length){const rr=q.filter(d=>L.has(d[3])).length;h+='<li><a href="#/'+q[0][2]+'/'+q[0][3]+'"><span>'+esc2(sn)+'</span><u></u><em>'+rr+'/'+q.length+'</em></a></li>'}else h+='<li class="no"><span>'+esc2(sn)+'</span><u></u><em>no questions</em></li>'});
  h+='</ul></div></article>'});
 h+='</div></section><section><h3 class="nh-h">Recently studied</h3>';
 const rec=S.recent.map(i=>BY[i]).filter(Boolean);
 h+=rec.length?'<ul class="nh-rec">'+rec.map(d=>'<li><a href="#/'+d[2]+'/'+d[3]+'">'+esc2(d[1])+'</a><span>'+esc2(CH[cidx[(TR[d[3]]||[])[0]]]?CH[cidx[TR[d[3]][0]]][1]:d[4])+'</span></li>').join('')+'</ul>':'<p class="nh-mu">Nothing yet. Questions you open will appear here.</p>';
 h+='</section><footer class="nh-f"><b>Patholo_zzee</b> · Robbins &amp; Cotran Pathologic Basis of Disease, 11th ed. · <a href="#/questions">Questions</a> · <a href="#/qa">Q&amp;A</a> · <a href="#/notes">Notes</a> · <a href="#/howto">How to read</a></footer></div>';
 const q=document.getElementById('nhq'),keep=q?q.value:'',foc=q&&document.activeElement===q;
 wrap.innerHTML=h;window.qfApply&&window.qfApply();const nq=document.getElementById('nhq');if(keep){nq.value=keep;if(foc)nq.focus()}
}
wrap.addEventListener('click',e=>{
 const g=e.target.closest('[data-go]');if(g){e.preventDefault();const t=document.getElementById(g.dataset.go);document.getElementById('nhtoc').hidden=true;t&&t.scrollIntoView({behavior:'smooth',block:'start'});return}
 if(e.target.closest('#nhc')){const t=document.getElementById('nhtoc');t.hidden=!t.hidden;return}
 if(e.target.closest('#nhrnd')){e.preventDefault();const L=new Set(S.learned),u=ORDER.filter(d=>!L.has(d[3]));if(u.length){const d=u[Math.floor(Math.random()*u.length)];location.hash='#/'+d[2]+'/'+d[3]}return}
 const b=e.target.closest('.nh-t button');if(b){document.querySelector('#tools [data-t='+b.dataset.t+']').click();render()}
});
wrap.addEventListener('input',e=>{if(e.target.id!=='nhq')return;const v=e.target.value.trim().toLowerCase(),r=document.getElementById('nhr');
 if(v.length<2){r.hidden=true;return}
 const m=ORDER.filter(d=>d[1].toLowerCase().includes(v)||d[4].toLowerCase().includes(v)).slice(0,8);
 r.innerHTML=m.length?m.map(d=>'<li><a href="#/'+d[2]+'/'+d[3]+'">'+esc2(d[1])+'<small>'+esc2(d[4])+'</small></a></li>').join(''):'<li class="none">No match</li>';r.hidden=false});
window.nhRender=render;render();
})();
