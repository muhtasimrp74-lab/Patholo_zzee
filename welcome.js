/* Daily welcome + idle warm-up. The welcome shows at most once per 24 hours (and never on a first-ever visit, where the tour greets you). */
(function(){
var K='zzWelcomeAt',DAY=864e5,now=Date.now();
function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
function set(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function state(){try{return JSON.parse(get('vivaState')||'{}')||{}}catch(e){return {}}}
function greet(){var h=new Date().getHours();return h<5?'Burning the midnight oil':h<12?'Good morning':h<17?'Good afternoon':'Good evening'}
function nm(){return (get('zzName')||'').trim().slice(0,40)}
function css(){if(document.getElementById('zz-w-css'))return;var st=document.createElement('style');st.id='zz-w-css';st.textContent='.zz-welcome{position:fixed;z-index:70;left:50%;top:calc(12px + env(safe-area-inset-top,0px));transform:translate(-50%,-140%);width:min(440px,calc(100vw - 24px));display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:18px;background:var(--panel,#fff);color:var(--text,#222);border:1px solid var(--line,#ddd);box-shadow:0 14px 40px rgba(33,25,31,.28);transition:transform .5s cubic-bezier(.2,.9,.3,1),opacity .4s;opacity:0;font:500 13.5px/1.35 var(--body,system-ui,sans-serif)}.zz-welcome.on{transform:translate(-50%,0);opacity:1}.zz-welcome .zw-i{font-size:24px}.zz-welcome .zw-t{flex:1;display:flex;flex-direction:column;gap:2px}.zz-welcome b{font-size:15px}.zz-welcome span{color:var(--muted,#666)}.zz-welcome button{border:0;background:none;color:inherit;font-size:22px;line-height:1;min-width:36px;min-height:36px;cursor:pointer}'
+'.zz-wd{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(20,14,16,.55);opacity:0;transition:opacity .35s}.zz-wd.on{opacity:1}.zz-wd .zc{width:min(400px,100%);box-sizing:border-box;padding:26px 22px 20px;border-radius:24px;background:var(--panel,#fff);color:var(--text,#222);border:1px solid var(--line,#ddd);box-shadow:0 24px 70px rgba(0,0,0,.4);text-align:center;font:500 14px/1.45 var(--body,system-ui,sans-serif);transform:translateY(14px) scale(.96);transition:transform .45s cubic-bezier(.2,.9,.3,1)}.zz-wd.on .zc{transform:none}.zz-wd .zi{font-size:34px}.zz-wd h2{margin:6px 0 4px;font:400 24px/1.2 var(--serif,Georgia,serif)}.zz-wd p{margin:0 0 14px;color:var(--muted,#666)}.zz-wd label{display:block;text-align:left;font-size:12px;font-weight:600;color:var(--muted,#666);margin:0 0 4px}.zz-wd input{width:100%;box-sizing:border-box;padding:11px 12px;border-radius:12px;border:1px solid var(--line,#ccc);background:var(--bg,#fff);color:inherit;font:inherit;font-size:16px}.zz-wd button{margin-top:14px;width:100%;min-height:46px;border:0;border-radius:999px;background:var(--clay2,#a95f45);color:#fff;font:600 15px var(--body,system-ui,sans-serif);cursor:pointer}@media(prefers-reduced-motion:reduce){.zz-welcome,.zz-wd,.zz-wd .zc{transition:opacity .2s}}';document.head.appendChild(st)}
function stats(){var s=state(),n=s.streak&&s.streak.n||0,l=(s.learned||[]).length;return{n:n,l:l}}
/* every open: the small banner at the top */
function banner(){css();var st=stats(),sub=st.n>1?'You’re on a '+st.n+'-day revision streak. Keep it glowing!':st.l?st.l+' questions learned so far. One more session builds on that.':'A few questions a day adds up faster than you think.';
  var d=document.createElement('div');d.className='zz-welcome';d.setAttribute('role','status');
  d.innerHTML='<div class="zw-i" aria-hidden="true">✨</div><div class="zw-t"><b></b><span></span></div><button type="button" aria-label="Dismiss">×</button>';
  d.querySelector('b').textContent=greet()+(nm()?', '+nm():'')+', welcome back!';d.querySelector('span').textContent=sub;document.body.appendChild(d);
  var t,close=function(){clearTimeout(t);d.classList.remove('on');setTimeout(function(){d.remove()},600)};d.querySelector('button').onclick=close;
  requestAnimationFrame(function(){requestAnimationFrame(function(){d.classList.add('on')})});t=setTimeout(close,6000)}
/* once a day: a centred card, which also asks for the owner's name */
function daily(away){css();var st=stats(),o=document.createElement('div');o.className='zz-wd';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-labelledby','zz-wh');
  o.innerHTML='<div class="zc"><div class="zi" aria-hidden="true">✨</div><h2 id="zz-wh"></h2><p></p><label for="zz-wn">Your name</label><input id="zz-wn" type="text" maxlength="40" autocomplete="given-name" placeholder="Type your name"><button type="button">Let’s study</button></div>';
  o.querySelector('h2').textContent=greet()+'!';
  o.querySelector('p').textContent=away?'Welcome back — it’s been a little while. Even ten minutes today counts.':st.n>1?'Welcome back! You’re on a '+st.n+'-day revision streak.':'Welcome to your daily revision. A little every day goes a long way.';
  var inp=o.querySelector('input');inp.value=nm();document.body.appendChild(o);
  var done=function(){var v=inp.value.trim().slice(0,40);if(v)set('zzName',v);o.classList.remove('on');setTimeout(function(){o.remove();if(v)banner()},350)};
  o.querySelector('button').onclick=done;inp.onkeydown=function(e){if(e.key==='Enter')done()};
  o.addEventListener('click',function(e){if(e.target===o)done()});
  requestAnimationFrame(function(){requestAnimationFrame(function(){o.classList.add('on')})})}
function maybe(){
  var last=get(K),first=last===null&&get('vivaState')===null;
  if(first){set(K,String(now));return}
  if(document.querySelector('.tour,.tut,[data-tour]'))return;
  if(last===null||now-(+last)>=DAY){var away=last!==null&&now-(+last)>2*DAY;daily(away);set(K,String(now))}
  else banner();
}
function idle(f){(window.requestIdleCallback||function(c){setTimeout(c,1500)})(f,{timeout:4000})}
window.addEventListener('load',function(){setTimeout(maybe,900)});
/* warm-up: once the page is idle, fetch the textbook chapters and decode hero images so later taps feel instant */
window.addEventListener('load',function(){idle(function(){
  try{if(navigator.connection&&(navigator.connection.saveData||/2g/.test(navigator.connection.effectiveType)))return}catch(e){}
  for(var i=1;i<=29;i++)(function(n){var u='textbook/ch'+(n<10?'0':'')+n+'.html';idle(function(){fetch(u,{cache:'force-cache'}).catch(function(){})})})(i);
  document.querySelectorAll('img').forEach(function(im){if(im.decode)im.decode().catch(function(){})});
})});

/* pre-draw: on wide screens, once idle, switch the current page's off-screen sections to "fully rendered" in small time-boxed batches, so nothing pops in while scrolling */
(function(){
var SEL='.card,.qi,.row,.topic,.nh-ch,.nh-mr',gen=0;
function run(){
  var g=++gen;
  if(innerWidth<700)return;
  try{if(navigator.connection&&navigator.connection.saveData)return}catch(e){}
  var v=document.querySelector('.view:not([hidden])');if(!v)return;
  var list=Array.prototype.slice.call(v.querySelectorAll(SEL)).filter(function(e){return !e.dataset.zzp});
  var i=0;
  function step(dl){
    if(g!==gen)return;
    while(i<list.length&&(dl&&dl.timeRemaining?dl.timeRemaining()>6:true)){
      for(var k=0;k<12&&i<list.length;k++,i++){list[i].style.contentVisibility='visible';list[i].dataset.zzp='1'}
      if(!dl||!dl.timeRemaining)break;
    }
    if(i<list.length)(window.requestIdleCallback||function(c){setTimeout(c,60)})(step,{timeout:800});
  }
  (window.requestIdleCallback||function(c){setTimeout(c,300)})(step,{timeout:1500});
}
window.addEventListener('load',function(){setTimeout(run,1800)});
window.addEventListener('hashchange',function(){setTimeout(run,900)});
})();
})();
