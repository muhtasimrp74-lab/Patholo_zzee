
/* ===== examiner.js (20): a dim viva room at #/examiner (Menu). A timer ring, an abstract examiner, questions spoken aloud
   (speechSynthesis). "Same ..." questions that follow a question chain on as follow-ups. Key points from the answer are
   stained in as you cover them: speech recognition where the browser has it, typing otherwise. Reads S and the page only. */
(function(){try{
const D=typeof DATA!=='undefined'?DATA:[],SEC=90,RM=matchMedia('(prefers-reduced-motion: reduce)');let ov=null,tm=0,rec=null,idx=-1,t0=0;
const css=`.zx{position:fixed;inset:0;z-index:80;display:flex;flex-direction:column;align-items:center;gap:14px;padding:calc(env(safe-area-inset-top,0px) + 16px) 18px calc(env(safe-area-inset-bottom,0px) + 18px);background:#0d0a0d;color:#efe8ee;overflow-y:auto}
.zx-top{display:flex;width:100%;max-width:720px;justify-content:space-between;align-items:center}.zx-top b{font:400 1.2rem var(--disp)}
.zx button{min-height:42px;padding:0 16px;border-radius:12px;border:1px solid #4a3a46;background:#1d161c;color:#efe8ee;font:600 .9rem var(--body);cursor:pointer}.zx button.p{background:#9B2C48;border-color:#9B2C48}
.zx-room{position:relative;width:180px;height:180px}.zx-room svg{position:absolute;inset:0}.zx-q{max-width:720px;margin:0;text-align:center;font:600 1.15rem/1.45 var(--read,var(--body))}
.zx-kp{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;max-width:720px}.zx-kp span{padding:6px 11px;border-radius:99px;border:1px dashed #6a5866;color:#bfaebb;font:600 .82rem var(--body);transition:background .5s,color .5s,border-color .5s}
.zx-kp span.on{background:#D98FA8;border:1px solid #D98FA8;color:#2A1627}.zx textarea{width:100%;max-width:720px;min-height:90px;border-radius:12px;border:1px solid #4a3a46;background:#16111a;color:#efe8ee;padding:10px 12px;font:400 .95rem/1.5 var(--body)}
.zx-row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}.zx-s{color:#bfaebb;font:500 .85rem var(--body);min-height:1.3em;text-align:center;max-width:720px}`;
const ring=f=>`<svg viewBox="0 0 180 180" aria-hidden="true"><circle cx="90" cy="90" r="84" fill="none" stroke="#2c222a" stroke-width="5"/><circle cx="90" cy="90" r="84" fill="none" stroke="#D98FA8" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(528*f).toFixed(1)} 528" transform="rotate(-90 90 90)"/>
 <circle cx="90" cy="70" r="24" fill="#2a2029"/><path d="M42 140c6-30 26-42 48-42s42 12 48 42z" fill="#2a2029"/><rect x="58" y="118" width="64" height="5" rx="2" fill="#3a2c37"/></svg>`;
function kps(d){const c=document.getElementById(d[3]),a=c&&c.querySelector('.ans');if(!a)return[];const s=new Set();a.querySelectorAll('b,strong,.kp,h4').forEach(x=>{const t=x.textContent.replace(/[:.,;]+$/,'').trim();if(t.length>2&&t.length<40)s.add(t)});return[...s].slice(0,8)}
function say(t){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='en-GB';u.rate=.95;speechSynthesis.speak(u)}catch(e){}}
function cover(txt){const low=' '+txt.toLowerCase()+' ';ov.querySelectorAll('.zx-kp span:not(.on)').forEach(s=>{const w=s.textContent.toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>=4);if(w.length&&w.some(x=>low.includes(x))){s.classList.add('on');if(window.zzFx)zzFx.haptic(8)}})}
function pick(){const n=D[idx+1];if(idx>=0&&n&&/^same\b/i.test(n[1]||''))return idx+1;for(let i=0;i<40;i++){const k=Math.floor(Math.random()*D.length);if(D[k]&&!/^same\b/i.test(D[k][1])&&document.getElementById(D[k][3]))return k}return 0}
function ask(){idx=pick();const d=D[idx];if(!d)return;const fol=/^same\b/i.test(d[1]);
 ov.querySelector('.zx-q').textContent=(fol?'Follow-up: ':'')+d[1];ov.querySelector('.zx-kp').innerHTML=kps(d).map(k=>'<span>'+k.replace(/[&<>]/g,'')+'</span>').join('')||'<span>No key points listed for this one</span>';
 const ta=ov.querySelector('textarea');if(ta)ta.value='';ov.querySelector('.zx-s').textContent='';say(d[1]);t0=Date.now();
 clearInterval(tm);tm=setInterval(()=>{const l=Math.max(0,1-(Date.now()-t0)/1000/SEC);ov.querySelector('.zx-room').innerHTML=ring(l);if(!l){clearInterval(tm);ov.querySelector('.zx-s').textContent="Time. The examiner moves on when you are ready."}},RM.matches?1000:250)}
function open(){if(ov)return;const st=document.createElement('style');st.textContent=css;document.head.append(st);
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 ov=document.createElement('div');ov.className='zx';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Examiner mode');ov.dataset.noSwipe='';
 ov.innerHTML=`<div class="zx-top"><b>Viva room</b><button type="button" data-a="x">Leave</button></div><div class="zx-room">${ring(1)}</div><p class="zx-q" aria-live="polite"></p><div class="zx-kp" aria-label="Key points"></div>
 <p class="zx-s" aria-live="polite"></p>${SR?'':'<textarea aria-label="Your answer" placeholder="Type your answer; key points stain in as you cover them"></textarea>'}<div class="zx-row">${SR?'<button type="button" data-a="mic" aria-pressed="false">Answer aloud</button>':''}<button type="button" data-a="rep">Repeat</button><button type="button" class="p" data-a="next">Next question</button></div>`;
 document.body.append(ov);document.body.classList.add('zx-on');
 ov.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.a;if(a==='x')location.hash='#/menu';else if(a==='next'){stopRec();ask()}else if(a==='rep')say(D[idx][1]);else if(a==='mic'){if(rec)stopRec();else startRec(SR,b)}});
 const ta=ov.querySelector('textarea');if(ta)ta.addEventListener('input',()=>cover(ta.value));ask()}
function startRec(SR,b){try{speechSynthesis.cancel()}catch(e){}rec=new SR();rec.lang='en-GB';rec.continuous=true;rec.interimResults=true;
 rec.onresult=e=>{let t='';for(const r of e.results)t+=r[0].transcript+' ';ov.querySelector('.zx-s').textContent=t.slice(-160);cover(t)};rec.onend=()=>{rec=null;b.setAttribute('aria-pressed','false');b.textContent='Answer aloud'};
 rec.onerror=()=>{ov.querySelector('.zx-s').textContent='The microphone is not available here. Tap Next question to move on.'};try{rec.start();b.setAttribute('aria-pressed','true');b.textContent='Stop'}catch(e){rec=null}}
function stopRec(){if(rec){try{rec.stop()}catch(e){}rec=null}}
function close(){if(!ov)return;stopRec();clearInterval(tm);try{speechSynthesis.cancel()}catch(e){}ov.remove();ov=null;document.body.classList.remove('zx-on')}
const go=()=>{if(location.hash==='#/examiner')open();else close()};addEventListener('hashchange',go);go();
}catch(e){}})();
