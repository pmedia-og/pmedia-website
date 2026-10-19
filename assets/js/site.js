/* PMedia site — interactions & scroll animation (GSAP + ScrollTrigger)
   Content is fully visible without JS; GSAP only adds motion on top. */
(function(){
  const doc=document.documentElement;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.PM=window.PM||{heroP:0,mx:0,my:0};

  /* ---------- header, menu, progress ---------- */
  const hdr=document.querySelector('.hdr');let lastY=0;
  function onScroll(){const y=scrollY;if(hdr){hdr.classList.toggle('solid',y>30);hdr.classList.toggle('hide',y>lastY&&y>400&&!doc.classList.contains('menu-open'));}lastY=y;
    const pr=document.querySelector('.progress i');if(pr){const h=document.body.scrollHeight-innerHeight;pr.style.transform='scaleX('+(h>0?y/h:0)+')'}}
  addEventListener('scroll',onScroll,{passive:true});onScroll();
  const burger=document.querySelector('.burger');
  if(burger)burger.addEventListener('click',()=>{const o=doc.classList.toggle('menu-open');burger.setAttribute('aria-expanded',o)});
  document.querySelectorAll('.dd>button').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();const dd=b.parentElement;const o=dd.classList.toggle('open');b.setAttribute('aria-expanded',o)}));
  document.addEventListener('click',()=>document.querySelectorAll('.dd.open').forEach(d=>d.classList.remove('open')));
  addEventListener('keydown',e=>{if(e.key==='Escape'){doc.classList.remove('menu-open');document.querySelectorAll('.dd.open').forEach(d=>d.classList.remove('open'))}});

  /* ---------- pricing tabs ---------- */
  document.querySelectorAll('.tabs').forEach(tabs=>{const btns=[...tabs.querySelectorAll('button')];btns.forEach(b=>b.addEventListener('click',()=>{btns.forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-selected',x===b)});
    const root=tabs.parentElement;root.querySelectorAll('.pgroup').forEach(g=>{g.hidden=g.dataset.g!==b.dataset.g});if(window.gsap&&!reduce){gsap.fromTo(root.querySelectorAll('.pgroup:not([hidden]) .plan'),{y:30,opacity:0},{y:0,opacity:1,stagger:.08,duration:.7,ease:'power3.out'})}}))});

  /* ---------- contact form ---------- */
  const form=document.querySelector('form.cform');
  if(form)form.addEventListener('submit',async e=>{e.preventDefault();const msg=form.querySelector('.msg');const ep=form.dataset.endpoint;
    if(!ep){msg.textContent='Form chưa được nối với hệ thống nhận yêu cầu. Bạn vui lòng gọi 0971 352 359 hoặc nhắn Zalo để được tư vấn ngay.';return}
    try{const r=await fetch(ep,{method:'POST',body:new FormData(form)});msg.textContent=r.ok?'PMedia đã nhận yêu cầu và sẽ phản hồi trong 24 giờ làm việc.':'Gửi chưa thành công. Bạn vui lòng gọi 0971 352 359.'}catch(err){msg.textContent='Gửi chưa thành công. Bạn vui lòng gọi 0971 352 359.'}});

  /* ---------- pointer ---------- */
  addEventListener('pointermove',e=>{PM.mx=e.clientX/innerWidth-.5;PM.my=e.clientY/innerHeight-.5},{passive:true});
  document.querySelectorAll('.card.glowc').forEach(c=>c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect();c.style.setProperty('--gx',(e.clientX-r.left)+'px');c.style.setProperty('--gy',(e.clientY-r.top)+'px')}));

  if(!window.gsap){return}
  doc.classList.add('js');
  gsap.ticker.lagSmoothing(0);
  if(window.ScrollTrigger)gsap.registerPlugin(ScrollTrigger);
  const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- page transition ---------- */
  const cur=document.querySelector('.curtain');
  if(cur&&!reduce){
    gsap.set(cur,{scaleY:1,transformOrigin:'50% 0%'});gsap.to(cur,{scaleY:0,duration:.8,ease:'power4.inOut',delay:.05});
    setTimeout(()=>{if(gsap.getProperty(cur,'scaleY')>0&&!cur.dataset.leaving)gsap.set(cur,{scaleY:0})},1600);
    document.querySelectorAll('a[href]').forEach(a=>{const href=a.getAttribute('href');
      if(!href||href.startsWith('#')||a.target==='_blank'||href.startsWith('tel:')||href.startsWith('mailto:'))return;
      if(a.protocol!==location.protocol||a.hostname!==location.hostname)return;
      a.addEventListener('click',e=>{if(e.metaKey||e.ctrlKey||e.shiftKey)return;e.preventDefault();cur.dataset.leaving=1;gsap.set(cur,{transformOrigin:'50% 100%'});gsap.to(cur,{scaleY:1,duration:.55,ease:'power4.inOut',onComplete:()=>{location.href=a.href}})})});
    addEventListener('pageshow',e=>{if(e.persisted)gsap.set(cur,{scaleY:0})});
  }else if(cur){cur.remove()}

  if(reduce)return;

  /* ---------- split words ---------- */
  function split(el){if(el.dataset.split)return el.querySelectorAll('.sw>span');el.dataset.split=1;const out=[];
    el.childNodes.forEach(n=>{const cls=n.nodeType===1?(n.className||''):'';const tag=n.nodeType===1?n.tagName.toLowerCase():'';
      if(tag==='br'){out.push('<br>');return}
      n.textContent.split(/(\s+)/).forEach(w=>{if(!w)return;if(/^\s+$/.test(w)){out.push(' ');return}
        out.push('<span class="sw" style="display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.12em;margin-bottom:-.12em"><span style="display:inline-block" class="'+cls+'">'+w.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</span></span>')})});
    el.innerHTML=out.join('');return el.querySelectorAll('.sw>span')}

  /* ---------- hero intro ---------- */
  const hero=document.querySelector('.hero');
  if(hero){const tl=gsap.timeline({defaults:{ease:'power4.out'},delay:.35});
    const h1=hero.querySelector('h1');
    tl.from(hero.querySelectorAll('.crumb,.eyebrow'),{y:20,opacity:0,duration:.8,stagger:.08});
    if(h1)tl.from(split(h1),{yPercent:115,rotate:4,duration:1.15,stagger:.06},'-=.5');
    tl.from(hero.querySelectorAll('.lead,.acts>*,.tags span'),{y:26,opacity:0,duration:.9,stagger:.06},'-=.8')
      .from(hero.querySelectorAll('.hstats>div'),{y:30,opacity:0,duration:.9,stagger:.08},'-=.7');
    if(window.ScrollTrigger){ScrollTrigger.create({trigger:hero,start:'top top',end:'bottom top',scrub:true,onUpdate:s=>{PM.heroP=s.progress}});
      gsap.to(hero.querySelector('.hero-c'),{y:-120,opacity:.2,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:true}})}
  }
  if(!window.ScrollTrigger)return;

  /* ---------- section headings ---------- */
  document.querySelectorAll('.sec h2, .ctab h2, .ftr .big').forEach(h=>{gsap.from(split(h),{yPercent:115,duration:1.1,ease:'power4.out',stagger:.05,scrollTrigger:{trigger:h,start:'top 86%'}})});
  document.querySelectorAll('.shead .eyebrow, .shead p').forEach(el=>gsap.from(el,{y:24,opacity:0,duration:.9,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%'}}));

  /* ---------- generic reveals ---------- */
  ScrollTrigger.batch('[data-r]',{start:'top 88%',once:true,onEnter:els=>gsap.from(els,{y:50,opacity:0,rotateX:-8,transformPerspective:900,duration:1,ease:'power3.out',stagger:.09,overwrite:true})});
  document.querySelectorAll('[data-speed]').forEach(el=>gsap.to(el,{y:()=>-(+el.dataset.speed)*120,ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:true}}));

  /* ---------- counters ---------- */
  document.querySelectorAll('[data-count]').forEach(el=>{const v=+el.dataset.count,suf=el.dataset.suf||'';const o={v:0};
    gsap.to(o,{v,duration:2.2,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 92%'},onUpdate:()=>{el.textContent=Math.round(o.v).toLocaleString('vi-VN')+suf}})});

  /* ---------- horizontal process ---------- */
  const mm=gsap.matchMedia();
  mm.add('(min-width: 861px)',()=>{document.querySelectorAll('.proc').forEach(sec=>{const tr=sec.querySelector('.ptrack');const bar=sec.querySelector('.pbar i');if(!tr)return;
    const dist=()=>Math.max(0,tr.scrollWidth-sec.querySelector('.wrap').clientWidth+40);
    if(dist()<40){if(bar)gsap.to(bar,{scaleX:1,ease:'none',scrollTrigger:{trigger:sec,start:'top 70%',end:'bottom 60%',scrub:true}});return}
    const tw=gsap.to(tr,{x:()=>-dist(),ease:'none',scrollTrigger:{trigger:sec,start:()=>sec.offsetHeight<innerHeight?'center center':'top top',end:()=>'+='+dist(),pin:true,scrub:.6,invalidateOnRefresh:true,anticipatePin:1}});
    if(bar)gsap.to(bar,{scaleX:1,ease:'none',scrollTrigger:{trigger:sec,start:()=>sec.offsetHeight<innerHeight?'center center':'top top',end:()=>'+='+dist(),scrub:.6}});
    tr.querySelectorAll('.pstep').forEach(s=>gsap.from(s.querySelector('.n'),{yPercent:60,opacity:0,duration:.8,ease:'power3.out',scrollTrigger:{trigger:s,containerAnimation:tw,start:'left 85%'}}))})});
  mm.add('(max-width: 860px)',()=>{document.querySelectorAll('.pstep').forEach(s=>gsap.from(s,{x:-30,opacity:0,duration:.8,ease:'power3.out',scrollTrigger:{trigger:s,start:'top 90%'}}))});

  /* ---------- marquee with scroll velocity ---------- */
  document.querySelectorAll('.marq').forEach(m=>{const row=m.querySelector('.row');if(!row)return;row.innerHTML+=row.innerHTML;
    const loop=gsap.to(row,{xPercent:-50,ease:'none',duration:28,repeat:-1});
    ScrollTrigger.create({trigger:m,start:'top bottom',end:'bottom top',onUpdate:s=>{const v=s.getVelocity();gsap.to(loop,{timeScale:1+Math.min(4,Math.abs(v)/300)*(v<0?-1:1),duration:.3,overwrite:true});gsap.to(row,{skewX:gsap.utils.clamp(-8,8,v/-200),duration:.4,overwrite:'auto'})}})});

  /* ---------- pricing tilt, magnetic buttons, cursor ---------- */
  if(fine){
    document.querySelectorAll('.plan').forEach(p=>{const rx=gsap.quickTo(p,'rotationX',{duration:.5,ease:'power3'}),ry=gsap.quickTo(p,'rotationY',{duration:.5,ease:'power3'});
      p.addEventListener('pointermove',e=>{const r=p.getBoundingClientRect();ry(((e.clientX-r.left)/r.width-.5)*10);rx(-((e.clientY-r.top)/r.height-.5)*10)});p.addEventListener('pointerleave',()=>{rx(0);ry(0)})});
    document.querySelectorAll('.btn-p,.btn-w,.fab a').forEach(b=>{const qx=gsap.quickTo(b,'x',{duration:.4,ease:'power3'}),qy=gsap.quickTo(b,'y',{duration:.4,ease:'power3'});
      b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();qx((e.clientX-r.left-r.width/2)*.25);qy((e.clientY-r.top-r.height/2)*.35)});b.addEventListener('pointerleave',()=>{qx(0);qy(0)})});
    const c=document.querySelector('.cursor');if(c){const cx=gsap.quickTo(c,'x',{duration:.35,ease:'power3'}),cy=gsap.quickTo(c,'y',{duration:.35,ease:'power3'});
      addEventListener('pointermove',e=>{cx(e.clientX);cy(e.clientY)});
      document.querySelectorAll('a,button,summary,.card,.plan').forEach(el=>{el.addEventListener('pointerenter',()=>c.classList.add('big'));el.addEventListener('pointerleave',()=>c.classList.remove('big'))})}
  }
  addEventListener('load',()=>ScrollTrigger.refresh());
})();
