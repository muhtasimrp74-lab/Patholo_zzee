
/* ===== batch 1: Aa panel, quieter annotate button, empty lists that explain themselves, slim footer on inner pages,
   Undo after removing a bookmark/favourite/learned mark, a clearer Practice form. Styles in qol.css. ===== */
(function(){try{
const $=(s,r)=>(r||document).querySelector(s),st=()=>typeof S!=='undefined'?S:null;
const press=t=>{const b=$('#tools [data-t="'+t+'"]');if(b)b.click()};

/* --- top bar: Annotate, Theme, Focus, Listen and one "Aa" panel (text size, calm reading, print) --- */
function aa(){
 const tl=$('#tools');if(!tl||$('#zq-aa',tl))return;
 const b=document.createElement('button');b.type='button';b.id='zq-aa';b.className='zq-aa';b.textContent='Aa';b.title='Text and reading';
 b.setAttribute('aria-label','Text and reading options');b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls','zq-aap');
 const th=$('[data-t=theme]',tl);if(th)th.after(b);else tl.append(b);
 const p=document.createElement('div');p.id='zq-aap';p.className='zq-aap';p.hidden=true;p.setAttribute('role','dialog');p.setAttribute('aria-label','Text and reading');
 p.innerHTML='<div class="zq-r"><span>Text size</span><span class="zq-st"><button type="button" data-z="fm" aria-label="Smaller text">A−</button><output aria-live="polite"></output><button type="button" data-z="fp" aria-label="Larger text">A+</button></span></div>'+
  '<button type="button" class="zq-r zq-b" data-z="calm" role="switch" aria-checked="false"><span>Calm reading</span><span class="zq-tg" aria-hidden="true"></span></button>'+
  '<button type="button" class="zq-r zq-b" data-z="print"><span>Print this page</span></button>';
 document.body.append(p);
 const sync=()=>{const s=st(),f=+((s&&s.pref&&s.pref.fs)||1);p.querySelector('output').textContent=Math.round(f*100)+'%';
  p.querySelector('[data-z=fm]').disabled=f<=.8;p.querySelector('[data-z=fp]').disabled=f>=1.6;
  const c=p.querySelector('[data-z=calm]');c.hidden=!$('#tools [data-t=calm]');c.setAttribute('aria-checked',String(document.body.classList.contains('calm')))};
 const place=()=>{const r=b.getBoundingClientRect(),w=Math.min(280,innerWidth-16);p.style.width=w+'px';p.style.top=Math.round(r.bottom+8)+'px';p.style.left=Math.round(Math.max(8,Math.min(innerWidth-w-8,r.right-w)))+'px'};
 const open=v=>{p.hidden=!v;b.setAttribute('aria-expanded',String(v));if(v){sync();place();p.querySelector('button').focus()}};
 b.addEventListener('click',e=>{e.stopPropagation();open(p.hidden)});
 p.addEventListener('click',e=>{const x=e.target.closest('[data-z]');if(!x)return;const z=x.dataset.z;if(z==='print'){open(false);press('print');return}press(z);setTimeout(sync,0)});
 document.addEventListener('click',e=>{if(e.isTrusted&&!p.hidden&&!p.contains(e.target)&&e.target!==b)open(false)});  /* the panel's own presses on the hidden buttons are not clicks outside */
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!p.hidden){open(false);b.focus()}});
 addEventListener('hashchange',()=>open(false));addEventListener('resize',()=>{if(!p.hidden)place()});
}

/* --- Bookmarks, Favourites, Notes: say what to do when the list is empty (and hide the filters there) --- */
const EMPTY={bm:['No bookmarks yet.','Tap Bookmark on any question to keep it here.'],fav:['No favourites yet.','Tap Favourite on a question you like to find it here.'],
 notes:['No notes yet.','Tap Add note on any question to write your own.']};
function empty(k){
 const m=EMPTY[k],box=$('[data-list="'+k+'"]'),s=st();if(!m||!box||!s)return;
 const ids=k==='notes'?Object.keys(s.notes||{}):(s[k]||[]),v=box.closest('.view'),none=!ids.length;
 if(v)v.classList.toggle('zq-none',none);
 let e=box.parentNode.querySelector(':scope > .zq-empty');
 if(none&&!e){e=document.createElement('div');e.className='zq-empty';e.innerHTML='<p><b>'+m[0]+'</b> '+m[1]+'</p><a class="zq-go" href="#/qa">Browse chapters</a>';box.after(e)}
 if(e)e.hidden=!none;
}
if(typeof render==='function'){const r0=render;window.render=function(k){const o=r0.apply(this,arguments);try{empty(k)}catch(e){}return o}}

