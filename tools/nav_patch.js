
/* ---- Menu page ---- */
{const X=mkView('menu','Menu','Menu','Everything else lives here.');
 X.innerHTML=`<p class="mh">Study</p><div class="mgrid"><a class="mtile" href="#/practice">Practice</a><a class="mtile" href="#/howto">How to read</a></div>
<p class="mh">Saved</p><div class="mgrid"><a class="mtile" href="#/bookmarks">Bookmarks<span class="cn" data-c="bm">0</span></a><a class="mtile" href="#/favourites">Favourites<span class="cn" data-c="fav">0</span></a><a class="mtile" href="#/notes">Notes<span class="cn" data-c="notes">0</span></a></div>
<p class="mh">Display</p><div class="mgrid"><button type="button" class="mtile" id="mq-quiz">Quiz mode</button><button type="button" class="mtile" data-tt="ink">Ink (handwriting)</button><button type="button" class="mtile" data-tt="theme">Theme</button><button type="button" class="mtile" data-tt="fm">Smaller text</button><button type="button" class="mtile" data-tt="fp">Larger text</button><button type="button" class="mtile" data-tt="focus">Focus</button><button type="button" class="mtile" data-tt="print">Print</button></div>
<p class="mh">Your data</p><div class="mgrid"><button type="button" class="mtile" onclick="exp()">Export backup</button><label class="mtile">Import backup<input type="file" accept=".json" hidden onchange="imp(this.files[0])"></label></div>`;
 X.querySelectorAll('[data-tt]').forEach(b=>b.onclick=()=>{const t=document.querySelector('#tools [data-t="'+b.dataset.tt+'"]');if(t)t.click()});
 const qb=X.querySelector('#mq-quiz'),qs=()=>{qb.textContent=document.body.classList.contains('quiz')?'Quiz mode: on':'Quiz mode: off'};qs();
 qb.onclick=()=>{setQuiz(!document.body.classList.contains('quiz'),true);qs()};
 const fb=document.createElement('button');fb.type='button';fb.className='mtile';fb.id='mq-fs';
 const de=document.documentElement,fsOn=()=>document.fullscreenElement||document.webkitFullscreenElement,
  fs=()=>{fb.textContent=fsOn()?'Fullscreen: on':'Fullscreen: off'};
 if(de.requestFullscreen||de.webkitRequestFullscreen){fs();
  const enter=()=>{try{if(!fsOn())(de.requestFullscreen||de.webkitRequestFullscreen).call(de)}catch(e){}},
   leave=()=>{try{if(fsOn())(document.exitFullscreen||document.webkitExitFullscreen).call(document)}catch(e){}},
   want=()=>{try{return zzStore.getItem('zz-fs')!=='0'}catch(e){return true}},
   setWant=v=>{try{zzStore.setItem('zz-fs',v?'1':'0')}catch(e){}};
  const app=matchMedia('(display-mode: fullscreen)').matches;/* installed app launched fullscreen by its manifest: already fullscreen from the first frame */
  if(app){fb.textContent='Fullscreen: on (app)';fb.disabled=true}
  fb.onclick=e=>{e.stopPropagation();if(fsOn()){setWant(false);leave()}else{setWant(true);enter()}};
  ['fullscreenchange','webkitfullscreenchange'].forEach(ev=>document.addEventListener(ev,()=>{if(!app)fs()}));
  /* browsers only allow fullscreen after a tap, so the app goes fullscreen on the first tap of each visit (unless switched off here) */
  if(want()&&!app){const once=()=>{removeEventListener('pointerup',once,true);removeEventListener('keydown',once,true);if(want())enter()};addEventListener('pointerup',once,true);addEventListener('keydown',once,true)}
  qb.parentNode.appendChild(fb)}
 const rb=document.createElement('button');rb.type='button';rb.className='mtile';rb.id='mq-flat';
 const rf=()=>{rb.textContent=de.classList.contains('zz-flat')?'Reduce effects: on':'Reduce effects: off'};
 try{if(zzStore.getItem('zz-flat')==='1')de.classList.add('zz-flat')}catch(e){}
 rf();rb.onclick=()=>{de.classList.toggle('zz-flat');try{zzStore.setItem('zz-flat',de.classList.contains('zz-flat')?'1':'0')}catch(e){}rf()};
 qb.parentNode.appendChild(rb)}
