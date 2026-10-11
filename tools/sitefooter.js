
/* ===== site footer (all pages): artwork banner with credits, site links, notes. Replaces the old one-word footer. ===== */
(function(){
const L=(h,t)=>{const a=document.createElement('a');a.href=h;a.textContent=t;return a};
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e};
function col(title,links){const d=el('nav','sf-col');d.setAttribute('aria-label',title);d.appendChild(el('h2','',title));links.forEach(x=>d.appendChild(L(x[0],x[1])));return d}
function build(){
 if(document.querySelector('footer.sf'))return;
 const f=el('footer','sf');
 const hero=el('div','sf-hero');
 hero.innerHTML='<picture><source media="(max-width:720px)" srcset="icons/footer-banner-900.webp" width="900" height="223"><img src="icons/footer-banner.webp" width="1600" height="397" alt="" loading="lazy" decoding="async"></picture>';
 const cr=el('div','sf-credit');
 cr.appendChild(el('p','sf-k','Created by'));cr.appendChild(el('p','sf-name','Muhtasim Ahmed'));
 cr.appendChild(el('p','sf-sub','Netrokona Medical College'));cr.appendChild(el('p','sf-sub','Session 2022-23'));
 hero.appendChild(cr);f.appendChild(hero);
 const m=el('div','sf-main');
 const b=el('div','sf-brand');b.appendChild(el('p','sf-logo','Patholo_zzee'));
 b.appendChild(el('p','sf-about','Pathology viva, written and MCQ revision with full answers, built around the NMC viva list and Robbins 11th edition. Chapters you open are saved for offline reading.'));
 m.appendChild(b);
 m.appendChild(col('Study',[['#/','Home'],['#/questions','Questions'],['#/qa','Chapters'],['#/practice','Practice'],['#/mcqs','MCQs'],['#/textbook','Textbook']]));
 m.appendChild(col('Your space',[['#/bookmarks','Bookmarks'],['#/favourites','Favourites'],['#/notes','Notes'],['#/menu','Menu and backup'],['#/howto','How to read']]));
 f.appendChild(m);
 const bt=el('div','sf-bot');
 const p=el('p','sf-legal');p.textContent='\u00A9 '+new Date().getFullYear()+' Muhtasim Ahmed. For exam revision only; not medical or clinical advice, so check against your prescribed textbooks. Robbins and Cotran Pathologic Basis of Disease belongs to its authors and publisher, and this site is not affiliated with them or with the NMC.';
 bt.appendChild(p);
 const up=el('button','sf-top','Back to top \u2191');up.type='button';
 up.addEventListener('click',()=>{const rm=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;window.scrollTo({top:0,behavior:rm?'auto':'smooth'})});
 bt.appendChild(up);f.appendChild(bt);
 const old=document.querySelector('body > footer');
 if(old)old.replaceWith(f);else{const v=[...document.querySelectorAll('body > .view')].pop();if(v)v.after(f);else document.body.appendChild(f)}
}
build();addEventListener('load',build);
/* keep the footer's bottom padding equal to the real height of the fixed bottom bar */
function bh(){const n=document.getElementById('bnav');if(n&&n.offsetHeight)document.documentElement.style.setProperty('--bn-h',n.offsetHeight+'px')}
bh();addEventListener('load',bh);addEventListener('resize',bh);addEventListener('orientationchange',bh);
if(window.ResizeObserver){const n=document.getElementById('bnav');if(n)new ResizeObserver(bh).observe(n)}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(bh);
})();
