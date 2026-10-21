/* PMedia video 3D – trình phát: cuộn tự động, giọng đọc, phụ đề.
   Phần video nằm trong khối #xwrap ở đầu trang: khung nhìn dính (sticky) giữ sân khấu #xstage, sân khấu dịch chuyển bằng transform (GPU).
   Khi không phát, thanh cuộn của trang điều khiển vị trí (được làm mượt); cuộn hết khối video thì trang tiếp tục bình thường. */
(function(){
'use strict';
const ST=window.STORY, VO=window.PM_VOICE||null;
if(VO){const sc=[...document.scripts].find(x=>/giong-doc\.js(\?|$)/.test(x.src));if(sc)VO.base=new URL('.',sc.src).href}
const $=s=>document.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const LEAD=.55,GAP=.34,TAIL=.5,TR=1.75,DRIFT=.07,OFF=.035,LAST_HOLD=2.4;
const eio=q=>q<.5?4*q*q*q:1-Math.pow(-2*q+2,3)/2;                       // easeInOutCubic
const ieio=e=>e<.5?Math.cbrt(e/4):1-Math.cbrt(2-2*e)/2;                   // inverse
const easeO=x=>1-Math.pow(1-x,3);

// ---------- lời thoại & dòng thời gian ----------
const L=[];
ST.scenes.forEach((sc,k)=>sc.lines.forEach((ln,j)=>{const say=ln[1]||ln[0];L.push({k,j,d:ln[0],s:say,est:est(say),dur:0,a:0})}));
function est(s){const w=s.trim().split(/\s+/).length,p=(s.match(/[,;:]/g)||[]).length,e=(s.match(/[.!?]/g)||[]).length;return .35+w/4.1+p*.17+e*.22}
let F=1,lockT=true,lastSet=0; // hệ số tốc độ đọc thực tế / ước tính (tự học khi đọc bằng giọng trình duyệt)
L.forEach((l,i)=>l.dur=VO&&VO.d&&VO.d[i]?VO.d[i]:l.est);
const SCN=ST.scenes.map(()=>({s:0,hold:0,e:0,lw:[],iw:[]}));
let DUR=0;
function layout(){
  let t=0;
  ST.scenes.forEach((sc,k)=>{const o=SCN[k];o.s=t;let c=t+(k===0?.9:LEAD);o.lw=[];
    L.filter(l=>l.k===k).forEach(l=>{l.a=c;o.lw.push([c-t,c-t+l.dur]);c+=l.dur+GAP});
    o.hold=c-GAP+TAIL;o.e=k===ST.scenes.length-1?o.hold+LAST_HOLD:o.hold+TR;
    // cửa sổ thời gian của từng mục: chia đều trong lời thoại nhắc tới nó
    const by={};(sc.items||[]).forEach((li,i)=>{(by[li]=by[li]||[]).push(i)});o.iw=[];
    Object.keys(by).forEach(li=>{const w=o.lw[li]||o.lw[o.lw.length-1],m=by[li].length;by[li].forEach((i,n)=>{const a=w[0]+(w[1]-w[0])*n/m,b=w[0]+(w[1]-w[0])*(n+1)/m;o.iw[i]=[a,b]})});
    t=o.e});
  DUR=t;
}
layout();
const NS=SCN.length;
const sceneAt=t=>{let k=0;for(let i=0;i<NS;i++)if(t>=SCN[i].s)k=i;return k};
function posOf(t){const k=sceneAt(t),o=SCN[k];
  if(k===NS-1)return k-OFF+DRIFT*cl((t-o.s)/(o.e-o.s));
  if(t<o.hold)return k-OFF+DRIFT*cl((t-o.s)/(o.hold-o.s));
  return k-OFF+DRIFT+(1-DRIFT)*eio(cl((t-o.hold)/TR))}
function tOf(pos){pos+=OFF;let k=Math.floor(pos);k=cl(k,0,NS-1);const o=SCN[k],d=pos-k;
  if(k===NS-1)return Math.min(DUR-.01,o.s+cl(d/DRIFT)*(o.e-o.s));
  if(d<=DRIFT)return o.s+cl(d/DRIFT)*(o.hold-o.s);
  return o.hold+ieio(cl((d-DRIFT)/(1-DRIFT)))*TR}

// ---------- trạng thái dùng chung với cảnh 3D ----------
const APP=window.APP={t:0,pos:-OFF,k:0,playing:false,started:false,vh:innerHeight,portrait:false,mx:0,my:0,SCN,
  lt:i=>(!APP.started&&i===0)?9:(APP.manual&&!APP.playing&&i<=APP.pos+.55)?99:APP.t-SCN[i].s};

// ---------- chữ: tách từ cho tiêu đề ----------
$$('.x-h').forEach(h=>{let i=0;const out=[];h.childNodes.forEach(n=>{const ac=n.nodeType===1;n.textContent.split(/(\s+)/).forEach(w=>{if(!w)return;if(/^\s+$/.test(w)){out.push(' ');return}
  out.push('<span class="x-w"><span class="'+(ac?'x-ac':'')+'" style="--i:'+(i++)+'">'+w.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</span></span>')})});h.innerHTML=out.join('')});

const secs=$$('.x-sec');
function parseAt(v,k){if(v==null||v==='')return 0;v=String(v);const o=SCN[k];const m=v.match(/^([LI])(\d+)([+-][\d.]+)?$/);
  if(!m)return +v;const arr=m[1]==='L'?o.lw:o.iw;const w=arr[+m[2]]||arr[arr.length-1]||[0,0];return w[0]+(m[3]?+m[3]:0)}
let REV,HL,CNT;
function bind(){
  REV=secs.map((s,k)=>$$('[data-at]',s).map(e=>({e,at:parseAt(e.dataset.at,k),on:false})));
  HL=secs.map((s,k)=>$$('[data-item]',s).map(e=>{const w=SCN[k].iw[+e.dataset.item]||[1e9,1e9];return{e,a:w[0],b:w[1],st:0}}));
  CNT=secs.map((s,k)=>$$('[data-cnt]',s).map(e=>{const w=SCN[k].iw[+e.closest('[data-item]').dataset.item]||[0,1];return{e,v:+e.dataset.cnt,a:w[0]+.1,f:e.dataset.suf||'',last:''}}));
}
bind();
const fmt=v=>Math.round(v).toLocaleString('vi-VN');

// ---------- khung điều khiển ----------
const stage=$('#xstage'),wrap=$('#xwrap'),capEl=$('#cap'),capT=$('#capt'),track=$('#track'),rail=$('#rail');
function setVH(){APP.vh=innerHeight;document.documentElement.style.setProperty('--x-vh',innerHeight+'px');APP.portrait=innerWidth/innerHeight<.9||innerWidth<760;
  wrap.style.height=((NS-1+DRIFT+.1)*APP.vh+innerHeight)+'px';if(!APP.playing)setScroll()}
setVH();addEventListener('resize',setVH);
const mm=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
function ticks(){$$('.x-tick',track).forEach(x=>x.remove());SCN.forEach((o,k)=>{if(!k)return;const d=document.createElement('div');d.className='x-tick';d.style.left=(o.s/DUR*100)+'%';track.appendChild(d)});
  const b=$('#durl');if(b)b.textContent=mm(DUR)}
ST.scenes.forEach((sc,k)=>{const b=document.createElement('button');b.innerHTML='<span>'+sc.label+'</span>';b.setAttribute('aria-label',sc.label);b.onclick=()=>go(k);rail.appendChild(b)});
ticks();
const railB=[...rail.children];

// ---------- giọng đọc ----------
const N={mode:'none',voice:null,voices:[],cur:-1,u:null,t0:0,frac:0,muted:false,rate:1,au:null,warned:false};
const vScore=v=>{const n=v.name;return(/HoaiMy|NamMinh/i.test(n)?50:0)+(/Natural|Online|Neural/i.test(n)?20:0)+(/Google/i.test(n)?10:0)+(v.localService?0:2)};
function loadVoices(){if(!('speechSynthesis' in window))return;const vs=speechSynthesis.getVoices().filter(v=>/^vi(-|_|$)/i.test(v.lang));vs.sort((a,b)=>vScore(b)-vScore(a));N.voices=vs;
  let pref=null;try{pref=localStorage.getItem('pmVoice')}catch(e){}
  if(!N.voice||!vs.includes(N.voice))N.voice=vs.find(v=>v.name===pref)||vs[0]||null;
  if(!VO)N.mode=N.voice?'speech':'none';$('#vbtn').classList.toggle('x-na',vs.length<2)}
if(VO&&VO.base){N.mode='file'}else if('speechSynthesis' in window){loadVoices();speechSynthesis.onvoiceschanged=loadVoices}
function tailText(s,frac){const w=s.split(/\s+/);const i=Math.min(w.length-1,Math.floor(w.length*frac));return w.slice(i).join(' ')}
function say(i,frac=0){stopVoice();if(N.muted||N.mode==='none')return;N.cur=i;N.t0=performance.now();N.frac=frac;
  if(N.mode==='file'){const a=new Audio(VO.base+String(i+1).padStart(2,'0')+'.mp3');N.au=a;a.onended=a.onerror=()=>{if(N.au===a){N.au=null;N.cur=-1}};
    a.addEventListener('loadedmetadata',()=>{if(frac>0)try{a.currentTime=frac*a.duration}catch(e){}},{once:true});const p=a.play();if(p&&p.catch)p.catch(()=>{N.au=null;N.cur=-1});prefetch(i+1);return}
  const u=new SpeechSynthesisUtterance(frac>.05?tailText(L[i].s,frac):L[i].s);u.lang='vi-VN';if(N.voice)u.voice=N.voice;u.rate=N.rate;
  u.onend=u.onerror=()=>{if(N.u!==u)return;N.u=null;N.cur=-1;learn(i,(performance.now()-N.t0)/1000,frac)};N.u=u;
  speechSynthesis.speak(u)}
const pf={};function prefetch(i){if(i<L.length&&!pf[i]){pf[i]=new Audio(VO.base+String(i+1).padStart(2,'0')+'.mp3');pf[i].preload='auto'}}
function stopVoice(){N.cur=-1;if(N.au){N.au.pause();N.au=null}if(N.u){N.u=null;try{speechSynthesis.cancel()}catch(e){}}}
function learn(i,secs,frac){if(N.mode!=='speech'||secs<.6)return;const exp=L[i].est*(1-frac);if(exp<1)return;const r=cl(secs/exp,.6,1.8);
  F=cl(F*.6+r*.4,.7,1.6);let ch=false;for(let j=i+1;j<L.length;j++){const nd=L[j].est*F;if(Math.abs(nd-L[j].dur)>.05){L[j].dur=nd;ch=true}}
  if(ch){layout();bind();ticks()}}
function lineEnd(i){return L[i].a+L[i].dur}
function speakingGate(){if(N.cur<0)return 1;const i=N.cur,gate=lineEnd(i)+.45;
  const age=(performance.now()-N.t0)/1000;if(age>L[i].est*2.6+5){stopVoice();return 1}   // phòng khi trình duyệt "kẹt"
  return cl((gate-APP.t)/.55,0,1)}
function resumeVoice(){const t=APP.t;for(let i=0;i<L.length;i++){if(t>=L[i].a&&t<lineEnd(i)){const fr=(t-L[i].a)/L[i].dur;if(fr<.8)say(i,fr<.06?0:fr);return}}}

// ---------- vòng lặp ----------
function W0(){return wrap.getBoundingClientRect().top+scrollY}
function setScroll(){lastSet=Math.max(0,Math.round(W0()+(posOf(APP.t)+OFF)*APP.vh));scrollTo(0,lastSet)}
let cur=-1,capIdx=-2,last=performance.now(),uiHidden=false,idle=0,smooth=APP.pos,target=APP.pos,capOn=true,prevT=0;
function setScene(k){if(k===cur)return;cur=k;document.body.classList.toggle('x-at0',k===0);railB.forEach((b,i)=>b.classList.toggle('x-now',i===k));
  // cảnh ở xa: cảnh đã qua hiện đủ, cảnh chưa tới ẩn để lần sau xuất hiện lại có hiệu ứng
  secs.forEach((s,i)=>{if(Math.abs(i-k)<=1)return;REV[i].forEach(o=>{const on=i<k;if(o.on!==on){o.on=on;o.e.classList.toggle('x-in',on)}});
    HL[i].forEach(o=>{const st=i<k?2:0;if(o.st!==st){o.st=st;o.e.classList.toggle('x-hl',false);o.e.classList.toggle('x-done',st===2)}})})}
function render(dt){
  const t=APP.t,k=sceneAt(t);setScene(k);APP.k=k;
  for(let i=Math.max(0,k-1);i<=Math.min(NS-1,k+1);i++){const lt=APP.lt(i);
    REV[i].forEach(o=>{const on=lt>=o.at;if(on!==o.on){o.on=on;o.e.classList.toggle('x-in',on)}});
    HL[i].forEach(o=>{const st=lt>=o.b?2:lt>=o.a?1:0;if(st!==o.st){o.st=st;o.e.classList.toggle('x-hl',st===1);o.e.classList.toggle('x-done',st===2)}});
    CNT[i].forEach(o=>{const p=cl((lt-o.a)/1.6);const s=fmt(o.v*easeO(p))+(p>0?o.f:'');if(s!==o.last){o.last=s;o.e.textContent=s}})}
  // sân khấu
  const y=-smooth*APP.vh;stage.style.transform='translate3d(0,'+y.toFixed(2)+'px,0)';
  for(let i=0;i<NS;i++){const off=i-smooth,vis=Math.abs(off)<1.08;const s=secs[i];if(s._v!==vis){s._v=vis;s.style.visibility=vis?'visible':'hidden'}if(vis)s.style.setProperty('--x-o',off.toFixed(4))}
  // phụ đề
  let ci=N.cur>=0?N.cur:-1;if(ci<0)for(let i=0;i<L.length;i++)if(t>=L[i].a-.05&&t<lineEnd(i)+GAP*.6){ci=i;break}
  if(!APP.started)ci=-1;
  if(ci!==capIdx){capIdx=ci;capT.classList.add('x-out');if(ci>=0){const txt=L[ci].d;setTimeout(()=>{if(capIdx===ci){capT.textContent=txt;capT.classList.remove('x-out')}},170)}}
  capEl.classList.toggle('x-hide',!capOn||!APP.started);
  const pr=t/DUR;$('#trp').style.transform='scaleX('+pr.toFixed(4)+')';
  const tm=mm(t)+' / '+mm(DUR);if(render.tm!==tm){render.tm=tm;$('#time').textContent=tm}
}
function tick(now){const rdt=Math.min(.1,(now-last)/1000);last=now;const dt=rdt;
  if(APP.playing){
    const sp=N.mode!=='none'&&!N.muted?speakingGate():1;prevT=APP.t;APP.t=Math.min(DUR-.02,APP.t+dt*sp);
    if(N.mode!=='none'&&!N.muted){for(let i=0;i<L.length;i++){const a=L[i].a;if(prevT<a&&APP.t>=a){say(i);break}}}
    if(APP.t>=DUR-.03){pause();showUI()}
    target=posOf(APP.t);smooth+=(target-smooth)*Math.min(1,dt*16);
    idle+=dt;if(idle>2.4&&!uiHidden&&!APP.manualHide)hideUI();
  }else if(lockT){target=posOf(APP.t);smooth+=(target-smooth)*Math.min(1,rdt*9);if(Math.abs(target-smooth)<1e-4)smooth=target}
  else{target=Math.min(NS-1-OFF+DRIFT,(scrollY-W0())/APP.vh-OFF);smooth+=(target-smooth)*Math.min(1,rdt*9);if(Math.abs(target-smooth)<1e-4)smooth=target;APP.t=tOf(smooth)}
  APP.pos=smooth;const wb=wrap.getBoundingClientRect();APP.visible=wb.bottom>0;const past=wb.bottom<APP.vh*1.25;if(past!==APP.past){APP.past=past;document.body.classList.toggle('x-past',past)}
  render(dt);if(APP.on3d)APP.on3d(rdt);requestAnimationFrame(tick)}
addEventListener('scroll',()=>{if(!APP.playing&&Math.abs(scrollY-lastSet)>3){lockT=false;APP.manual=true;markStarted()}},{passive:true});

// ---------- điều khiển ----------
const ppi=$('#ppi');
function setIcon(){document.body.classList.toggle('x-playing',APP.playing);ppi.innerHTML=APP.playing?'<path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z"/>':'<path d="M7 4l13 8-13 8z"/>';$('#pp').setAttribute('aria-label',APP.playing?'Tạm dừng':'Phát')}
function markStarted(){if(APP.started)return;APP.started=true;document.body.classList.add('x-started')}
function toast(m,ms=2200){const el=$('#tm');el.textContent=m;el.classList.add('x-show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('x-show'),ms)}
function play(){markStarted();APP.manual=false;if(!lockT)APP.t=tOf(smooth);lockT=true;if(APP.t>=DUR-.1){APP.t=0;smooth=posOf(0)}APP.playing=true;idle=0;setIcon();
  if(N.mode==='speech'||N.mode==='none'){loadVoices();if(N.mode==='speech'&&!N.unlocked){N.unlocked=true;try{const u=new SpeechSynthesisUtterance(' ');u.volume=0;u.lang='vi-VN';speechSynthesis.speak(u)}catch(e){}}}
  if(N.mode==='none'&&!N.warned){N.warned=true;toast('Trình duyệt này chưa có giọng đọc tiếng Việt, đang phát kèm phụ đề. Mở bằng Microsoft Edge hoặc Chrome để nghe thuyết minh.',5200)}
  resumeVoice()}
function pause(){if(!APP.playing)return;APP.playing=false;setIcon();stopVoice();showUI();lockT=true;setScroll()}
function seek(x){APP.t=cl(x,0,DUR-.02);smooth=target=posOf(APP.t);markStarted();APP.manual=false;lockT=true;if(!APP.playing)setScroll();else resumeVoice()}
function go(k){stopVoice();seek(SCN[k].s+.01);if(!APP.playing)play()}
function hideUI(){uiHidden=true;document.body.classList.add('x-hideui')}
function showUI(){uiHidden=false;idle=0;document.body.classList.remove('x-hideui')}
APP.play=play;APP.pause=pause;APP.seek=seek;APP.go=go;
$('#pp').onclick=()=>APP.playing?pause():play();
$('#bigplay').onclick=()=>{seek(0);play()};
const ccB=$('#cc'),sB=$('#snd'),sI=$('#sndi'),vB=$('#vbtn');
ccB.onclick=()=>{capOn=!capOn;ccB.classList.toggle('x-off',!capOn)};
sB.onclick=()=>{N.muted=!N.muted;sB.classList.toggle('x-off',N.muted);if(N.muted)stopVoice();else if(APP.playing)resumeVoice();
  sI.innerHTML=N.muted?'<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>':'<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'};
vB.onclick=()=>{loadVoices();if(N.mode==='file'){toast('Đang dùng giọng đọc thu sẵn');return}if(!N.voices.length){toast('Trình duyệt này chưa có giọng tiếng Việt');return}
  const i=(N.voices.indexOf(N.voice)+1)%N.voices.length;N.voice=N.voices[i];try{localStorage.setItem('pmVoice',N.voice.name)}catch(e){}
  toast('Giọng đọc: '+N.voice.name.replace(/Microsoft |Google |\(.*?\)|Online|Natural|- Vietnamese|Vietnamese/gi,'').trim());if(APP.playing)resumeVoice()};
$('#fs').onclick=()=>{try{if(document.fullscreenElement)document.exitFullscreen();else{const r=document.documentElement.requestFullscreen();if(r&&r.catch)r.catch(()=>toast('Trình xem này chưa cho toàn màn hình'))}}catch(e){toast('Trình xem này chưa cho toàn màn hình')}};
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>go(+b.dataset.go)));
// người xem tự cuộn: tạm dừng và trả quyền cuộn
addEventListener('wheel',()=>{if(APP.playing)pause()},{passive:true});
addEventListener('touchstart',e=>{if(APP.playing&&!e.target.closest('.x-ctrl,.x-bigplay'))pause()},{passive:true});
addEventListener('mousemove',()=>{if(uiHidden&&!APP.manualHide)showUI();idle=0});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&APP.playing)pause()});
addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select')||(APP.past&&!APP.playing))return;
  if(e.code==='Space'){e.preventDefault();APP.playing?pause():play()}
  else if(['ArrowDown','ArrowRight','PageDown'].includes(e.key)){e.preventDefault();go(Math.min(NS-1,sceneAt(APP.t)+1))}
  else if(['ArrowUp','ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();const k=sceneAt(APP.t);go(APP.t-SCN[k].s>2?k:Math.max(0,k-1))}
  else if(e.key==='h'||e.key==='H'){APP.manualHide=!uiHidden;uiHidden?showUI():hideUI()}
  else if(e.key==='c'||e.key==='C')ccB.click();else if(e.key==='m'||e.key==='M')sB.click();else if(e.key==='v'||e.key==='V')vB.click();else if(e.key==='f'||e.key==='F')$('#fs').click()});
const tip=$('#tip');let drag=false,wasP=false;
const posT=e=>{const r=track.getBoundingClientRect();return cl((e.clientX-r.left)/r.width)*DUR};
track.addEventListener('pointerdown',e=>{drag=true;wasP=APP.playing;if(APP.playing)pause();track.setPointerCapture(e.pointerId);seek(posT(e))});
track.addEventListener('pointermove',e=>{const x=posT(e);tip.style.left=(x/DUR*100)+'%';tip.textContent=mm(x)+' · '+ST.scenes[sceneAt(x)].label;if(drag)seek(x)});
track.addEventListener('pointerup',()=>{if(drag){drag=false;if(wasP)play()}});
addEventListener('pointermove',e=>{APP.mx=e.clientX/innerWidth-.5;APP.my=e.clientY/innerHeight-.5},{passive:true});
$('#copy')&&($('#copy').onclick=()=>{try{navigator.clipboard.writeText('0971352359').then(()=>toast('Đã sao chép 0971 352 359')).catch(()=>toast('Số Zalo: 0971 352 359'))}catch(e){toast('Số Zalo: 0971 352 359')}});
if('scrollRestoration' in history)history.scrollRestoration='manual';scrollTo(0,0);lastSet=0;
if(/[?&]autoplay=1/.test(location.search))addEventListener('load',()=>setTimeout(()=>{seek(0);play()},600));
requestAnimationFrame(tick);
})();
