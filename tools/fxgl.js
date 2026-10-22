
/* ===== fxgl.js: the heavier "specimen bench" visuals, one engine (stage 1 of the cinematic brief) =====
   C2  a living tissue field behind every page (WebGL, H&E tones from the theme, low resolution, capped frame rate)
   C17 the Home hero: the same tissue drifts over the picture, follows a mouse drag, and the objective zooms as you scroll past
   C22 a progress map on Home: one cell per question (learned stained, bookmarked ringed in gold), growing in on first view
   C3  glass tiles: a coverslip edge, a pointer-following glare and up to 6 degrees of tilt (desktop; navigation tiles only)
   C8  smooth wheel scrolling on Home, Chapters and Questions (desktop mouse only; never the reader, never while annotating)
   Rules: only at Visual effects "Full"; never with reduced motion or Save-Data; nothing runs while the tab is hidden; the fields
   animate while you interact (and a few seconds after), then hold still, so an idle page costs nothing. If frames run slow,
   the fields drop to a still image for the rest of the session. Reading text never moves. */
(function(){try{
const de=document.documentElement,$=(s,r)=>(r||document).querySelector(s),st=()=>typeof S!=='undefined'?S:null;
const full=()=>!!(window.zzFx&&zzFx.level()==='full')&&!(navigator.connection&&navigator.connection.saveData);
const FINE=matchMedia('(hover:hover) and (pointer:fine)');
let slow=false;try{slow=sessionStorage.getItem('zzFxSlow')==='1'}catch(e){}

/* ---------- one scheduler: every moving system shares one requestAnimationFrame ---------- */
const sys=new Set(),win=[];let raf=0,lastT=0,awake=0;
const wake=ms=>{awake=Math.max(awake,performance.now()+(ms||8000));kick()};
function kick(){if(!raf&&!document.hidden)raf=requestAnimationFrame(loop)}
function loop(t){
 raf=0;if(document.hidden)return;
 const dt=lastT?t-lastT:16;lastT=t;
 win.push(dt>50?1:0);if(win.length>30)win.shift();
 if(!slow&&win.length>=20&&win.reduce((a,b)=>a+b,0)>=15){slow=true;try{sessionStorage.setItem('zzFxSlow','1')}catch(e){}}   /* frames running slow: the fields hold still for this session */
 let more=false;for(const s of sys){try{if(s.step(t))more=true}catch(e){sys.delete(s)}}
 if(more)raf=requestAnimationFrame(loop);else lastT=0;
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake(3000)});
['scroll','pointermove','pointerdown','keydown','touchstart'].forEach(e=>addEventListener(e,()=>wake(),{passive:true}));

/* ---------- colours from the active theme (so light, sepia and dark all tint correctly) ---------- */
const probe=document.createElement('i');probe.style.display='none';document.body.append(probe);
function col(v,fb){probe.style.color=fb;probe.style.color=v;const m=getComputedStyle(probe).color.match(/[\d.]+/g)||[0,0,0];return [m[0]/255,m[1]/255,m[2]/255]}
const mix=(a,b,k)=>a.map((x,i)=>x+(b[i]-x)*k);

/* ---------- the tissue shader (GLSL ES 1.0): domain-warped stroma, fibres, and nuclei ---------- */
const VS='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const FS='precision mediump float;uniform vec2 R;uniform float T,Z;uniform vec2 P;uniform vec3 C0,C1,C2,C3;'+
 'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}'+
 'float n(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),u.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),u.x),u.y);}'+
 'float fb(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+17.;a*=.5;}return v;}'+
 'float cl(vec2 p){vec2 i=floor(p),f=fract(p);float d=1.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y));vec2 o=vec2(h(i+g),h(i+g+7.));o=.5+.33*sin(T*.12+6.2831*o);d=min(d,length(g+o-f));}return d;}'+
 'void main(){vec2 uv=gl_FragCoord.xy/R.y*Z+P;float t=T*.025;vec2 q=vec2(fb(uv*1.3+t),fb(uv*1.3-t+3.1));float w=fb(uv*1.5+2.*q);'+
 'float fi=fb(uv*vec2(8.,2.)+q*3.);float nu=1.-smoothstep(.07,.15,cl(uv*4.5+q*.8));'+
 'vec3 c=mix(C0,C1,smoothstep(.35,.78,w));c=mix(c,C2,.35*fi);c=mix(c,C3,nu*.9);gl_FragColor=vec4(c,1.);}';
function field(cv){
 const gl=cv.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,premultipliedAlpha:false,preserveDrawingBuffer:false,powerPreference:'low-power'});if(!gl)return null;
 /* no real GPU (a software renderer): skip the fields entirely rather than burn the CPU */
 try{const x=gl.getExtension('WEBGL_debug_renderer_info'),r=x?String(gl.getParameter(x.UNMASKED_RENDERER_WEBGL)):'';if(/swiftshader|llvmpipe|software|basic render|softpipe/i.test(r)){slow=true;return null}}catch(e){}
 const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return gl.getShaderParameter(o,gl.COMPILE_STATUS)?o:null};
 const v=sh(gl.VERTEX_SHADER,VS),f=sh(gl.FRAGMENT_SHADER,FS);if(!v||!f)return null;
 const pr=gl.createProgram();gl.attachShader(pr,v);gl.attachShader(pr,f);gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))return null;gl.useProgram(pr);
 const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
 const a=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
 const U={};['R','T','Z','P','C0','C1','C2','C3'].forEach(k=>U[k]=gl.getUniformLocation(pr,k));
 return{gl,draw(t,z,px,py,c){gl.viewport(0,0,cv.width,cv.height);gl.uniform2f(U.R,cv.width,cv.height);gl.uniform1f(U.T,t/1000);gl.uniform1f(U.Z,z);gl.uniform2f(U.P,px,py);
  gl.uniform3fv(U.C0,c[0]);gl.uniform3fv(U.C1,c[1]);gl.uniform3fv(U.C2,c[2]);gl.uniform3fv(U.C3,c[3]);gl.drawArrays(gl.TRIANGLE_STRIP,0,4)},
  lose(){const x=gl.getExtension('WEBGL_lose_context');if(x)x.loseContext()}};
}

