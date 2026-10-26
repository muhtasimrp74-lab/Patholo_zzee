
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
['scroll','pointermove','pointerdown','keydown','touchstart'].forEach(e=>addEventListener(e,()=>wake(),{passive:true,capture:true}));

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
const tissue=()=>{const s=st();return !(s&&s.pref&&s.pref.tissue===false)};   /* Menu > Display > Tissue background */
de.classList.toggle('fx-notis',!tissue());
function backdrop(){
 if(bg||!full()||!tissue()||(window.zzTier&&zzTier()<3))return;   /* WebGL is tier 3 only */
 const cv=document.createElement('canvas');cv.className='fx-bg';cv.setAttribute('aria-hidden','true');document.body.prepend(cv);
 const F=field(cv);if(!F){cv.remove();return}
 let pal=bgPal(),lastF=0,shown=false,vy=0,py=scrollY;
 const size=()=>{const k=.35;cv.width=Math.max(2,Math.round(innerWidth*k));cv.height=Math.max(2,Math.round(innerHeight*k));lastF=0};size();
 addEventListener('resize',()=>{size();wake(2000)});
 new MutationObserver(()=>{pal=bgPal();lastF=0;wake(1500)}).observe(de,{attributes:true,attributeFilter:['data-theme','data-tone','class']});
 bg={cv,step(t){
  if(!full()||!tissue()){cv.style.opacity='0';return false}
  const live=!slow&&t<awake;if(!live&&lastF)return false;
  if(lastF&&t-lastF<66)return true;lastF=t;   /* ~15 fps is plenty for a slow drift */
  const Y=(window.zzScroller?zzScroller():document.scrollingElement||document.documentElement).scrollTop,d=Y-py;py=Y;vy=vy*.85+d*.15;
  F.draw(t,1.25,t*.00002,Y*.00035+vy*.002,pal);
  if(!shown){shown=true;requestAnimationFrame(()=>cv.classList.add('on'))}
  return live}};
 sys.add(bg);wake(4000);
}

