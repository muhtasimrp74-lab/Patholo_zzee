
/* ===== report.js: the week as a pathology report (#/report, linked from Menu). Built from S, read-only; prints cleanly. */
(function(){try{
if(typeof mkView!=='function')return;
const M=mkView('report','Lab report','Lab report','Your last seven days, reported like a specimen.'),V=M.closest('.view'),de=document.documentElement;
const E=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const css=document.createElement('style');css.textContent=`.zz-rp{position:relative;max-width:760px;margin:0 auto 40px;padding:28px 26px;background:var(--panel);border:1px solid var(--line2);border-radius:6px;font:400 .95rem/1.6 var(--body);color:var(--text)}
.zz-rp h2{margin:0 0 2px;font:400 1.6rem var(--disp)}.zz-rp .hd{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:4px 18px;margin:14px 0 18px;padding:12px 0;border-block:1px solid var(--line2);font-size:.85rem}
.zz-rp .hd b{display:block;font-weight:600;color:var(--muted);font-size:.74rem}.zz-rp h3{margin:20px 0 6px;font:600 .9rem var(--body);color:var(--lbl)}
.zz-rp table{width:100%;border-collapse:collapse;font-size:.88rem}.zz-rp td,.zz-rp th{padding:6px 4px;border-bottom:1px solid var(--line);text-align:left}.zz-rp td.n{text-align:right;font-variant-numeric:tabular-nums}
.zz-rp ol{margin:0;padding-left:1.3em}.zz-rp .dx{margin-top:18px;padding:12px 14px;border:1px solid var(--line2);font-weight:600}
.zz-rp .st{position:absolute;top:22px;right:22px;width:112px;height:112px;border:3px double #a3384f;border-radius:50%;display:flex;align-items:center;justify-content:center;text-align:center;
 color:#a3384f;font:700 .78rem/1.2 var(--body);transform:rotate(-14deg);opacity:.85}
.zz-rp .pr{margin-top:18px;min-height:40px;padding:0 16px;border-radius:10px;border:1px solid var(--line2);background:var(--soft);color:var(--text);font:600 .85rem var(--body);cursor:pointer}
@media(max-width:560px){.zz-rp .st{position:static;margin:0 0 10px auto;width:92px;height:92px}}
@media print{html.zz-rp-on body>*:not(#v-report):not(#zz-pager){display:none!important}html.zz-rp-on #v-report{display:block!important}html.zz-rp-on #v-report .zz-rp{border:0;padding:0}html.zz-rp-on .zz-rp .pr{display:none}
 html.zz-rp-on .zz-rp{color:#000;background:#fff}html.zz-rp-on .zz-rp .st{color:#a3384f;border-color:#a3384f}}`;document.head.append(css);
function render(){
 const s=(typeof S!=='undefined'&&S)||{},now=Date.now(),wk=now-7*864e5,D=typeof DATA!=='undefined'?DATA:[],N=D.length;
 const mc=s.mcq||{},hist=(mc.hist||[]).filter(h=>h.ts>=wk),qn=hist.reduce((a,h)=>a+(h.n||0),0),qk=hist.reduce((a,h)=>a+(h.ok||0),0);
 const sr=s.sr||{},od=Object.keys(sr).filter(k=>sr[k]&&now>sr[k].d).length,rev=Object.keys(sr).length,L=(s.learned||[]).length,streak=(s.streak&&+s.streak.n)||0;
 const rows=[];if(typeof MCQDATA!=='undefined'&&mc.p){const by={};MCQDATA.q.forEach(q=>{const x=mc.p[q.h];if(!x||!x.n)return;const c=by[q.c]=by[q.c]||[0,0];c[1]++;if(x.r)c[0]++});
  for(const c in by)if(by[c][1]>=5)rows.push([MCQDATA.ch[c][0],by[c][0],by[c][1]])}
 rows.sort((a,b)=>a[1]/a[2]-b[1]/b[2]);
 const F=[];rows.forEach(([n,k,t])=>{const p=k/t;if(p<.5)F.push('Marked deficiency in '+n.toLowerCase()+' ('+Math.round(p*100)+'%); recommend revision.');else if(p<.7)F.push('Mild deficiency in '+n.toLowerCase()+' ('+Math.round(p*100)+'%); monitor.')});
 const ok=rows.filter(r=>r[1]/r[2]>=.85).map(r=>r[0].toLowerCase());if(ok.length)F.push('Within normal limits: '+ok.slice(0,4).join(', ')+'.');
 F.push(od?od+' specimen'+(od>1?'s':'')+' overdue for review and fading; prompt re-staining advised.':'No overdue specimens.');
 F.push(streak?'Activity sustained over '+streak+' consecutive day'+(streak>1?'s':'')+'.':'No recent activity recorded; resumption advised.');
 F.push('Coverage: '+L+' of '+N+' questions marked learned ('+(N?Math.round(L/N*100):0)+'%).');
 const bad=F.filter(f=>/^Marked/.test(f)).length,dx=bad?'Focal knowledge deficits; otherwise progressing. Recommend targeted revision.':qn?'Progressing within expected limits.':'Insufficient specimen for assessment this week.';
 M.innerHTML=`<article class="zz-rp"><div class="st">PATHOLO<br>ZZEE<br>REVIEWED</div><h2>Surgical pathology report</h2><p class="mu">Weekly summary, ${new Date(wk).toLocaleDateString('en-GB',{day:'numeric',month:'short'})} to ${new Date(now).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</p>
 <div class="hd"><span><b>Specimen</b>Pathology revision, 7 days</span><span><b>MCQ sessions</b>${hist.length} (${qn} questions)</span><span><b>MCQ accuracy</b>${qn?Math.round(qk/qn*100)+'%':'not assessed'}</span><span><b>Cards on review</b>${rev}</span></div>
 <h3>Microscopic description</h3>${rows.length?`<table><tr><th>Chapter</th><th class="n">Right</th><th class="n">Tried</th></tr>${rows.map(r=>`<tr><td>${E(r[0])}</td><td class="n">${r[1]}</td><td class="n">${r[2]}</td></tr>`).join('')}</table>`:'<p>No chapter has five or more MCQ answers yet.</p>'}
 <h3>Findings</h3><ol>${F.map(f=>'<li>'+E(f)+'</li>').join('')}</ol><p class="dx">Diagnosis: ${E(dx)}</p><button type="button" class="pr">Print report</button></article>`;
 M.querySelector('.pr').onclick=()=>print();
}
const go=()=>{const on=location.hash==='#/report';de.classList.toggle('zz-rp-on',on);if(!on)return;render();document.querySelectorAll('#bnav a,.nav .links a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#/menu'))};
addEventListener('hashchange',()=>setTimeout(go,0));if(location.hash==='#/report')dispatchEvent(new HashChangeEvent('hashchange'));
}catch(e){}})();
