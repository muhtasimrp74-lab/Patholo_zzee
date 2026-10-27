
/* ===== liquid.js: Liquid Glass on the navigation layer (bottom bar, its sliding pill, the sticky top bar, the reading-tools
   strip, back to top). Glass is never used on content (cards, answers): that follows Apple's own rule and taste-skill's.
   Refraction: each surface gets an SVG filter whose displacement map is a lens drawn for that surface's exact size and
   corner radius (edges bend the content behind them inward, like the rim of a thick glass). The map is generated on a
   canvas (data: URL, allowed by img-src) and applied with backdrop-filter: url(). Chromium only, tier 3 (Full), not with
   Reduce effects or prefers-reduced-transparency; everywhere else liquid.css gives frosted glass or a solid bar. */
(function(){try{
const de=document.documentElement,NS='http://www.w3.org/2000/svg',UA=navigator.userAgent;
const chromium=/Chrome\/\d/.test(UA)&&!/CriOS|FxiOS|Firefox/.test(UA),RT=matchMedia('(prefers-reduced-transparency: reduce)');
const on=()=>chromium&&(!window.zzTier||zzTier()>=3)&&!RT.matches&&!de.classList.contains('zz-flat');
const T=[['#bnav',10,14,1.8],   /* the selection pill stays a glass bead behind the icons: a lens over the active label made it hard to read */
 ['.view .nav',10,14,1.8],['#tools',8,10,1.2],['.fx-top',8,10,1.2]];   // selector, lens band px, strength, frost
let svg=null,n=0;void 0;const made=new WeakMap();
function lens(w,h,r,band){
 const s=.5,W=Math.max(2,Math.round(w*s)),H=Math.max(2,Math.round(h*s)),c=document.createElement('canvas');c.width=W;c.height=H;
 const g=c.getContext('2d'),im=g.createImageData(W,H),d=im.data,R=Math.min(r,w/2,h/2);
 for(let j=0;j<H;j++)for(let i=0;i<W;i++){
  const x=(i+.5)/s,y=(j+.5)/s,qx=Math.abs(x-w/2)-(w/2-R),qy=Math.abs(y-h/2)-(h/2-R),ox=Math.max(qx,0),oy=Math.max(qy,0);
  const sd=Math.hypot(ox,oy)+Math.min(Math.max(qx,qy),0)-R,t=Math.max(0,Math.min(1,1+sd/band)),m=t*t*(3-2*t);
  let nx=0,ny=0;if(qx>0&&qy>0){const l=Math.hypot(ox,oy)||1;nx=ox/l*Math.sign(x-w/2);ny=oy/l*Math.sign(y-h/2)}else if(qx>qy)nx=Math.sign(x-w/2);else ny=Math.sign(y-h/2);
  const k=(j*W+i)*4;d[k]=128-nx*127*m;d[k+1]=128-ny*127*m;d[k+2]=128;d[k+3]=255}
 g.putImageData(im,0,0);return c.toDataURL()}
function filter(el,band,str,fr){
 const r=el.getBoundingClientRect(),w=Math.round(r.width),h=Math.round(r.height);if(w<8||h<8)return;
 const key=w+'x'+h+'x'+getComputedStyle(el).borderTopLeftRadius;let f=made.get(el);if(f&&f.key===key)return;
 if(!svg){svg=document.createElementNS(NS,'svg');svg.setAttribute('aria-hidden','true');svg.style.cssText='position:absolute;width:0;height:0;overflow:hidden';document.body.append(svg)}
 const id=f?f.id:'zz-lg'+(++n),rad=parseFloat(getComputedStyle(el).borderTopLeftRadius)||0;
 let fe=f&&f.node;if(!fe){fe=document.createElementNS(NS,'filter');fe.id=id;svg.append(fe)}
 fe.setAttribute('x','0');fe.setAttribute('y','0');fe.setAttribute('width',w);fe.setAttribute('height',h);fe.setAttribute('filterUnits','userSpaceOnUse');
 fe.setAttribute('primitiveUnits','userSpaceOnUse');fe.setAttribute('color-interpolation-filters','sRGB');
 fe.innerHTML=`<feGaussianBlur in="SourceGraphic" stdDeviation="${fr}" result="b"/><feImage href="${lens(w,h,rad,band)}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="m"/>`+
  `<feDisplacementMap in="b" in2="m" scale="${str}" xChannelSelector="R" yChannelSelector="G"/>`;
 made.set(el,{id,key,node:fe});el.style.setProperty('--zz-lg','url(#'+id+')');el.classList.add('zz-lg')}
let q=0;
function run(){q=0;
 if(!on()){de.classList.remove('zz-lgon');return}
 de.classList.add('zz-lgon');
 for(const [s,band,str,fr] of T)document.querySelectorAll(s).forEach(el=>{if(el.offsetParent!==null||getComputedStyle(el).position==='fixed')filter(el,band,str,fr)})}
const soon=(ms)=>{clearTimeout(q);q=setTimeout(run,ms||120)};
const ro='ResizeObserver' in window?new ResizeObserver(()=>soon(160)):null;
function watch(){if(!ro)return;for(const [s] of T)document.querySelectorAll(s).forEach(el=>{if(!el.dataset.zzLgw){el.dataset.zzLgw='1';ro.observe(el)}})}
addEventListener('hashchange',()=>{soon(260);setTimeout(watch,300)});addEventListener('resize',()=>soon(200));
new MutationObserver(()=>soon(60)).observe(de,{attributes:true,attributeFilter:['class','data-theme','data-tone']});
RT.addEventListener&&RT.addEventListener('change',()=>soon(0));
setTimeout(()=>{watch();run()},700);
window.zzLiquid={run,on};
}catch(e){}})();
