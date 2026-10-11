/* tutorial.js - guided tour of the whole site, opened from Menu > Study > Tutorial */
(function(){try{
const $=(s,r=document)=>r.querySelector(s);
const ST=[
['Welcome to Patholo_zzee','1,310 pathology viva and written questions in NMC order (Robbins 11th), with full answers. This 2-minute tour walks through every part. Use Next, or the arrow keys.','#/',''],
['Bottom bar','Home, Questions, Chapters, MCQs, Textbook and Menu are always one tap away. Everything else (Practice, Bookmarks, Notes, Backup) lives in Menu.','#/','#bnav'],
['Questions','Every question in book order. Search at the top, filter by type, year, importance or card. Tap a question to read its answer in place, or tap "Answer ›" to open it on its own page. Badges show Viva, Written or both.','#/questions','.qtools'],
['Chapters','Questions grouped by Robbins chapter, then heading and topic. The ring shows how much of a chapter you have learned.','#/qa',''],
['An answer page','The first line is what you say first. Below are the parts in the order the examiner asks. Under each card: Learned, Bookmark, Favourite, Note and Share. Keys: B bookmarks, L marks learned.','#/01','.card'],
['Reading tools','The floating bar changes theme (Light, Sepia, Dark), text size, Focus, Calm reading, Listen (reads the answer aloud), Print, and steps to the previous or next question (arrow keys also work).','#/01','#tools'],
['Handwriting (Ink)','Menu > Ink lets you write, highlight and erase on any answer with a pen or finger. It is saved on your device and included in backups.','#/menu',''],
['Practice','Flashcards with spaced repetition, a timed viva mode and quiz mode. Press Space to show the answer, then 1, 2 or 3 to rate it Easy, Medium or Hard.','#/practice',''],
['MCQs','884 questions: 12 past papers, mock exams, quick 10-question sets and custom practice. Your mistakes are collected so you can retry them.','#/mcqs',''],
['Textbook','The Robbins chapters, cleaned for reading. Key concepts are highlighted, sections fold, your place is remembered, and chapters you open work offline.','#/textbook',''],
['Your space','Bookmarks, Favourites and Notes collect what you save. The Home page shows progress, your daily plan, streak and the topics to focus on next.','#/menu',''],
['Backup and offline','Everything stays on your device. Menu > Export backup saves progress, notes and ink to a file; Import restores it. The site works offline once opened, and can be installed to your home screen.','#/menu','']];
/* selectors: spotlight target per step (first match inside the visible page, else anywhere) */
const SEL={1:'#bnav',2:'.qtools',4:'.card>header',5:'#tools',6:'[data-tt=ink]',10:'[href="#/bookmarks"]',11:'[onclick="exp()"]'};
const HAND='<svg viewBox="0 0 24 24"><path d="M9.2 11.2V5.4a1.6 1.6 0 0 1 3.2 0v5.2l4.4.9a2 2 0 0 1 1.6 2.3l-.7 4.2a3.3 3.3 0 0 1-3.2 2.8H10a3 3 0 0 1-2.4-1.2l-3-3.8a1.5 1.5 0 0 1 2.2-2l1.4 1.5z" fill="#fff" stroke="#241a14" stroke-width="1.3" stroke-linejoin="round"/></svg>';
let i=0,box=null,fx=null,pos=null,moved=false,lastR='',lastRect=null,tok=0,busy=false,glT=0;
const V=()=>({w:innerWidth,h:innerHeight});
function target(){const s=SEL[i];if(!s)return null;const e=document.querySelector('.view:not([hidden]) '+s)||document.querySelector(s);if(!e||!e.getClientRects().length)return null;return e}
function clampBox(x,y){const v=V(),w=box.offsetWidth,h=box.offsetHeight;return [Math.max(8,Math.min(v.w-w-8,x)),Math.max(8,Math.min(v.h-h-8,y))]}
function place(r){lastRect=r;const v=V(),w=box.offsetWidth,h=box.offsetHeight;let x,y;
 if(moved&&pos&&!(r&&(()=>{const c=clampBox(pos[0],pos[1]);return c[0]<r.right+8&&c[0]+w>r.left-8&&c[1]<r.bottom+8&&c[1]+h>r.top-8})())){[x,y]=clampBox(pos[0],pos[1])}
 else if(!r){x=(v.w-w)/2;y=v.h-h-Math.max(16,v.h*.08);if(v.w>v.h&&v.h<520){x=v.w-w-16;y=(v.h-h)/2}}
 else if(v.w>v.h&&v.h<520){const mid=r.left+r.width/2;x=mid>v.w/2?16:v.w-w-16;y=(v.h-h)/2}
 else{x=Math.min(Math.max(8,r.left+r.width/2-w/2),v.w-w-8);y=(r.top+r.height/2>v.h/2)?Math.max(8,r.top-h-26):Math.min(v.h-h-8,r.bottom+26);
  if(y+h>r.top-10&&y<r.bottom+10){y=(r.top>v.h-r.bottom)?8:v.h-h-8}}
 [x,y]=clampBox(x,y);box.style.transform='translate('+Math.round(x)+'px,'+Math.round(y)+'px)'}
/* spotlight rectangle of the current target, clipped to the screen (null = no target) */
function rectOf(){const v=V(),e=target();if(!e)return null;const b=e.getBoundingClientRect(),t=Math.max(b.top,0),bt=Math.min(b.bottom,v.h),l=Math.max(b.left,0),rt=Math.min(b.right,v.w);
 if(bt-t>8&&rt-l>8)return{left:l-6,top:t-6,width:rt-l+12,height:bt-t+12,right:rt+6,bottom:bt+6};return null}
const keyOf=r=>r?[r.left,r.top,r.width,r.height].map(Math.round).join():'n';
/* mode g = glide to a new step (spotlight, hand and card move together), t = follow the page while it scrolls (instant, no lag) */
function apply(r,mode){if(!fx)return;const v=V(),sp=fx.querySelector('.sp'),fl=fx.querySelector('.fl'),hd=fx.querySelector('.hd');lastR=keyOf(r);
 fx.classList.toggle('gl',mode==='g');clearTimeout(glT);if(mode==='g')glT=setTimeout(()=>fx&&fx.classList.remove('gl'),800);
 if(r){const hidden=sp.style.opacity!=='1';
  /* first appearance: appear in place and fade in instead of flying in from the old spot */
  sp.style.transition=hd.style.transition=hidden?'opacity .45s ease':'';
  sp.style.opacity=1;sp.style.left=r.left+'px';sp.style.top=r.top+'px';sp.style.width=r.width+'px';sp.style.height=r.height+'px';fl.style.opacity=0;
  const below=r.bottom<v.h-70,hx=Math.min(v.w-40,Math.max(30,r.left+r.width*.6));hd.classList.toggle('up',!below);hd.style.opacity=1;hd.style.left=hx+'px';hd.style.top=(below?r.bottom-2:r.top-40)+'px'}
 else{sp.style.transition=hd.style.transition='';sp.style.opacity=0;hd.style.opacity=0;fl.style.opacity=1}}
function fill(){const s=ST[i];box.querySelector('.tt-n').textContent='Step '+(i+1)+' / '+ST.length;box.querySelector('b').textContent=s[0];box.querySelector('p').textContent=s[1];box.querySelector('.pg i').style.width=Math.round((i+1)/ST.length*100)+'%';
 box.querySelector('[data-a=b]').disabled=!i;box.querySelector('[data-a=n]').textContent=i===ST.length-1?'Done':'Next'}
/* One step: fade the text out, let the new page render and any scroll finish, then move everything once. */
function show(n,first){i=Math.max(0,Math.min(ST.length-1,n));if(!first)moved=false;const s=ST[i],my=++tok;busy=true;
 const nav=location.hash!==s[2]&&!(s[2]==='#/'&&(location.hash===''||location.hash==='#'));
 if(nav){document.documentElement.classList.add('zz-still');location.hash=s[2]}
 if(first)fill();else box.classList.add('sw');
 const t0=performance.now(),minT=first?0:nav?260:160,fixedBar=['#bnav','#tools'].includes(SEL[i]);let lastK='',stable=0,scrolled=false;
 (function wait(){if(my!==tok||!box)return;const el=performance.now()-t0,e=target();
  if(e&&!scrolled&&el>=minT){scrolled=true;if(!fixedBar){const b=e.getBoundingClientRect();if(b.top<80||b.bottom>V().h-80){e.scrollIntoView({block:'center',behavior:'smooth'});stable=0}}}
  const r=rectOf(),k=keyOf(r);stable=k===lastK?stable+1:0;lastK=k;
  const ready=!SEL[i]||r||el>1000;
  if(el>=minT&&ready&&(stable>=4||el>1200)){fill();apply(r,'g');place(r);box.classList.remove('sw');busy=false;return}
  requestAnimationFrame(wait)})()}
/* keeps the spotlight glued to its target while the person scrolls */
function loop(){if(!fx)return;if(!busy){const r=rectOf(),k=keyOf(r);if(k!==lastR)apply(r,'t')}requestAnimationFrame(loop)}
function end(){tok++;busy=false;document.documentElement.classList.remove('zz-still');clearTimeout(glT);fx&&fx.remove();box&&box.remove();fx=box=null;removeEventListener('keydown',key,true);removeEventListener('resize',onR);removeEventListener('orientationchange',onR);try{S.pref=S.pref||{};S.pref.tut=1;save()}catch(e){}}
function onR(){if(!fx||!box)return;box.classList.add('dg');const r=rectOf();apply(r,'t');place(r);requestAnimationFrame(()=>requestAnimationFrame(()=>box&&box.classList.remove('dg')))}
function key(e){if(e.key==='Escape'){end()}else if(e.key==='ArrowRight'){e.stopPropagation();e.preventDefault();i<ST.length-1?show(i+1):end()}else if(e.key==='ArrowLeft'){e.stopPropagation();e.preventDefault();show(i-1)}}
function drag(e){const g=e.target.closest('[data-g]');if(!g||e.button>0)return;const m=box.getBoundingClientRect(),dx=e.clientX-m.left,dy=e.clientY-m.top;g.setPointerCapture&&g.setPointerCapture(e.pointerId);box.classList.add('dg');
 const mv=ev=>{const p=clampBox(ev.clientX-dx,ev.clientY-dy);pos=p;moved=true;box.style.transform='translate('+Math.round(p[0])+'px,'+Math.round(p[1])+'px)'};
 const up=()=>{box.classList.remove('dg');g.removeEventListener('pointermove',mv);g.removeEventListener('pointerup',up);g.removeEventListener('pointercancel',up)};
 g.addEventListener('pointermove',mv);g.addEventListener('pointerup',up);g.addEventListener('pointercancel',up);e.preventDefault()}
function start(){if(box)return;moved=false;pos=null;
 fx=document.createElement('div');fx.id='zz-tut-fx';fx.innerHTML='<i class="fl"></i><i class="sp" style="opacity:0"></i><div class="hd" style="opacity:0">'+HAND+'<i></i></div>';document.body.append(fx);
 box=document.createElement('div');box.id='zz-tut';box.className='dg';box.setAttribute('role','dialog');box.setAttribute('aria-label','Site tutorial');
 box.innerHTML='<div class="gr" data-g="1"><span class="tt-n"></span></div><div class="bd"><b></b><p></p></div><div class="pg"><i></i></div><div class="tt-b"><button type="button" data-a="x">Skip</button><span></span><button type="button" data-a="b">Back</button><button type="button" class="pri" data-a="n">Next</button></div>';document.body.append(box);
 box.onclick=e=>{const a=e.target.dataset.a;if(a==='n')i<ST.length-1?show(i+1):end();else if(a==='b')show(i-1);else if(a==='x')end()};
 box.addEventListener('pointerdown',drag);
 addEventListener('keydown',key,true);addEventListener('resize',onR);addEventListener('orientationchange',onR);show(0,true);requestAnimationFrame(loop);requestAnimationFrame(()=>requestAnimationFrame(()=>box&&box.classList.remove('dg')))}
window.zzTutorial=start;
const g=$('#v-menu .mgrid');
if(g){const b=document.createElement('button');b.type='button';b.className='mtile';b.id='tut-open';b.textContent='Tutorial';b.onclick=start;g.prepend(b)}
}catch(e){}})();