/* ---------- C2: the page backdrop. Very low contrast (a few percent from the page colour), so text stays readable ---------- */
let bg=null;
function bgPal(){const B=col('var(--bg)','#F8F3EE'),pl=col('var(--plum)','#6B2D5C'),ro=col('var(--rosy)','#D98FA8');return[B,mix(B,ro,.13),mix(B,pl,.05),mix(B,pl,.11)]}
function backdrop(){
 if(bg||!full())return;
 const cv=document.createElement('canvas');cv.className='fx-bg';cv.setAttribute('aria-hidden','true');document.body.prepend(cv);
 const F=field(cv);if(!F){cv.remove();return}
 let pal=bgPal(),lastF=0,shown=false,vy=0,py=scrollY;
 const size=()=>{const k=.35;cv.width=Math.max(2,Math.round(innerWidth*k));cv.height=Math.max(2,Math.round(innerHeight*k));lastF=0};size();
 addEventListener('resize',()=>{size();wake(2000)});
 new MutationObserver(()=>{pal=bgPal();lastF=0;wake(1500)}).observe(de,{attributes:true,attributeFilter:['data-theme','data-tone','class']});
 bg={cv,step(t){
  if(!full()){cv.style.opacity='0';return false}
  const live=!slow&&t<awake;if(!live&&lastF)return false;
  if(lastF&&t-lastF<66)return true;lastF=t;   /* ~15 fps is plenty for a slow drift */
  const d=scrollY-py;py=scrollY;vy=vy*.85+d*.15;
  F.draw(t,1.25,t*.00002,scrollY*.00035+vy*.002,pal);
  if(!shown){shown=true;requestAnimationFrame(()=>cv.classList.add('on'))}
  return live}};
 sys.add(bg);wake(4000);
}