/* ---------- C17: the Home hero. The tissue drifts over the picture; drag to move the stage; scrolling past zooms the objective ---------- */
let hero=null;
function heroPal(){const pl=col('var(--plum)','#6B2D5C'),ro=col('var(--rosy)','#D98FA8');return[[.08,.03,.07],mix([.08,.03,.07],ro,.55),mix([.08,.03,.07],pl,.5),mix(pl,[.15,.05,.2],.3)]}
function heroInit(){
 const host=$('#v-home .nh-bn-pic');if(!host||!full()||(window.zzTier&&zzTier()<3)||host.querySelector('.fx-hero'))return;
 if(getComputedStyle(host).position==='static')host.style.position='relative';   /* desktop already positions the picture behind the title: leave it */
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
const FONT='"Hanken Grotesk",system-ui,sans-serif';
const sr=()=>{const s=st();return (s&&s.sr&&typeof s.sr==='object')?s.sr:{}};
const inten=(id,now)=>{const o=sr()[id];if(!o)return 0;const b=Math.max(0,Math.min(5,o.b|0)),base=.35+.13*b;if(!(now>o.d))return base;return base*Math.max(.12,1-(now-o.d)/864e5/14)};
function colony(){
 const box=$('#v-home .nh-col');if(!box)return;if(box.dataset.fx){if(box._zzRe)box._zzRe();return}box.dataset.fx='1';
 const D=typeof DATA!=='undefined'?DATA:null,s=st();if(!D||!s){box.hidden=true;return}
 const cv=box.querySelector('canvas'),tip=box.querySelector('.nh-col-tip'),L=new Set(s.learned||[]),B=new Set(s.bm||[]);
 const N=D.length,nL=D.filter(d=>L.has(d[3])).length,nB=D.filter(d=>B.has(d[3])).length;
 cv.setAttribute('role','img');cv.setAttribute('aria-label','Progress map: '+nL+' of '+N+' questions learned, '+nB+' bookmarked');
 const sum=box.querySelector('.nh-col-n');if(sum)sum.textContent=nL+' of '+N+' learned';
 const C={ink:col('var(--plum)','#6B2D5C'),eo:col('var(--rosy)','#D98FA8'),dot:col('var(--line2)','#DCC6D3'),gold:[.84,.68,.41]};
 const rgba=(c,a)=>'rgba('+Math.round(c[0]*255)+','+Math.round(c[1]*255)+','+Math.round(c[2]*255)+','+a+')';
 let cell=0,cols=0,W=0,H=0,dpr=Math.min(2,devicePixelRatio||1),t0=0,grown=false,VH=0,k=0,kmin=1,tx=0,ty=0,mini=null,moved=0;
 box.dataset.noSwipe='';
 try{grown=sessionStorage.getItem('zzColony')==='1'}catch(e){}
 /* whole-slide map: the cells are the world; the canvas is a viewport you pan (drag) and zoom (pinch, ctrl+wheel, objective turret) */
 const clampV=()=>{const ww=W*k,hh=H*k;tx=ww<=W?(W-ww)/2:Math.min(0,Math.max(W-ww,tx));ty=hh<=VH?(VH-hh)/2:Math.min(0,Math.max(VH-hh,ty));cv.style.touchAction=k>kmin*1.01?'none':'pan-y'};
 const lay=()=>{W=box.clientWidth;cell=W<520?9:11;cols=Math.max(10,Math.floor(W/cell));const rows=Math.ceil(N/cols);H=rows*cell;
  VH=Math.min(H,Math.max(220,Math.round(innerHeight*.45)));kmin=Math.min(1,VH/H);if(!k||k<kmin)k=kmin;clampV();cv.width=Math.round(W*dpr);cv.height=Math.round(VH*dpr);cv.style.height=VH+'px';mini=null};
 const CHS=[],TPS=[];D.forEach((d,i)=>{if(!i||d[2]!==D[i-1][2]){const v=document.getElementById('v-'+d[2]);CHS.push([i,((v&&v.dataset.title)||d[2]).split(' | ')[0]])}if(!i||d[4]!==D[i-1][4])TPS.push([i,String(d[4]||'')])});
 function buildMini(){const mw=72,mh=Math.max(20,Math.round(H*mw/W)),m=document.createElement('canvas');m.width=mw*dpr;m.height=mh*dpr;const q=m.getContext('2d'),f=mw/W,now=Date.now();q.scale(dpr,dpr);
  q.fillStyle=rgba(C.dot,.5);q.fillRect(0,0,mw,mh);for(let i=0;i<N;i++){const I=inten(D[i][3],now);if(!I)continue;q.fillStyle=rgba(C.ink,(.9*I).toFixed(2));q.fillRect((i%cols)*cell*f,Math.floor(i/cols)*cell*f,Math.max(1,cell*f),Math.max(1,cell*f))}mini=m}
 function over(g){g.setTransform(dpr,0,0,dpr,0,0);const sc=cell*k,P=(i)=>[tx+((i%cols)+.5)*cell*k,ty+(Math.floor(i/cols)+.5)*cell*k];
  const lab=(t,x,y,f)=>{g.font=f;const w=g.measureText(t).width+12;if(x+w>W)x=W-w-2;if(y<10||y>VH-4)return;g.fillStyle='rgba(255,255,255,.82)';g.beginPath();g.roundRect?g.roundRect(x,y-13,w,18,9):g.rect(x,y-13,w,18);g.fill();g.fillStyle=rgba(C.ink,1);g.fillText(t,x+6,y)};
  let ly=-99;
  if(sc<14)CHS.forEach(([i,t])=>{const[x,y]=P(i);if(y-ly>20){lab(t.slice(0,40),Math.max(2,x-6),y,'600 11px '+FONT);ly=y}});
  else if(sc<30)TPS.forEach(([i,t])=>{const[x,y]=P(i);if(t&&y-ly>18&&x>-40&&x<W){lab(t.slice(0,34),Math.max(2,x-6),y,'600 11px '+FONT);ly=y}});
  else if(sc>=70){g.textAlign='center';g.fillStyle=rgba(C.ink,1);g.font='600 '+Math.round(sc*.13)+'px '+FONT;
   for(let i=0;i<N;i++){const[x,y]=P(i);if(x<-sc||x>W+sc||y<-sc||y>VH+sc)continue;const w=String(D[i][1]||'').split(/\s+/).slice(0,3).join(' ');g.fillText(w.length>22?w.slice(0,21)+'…':w,x,y+sc*.42)}g.textAlign='left'}
  if(k>kmin*1.05){if(!mini)buildMini();const mw=72,mh=mini.height/dpr,mx=W-mw-8,my=8;g.globalAlpha=.92;g.drawImage(mini,mx,my,mw,mh);g.globalAlpha=1;
   g.strokeStyle=rgba(C.ink,.9);g.lineWidth=1.2;const f=mw/W;g.strokeRect(mx+(-tx/k)*f,my+(-ty/k)*f,Math.min(mw,(W/k)*f),Math.min(mh,(VH/k)*f))}
  const n=[1,5,10,50,100,500].find(v=>v*sc>=40)||500,len=Math.min(W*.5,n*sc);g.fillStyle=rgba(C.ink,.85);g.fillRect(10,VH-12,len,3);g.font='600 10px '+FONT;g.fillText(n+' question'+(n>1?'s':'')+' wide',10,VH-17)}
 function zoomAt(nk,sx,sy){nk=Math.max(kmin,Math.min(12,nk));const wx=(sx-tx)/k,wy=(sy-ty)/k;k=nk;tx=sx-wx*k;ty=sy-wy*k;clampV();draw(1);tur()}
 {const pts=new Map();let pinch=null;
  cv.addEventListener('pointerdown',e=>{try{cv.setPointerCapture(e.pointerId)}catch(x){}pts.set(e.pointerId,[e.clientX,e.clientY]);moved=0;if(pts.size===2){const[a,b]=[...pts.values()];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,k}}});
  cv.addEventListener('pointermove',e=>{const o=pts.get(e.pointerId);if(!o)return;const dx=e.clientX-o[0],dy=e.clientY-o[1];pts.set(e.pointerId,[e.clientX,e.clientY]);
   if(pts.size===1){if(k<=kmin*1.01&&e.pointerType==='touch')return;moved+=Math.abs(dx)+Math.abs(dy);tx+=dx;ty+=dy;clampV();draw(1)}
   else if(pts.size===2&&pinch){const[a,b]=[...pts.values()],r=cv.getBoundingClientRect();moved=99;zoomAt(pinch.k*Math.hypot(a[0]-b[0],a[1]-b[1])/pinch.d,(a[0]+b[0])/2-r.left,(a[1]+b[1])/2-r.top)}});
  const up=e=>{pts.delete(e.pointerId);if(pts.size<2)pinch=null};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();const r=cv.getBoundingClientRect();zoomAt(k*Math.exp(-e.deltaY*.01),e.clientX-r.left,e.clientY-r.top)},{passive:false})}
 /* objective turret: 4x chapters as regions, 10x topics, 40x question cells, 100x key terms */
 const OBJ=[['4x',()=>kmin],['10x',()=>Math.max(kmin,16/cell)],['40x',()=>Math.max(kmin,36/cell)],['100x',()=>Math.max(kmin,90/cell)]];
 const turEl=document.createElement('div');turEl.className='nh-tur';turEl.setAttribute('role','group');turEl.setAttribute('aria-label','Objective');
 turEl.innerHTML=OBJ.map((o,i)=>'<button type="button" data-o="'+i+'" aria-pressed="false">'+o[0]+'</button>').join('');cv.before(turEl);
 function tur(){let b=0,bd=1e9;OBJ.forEach((o,i)=>{const d=Math.abs(Math.log(o[1]()/k));if(d<bd){bd=d;b=i}});turEl.querySelectorAll('button').forEach((x,i)=>x.setAttribute('aria-pressed',String(i===b)))}
 turEl.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const to=OBJ[+b.dataset.o][1](),from=k,sx=W/2,sy=VH/2;if(window.zzFx)zzFx.haptic(6);
  if(!full()||(window.zzTier&&zzTier()<2)){zoomAt(to,sx,sy);return}const t1=performance.now(),sy2={step(t){const u=Math.min(1,(t-t1)/320),e2=1-Math.pow(1-u,3);zoomAt(from*Math.pow(to/from,e2),sx,sy);if(u>=1){sys.delete(sy2);return false}return true}};sys.add(sy2);wake(600)});
 function draw(p){const g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,VH);g.setTransform(dpr*k,0,0,dpr*k,dpr*tx,dpr*ty);
  const r0=Math.max(0,Math.floor(-ty/k/cell)-1),r1=Math.ceil((VH-ty)/k/cell)+1;
  const now=Date.now(),tn=performance.now();
  for(let i=Math.min(N,r0*cols);i<Math.min(N,r1*cols);i++){const id=D[i][3],x=(i%cols+.5)*cell,y=(Math.floor(i/cols)+.5)*cell,l=L.has(id),b=B.has(id),I=inten(id,now);
   const k=p>=1?1:Math.max(0,Math.min(1,p*1.8-((i%cols)/cols+Math.floor(i/cols)*cols/N)*.4));   /* a diagonal sweep that ends exactly at p=1 */const e=1-Math.pow(1-k,3);
   /* fading stains: intensity from S.sr only (no entry = unstained, higher box = stronger, fades once overdue) */
   if(I>0){g.fillStyle=rgba(C.eo,(.42*I).toFixed(3));g.beginPath();g.arc(x,y,cell*.46*e,0,7);g.fill();g.fillStyle=rgba(C.ink,(.95*I).toFixed(3));g.beginPath();g.arc(x,y,cell*.24*e,0,7);g.fill()}
   else{g.fillStyle=rgba(C.dot,.9);g.beginPath();g.arc(x,y,cell*.16,0,7);g.fill();if(l){g.strokeStyle=rgba(C.ink,.5);g.lineWidth=1;g.beginPath();g.arc(x,y,cell*.3,0,7);g.stroke()}}
   const rp=rip.get(id);if(rp!==undefined){const u=Math.min(1,(tn-rp)/900);g.strokeStyle=rgba(C.eo,(.9*(1-u)).toFixed(3));g.lineWidth=1.6;g.beginPath();g.arc(x,y,cell*(.3+1.6*u),0,7);g.stroke()}
   if(b){g.strokeStyle=rgba(C.gold,.95);g.lineWidth=1.4;g.beginPath();g.arc(x,y,cell*.42*e,0,7);g.stroke()}}
  over(g)}
 const rip=new Map(),SRK='zzSrSeen';
 const snap=()=>{const o={},S0=sr();for(const k in S0)o[k]=S0[k]&&S0[k].d;try{sessionStorage.setItem(SRK,JSON.stringify(o))}catch(e){}};
 /* Home: the most overdue questions, as a lens under the map */
 function lens(){let f=box.querySelector('.nh-fade');const now=Date.now(),S0=sr(),od=Object.keys(S0).filter(k=>S0[k]&&now>S0[k].d&&document.getElementById(k)).sort((a,b)=>S0[a].d-S0[b].d).slice(0,6);
  if(!od.length){if(f)f.remove();return}if(!f){f=document.createElement('div');f.className='nh-fade';box.append(f)}
  const row=k=>{const c=document.getElementById(k),v=c.closest('.view'),h=c.querySelector('header'),dd=Math.max(1,Math.round((now-S0[k].d)/864e5));
   return '<a href="#/'+(v?v.id.slice(2):'qa')+'/'+k+'"><span>'+((h&&h.textContent)||k).replace(/[&<>]/g,'').slice(0,90)+'</span><small>'+dd+' day'+(dd>1?'s':'')+' overdue</small></a>'};
  f.innerHTML='<p class="nh-fade-h">Fading</p>'+od.map(row).join('')}
 /* back on Home after practice: re-stain the reviewed cells with a ripple */
 box._zzRe=()=>{let seen={};try{seen=JSON.parse(sessionStorage.getItem(SRK)||'{}')}catch(e){}const S0=sr(),t=performance.now();
  for(const k in S0)if(S0[k]&&seen[k]!==S0[k].d&&k in seen||(!(k in seen)&&Object.keys(seen).length&&S0[k]))rip.set(k,t);
  snap();lens();mini=null;
  if(rip.size&&full()&&(!window.zzTier||zzTier()>=2)){const sy={step(n){draw(1);if(n-t>950){rip.clear();draw(1);sys.delete(sy);return false}return true}};sys.add(sy);wake(1500)}else{rip.clear();draw(1)}};
 lay();tur();snap();lens();
 if(grown||!full()){draw(1)}else{const io=new IntersectionObserver(es=>{if(!es[0].isIntersecting)return;io.disconnect();t0=0;
  const sy={step(t){if(!t0)t0=t;const p=Math.min(1,(t-t0)/1300);draw(p);if(p>=1){try{sessionStorage.setItem('zzColony','1')}catch(e){}sys.delete(sy);return false}return true}};sys.add(sy);wake(2000)});io.observe(box);draw(0)}
 addEventListener('resize',()=>{if(box.isConnected){lay();draw(1)}});
 cv.addEventListener('click',e=>{if(moved>6)return;const r=cv.getBoundingClientRect(),wx=(e.clientX-r.left-tx)/k,wy=(e.clientY-r.top-ty)/k,i=Math.floor(wy/cell)*cols+Math.floor(wx/cell),d=wx>=0&&wx<cols*cell?D[i]:null;if(!d||!tip)return;
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
 const sc=(window.zzScroller?zzScroller():document.scrollingElement||document.documentElement);
 for(let x=e.target;x&&x!==sc&&x!==document.body&&x!==de;x=x.parentElement){const o=getComputedStyle(x).overflowY;if((o==='auto'||o==='scroll')&&x.scrollHeight>x.clientHeight+2)return}
 e.preventDefault();const d=e.deltaMode===1?e.deltaY*32:e.deltaMode===2?e.deltaY*innerHeight:e.deltaY;
 wt=Math.max(0,Math.min(sc.scrollHeight-sc.clientHeight,(wt==null?sc.scrollTop:wt)+d));
 if(!wa)wa=requestAnimationFrame(function go(){const y=sc.scrollTop,dy=wt-y;if(Math.abs(dy)<.6){sc.scrollTo({top:wt,behavior:'instant'});wa=0;wt=null;return}
  sc.scrollTo({top:y+dy*.16,behavior:'instant'});wa=requestAnimationFrame(go)});
},{passive:false});
addEventListener('scroll',()=>{if(!wa)wt=null},{passive:true,capture:true});

/* ---------- boot after the page is up and idle, and again when Home is drawn ---------- */
const home=()=>!location.hash||/^#\/?(home)?$/.test(location.hash);
function boot(){backdrop();if(home())setTimeout(()=>{heroInit();colony()},60)}
const idle=window.requestIdleCallback||(f=>setTimeout(f,300));
addEventListener('load',()=>idle(boot,{timeout:2500}));
addEventListener('hashchange',()=>{if(home())setTimeout(()=>{heroInit();colony()},120)});
const hv=$('#v-home');if(hv)new MutationObserver(()=>{if(home())setTimeout(()=>{heroInit();colony()},60)}).observe(hv,{childList:true,subtree:false});
window.zzFxGl={wake:ms=>{if(tissue())backdrop();wake(ms)},sys,isSlow:()=>slow};
}catch(e){}})();
