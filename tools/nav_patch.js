
/* ---- Menu page: your profile card first, then study, saved, reading, display and data as grouped lists.
   Every switch shows its real state (synced each time the page opens). The Menu tab shows your initials once signed in. ---- */
{const X=mkView('menu','Menu','Menu','Your account, saved work and settings.');
 const de=document.documentElement,bd=document.body,tool=t=>document.querySelector('#tools [data-t="'+t+'"]'),press=t=>{const b=tool(t);if(b)b.click()};
 const I={tut:'<circle cx="12" cy="12" r="8.5"/><path d="M10.2 8.8v6.4l5.3-3.2z"/>',practice:'<rect x="3.5" y="7.5" width="13" height="13" rx="2"/><path d="M7.5 4.5h11a2 2 0 0 1 2 2v11"/>',
  read:'<path d="M12 6.8C10.4 5.4 7.9 4.8 3.5 4.8v13.4c4.4 0 6.9.6 8.5 2 1.6-1.4 4.1-2 8.5-2V4.8c-4.4 0-6.9.6-8.5 2Zm0 0v13.4"/>',
  bm:'<path d="M6.5 3.8h11v16.4L12 16.4l-5.5 3.8z"/>',fav:'<path d="M12 19.6s-7.6-4.5-7.6-10a4.3 4.3 0 0 1 7.6-2.7 4.3 4.3 0 0 1 7.6 2.7c0 5.5-7.6 10-7.6 10Z"/>',
  notes:'<path d="M5.5 3.5h9l4 4v13h-13z"/><path d="M14.5 3.5v4h4M8.5 12h7M8.5 15.8h4.5"/>',quiz:'<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M9.6 10a2.4 2.4 0 1 1 3.1 2.3c-.5.2-.7.6-.7 1.1v.3M12 16.4v.1"/>',
  focus:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',calm:'<path d="M3.5 9.5c2.8-2 5.7-2 8.5 0s5.7 2 8.5 0M3.5 15c2.8-2 5.7-2 8.5 0s5.7 2 8.5 0"/>',
  ink:'<path d="M4.5 19.5l1-4.2L15.8 5a2.1 2.1 0 0 1 3 3L8.7 18.5z"/><path d="M13.8 7l3.1 3.1"/>',theme:'<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none"/>',
  size:'<path d="M3 18.5 7.6 6h.8l4.6 12.5M4.8 14.2h6.4M14.5 18.5l3-8 3 8M15.5 16h4"/>',fs:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  flat:'<path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3M6 6l2.1 2.1M15.9 15.9 18 18M18 6l-2.1 2.1M8.1 15.9 6 18"/>',
  exp:'<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M4.5 19.5h15"/>',imp:'<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M4.5 19.5h15"/>',out:'<path d="M14 4.5h4.5v15H14M10 8l-4 4 4 4M6 12h10"/>',
  me:'<circle cx="12" cy="9" r="3.6"/><path d="M5.2 19.6a6.8 6.8 0 0 1 13.6 0"/>',
  tis:'<circle cx="8" cy="9" r="3.2"/><circle cx="16" cy="8" r="2.4"/><circle cx="14.5" cy="16" r="3.4"/>',fx:'<path d="M12 3.5v2.5M12 18v2.5M3.5 12H6M18 12h2.5"/><circle cx="12" cy="12" r="4.2"/>',hap:'<rect x="8" y="3.5" width="8" height="17" rx="2"/><path d="M4.5 9v6M19.5 9v6"/>'};
 const ic=k=>'<svg class="zm-ic" viewBox="0 0 24 24" aria-hidden="true">'+I[k]+'</svg>',CH='<svg class="zm-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
 const link=(h,k,t,c)=>'<a class="zm-row" href="'+h+'">'+ic(k)+'<span class="zm-l">'+t+'</span>'+(c?'<span class="zm-v cn" data-c="'+c+'">0</span>':'')+CH+'</a>';
 const sw=(id,k,t)=>'<button type="button" class="zm-row" role="switch" aria-checked="false" id="'+id+'">'+ic(k)+'<span class="zm-l">'+t+'</span><span class="zm-tg" aria-hidden="true"></span></button>';
 const btn=(id,k,t)=>'<button type="button" class="zm-row" id="'+id+'">'+ic(k)+'<span class="zm-l">'+t+'</span></button>';
 const OR={'zm-h-study':1,'zm-h-saved':2,'zm-h-read':3,'zm-h-disp':4,'zm-h-data':5},/* phone order; desktop splits into two columns */
  grp=(id,h,rows)=>'<section class="zm-g zm-o'+OR[id]+'" aria-labelledby="'+id+'"><h2 class="zm-gh" id="'+id+'">'+h+'</h2><div class="zm-list">'+rows+'</div></section>';
 X.classList.add('zm');
 X.innerHTML='<section class="zm-card" id="zm-card" aria-labelledby="zm-name"></section><div class="zm-cols"><div>'+
  grp('zm-h-study','Study',btn('tut-open','tut','Tutorial')+link('#/practice','practice','Practice')+link('#/howto','read','How to read'))+
  grp('zm-h-saved','Saved',link('#/bookmarks','bm','Bookmarks','bm')+link('#/favourites','fav','Favourites','fav')+link('#/notes','notes','Notes','notes'))+
  grp('zm-h-data','Your data',btn('zm-exp','exp','Export backup')+btn('zm-imp','imp','Import backup')+'<input type="file" accept=".json" id="zm-file" hidden>')+
 '</div><div>'+
  grp('zm-h-read','Reading',sw('mq-quiz','quiz','Quiz mode')+sw('zm-focus','focus','Focus')+sw('zm-calm','calm','Calm reading')+sw('zm-ink','ink','Annotate'))+
  grp('zm-h-disp','Display','<div class="zm-row zm-fix">'+ic('theme')+'<span class="zm-l" id="zm-th-l">Theme</span><span class="zm-seg" role="radiogroup" aria-labelledby="zm-th-l"><button type="button" role="radio" data-th="light">Light</button><button type="button" role="radio" data-th="sepia">Sepia</button><button type="button" role="radio" data-th="dark">Dark</button></span></div>'+
   '<div class="zm-row zm-fix">'+ic('size')+'<span class="zm-l" id="zm-fs-l">Text size</span><span class="zm-step"><button type="button" data-st="fm" aria-label="Smaller text">A−</button><output id="zm-fsv" aria-live="polite">100%</output><button type="button" data-st="fp" aria-label="Larger text">A+</button></span></div>'+
   sw('mq-fs','fs','Fullscreen')+sw('mq-flat','flat','Reduce effects')+
   '<div class="zm-row zm-fix">'+ic('fx')+'<span class="zm-l" id="zm-fx-l">Visual effects</span><span class="zm-seg zm-seg-fx" role="radiogroup" aria-labelledby="zm-fx-l"><button type="button" role="radio" data-fx="full">Full</button><button type="button" role="radio" data-fx="min">Minimal</button><button type="button" role="radio" data-fx="off">Off</button></span></div>'+
   sw('zm-tis','tis','Tissue background')+sw('zm-hap','hap','Haptics'))+
  '<div class="zm-list zm-outl zm-o6" id="zm-outl" hidden>'+btn('zm-out','out','Sign out')+'</div>'+
  '<section class="zm-g zm-o7" aria-labelledby="zm-h-app"><h2 class="zm-gh" id="zm-h-app">App</h2><div class="zm-list">'+
   '<div class="zm-row zm-fix">'+ic('read')+'<span class="zm-l">Version</span><span class="zm-v" id="zm-ver">…</span></div>'+
   btn('zm-upd','exp','Check for updates')+btn('zm-fix','imp','Repair app')+'</div><p class="zm-help" id="zm-appmsg" role="status"></p></section>'+
 '</div></div>';
 const $x=s=>X.querySelector(s),on=(el,v)=>{if(el)el.setAttribute('aria-checked',String(!!v))};
 /* switches and controls */
 const qb=$x('#mq-quiz');qb.onclick=()=>{setQuiz(!bd.classList.contains('quiz'),true);sync()};
 $x('#zm-focus').onclick=()=>{press('focus');sync()};
 const cb=$x('#zm-calm');cb.onclick=()=>{press('calm');sync()};
 const ib=$x('#zm-ink');ib.onclick=()=>{press('ink');setTimeout(sync,0)};
 /* the toolbar button steps Light > Sepia > Dark (polish.js), so tap it until the chosen theme is on */
 X.querySelectorAll('[data-th]').forEach(b=>b.onclick=()=>{for(let i=0;i<3&&theme()!==b.dataset.th;i++)press('theme');sync()});
 X.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{press(b.dataset.st);sync()});
 $x('#zm-exp').onclick=()=>exp();
 const fi=$x('#zm-file');$x('#zm-imp').onclick=()=>fi.click();fi.onchange=()=>{if(fi.files[0])imp(fi.files[0]);fi.value=''};
 $x('#zm-out').onclick=function(){this.disabled=true;window.zzAccount&&zzAccount.logout()};
 /* App: which version this device runs, a manual update check, and a repair that throws away the saved copy (never your data:
    progress, notes and sign-in live in storage, not in the cache) and loads a fresh one */
 const amsg=t=>{$x('#zm-appmsg').textContent=t},ver=()=>(window.caches?caches.keys():Promise.resolve([])).then(k=>{const v=k.map(x=>(/^pathviva-zzee-v(\d+)$/.exec(x)||[])[1]).filter(Boolean).sort((a,b)=>b-a)[0];$x('#zm-ver').textContent=v?'v'+v:'—';return v}).catch(()=>null);
 ver();if(navigator.serviceWorker)navigator.serviceWorker.ready.then(()=>setTimeout(ver,500));addEventListener('hashchange',()=>{if(location.hash==='#/menu')ver()});
 $x('#zm-upd').onclick=async function(){const b=this;b.disabled=true;amsg('Checking…');
  try{const r=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();if(!r){amsg('Updates apply each time the page loads.');b.disabled=false;return}
   const was=await ver();await r.update();const w=r.installing||r.waiting;
   if(!w){amsg('You’re on the latest version'+(was?' (v'+was+').':'.'));b.disabled=false;return}
   amsg('Downloading the new version…');navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});
   setTimeout(()=>location.reload(),15000);
  }catch(e){amsg(navigator.onLine===false?'You’re offline. Try again when you reconnect.':'Couldn’t check right now. Try again in a moment.');b.disabled=false}};
 $x('#zm-fix').onclick=async function(){if(navigator.onLine===false){amsg('Connect to the internet first: repair downloads a fresh copy.');return}this.disabled=true;amsg('Repairing…');
  try{const rs=navigator.serviceWorker?await navigator.serviceWorker.getRegistrations():[];await Promise.all(rs.map(r=>r.unregister()));
   if(window.caches){const k=await caches.keys();await Promise.all(k.filter(x=>x.startsWith('pathviva-')).map(x=>caches.delete(x)))}}catch(e){}
  location.reload()};
 /* fullscreen: browsers only allow it after a tap, so the app goes fullscreen on the first tap of each visit (unless switched off here) */
 const fb=$x('#mq-fs'),fsOn=()=>!!(document.fullscreenElement||document.webkitFullscreenElement),app=matchMedia('(display-mode: fullscreen)').matches;
 if(de.requestFullscreen||de.webkitRequestFullscreen){
  const enter=()=>{try{if(!fsOn())(de.requestFullscreen||de.webkitRequestFullscreen).call(de)}catch(e){}},
   leave=()=>{try{if(fsOn())(document.exitFullscreen||document.webkitExitFullscreen).call(document)}catch(e){}},
   want=()=>{try{return zzStore.getItem('zz-fs')!=='0'}catch(e){return true}},
   setWant=v=>{try{zzStore.setItem('zz-fs',v?'1':'0')}catch(e){}};
  if(app){fb.disabled=true;fb.querySelector('.zm-l').textContent='Fullscreen (app)'}/* installed app launched fullscreen by its manifest */
  fb.onclick=e=>{e.stopPropagation();if(fsOn()){setWant(false);leave()}else{setWant(true);enter()}};
  ['fullscreenchange','webkitfullscreenchange'].forEach(ev=>document.addEventListener(ev,sync));
  if(want()&&!app){const once=()=>{removeEventListener('pointerup',once,true);removeEventListener('keydown',once,true);if(want())enter()};addEventListener('pointerup',once,true);addEventListener('keydown',once,true)}
 }else fb.hidden=true;
 const rb=$x('#mq-flat');try{if(zzStore.getItem('zz-flat')==='1')de.classList.add('zz-flat')}catch(e){}
 rb.onclick=()=>{de.classList.toggle('zz-flat');try{zzStore.setItem('zz-flat',de.classList.contains('zz-flat')?'1':'0')}catch(e){}sync()};
 /* Visual effects (fx.js): Full, Minimal (cross-fades only) or Off; reduced motion on the device already forces Minimal. Haptics: vibration where supported */
 X.querySelectorAll('[data-fx]').forEach(b=>b.onclick=()=>{const s=typeof S!=='undefined'?S:null;if(!s)return;s.pref=s.pref||{};s.pref.fx=b.dataset.fx;save();if(window.zzFx)zzFx.apply();sync()});
 $x('.zm-seg-fx').addEventListener('keydown',e=>{if(!/^Arrow(Left|Right|Up|Down)$/.test(e.key))return;e.preventDefault();
  const o=[...X.querySelectorAll('[data-fx]')],i=o.findIndex(b=>b.getAttribute('aria-checked')==='true'),n=o[(i+(/Left|Up/.test(e.key)?o.length-1:1))%o.length];n.click();n.focus()});
 /* Tissue background: the moving stained-tissue backdrop (fxgl.js); on unless switched off */
 $x('#zm-tis').onclick=()=>{const s=typeof S!=='undefined'?S:null;if(!s)return;s.pref=s.pref||{};s.pref.tissue=s.pref.tissue===false;save();
  document.documentElement.classList.toggle('fx-notis',s.pref.tissue===false);if(window.zzFxGl)zzFxGl.wake(3000);sync()};
 const hb=$x('#zm-hap');if(!('vibrate' in navigator))hb.hidden=true;
 hb.onclick=()=>{const s=typeof S!=='undefined'?S:null;if(!s)return;s.pref=s.pref||{};s.pref.hap=s.pref.hap===false;save();if(s.pref.hap&&window.zzFx)zzFx.haptic(12);sync()};
 function theme(){const t=de.dataset.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');return t==='dark'?'dark':de.dataset.tone==='sepia'?'sepia':'light'}
 function sync(){
  on(qb,bd.classList.contains('quiz'));on($x('#zm-focus'),bd.classList.contains('focus'));on(cb,bd.classList.contains('calm'));cb.hidden=!tool('calm');
  const t=tool('ink');on(ib,t&&t.getAttribute('aria-pressed')==='true');ib.hidden=!t;
  on(fb,app||fsOn());on(rb,de.classList.contains('zz-flat'));
  {const p=(typeof S!=='undefined'&&S.pref)||{},fv=p.fx||'full';X.querySelectorAll('[data-fx]').forEach(b=>{const c=b.dataset.fx===fv;b.setAttribute('aria-checked',String(c));b.tabIndex=c?0:-1});on($x('#zm-hap'),p.hap!==false);on($x('#zm-tis'),p.tissue!==false)}
  const th=theme();X.querySelectorAll('[data-th]').forEach(b=>{const c=b.dataset.th===th;b.setAttribute('aria-checked',String(c));b.tabIndex=c?0:-1});
  const f=+((S.pref&&S.pref.fs)||1);$x('#zm-fsv').textContent=Math.round(f*100)+'%';$x('[data-st=fm]').disabled=f<=.8;$x('[data-st=fp]').disabled=f>=1.6;
 }
 /* arrow keys move between the two theme options, as in any radio group */
 $x('.zm-seg').addEventListener('keydown',e=>{if(!/^Arrow(Left|Right|Up|Down)$/.test(e.key))return;e.preventDefault();
  const o=[...X.querySelectorAll('[data-th]')],i=o.findIndex(b=>b.getAttribute('aria-checked')==='true'),n=o[(i+(/Left|Up/.test(e.key)?o.length-1:1))%o.length];n.click();n.focus()});

 /* ---- profile card ---- */
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
 const day=t=>new Date(t).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
 const local=()=>{try{return(zzStore.getItem('zzName')||'').trim().slice(0,40)}catch(e){return''}};
 function who(){const a=window.zzAccount,si=!!(a&&a.signedIn&&a.signedIn()),u=(si&&a.user&&a.user())||{},d=(u.display_name||'').trim();
  return{si,name:(/^User \d{4}$/.test(d)?'':d)||local(),contact:u.email||u.phone||''}}
 function initials(n,c){const w=n.split(/\s+/).filter(Boolean);return w.length?(w[0][0]+(w.length>1?w[w.length-1][0]:'')).toUpperCase():c?c[0].toUpperCase():''}
 function plan(m){const t=m.now||Date.now(),a=(m.entitlements||[]).filter(e=>e.expires_at>t),k=a.map(e=>e.entitlement),end=a.length?Math.min(...a.map(e=>e.expires_at)):0;
  return{paid:k.length>0,all:k.length>=3,end,days:end?Math.ceil((end-t)/864e5):0,
   label:k.length>=3?'All access':k.length?'Pro: '+k.map(e=>({qna:'Questions',mcq:'MCQs',textbook:'Textbook'})[e]||e).join(' + '):'Free plan'}}
 let ME=null,meAt=0,meP=null;
 function me(){const a=window.zzAccount;if(!a||!a.signedIn()||!a.me)return Promise.resolve(null);if(ME&&Date.now()-meAt<6e4)return Promise.resolve(ME);
  /* resolves the account, or {_e:'offline'} only when the browser says it is offline, else {_e:'error'} (server or sign-in trouble) */
  return meP||(meP=a.me().then(m=>{meP=null;if(m){ME=m;meAt=Date.now();if(m.user&&a.setUser)a.setUser(m.user);return m}return{_e:navigator.onLine===false?'offline':'error'}},
   ()=>{meP=null;return{_e:navigator.onLine===false?'offline':'error'}}))}
 let IDS=null;function learned(){try{if(!IDS)IDS=new Set(DATA.map(d=>d[3]));return[S.learned.filter(i=>IDS.has(i)).length,IDS.size]}catch(e){return[0,0]}}
 const card=$x('#zm-card');
 function paint(w,p,err){
  const ini=initials(w.name,w.contact),gold=!!(p&&p.paid);
  const av='<div class="zm-av'+(gold?' zm-gold':'')+'" aria-hidden="true">'+(ini?esc(ini):'<svg viewBox="0 0 24 24">'+I.me+'</svg>')+'</div>';
  let title=w.name||'Your account',sub='',status='',acts='';
  if(!w.si){
   status='<span class="zm-chip">Not signed in</span>';
   sub='<p class="zm-note">Topic 01, MCQ chapter 1 and textbook chapter 1 are free. Sign in to open everything your plan includes.</p>';
   acts='<button type="button" class="zm-cta" data-a="in">Sign in</button><button type="button" class="zm-ghost" data-a="new">Create an account</button>';
  }else{
   sub=w.contact?'<p class="zm-mail">'+esc(w.contact)+'</p>':'';
   if(p){status='<span class="zm-chip'+(p.paid?' zm-paid':'')+'">'+esc(p.label)+'</span>'+(p.paid?'<span class="zm-when">'+(p.days<=7?'Ends in '+p.days+(p.days===1?' day':' days'):'Active until '+esc(day(p.end)))+'</span>':'')}
   else status='<span class="zm-when">'+(err==='offline'?'You’re offline. Your plan shows when you reconnect.':err?'Couldn’t load your plan. <button type="button" class="zm-retry" data-a="retry">Try again</button>':'Loading your plan…')+'</span>';
   const soon=p&&p.paid&&p.days<=7;
   acts=p&&!p.paid?'<button type="button" class="zm-cta" data-a="up">Choose a plan</button><a class="zm-ghost" href="#/account">Manage account</a>'
    :soon?'<button type="button" class="zm-cta" data-a="up">Renew plan</button><a class="zm-ghost" href="#/account">Manage account</a>'
    :'<a class="zm-cta" href="#/account">Manage account</a>'+(p&&p.paid&&!p.all?'<button type="button" class="zm-ghost" data-a="up">Add a plan</button>':'');
  }
  const L=learned(),st=(S.streak&&S.streak.n)||0,pc=L[1]?Math.round(1000*L[0]/L[1])/10:0;
  const prog=L[1]?'<div class="zm-prog"><p><span>'+L[0].toLocaleString('en-IN')+' of '+L[1].toLocaleString('en-IN')+' questions learned</span>'+(st>1?'<span>'+st+'-day streak</span>':'')+'</p><div class="zm-bar" aria-hidden="true"><i style="width:'+Math.max(pc,L[0]?1.5:0)+'%"></i></div></div>':'';
  const st2='<p class="zm-st">'+status+'</p>';/* signed out: say so first, then what signing in opens */
  card.innerHTML='<div class="zm-id">'+av+'<div class="zm-who"><h2 class="zm-name" id="zm-name">'+esc(title)+'</h2>'+(w.si?sub+st2:st2+sub)+'</div><div class="zm-acts">'+acts+'</div></div>'+prog;
  card.classList.toggle('zm-out',!w.si);
  card.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const a=b.dataset.a;
   if(a==='up'){window.zzUpgrade&&zzUpgrade();return}
   if(a==='retry'){ME=null;b.disabled=true;b.textContent='Loading…';render();return}
   if(!window.zzSignIn)return;zzSignIn();const m=document.getElementById('zz-mode');/* the dialog keeps its last mode: switch it to the one asked for */
   if(m&&(a==='new')!==/Have an account/.test(m.textContent))m.click()});
  $x('#zm-outl').hidden=!w.si;
  nav(w.si?ini:'',gold);
 }
 /* the Menu tab carries your initials once you're signed in (gold ring on a paid plan) */
 function nav(ini,gold){
  document.querySelectorAll('#bnav a[href="#/menu"],.nav .links a[href="#/menu"]').forEach(a=>{
   let v=a.querySelector('.zm-navav');const s=a.querySelector(':scope>svg');
   if(ini){if(!v){v=document.createElement('span');v.className='zm-navav';v.setAttribute('aria-hidden','true');a.prepend(v)}v.textContent=ini;v.classList.toggle('zm-gold',gold);a.classList.add('zm-hasav')}
   else if(v){v.remove();a.classList.remove('zm-hasav')}
   if(s)s.style.display=ini?'none':''});
 }
 let seq=0;
 function render(){const n=++seq,w=who();
  if(!w.si){paint(w,null);return}
  paint(w,ME&&Date.now()-meAt<6e4?plan(ME):null);
  me().then(m=>{if(n!==seq)return;const ok=m&&!m._e;paint(who(),ok?plan(m):null,ok?null:(m&&m._e)||'error')});
 }
 const here=()=>location.hash==='#/menu';
 addEventListener('hashchange',()=>{if(here()){sync();render()}});
 addEventListener('zz:auth',()=>{ME=null;render()});
 addEventListener('online',()=>{if(here())render()});
 (window.zzAuthReady||Promise.resolve()).then(render,render);
 sync();render();addEventListener('load',()=>{sync();setTimeout(sync,600)});/* the toolbar gains Calm reading and Annotate after this runs */
}