/* ---------- C17: the Home hero. The tissue drifts over the picture; drag to move the stage; scrolling past zooms the objective ---------- */
let hero=null;
function heroPal(){const pl=col('var(--plum)','#6B2D5C'),ro=col('var(--rosy)','#D98FA8');return[[.08,.03,.07],mix([.08,.03,.07],ro,.55),mix([.08,.03,.07],pl,.5),mix(pl,[.15,.05,.2],.3)]}
function heroInit(){
 const host=$('#v-home .nh-bn-pic');if(!host||!full()||host.querySelector('.fx-hero'))return;
 const cv=document.createElement('canvas');cv.className='fx-hero';cv.setAttribute('aria-hidden','true');host.append(cv);
 const F=field(cv);if(!F){cv.remove();return}
 if(hero&&hero.F)hero.F.lose();
 let pal=heroPal(),lastF=0,sx=0,sy=0,drag=null,vis=true;
 const size=()=>{const r=host.getBoundingClientRect(),k=.5;cv.width=Math.max(2,Math.round(r.width*k));cv.height=Math.max(2,Math.round(r.height*k));lastF=0};size();
 const io=new IntersectionObserver(es=>{vis=es[0].isIntersecting;if(vis)wake(4000)});io.observe(host);
 if(FINE.matches){host.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY,sx,sy];host.setPointerCapture(e.pointerId)});
  host.addEventListener('pointermove',e=>{if(!drag)return;sx=drag[2]-(e.clientX-drag[0])*.002;sy=drag[3]+(e.clientY-drag[1])*.002;wake()});
  host.addEventListener('pointerup',()=>{drag=null});}
 hero={F,cv,step(t){
  if(!cv.isConnected){io.disconnect();F.lose();sys.delete(hero);hero=null;return false}
  if(!full()||!vis)return false;
  const live=!slow&&t<awake;if(!live&&lastF)return false;if(lastF&&t-lastF<40)return true;lastF=t;
  const r=host.getBoundingClientRect(),k=Math.min(1,Math.max(0,-r.top/Math.max(1,r.height)));   /* 0 at rest, 1 when scrolled past */
  cv.style.opacity=String((1-k)*.42);F.draw(t,1.6-k*.9,sx+t*.00003,sy,pal);   /* the objective zooms in as you scroll */
  return live}};
 sys.add(hero);wake(5000);
}

/* ---------- C22: progress map, one cell per question ---------- */
function colony(){
 const box=$('#v-home .nh-col');if(!box||box.dataset.fx)return;box.dataset.fx='1';
 const D=typeof DATA!=='undefined'?DATA:null,s=st();if(!D||!s){box.hidden=true;return}
 const cv=box.querySelector('canvas'),tip=box.querySelector('.nh-col-tip'),L=new Set(s.learned||[]),B=new Set(s.bm||[]);
 const N=D.length,nL=D.filter(d=>L.has(d[3])).length,nB=D.filter(d=>B.has(d[3])).length;
 cv.setAttribute('role','img');cv.setAttribute('aria-label','Progress map: '+nL+' of '+N+' questions learned, '+nB+' bookmarked');
 const sum=box.querySelector('.nh-col-n');if(sum)sum.textContent=nL+' of '+N+' learned';
 const C={ink:col('var(--plum)','#6B2D5C'),eo:col('var(--rosy)','#D98FA8'),dot:col('var(--line2)','#DCC6D3'),gold:[.84,.68,.41]};
 const rgba=(c,a)=>'rgba('+Math.round(c[0]*255)+','+Math.round(c[1]*255)+','+Math.round(c[2]*255)+','+a+')';
 let cell=0,cols=0,W=0,H=0,dpr=Math.min(2,devicePixelRatio||1),t0=0,grown=false;
 try{grown=sessionStorage.getItem('zzColony')==='1'}catch(e){}
 const lay=()=>{W=box.clientWidth;cell=W<520?9:11;cols=Math.max(10,Math.floor(W/cell));const rows=Math.ceil(N/cols);H=rows*cell;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);cv.style.height=H+'px'};
 function draw(p){const g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);
  for(let i=0;i<N;i++){const id=D[i][3],x=(i%cols+.5)*cell,y=(Math.floor(i/cols)+.5)*cell,l=L.has(id),b=B.has(id);
   const k=p>=1?1:Math.max(0,Math.min(1,p*1.8-((i%cols)/cols+Math.floor(i/cols)*cols/N)*.4));   /* a diagonal sweep that ends exactly at p=1 */const e=1-Math.pow(1-k,3);
   if(l){g.fillStyle=rgba(C.eo,.42);g.beginPath();g.arc(x,y,cell*.46*e,0,7);g.fill();g.fillStyle=rgba(C.ink,.95);g.beginPath();g.arc(x,y,cell*.24*e,0,7);g.fill()}
   else{g.fillStyle=rgba(C.dot,.9);g.beginPath();g.arc(x,y,cell*.16,0,7);g.fill()}
   if(b){g.strokeStyle=rgba(C.gold,.95);g.lineWidth=1.4;g.beginPath();g.arc(x,y,cell*.42*e,0,7);g.stroke()}}}
 lay();
 if(grown||!full()){draw(1)}else{const io=new IntersectionObserver(es=>{if(!es[0].isIntersecting)return;io.disconnect();t0=0;
  const sy={step(t){if(!t0)t0=t;const p=Math.min(1,(t-t0)/1300);draw(p);if(p>=1){try{sessionStorage.setItem('zzColony','1')}catch(e){}sys.delete(sy);return false}return true}};sys.add(sy);wake(2000)});io.observe(box);draw(0)}
 addEventListener('resize',()=>{if(box.isConnected){lay();draw(1)}});
 cv.addEventListener('click',e=>{const r=cv.getBoundingClientRect(),i=Math.floor((e.clientY-r.top)/cell)*cols+Math.floor((e.clientX-r.left)/cell),d=D[i];if(!d||!tip)return;
  tip.hidden=false;tip.innerHTML='';const p=document.createElement('p');p.textContent=d[1];const a=document.createElement('a');a.href='#/'+d[2]+'/'+d[3];a.textContent='Open question';
  const k=document.createElement('span');k.textContent=L.has(d[3])?'Learned':'Not learned yet';tip.append(k,p,a);
  tip.style.left=Math.min(Math.max(8,e.clientX-r.left-120),W-248)+'px';tip.style.top=(e.clientY-r.top+14)+'px'});
 document.addEventListener('click',e=>{if(tip&&!tip.hidden&&!box.contains(e.target))tip.hidden=true});
}

