/* PMedia site — luminous night-sky background (same look as the PMedia F&B 3D piece):
   vertical blue gradient that drifts as you scroll, floating dust, soft bokeh and slanted light beams with depth parallax.
   Plain 2D canvas, fixed behind the page. Tinted by the page accent (--blue on <body>). */
(function(){
  const cv=document.getElementById('skybg');if(!cv)return;
  const g=cv.getContext('2d');const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W=0,H=0,DPR=1;
  const hex=h=>{h=h.trim().replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return[n>>16&255,n>>8&255,n&255]};
  const mix=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
  const css=a=>`rgb(${a[0]},${a[1]},${a[2]})`;
  const acc=hex(getComputedStyle(document.body).getPropertyValue('--blue')||'#1F5BFF');
  const isBrand=Math.abs(acc[0]-31)+Math.abs(acc[1]-91)+Math.abs(acc[2]-255)<30;
  // palette stops along the page (top, mid, bottom of the viewport gradient)
  const P=[['#3C7DFF','#0A2470','#040F33'],['#2C6BFF','#0B2775','#041038'],['#3A86FF','#0C3088','#05143F'],['#5A6CFF','#1B2690','#070C3C'],['#2A8CF2','#0B3A7E','#031A3A'],['#4170FF','#152C8E','#060E3E']].map(r=>r.map(hex));
  const tint=c=>isBrand?c:mix(c,acc,.38);

  function sprite(size,draw){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);return c}
  const dot=sprite(64,(x,s)=>{const r=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=r;x.fillRect(0,0,s,s)});
  const beam=document.createElement('canvas');beam.width=64;beam.height=512;{const x=beam.getContext('2d');const gr=x.createLinearGradient(0,0,0,512);gr.addColorStop(0,'rgba(190,225,255,0)');gr.addColorStop(.35,'rgba(190,225,255,.9)');gr.addColorStop(.7,'rgba(190,225,255,.35)');gr.addColorStop(1,'rgba(190,225,255,0)');x.fillStyle=gr;x.fillRect(0,0,64,512);const gx=x.createLinearGradient(0,0,64,0);gx.addColorStop(0,'rgba(0,0,0,1)');gx.addColorStop(.5,'rgba(0,0,0,0)');gx.addColorStop(1,'rgba(0,0,0,1)');x.globalCompositeOperation='destination-out';x.fillStyle=gx;x.fillRect(0,0,64,512)}

  let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
  const dust=[],bokeh=[],beams=[];
  const warm=[255,200,140],cool=[[255,255,255],[160,214,255],[91,147,255]];
  function build(){dust.length=bokeh.length=beams.length=0;const n=Math.round(Math.min(300,W*H/6500));
    for(let i=0;i<n;i++)dust.push({x:rnd()*W,y:rnd()*H,z:.2+rnd()*.9,s:.6+rnd()*1.6,c:rnd()<.08?warm:cool[Math.floor(rnd()*3)],ph:rnd()*6.28,vx:(rnd()-.5)*.06});
    for(let i=0;i<34;i++)bokeh.push({x:rnd()*W,y:rnd()*H,z:.05+rnd()*.25,s:60+rnd()*220,c:rnd()<.18?warm:cool[1+Math.floor(rnd()*2)],a:.05+rnd()*.12,ph:rnd()*6.28});
    for(let i=0;i<9;i++)beams.push({x:rnd()*W,y:rnd()*H*1.5-H*.25,z:.1+rnd()*.3,w:80+rnd()*170,h:H*1.6,r:(rnd()-.5)*.7,a:.05+rnd()*.07,ph:rnd()*6.28,c:rnd()<.2?'warm':'cool'})}
  function size(){DPR=Math.min(devicePixelRatio||1,1.5);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;cv.style.width=W+'px';cv.style.height=H+'px';g.setTransform(DPR,0,0,DPR,0,0);build()}
  addEventListener('resize',size);size();
  let mx=0,my=0;addEventListener('pointermove',e=>{mx=e.clientX/W-.5;my=e.clientY/H-.5},{passive:true});
  let t=0,last=performance.now(),sy=scrollY,vy=0;
  function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(!reduce)t+=dt;
    const y=scrollY;vy+=((y-sy)-vy)*.2;sy=y;
    const doc=Math.max(1,document.documentElement.scrollHeight-H);const pr=Math.min(1,y/doc)*(P.length-1);const k=Math.floor(pr),f=pr-k,n=Math.min(P.length-1,k+1);
    const top=tint(mix(P[k][0],P[n][0],f)),mid=tint(mix(P[k][1],P[n][1],f)),bot=mix(P[k][2],P[n][2],f);
    const gr=g.createLinearGradient(0,0,W*.25,H);gr.addColorStop(0,css(top));gr.addColorStop(.48,css(mid));gr.addColorStop(1,css(bot));g.globalCompositeOperation='source-over';g.fillStyle=gr;g.fillRect(0,0,W,H);
    // soft glow orbs that follow the pointer a little
    g.globalCompositeOperation='lighter';
    g.globalAlpha=.35;g.drawImage(dot,W*.72-W*.45+mx*-40,-H*.35+my*-30,W*.9,W*.9);
    g.globalAlpha=.22;g.drawImage(dot,-W*.25+mx*30,H*.55+my*24,W*.7,W*.7);
    // beams
    beams.forEach(b=>{const yy=((b.y-y*b.z)%(H*2)+H*2)%(H*2)-H*.6;g.save();g.translate(b.x+mx*30*b.z,yy);g.rotate(b.r+Math.sin(t*.25+b.ph)*.04);g.globalAlpha=b.a*(.75+.25*Math.sin(t*.6+b.ph));g.drawImage(beam,-b.w/2,0,b.w,b.h);g.restore()});
    // bokeh
    bokeh.forEach(b=>{const yy=((b.y-y*b.z)%(H+b.s*2)+H+b.s*2)%(H+b.s*2)-b.s;g.globalAlpha=b.a*(.6+.4*Math.sin(t*.5+b.ph));g.drawImage(dot,b.x-b.s/2+mx*20*b.z,yy-b.s/2,b.s,b.s)});
    // dust
    dust.forEach(d=>{d.x+=d.vx;if(d.x<-10)d.x=W+10;if(d.x>W+10)d.x=-10;const yy=((d.y-y*d.z*.6-t*6*d.z)%H+H)%H;const s=d.s*(1+Math.min(2,Math.abs(vy)*.01));g.globalAlpha=(.35+.65*Math.abs(Math.sin(t*.9+d.ph)))*(.5+d.z*.5);g.drawImage(dot,d.x+mx*16*d.z-s*2,yy-s*2,s*4,s*4)});
    g.globalAlpha=1;g.globalCompositeOperation='source-over';
    requestAnimationFrame(frame)}
  requestAnimationFrame(frame);
})();