/* --- footer: the full credits on Home; one slim line on every other page --- */
function foot(){
 const home=!location.hash||/^#\/?(home)?$/.test(location.hash);document.documentElement.classList.toggle('zq-inner',!home);
 const bot=$('footer.sf .sf-bot');if(bot&&!$('.zq-legal',bot)){const l=document.createElement('p');l.className='zq-legal';
  l.innerHTML='Made by Muhtasim Ahmed, Netrokona Medical College. <a href="terms.html">Terms</a> <a href="privacy.html">Privacy</a> <a href="refund.html">Refunds</a>';bot.prepend(l)}
}

/* --- Undo after removing a bookmark, favourite or learned mark --- */
const NAME={bm:'Removed from Bookmarks',fav:'Removed from Favourites',learned:'Marked as not learned'};
let tb=null,tt=0;
function toast(msg,undo){
 if(!tb){tb=document.createElement('div');tb.className='zq-toast';tb.setAttribute('role','status');document.body.append(tb)}
 tb.innerHTML='';const sp=document.createElement('span');sp.textContent=msg;const u=document.createElement('button');u.type='button';u.textContent='Undo';
 u.onclick=()=>{clearTimeout(tt);tb.classList.remove('on');undo()};tb.append(sp,u);tb.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>tb.classList.remove('on'),5000);
}
document.addEventListener('click',e=>{
 const b=e.target.closest&&e.target.closest('.act[data-k]');if(!b)return;const k=b.dataset.k;if(!NAME[k]||b.getAttribute('aria-pressed')!=='true')return;
 const card=b.closest('article.card'),id=card&&card.id;
 setTimeout(()=>{if(b.isConnected&&b.getAttribute('aria-pressed')==='true')return;   /* nothing was removed */
  toast(NAME[k],()=>{const again=id&&[...document.querySelectorAll('#'+CSS.escape(id)+' .act[data-k="'+k+'"]')].find(x=>x.isConnected&&x.getAttribute('aria-pressed')!=='true');
   if(again){again.click();return}const s=st();if(s&&id&&Array.isArray(s[k])&&!s[k].includes(id)){s[k].push(id);if(typeof save==='function')save();if(typeof counts==='function')counts()}})},0);
},true);

/* --- Practice: plain wording, nothing cut off, and the last choices remembered --- */
function practice(){
 const pm=$('#pm'),pb=$('#pb');if(!pm)return;
 const lb=pb&&pb.closest('label');if(lb&&lb.firstChild&&lb.firstChild.nodeType===3&&/B-number/.test(lb.firstChild.textContent))lb.firstChild.textContent='NMC list number';
 const o=[...pm.options];if(o[0]&&/spaced/.test(o[0].textContent))o[0].textContent='Flashcards (20 cards)';if(o[1]&&/simulator/.test(o[1].textContent))o[1].textContent='Timed viva (10 questions)';
 /* the app shows its own menu button over each select (dd() in the app): keep its visible text in step */
 const vis=el=>{const l=el.closest('label'),sp=l&&l.querySelector('.db span');if(sp&&el.selectedOptions[0])sp.textContent=el.selectedOptions[0].textContent.trim()};
 [pm,$('#pp'),pb,$('#pt')].forEach(el=>{if(el)vis(el)});
 if(pm.dataset.zq)return;pm.dataset.zq='1';
 const K='zqPractice',ids=['pm','pp','pb','pt'];let saved={};try{saved=JSON.parse(localStorage.getItem(K)||'{}')||{}}catch(e){}
 ids.forEach(i=>{const el=$('#'+i);if(!el)return;if(saved[i]!=null&&[...(el.options||[])].some(x=>x.value===saved[i])){el.value=saved[i];el.dispatchEvent(new Event('change',{bubbles:true}));vis(el)}
  el.addEventListener('change',()=>{saved[i]=el.value;try{localStorage.setItem(K,JSON.stringify(saved))}catch(e){}})});
}

const all=()=>{aa();foot();practice();['bm','fav','notes'].forEach(k=>{try{empty(k)}catch(e){}})};
all();addEventListener('hashchange',()=>setTimeout(all,0));addEventListener('load',()=>setTimeout(all,300));
}catch(e){}})();