/* ---------- C3: glass tiles (navigation tiles only: reading text never tilts) ---------- */
const TILE='a.topic,.tbtile,.mx-tile';let tq=null,tx=0,ty=0;
document.addEventListener('pointermove',e=>{
 if(!FINE.matches||!full())return;const el=e.target.closest&&e.target.closest(TILE);
 if(tq&&tq!==el){tq.style.removeProperty('--fx-rx');tq.style.removeProperty('--fx-ry');tq.classList.remove('fx-tilt')}
 tq=el;if(!el)return;tx=e.clientX;ty=e.clientY;
 requestAnimationFrame(()=>{if(!tq)return;const r=tq.getBoundingClientRect(),u=(tx-r.left)/r.width,v=(ty-r.top)/r.height;
  tq.classList.add('fx-tilt');tq.style.setProperty('--gx',(u*100).toFixed(1)+'%');tq.style.setProperty('--gy',(v*100).toFixed(1)+'%');
  tq.style.setProperty('--fx-rx',((.5-v)*6).toFixed(2)+'deg');tq.style.setProperty('--fx-ry',((u-.5)*6).toFixed(2)+'deg')});
},{passive:true});

/* ---------- C8: smooth wheel scrolling on Home, Chapters and Questions (desktop mouse; never in the reader or while annotating) ---------- */
let wt=null,wa=0;
addEventListener('wheel',e=>{
 if(!FINE.matches||!full()||e.ctrlKey||e.metaKey||e.shiftKey||document.body.classList.contains('an-on'))return;
 if(!/^(#\/?|#\/home|#\/qa|#\/questions)?$/.test(location.hash||''))return;
 for(let x=e.target;x&&x!==document.body&&x!==de;x=x.parentElement){const o=getComputedStyle(x).overflowY;if((o==='auto'||o==='scroll')&&x.scrollHeight>x.clientHeight+2)return}
 e.preventDefault();const d=e.deltaMode===1?e.deltaY*32:e.deltaMode===2?e.deltaY*innerHeight:e.deltaY;
 wt=Math.max(0,Math.min(de.scrollHeight-innerHeight,(wt==null?scrollY:wt)+d));
 if(!wa)wa=requestAnimationFrame(function go(){const y=scrollY,dy=wt-y;if(Math.abs(dy)<.6){scrollTo({top:wt,behavior:'instant'});wa=0;wt=null;return}
  scrollTo({top:y+dy*.16,behavior:'instant'});wa=requestAnimationFrame(go)});
},{passive:false});
addEventListener('scroll',()=>{if(!wa)wt=null},{passive:true});

/* ---------- boot after the page is up and idle, and again when Home is drawn ---------- */
const home=()=>!location.hash||/^#\/?(home)?$/.test(location.hash);
function boot(){backdrop();if(home())setTimeout(()=>{heroInit();colony()},60)}
const idle=window.requestIdleCallback||(f=>setTimeout(f,300));
addEventListener('load',()=>idle(boot,{timeout:2500}));
addEventListener('hashchange',()=>{if(home())setTimeout(()=>{heroInit();colony()},120)});
const hv=$('#v-home');if(hv)new MutationObserver(()=>{if(home())setTimeout(()=>{heroInit();colony()},60)}).observe(hv,{childList:true,subtree:false});
window.zzFxGl={wake,sys,isSlow:()=>slow};
}catch(e){}})();
