export {};
type Rec=Record<string,any>;

/* ===== home page: today's plan, study tracks (viva / written / MCQs / textbook), high-yield, weak spots, chapter progress ===== */
(function(){
const H=document.getElementById('v-home');if(!H)return;
const NOW=()=>Date.now();
const CH=QMETA.chapters,TR=QMETA.tree,TYW=QMETA.type||{},EX=QMETA.exam||{};
const cidx:Rec={};CH.forEach((c:any,i:any)=>cidx[c[0]]=i);
const ORDER=DATA.filter(d=>TR[d[3]]).slice().sort((a,b)=>cidx[TR[a[3]][0]]-cidx[TR[b[3]][0]]||(+a[3].slice(1))-(+b[3].slice(1)));
const NUM:Rec={};ORDER.forEach((d,i)=>NUM[d[3]]=i+1);
const byCh:Rec={};ORDER.forEach(d=>(byCh[TR[d[3]][0]]=byCh[TR[d[3]][0]]||[]).push(d));
const isW=(d:any)=>TYW[d[3]]==='W',isB=(d:any)=>TYW[d[3]]==='B',kind=(d:any)=>isB(d)?'Written + Viva':isW(d)?'Written':'Viva';
const stars=(d:any)=>(EX[d[3]]||[0])[0]||0;
const years=(d:any)=>(EX[d[3]]||[0,'',[]])[2]||[];
function pageOf(c:any){const a=byCh[c];if(!a)return null;const n:Rec={};a.forEach((d:any)=>n[d[2]]=(n[d[2]]||0)+1);return Object.keys(n).sort((x,y)=>n[y]-n[x])[0]}
let MISS:any=null;const missing=(id:any)=>{if(!MISS){MISS=new Set();document.querySelectorAll('.card').forEach(c=>{const e=c.querySelector('.ans');if(e&&/Answer to be added/.test(e.textContent))MISS.add(c.id)})}return MISS.has(id)};
function esc2(t:any){return String(t).replace(/[&<>"]/g,(m:string)=>(({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'} as Rec)[m]))}
const pct=(a:any,b:any)=>b?Math.round(100*a/b):0;
const lnk=(d:any)=>'#/'+d[2]+'/'+d[3];
function st(id:any,L:any,now:any){const r=S.sr[id];
 if(missing(id))return 'm';if(r&&r.b===0)return 'f';if(r&&r.d<=now)return 'd';return L.has(id)?'r':'u'}

/* ---- textbook progress (stored by the Textbook tab; chapter list loaded once, cached by the service worker) ---- */
let TBI:any=null;
const tbJ=(k:any)=>{try{return JSON.parse(zzStore.getItem(k)||'{}')}catch(e){return {}}};
const tbLast=()=>{try{return zzStore.getItem('tbLast')}catch(e){return null}};
try{fetch('textbook/index.json').then(r=>r.ok?r.json():null).then(j=>{if(j&&j.chapters){TBI=j.chapters;render()}}).catch(()=>{})}catch(e){}

/* ---- MCQ progress (same store as the MCQs tab) ---- */
function mcqStats(){
 const Q=(typeof MCQDATA!=='undefined'&&MCQDATA.q)||[],M=S.mcq||{},P=M.p||{};
 let att=0,n=0,k=0;const tp:Rec={};
 Q.forEach((q:any)=>{const x=P[q.h];if(!x||!x.n)return;att++;n+=x.n;k+=x.k;const key=q.c+'.'+q.t,o=tp[key]=tp[key]||{c:q.c,t:q.t,n:0,k:0};o.n+=x.n;o.k+=x.k});
 const weak=Object.values(tp).filter(o=>o.n>=3).map(o=>Object.assign(o,{a:Math.round(100*o.k/o.n)})).sort((x,y)=>x.a-y.a||y.n-x.n).slice(0,4);
 const today=new Date().toLocaleDateString('en-CA'),td=M.day&&M.day.d===today?M.day.n:0;
 const sv=M.sess&&M.sess.ids&&M.sess.ids.length&&!M.sess.review?M.sess:null;
 return {tot:Q.length,att,n,k,acc:pct(k,n),weak,td,sv,bm:(M.bm||[]).length,papers:12}
}

/* ---- study activity log (one count per day) + heatmap ---- */
window.actLog=function(n:any){try{const t=dstr(Date.now());S.act=S.act&&typeof S.act==='object'?S.act:{};S.act[t]=(S.act[t]||0)+(n||1);save()}catch(e){}};
try{const t0=touch;touch=function(this:any){window.actLog(1);return t0.apply(this,arguments)}}catch(e){}
function actMap(){
 const m=Object.assign({},S.act||{}),d:Rec={};
 try{const P=(S.mcq&&S.mcq.p)||{};Object.keys(P).forEach(h=>{const x=P[h];if(x&&x.ts){const k=dstr(x.ts);d[k]=(d[k]||0)+1}})}catch(e){}
 Object.keys(d).forEach(k=>{m[k]=Math.max(m[k]||0,d[k])});return m}
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function heat(){
 const A=actMap(),tdy=dstr(Date.now()),base=new Date(tdy+'T12:00:00').getTime(),dw=new Date(base).getDay();
 /* the grid starts at the week of 1 Oct 2026 and runs forward (at least 12 weeks wide) */
 const s0=new Date('2026-10-01T12:00:00').getTime(),first=s0-new Date(s0).getDay()*DAY,W=Math.max(12,Math.ceil((base-first)/DAY/7)+1),lv=(n:any)=>!n?0:n<5?1:n<10?2:n<20?3:4;
 let cells='',mon='',tot=0,act=0,wk=0,lastM=-1;const ml:any[]=[];
 for(let w=0;w<W;w++){
  const d0=new Date(first+w*7*DAY);
  if(d0.getMonth()!==lastM&&(w===0||d0.getDate()<=7)){ml.push([w,MON[d0.getMonth()]]);lastM=d0.getMonth()}
  for(let d=0;d<7;d++){const t=first+(w*7+d)*DAY,k=dstr(t);
   if(t>base+DAY/2||t<s0-DAY/2){cells+='<i class="hm x"></i>';continue}
   const n=A[k]||0;tot+=n;if(n)act++;if(w===W-1)wk+=n;
   cells+='<i class="hm l'+lv(n)+(k===tdy?' td':'')+'" title="'+(()=>{const q=new Date(t);return q.getDate()+' '+MON[q.getMonth()]})()+': '+(n?n+' action'+(n===1?'':'s'):'no activity')+'"></i>'}}
 ml.forEach((x,i)=>{if(!ml[i+1]||ml[i+1][0]-x[0]>=3)mon+='<span style="grid-column:'+(x[0]+1)+'">'+x[1]+'</span>'});
 /* longest run of consecutive active days, all time */
 const ks=Object.keys(A).filter(k=>A[k]>0).sort();let best=0,run=0,prev:any=null;
 ks.forEach(k=>{const t=new Date(k+'T12:00:00').getTime();run=prev!==null&&Math.round((t-prev)/DAY)===1?run+1:1;prev=t;if(run>best)best=run});
 return '<section class="nh-hmc nh-prog" style="--w:'+W+'"><p class="nh-k">STUDY ACTIVITY</p><div class="nh-hmw"><div class="nh-hml"><span>Mon</span><span>Wed</span><span>Fri</span></div><div class="nh-hmb"><div class="nh-hmm">'+mon+'</div><div class="nh-hmg" role="img" aria-label="Study activity over the last '+W+' weeks">'+cells+'</div></div></div>'
  +'<div class="nh-hmf"><div class="nh-hms"><span><b>'+act+'</b>active days</span><span><b>'+wk+'</b>this week</span><span><b>'+best+'</b>longest run</span><span><b>'+tot+'</b>actions</span></div><p class="nh-hmk">Less <i class="hm l0"></i><i class="hm l1"></i><i class="hm l2"></i><i class="hm l3"></i><i class="hm l4"></i> More</p></div></section>'}

const wrap=document.createElement('div');wrap.id='nh';H.append(wrap);
H.classList.add('nh-on');

function bar(p:any,cls?:any){return '<div class="nh-bar2'+(cls?' '+cls:'')+'"><i style="width:'+p+'%"></i></div>'}

function render(){
 const now=NOW(),L=new Set(S.learned),BM=new Set(S.bm),tot=ORDER.length;
 const read=ORDER.filter(d=>L.has(d[3])).length,pc=pct(read,tot);
 const due=Object.values<any>(S.sr).filter(o=>o.d<=now).length,mist=Object.values<any>(S.sr).filter(o=>o.b===0).length;
 const nxt=ORDER.find(d=>!L.has(d[3]));
 const VQ=ORDER.filter(d=>!isW(d)),WQ=ORDER.filter(d=>isW(d)||isB(d));
 const vr=VQ.filter(d=>L.has(d[3])).length,wr=WQ.filter(d=>L.has(d[3])).length;
 const nextV=VQ.find(d=>!L.has(d[3])),nextW=WQ.find(d=>!L.has(d[3]));
 const hy=ORDER.filter(d=>!L.has(d[3])&&stars(d)>=3).sort((a,b)=>stars(b)-stars(a)||NUM[a[3]]-NUM[b[3]]);
 const hyAll=ORDER.filter(d=>stars(d)>=3),hyRead=hyAll.filter(d=>L.has(d[3])).length;
 const mq=mcqStats();
 const tbDone=tbJ('tbDone'),tbN=TBI?TBI.length:0,tbR=TBI?TBI.filter((c:any)=>tbDone[c.id]).length:Object.keys(tbDone).length;
 const tbCur=TBI&&TBI.find((c:any)=>c.id===tbLast()),tbNext=TBI&&(tbCur&&!tbDone[tbCur.id]?tbCur:TBI.find((c:any)=>!tbDone[c.id]));
 const sk=S.streak||{n:0,last:''},tdy=dstr(now),sn=sk.last===tdy||sk.last===dstr(now-DAY)?sk.n:0,doneToday=sk.last===tdy;

 /* exam countdown */
 let exam=S.pref&&S.pref.exam,days=null;
 if(exam){const t=new Date(exam+'T00:00:00').getTime();if(!isNaN(t)){const t0=new Date(tdy+'T00:00:00').getTime();days=Math.round((t-t0)/DAY)}}
 const pace=days!>0?Math.ceil((tot-read)/days!):0;

 /* ---------- hero ---------- */
 let h='<section class="nh-banner" aria-labelledby="nh-h1"><div class="nh-bn-pic"><picture><source media="(max-width:640px)" srcset="icons/hero-lab-m.webp" width="600" height="671"><img src="icons/hero-lab.webp" width="1672" height="940" alt="" fetchpriority="high" decoding="async"></picture></div><div class="nh-bn-in"><div class="nh-bn-t"><p class="nh-eb">NMC viva list · Robbins 11th</p><h1 id="nh-h1">Pathology learning for viva and written exams</h1><p class="nh-bn-s">Patholo_zzee brings '+tot+' questions with answers, MCQs and the Robbins textbook together. Read. Recall. Answer.</p><a class="nh-bn-cta" href="#/qa">Explore Pathology</a></div></div></section>';
 h+='<div class="nh-w"><header class="nh-hero nh-hero-s">';
 h+='<div class="nh-chips"><span class="nh-chip'+(doneToday?' on':'')+'"><b>'+sn+'</b> day streak'+(doneToday?' · done today':sn?' · study today to keep it':'')+'</span>';
 h+='<span class="nh-chip"><b>'+tot+'</b> questions</span>';
 h+='</div></header>';

 /* ---------- start here + overall progress ---------- */
 h+='<section class="nh-top"><div class="nh-start"><p class="nh-k">START HERE</p>';
 if(nxt){const t=TR[nxt[3]];h+='<p class="nh-crumb">Q.'+NUM[nxt[3]]+' · '+kind(nxt)+' · '+esc2(CH[cidx[t[0]]][1])+' → '+esc2(t[1])+'</p><h2>'+esc2(nxt[1])+'</h2><div class="nh-b"><a class="nh-go" href="'+lnk(nxt)+'">'+(read?'Continue studying':'Begin studying')+'</a><a href="#/questions">Browse all questions</a><a href="#" id="nhrnd">Random unread</a></div>'}
 else h+='<h2>Every question has been read.</h2><div class="nh-b"><a class="nh-go" href="#/practice">Rapid Recall</a><a href="#/questions">Browse all questions</a></div>';
 h+='</div><div class="nh-prog"><p class="nh-k">OVERALL PROGRESS</p><div class="nh-pc">'+pc+'<small>%</small></div>'+bar(pc)+'<p class="nh-mu">'+read+' / '+tot+' questions read</p>';
 h+='<div class="nh-split"><div><span>Viva</span><b>'+vr+'<small> / '+VQ.length+'</small></b>'+bar(pct(vr,VQ.length))+'</div><div><span>Written</span><b>'+wr+'<small> / '+WQ.length+'</small></b>'+bar(pct(wr,WQ.length))+'</div></div></div></section>';

 /* ---------- today's plan + exam countdown ---------- */
 const plan:any[]=[];
 if(due>0)plan.push(['d','Review due cards',due+' due · '+Math.min(due,20)+' in the next round','#/practice',due]);
 if(mq.sv)plan.push(['m','Resume your MCQ session','Pick up exactly where you stopped','#/mcqs/run','']);
 if(mist>0)plan.push(['f','Revisit forgotten answers',mist+' in your mistake vault','#/practice',mist]);
 if(nxt)plan.push(['r',days!>0&&pace?'Read '+pace+' question'+(pace===1?'':'s')+' today':'Read the next question','Q.'+NUM[nxt[3]]+' · '+esc2(nxt[1].length>70?nxt[1].slice(0,68)+'…':nxt[1]),lnk(nxt),pace||'']);
 plan.push(['m',mq.td?'Keep going with MCQs':'Quick 10 MCQs',mq.td?mq.td+' answered today · '+mq.acc+'% overall':(mq.att?mq.acc+'% accuracy so far':'Short SBA / T-F set to warm up'),'#/mcqs','']);
 if(tbNext)plan.push(['t',(tbCur&&tbCur.id===tbNext.id?'Continue Ch ':'Read Ch ')+tbNext.n,esc2(tbNext.title),'#/textbook/'+tbNext.id,'']);
 h+='<section class="nh-plan"><div class="nh-pl nh-prog"><p class="nh-k">TODAY\'S PLAN</p><ul>'+plan.slice(0,5).map(p=>'<li><a href="'+p[3]+'"><i class="pi '+p[0]+'"></i><span><b>'+esc2(p[1])+'</b><small>'+p[2]+'</small></span><em>'+(p[4]!==''?p[4]:'→')+'</em></a></li>').join('')+'</ul></div>';
 h+='<div class="nh-ex nh-prog"><p class="nh-k">EXAM COUNTDOWN</p>';
 if(days!==null&&days>=0){h+='<div class="nh-pc">'+days+'<small> day'+(days===1?'':'s')+'</small></div><p class="nh-mu">'+(days===0?'Exam day. You have read '+read+' of '+tot+'.':(tot-read)+' questions left'+(pace?' → about <b>'+pace+'/day</b>':''))+'</p>'}
 else if(days!==null){h+='<p class="nh-mu">That date has passed. Pick the next exam date.</p>'}
 else h+='<p class="nh-mu">Set your exam date and the home page works out how many questions to read each day.</p>';
 h+='<label class="nh-dt"><span>Exam date</span><input type="date" id="nhex" value="'+(exam||'')+'" min="'+tdy+'"></label>'+(exam?'<button type="button" class="nh-lk" id="nhexc">Clear date</button>':'')+'</div></section>';

 h+=heat();
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
 const chW=CH.map((c:any,i:any)=>{const a=byCh[c[0]]||[],r=a.filter((d:any)=>L.has(d[3])).length;return {c,i,n:a.length,r,p:pct(r,a.length)}}).filter((x:any)=>x.n>=5).sort((x:any,y:any)=>x.p-y.p||y.n-x.n).slice(0,4);
 h+='<section class="nh-2"><div class="nh-card nh-prog"><h3 class="nh-h2">High-yield, not read yet</h3><p class="nh-mu">Asked often or marked most important. '+hyRead+' of '+hyAll.length+' read.</p>';
 h+=hy.length?'<ul class="nh-hy">'+hy.slice(0,6).map(d=>{const y=years(d);return '<li><a href="'+lnk(d)+'"><span>'+esc2(d[1])+'</span><small><b>★ '+stars(d)+'</b>'+(y.length?' · '+y.slice(-3).reverse().join(', '):'')+' · '+kind(d)+'</small></a></li>'}).join('')+'</ul>':'<p class="nh-mu">All high-yield questions are read. Use Rapid Recall to keep them fresh.</p>';
 h+='</div><div class="nh-card nh-prog"><h3 class="nh-h2">Where to focus next</h3>';
 if(mq.weak.length)h+='<p class="nh-k nh-k2">Weakest MCQ topics</p><ul class="nh-wk">'+mq.weak.map(o=>'<li><a href="#/mcqs"><span>'+esc2(MCQDATA.ch[o.c][1][o.t])+'</span><em class="'+(o.a<50?'bad':o.a<70?'warn':'')+'">'+o.a+'%</em></a></li>').join('')+'</ul>';
 h+='<p class="nh-k nh-k2">Least-covered viva chapters</p><ul class="nh-wk">'+chW.map((x:any)=>{const pg=pageOf(x.c[0]);return '<li><a href="'+(pg?'#/'+pg:'#/qa')+'"><span>'+esc2(x.c[1])+'</span><em>'+x.r+'/'+x.n+'</em></a></li>'}).join('')+'</ul></div></section>';

 h+='<section><h3 class="nh-h">Topics and progress</h3><div class="nh-chs">';
 // one row per topic page, built from the page itself: its title, its section headings and the cards under each,
 // so the numbers here always match what opens (Robbins chapter order; pages without a chapter go last)
 const tv=[...document.querySelectorAll('.view')].filter((v:any)=>v.querySelector('article.card')).map((v:any)=>{
  const cr=(v.querySelector('.crumb')||{textContent:''}).textContent,m=/Ch\s*(\d+)/.exec(cr),secs:any[]=[];let cur:any=null;
  v.querySelectorAll('h3.sub,article.card').forEach((e:any)=>{if(e.tagName==='H3'){cur={t:e.textContent.trim(),q:[]};secs.push(cur)}else{if(!cur){cur={t:'',q:[]};secs.push(cur)}cur.q.push(e.id)}});
  return {id:v.id.slice(2),t:(v.querySelector('h1')||{textContent:v.id}).textContent.trim(),ch:m?'Ch '+m[1]:'Not in Robbins',n:m?Number(m[1]):999,secs,all:secs.flatMap((x:any)=>x.q)}
 }).sort((a:any,b:any)=>a.n-b.n);
 tv.forEach((x:any,i:any)=>{const r=x.all.filter((q:any)=>L.has(q)).length,p=pct(r,x.all.length),named=x.secs.filter((s:any)=>s.t);
  h+='<article class="nh-ch" id="nhch'+x.id+'"><div class="nh-n">'+String(i+1).padStart(2,'0')+'</div><div class="nh-cb"><h4><a href="#/'+x.id+'">'+esc2(x.t)+'</a></h4><p class="nh-mu">'+esc2(x.ch)+' · '+r+' / '+x.all.length+' read · '+p+'%</p>'+bar(p);
  if(named.length)h+='<details class="nh-sx"><summary>'+named.length+(named.length===1?' section':' sections')+'</summary><ul>'+named.map((s:any)=>{const rr=s.q.filter((q:any)=>L.has(q)).length;return '<li><a href="#/'+x.id+'/'+s.q[0]+'"><span>'+esc2(s.t)+'</span><u></u><em>'+rr+'/'+s.q.length+'</em></a></li>'}).join('')+'</ul></details>';
  h+='</div></article>'});
 h+='</div></section><section><h3 class="nh-h">Recently studied</h3>';
 const rec=S.recent.map((i:any)=>BY[i]).filter(Boolean);
 h+=rec.length?'<ul class="nh-rec">'+rec.map((d:any)=>'<li><a href="'+lnk(d)+'">'+esc2(d[1])+'</a><span>'+esc2(CH[cidx[(TR[d[3]]||[])[0]]]?CH[cidx[TR[d[3]][0]]][1]:d[4])+'</span></li>').join('')+'</ul>':'<p class="nh-mu">Nothing yet. Questions you open will appear here.</p>';
 h+='</section><footer class="nh-f"><b>Patholo_zzee</b> · Robbins &amp; Cotran Pathologic Basis of Disease, 11th ed. · <a href="#/questions">Questions</a> · <a href="#/qa">Q&amp;A</a> · <a href="#/mcqs">MCQs</a> · <a href="#/textbook">Textbook</a> · <a href="#/notes">Notes</a> · <a href="#/howto">How to read</a></footer></div>';
 wrap.innerHTML=h;
}
wrap.addEventListener('click',e=>{
 if((e.target as HTMLInputElement).closest('#nhrnd')){e.preventDefault();const L=new Set(S.learned),u=ORDER.filter(d=>!L.has(d[3]));if(u.length){const d=u[Math.floor(Math.random()*u.length)];location.hash=lnk(d)}return}
 if((e.target as HTMLInputElement).closest('#nhexc')){S.pref=S.pref||{};delete S.pref.exam;save();render()}
});
wrap.addEventListener('change',e=>{
 if((e.target as HTMLInputElement).id==='nhex'){S.pref=S.pref||{};if((e.target as HTMLInputElement).value)S.pref.exam=(e.target as HTMLInputElement).value;else delete S.pref.exam;save();render()}
});
window.nhRender=(function(){let q=0;return function(){if(q)return;q=1;requestAnimationFrame(function(){q=0;render()})}})();render();
})();

/* ---- put the reading tools (Ink / Theme / A- / A+ / Focus / Print) in the top bar: right next to "Start revising", inside the free space after the logo ---- */
(function(){const T=document.getElementById('tools');if(!T)return;let q=0;
 function place(){q=0;const n=[...document.querySelectorAll<HTMLElement>('.nav')].find(x=>x.offsetParent!==null);if(!n)return;
  const lg=n.querySelector('.logo'),pl=n.querySelector('.pill');if(!lg||!pl)return;
  const l=lg.getBoundingClientRect(),p=pl.getBoundingClientRect();
  T!.style.right=Math.max(4,Math.round(innerWidth-p.left+10))+'px';T!.style.maxWidth=Math.max(80,Math.round(p.left-10-l.right-10))+'px'}
 const go=()=>{if(!q)q=requestAnimationFrame(place)};
 addEventListener('resize',go);addEventListener('hashchange',()=>{go();setTimeout(go,120)});addEventListener('load',go);
 new MutationObserver(go).observe(T,{childList:true});
 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(go);go()})();

/* Offline diagnostics: run  cacheDiag()  in the browser console to see what is saved for offline use. */
window.cacheDiag=async()=>{try{const out:Rec={};for(const k of (await caches.keys()).filter(k=>k.startsWith('pathviva-'))){const c=await caches.open(k),d=await c.match('diag.json');out[k]={entries:(await c.keys()).length,textbook:d?await d.json():'not run yet'}}return out}catch(e){return{error:String(e)}}};
