/* PMedia site — behaviour for the per-service signature visuals. Works without GSAP; uses it when present. */
(function(){
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G=()=>window.gsap;
  const inView=(el,cb,th=.3)=>{const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){cb();io.disconnect()}}),{threshold:th});io.observe(el)};
  const toast=m=>{let t=$('.pm-toast');if(!t){t=document.createElement('div');t.className='pm-toast';t.style.cssText='position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:99;background:#0A1433;color:#fff;font:600 14px "Be Vietnam Pro",sans-serif;padding:11px 18px;border-radius:12px;transition:opacity .3s;pointer-events:none';document.body.appendChild(t)}t.textContent=m;t.style.opacity=1;clearTimeout(t._h);t._h=setTimeout(()=>t.style.opacity=0,1800)};

  /* rotating children (one visible at a time) */
  $$('[data-cycle]').forEach(box=>{const it=[...box.children];let i=0;it[0]&&it[0].classList.add('on');if(reduce||it.length<2)return;setInterval(()=>{it[i].classList.remove('on');i=(i+1)%it.length;it[i].classList.add('on')},+box.dataset.cycle||2800)});

  /* WEBSITE: device switch */
  $$('[data-devs]').forEach(w=>{const br=$('.browser',w);$$('button',w).forEach(b=>b.addEventListener('click',()=>{$$('button',w).forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b)});br.classList.remove('tablet','mobile');if(b.dataset.dev!=='desktop')br.classList.add(b.dataset.dev)}))});
  /* WEBSITE: typing code + checklist */
  $$('[data-build]').forEach(box=>{const code=$('.code',box),lines=JSON.parse(box.dataset.build),lis=$$('.checks li',box);
    const run=()=>{let li=0,ci=0;code.innerHTML='';const step=()=>{if(li>=lines.length){lis.forEach(l=>l.classList.add('done'));setTimeout(()=>{lis.forEach(l=>l.classList.remove('done'));run()},5000);return}
        let el=code.children[li];if(!el){el=document.createElement('div');el.className='ln';code.appendChild(el)}
        const raw=lines[li];ci++;el.innerHTML=hl(raw.slice(0,ci))+'<span class="caret"></span>';
        if(ci>=raw.length){el.innerHTML=hl(raw);li++;ci=0;const k=Math.floor(li/lines.length*lis.length);lis.forEach((l,j)=>l.classList.toggle('done',j<k))}
        setTimeout(step,ci===0?120:18)};step()};
    const hl=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/(&lt;\/?[a-z0-9]+)/g,'<span class="k">$1</span>').replace(/("[^"]*")/g,'<span class="s">$1</span>').replace(/(&lt;!--.*)/,'<span class="c">$1</span>');
    if(reduce){code.innerHTML=lines.map(l=>'<div class="ln">'+hl(l)+'</div>').join('');lis.forEach(l=>l.classList.add('done'));return}
    inView(box,run)});

  /* BRANDING: swatches copy */
  $$('.swatches button').forEach(b=>b.addEventListener('click',()=>{const hex=b.dataset.hex;const done=()=>toast('Đã chép mã màu '+hex);try{navigator.clipboard.writeText(hex).then(done,()=>toast('Mã màu: '+hex))}catch(e){toast('Mã màu: '+hex)}}));

  /* ECOMMERCE: marketplace tabs, countdown, cart */
  $$('.shop').forEach(s=>{$$('.mk button',s).forEach(b=>b.addEventListener('click',()=>{$$('.mk button',s).forEach(x=>x.classList.toggle('on',x===b));s.style.setProperty('--mk',b.dataset.c)}));
    const cd=$('[data-countdown]',s);const tick=()=>{const n=new Date(),m=new Date(n);m.setHours(24,0,0,0);let d=Math.floor((m-n)/1000);const h=String(Math.floor(d/3600)).padStart(2,'0'),mi=String(Math.floor(d%3600/60)).padStart(2,'0'),se=String(d%60).padStart(2,'0');if(cd)cd.textContent=h+':'+mi+':'+se};tick();setInterval(tick,1000);
    const cart=$('.cart b',s);let c=0;const add=()=>{c=c>=99?1:c+1;cart.textContent=c;cart.classList.add('pop');setTimeout(()=>cart.classList.remove('pop'),300)};
    $('.buy',s).addEventListener('click',add);if(!reduce)setInterval(add,2600)});

  /* FANPAGE: configurator */
  $$('[data-conf]').forEach(box=>{const plans=JSON.parse(box.dataset.conf);const btns=$$('.seg button',box);const max=plans[plans.length-1].m;
    const set=i=>{const p=plans[i];btns.forEach((b,k)=>{b.classList.toggle('on',k===i);b.setAttribute('aria-pressed',k===i)});$('.price b',box).textContent=p.price;$('.for',box).textContent=p.for;
      $$('.m',box).forEach((m,k)=>{const el=$('b',m),to=p.m[k];if(G()&&!reduce){const o={v:+el.textContent||0};G().to(o,{v:to,duration:.7,ease:'power2.out',onUpdate:()=>el.textContent=Math.round(o.v)})}else el.textContent=to;$('.bar i',m).style.width=(to/max[k]*100)+'%'})};
    btns.forEach((b,i)=>b.addEventListener('click',()=>set(i)));set(1)});

  /* QUAY CHỤP: timecode */
  $$('[data-timecode]').forEach(el=>{const t0=performance.now();const f=()=>{const t=(performance.now()-t0)/1000;const p=n=>String(Math.floor(n)).padStart(2,'0');el.textContent=p(t/3600)+':'+p(t/60%60)+':'+p(t%60)+':'+p(t*25%25);requestAnimationFrame(f)};f()});

  /* SEO: type query then climb to #1 */
  $$('[data-serp]').forEach(box=>{const q=$('.q .t',box),text=box.dataset.serp,ol=$('ol',box),me=$('li.me',box);
    const run=()=>{let i=0;q.innerHTML='<span class="caret"></span>';ol.appendChild(me);me.classList.remove('top');renum();
      const type=()=>{if(i<=text.length){q.innerHTML=text.slice(0,i)+'<span class="caret"></span>';i++;setTimeout(type,70)}else setTimeout(climb,700)};type()};
    const renum=()=>$$('li',ol).forEach((l,k)=>$('.r',l).textContent=k+1);
    const climb=()=>{const steps=$$('li',ol).length-1;let k=0;const up=()=>{if(k>=steps){me.classList.add('top');setTimeout(run,4500);return}
      const prev=me.previousElementSibling;const r1=me.getBoundingClientRect(),r2=prev.getBoundingClientRect();ol.insertBefore(me,prev);renum();
      if(G()&&!reduce){G().fromTo(me,{y:r1.top-r2.top},{y:0,duration:.55,ease:'power3.inOut'});G().fromTo(prev,{y:r2.top-r1.top},{y:0,duration:.55,ease:'power3.inOut'})}
      k++;setTimeout(up,650)};up()};
    if(reduce){ol.prepend(me);me.classList.add('top');renum();q.textContent=text;return}inView(box,run)});

  /* WEBCARE: live log */
  $$('[data-log]').forEach(box=>{const lines=JSON.parse(box.dataset.log);let i=0;const add=()=>{const d=new Date();const tm=[d.getHours(),d.getMinutes(),d.getSeconds()].map(n=>String(n).padStart(2,'0')).join(':');
    const el=document.createElement('div');const [a,b]=lines[i%lines.length];el.innerHTML='<span class="tm">'+tm+'</span> '+a+' <span class="ok">'+b+'</span>';box.appendChild(el);while(box.children.length>7)box.firstElementChild.remove();i++};
    for(let k=0;k<6;k++)add();if(!reduce)setInterval(add,1700)});

  /* PR: today's date */
  $$('[data-today]').forEach(el=>{const d=new Date();el.textContent='Ngày '+d.getDate()+' tháng '+(d.getMonth()+1)+', '+d.getFullYear()});

  /* ĐÀO TẠO: notebook auto ticks + lesson planner */
  $$('.nb[data-auto]').forEach(nb=>{const li=$$('li',nb);let i=0;if(reduce){li.forEach(l=>l.classList.add('done'));return}setInterval(()=>{if(i>=li.length){li.forEach(l=>l.classList.remove('done'));i=0;return}li[i++].classList.add('done')},900)});
  $$('.lesson').forEach(ls=>{const ins=$$('input',ls),out=$('.prog b',ls),bar=$('.prog .bar i',ls),msg=$('.prog p',ls);
    const upd=()=>{const n=ins.filter(x=>x.checked).length;out.textContent=n+'/'+ins.length;bar.style.width=(n/ins.length*100)+'%';msg.textContent=n===ins.length?'Đủ 5 bước. Sẵn sàng triển khai cùng PMedia.':'Đánh dấu những bước doanh nghiệp bạn đã có.'};
    ins.forEach(x=>x.addEventListener('change',upd));upd()});

  /* funnel + stairs entrance */
  if(G()&&window.ScrollTrigger&&!reduce){const g=G();
    $$('.funnel').forEach(f=>g.from($$('.lv',f),{scaleX:.2,opacity:0,duration:1,ease:'power3.out',stagger:.12,scrollTrigger:{trigger:f,start:'top 80%'}}));
    $$('.stairs').forEach(s=>g.from($$('.stair',s),{yPercent:60,opacity:0,duration:1,ease:'power3.out',stagger:.1,scrollTrigger:{trigger:s,start:'top 80%'}}));
    $$('.cal').forEach(c=>g.from($$('.d',c),{scale:.6,opacity:0,duration:.5,ease:'back.out(2)',stagger:{each:.018,from:'start'},scrollTrigger:{trigger:c,start:'top 80%'}}));
    $$('.stories').forEach(s=>g.from($$('.story',s),{y:60,opacity:0,scale:.7,duration:.9,ease:'back.out(1.6)',stagger:.08,scrollTrigger:{trigger:s,start:'top 85%'}}));
    $$('.sigv').forEach(v=>g.from(v,{y:60,opacity:0,duration:1.3,ease:'power3.out',delay:.5}));
  }
})();
