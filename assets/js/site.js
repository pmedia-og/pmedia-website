/* PMedia site — interactions & motion (GSAP 3 + ScrollTrigger)
   All content is visible without JS; GSAP only layers motion on top. */
(function(){
  const doc=document.documentElement;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  window.PM=window.PM||{heroP:0,mx:0,my:0};
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const ARR='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  /* ---------- header / menu / progress ---------- */
  const hdr=$('.hdr');let lastY=0;
  function onScroll(){const y=scrollY;if(hdr)hdr.classList.toggle('hide',y>lastY&&y>500&&!doc.classList.contains('menu-open'));lastY=y;
    const pr=$('.progress i');if(pr){const h=document.body.scrollHeight-innerHeight;pr.style.transform='scaleX('+(h>0?y/h:0)+')'}}
  addEventListener('scroll',onScroll,{passive:true});onScroll();
  const burger=$('.burger');if(burger)burger.addEventListener('click',()=>{const o=doc.classList.toggle('menu-open');burger.setAttribute('aria-expanded',o)});
  $$('.dd>button').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();const o=b.parentElement.classList.toggle('open');b.setAttribute('aria-expanded',o)}));
  document.addEventListener('click',()=>$$('.dd.open').forEach(d=>d.classList.remove('open')));

  /* ---------- pricing tabs ---------- */
  $$('.tabs').forEach(tabs=>{const btns=$$('button',tabs);btns.forEach(b=>b.addEventListener('click',()=>{btns.forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-selected',x===b)});
    const root=tabs.parentElement;$$('.pgroup',root).forEach(g=>g.hidden=g.dataset.g!==b.dataset.g);
    if(window.gsap&&!reduce)gsap.fromTo($$('.pgroup:not([hidden]) .plan',root),{y:30,opacity:0},{y:0,opacity:1,stagger:.08,duration:.7,ease:'power3.out'})}))});

  /* ---------- problem switcher ---------- */
  $$('.sw').forEach(sw=>{const items=$$('.sw-item',sw),panels=$$('.sw-panel',sw);
    const act=i=>{items.forEach((x,k)=>{x.classList.toggle('on',k===i);x.setAttribute('aria-selected',k===i)});panels.forEach((p,k)=>p.classList.toggle('on',k===i));
      if(window.gsap&&!reduce){const img=$('.ph img',panels[i]);if(img)gsap.fromTo(img,{scale:1.15},{scale:1,duration:1.4,ease:'power3.out'})}};
    items.forEach((it,i)=>{it.addEventListener('mouseenter',()=>act(i));it.addEventListener('focus',()=>act(i));it.addEventListener('click',()=>act(i))})});

  /* ---------- gallery filter + load more ---------- */
  $$('[data-filter]').forEach(box=>{const btns=$$('.fbar button',box),tiles=$$('.mas .ph',box),more=$('.more-row button',box);let cat='all',limit=+box.dataset.limit||24;
    const apply=()=>{let shown=0;tiles.forEach(t=>{const ok=cat==='all'||t.dataset.cat===cat;const vis=ok&&shown<limit;if(ok)shown++;t.hidden=!vis});
      if(more)more.parentElement.hidden=tiles.filter(t=>cat==='all'||t.dataset.cat===cat).length<=limit;if(window.ScrollTrigger)ScrollTrigger.refresh()};
    btns.forEach(b=>b.addEventListener('click',()=>{btns.forEach(x=>x.classList.toggle('on',x===b));cat=b.dataset.cat;limit=+box.dataset.limit||24;apply();
      if(window.gsap&&!reduce)gsap.from(tiles.filter(t=>!t.hidden),{y:30,opacity:0,stagger:.025,duration:.6,ease:'power3.out'})}));
    if(more)more.addEventListener('click',()=>{limit+=24;apply()});apply()});

  /* ---------- lightbox (images + YouTube Shorts) ---------- */
  const lb=document.createElement('div');lb.className='lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');
  lb.innerHTML='<button class="x" aria-label="Đóng">×</button><button class="nv pv" aria-label="Ảnh trước"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 6l-6 6 6 6"/></svg></button><div class="inner"></div><button class="nv nx" aria-label="Ảnh sau"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 6l6 6-6 6"/></svg></button>';
  document.body.appendChild(lb);let list=[],idx=0;const inner=$('.inner',lb);
  const show=()=>{const el=list[idx];const img=$('img',el);inner.innerHTML='<img alt="">';const im=$('img',inner);im.src=img.currentSrc||img.src;im.alt=img.alt;lb.classList.remove('vid')};
  const close=()=>{lb.classList.remove('open');setTimeout(()=>inner.innerHTML='',400);doc.style.overflow=''};
  document.addEventListener('click',e=>{const t=e.target.closest('[data-lb]');if(t&&!t.classList.contains('noimg')){const g=t.closest('[data-lbg]')||document;list=$$('[data-lb]',g).filter(x=>!x.hidden&&!x.classList.contains('noimg'));idx=list.indexOf(t);show();$$('.nv',lb).forEach(n=>n.hidden=list.length<2);lb.classList.add('open');doc.style.overflow='hidden';return}
    const y=e.target.closest('[data-yt]');if(y){inner.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+y.dataset.yt+'?autoplay=1&rel=0" title="'+(y.dataset.title||'Video PMedia')+'" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';$$('.nv',lb).forEach(n=>n.hidden=true);lb.classList.add('open');doc.style.overflow='hidden'}});
  $('.x',lb).onclick=close;lb.addEventListener('click',e=>{if(e.target===lb)close()});
  $('.pv',lb).onclick=()=>{idx=(idx-1+list.length)%list.length;show()};$('.nx',lb).onclick=()=>{idx=(idx+1)%list.length;show()};
  addEventListener('keydown',e=>{if(e.key==='Escape'){close();doc.classList.remove('menu-open');$$('.dd.open').forEach(d=>d.classList.remove('open'))}
    if(lb.classList.contains('open')&&list.length>1&&!$('iframe',lb)){if(e.key==='ArrowLeft')$('.pv',lb).click();if(e.key==='ArrowRight')$('.nx',lb).click()}});
  $$('[data-yt],[data-lb]').forEach(el=>{el.setAttribute('tabindex','0');el.setAttribute('role','button');el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click()}})});

  /* ---------- contact form ---------- */
  const form=$('form.cform');
  if(form)form.addEventListener('submit',async e=>{e.preventDefault();const msg=$('.msg',form);const ep=form.dataset.endpoint;
    if(!form.checkValidity()){msg.textContent='Vui lòng điền họ tên và số điện thoại.';return}
    if(!ep){msg.textContent='Form chưa được nối với hệ thống nhận yêu cầu. Bạn vui lòng gọi 0971 352 359 hoặc nhắn Zalo để được tư vấn ngay.';return}
    try{const r=await fetch(ep,{method:'POST',body:new FormData(form)});msg.textContent=r.ok?'PMedia đã nhận yêu cầu và sẽ phản hồi trong 24 giờ làm việc.':'Gửi chưa thành công. Bạn vui lòng gọi 0971 352 359.';if(r.ok)form.reset()}catch(err){msg.textContent='Gửi chưa thành công. Bạn vui lòng gọi 0971 352 359.'}});

  addEventListener('pointermove',e=>{PM.mx=e.clientX/innerWidth-.5;PM.my=e.clientY/innerHeight-.5},{passive:true});

  /* ---------- CSS 3D image ring layout ---------- */
  const ring=$('.ring3d');
  function layoutRing(){if(!ring)return;const figs=$$('figure',ring);const R=ring.clientWidth*.42;figs.forEach((f,i)=>{f.style.transform='translate(-50%,-50%) rotateY('+(i*360/figs.length)+'deg) translateZ('+R+'px)'})}
  layoutRing();addEventListener('resize',layoutRing);

  if(!window.gsap)return;
  doc.classList.add('js');gsap.ticker.lagSmoothing(0);
  if(window.ScrollTrigger)gsap.registerPlugin(ScrollTrigger);

  /* ---------- page transition ---------- */
  const cur=$('.curtain');
  if(cur&&!reduce){gsap.set(cur,{scaleY:1,transformOrigin:'50% 0%'});gsap.to(cur,{scaleY:0,duration:.85,ease:'power4.inOut',delay:.05});
    setTimeout(()=>{if(!cur.dataset.leaving)gsap.set(cur,{scaleY:0})},1700);
    $$('a[href]').forEach(a=>{const href=a.getAttribute('href');if(!href||href.startsWith('#')||a.target==='_blank'||/^(tel|mailto):/.test(href))return;
      if(a.protocol!==location.protocol||a.hostname!==location.hostname)return;
      a.addEventListener('click',e=>{if(e.metaKey||e.ctrlKey||e.shiftKey)return;e.preventDefault();cur.dataset.leaving=1;gsap.set(cur,{transformOrigin:'50% 100%'});gsap.to(cur,{scaleY:1,duration:.55,ease:'power4.inOut',onComplete:()=>{location.href=a.href}})})});
    addEventListener('pageshow',e=>{if(e.persisted){delete cur.dataset.leaving;gsap.set(cur,{scaleY:0})}})}
  else if(cur)cur.remove();

  if(ring&&!reduce){const rot=$('.rot',ring);gsap.set(rot,{rotationX:-12});const spin=gsap.to(rot,{rotationY:'-=360',duration:46,ease:'none',repeat:-1});
    if(window.ScrollTrigger)ScrollTrigger.create({trigger:'.hero',start:'top top',end:'bottom top',onUpdate:s=>gsap.to(spin,{timeScale:1+Math.abs(s.getVelocity())/180,duration:.3,overwrite:true,onComplete:()=>gsap.to(spin,{timeScale:1,duration:1.2})})});
    gsap.from($$('figure',ring),{opacity:0,scale:.6,duration:1.2,stagger:.06,ease:'power3.out',delay:.6})}
  if(reduce)return;

  /* ---------- split words ---------- */
  function split(el){if(el.dataset.split)return $$('.sw0>span',el);el.dataset.split=1;const out=[];
    el.childNodes.forEach(n=>{const cls=n.nodeType===1?(n.className||''):'';if(n.nodeType===1&&n.tagName==='BR'){out.push('<br>');return}
      n.textContent.split(/(\s+)/).forEach(w=>{if(!w)return;if(/^\s+$/.test(w)){out.push(' ');return}
        out.push('<span class="sw0" style="display:inline-block;overflow:hidden;vertical-align:top;padding:0 .04em .14em;margin:0 -.04em -.14em"><span style="display:inline-block" class="'+cls+'">'+w.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</span></span>')})});
    el.innerHTML=out.join('');return $$('.sw0>span',el)}

  /* ---------- hero intro ---------- */
  const hero=$('.hero');
  if(hero){const tl=gsap.timeline({defaults:{ease:'power4.out'},delay:.4});const h1=$('h1',hero);
    tl.from($$('.crumb,.eyebrow',hero),{y:20,opacity:0,duration:.8,stagger:.08});
    if(h1)tl.from(split(h1),{yPercent:115,rotate:5,duration:1.2,stagger:.055},'-=.5');
    tl.from($$('.lead,.acts>*,.tags span',hero),{y:26,opacity:0,duration:.9,stagger:.06},'-=.85')
      .from($$('.hstats>div',hero),{y:40,opacity:0,duration:1,stagger:.08},'-=.7')
      .from($$('.hcard,.badge-spin',hero),{y:80,rotate:12,opacity:0,duration:1.3},'-=1.3');
    const hc=$('.hcard',hero);
    if(hc&&fine){const rx=gsap.quickTo(hc,'rotationY',{duration:.8,ease:'power3'}),ry=gsap.quickTo(hc,'rotationX',{duration:.8,ease:'power3'});addEventListener('pointermove',()=>{rx(PM.mx*16);ry(-PM.my*12)})}
    if(window.ScrollTrigger){ScrollTrigger.create({trigger:hero,start:'top top',end:'bottom top',scrub:true,onUpdate:s=>PM.heroP=s.progress});
      gsap.to($('.hero-c',hero),{y:-110,opacity:.15,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:true}});
      if(hc)gsap.to(hc,{yPercent:-30,rotate:-4,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:true}});
      if(ring)gsap.to(ring,{yPercent:-62,scale:.85,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:true}})}}
  if(!window.ScrollTrigger)return;

  /* ---------- headings & reveals ---------- */
  $$('.sec h2, .ctab h2, .ftr .big').forEach(h=>gsap.from(split(h),{yPercent:115,duration:1.1,ease:'power4.out',stagger:.045,scrollTrigger:{trigger:h,start:'top 86%'}}));
  $$('.shead .eyebrow, .shead p').forEach(el=>gsap.from(el,{y:24,opacity:0,duration:.9,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%'}}));
  ScrollTrigger.batch('[data-r]',{start:'top 88%',once:true,onEnter:els=>gsap.from(els,{y:60,opacity:0,duration:1.05,ease:'power3.out',stagger:.08,overwrite:true})});
  $$('[data-reveal]').forEach(el=>{gsap.fromTo(el,{clipPath:'inset(18% 18% 18% 18% round 40px)'},{clipPath:'inset(0% 0% 0% 0% round 24px)',ease:'none',scrollTrigger:{trigger:el,start:'top 92%',end:'top 35%',scrub:true}});
    const im=$('img',el);if(im)gsap.fromTo(im,{scale:1.35},{scale:1,ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:true}})});
  $$('[data-speed]').forEach(el=>gsap.to(el,{y:()=>-(+el.dataset.speed)*140,ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:true}}));

  /* ---------- counters ---------- */
  $$('[data-count]').forEach(el=>{const v=+el.dataset.count,suf=el.dataset.suf||'';const o={v:0};
    gsap.to(o,{v,duration:2.2,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 94%'},onUpdate:()=>{el.textContent=Math.round(o.v).toLocaleString('vi-VN')+suf}})});

  /* ---------- parallax gallery columns ---------- */
  $$('.pgal').forEach(g=>$$('.col',g).forEach((c,i)=>gsap.fromTo(c,{yPercent:i%2?-6:8},{yPercent:i%2?14:-22,ease:'none',scrollTrigger:{trigger:g,start:'top bottom',end:'bottom top',scrub:.5}})));

  /* ---------- stacked cards ---------- */
  const stks=$$('.stk');stks.forEach((c,i)=>{if(i===stks.length-1)return;gsap.to(c,{scale:.9+i*.015,opacity:.55,ease:'none',scrollTrigger:{trigger:stks[i+1],start:'top 85%',end:'top 110px',scrub:true}})});

  /* ---------- manifesto ---------- */
  $$('.mani').forEach(m=>{if(!m.dataset.w){m.dataset.w=1;const out=[];m.childNodes.forEach(n=>{const acc=n.nodeType===1;n.textContent.split(/(\s+)/).forEach(w=>{if(!w)return;out.push(/^\s+$/.test(w)?' ':'<span class="w'+(acc?' acc':'')+'">'+w+'</span>')})});m.innerHTML=out.join('')}
    const ws=$$('.w',m);ScrollTrigger.create({trigger:m,start:'top 80%',end:'bottom 45%',scrub:true,onUpdate:s=>{const n=Math.round(s.progress*ws.length);ws.forEach((w,i)=>w.classList.toggle('lit',i<n))}})});

  /* ---------- horizontal process ---------- */
  const mm=gsap.matchMedia();
  mm.add('(min-width: 901px)',()=>{$$('.proc').forEach(sec=>{const tr=$('.ptrack',sec),bar=$('.pbar i',sec);if(!tr)return;
    const dist=()=>Math.max(0,tr.scrollWidth-$('.wrap',sec).clientWidth+40);const st=()=>sec.offsetHeight<innerHeight?'center center':'top top';
    if(dist()<40){if(bar)gsap.to(bar,{scaleX:1,ease:'none',scrollTrigger:{trigger:sec,start:'top 70%',end:'bottom 60%',scrub:true}});return}
    const tw=gsap.to(tr,{x:()=>-dist(),ease:'none',scrollTrigger:{trigger:sec,start:st,end:()=>'+='+dist(),pin:true,scrub:.6,invalidateOnRefresh:true,anticipatePin:1}});
    if(bar)gsap.to(bar,{scaleX:1,ease:'none',scrollTrigger:{trigger:sec,start:st,end:()=>'+='+dist(),scrub:.6}});
    $$('.pstep',tr).forEach(s=>gsap.from($('.n',s),{yPercent:70,opacity:0,duration:.8,ease:'power3.out',scrollTrigger:{trigger:s,containerAnimation:tw,start:'left 88%'}}))})});
  mm.add('(max-width: 900px)',()=>{$$('.pstep').forEach(s=>gsap.from(s,{x:-30,opacity:0,duration:.8,ease:'power3.out',scrollTrigger:{trigger:s,start:'top 90%'}}))});

  /* ---------- marquee ---------- */
  $$('.marq').forEach(m=>{const row=$('.row',m);if(!row)return;row.innerHTML+=row.innerHTML;
    const loop=gsap.to(row,{xPercent:-50,ease:'none',duration:34,repeat:-1});
    ScrollTrigger.create({trigger:m,start:'top bottom',end:'bottom top',onUpdate:s=>{const v=s.getVelocity();gsap.to(loop,{timeScale:(1+Math.min(5,Math.abs(v)/250))*(v<0?-1:1),duration:.3,overwrite:true});gsap.to(row,{skewX:gsap.utils.clamp(-10,10,v/-180),duration:.4,overwrite:'auto'})}})});

  /* ---------- shorts float ---------- */
  $$('.short').forEach((s,i)=>gsap.from(s,{y:120+i*40,rotate:i===0?-8:i===2?8:0,opacity:0,duration:1.2,ease:'power3.out',scrollTrigger:{trigger:s.parentElement,start:'top 80%'}}));

  /* ---------- pointer niceties ---------- */
  if(fine){
    $$('.plan').forEach(p=>{const rx=gsap.quickTo(p,'rotationX',{duration:.5,ease:'power3'}),ry=gsap.quickTo(p,'rotationY',{duration:.5,ease:'power3'});
      p.addEventListener('pointermove',e=>{const r=p.getBoundingClientRect();ry(((e.clientX-r.left)/r.width-.5)*10);rx(-((e.clientY-r.top)/r.height-.5)*10)});p.addEventListener('pointerleave',()=>{rx(0);ry(0)})});
    $$('.btn-p,.btn-d,.btn-w,.fab a').forEach(b=>{const qx=gsap.quickTo(b,'x',{duration:.4,ease:'power3'}),qy=gsap.quickTo(b,'y',{duration:.4,ease:'power3'});
      b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();qx((e.clientX-r.left-r.width/2)*.25);qy((e.clientY-r.top-r.height/2)*.35)});b.addEventListener('pointerleave',()=>{qx(0);qy(0)})});
    const c=$('.cursor');if(c){c.innerHTML='<span>Xem</span>';const cx=gsap.quickTo(c,'x',{duration:.3,ease:'power3'}),cy=gsap.quickTo(c,'y',{duration:.3,ease:'power3'});
      addEventListener('pointermove',e=>{cx(e.clientX);cy(e.clientY)});
      $$('a,button,summary,.card,.plan').forEach(el=>{el.addEventListener('pointerenter',()=>c.classList.add('big'));el.addEventListener('pointerleave',()=>c.classList.remove('big'))});
      $$('[data-lb],[data-yt]').forEach(el=>{el.addEventListener('pointerenter',()=>c.classList.add('view'));el.addEventListener('pointerleave',()=>c.classList.remove('view'))})}
  }
  addEventListener('load',()=>ScrollTrigger.refresh());
})();
