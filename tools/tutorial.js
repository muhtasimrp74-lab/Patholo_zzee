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
let i=0,box=null,hi=null;
function clear(){hi&&hi.classList.remove('zz-tut-hi');hi=null}
function show(n){i=Math.max(0,Math.min(ST.length-1,n));const s=ST[i];clear();
 if(location.hash!==s[2]&&!(s[2]==='#/'&&(location.hash===''||location.hash==='#')))location.hash=s[2];
 box.innerHTML='<div class="tt-n">Step '+(i+1)+' of '+ST.length+'</div><b></b><p></p><div class="tt-dots">'+ST.map((_,k)=>'<i'+(k===i?' class="on"':'')+'></i>').join('')+'</div><div class="tt-b"><button type="button" data-a="x">Skip</button><span></span><button type="button" data-a="b"'+(i?'':' disabled')+'>Back</button><button type="button" class="pri" data-a="n">'+(i===ST.length-1?'Done':'Next')+'</button></div>';
 $('b',box).textContent=s[0];$('p',box).textContent=s[1];
 setTimeout(()=>{if(!s[3]||!box)return;const e=$('.view:not([hidden]) '+s[3])||$(s[3]);if(e){hi=e;e.classList.add('zz-tut-hi');if(!['#bnav','#tools'].includes(s[3]))e.scrollIntoView({block:'center',behavior:'smooth'})}},350)}
function end(){clear();box&&box.remove();box=null;removeEventListener('keydown',key,true);try{S.pref=S.pref||{};S.pref.tut=1;save()}catch(e){}}
function key(e){if(e.key==='Escape'){end()}else if(e.key==='ArrowRight'){e.stopPropagation();e.preventDefault();i<ST.length-1?show(i+1):end()}else if(e.key==='ArrowLeft'){e.stopPropagation();e.preventDefault();show(i-1)}}
function start(){if(box)return;box=document.createElement('div');box.id='zz-tut';box.setAttribute('role','dialog');box.setAttribute('aria-label','Site tutorial');document.body.append(box);
 box.onclick=e=>{const a=e.target.dataset.a;if(a==='n')i<ST.length-1?show(i+1):end();else if(a==='b')show(i-1);else if(a==='x')end()};
 addEventListener('keydown',key,true);show(0)}
window.zzTutorial=start;
const g=$('#v-menu .mgrid');
if(g){const b=document.createElement('button');b.type='button';b.className='mtile';b.id='tut-open';b.textContent='Tutorial';b.onclick=start;g.prepend(b)}
}catch(e){}})();
