
/* ===== home page: today's plan, study tracks (viva / written / MCQs / textbook), high-yield, weak spots, chapter progress ===== */
(function(){
const H=document.getElementById('v-home');if(!H)return;
const NOW=()=>Date.now();
const CH=QMETA.chapters,TR=QMETA.tree,TYW=QMETA.type||{},EX=QMETA.exam||{};
const cidx={};CH.forEach((c,i)=>cidx[c[0]]=i);
const ORDER=DATA.filter(d=>TR[d[3]]).slice().sort((a,b)=>cidx[TR[a[3]][0]]-cidx[TR[b[3]][0]]||(+a[3].slice(1))-(+b[3].slice(1)));
const NUM={};ORDER.forEach((d,i)=>NUM[d[3]]=i+1);
const byCh={};ORDER.forEach(d=>(byCh[TR[d[3]][0]]=byCh[TR[d[3]][0]]||[]).push(d));
const isW=d=>TYW[d[3]]==='W';
const stars=d=>(EX[d[3]]||[0])[0]||0;
const years=d=>(EX[d[3]]||[0,'',[]])[2]||[];
function pageOf(c){const a=byCh[c];if(!a)return null;const n={};a.forEach(d=>n[d[2]]=(n[d[2]]||0)+1);return Object.keys(n).sort((x,y)=>n[y]-n[x])[0]}
const missing=id=>{const e=document.querySelector('#'+id+' .ans');return !!e&&/Answer to be added/.test(e.textContent)};
function esc2(t){return String(t).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
const pct=(a,b)=>b?Math.round(100*a/b):0;
const lnk=d=>'#/'+d[2]+'/'+d[3];
function st(id,L,now){const r=S.sr[id];
 if(missing(id))return 'm';if(r&&r.b===0)return 'f';if(r&&r.d<=now)return 'd';return L.has(id)?'r':'u'}

/* ---- textbook progress (stored by the Textbook tab; chapter list loaded once, cached by the service worker) ---- */
let TBI=null;
const tbJ=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')}catch(e){return {}}};
const tbLast=()=>{try{return localStorage.getItem('tbLast')}catch(e){return null}};
try{fetch('textbook/index.json').then(r=>r.ok?r.json():null).then(j=>{if(j&&j.chapters){TBI=j.chapters;render()}}).catch(()=>{})}catch(e){}

/* ---- MCQ progress (same store as the MCQs tab) ---- */
function mcqStats(){
 const Q=(typeof MCQDATA!=='undefined'&&MCQDATA.q)||[],M=S.mcq||{},P=M.p||{};
 let att=0,n=0,k=0;const tp={};
 Q.forEach(q=>{const x=P[q.h];if(!x||!x.n)return;att++;n+=x.n;k+=x.k;const key=q.c+'.'+q.t,o=tp[key]=tp[key]||{c:q.c,t:q.t,n:0,k:0};o.n+=x.n;o.k+=x.k});
 const weak=Object.values(tp).filter(o=>o.n>=3).map(o=>Object.assign(o,{a:Math.round(100*o.k/o.n)})).sort((x,y)=>x.a-y.a||y.n-x.n).slice(0,4);
 const today=new Date().toLocaleDateString('en-CA'),td=M.day&&M.day.d===today?M.day.n:0;
 const sv=M.sess&&M.sess.ids&&M.sess.ids.length&&!M.sess.review?M.sess:null;
 return {tot:Q.length,att,n,k,acc:pct(k,n),weak,td,sv,bm:(M.bm||[]).length,papers:12}
}

const wrap=document.createElement('div');wrap.id='nh';H.append(wrap);
H.classList.add('nh-on');

function bar(p,cls){return '<div class="nh-bar2'+(cls?' '+cls:'')+'"><i style="width:'+p+'%"></i></div>'}

function render(){
 const now=NOW(),L=new Set(S.learned),BM=new Set(S.bm),tot=ORDER.length;
 const read=ORDER.filter(d=>L.has(d[3])).length,pc=pct(read,tot);
 const due=Object.values(S.sr).filter(o=>o.d<=now).length,mist=Object.values(S.sr).filter(o=>o.b===0).length;
 const nxt=ORDER.find(d=>!L.has(d[3]));
 const VQ=ORDER.filter(d=>!isW(d)),WQ=ORDER.filter(isW);
 const vr=VQ.filter(d=>L.has(d[3])).length,wr=WQ.filter(d=>L.has(d[3])).length;
 const nextV=VQ.find(d=>!L.has(d[3])),nextW=WQ.find(d=>!L.has(d[3]));
 const hy=ORDER.filter(d=>!L.has(d[3])&&stars(d)>=3).sort((a,b)=>stars(b)-stars(a)||NUM[a[3]]-NUM[b[3]]);
 const hyAll=ORDER.filter(d=>stars(d)>=3),hyRead=hyAll.filter(d=>L.has(d[3])).length;
 const mq=mcqStats();
 const tbDone=tbJ('tbDone'),tbN=TBI?TBI.length:0,tbR=TBI?TBI.filter(c=>tbDone[c.id]).length:Object.keys(tbDone).length;
 const tbCur=TBI&&TBI.find(c=>c.id===tbLast()),tbNext=TBI&&(tbCur&&!tbDone[tbCur.id]?tbCur:TBI.find(c=>!tbDone[c.id]));
 const sk=S.streak||{n:0,last:''},tdy=dstr(now),sn=sk.last===tdy||sk.last===dstr(now-DAY)?sk.n:0,doneToday=sk.last===tdy;

 /* exam countdown */
 let exam=S.pref&&S.pref.exam,days=null;
 if(exam){const t=new Date(exam+'T00:00:00').getTime();if(!isNaN(t)){const t0=new Date(tdy+'T00:00:00').getTime();days=Math.round((t-t0)/DAY)}}
 const pace=days>0?Math.ceil((tot-read)/days):0;

 /* ---------- hero ---------- */
 let h='<div class="nh-w"><header class="nh-hero"><p class="nh-eb">NMC viva list · Robbins &amp; Cotran 11th edition</p><h1>Pathology<em>Read. Recall. Answer.</em></h1>';
 h+='<div class="nh-chips"><span class="nh-chip'+(doneToday?' on':'')+'"><b>'+sn+'</b> day streak'+(doneToday?' · done today':sn?' · study today to keep it':'')+'</span>';
 h+='<span class="nh-chip"><b>'+tot+'</b> viva &amp; written</span><span class="nh-chip"><b>'+mq.tot+'</b> MCQs</span>';
 h+=(TBI?'<span class="nh-chip"><b>'+tbN+'</b> textbook chapters</span>':'')+'</div></header>';

 /* ---------- start here + overall progress ---------- */
 h+='<section class="nh-top"><div class="nh-start"><p class="nh-k">START HERE</p>';
 if(nxt){const t=TR[nxt[3]];h+='<p class="nh-crumb">Q.'+NUM[nxt[3]]+' · '+(isW(nxt)?'Written':'Viva')+' · '+esc2(CH[cidx[t[0]]][1])+' → '+esc2(t[1])+'</p><h2>'+esc2(nxt[1])+'</h2><div class="nh-b"><a class="nh-go" href="'+lnk(nxt)+'">'+(read?'Continue studying':'Begin studying')+'</a><a href="#/questions">Browse all questions</a><a href="#" id="nhrnd">Random unread</a></div>'}
 else h+='<h2>Every question has been read.</h2><div class="nh-b"><a class="nh-go" href="#/practice">Rapid Recall</a><a href="#/questions">Browse all questions</a></div>';
 h+='</div><div class="nh-prog"><p class="nh-k">OVERALL PROGRESS</p><div class="nh-pc">'+pc+'<small>%</small></div>'+bar(pc)+'<p class="nh-mu">'+read+' / '+tot+' questions read</p>';
 h+='<div class="nh-split"><div><span>Viva</span><b>'+vr+'<small> / '+VQ.length+'</small></b>'+bar(pct(vr,VQ.length))+'</div><div><span>Written</span><b>'+wr+'<small> / '+WQ.length+'</small></b>'+bar(pct(wr,WQ.length))+'</div></div></div></section>';

 /* ---------- today's plan + exam countdown ---------- */
 const plan=[];
 if(due>0)plan.push(['d','Review due cards',due+' due · '+Math.min(due,20)+' in the next round','#/practice',due]);
 if(mq.sv)plan.push(['m','Resume your MCQ session','Pick up exactly where you stopped','#/mcqs/run','']);
 if(mist>0)plan.push(['f','Revisit forgotten answers',mist+' in your mistake vault','#/practice',mist]);
 if(nxt)plan.push(['r',days>0&&pace?'Read '+pace+' question'+(pace===1?'':'s')+' today':'Read the next question','Q.'+NUM[nxt[3]]+' · '+esc2(nxt[1].length>70?nxt[1].slice(0,68)+'…':nxt[1]),lnk(nxt),pace||'']);
 plan.push(['m',mq.td?'Keep going with MCQs':'Quick 10 MCQs',mq.td?mq.td+' answered today · '+mq.acc+'% overall':(mq.att?mq.acc+'% accuracy so far':'Short SBA / T-F set to warm up'),'#/mcqs','']);
 if(tbNext)plan.push(['t',(tbCur&&tbCur.id===tbNext.id?'Continue Ch ':'Read Ch ')+tbNext.n,esc2(tbNext.title),'#/textbook/'+tbNext.id,'']);
 h+='<section class="nh-plan"><div class="nh-pl nh-prog"><p class="nh-k">TODAY\'S PLAN</p><ul>'+plan.slice(0,5).map(p=>'<li><a href="'+p[3]+'"><i class="pi '+p[0]+'"></i><span><b>'+esc2(p[1])+'</b><small>'+p[2]+'</small></span><em>'+(p[4]!==''?p[4]:'→')+'</em></a></li>').join('')+'</ul></div>';
 h+='<div class="nh-ex nh-prog"><p class="nh-k">EXAM COUNTDOWN</p>';
 if(days!==null&&days>=0){h+='<div class="nh-pc">'+days+'<small> day'+(days===1?'':'s')+'</small></div><p class="nh-mu">'+(days===0?'Exam day. You have read '+read+' of '+tot+'.':(tot-read)+' questions left'+(pace?' → about <b>'+pace+'/day</b>':''))+'</p>'}
 else if(days!==null){h+='<p class="nh-mu">That date has passed. Pick the next exam date.</p>'}
 else h+='<p class="nh-mu">Set your exam date and the home page works out how many questions to read each day.</p>';
 h+='<label class="nh-dt"><span>Exam date</span><input type="date" id="nhex" value="'+(exam||'')+'" min="'+tdy+'"></label>'+(exam?'<button type="button" class="nh-lk" id="nhexc">Clear date</button>':'')+'</div></section>';

 /* ---------- study tracks ---------- */
 h+='<section><h3 class="nh-h nh-h0">Study tracks</h3><div class="nh-tr">';
 h+='<a class="nh-t4 nh-prog" href="'+(nextV?lnk(nextV):'#/questions')+'"><span class="nh-tk">Viva questions</span><b>'+vr+'<small> / '+VQ.length+'</small></b>'+bar(pct(vr,VQ.length))+'<span class="nh-ts">'+(VQ.length-vr)+' unread · A- and B-cards plus systemic</span><em>'+(vr?'Continue':'Start')+' →</em></a>';
 h+='<a class="nh-t4 nh-prog" href="'+(nextW?lnk(nextW):'#/questions')+'"><span class="nh-tk">Written questions</span><b>'+wr+'<small> / '+WQ.length+'</small></b>'+bar(pct(wr,WQ.length))+'<span class="nh-ts">'+(WQ.length-wr)+' unread · long-answer format</span><em>'+(wr?'Continue':'Start')+' →</em></a>';
 h+='<a class="nh-t4 nh-prog" href="#/mcqs"><span class="nh-tk">MCQs</span><b>'+mq.att+'<small> / '+mq.tot+'</small></b>'+bar(pct(mq.att,mq.tot))+'<span class="nh-ts">'+(mq.n?mq.acc+'% correct · '+mq.n+' answers':'12 past papers · mock exams · quick sets')+'</span><em>'+(mq.sv?'Resume':mq.att?'Practise':'Start')+' →</em></a>';
 h+='<a class="nh-t4 nh-prog" href="#/textbook'+(tbNext?'/'+tbNext.id:'')+'"><span class="nh-tk">Robbins textbook</span><b>'+tbR+'<small> / '+(tbN||29)+'</small></b>'+bar(pct(tbR,tbN||29))+'<span class="nh-ts">'+(tbNext?'Next: Ch '+tbNext.n+' · '+esc2(tbNext.title):'Chapters read, offline-ready')+'</span><em>'+(tbR?'Continue':'Open')+' →</em></a>';
 h+='</div></section>';

 /* ---------- revision row ---------- */
 h+='<section class="nh-row"><a href="#/practice"><b>'+due+'</b><span>Due for review</span></a><a href="#/practice"><b>'+mist+'</b><span>In mistake vault</span></a><a href="#/bookmarks"><b>'+S.bm.length+'</b><span>Revise later</span></a><a class="nh-rr" href="#/practice">Rapid Recall →</a></section>';

 /* ---------- high-yield + weak spots ---------- */
 const chW=CH.map((c,i)=>{const a=byCh[c[0]]||[],r=a.filter(d=>L.has(d[3])).length;return {c,i,n:a.length,r,p:pct(r,a.length)}}).filter(x=>x.n>=5).sort((x,y)=>x.p-y.p||y.n-x.n).slice(0,4);
 h+='<section class="nh-2"><div class="nh-card nh-prog"><h3 class="nh-h2">High-yield, not read yet</h3><p class="nh-mu">Asked often or marked most important. '+hyRead+' of '+hyAll.length+' read.</p>';
 h+=hy.length?'<ul class="nh-hy">'+hy.slice(0,6).map(d=>{const y=years(d);return '<li><a href="'+lnk(d)+'"><span>'+esc2(d[1])+'</span><small><b>★ '+stars(d)+'</b>'+(y.length?' · '+y.slice(-3).reverse().join(', '):'')+' · '+(isW(d)?'Written':'Viva')+'</small></a></li>'}).join('')+'</ul>':'<p class="nh-mu">All high-yield questions are read. Use Rapid Recall to keep them fresh.</p>';
 h+='</div><div class="nh-card nh-prog"><h3 class="nh-h2">Where to focus next</h3>';
 if(mq.weak.length)h+='<p class="nh-k nh-k2">Weakest MCQ topics</p><ul class="nh-wk">'+mq.weak.map(o=>'<li><a href="#/mcqs"><span>'+esc2(MCQDATA.ch[o.c][1][o.t])+'</span><em class="'+(o.a<50?'bad':o.a<70?'warn':'')+'">'+o.a+'%</em></a></li>').join('')+'</ul>';
 h+='<p class="nh-k nh-k2">Least-covered viva chapters</p><ul class="nh-wk">'+chW.map(x=>{const pg=pageOf(x.c[0]);return '<li><a href="'+(pg?'#/'+pg:'#/qa')+'"><span>'+esc2(x.c[1])+'</span><em>'+x.r+'/'+x.n+'</em></a></li>'}).join('')+'</ul></div></section>';

 /* ---------- question map ---------- */
 h+='<section><h3 class="nh-h">Question map</h3><p class="nh-leg"><i class="u"></i>Unread <i class="r"></i>Read <i class="d"></i>Due for review <i class="f"></i>Forgot <i class="m"></i>Missing answer <i class="u fl"></i>Flagged</p><div class="nh-map">';
 CH.forEach(c=>{const a=byCh[c[0]];if(!a)return;h+='<div class="nh-mr"><span>'+esc2(c[2])+'</span><div>'+a.map(d=>'<a class="s '+st(d[3],L,now)+(BM.has(d[3])?' fl':'')+'" href="'+lnk(d)+'" title="Q.'+NUM[d[3]]+' '+(isW(d)?'[Written] ':'')+esc2(d[1])+'"></a>').join('')+'</div></div>'});

 /* ---------- chapter progress ---------- */
 h+='</div></section><section><h3 class="nh-h">Topics and progress</h3><div class="nh-chs">';
 CH.forEach((c,i)=>{const a=byCh[c[0]]||[],pg=pageOf(c[0]),r=a.filter(d=>L.has(d[3])).length,p=pct(r,a.length);
  h+='<article class="nh-ch" id="nhch'+c[0]+'"><div class="nh-n">'+String(i+1).padStart(2,'0')+'</div><div class="nh-cb"><h4>'+(pg?'<a href="#/'+pg+'">'+esc2(c[1])+'</a>':esc2(c[1]))+'</h4><p class="nh-mu">'+esc2(c[2])+' · '+r+' / '+a.length+' read · '+p+'%</p>'+bar(p)+'<ul>';
  c[3].forEach(sn=>{const q=a.filter(d=>TR[d[3]][1]===sn);if(q.length){const rr=q.filter(d=>L.has(d[3])).length;h+='<li><a href="'+lnk(q[0])+'"><span>'+esc2(sn)+'</span><u></u><em>'+rr+'/'+q.length+'</em></a></li>'}else h+='<li class="no"><span>'+esc2(sn)+'</span><u></u><em>no questions</em></li>'});
  h+='</ul></div></article>'});
 h+='</div></section><section><h3 class="nh-h">Recently studied</h3>';
 const rec=S.recent.map(i=>BY[i]).filter(Boolean);
 h+=rec.length?'<ul class="nh-rec">'+rec.map(d=>'<li><a href="'+lnk(d)+'">'+esc2(d[1])+'</a><span>'+esc2(CH[cidx[(TR[d[3]]||[])[0]]]?CH[cidx[TR[d[3]][0]]][1]:d[4])+'</span></li>').join('')+'</ul>':'<p class="nh-mu">Nothing yet. Questions you open will appear here.</p>';
 h+='</section><footer class="nh-f"><b>Patholo_zzee</b> · Robbins &amp; Cotran Pathologic Basis of Disease, 11th ed. · <a href="#/questions">Questions</a> · <a href="#/qa">Q&amp;A</a> · <a href="#/mcqs">MCQs</a> · <a href="#/textbook">Textbook</a> · <a href="#/notes">Notes</a> · <a href="#/howto">How to read</a></footer></div>';
 wrap.innerHTML=h;
}
wrap.addEventListener('click',e=>{
 if(e.target.closest('#nhrnd')){e.preventDefault();const L=new Set(S.learned),u=ORDER.filter(d=>!L.has(d[3]));if(u.length){const d=u[Math.floor(Math.random()*u.length)];location.hash=lnk(d)}return}
 if(e.target.closest('#nhexc')){S.pref=S.pref||{};delete S.pref.exam;save();render()}
});
wrap.addEventListener('change',e=>{
 if(e.target.id==='nhex'){S.pref=S.pref||{};if(e.target.value)S.pref.exam=e.target.value;else delete S.pref.exam;save();render()}
});
window.nhRender=render;render();
})();

/* ---- put the reading tools (Ink / Theme / A- / A+ / Focus / Print) in the top bar: right next to "Start revising", inside the free space after the logo ---- */
(function(){const T=document.getElementById('tools');if(!T)return;let q=0;
 function place(){q=0;const n=[...document.querySelectorAll('.nav')].find(x=>x.offsetParent!==null);if(!n)return;
  const lg=n.querySelector('.logo'),pl=n.querySelector('.pill');if(!lg||!pl)return;
  const l=lg.getBoundingClientRect(),p=pl.getBoundingClientRect();
  T.style.right=Math.max(4,Math.round(innerWidth-p.left+10))+'px';T.style.maxWidth=Math.max(80,Math.round(p.left-10-l.right-10))+'px'}
 const go=()=>{if(!q)q=requestAnimationFrame(place)};
 addEventListener('resize',go);addEventListener('hashchange',()=>{go();setTimeout(go,120)});addEventListener('load',go);
 new MutationObserver(go).observe(T,{childList:true});
 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(go);go()})();
