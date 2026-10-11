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
let i=0,box=null,fx=null,tg=null,tm=null,pos=null,moved=false,lastR='';
const V=()=>({w:innerWidth,h:innerHeight});
function target(){const s=SEL[i];if(!s)return null;const e=document.querySelector('.view:not([hidden]) '+s)||document.querySelector(s);if(!e||!e.getClientRects().length)return null;return e}
function clampBox(x,y){const v=V(),w=box.offsetWidth,h=box.offsetHeight;return [Math.max(8,Math.min(v.w-w-8,x)),Math.max(8,Math.min(v.h-h-8,y))]}
function place(r){const v=V(),w=box.offsetWidth,h=box.offsetHeight;let x,y;
 if(moved&&pos){[x,y]=clampBox(pos[0],pos[1])}
 else if(!r){x=(v.w-w)/2;y=v.h-h-Math.max(16,v.h*.08);if(v.w>v.h&&v.h<520){x=v.w-w-16;y=(v.h-h)/2}}
 else if(v.w>v.h&&v.h<520){const mid=r.left+r.width/2;x=mid>v.w/2?16:v.w-w-16;y=(v.h-h)/2}
 else{x=Math.min(Math.max(8,r.left+r.width/2-w/2),v.w-w-8);y=(r.top+r.height/2>v.h/2)?Math.max(8,r.top-h-26):Math.min(v.h-h-8,r.bottom+26);
  if(y+h>r.top-10&&y<r.bottom+10){y=(r.top>v.h-r.bottom)?8:v.h-h-8}}
 [x,y]=clampBox(x,y);box.style.transform='translate('+Math.round(x)+'px,'+Math.round(y)+'px)'}
function paint(){if(!fx)return;const v=V(),e=target(),dm=fx.querySelectorAll('.dm'),rg=fx.querySelector('.rg'),hd=fx.querySelector('.hd');let r=null;
 if(e){const b=e.getBoundingClientRect(),t=Math.max(b.top,0),bt=Math.min(b.bottom,v.h),l=Math.max(b.left,0),rt=Math.min(b.right,v.w);if(bt-t>8&&rt-l>8)r={left:l-6,top:t-6,width:rt-l+12,height:bt-t+12,right:rt+6,bottom:bt+6}}
 const key=r?[r.left,r.top,r.width,r.height,v.w,v.h].map(Math.round).join():'n'+v.w+v.h;
 if(key!==lastR){lastR=key;
  if(r){const S=(el,l,t,w,h)=>{el.style.cssText='left:'+l+'px;top:'+t+'px;width:'+Math.max(0,w)+'px;height:'+Math.max(0,h)+'px'};
   S(dm[0],0,0,v.w,r.top);S(dm[1],0,r.bottom,v.w,v.h-r.bottom);S(dm[2],0,r.top,r.left,r.height);S(dm[3],r.right,r.top,v.w-r.right,r.height);
   rg.style.cssText='display:block;left:'+r.left+'px;top:'+r.top+'px;width:'+r.width+'px;height:'+r.height+'px';
   const below=r.bottom<v.h-70,hx=Math.min(v.w-40,Math.max(30,r.left+r.width*.6));hd.className='hd'+(below?'':' up');hd.style.cssText='display:block;left:'+hx+'px;top:'+(below?r.bottom-2:r.top-40)+'px'}
  else{dm[0].style.cssText='left:0;top:0;width:100vw;height:100vh';for(let k=1;k<4;k++)dm[k].style.cssText='width:0;height:0';rg.style.display='none';hd.style.display='none'}
  place(r)}}
function show(n){i=Math.max(0,Math.min(ST.length-1,n));const s=ST[i];lastR='';
 if(location.hash!==s[2]&&!(s[2]==='#/'&&(location.hash===''||location.hash==='#')))location.hash=s[2];
 box.innerHTML='<div class="gr" data-g="1"><span class="tt-n">Step '+(i+1)+' / '+ST.length+'</span></div><div class="bd"><b></b><p></p></div><div class="pg"><i style="width:'+Math.round((i+1)/ST.length*100)+'%"></i></div><div class="tt-b"><button type="button" data-a="x">Skip</button><span></span><button type="button" data-a="b"'+(i?'':' disabled')+'>Back</button><button type="button" class="pri" data-a="n">'+(i===ST.length-1?'Done':'Next')+'</button></div>';
 box.querySelector('b').textContent=s[0];box.querySelector('p').textContent=s[1];
 setTimeout(()=>{const e=target();if(e&&!['#bnav','#tools'].includes(SEL[i])){const b=e.getBoundingClientRect();if(b.top<80||b.bottom>V().h-80)e.scrollIntoView({block:'center',behavior:'smooth'})}paint()},350);paint()}
function end(){clearInterval(tm);fx&&fx.remove();box&&box.remove();fx=box=null;removeEventListener('keydown',key,true);removeEventListener('resize',onR);removeEventListener('orientationchange',onR);try{S.pref=S.pref||{};S.pref.tut=1;save()}catch(e){}}
function onR(){lastR='';setTimeout(paint,120);setTimeout(()=>{lastR='';paint()},450)}
function key(e){if(e.key==='Escape'){end()}else if(e.key==='ArrowRight'){e.stopPropagation();e.preventDefault();i<ST.length-1?show(i+1):end()}else if(e.key==='ArrowLeft'){e.stopPropagation();e.preventDefault();show(i-1)}}
function drag(e){const g=e.target.closest('[data-g]');if(!g||e.button>0)return;const m=box.getBoundingClientRect(),dx=e.clientX-m.left,dy=e.clientY-m.top;g.setPointerCapture&&g.setPointerCapture(e.pointerId);
 const mv=ev=>{const p=clampBox(ev.clientX-dx,ev.clientY-dy);pos=p;moved=true;box.style.transform='translate('+Math.round(p[0])+'px,'+Math.round(p[1])+'px)'};
 const up=()=>{g.removeEventListener('pointermove',mv);g.removeEventListener('pointerup',up);g.removeEventListener('pointercancel',up)};
 g.addEventListener('pointermove',mv);g.addEventListener('pointerup',up);g.addEventListener('pointercancel',up);e.preventDefault()}
function start(){if(box)return;moved=false;pos=null;
 fx=document.createElement('div');fx.id='zz-tut-fx';fx.innerHTML='<i class="dm"></i><i class="dm"></i><i class="dm"></i><i class="dm"></i><i class="rg" style="display:none"></i><div class="hd" style="display:none">'+HAND+'<i></i></div>';document.body.append(fx);
 box=document.createElement('div');box.id='zz-tut';box.setAttribute('role','dialog');box.setAttribute('aria-label','Site tutorial');document.body.append(box);
 box.onclick=e=>{const a=e.target.dataset.a;if(a==='n')i<ST.length-1?show(i+1):end();else if(a==='b')show(i-1);else if(a==='x')end()};
 box.addEventListener('pointerdown',drag);
 addEventListener('keydown',key,true);addEventListener('resize',onR);addEventListener('orientationchange',onR);tm=setInterval(paint,200);show(0)}
window.zzTutorial=start;
const g=$('#v-menu .mgrid');
if(g){const b=document.createElement('button');b.type='button';b.className='mtile';b.id='tut-open';b.textContent='Tutorial';b.onclick=start;g.prepend(b)}
}catch(e){}})();
