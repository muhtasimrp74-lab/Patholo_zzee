
/* ===== keep installed copies current =====
   sw.js takes over as soon as a new VERSION is saved, but a page that is already open keeps running the old copy, and an installed
   app resumed from the background never reloads on its own, so it could show an old version for days. This asks the browser to
   look for a new version whenever the app comes back to the screen (at most every 10 minutes) and every 30 minutes while it is
   open, then switches to the new version once it has taken over: straight away if you are not looking, otherwise with a small
   Reload notice, or by itself the next time you come back to the app. Nothing is lost: progress, notes and positions are saved. */
(function(){try{
if(!('serviceWorker' in navigator))return;
const sw=navigator.serviceWorker;let had=!!sw.controller,last=Date.now(),waiting=false,gone=false,bar=null;
const check=()=>{if(document.hidden||Date.now()-last<6e5)return;last=Date.now();sw.getRegistration().then(r=>r&&r.update()).catch(()=>{})};
const reload=()=>{if(gone)return;gone=true;location.reload()};
function notice(){
 if(bar)return;bar=document.createElement('div');bar.className='zz-upd';bar.setAttribute('role','status');
 bar.innerHTML='<span>A new version of Patholo_zzee is ready.</span><button type="button">Reload</button>';
 bar.querySelector('button').onclick=reload;document.body.appendChild(bar);
 const st=document.createElement('style');st.textContent='.zz-upd{position:fixed;z-index:85;left:50%;transform:translateX(-50%);bottom:calc(var(--bn-h,0px) + 12px + env(safe-area-inset-bottom,0px));display:flex;align-items:center;gap:14px;width:max-content;max-width:calc(100vw - 24px);box-sizing:border-box;padding:8px 8px 8px 16px;border-radius:14px;background:var(--text,#2A1627);color:var(--bg,#F8F3EE);font:500 .9rem/1.35 var(--body,system-ui,sans-serif);box-shadow:0 10px 30px rgba(0,0,0,.25)}.zz-upd button{flex:none;min-height:40px;padding:0 16px;border:0;border-radius:10px;background:var(--burgundy,#7A1F36);color:#fff;font:600 .875rem/1 var(--body,system-ui,sans-serif);cursor:pointer}.zz-upd button:focus-visible{outline:2px solid var(--bg,#fff);outline-offset:2px}';
 document.head.appendChild(st);
}
sw.addEventListener('controllerchange',()=>{
 if(!had){had=true;return}            /* first install: the page on screen is already the current one */
 waiting=true;if(document.hidden)reload();else notice();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)return;if(waiting)reload();else check()});
addEventListener('online',()=>{last=0;check()});
setInterval(check,18e5);
}catch(e){}})();
