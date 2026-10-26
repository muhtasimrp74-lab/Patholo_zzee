
/* ===== share.js: one tap draws a progress card (a stained slide, the streak, "stained X of N") and shares it
   (Web Share with a file, or a download). Button sits in the Home progress map header. Reads S only. */
(function(){try{
const st=()=>typeof S!=='undefined'?S:null,cs=getComputedStyle(document.documentElement),v=(k,d)=>(cs.getPropertyValue(k)||'').trim()||d;
async function card(){
 const s=st()||{},D=typeof DATA!=='undefined'?DATA:[],N=D.length||1310,sr=s.sr||{},now=Date.now();
 const X=D.filter(d=>sr[d[3]]).length,streak=(s.streak&&+s.streak.n)||0;
 try{await Promise.all(['400 80px "DM Serif Display"','600 40px "Hanken Grotesk"','italic 500 40px Newsreader'].map(f=>document.fonts.load(f)))}catch(e){}
 const W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
 const bg=v('--bg','#F8F3EE'),ink=v('--text','#2A1627'),mu=v('--muted','#735F70'),eo=v('--rosy','#D98FA8'),pl=v('--plum2','#6B2D5C'),bu=v('--burgundy','#7A1F36');
 g.fillStyle=bg;g.fillRect(0,0,W,H);
 /* the slide: frosted glass, label at one end, a stained section of cells (stain strength from S.sr) */
 const sx=90,sy=170,sw=900,sh=640;g.save();g.shadowColor='rgba(0,0,0,.18)';g.shadowBlur=40;g.shadowOffsetY=18;g.fillStyle='rgba(255,255,255,.55)';rr(g,sx,sy,sw,sh,28);g.fill();g.restore();
 g.fillStyle=bu;rr(g,sx,sy,190,sh,28);g.fill();g.fillStyle='#fff';g.font='600 30px "Hanken Grotesk", sans-serif';g.save();g.translate(sx+108,sy+sh/2);g.rotate(-Math.PI/2);g.textAlign='center';g.fillText('Patholo_zzee',0,0);g.restore();
 const cx=sx+190+40,cy=sy+40,cw=sw-190-80,ch=sh-80,cell=Math.max(9,Math.floor(Math.sqrt(cw*ch/N))),cols=Math.floor(cw/cell);
 g.save();rr(g,cx,cy,cw,ch,cw/2);g.clip();
 for(let i=0;i<N;i++){const d=D[i],o=d&&sr[d[3]],x=cx+(i%cols+.5)*cell,y=cy+(Math.floor(i/cols)+.5)*cell;if(y>cy+ch)break;
  if(o){const b=Math.max(0,Math.min(5,o.b|0)),a=(.35+.13*b)*(now>o.d?Math.max(.12,1-(now-o.d)/864e5/14):1);
   g.globalAlpha=.45*a;g.fillStyle=eo;g.beginPath();g.arc(x,y,cell*.48,0,7);g.fill();g.globalAlpha=.95*a;g.fillStyle=pl;g.beginPath();g.arc(x,y,cell*.24,0,7);g.fill()}
  else{g.globalAlpha=.35;g.fillStyle=mu;g.beginPath();g.arc(x,y,cell*.12,0,7);g.fill()}}
 g.restore();g.globalAlpha=1;
 g.fillStyle=ink;g.textAlign='left';g.font='400 84px "DM Serif Display", Georgia, serif';g.fillText('Stained '+X.toLocaleString('en-GB')+' of '+N.toLocaleString('en-GB'),90,960);
 g.font='600 40px "Hanken Grotesk", sans-serif';g.fillStyle=mu;g.fillText(streak?streak+'-day streak':'Starting a streak',90,1030);
 g.font='italic 500 38px Newsreader, Georgia, serif';g.fillStyle=bu;g.fillText('Pathology, one slide at a time.',90,1240);
 return new Promise(r=>c.toBlob(r,'image/png'));
}
function rr(g,x,y,w,h,r){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
async function share(b){
 b.disabled=true;try{const blob=await card();if(!blob)return;const f=new File([blob],'patholo-zzee-progress.png',{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:'My pathology progress'})}catch(e){}return}
  const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=f.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}
 finally{b.disabled=false}}
function place(){const h=document.querySelector('#v-home .nh-col-hd');if(!h||h.querySelector('.zz-share'))return;
 const b=document.createElement('button');b.type='button';b.className='zz-share';b.textContent='Share';b.setAttribute('aria-label','Share a progress card');
 b.style.cssText='margin-left:auto;min-height:34px;padding:0 14px;border-radius:99px;border:1px solid var(--line2);background:var(--panel);color:var(--lbl);font:600 .82rem var(--body);cursor:pointer';
 b.onclick=()=>share(b);h.append(b)}
addEventListener('hashchange',()=>setTimeout(place,300));(window.requestIdleCallback||setTimeout)(place,{timeout:4000});
}catch(e){}})();
