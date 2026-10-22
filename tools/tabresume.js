
/* ===== tab memory: the Chapters and Textbook tabs reopen where you were =====
   Tapping Chapters or Textbook from another tab goes back to the last page you had open in that tab (a chapter page, or a
   textbook chapter) at the question you were on. Tapping the tab you are already in still opens its list, as before.
   Positions are kept per page as "this card, this far from the top of the screen" (pixel fallback), so answers that open,
   load later or change size do not throw it off. Textbook chapters restore their own reading position (textbook.js).
   Stored on this device only (zzTabs): not synced and not part of backups. */
(function(){try{
const KEY='zzTabs',TABS={qa:1,textbook:1},MAXP=40,MENU=['practice','bookmarks','favourites','notes','howto','search','menu','account'];
const parts=h=>(h||'').replace(/^#\/?/,'').split('/');
/* same tab mapping as the app's own highlighter: anything that is not another tab belongs to Chapters */
const keyOf=h=>{const k=parts(h)[0]||'';return k===''||k==='home'?'':MENU.includes(k)?'menu':k==='topics'?'qa':['questions','qa','mcqs','textbook'].includes(k)?k:'qa'};
const base=h=>{const p=parts(h);return p[0]==='textbook'?'#/textbook'+(p[1]?'/'+p[1]:''):p[0]==='topics'?'#/qa':'#/'+p[0]};
const valid=h=>{if(typeof h!=='string'||!/^#\/[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)?$/.test(h))return false;const k=parts(h)[0];
 return k==='textbook'||k==='qa'||(keyOf(h)==='qa'&&!!document.getElementById('v-'+k))};
const tbCh=h=>/^#\/textbook\/./.test(h);   /* a textbook chapter: textbook.js keeps that position */
let M={last:{},pos:{}};
try{const o=JSON.parse(zzStore.getItem(KEY)||'{}');
 if(o&&o.last&&typeof o.last==='object')for(const k in TABS)if(valid(o.last[k]))M.last[k]=o.last[k];
 if(o&&o.pos&&typeof o.pos==='object')for(const h in o.pos){const p=o.pos[h];if(valid(h)&&p&&typeof p==='object'&&Number.isFinite(p.y))M.pos[h]={y:p.y,o:Number.isFinite(p.o)?p.o:0,a:typeof p.a==='string'&&/^[A-Za-z0-9_-]{1,40}$/.test(p.a)?p.a:'',t:+p.t||0}}
}catch(e){}
const persist=()=>{try{zzStore.setItem(KEY,JSON.stringify(M))}catch(e){}};
const view=()=>document.querySelector('.view:not([hidden])');
let cur=null,pending=null,st=0;
/* the page you are on now, if it belongs to a remembered tab */
function track(){const h=location.hash||'#/',k=keyOf(h);cur=TABS[k]&&valid(base(h))?base(h):null;if(cur&&M.last[k]!==cur){M.last[k]=cur;persist()}}
function save(){
 if(!cur||tbCh(cur)||base(location.hash)!==cur)return;   /* never record a page you have already left */
 const v=view();if(!v)return;
 let a=null;for(const c of v.querySelectorAll('.card[id]')){const r=c.getBoundingClientRect();if(r.height&&r.bottom>90){a=c;break}}
 const n={y:Math.round(scrollY),a:a?a.id:'',o:a?Math.round(a.getBoundingClientRect().top):0},q=M.pos[cur];
 if(q&&q.y===n.y&&q.a===n.a&&q.o===n.o)return;          /* nothing moved: no write */
 if(n.y<=2){if(q){delete M.pos[cur];persist()}return}    /* the top of the page is where it opens anyway */
 n.t=Date.now();M.pos[cur]=n;
 const ks=Object.keys(M.pos);if(ks.length>MAXP)ks.sort((x,y)=>M.pos[x].t-M.pos[y].t).slice(0,ks.length-MAXP).forEach(k=>delete M.pos[k]);
 persist();
}
/* put the page back; repeat briefly while answers and images settle, unless you start scrolling yourself */
function restore(b){
 const p=M.pos[b];if(!p)return;let mine=false;
 const stop=()=>{mine=true};['wheel','touchstart','keydown'].forEach(e=>addEventListener(e,stop,{once:true,passive:true,capture:true}));
 const go=()=>{if(mine||base(location.hash)!==b)return;const v=view(),el=p.a&&v&&v.querySelector('#'+CSS.escape(p.a));
  const y=el&&el.getClientRects().length?scrollY+el.getBoundingClientRect().top-p.o:p.y;
  if(Math.abs(y-scrollY)>1)scrollTo({top:Math.max(0,y),left:0,behavior:'instant'})};
 go();[60,200,500,1000].forEach(t=>setTimeout(go,t));
}
addEventListener('hashchange',()=>setTimeout(()=>{track();const p=pending;pending=null;if(p&&p===cur&&!tbCh(cur))restore(cur)},0));
addEventListener('scroll',()=>{clearTimeout(st);st=setTimeout(save,250)},{passive:true});
addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});
document.addEventListener('click',e=>{
 const a=e.target.closest&&e.target.closest('#bnav a,.nav .links a');
 if(!a||e.defaultPrevented||e.button>0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
 const href=a.getAttribute('href')||'',k=keyOf(href);if(!TABS[k])return;
 clearTimeout(st);save();                            /* keep the last bit of scrolling before you tapped */
 if(keyOf(location.hash)===k)return;                 /* the tab you are in: open its list, as before */
 const t=valid(M.last[k])?M.last[k]:href;pending=t;
 if(t!==href){e.preventDefault();location.hash=t}
},true);
track();
}catch(e){}})();
