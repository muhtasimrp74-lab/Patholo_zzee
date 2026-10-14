/* Daily welcome + idle warm-up. The welcome shows at most once per 24 hours (and never on a first-ever visit, where the tour greets you). */
(function(){
var K='zzWelcomeAt',DAY=864e5,now=Date.now();
function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
function set(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function state(){try{return JSON.parse(get('vivaState')||'{}')||{}}catch(e){return {}}}
function show(){
  var h=new Date().getHours(),g=h<5?'Burning the midnight oil':h<12?'Good morning':h<17?'Good afternoon':h<21?'Good evening':'Good evening',
      s=state(),n=s.streak&&s.streak.n||0,l=(s.learned||[]).length,gone=get(K),away=gone&&now-(+gone)>2*DAY;
  var sub=away?'It’s been a little while — no pressure, even ten minutes today counts.':n>1?'You’re on a '+n+'-day revision streak. Keep it glowing!':l?l+' questions learned so far. One more session builds on that.':'A few questions a day adds up faster than you think.';
  var d=document.createElement('div');d.className='zz-welcome';d.setAttribute('role','status');
  d.innerHTML='<div class="zw-i" aria-hidden="true">✨</div><div class="zw-t"><b></b><span></span></div><button type="button" aria-label="Dismiss">×</button>';
  d.querySelector('b').textContent=g+', welcome back!';d.querySelector('span').textContent=sub;
  document.body.appendChild(d);
  var st=document.createElement('style');st.textContent='.zz-welcome{position:fixed;z-index:70;left:50%;top:calc(12px + env(safe-area-inset-top,0px));transform:translate(-50%,-140%);width:min(440px,calc(100vw - 24px));display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:18px;background:var(--panel,#fff);color:var(--text,#222);border:1px solid var(--line,#ddd);box-shadow:0 14px 40px rgba(33,25,31,.28);transition:transform .5s cubic-bezier(.2,.9,.3,1),opacity .4s;opacity:0;font:500 13.5px/1.35 var(--body,system-ui,sans-serif)}.zz-welcome.on{transform:translate(-50%,0);opacity:1}.zz-welcome .zw-i{font-size:24px}.zz-welcome .zw-t{flex:1;display:flex;flex-direction:column;gap:2px}.zz-welcome b{font-size:15px}.zz-welcome span{color:var(--muted,#666)}.zz-welcome button{border:0;background:none;color:inherit;font-size:22px;line-height:1;min-width:36px;min-height:36px;cursor:pointer}@media(prefers-reduced-motion:reduce){.zz-welcome{transition:opacity .2s}}';
  document.head.appendChild(st);
  var t,close=function(){clearTimeout(t);d.classList.remove('on');setTimeout(function(){d.remove();st.remove()},600)};
  d.querySelector('button').onclick=close;requestAnimationFrame(function(){requestAnimationFrame(function(){d.classList.add('on')})});t=setTimeout(close,7000);
}
function maybe(){
  var last=get(K);
  if(last===null&&get('vivaState')===null){set(K,String(now));return}   /* first-ever visit: tour handles it */
  if(last!==null&&now-(+last)<DAY)return;
  if(document.querySelector('.tour,.tut,[data-tour]'))return;
  show();set(K,String(now)); /* stamp only after showing; old stamp used for the "been a while" line */
}
function idle(f){(window.requestIdleCallback||function(c){setTimeout(c,1500)})(f,{timeout:4000})}
window.addEventListener('load',function(){setTimeout(maybe,900)});
/* warm-up: once the page is idle, fetch the textbook chapters and decode hero images so later taps feel instant */
window.addEventListener('load',function(){idle(function(){
  try{if(navigator.connection&&(navigator.connection.saveData||/2g/.test(navigator.connection.effectiveType)))return}catch(e){}
  for(var i=1;i<=29;i++)(function(n){var u='textbook/ch'+(n<10?'0':'')+n+'.html';idle(function(){fetch(u,{cache:'force-cache'}).catch(function(){})})})(i);
  document.querySelectorAll('img').forEach(function(im){if(im.decode)im.decode().catch(function(){})});
})});
})();
