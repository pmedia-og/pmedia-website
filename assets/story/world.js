/* PMedia video 3D – thế giới three.js. Mỗi cảnh một "đạo cụ" riêng theo dịch vụ.
   Tối ưu độ mượt: không hậu kỳ bloom, không đèn điểm, ánh sáng giả bằng sprite cộng màu,
   texture động vẽ ở 24 khung/giây, chỉ cập nhật cảnh đang ở gần, tự hạ độ phân giải khi máy yếu. */
(async function(){
'use strict';
let THREE,RoomEnvironment,RoundedBoxGeometry;
try{THREE=await import('three');({RoomEnvironment}=await import('three/addons/environments/RoomEnvironment.js'));({RoundedBoxGeometry}=await import('three/addons/geometries/RoundedBoxGeometry.js'))}
catch(e){document.body.classList.add('x-no3d');console.warn('Không tải được three.js',e);return}

const A=window.APP,ST=window.STORY,IC=window.ICONS||{};
const canvas=document.getElementById('xgl');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'})}catch(e){document.body.classList.add('x-no3d');throw e}
const DPR_CAP=Math.min(devicePixelRatio||1,1.6);let dpr=Math.min(DPR_CAP,1.35);
renderer.setPixelRatio(dpr);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.1,200);
const D=12,U=2*D*Math.tan(THREE.MathUtils.degToRad(22.5));camera.position.set(0,0,D);
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;
scene.add(new THREE.HemisphereLight(0xcfe4ff,0x0a1840,1.5));
const key=new THREE.DirectionalLight(0xffffff,2.1);key.position.set(6,10,10);scene.add(key);
const rim=new THREE.DirectionalLight(0x9fd6ff,1.1);rim.position.set(-8,-2,-6);scene.add(rim);
scene.fog=new THREE.FogExp2(0x0a1e5a,.016);

// ---------- tiện ích ----------
const rnd=(s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296})(ST.slug.length*97+7);
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),eo=x=>1-Math.pow(1-cl(x),3),eio=x=>{x=cl(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
const eob=x=>{x=cl(x);const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)};
const C=h=>new THREE.Color(h);const ACC=C(ST.acc),SKY=C(ST.sky),ACCH='#'+ACC.getHexString(),SKYH='#'+SKY.getHexString();
const MINT='#3EDBAA',AMBER='#FFB766',INK='#0A1433';
const redraws=[],anims=[];
function ctex(w,h,draw,keep){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;const run=(...a)=>{g.clearRect(0,0,w,h);draw(g,w,h,...a);t.needsUpdate=true};run(0,0);if(keep)redraws.push(run);t.userData.run=run;t.userData.g=g;return t}
// texture động: chỉ vẽ lại khi cảnh ở gần, tối đa fps khung/giây
function atex(w,h,draw,k,fps=24){const t=ctex(w,h,(g,W,H,lt,T)=>draw(g,W,H,lt||0,T||0));anims.push({t,k,fps,last:-1});return t}
const glowTex=ctex(128,128,g=>{const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.2,'rgba(255,255,255,.6)');gr.addColorStop(.5,'rgba(255,255,255,.15)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128)});glowTex.colorSpace=THREE.NoColorSpace;
function glow(color,scale,op=1){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:C(color),transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false}));s.scale.setScalar(scale);return s}
const emis=(c,i=2.5)=>new THREE.MeshStandardMaterial({color:0x000000,emissive:C(c),emissiveIntensity:i});
const glassM=(c,o={})=>new THREE.MeshPhysicalMaterial(Object.assign({color:C(c),roughness:.18,metalness:.15,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:.9},o));
const darkM=()=>new THREE.MeshStandardMaterial({color:0x0e1530,metalness:.8,roughness:.3});
const whiteM=()=>new THREE.MeshPhysicalMaterial({color:0xeef3ff,roughness:.28,clearcoat:1,envMapIntensity:.6});
const RB=(w,h,d,r)=>new RoundedBoxGeometry(w,h,d,3,r);
const rrect=(g,x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()};
const F=(w,s)=>`${w} ${s}px "Be Vietnam Pro", system-ui, sans-serif`;
function label(text,{w=512,h=128,size=60,weight=800,color='#fff',bg=null,scale=1,align='center',border=null}={}){
  const t=ctex(w,h,g=>{if(bg){g.fillStyle=bg;rrect(g,4,4,w-8,h-8,Math.min(h/2-4,40));g.fill();if(border){g.strokeStyle=border;g.lineWidth=4;g.stroke()}}g.fillStyle=color;g.font=F(weight,size);g.textAlign=align;g.textBaseline='middle';g.fillText(typeof text==='function'?text():text,align==='center'?w/2:24,h/2+2)},true);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(scale*w/h,scale,1);s.userData.tex=t;return s}
function icon(g,name,x,y,size,color,lw=2){const p=IC[name];if(!p)return;g.save();g.translate(x-size/2,y-size/2);g.scale(size/24,size/24);g.strokeStyle=color;g.lineWidth=lw;g.lineCap='round';g.lineJoin='round';g.stroke(new Path2D(p));g.restore()}
function iconTex(name,{bg=ACCH,fg='#fff',r=56}={}){return ctex(256,256,g=>{if(bg){const gr=g.createLinearGradient(0,0,256,256);gr.addColorStop(0,'#ffffff40');gr.addColorStop(1,'#00000000');g.fillStyle=bg;rrect(g,8,8,240,240,r);g.fill();g.fillStyle=gr;rrect(g,8,8,240,240,r);g.fill()}icon(g,name,128,128,130,fg,2.1)},true)}
function lines(g,x,y,w,n,gap=22,col='#c8d4f0',h=10){g.fillStyle=col;for(let i=0;i<n;i++){rrect(g,x,y+i*gap,i===n-1?w*.6:w,h,h/2);g.fill()}}
function pShape(){const s=new THREE.Shape();s.moveTo(-1.05,-1.9);s.lineTo(-1.05,.35);s.absarc(.15,.35,1.2,Math.PI,-Math.PI/2,true);s.lineTo(-.35,-.85);s.lineTo(-.35,-1.9);s.closePath();const h=new THREE.Path();h.absarc(.15,.35,.52,0,Math.PI*2,true);s.holes.push(h);return s}
const pGeo=()=>{const g=new THREE.ExtrudeGeometry(pShape(),{depth:.55,bevelEnabled:true,bevelThickness:.16,bevelSize:.12,bevelSegments:5,curveSegments:36});g.center();return g};
function rings(g,radii=[3.2,3.8,4.5],cols=[SKYH,'#ffffff',ACCH]){return radii.map((r,i)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(r,.026,10,160),emis(cols[i%cols.length],2.6));g.add(m);return m})}
function confetti(g,n=90){const c=[];for(let i=0;i<n;i++){const s=glow(['#ffffff',SKYH,AMBER,ACCH][i%4],.22+rnd()*.32,1);g.add(s);const a=rnd()*Math.PI*2,el=.3+rnd()*1.1,sp=4.5+rnd()*6;c.push({s,v:new THREE.Vector3(Math.cos(a)*Math.cos(el)*sp,Math.sin(el)*sp,Math.sin(a)*Math.cos(el)*sp*.4)})}
  return(ct)=>c.forEach(o=>{if(ct<0||ct>4){o.s.visible=false;return}o.s.visible=true;o.s.position.set(o.v.x*ct,o.v.y*ct-2.7*ct*ct+.5,o.v.z*ct);o.s.material.opacity=1-ct/4})}
function sparkOrbit(g,n,R,cols=['#ffffff',SKYH]){const sp=[];for(let i=0;i<n;i++){const s=glow(cols[i%cols.length],.4,1);g.add(s);sp.push({s,r:R+(i%3)*.5,a:rnd()*6.28,v:.2+rnd()*.5,ph:rnd()*6})}
  return(T,k=1)=>sp.forEach(p=>{const a=p.a+T*p.v;p.s.position.set(Math.cos(a)*p.r*k,Math.sin(a)*p.r*.35*k+Math.sin(T+p.ph)*.25,Math.sin(a)*p.r*.55);p.s.material.opacity=k*(.35+.6*Math.abs(Math.sin(T*1.6+p.ph)))})}
// cửa sổ thời gian cho một dãy phần tử gắn số lời thoại
function seqW(lw,on){const by={},w=[];on.forEach((li,i)=>(by[li]=by[li]||[]).push(i));Object.keys(by).forEach(li=>{const W=lw[li]||lw[lw.length-1]||[0,1],m=by[li].length;by[li].forEach((i,n)=>w[i]=[W[0]+(W[1]-W[0])*n/m,W[0]+(W[1]-W[0])*(n+1)/m])});return w}
const actW=(w,lt)=>w?cl((lt-w[0])/.3)*(1-cl((lt-w[1])/.45)):0;
const doneW=(w,lt)=>w?cl((lt-w[1])/.4):0;

// ---------- nền trời ----------
const bgTex=ctex(4,256,()=>{});scene.background=bgTex;
const NS=ST.scenes.length;
const base=[ACC.clone().lerp(C('#2d5cff'),.35).offsetHSL(0,0,.06),ACC.clone().lerp(C('#0A1D55'),.74),C('#040F33').lerp(ACC,.06)];
const PAL=ST.scenes.map((s,k)=>base.map((c,j)=>c.clone().offsetHSL(((k%3)-1)*.018,0,(j===0?((k%2)?-.04:.02):0))));
const cA=new THREE.Color(),cB=new THREE.Color(),cC=new THREE.Color();
function paintBg(pos){const k=Math.floor(cl(pos,0,NS-1)),f=eio(cl(pos-k,0,1)),n=Math.min(NS-1,k+1);
  cA.copy(PAL[k][0]).lerp(PAL[n][0],f);cB.copy(PAL[k][1]).lerp(PAL[n][1],f);cC.copy(PAL[k][2]).lerp(PAL[n][2],f);
  const g=bgTex.userData.g,gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#'+cA.getHexString());gr.addColorStop(.5,'#'+cB.getHexString());gr.addColorStop(1,'#'+cC.getHexString());g.fillStyle=gr;g.fillRect(0,0,4,256);bgTex.needsUpdate=true;scene.fog.color.copy(cB)}
const SPAN=(NS-1)*U+16;
let dust;{const N=2200,pos=new Float32Array(N*3),col=new Float32Array(N*3);const pal=[C('#ffffff'),SKY,ACC.clone().lerp(C('#ffffff'),.3),C(AMBER)];
  for(let i=0;i<N;i++){pos[i*3]=(rnd()-.5)*44;pos[i*3+1]=8-rnd()*SPAN;pos[i*3+2]=-34+rnd()*40;const c=pal[rnd()<.07?3:Math.floor(rnd()*3)];col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
  dust=new THREE.Points(g,new THREE.PointsMaterial({size:.16,map:glowTex,vertexColors:true,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(dust)}
const bokeh=[];for(let i=0;i<34;i++){const s=glow(rnd()<.16?AMBER:(rnd()<.5?ACCH:SKYH),2+rnd()*6,.1);s.position.set((rnd()-.5)*50,6-rnd()*SPAN,-30+rnd()*12);s.userData.ph=rnd()*6;bokeh.push(s);scene.add(s)}
const beamTex=ctex(64,512,g=>{const gr=g.createLinearGradient(0,0,0,512);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.35,'rgba(255,255,255,.9)');gr.addColorStop(.7,'rgba(255,255,255,.4)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,512);const gx=g.createLinearGradient(0,0,64,0);gx.addColorStop(0,'rgba(0,0,0,1)');gx.addColorStop(.5,'rgba(0,0,0,0)');gx.addColorStop(1,'rgba(0,0,0,1)');g.globalCompositeOperation='destination-out';g.fillStyle=gx;g.fillRect(0,0,64,512)});
const beams=[];for(let i=0;i<12;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(2+rnd()*3,34),new THREE.MeshBasicMaterial({map:beamTex,color:rnd()<.2?C('#ffd2a0'):SKY,transparent:true,opacity:.06+rnd()*.07,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));m.position.set((rnd()-.5)*30,4-i*(SPAN/12),-14-rnd()*8);m.rotation.z=(rnd()-.5)*.7;m.userData.ph=rnd()*6;beams.push(m);scene.add(m)}

// ---------- đạo cụ ----------
const P={};
P.plogo=(g,p)=>{const pg=new THREE.Group();g.add(pg);const Pm=new THREE.Mesh(pGeo(),glassM(ACCH,{metalness:.25}));pg.add(Pm);
  const halo=glow(ACCH,13,.5);halo.position.z=-1.5;g.add(halo);const rg=rings(g);const sp=sparkOrbit(g,18,3.3);const cf=p.outro?confetti(g):null;
  return(lt,T)=>{const a=eob((lt-.1)/1.1);pg.scale.setScalar(.001+a);pg.rotation.y=Math.sin(T*.55)*.5+A.mx*.6;pg.rotation.x=Math.sin(T*.4)*.1-A.my*.3;pg.position.y=Math.sin(T*.9)*.12;
    const rb=eo((lt-.3)/1.5);rg.forEach((m,i)=>{m.scale.setScalar(.2+.8*rb);m.rotation.x=1.25+Math.sin(T*.35+i)*.35;m.rotation.y=T*(.18+i*.09)*(i%2?-1:1)});sp(T,rb);halo.material.opacity=.3+.2*Math.sin(T*1.2);if(cf)cf(lt-1.3)}};

P.warn=(g,p,sc)=>{const n=sc.icons.length,tiles=[];const cols=n>4?3:n;
  sc.icons.forEach((ic,i)=>{const t=new THREE.Group();g.add(t);const face=iconTex(ic,{bg:'#1a2348',fg:'#ffcf8a'});
    const mats=[darkM(),darkM(),darkM(),darkM(),new THREE.MeshStandardMaterial({map:face,roughness:.4,emissive:C('#ffffff'),emissiveMap:face,emissiveIntensity:.25}),darkM()];
    const m=new THREE.Mesh(RB(1.45,1.45,.3,.16),mats);t.add(m);const gl=glow('#ff5a4a',3,.4);gl.position.z=-.3;t.add(gl);
    const r=Math.floor(i/cols),c=i%cols,rowN=Math.min(cols,n-r*cols);t.userData.home=new THREE.Vector3((c-(rowN-1)/2)*1.85,(n>cols?.95:0)-r*1.9,0);tiles.push({t,m,gl,ph:rnd()*6})});
  return(lt,T,c)=>tiles.forEach((o,i)=>{const a=eob((lt-.15-i*.12)/.9),act=actW(c.iw[i],lt),dn=doneW(c.iw[i],lt);
    o.t.position.copy(o.t.userData.home);o.t.position.z=act*1.1;o.t.position.y+=Math.sin(T*1.3+o.ph)*.08;o.t.scale.setScalar((.001+a)*(1+act*.18));
    o.t.rotation.set(Math.sin(T*.9+o.ph)*.12*(1-act),Math.sin(T*.7+o.ph)*.25*(1-act),(1-dn)*Math.sin(T*1.1+o.ph)*.06);
    const fl=Math.sin(T*11+o.ph*3)*Math.sin(T*6.3+o.ph)>.7?.35:1;o.gl.material.color.set(dn>.5?MINT:'#ff5a4a');o.gl.material.opacity=(.2+act*.9)*fl*a;o.gl.scale.setScalar(3+act*2.5)})};

P.team=(g,p)=>{const core=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),glassM(ACCH,{flatShading:true}));g.add(core);
  const wire=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.35,1)),new THREE.LineBasicMaterial({color:SKY,transparent:true,opacity:.5}));g.add(wire);
  const cg=glow(ACCH,6,.6);g.add(cg);const orbit=new THREE.Group();orbit.rotation.x=.42;g.add(orbit);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.7,.015,8,160),emis(SKYH,2));ring.rotation.x=Math.PI/2;orbit.add(ring);
  const orbs=p.labels.map((t,i)=>{const o=new THREE.Group();orbit.add(o);const s=new THREE.Mesh(new THREE.SphereGeometry(.32,32,20),glassM(i%2?SKYH:'#ffffff'));o.add(s);const gl=glow(SKYH,1.6,.6);o.add(gl);
    const lb=label(t,{w:384,h:96,size:40,weight:700,bg:'rgba(8,20,60,.82)',scale:.42});lb.position.y=.68;o.add(lb);return{o,s,gl,lb}});
  const lp=new Float32Array(orbs.length*6),lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.BufferAttribute(lp,3));
  const ln=new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:SKY,transparent:true,opacity:.55,blending:THREE.AdditiveBlending}));orbit.add(ln);let W=null;
  return(lt,T,c)=>{W=seqW(c.lw,p.on);const a=eob((lt-.1)/1.2);core.scale.setScalar(.001+a);core.rotation.set(T*.3,T*.4,0);wire.rotation.set(-T*.2,T*.25,0);wire.scale.setScalar(a);cg.material.opacity=.4+.2*Math.sin(T*2);
    orbs.forEach((o,i)=>{const ang=i/orbs.length*Math.PI*2+T*.16,r=2.7*eo((lt-.3-i*.1)/1);o.o.position.set(Math.cos(ang)*r,0,Math.sin(ang)*r);o.o.rotation.x=-.42;
      const act=actW(W[i],lt),dn=doneW(W[i],lt);o.s.scale.setScalar(.001+eo((lt-.4-i*.1)/.8)*(1+act*.6));o.gl.material.opacity=.3+act*1;o.gl.material.color.set(dn>.5&&act<.1?MINT:SKYH);o.lb.material.opacity=eo((lt-.8-i*.1)/.6)*(.55+act*.45);
      lp.set([0,0,0,o.o.position.x,0,o.o.position.z],i*6)});lg.attributes.position.needsUpdate=true;ln.material.opacity=.25+.35*a}};

P.blocks=(g,p,sc)=>{const cubes=sc.icons.map((ic,i)=>{const face=iconTex(ic,{bg:i%2?ACCH:'#2a3a78'});const gm=glassM(i%2?ACCH:'#2a3a78');
    const m=new THREE.Mesh(RB(1.15,1.15,1.15,.14),[gm,gm,gm,gm,new THREE.MeshStandardMaterial({map:face,roughness:.35}),gm]);g.add(m);
    const home=new THREE.Vector3((i%3-1)*1.45,(i<3?.75:-.75),0),from=new THREE.Vector3((rnd()-.5)*9,(rnd()-.5)*7,-4-rnd()*4);const gl=glow(SKYH,2.6,0);m.add(gl);return{m,home,from,gl,r:rnd()*6}});
  return(lt,T,c)=>cubes.forEach((o,i)=>{const a=eo((lt-.1-i*.12)/1.3),act=actW(c.iw[i],lt);o.m.position.lerpVectors(o.from,o.home,a);o.m.position.z+=act*.9+Math.sin(T+o.r)*.06;
    o.m.rotation.set((1-a)*o.r+Math.sin(T*.6+o.r)*.08,(1-a)*o.r*1.3+act*Math.PI*2*eo((lt-c.iw[i][0])/.9)+A.mx*.3,0);o.m.scale.setScalar(.001+a*(1+act*.12));o.gl.material.opacity=act*.8})};

P.carousel=(g,p)=>{const n=p.labels.length,R=2.5,ring=new THREE.Group();g.add(ring);
  const cards=p.labels.map((t,i)=>{const tx=ctex(512,320,(gg,w,h)=>{const gr=gg.createLinearGradient(0,0,w,h);gr.addColorStop(0,i%2?'#1d3a8f':ACCH);gr.addColorStop(1,'#0a1640');gg.fillStyle=gr;rrect(gg,6,6,w-12,h-12,34);gg.fill();gg.strokeStyle='rgba(255,255,255,.35)';gg.lineWidth=4;gg.stroke();
      gg.fillStyle='rgba(255,255,255,.6)';gg.font=F(600,30);gg.fillText(String(i+1).padStart(2,'0'),36,64);gg.fillStyle='#fff';gg.font=F(800,46);gg.fillText(t,36,h-60);lines(gg,36,96,300,3,26,'rgba(255,255,255,.28)',12)},true);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.0),new THREE.MeshBasicMaterial({map:tx,transparent:true,side:THREE.DoubleSide}));const a=i/n*Math.PI*2;m.position.set(Math.sin(a)*R,0,Math.cos(a)*R);m.rotation.y=a;ring.add(m);return m});
  const halo=new THREE.Mesh(new THREE.TorusGeometry(R,.02,8,160),emis(SKYH,2));halo.rotation.x=Math.PI/2;halo.position.y=-.8;g.add(halo);let rot=0,W=null;
  return(lt,T,c)=>{W=seqW(c.lw,p.on);let ai=-1;W.forEach((w,i)=>{if(actW(w,lt)>.5)ai=i});const tgt=ai>=0?-ai/n*Math.PI*2:-T*.18;
    rot+=(Math.atan2(Math.sin(tgt-rot),Math.cos(tgt-rot)))*(ai>=0?.06:.02);ring.rotation.y=rot;ring.rotation.x=.12+A.my*.1;const a=eob((lt-.2)/1.2);ring.scale.setScalar(.001+a);halo.scale.setScalar(.001+a);
    cards.forEach((m,i)=>{const s=(i===ai?1.22:1);m.scale.lerp(new THREE.Vector3(s,s,1),.12)})}};

P.path=(g,p,sc)=>{const n=sc.items.length,nodes=[];let curve,tube,prog,tcount=0;const base=emis(SKYH,.9),hot=emis('#ffffff',3);
  for(let i=0;i<n;i++){const o=new THREE.Group();g.add(o);const s=new THREE.Mesh(new THREE.SphereGeometry(.24,24,16),glassM('#ffffff'));o.add(s);
    const r=new THREE.Mesh(new THREE.TorusGeometry(.42,.03,8,64),emis(SKYH,2));o.add(r);const gl=glow(SKYH,1.8,.5);o.add(gl);
    const lb=label(String(i+1).padStart(2,'0'),{w:128,h:128,size:56,weight:800,color:'#fff',scale:.42});lb.position.y=.78;o.add(lb);nodes.push({o,s,r,gl,lb})}
  const comet=glow('#ffffff',1.4,1),ch=glow(SKYH,3,.6);g.add(comet,ch);let u=0;
  function relayout(port){const pts=[];nodes.forEach((o,i)=>{let x,y,z;if(port){const half=Math.ceil(n/2),row=i<half?0:1,j=row?i-half:i,m=row?n-half:half;x=(row?-1:1)*(-2.1+4.2*(m>1?j/(m-1):.5));y=row?-1.1:1.1;z=0}
      else{x=-7+14*i/(n-1);y=Math.sin(i*.95)*.55;z=Math.cos(i*.7)*.5}o.o.position.set(x,y,z);pts.push(new THREE.Vector3(x,y,z))});
    curve=new THREE.CatmullRomCurve3(pts,false,'centripetal');[tube,prog].forEach(m=>{if(m){g.remove(m);m.geometry.dispose()}});
    tube=new THREE.Mesh(new THREE.TubeGeometry(curve,220,.03,6,false),base);prog=new THREE.Mesh(new THREE.TubeGeometry(curve,220,.055,6,false),hot);g.add(tube,prog);tcount=prog.geometry.index.count}
  return{relayout,update(lt,T,c){const a=eo((lt-.1)/1.2);let tgt=0;
    nodes.forEach((o,i)=>{const w=c.iw[i],act=actW(w,lt),dn=doneW(w,lt);if(w&&lt>=w[0])tgt=i/(n-1);const e=eob((lt-.15-i*.07)/.7);
      o.o.scale.setScalar(.001+e*(1+act*.45));o.r.rotation.set(T*.8+i,T*.6,0);o.r.material.emissive.set(dn>.5?MINT:act>.1?'#ffffff':SKYH);o.gl.material.color.set(dn>.5?MINT:SKYH);o.gl.material.opacity=.25+act*1.1+dn*.2;o.lb.material.opacity=e*(.5+act*.5)});
    u+=(tgt-u)*.08;prog.geometry.setDrawRange(0,Math.floor(u*tcount/6)*6);tube.material.emissiveIntensity=.9*a;
    const pt=curve.getPoint(cl(u,0,1));comet.position.copy(pt);ch.position.copy(pt);comet.visible=ch.visible=lt>.4;ch.material.opacity=.4+.2*Math.sin(T*4)}}};

P.bars=(g,p,sc)=>{const H=[.25,.3,.34,.42,.5,.58,.68,.78,.86,.95],bars=[];const chart=new THREE.Group();g.add(chart);
  const grid=new THREE.GridHelper(13,26,SKY,ACC);grid.material.transparent=true;grid.material.opacity=.22;chart.add(grid);
  H.forEach((h,i)=>{const m=new THREE.Mesh(RB(.78,1,.78,.08),glassM(i<3?'#4a5a86':ACCH,{emissive:i<3?C('#1a2440'):ACC,emissiveIntensity:i<3?.3:.5}));const cap=new THREE.Mesh(new THREE.BoxGeometry(.8,.05,.8),emis(i<3?'#8090b8':SKYH,3));
    m.position.x=cap.position.x=(i-4.5)*1.1;chart.add(m,cap);bars.push({m,cap,h:h*4.6})});
  const arrow=new THREE.Mesh(new THREE.ConeGeometry(.35,.7,4),emis('#ffffff',2.5));chart.add(arrow);const ag=glow(SKYH,2.6,.8);arrow.add(ag);
  return(lt,T,c)=>{chart.rotation.x=.24;chart.rotation.y=Math.sin(T*.25)*.2+A.mx*.25;grid.material.opacity=.22*eo((lt-.1)/.8);
    bars.forEach((b,i)=>{const s=eob((lt-.4-i*.08)/1);const h=.001+b.h*s*(1+.03*Math.sin(T*2+i));b.m.scale.y=h;b.m.position.y=h/2;b.cap.position.y=h+.03;b.cap.material.emissiveIntensity=i<3?1:2.5+Math.sin(T*3+i)});
    const lb=bars[bars.length-1];arrow.position.set(lb.m.position.x,lb.cap.position.y+.8+Math.sin(T*2)*.1,0);arrow.rotation.y=T;arrow.scale.setScalar(.001+eob((lt-1.4)/.6))}};

P.gems=(g,p,sc)=>{const defs=[[.55,SKYH,new THREE.OctahedronGeometry(1,0)],[.8,'#ffffff',new THREE.IcosahedronGeometry(1,0)],[1,AMBER,new THREE.DodecahedronGeometry(1,0)]];
  const gems=defs.map(([s,c,geo],i)=>{const grp=new THREE.Group();g.add(grp);const m=new THREE.Mesh(geo,glassM(c,{flatShading:true,emissive:C(c),emissiveIntensity:.12}));grp.add(m);
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.85})));const gl=glow(c==='#ffffff'?ACCH:c,4*s,.5);grp.add(gl);
    const halo=new THREE.Mesh(new THREE.TorusGeometry(1.5,.016,8,100),emis(c,2.2));halo.rotation.x=Math.PI/2.3;grp.add(halo);return{grp,m,gl,halo,s,i}});
  return(lt,T,c)=>gems.forEach(o=>{const a=eob((lt-(.4+o.i*.25))/1),act=actW(c.iw[o.i],lt);o.grp.position.set((o.i-1)*3.1,Math.sin(T*1.1+o.i)*.22+(o.i===1?.3:0)+act*.3,act*1.2);
    o.grp.scale.setScalar((.001+a)*o.s*(1+act*.35));o.m.rotation.set(T*.5+o.i,T*.7*(1+act),0);o.halo.rotation.z=T*(.6+o.i*.2);o.gl.material.opacity=.4+act*.6})};

P.store=(g,p)=>{const st=new THREE.Group();g.add(st);
  const wallT=ctex(1024,640,(c,w,h)=>{c.fillStyle='#f6f8ff';c.fillRect(0,0,w,h);c.fillStyle=ACCH;c.fillRect(0,0,w,110);c.fillStyle='#fff';c.font=F(800,52);c.fillText('Gian hàng của bạn',40,72);
    c.font=F(700,30);c.fillText('★ 4.9 · Mall',w-300,70);for(let i=0;i<4;i++){const x=40+i*240;const gr=c.createLinearGradient(x,150,x+210,360);gr.addColorStop(0,i%2?'#ffd1b8':'#ffe8d8');gr.addColorStop(1,i%2?ACCH:'#ff9a6b');c.fillStyle=gr;rrect(c,x,150,210,220,22);c.fill();
      c.fillStyle='#0a1734';c.font=F(700,26);c.fillText('Sản phẩm '+(i+1),x,410);c.fillStyle=ACCH;c.font=F(800,32);c.fillText((149+i*50)+'.000đ',x,456);c.fillStyle='#8892aa';c.font=F(500,22);c.fillText('Đã bán '+(1.2+i*.7).toFixed(1)+'k',x,494)}
    c.fillStyle='#ffe3d6';rrect(c,40,530,w-80,80,20);c.fill();c.fillStyle=ACCH;c.font=F(800,32);c.fillText('Voucher 50K · Freeship toàn quốc',70,582)},true);
  const wall=new THREE.Mesh(RB(4.6,2.9,.18,.08),[darkM(),darkM(),darkM(),darkM(),new THREE.MeshStandardMaterial({map:wallT,roughness:.5}),darkM()]);wall.position.y=.6;st.add(wall);
  const counter=new THREE.Mesh(RB(4.9,.9,1.3,.12),glassM(ACCH));counter.position.set(0,-1.25,.6);st.add(counter);
  const aw=[];for(let i=0;i<9;i++){const m=new THREE.Mesh(RB(.56,.12,1.3,.04),glassM(i%2?'#ffffff':ACCH));m.position.set(-2.24+i*.56,2.25,.55);m.rotation.x=.42;st.add(m);aw.push(m)}
  const fl=atex(512,128,(c,w,h,lt,T)=>{c.fillStyle='#ffdd57';rrect(c,4,4,w-8,h-8,40);c.fill();c.fillStyle='#b5200c';c.font=F(900,44);c.textBaseline='middle';const s=Math.max(0,3600*2+1800-Math.floor(T));c.fillText('FLASH SALE  '+String(Math.floor(s/3600)).padStart(2,'0')+':'+String(Math.floor(s/60)%60).padStart(2,'0')+':'+String(s%60).padStart(2,'0'),30,h/2+2)},0,2);
  const flash=new THREE.Sprite(new THREE.SpriteMaterial({map:fl,transparent:true,depthWrite:false}));flash.scale.set(2.8,.7,1);flash.position.set(0,3.15,.8);st.add(flash);
  const boxes=[];for(let i=0;i<5;i++){const t=ctex(128,128,c=>{c.fillStyle='#d8a26a';c.fillRect(0,0,128,128);c.fillStyle='#b9824c';c.fillRect(54,0,20,128);c.fillStyle=ACCH;c.fillRect(0,54,128,20)});
    const b=new THREE.Mesh(RB(.55,.55,.55,.06),new THREE.MeshStandardMaterial({map:t,roughness:.6}));st.add(b);boxes.push({b,ph:i/5})}
  const tags=['Shopee','Tiki','Lazada'].map((t,i)=>{const s=label(t,{w:320,h:96,size:42,weight:800,bg:'rgba(8,20,60,.85)',border:SKYH,scale:.42});g.add(s);return s});
  const cf=p.outro?confetti(g):null;
  return(lt,T)=>{const a=eob((lt-.1)/1.2);st.scale.setScalar(.001+a);st.rotation.y=-.32+Math.sin(T*.4)*.12+A.mx*.3;st.rotation.x=.05;aw.forEach((m,i)=>m.position.y=2.25+Math.sin(T*2+i*.6)*.03);
    boxes.forEach(o=>{const u=(T*.32+o.ph)%1,x=-1.6+u*3.2;o.b.position.set(x,-.6+Math.sin(u*Math.PI)*2.1,1.4);o.b.rotation.set(u*4,u*5,0);o.b.scale.setScalar(Math.sin(u*Math.PI)*.95+.05)});
    tags.forEach((s,i)=>{const an=T*.35+i*2.09;s.position.set(Math.cos(an)*3.4,1.1+Math.sin(an*1.3)*.5,Math.sin(an)*1.6+.6);s.material.opacity=eo((lt-1-i*.2)/.6)});if(cf)cf(lt-1.3)}};

P.funnel=(g,p,sc)=>{const R=[2.5,2.1,1.7,1.3,.9],rg=R.map((r,i)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(r,.06,12,120),emis(i%2?SKYH:'#ffffff',2));m.rotation.x=Math.PI/2.2;m.position.y=2-i;g.add(m);return m});
  const cone=new THREE.Mesh(new THREE.CylinderGeometry(2.5,.9,4,48,1,true),new THREE.MeshBasicMaterial({color:ACC,transparent:true,opacity:.12,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));cone.position.y=0;cone.rotation.x=.08;g.add(cone);
  const pts=[];for(let i=0;i<70;i++){const s=glow(i%4?SKYH:AMBER,.35,1);g.add(s);pts.push({s,ph:rnd(),a:rnd()*6.28})}
  let orders=0;const ol=label(()=>'+'+orders+' đơn',{w:384,h:112,size:54,weight:900,bg:'rgba(255,255,255,.95)',color:ACCH,scale:.55});ol.position.set(0,-3.05,0);g.add(ol);
  return(lt,T,c)=>{const a=eo((lt-.1)/1);g.rotation.y=Math.sin(T*.3)*.2;rg.forEach((m,i)=>{const act=actW(c.iw[i],lt);m.scale.setScalar((.001+eob((lt-.1-i*.1)/.8))*(1+act*.12));m.material.emissiveIntensity=1.5+act*3});
    cone.material.opacity=.12*a;pts.forEach(o=>{const u=(T*.18+o.ph)%1,r=2.5-1.6*u,an=o.a+T*1.2+u*6;o.s.position.set(Math.cos(an)*r,2-u*4.3,Math.sin(an)*r*.4);o.s.material.opacity=a*Math.sin(u*Math.PI)});
    const no=lt<1?0:Math.floor((lt-1)*3.2);if(no!==orders){orders=no;ol.userData.tex.userData.run()}ol.material.opacity=eo((lt-1)/.6)}};

function phoneBody(g){const ph=new THREE.Group();g.add(ph);ph.add(new THREE.Mesh(RB(2.45,4.95,.24,.32),new THREE.MeshPhysicalMaterial({color:0x10172e,metalness:.85,roughness:.25,clearcoat:1})));const sg=glow(SKYH,7,.3);sg.position.z=-.6;ph.add(sg);return ph}
function screenOn(ph,tex){const m=new THREE.Mesh(new THREE.PlaneGeometry(2.22,4.6),new THREE.MeshBasicMaterial({map:tex,color:0xe2e7f2}));m.position.z=.125;ph.add(m);return m}
const SCREENS={
 shop(c,w,h,lt,T,on){c.fillStyle='#f5f6fa';c.fillRect(0,0,w,h);c.fillStyle=ACCH;c.fillRect(0,0,w,120);c.fillStyle='#fff';c.font=F(800,34);c.fillText('Gian hàng của bạn',30,76);
   const gr=c.createLinearGradient(0,140,w,560);gr.addColorStop(0,'#ffe6d6');gr.addColorStop(1,'#ffb48f');c.fillStyle=gr;rrect(c,24,140,w-48,420,24);c.fill();
   c.save();c.translate(w/2,350);c.rotate(Math.sin(T)*.08);c.fillStyle='#d8a26a';rrect(c,-90,-90,180,180,16);c.fill();c.fillStyle=ACCH;c.fillRect(-90,-14,180,28);c.restore();
   c.fillStyle='#0a1734';c.font=F(700,30);c.fillText('Sản phẩm bán chạy',30,610);c.fillStyle=ACCH;c.font=F(900,46);c.fillText('199.000đ',30,670);c.fillStyle='#9aa3b8';c.font=F(500,26);c.fillText('299.000đ',260,668);c.fillRect(256,660,124,3);
   c.fillStyle='#f5a524';c.font=F(700,26);c.fillText('★★★★★  4.9 · Đã bán 2,1k',30,716);
   c.fillStyle='#ffe3d6';rrect(c,24,750,w-48,70,16);c.fill();c.fillStyle=ACCH;c.font=F(800,26);c.fillText('Voucher 50K · Flash sale',46,795);
   const p=1+.04*Math.sin(T*5);c.save();c.translate(w/2,900);c.scale(p,p);c.fillStyle=ACCH;rrect(c,-200,-46,400,92,46);c.fill();c.fillStyle='#fff';c.font=F(800,32);c.textAlign='center';c.fillText('Thêm vào giỏ',0,12);c.restore();c.textAlign='left';
   const R=[[18,8,200,124],[18,130,476,560],[18,580,476,730],[18,742,476,830]];on.forEach((v,i)=>{if(v<=.02)return;const r=R[i];c.strokeStyle=`rgba(46,107,255,${v})`;c.lineWidth=6;rrect(c,r[0],r[1],r[2]-r[0]+20,r[3]-r[1],18);c.stroke()})},
 fan(c,w,h,lt,T,on){c.fillStyle='#f0f2f7';c.fillRect(0,0,w,h);const gr=c.createLinearGradient(0,0,w,200);gr.addColorStop(0,ACCH);gr.addColorStop(1,SKYH);c.fillStyle=gr;c.fillRect(0,0,w,200);
   c.fillStyle='#fff';c.beginPath();c.arc(90,200,62,0,7);c.fill();c.fillStyle=ACCH;c.beginPath();c.arc(90,200,52,0,7);c.fill();c.fillStyle='#fff';c.font=F(900,44);c.fillText('P',74,216);
   c.fillStyle='#0a1734';c.font=F(800,32);c.fillText('Fanpage của bạn',170,250);c.fillStyle='#65708a';c.font=F(500,22);c.fillText('12,4k người theo dõi',170,284);
   const off=(T*40)%260;c.save();c.beginPath();c.rect(0,310,w,h-310);c.clip();
   for(let k=-1;k<4;k++){const y=330+k*260-off+260;c.fillStyle='#fff';rrect(c,20,y,w-40,240,18);c.fill();lines(c,40,y+24,330,2,24,'#c9d1e3',10);const gg=c.createLinearGradient(40,y+80,w-40,y+190);gg.addColorStop(0,'#dfe8ff');gg.addColorStop(1,'#9cc0ff');c.fillStyle=gg;rrect(c,40,y+76,w-80,110,12);c.fill();
     c.fillStyle='#e8366f';c.font=F(700,22);c.fillText('♥ '+(120+((k+Math.floor(T*1.5))%9)*37),40,y+220);c.fillStyle='#65708a';c.fillText((8+k*3)+' bình luận',220,y+220)}c.restore();
   on.forEach((v,i)=>{if(v<=.02)return;c.globalAlpha=v;c.fillStyle=i===0?'#3EDBAA':i===1?'#FFB766':ACCH;rrect(c,30,h-120-i*72,w-60,60,30);c.fill();c.fillStyle='#04102e';c.font=F(800,24);c.fillText(['✓ Đã phản hồi 12 tin nhắn','✓ Seeding 20 group','✓ Đồng bộ Instagram, Map'][i],52,h-82-i*72);c.globalAlpha=1})},
 landing(c,w,h,lt,T,on){c.fillStyle='#f7f9ff';c.fillRect(0,0,w,h);const gr=c.createLinearGradient(0,0,w,520);gr.addColorStop(0,ACCH);gr.addColorStop(1,'#0a1640');c.fillStyle=gr;c.fillRect(0,0,w,520);
   c.fillStyle='#fff';c.font=F(900,50);c.fillText('Ưu đãi',36,140);c.fillText('ra mắt',36,200);c.font=F(500,24);c.fillStyle='rgba(255,255,255,.8)';c.fillText('Đăng ký hôm nay, nhận quà ngay',36,250);
   const p=1+.05*Math.sin(T*5);c.save();c.translate(170,350);c.scale(p,p);c.fillStyle='#fff';rrect(c,-134,-40,268,80,40);c.fill();c.fillStyle=ACCH;c.font=F(800,28);c.textAlign='center';c.fillText('Nhận ưu đãi',0,10);c.restore();c.textAlign='left';
   c.fillStyle='#0a1734';c.font=F(800,30);c.fillText('Đăng ký nhận tư vấn',36,600);['Họ tên','Số điện thoại','Nhu cầu'].forEach((t,i)=>{c.strokeStyle='#cdd6ea';c.lineWidth=3;rrect(c,36,630+i*86,w-72,66,14);c.stroke();c.fillStyle='#8a94ad';c.font=F(500,24);c.fillText(t,58,672+i*86)});
   const cv=Math.min(18.6,lt>0?lt*2.4:0);c.fillStyle=ACCH;rrect(c,36,900,w-72,80,40);c.fill();c.fillStyle='#fff';c.font=F(800,28);c.fillText('Chuyển đổi +'+cv.toFixed(1)+'%',70,950);
   on.forEach((v,i)=>{if(v<=.02)return;const r=[[24,40,470,280],[24,570,470,880],[24,890,470,990]][i];c.strokeStyle=`rgba(255,183,102,${v})`;c.lineWidth=6;rrect(c,r[0],r[1],r[2]-r[0],r[3]-r[1],18);c.stroke()})}};
P.phone=(g,p,sc,k)=>{const ph=phoneBody(g);let on=[0,0,0,0];const tex=atex(512,1024,(c,w,h,lt,T)=>SCREENS[p.screen](c,w,h,lt,T,on),k);screenOn(ph,tex);
  const fx=[];for(let i=0;i<10;i++){const s=label(p.screen==='shop'?'🛒':p.screen==='fan'?'♥':'✓',{w:128,h:128,size:70,weight:900,color:'#fff',bg:p.screen==='fan'?'#e8366f':ACCH,scale:.42});g.add(s);fx.push({s,ph:rnd(),x:rnd()})}
  return(lt,T,c)=>{on=c.iw.map(w=>actW(w,lt)+doneW(w,lt)*.25);const a=eob((lt-.15)/1.1);ph.scale.setScalar(.001+a);ph.rotation.y=-.35+Math.sin(T*.5)*.15+A.mx*.3;ph.rotation.x=.06+Math.sin(T*.4)*.05;ph.position.y=Math.sin(T*.8)*.1;
    fx.forEach(o=>{const u=(T*.2+o.ph)%1;o.s.position.set(1.6+o.x*1.2+Math.sin(u*6)*.2,-1.6+u*4.2,.6);o.s.material.opacity=a*Math.sin(u*Math.PI)*.95;o.s.scale.setScalar(.3+.15*Math.sin(u*Math.PI))})}};

P.parcels=(g,p,sc)=>{const pos=[[-1.3,-1],[0,-1],[1.3,-1],[-.65,.25],[.65,.25],[0,1.5]];const cart=new THREE.Group();g.add(cart);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.6,.03,8,120),emis(SKYH,2));ring.rotation.x=Math.PI/2;ring.position.y=-1.7;g.add(ring);const floor=glow(ACCH,7,.4);floor.position.y=-1.7;g.add(floor);
  const bx=pos.map((q,i)=>{const t=ctex(256,256,c=>{c.fillStyle='#e1ad73';c.fillRect(0,0,256,256);c.fillStyle='#c48d55';c.fillRect(108,0,40,256);c.fillStyle=ACCH;c.fillRect(0,108,256,40);icon(c,sc.icons[i]||'gift',70,70,80,'#5a3412',2.4)});
    const m=new THREE.Mesh(RB(1.15,1.15,1.15,.1),new THREE.MeshStandardMaterial({map:t,roughness:.55}));cart.add(m);const gl=glow(SKYH,2.5,0);m.add(gl);return{m,gl,home:new THREE.Vector3(q[0],q[1],0)}});
  return(lt,T,c)=>{cart.rotation.y=Math.sin(T*.3)*.35+A.mx*.3;ring.scale.setScalar(.001+eo(lt/1));bx.forEach((o,i)=>{const w=c.iw[i],st=w?w[0]-.3:99,u=eo((lt-st)/.9),act=actW(w,lt);
    o.m.position.set(o.home.x-(1-u)*6,o.home.y+Math.sin(u*Math.PI)*2.4*(1-u*.5),o.home.z+(1-u)*2);o.m.rotation.set((1-u)*3,(1-u)*4+act*.3*Math.sin(T*3),0);o.m.scale.setScalar(.001+(lt>st?1:0)*(1+act*.12));o.gl.material.opacity=act*.8})}};

P.serp=(g,p)=>{const W=5.2;const bar=new THREE.Mesh(RB(W,.72,.16,.36),whiteM());bar.position.y=2.1;g.add(bar);
  const q='dịch vụ của bạn';const st=atex(1024,144,(c,w,h,lt,T)=>{c.fillStyle='#fff';c.fillRect(0,0,w,h);icon(c,'search',70,72,60,'#5a6480',2.4);c.fillStyle='#0a1734';c.font=F(600,52);const n=Math.min(q.length,Math.floor(Math.max(0,lt-.3)*9));c.fillText(q.slice(0,n)+(Math.floor(T*2)%2?'|':''),130,90)},0,12);
  const sm=new THREE.Mesh(new THREE.PlaneGeometry(W-.4,.6),new THREE.MeshBasicMaterial({map:st,transparent:true}));sm.position.set(0,2.1,.085);g.add(sm);
  const rows=[];for(let i=0;i<5;i++){const mine=i===4;const t=ctex(1024,128,(c,w,h)=>{c.fillStyle=mine?ACCH:'#18265a';rrect(c,0,0,w,h,30);c.fill();c.fillStyle=mine?'#fff':'#9fb0dd';c.font=F(800,40);c.fillText(mine?'Thương hiệu của bạn – website chính thức':'Kết quả tìm kiếm '+(i+1),40,56);c.fillStyle=mine?'rgba(255,255,255,.75)':'#6d7cad';c.font=F(500,28);c.fillText(mine?'website-cua-ban.vn › dich-vu':'ket-qua-'+(i+1)+'.vn',40,100)},true);
    const m=new THREE.Mesh(RB(W,.62,.1,.14),[darkM(),darkM(),darkM(),darkM(),new THREE.MeshBasicMaterial({map:t}),darkM()]);g.add(m);rows.push({m,mine,rank:i})}
  const badge=label('TOP 1',{w:256,h:112,size:58,weight:900,bg:'#ffd257',color:'#3a2a00',scale:.5});g.add(badge);const bg=glow('#ffd257',2.8,.7);badge.add(bg);const mg=glow(ACCH,5,.0);g.add(mg);
  return(lt,T)=>{const a=eob((lt-.1)/1);g.rotation.y=-.18+Math.sin(T*.35)*.12+A.mx*.25;g.rotation.x=.08;bar.scale.setScalar(.001+a);sm.scale.setScalar(.001+a);
    const prog=p.outro?1:eio((lt-2.2)/4.5),myRank=4-prog*4;let others=[0,1,2,3];
    rows.forEach((o,i)=>{const r=o.mine?myRank:o.rank+cl(o.rank+1-myRank,0,1);const y=1.2-r*.78,e=eob((lt-.4-i*.1)/.8);o.m.position.set(0,y,o.mine?.3+.12*Math.sin(T*2):0);o.m.scale.setScalar(.001+e)});
    const top=cl((prog-.97)/.03);badge.position.set(W/2+.25,1.3,.5);badge.material.opacity=top;badge.scale.set(1.14*(.001+eob(top)),.5*(.001+eob(top)),1);mg.position.set(0,1.2-myRank*.78,.3);mg.material.opacity=.5}};

P.growth=(g,p,sc)=>{const pts=[];for(let i=0;i<=40;i++){const x=-4+8*i/40,y=-1.8+3.8*Math.pow(i/40,1.8)+Math.sin(i*.9)*.12;pts.push(new THREE.Vector3(x,y,0))}
  const curve=new THREE.CatmullRomCurve3(pts),tube=new THREE.Mesh(new THREE.TubeGeometry(curve,200,.06,8,false),emis('#ffffff',2.5));g.add(tube);const cnt=tube.geometry.index.count;
  const area=new THREE.Mesh(new THREE.PlaneGeometry(8,4),new THREE.MeshBasicMaterial({map:glowTex,color:ACC,transparent:true,opacity:.25,blending:THREE.AdditiveBlending,depthWrite:false}));area.position.set(0,-.4,-.3);g.add(area);
  const grid=new THREE.GridHelper(8,16,SKY,ACC);grid.rotation.x=Math.PI/2;grid.position.z=-.4;grid.material.transparent=true;grid.material.opacity=.18;g.add(grid);
  const head=glow('#ffffff',1.4,1),hh=glow(SKYH,3.4,.6);g.add(head,hh);
  const dots=sc.icons.map((ic,i)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:iconTex(ic,{r:128}),transparent:true,depthWrite:false}));s.scale.setScalar(.7);g.add(s);return{s,u:.15+i*.15}});
  return(lt,T,c)=>{const u=eio((lt-.3)/4.2);tube.geometry.setDrawRange(0,Math.floor(u*cnt/6)*6);const pt=curve.getPoint(Math.max(.001,u));head.position.copy(pt);hh.position.copy(pt);
    g.rotation.y=Math.sin(T*.3)*.2+A.mx*.25;grid.material.opacity=.18*eo(lt/.8);dots.forEach((d,i)=>{const p=curve.getPoint(d.u),act=actW(c.iw[i],lt);d.s.position.set(p.x,p.y+.65+Math.sin(T*2+i)*.06,.2+act*.6);d.s.scale.setScalar((.001+eob((lt-(c.iw[i]||[9])[0]+.2)/.6))*(.7+act*.25))})}};

P.ladder=(g,p,sc)=>{const n=sc.items.length,st=[];for(let i=0;i<n;i++){const m=new THREE.Mesh(RB(1.25,.42,1.2,.08),glassM(i===n-1?'#ffd257':ACCH));m.position.set(-3+i*1.2,-1.8+i*.62,0);g.add(m);
    const lb=label(String(i+1),{w:128,h:128,size:72,weight:900,scale:.42});lb.position.set(m.position.x,m.position.y+.05,.66);g.add(lb);const gl=glow(MINT,1.8,0);gl.position.copy(m.position);g.add(gl);st.push({m,lb,gl})}
  const orb=new THREE.Mesh(new THREE.SphereGeometry(.26,24,16),emis('#ffffff',3));g.add(orb);const og=glow(SKYH,2.2,.9);orb.add(og);
  const cup=new THREE.Group();cup.add(new THREE.Mesh(new THREE.CylinderGeometry(.42,.16,.6,32,1,true),glassM('#ffd257',{side:THREE.DoubleSide,metalness:.7})));const stem=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.35,12),glassM('#ffd257'));stem.position.y=-.45;cup.add(stem);
  const bs=new THREE.Mesh(new THREE.CylinderGeometry(.28,.3,.08,24),glassM('#ffd257'));bs.position.y=-.64;cup.add(bs);cup.position.set(st[n-1].m.position.x,st[n-1].m.position.y+1.15,0);g.add(cup);const cg=glow('#ffd257',3,.0);cup.add(cg);
  let cur=0,from=0,ht=-9;
  return(lt,T,c)=>{g.rotation.y=-.35+Math.sin(T*.3)*.15+A.mx*.3;let ti=0;st.forEach((o,i)=>{const e=eob((lt-.1-i*.1)/.7);o.m.scale.setScalar(.001+e);o.lb.material.opacity=e;const w=c.iw[i];if(w&&lt>=w[0])ti=i;o.gl.material.opacity=doneW(w,lt)*.7+actW(w,lt)*.5});
    if(ti!==cur){from=cur;cur=ti;ht=T}const h=cl((T-ht)/.55),A0=st[from].m.position,B0=st[cur].m.position;orb.position.set(A0.x+(B0.x-A0.x)*h,A0.y+(B0.y-A0.y)*h+.5+Math.sin(h*Math.PI)*.9,0);orb.scale.setScalar(.001+eo((lt-.6)/.5));
    const win=doneW(c.iw[n-1],lt)+actW(c.iw[n-1],lt);cup.rotation.y=T;cup.scale.setScalar(.001+eob((lt-.8)/.8)*(1+win*.3));cg.material.opacity=win*.9}};

P.web=(g,p,sc)=>{const core=new THREE.Mesh(new THREE.SphereGeometry(.7,40,24),glassM(ACCH));g.add(core);g.add(glow(ACCH,5,.6));const N=16,nodes=[];
  for(let i=0;i<N;i++){const y=1-2*(i+.5)/N,r=Math.sqrt(1-y*y),th=i*2.399;const v=new THREE.Vector3(Math.cos(th)*r,y,Math.sin(th)*r).multiplyScalar(2.7);const s=new THREE.Mesh(new THREE.SphereGeometry(.13,12,8),emis(SKYH,1.5));s.position.copy(v);g.add(s);const gl=glow(SKYH,.9,.4);s.add(gl);nodes.push({s,gl,v,grp:i%sc.items.length})}
  const lp=new Float32Array(N*6);nodes.forEach((o,i)=>lp.set([0,0,0,o.v.x,o.v.y,o.v.z],i*6));const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.BufferAttribute(lp,3));
  const ln=new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:SKY,transparent:true,opacity:.35,blending:THREE.AdditiveBlending}));g.add(ln);
  const pulses=nodes.map(()=>{const s=glow('#ffffff',.45,1);g.add(s);return s});
  return(lt,T,c)=>{const a=eob((lt-.1)/1.2);g.scale.setScalar(.001+a);g.rotation.y=T*.15+A.mx*.4;g.rotation.x=.2;core.rotation.y=-T*.3;
    nodes.forEach((o,i)=>{const act=actW(c.iw[o.grp],lt)+doneW(c.iw[o.grp],lt)*.5;o.s.material.emissive.set(act>.3?'#ffffff':SKYH);o.gl.material.opacity=.3+act*.8;const u=(T*.5+i*.13)%1;pulses[i].position.copy(o.v).multiplyScalar(1-u);pulses[i].material.opacity=act*(1-u)})}};

P.bowl=(g,p)=>{const bowl=new THREE.Group();g.add(bowl);
  const prof=[[0,-.95],[.75,-.95],[.8,-.85],[1.35,-.55],[1.8,0],[1.92,.32],[1.86,.36],[1.72,.05],[1.25,-.45],[.7,-.75],[0,-.8]].map(p=>new THREE.Vector2(p[0],p[1]));
  bowl.add(new THREE.Mesh(new THREE.LatheGeometry(prof,80),new THREE.MeshPhysicalMaterial({color:0xe6edfa,roughness:.25,clearcoat:1,envMapIntensity:.5,side:THREE.DoubleSide})));
  const band=new THREE.Mesh(new THREE.TorusGeometry(1.86,.035,12,120),glassM(ACCH,{emissive:ACC,emissiveIntensity:.6}));band.rotation.x=Math.PI/2;band.position.y=.18;bowl.add(band);
  const broth=new THREE.Mesh(new THREE.CircleGeometry(1.68,64),new THREE.MeshStandardMaterial({color:0xd98a3a,emissive:0xff9a40,emissiveIntensity:.35,roughness:.15}));broth.rotation.x=-Math.PI/2;broth.position.y=.12;bowl.add(broth);
  const nm=new THREE.MeshStandardMaterial({color:0xfff1d6,roughness:.4});for(let i=0;i<8;i++){const pts=[];const a0=rnd()*6.28,r0=.2+rnd()*1.1;for(let j=0;j<10;j++){const a=a0+j*.35,r=r0+Math.sin(j*.9)*.25;pts.push(new THREE.Vector3(Math.cos(a)*Math.min(r,1.45),.15+Math.sin(j*1.3)*.04,Math.sin(a)*Math.min(r,1.45)))}bowl.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),36,.045,6),nm))}
  const herb=new THREE.MeshStandardMaterial({color:0x3fbf6a,roughness:.5,emissive:0x0e4020});for(let i=0;i<12;i++){const h=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),herb);h.scale.set(1,.25,.6);const a=rnd()*6.28,r=rnd()*1.3;h.position.set(Math.cos(a)*r,.2,Math.sin(a)*r);bowl.add(h)}
  const beef=new THREE.MeshStandardMaterial({color:0x9a4b3a,roughness:.6});for(let i=0;i<5;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(.6,.04,.35),beef);const a=i*1.25+.3;b.position.set(Math.cos(a)*.75,.19,Math.sin(a)*.75);b.rotation.y=-a;bowl.add(b)}
  const chop=new THREE.MeshStandardMaterial({color:0xc58a52,roughness:.5});[0,.18].forEach(o=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,4.4,10),chop);c.rotation.z=Math.PI/2-.22;c.rotation.y=.5;c.position.set(.6,.62+o*.4,.3+o);bowl.add(c)});
  const plate=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.4,.12,64),new THREE.MeshPhysicalMaterial({color:0x9fb3dc,roughness:.3,clearcoat:1,envMapIntensity:.5}));plate.position.y=-1;bowl.add(plate);
  const bg=glow(AMBER,8,.2);bg.position.set(0,.5,-1.5);bowl.add(bg);const steam=[];for(let i=0;i<28;i++){const s=glow('#fff3e4',1.4+rnd()*1.4,0);bowl.add(s);steam.push({s,ph:rnd(),x:(rnd()-.5)*2.2,z:(rnd()-.5)*1.4,sw:rnd()*6})}
  const rg=rings(g,[3.3,3.9],[AMBER,'#ffffff']);const cf=p.outro?confetti(g):null;
  return(lt,T)=>{const a=eob((lt-.3)/1.3);bowl.scale.setScalar(.001+a);bowl.position.y=-1.2*(1-a)+Math.sin(T*.8)*.06;bowl.rotation.x=.42;bowl.rotation.y=T*.25+A.mx*.4;
    steam.forEach(o=>{const u=(T*.22+o.ph)%1;o.s.position.set(o.x*(1-u*.4)+Math.sin(u*6+o.sw)*.35,.3+u*4,o.z);o.s.material.opacity=a*Math.sin(u*Math.PI)*.2;o.s.scale.setScalar(1+u*2.4)});
    rg.forEach((m,i)=>{m.scale.setScalar(.2+.8*eo((lt-.5)/1.4));m.rotation.x=1.35+Math.sin(T*.3+i)*.2;m.rotation.y=T*.2*(i?-1:1)});if(cf)cf(lt-1.3)}};

P.table=(g,p,sc)=>{const n=sc.icons.length;const floor=new THREE.Mesh(new THREE.CircleGeometry(9,64),new THREE.MeshStandardMaterial({color:0x0c1d4c,roughness:.35,metalness:.6}));floor.rotation.x=-Math.PI/2;g.add(floor);
  const wood=new THREE.MeshStandardMaterial({color:0x56607e,roughness:.6,metalness:.2}),dark=new THREE.MeshStandardMaterial({color:0x2b3554,roughness:.5,metalness:.4});const lamps=[];
  for(let i=0;i<n;i++){const x=(i-(n-1)/2)*3.2,z=-Math.abs(i-(n-1)/2)*.8;const tb=new THREE.Group();tb.position.set(x,0,z);g.add(tb);
    const top=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.09,36),wood);top.position.y=1.05;tb.add(top);const leg=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,1,10),dark);leg.position.y=.5;tb.add(leg);
    [[-1.4,0,Math.PI/2],[1.4,0,-Math.PI/2]].forEach(([cx,cz,ry])=>{const ch=new THREE.Group();ch.position.set(cx,0,cz);ch.rotation.y=ry+(rnd()-.5)*.4;tb.add(ch);const seat=new THREE.Mesh(new THREE.BoxGeometry(.65,.07,.65),wood);seat.position.y=.62;ch.add(seat);const back=new THREE.Mesh(new THREE.BoxGeometry(.65,.7,.07),wood);back.position.set(0,1,.3);ch.add(back)});
    const shade=new THREE.Mesh(new THREE.ConeGeometry(.5,.42,28,1,true),new THREE.MeshStandardMaterial({color:0x1a2340,roughness:.4,metalness:.7,side:THREE.DoubleSide}));shade.position.set(x,3.5,z);g.add(shade);
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.15,16,12),emis(AMBER,3));bulb.position.set(x,3.26,z);g.add(bulb);const gl=glow(AMBER,2.6,.8);gl.position.copy(bulb.position);g.add(gl);
    const cone=new THREE.Mesh(new THREE.ConeGeometry(1.4,3.2,28,1,true),new THREE.MeshBasicMaterial({map:beamTex,color:C('#ffcf9a'),transparent:true,opacity:.16,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));cone.position.set(x,1.65,z);g.add(cone);
    const pool=glow(AMBER,3,.3);pool.position.set(x,1.12,z);g.add(pool);lamps.push({bulb,gl,cone,pool,ph:rnd()*9})}
  const sign=label('Hôm nay: còn nhiều bàn trống',{w:768,h:120,size:46,weight:700,color:'#ffd9a8',bg:'rgba(10,20,50,.75)',scale:.55});sign.position.set(0,2.5,-3.4);g.add(sign);
  return(lt,T,c)=>{g.rotation.y=Math.sin(T*.15)*.12;lamps.forEach((l,i)=>{const act=actW(c.iw[i],lt),fl=Math.sin(T*13+l.ph)*Math.sin(T*7.3+l.ph*2)>.82?.25:1,v=(.55+act*1.1)*fl;
    l.bulb.material.emissiveIntensity=3*v;l.gl.material.opacity=.8*v;l.cone.material.opacity=.15*v;l.pool.material.opacity=.3*v});sign.material.opacity=eo((lt-1)/1.2)}};

P.menu=(g,p,sc)=>{const plates=p.labels.map((t,i)=>{const o=new THREE.Group();g.add(o);const pl=new THREE.Mesh(new THREE.CylinderGeometry(.62,.55,.07,40),whiteM());o.add(pl);
    const ic=new THREE.Sprite(new THREE.SpriteMaterial({map:iconTex(sc.icons[i],{r:128}),transparent:true,depthWrite:false}));ic.scale.setScalar(.62);ic.position.y=.42;o.add(ic);
    const cl2=new THREE.Mesh(new THREE.SphereGeometry(.52,32,16,0,Math.PI*2,0,Math.PI/2),new THREE.MeshPhysicalMaterial({color:0xd8dfee,metalness:1,roughness:.18,envMapIntensity:1.1}));o.add(cl2);
    const knob=new THREE.Mesh(new THREE.SphereGeometry(.07,12,8),glassM(AMBER));knob.position.y=.54;cl2.add(knob);const lb=label(t,{w:384,h:96,size:40,weight:700,bg:'rgba(8,20,60,.85)',scale:.34});lb.position.y=-.38;o.add(lb);
    const gl=glow(AMBER,1.8,0);gl.position.y=.4;o.add(gl);o.position.set((i%4-1.5)*1.75,i<4?.95:-1.05,0);return{o,ic,cl2,lb,gl}});
  return(lt,T,c)=>{g.rotation.x=.32;g.rotation.y=Math.sin(T*.25)*.15+A.mx*.25;plates.forEach((q,i)=>{const e=eob((lt-.1-i*.08)/.8),act=actW(c.iw[i],lt),open=Math.max(act,doneW(c.iw[i],lt));
    q.o.scale.setScalar(.001+e);q.cl2.position.y=open*1.1;q.cl2.rotation.z=open*.5;q.cl2.material.opacity=1;q.ic.material.opacity=open;q.gl.material.opacity=act*.9;q.lb.material.opacity=e*(.6+act*.4)})}};

P.feed=(g,p,sc,k)=>{const ph=phoneBody(g);const tex=atex(512,1024,(c,w,h,lt,T)=>SCREENS.fan(c,w,h,lt,T,[]),k);screenOn(ph,tex);
  const notes=['Đã lên lịch bài mới','Bài viết được duyệt','Bài SEO mới'].map((t,i)=>{const s=label(t,{w:640,h:120,size:42,weight:700,bg:'rgba(255,255,255,.95)',color:INK,scale:.5});g.add(s);return s});
  const hearts=[];for(let i=0;i<14;i++){const s=label('♥',{w:128,h:128,size:80,weight:900,color:'#fff',bg:i%3?'#e8366f':ACCH,scale:.38});g.add(s);hearts.push({s,ph:rnd(),x:rnd()})}const cf=p.outro?confetti(g):null;
  return(lt,T)=>{const a=eob((lt-.15)/1.1);ph.scale.setScalar(.001+a);ph.rotation.y=.3+Math.sin(T*.5)*.15+A.mx*.3;ph.position.y=Math.sin(T*.8)*.1;
    notes.forEach((s,i)=>{const u=((T*.16)+i/3)%1;s.position.set(-2.3-Math.sin(u*3)*.2,1.8-u*3.4,.8);s.material.opacity=a*Math.sin(u*Math.PI)});
    hearts.forEach(o=>{const u=(T*.24+o.ph)%1;o.s.position.set(1.4+o.x*1.4+Math.sin(u*7)*.25,-1.8+u*4.4,.7);o.s.material.opacity=a*Math.sin(u*Math.PI);o.s.scale.setScalar(.28+.14*Math.sin(u*Math.PI))});if(cf)cf(lt-1.3)}};

P.trio=(g,p,sc)=>{const objs=[];
  const doc=new THREE.Group();const dt=ctex(512,680,(c,w,h)=>{c.fillStyle='#fff';c.fillRect(0,0,w,h);c.fillStyle=ACCH;c.fillRect(40,50,220,26);lines(c,40,110,430,6,34,'#c8d2e8',14);const gr=c.createLinearGradient(40,330,470,470);gr.addColorStop(0,'#dfe8ff');gr.addColorStop(1,SKYH);c.fillStyle=gr;rrect(c,40,330,430,150,14);c.fill();lines(c,40,520,430,4,34,'#c8d2e8',14)},true);
  doc.add(new THREE.Mesh(RB(1.9,2.5,.08,.05),[whiteM(),whiteM(),whiteM(),whiteM(),new THREE.MeshStandardMaterial({map:dt,roughness:.5}),whiteM()]));
  const phn=new THREE.Group();phn.add(new THREE.Mesh(RB(1.25,2.5,.14,.16),new THREE.MeshPhysicalMaterial({color:0x10172e,metalness:.85,roughness:.25,clearcoat:1})));const ps=new THREE.Mesh(new THREE.PlaneGeometry(1.12,2.3),new THREE.MeshBasicMaterial({map:ctex(256,512,c=>{c.save();c.scale(.5,.5);SCREENS.fan(c,512,1024,0,0,[]);c.restore()},true)}));ps.position.z=.075;phn.add(ps);
  const mag=new THREE.Group();const rim2=new THREE.Mesh(new THREE.TorusGeometry(.8,.13,16,64),glassM(ACCH,{metalness:.5}));mag.add(rim2);const lens=new THREE.Mesh(new THREE.CircleGeometry(.72,48),new THREE.MeshPhysicalMaterial({color:0xcfe6ff,roughness:.05,transparent:true,opacity:.35,envMapIntensity:1.2}));mag.add(lens);
  const hd=new THREE.Mesh(new THREE.CylinderGeometry(.12,.14,1.3,16),glassM('#ffffff'));hd.position.set(.95,-.95,0);hd.rotation.z=Math.PI/4;mag.add(hd);
  [doc,phn,mag].forEach((o,i)=>{g.add(o);const gl=glow(i===2?SKYH:ACCH,3.6,0);gl.position.z=-.4;o.add(gl);objs.push({o,gl,x:(i-1)*2.6})});
  return(lt,T,c)=>objs.forEach((q,i)=>{const e=eob((lt-.2-i*.15)/.9),act=actW(c.iw[i],lt);q.o.position.set(q.x,Math.sin(T*1.1+i)*.15+act*.25,act*1.4);q.o.scale.setScalar((.001+e)*(1+act*.2));
    q.o.rotation.set(Math.sin(T*.6+i)*.12,-.25+(i-1)*.25+Math.sin(T*.5+i)*.2+act*Math.sin(T*1.5)*.15+A.mx*.3,0);q.gl.material.opacity=act*.8})};

P.calendar=(g,p,sc)=>{const TY={1:'S',2:'E',4:'D',5:'S',8:'E',10:'D',11:'S',13:'E',16:'D',17:'S',19:'E',20:'D',22:'S',23:'E',25:'D',26:'S',29:'E'};const COL={S:ACCH,E:MINT,D:AMBER};const tiles=[];
  for(let d=1;d<=35;d++){const ty=d<=30?TY[d]:null;const t=ctex(128,128,c=>{c.fillStyle=ty?COL[ty]:(d<=30?'#1b2a63':'#121c44');rrect(c,4,4,120,120,18);c.fill();c.fillStyle=ty?'#04102e':'#8fa0d0';c.font=F(800,40);c.fillText(d<=30?String(d):'',16,50);if(ty){c.font=F(700,22);c.fillText(ty==='S'?'Social':ty==='E'?'SEO':'Đa kênh',16,104)}},true);
    const m=new THREE.Mesh(RB(.74,.74,.1,.06),[darkM(),darkM(),darkM(),darkM(),new THREE.MeshStandardMaterial({map:t,roughness:.45}),darkM()]);const i=d-1;m.position.set((i%7-3)*.84,1.7-Math.floor(i/7)*.84,0);g.add(m);
    const ck=label('✓',{w:96,h:96,size:62,weight:900,color:'#04102e',bg:'#ffffff',scale:.26});ck.position.set(m.position.x+.24,m.position.y+.24,.12);g.add(ck);tiles.push({m,ty,ck,i})}
  const head=label('Tháng này · 18–30 bài',{w:768,h:120,size:50,weight:800,bg:'rgba(255,255,255,.95)',color:INK,scale:.5});head.position.set(0,2.75,.2);g.add(head);
  return(lt,T,c)=>{g.rotation.y=-.3+Math.sin(T*.3)*.12+A.mx*.3;g.rotation.x=.12;const a0=actW(c.iw[0],lt),a1=Math.max(actW(c.iw[1],lt),doneW(c.iw[1],lt));
    tiles.forEach(o=>{const f=eo((lt-.2-o.i*.035)/.6);o.m.rotation.x=(1-f)*-Math.PI/2;o.m.scale.setScalar(.001+f);o.m.position.z=o.ty?a0*.25*(.5+.5*Math.sin(T*4+o.i)):0;o.ck.material.opacity=o.ty?eo((lt-(c.iw[1]||[99])[0]-o.i*.03)/.3)*a1:0});
    head.material.opacity=eo((lt-(c.iw[2]||[1])[0])/.5)}};

P.hearts=(g,p)=>{const sh=new THREE.Shape();sh.moveTo(-1.6,-.9);sh.lineTo(-1.6,1);sh.quadraticCurveTo(-1.6,1.4,-1.2,1.4);sh.lineTo(1.2,1.4);sh.quadraticCurveTo(1.6,1.4,1.6,1);sh.lineTo(1.6,-.6);sh.quadraticCurveTo(1.6,-1,1.2,-1);sh.lineTo(-.6,-1);sh.lineTo(-1.3,-1.6);sh.lineTo(-1.15,-1);sh.quadraticCurveTo(-1.6,-1,-1.6,-.9);
  const geo=new THREE.ExtrudeGeometry(sh,{depth:.4,bevelEnabled:true,bevelThickness:.12,bevelSize:.1,bevelSegments:4});geo.center();const bub=new THREE.Mesh(geo,glassM(ACCH));g.add(bub);
  const face=label('♥ 12,4k',{w:512,h:160,size:86,weight:900,color:'#fff',scale:.9});face.position.z=.4;bub.add(face);const R=['♥','👍','★','💬'],fx=[];
  for(let i=0;i<22;i++){const s=label(R[i%4],{w:128,h:128,size:72,weight:900,color:'#fff',bg:[ '#e8366f',ACCH,'#f5a524','#3EDBAA'][i%4],scale:.42});g.add(s);fx.push({s,ph:rnd(),a:rnd()*6.28,r:1.6+rnd()*1.6})}
  const rg=rings(g,[2.9,3.5]);const cf=p.outro?confetti(g):null;
  return(lt,T)=>{const a=eob((lt-.1)/1.1);bub.scale.setScalar(.001+a);bub.rotation.y=Math.sin(T*.6)*.35+A.mx*.4;bub.rotation.x=Math.sin(T*.4)*.1;bub.position.y=Math.sin(T*.9)*.12;
    fx.forEach(o=>{const u=(T*.2+o.ph)%1,an=o.a+u*1.5;o.s.position.set(Math.cos(an)*o.r,-1.6+u*4,Math.sin(an)*o.r*.5);o.s.material.opacity=a*Math.sin(u*Math.PI)});
    rg.forEach((m,i)=>{m.scale.setScalar(.2+.8*eo((lt-.3)/1.4));m.rotation.x=1.3+Math.sin(T*.3+i)*.3;m.rotation.y=T*.2*(i?-1:1)});if(cf)cf(lt-1.3)}};

function siteScreen(c,w,h,T,scroll){c.fillStyle='#f6f8ff';c.fillRect(0,0,w,h);const off=scroll?(T*30)%300:0;c.save();c.translate(0,-off);
  for(let rep=0;rep<2;rep++){const y0=rep*h;const gr=c.createLinearGradient(0,y0,w,y0+h*.45);gr.addColorStop(0,ACCH);gr.addColorStop(1,'#0a1640');c.fillStyle=gr;c.fillRect(0,y0,w,h*.45);
    c.fillStyle='#fff';c.font=F(900,Math.round(w*.06));c.fillText('Thương hiệu của bạn',w*.06,y0+h*.2);c.fillStyle='rgba(255,255,255,.7)';rrect(c,w*.06,y0+h*.26,w*.4,h*.025,6);c.fill();
    c.fillStyle='#fff';rrect(c,w*.06,y0+h*.32,w*.22,h*.07,h*.035);c.fill();for(let i=0;i<3;i++){c.fillStyle='#fff';rrect(c,w*.06+i*w*.3,y0+h*.52,w*.26,h*.3,16);c.fill();const g2=c.createLinearGradient(0,y0+h*.52,0,y0+h*.67);g2.addColorStop(0,'#dfe8ff');g2.addColorStop(1,SKYH);c.fillStyle=g2;rrect(c,w*.06+i*w*.3,y0+h*.52,w*.26,h*.15,16);c.fill();lines(c,w*.08+i*w*.3,y0+h*.7,w*.2,2,h*.04,'#cdd6ea',h*.018)}}c.restore()}
P.browser=(g,p,sc,k)=>{const win=new THREE.Group();g.add(win);win.add(new THREE.Mesh(RB(5.6,3.7,.16,.16),new THREE.MeshPhysicalMaterial({color:0x10172e,metalness:.7,roughness:.3,clearcoat:1})));
  const tex=atex(1024,640,(c,w,h,lt,T)=>{c.fillStyle='#e9eef8';c.fillRect(0,0,w,56);['#ff5f57','#febc2e','#28c840'].forEach((cc,i)=>{c.fillStyle=cc;c.beginPath();c.arc(30+i*30,28,9,0,7);c.fill()});c.fillStyle='#fff';rrect(c,140,12,w-280,32,16);c.fill();c.fillStyle='#55607e';c.font=F(500,20);c.fillText('https://website-cua-ban.vn',170,35);
    c.save();c.translate(0,56);if(p.build){c.fillStyle='#f6f8ff';c.fillRect(0,0,w,h-56)}else siteScreen(c,w,h-56,T,true);c.restore()},k);
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(5.36,3.46),new THREE.MeshBasicMaterial({map:tex}));scr.position.z=.085;win.add(scr);const wg=glow(SKYH,9,.25);wg.position.z=-.8;win.add(wg);
  const parts=[];if(p.build){const L=[[0,1.05,5.0,1.1,ACCH],[-1.65,-.35,1.55,1.3,'#ffffff'],[0,-.35,1.55,1.3,'#ffffff'],[1.65,-.35,1.55,1.3,'#ffffff'],[-1.2,-1.35,2.4,.35,SKYH],[1.3,-1.35,2.2,.35,MINT]];
    L.forEach((q,i)=>{const m=new THREE.Mesh(RB(q[2],q[3],.1,.06),glassM(q[4]));win.add(m);parts.push({m,home:new THREE.Vector3(q[0],q[1]-.15,.16),from:new THREE.Vector3((rnd()-.5)*10,(rnd()-.5)*7,3+rnd()*3),r:rnd()*6})})}
  else{['SEO','GA','GSC','Link'].forEach((t,i)=>{const s=label(t,{w:256,h:112,size:54,weight:900,bg:'rgba(255,255,255,.95)',color:ACCH,scale:.48});g.add(s);parts.push({s,i})})}
  return(lt,T,c)=>{const a=eob((lt-.1)/1.1);win.scale.setScalar(.001+a);win.rotation.y=-.28+Math.sin(T*.45)*.12+A.mx*.3;win.rotation.x=.05+Math.sin(T*.35)*.04;
    if(p.build)parts.forEach((q,i)=>{const w=c.iw[i]||[.6+i*.4],u=eo((lt-w[0]+.15)/.9);q.m.position.lerpVectors(q.from,q.home,u);q.m.rotation.set((1-u)*q.r,(1-u)*q.r,0);q.m.scale.setScalar(.001+(lt>w[0]-.15?1:0))});
    else parts.forEach(q=>{const w=c.iw[Math.min(q.i,c.iw.length-1)],e=eob((lt-(w?w[0]:1))/.6),an=T*.4+q.i*1.57;q.s.position.set(Math.cos(an)*3.4,Math.sin(an*1.2)*1.6,1+Math.sin(an)*.6);q.s.material.opacity=e;q.s.scale.set(1.14*(.001+e),.5*(.001+e),1)})}};

P.construct=(g,p)=>{const grid=new THREE.GridHelper(8,16,SKY,ACC);grid.rotation.x=Math.PI/2;grid.position.z=-.6;grid.material.transparent=true;grid.material.opacity=.2;g.add(grid);
  const phi=[2.6,1.6,1,.62].map((r,i)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(r,.018,8,160),emis(i%2?'#ffd257':SKYH,2.2));m.position.set(i?(2.6-r)*.55:0,i?(r-2.6)*.25:0,-.2);g.add(m);return m});
  const Pm=new THREE.Mesh(pGeo(),glassM(ACCH,{metalness:.25}));Pm.scale.setScalar(.82);g.add(Pm);const pg=glow(ACCH,8,.5);pg.position.z=-.8;g.add(pg);
  const dots=['#1F5BFF','#0A1433','#8CCBFF','#FFB547',ACCH].map((c,i)=>{const s=new THREE.Mesh(new THREE.SphereGeometry(.22,24,16),glassM(c));g.add(s);return s});const cf=p.outro?confetti(g):null;
  return(lt,T)=>{grid.material.opacity=.2*eo(lt/1);phi.forEach((m,i)=>{m.scale.setScalar(.001+eo((lt-.2-i*.25)/1));m.rotation.z=T*.1*(i%2?-1:1)});
    const e=eo((lt-.6)/1.4);Pm.scale.set(.82*eob((lt-.5)/1),.82*eob((lt-.5)/1),.82*Math.max(.02,e));Pm.rotation.y=Math.sin(T*.5)*.45+A.mx*.5;Pm.rotation.x=-A.my*.3;
    dots.forEach((s,i)=>{const an=T*.5+i*1.256;s.position.set(Math.cos(an)*3.2,Math.sin(an)*1.1,Math.sin(an)*1.2);s.scale.setScalar(.001+eob((lt-1-i*.12)/.6))});if(cf)cf(lt-1.3)}};

P.swatches=(g,p,sc)=>{const cols=['#1F5BFF','#0A1433','#8CCBFF','#FFB547','#E8EEFC',ACCH],fan=new THREE.Group();fan.position.y=-1.6;g.add(fan);
  const cards=cols.map((c,i)=>{const t=ctex(256,420,(cc,w,h)=>{cc.fillStyle=c;rrect(cc,0,0,w,h,24);cc.fill();cc.fillStyle='#fff';rrect(cc,0,h-110,w,110,0);cc.fillRect(0,h-110,w,86);cc.fillStyle='#0a1433';cc.font=F(800,34);cc.fillText(c.toUpperCase(),22,h-50)},true);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(1.25,2.05),new THREE.MeshStandardMaterial({map:t,roughness:.4,side:THREE.DoubleSide}));m.geometry.translate(0,1.05,0);fan.add(m);return m});
  const mark=new THREE.Mesh(pGeo(),glassM(ACCH));mark.scale.setScalar(.38);mark.position.set(-2.6,1.6,.4);g.add(mark);const mg=glow(ACCH,3,0);mark.add(mg);
  const book=new THREE.Group();for(let i=0;i<4;i++){const s=new THREE.Mesh(RB(1.5,2,.06,.03),i===3?glassM(ACCH):whiteM());s.position.set(i*.05,i*.05,i*.07);book.add(s)}book.position.set(2.7,1.3,0);g.add(book);const bg2=glow(SKYH,3,0);book.add(bg2);
  return(lt,T,c)=>{const a0=actW(c.iw[0],lt),a1=actW(c.iw[1],lt),a2=actW(c.iw[2],lt),open=eo((lt-.3)/1.2)*(.55+a1*.45);
    cards.forEach((m,i)=>{m.rotation.z=(i-(cards.length-1)/2)*.26*open;m.position.z=i*.02;m.position.x=(i-(cards.length-1)/2)*.05});fan.rotation.y=Math.sin(T*.4)*.25+A.mx*.3;fan.scale.setScalar(.001+eob(lt/1));
    mark.rotation.y=T*.8;mark.scale.setScalar(.001+.38*eob((lt-.4)/.8)*(1+a0*.6));mg.material.opacity=a0;book.rotation.y=-.5+Math.sin(T*.6)*.2;book.scale.setScalar(.001+eob((lt-.6)/.8)*(1+a2*.3));book.position.z=a2*1.2;bg2.material.opacity=a2}};

P.book=(g,p,sc)=>{const bk=new THREE.Group();g.add(bk);const W=2.1,H=2.8;const cov=glassM(ACCH);const left=new THREE.Mesh(RB(W,H,.08,.04),cov);left.position.set(-W/2-.03,0,-.05);bk.add(left);const right=new THREE.Mesh(RB(W,H,.08,.04),cov);right.position.set(W/2+.03,0,-.05);bk.add(right);
  const ART=[(c,w,h)=>{c.fillStyle=ACCH;c.beginPath();c.arc(w/2,h*.45,120,0,7);c.fill();c.fillStyle='#fff';c.font=F(900,150);c.textAlign='center';c.fillText('P',w/2,h*.45+52)},
   (c,w,h)=>{['#1F5BFF','#0A1433','#8CCBFF','#FFB547'].forEach((cc,i)=>{c.fillStyle=cc;rrect(c,60+i*100,h*.3,84,260,14);c.fill()})},
   (c,w,h)=>{c.fillStyle='#0a1433';c.font=F(900,220);c.fillText('Aa',60,h*.55);c.font=F(600,30);c.fillText('Be Vietnam Pro · 900',64,h*.68)},
   (c,w,h)=>{c.fillStyle='#e8eefc';rrect(c,60,h*.25,190,120,12);c.fill();c.fillStyle=ACCH;rrect(c,270,h*.25,180,260,12);c.fill();c.fillStyle='#0a1433';rrect(c,60,h*.25+140,190,120,12);c.fill()},
   (c,w,h)=>{for(let i=0;i<4;i++){c.fillStyle=i%2?'#e8eefc':ACCH;rrect(c,90+i*22,h*.22+i*18,300,380,12);c.fill()}}];
  const pg=(i,back)=>ctex(512,680,(c,w,h)=>{c.fillStyle='#fbfcff';c.fillRect(0,0,w,h);if(back){ART[i](c,w,h);c.textAlign='left';return}c.fillStyle=ACCH;c.font=F(600,26);c.fillText('BRAND BOOK · '+String(i+1).padStart(2,'0'),40,70);c.fillStyle='#0a1433';c.font=F(900,64);c.fillText(p.pages[i],40,160);lines(c,40,210,420,4,30,'#cfd8ec',12);c.globalAlpha=.25;ART[i](c,w,h*1.25);c.globalAlpha=1},true);
  const pages=p.pages.map((t,i)=>{const piv=new THREE.Group();bk.add(piv);const geo=new THREE.PlaneGeometry(W,H);geo.translate(W/2,0,0);const fr=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:pg(i,0),roughness:.6}));const bkm=new THREE.Mesh(geo.clone(),new THREE.MeshStandardMaterial({map:pg(i,1),roughness:.6}));bkm.rotation.y=Math.PI;bkm.position.x=W;
    piv.add(fr,bkm);piv.position.z=.02+(p.pages.length-i)*.012;return{piv,i}});
  return(lt,T,c)=>{const a=eob((lt-.1)/1.1);bk.scale.setScalar(.001+a);bk.rotation.x=-.5+Math.sin(T*.4)*.05-A.my*.15;bk.rotation.y=Math.sin(T*.3)*.12+A.mx*.3;bk.position.y=Math.sin(T*.8)*.08;
    pages.forEach(o=>{const w=c.iw[o.i],f=w?eio((lt-w[0]-.1)/.9):0;o.piv.rotation.y=-Math.PI*f;o.piv.position.z=f>.5?.02+o.i*.012:.02+(pages.length-o.i)*.012})}};

P.camera=(g,p)=>{const cam=new THREE.Group();g.add(cam);const body=darkM();body.color.set(0x1a2036);cam.add(new THREE.Mesh(RB(2.6,1.7,1.5,.14),body));
  const lens=new THREE.Group();lens.rotation.x=Math.PI/2;lens.position.set(0,0,.75);cam.add(lens);
  [[.66,.5,0x15192a,.3],[.74,.22,null,.66],[.6,.55,0x0f1322,1.05]].forEach(([r,l,c,z],i)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,l,48),c?new THREE.MeshStandardMaterial({color:c,metalness:.8,roughness:.35}):glassM(ACCH,{emissive:ACC,emissiveIntensity:.5}));m.position.y=z;lens.add(m)});
  const glass=new THREE.Mesh(new THREE.CircleGeometry(.5,48),new THREE.MeshPhysicalMaterial({color:0x0b1638,roughness:.02,metalness:.2,clearcoat:1,envMapIntensity:2}));glass.position.z=2.1;cam.add(glass);const lg=glow(SKYH,2.2,.6);lg.position.set(-.18,.18,2.15);cam.add(lg);
  const handle=new THREE.Mesh(new THREE.TorusGeometry(.55,.08,10,40,Math.PI),body);handle.position.set(0,.85,0);cam.add(handle);const vf=new THREE.Mesh(RB(.5,.42,.8,.08),body);vf.position.set(-1.25,.5,-.4);cam.add(vf);
  const rec=new THREE.Mesh(new THREE.SphereGeometry(.09,16,12),emis('#ff3b3b',4));rec.position.set(.95,.62,.76);cam.add(rec);const rg2=glow('#ff3b3b',.9,.9);rec.add(rg2);
  const tc=atex(512,96,(c,w,h,lt,T)=>{c.fillStyle='rgba(8,12,30,.85)';rrect(c,2,2,w-4,h-4,20);c.fill();c.fillStyle='#ff4d4d';c.beginPath();c.arc(40,h/2,12,0,7);c.fill();c.fillStyle='#fff';c.font=F(700,40);const s=Math.max(0,T);c.fillText('REC '+[Math.floor(s/3600),Math.floor(s/60)%60,Math.floor(s)%60,Math.floor(s*25)%25].map(v=>String(v).padStart(2,'0')).join(':'),70,h/2+14)},0,25);
  const tcs=new THREE.Sprite(new THREE.SpriteMaterial({map:tc,transparent:true,depthWrite:false}));tcs.scale.set(2.4,.45,1);tcs.position.set(0,1.75,0);cam.add(tcs);
  const waves=[0,1,2].map(i=>{const m=new THREE.Mesh(new THREE.TorusGeometry(.7,.02,8,80),emis(SKYH,2.5));m.position.z=2.2;cam.add(m);return m});const rg=rings(g,[3.4,4]);const cf=p.outro?confetti(g):null;
  return(lt,T)=>{const a=eob((lt-.1)/1.2);cam.scale.setScalar(.001+a);cam.rotation.y=-.55+Math.sin(T*.4)*.2+A.mx*.4;cam.rotation.x=.1+Math.sin(T*.3)*.05-A.my*.2;cam.position.y=Math.sin(T*.8)*.1;
    lens.children[1].rotation.y=T*.6;rec.material.emissiveIntensity=Math.sin(T*5)>0?4:.4;rg2.material.opacity=Math.sin(T*5)>0?.9:.1;
    waves.forEach((m,i)=>{const u=(T*.45+i/3)%1;m.position.z=2.2+u*2.4;m.scale.setScalar(1+u*2.2);m.material.emissiveIntensity=2.5*(1-u)*a});rg.forEach((m,i)=>{m.scale.setScalar(.2+.8*eo((lt-.4)/1.4));m.rotation.x=1.3+Math.sin(T*.3+i)*.3;m.rotation.y=T*.2*(i?-1:1)});if(cf)cf(lt-1.3)}};

P.film=(g,p,sc,k)=>{const n=p.labels.length,FW=360;const tex=ctex(FW*n,300,(c,w,h)=>{c.fillStyle='#0b0f1e';c.fillRect(0,0,w,h);for(let i=0;i<n;i++){const x=i*FW;const gr=c.createLinearGradient(x,40,x+FW,260);const hues=[ACCH,'#ff8a5b',SKYH,'#ffd257','#3EDBAA','#b57bff'];gr.addColorStop(0,hues[i%6]);gr.addColorStop(1,'#14204d');c.fillStyle=gr;rrect(c,x+20,48,FW-40,204,14);c.fill();
    c.fillStyle='#fff';c.font=F(900,56);c.fillText(p.labels[i],x+44,170);icon(c,sc.icons[i]||'play',x+FW-80,96,60,'#fff',2.4);for(let j=0;j<8;j++){c.fillStyle='#e8eefc';rrect(c,x+10+j*45,12,26,20,5);c.fill();rrect(c,x+10+j*45,h-32,26,20,5);c.fill()}}},true);
  tex.wrapS=THREE.RepeatWrapping;tex.repeat.set(2.2/n*1.6,1);
  const pts=[];for(let i=0;i<=8;i++){const u=i/8;pts.push(new THREE.Vector3(-6+12*u,Math.sin(u*Math.PI*2)*.9,Math.cos(u*Math.PI*1.4)*1.6-1))}const curve=new THREE.CatmullRomCurve3(pts);
  const SEG=160,geo=new THREE.PlaneGeometry(1,1.3,SEG,1),pos=geo.attributes.position;for(let i=0;i<=SEG;i++){const u=i/SEG,pt=curve.getPoint(u),tg=curve.getTangent(u);for(let j=0;j<2;j++){const id=j*(SEG+1)+i,y=pos.getY(id);pos.setXYZ(id,pt.x-tg.y*0,pt.y+y,pt.z)}}geo.computeVertexNormals();
  const strip=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:tex,roughness:.5,side:THREE.DoubleSide,emissive:C('#ffffff'),emissiveMap:tex,emissiveIntensity:.35}));g.add(strip);
  const big=sc.items.map((_,i)=>{const s=label(p.labels[i],{w:512,h:140,size:84,weight:900,bg:'rgba(255,255,255,.95)',color:ACCH,scale:.7});s.position.set(0,1.9,.8);g.add(s);return s});
  return(lt,T,c)=>{const a=eo((lt-.1)/1);strip.scale.set(1,.001+a,1);tex.offset.x=-T*.05;g.rotation.y=Math.sin(T*.25)*.15+A.mx*.25;
    big.forEach((s,i)=>{const act=actW(c.iw[i],lt);s.material.opacity=act;s.position.y=1.9+(1-act)*.3})}};

P.clap=(g,p,sc)=>{const cb=new THREE.Group();g.add(cb);const bt=ctex(512,380,(c,w,h)=>{c.fillStyle='#14182a';c.fillRect(0,0,w,h);c.strokeStyle='#e8eefc';c.lineWidth=4;c.strokeRect(20,20,w-40,h-40);c.beginPath();c.moveTo(20,140);c.lineTo(w-20,140);c.moveTo(20,250);c.lineTo(w-20,250);c.moveTo(w/2,140);c.lineTo(w/2,h-20);c.stroke();
    c.fillStyle='#e8eefc';c.font=F(800,58);c.fillText('PMEDIA',40,104);c.font=F(600,28);c.fillText('SCENE',40,180);c.fillText('TAKE',w/2+20,180);c.font=F(800,56);c.fillText('01',40,236);c.fillText('03',w/2+20,236);c.font=F(600,28);c.fillText('ROLL · A',40,310);c.fillText('PROD',w/2+20,310)},true);
  const board=new THREE.Mesh(RB(2.7,2,.12,.04),[darkM(),darkM(),darkM(),darkM(),new THREE.MeshStandardMaterial({map:bt,roughness:.5}),darkM()]);cb.add(board);
  const st=ctex(512,64,(c,w,h)=>{for(let i=0;i<9;i++){c.fillStyle=i%2?'#ffffff':'#14182a';c.beginPath();c.moveTo(i*64-20,0);c.lineTo(i*64+40,0);c.lineTo(i*64+20,h);c.lineTo(i*64-40,h);c.fill()}},true);
  const armP=new THREE.Group();armP.position.set(-1.35,1.05,0);cb.add(armP);const arm=new THREE.Mesh(RB(2.7,.38,.12,.03),[darkM(),darkM(),darkM(),darkM(),new THREE.MeshStandardMaterial({map:st}),darkM()]);arm.position.x=1.35;armP.add(arm);
  const top=new THREE.Mesh(RB(2.7,.3,.12,.03),[darkM(),darkM(),darkM(),darkM(),new THREE.MeshStandardMaterial({map:st}),darkM()]);top.position.y=.86;cb.add(top);
  const flash=glow('#ffffff',5,0);flash.position.set(.4,1.1,.3);cb.add(flash);const chips=sc.items.map((_,i)=>{const s=label(['Đúng nhận diện','Đa nền tảng','Chuyển đổi','0 thiết bị'][i]||'',{w:448,h:110,size:44,weight:800,bg:'rgba(255,255,255,.95)',color:ACCH,scale:.46});g.add(s);return s});
  return(lt,T,c)=>{const a=eob((lt-.1)/1.1);cb.scale.setScalar(.001+a);cb.rotation.y=-.3+Math.sin(T*.4)*.15+A.mx*.3;cb.rotation.x=.05;const ph=(T%2.4)/2.4;const ang=ph<.7?.5*eo(ph/.7):.5*(1-eo((ph-.7)/.06));armP.rotation.z=ang;flash.material.opacity=ph>.76&&ph<.86?(1-(ph-.76)/.1)*.9:0;
    chips.forEach((s,i)=>{const act=actW(c.iw[i],lt)+doneW(c.iw[i],lt)*.6,an=i*1.57+T*.25;s.position.set(Math.cos(an)*2.9,Math.sin(an)*1.6,.8);s.material.opacity=cl(act)})}};

P.news=(g,p)=>{const mk=(i)=>ctex(400,540,(c,w,h)=>{c.fillStyle='#f4f1ea';c.fillRect(0,0,w,h);c.fillStyle='#14182a';c.font=F(900,44);c.fillText('BẢN TIN',24,58);c.fillRect(24,72,w-48,4);c.font=F(800,30);c.fillText(i%2?'Thương hiệu của bạn':'Doanh nghiệp tiêu biểu',24,118);c.fillText(i%2?'lên báo hôm nay':'được khách tin chọn',24,154);
    const gr=c.createLinearGradient(24,180,w-24,330);gr.addColorStop(0,ACCH);gr.addColorStop(1,SKYH);c.fillStyle=gr;c.fillRect(24,176,w-48,150);for(let k=0;k<2;k++)lines(c,24+k*(w-48)/2,350,(w-72)/2,6,26,'#9a9a9a',8)},true);
  const N=p.stack?4:7,sheets=[];for(let i=0;i<N;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(1.7,2.3),new THREE.MeshStandardMaterial({map:mk(i),roughness:.7,side:THREE.DoubleSide}));g.add(m);
    const tag=p.stack?label(['Bài PR','Banner','Video','Textlink'][i],{w:320,h:100,size:46,weight:800,bg:ACCH,scale:.42}):null;if(tag){tag.position.set(0,1.4,.05);m.add(tag)}sheets.push({m,tag,ph:i/N,r:rnd()})}
  const rg=p.stack?[]:rings(g,[3.4,4.1]);const cf=p.outro?confetti(g):null;
  return(lt,T,c)=>{const a=eo((lt-.1)/1.2);sheets.forEach((o,i)=>{if(p.stack){const w=c.iw[i],act=actW(w,lt),f=w?eo((lt-w[0]+.2)/.7):0;o.m.position.set((i-(N-1)/2)*1.95*f,act*.35+Math.sin(T+i)*.05,-i*.02+act*.8);o.m.rotation.set(0,(1-f)*.3+Math.sin(T*.5+i)*.08+A.mx*.3,(1-f)*(i-1.5)*.18);o.m.scale.setScalar(.001+eob((lt-.1-i*.08)/.8)*(1+act*.12))}
      else{const u=(T*.06+o.ph)%1,an=u*Math.PI*2;o.m.position.set(Math.cos(an)*3,Math.sin(an*2)*.6+Math.sin(T+i)*.1,Math.sin(an)*1.6);o.m.rotation.set(Math.sin(T*.7+i)*.2,-an+Math.PI/2+.4,Math.sin(T*.5+o.r*6)*.15);o.m.scale.setScalar(.001+a)}});
    rg.forEach((m,i)=>{m.scale.setScalar(.2+.8*eo((lt-.4)/1.4));m.rotation.x=1.35+Math.sin(T*.3+i)*.2;m.rotation.y=T*.2*(i?-1:1)});if(cf)cf(lt-1.3)}};

P.globe=(g,p,sc)=>{const R=2.3;const gl=new THREE.Group();g.add(gl);gl.add(new THREE.Mesh(new THREE.SphereGeometry(R*.98,48,32),new THREE.MeshStandardMaterial({color:0x0c1b52,roughness:.6,metalness:.3,transparent:true,opacity:.85})));
  gl.add(new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(R,24,16)),new THREE.LineBasicMaterial({color:SKY,transparent:true,opacity:.18})));
  const pp=new Float32Array(600*3);for(let i=0;i<600;i++){const y=1-2*(i+.5)/600,r=Math.sqrt(1-y*y),th=i*2.399;pp.set([Math.cos(th)*r*R,y*R,Math.sin(th)*r*R],i*3)}const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pp,3));
  gl.add(new THREE.Points(pg,new THREE.PointsMaterial({size:.07,color:SKY,map:glowTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})));const halo=glow(ACCH,8,.45);g.add(halo);
  const sph=(la,lo)=>new THREE.Vector3(Math.cos(la)*Math.cos(lo),Math.sin(la),Math.cos(la)*Math.sin(lo)).multiplyScalar(R);const arcs=[];
  for(let i=0;i<10;i++){const a=sph((rnd()-.5)*2.2,rnd()*6.28),b=sph((rnd()-.5)*2.2,rnd()*6.28),m=a.clone().add(b).multiplyScalar(.5).normalize().multiplyScalar(R*1.55);const cv=new THREE.QuadraticBezierCurve3(a,m,b);
    const t=new THREE.Mesh(new THREE.TubeGeometry(cv,48,.018,5,false),emis(i%2?SKYH:'#ffffff',1.6));gl.add(t);const pu=glow('#ffffff',.5,1);gl.add(pu);arcs.push({t,pu,cv,grp:i%Math.max(1,sc.items.length),ph:rnd()})}
  return(lt,T,c)=>{const a=eob((lt-.1)/1.2);gl.scale.setScalar(.001+a);gl.rotation.y=T*.18+A.mx*.4;gl.rotation.x=.25;
    arcs.forEach(o=>{const act=Math.max(actW(c.iw[o.grp],lt),doneW(c.iw[o.grp],lt)*.5,lt<1?0:.15);o.t.material.emissiveIntensity=.3+act*2.6;const u=(T*.4+o.ph)%1;o.pu.position.copy(o.cv.getPoint(u));o.pu.material.opacity=act})}};

P.stars=(g,p,sc)=>{const core=new THREE.Group();g.add(core);const av=(i,big)=>ctex(256,256,(c,w,h)=>{const gr=c.createLinearGradient(0,0,w,h);gr.addColorStop(0,['#ffb3c7',SKYH,'#ffd257','#b9a4ff','#3EDBAA'][i%5]);gr.addColorStop(1,ACCH);c.fillStyle=gr;c.beginPath();c.arc(128,128,120,0,7);c.fill();
    c.fillStyle='rgba(255,255,255,.9)';c.beginPath();c.arc(128,100,42,0,7);c.fill();c.beginPath();c.ellipse(128,206,72,52,0,Math.PI,0);c.fill();c.strokeStyle='#fff';c.lineWidth=8;c.beginPath();c.arc(128,128,118,0,7);c.stroke()},true);
  const main=new THREE.Sprite(new THREE.SpriteMaterial({map:av(0),transparent:true,depthWrite:false}));main.scale.setScalar(2.2);core.add(main);const ring=new THREE.Mesh(new THREE.TorusGeometry(1.3,.05,12,100),emis('#ffffff',2.6));core.add(ring);core.add(glow(ACCH,6,.6));
  const live=label('● LIVE',{w:256,h:96,size:46,weight:900,bg:'#ff3b5c',scale:.4});live.position.set(0,-1.45,.2);core.add(live);
  const orbs=[];for(let i=0;i<8;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:av(i+1),transparent:true,depthWrite:false}));s.scale.setScalar(.75);g.add(s);const f=label((50+i*37)+'K',{w:192,h:80,size:40,weight:800,bg:'rgba(8,20,60,.85)',scale:.28});g.add(f);orbs.push({s,f,a:i/8*6.28})}
  const chips=sc.items.map((_,i)=>{const s=label(['Đại diện thương hiệu','Live stream','Check-in sự kiện','Video viral'][i]||'',{w:640,h:120,size:52,weight:800,bg:'rgba(255,255,255,.96)',color:ACCH,scale:.5});s.position.set(0,1.85,.6);g.add(s);return s});
  const hs=[];for(let i=0;i<12;i++){const s=label('♥',{w:128,h:128,size:78,weight:900,color:'#fff',bg:'#e8366f',scale:.32});g.add(s);hs.push({s,ph:rnd(),x:(rnd()-.5)*2})}
  return(lt,T,c)=>{const a=eob((lt-.1)/1.1);core.scale.setScalar(.001+a);ring.rotation.set(1.2+Math.sin(T*.5)*.2,T*.4,0);live.material.opacity=Math.sin(T*4)>-.3?1:.3;
    orbs.forEach((o,i)=>{const an=o.a+T*.25,x=Math.cos(an)*3,z=Math.sin(an)*1.4,y=Math.sin(an*2)*.5;o.s.position.set(x,y,z);o.f.position.set(x,y-.55,z);const e=eob((lt-.4-i*.08)/.6);o.s.scale.setScalar(.001+.75*e);o.f.material.opacity=e});
    chips.forEach((s,i)=>{const act=actW(c.iw[i],lt);s.material.opacity=act;s.position.y=1.85+(1-act)*.25});hs.forEach(o=>{const u=(T*.25+o.ph)%1;o.s.position.set(o.x+Math.sin(u*6)*.3,-1+u*3.4,.8);o.s.material.opacity=a*Math.sin(u*Math.PI)})}};

P.devices=(g,p,sc,k)=>{const tex=atex(1024,640,(c,w,h,lt,T)=>siteScreen(c,w,h,T,true),k,20);const mobT=atex(256,512,(c,w,h,lt,T)=>siteScreen(c,w,h,T*1.2,true),k,20);
  const lap=new THREE.Group();g.add(lap);const lid=new THREE.Group();lid.position.set(0,-1,-.05);lap.add(lid);const lm=new THREE.Mesh(RB(4.6,3,.12,.1),new THREE.MeshPhysicalMaterial({color:0xc9d2e6,metalness:.9,roughness:.25}));lm.position.y=1.5;lid.add(lm);
  const sc1=new THREE.Mesh(new THREE.PlaneGeometry(4.3,2.7),new THREE.MeshBasicMaterial({map:tex}));sc1.position.set(0,1.5,.065);lid.add(sc1);const base2=new THREE.Mesh(RB(4.8,.14,3,.07),new THREE.MeshPhysicalMaterial({color:0xc9d2e6,metalness:.9,roughness:.25}));base2.position.set(0,-1.07,1.45);lap.add(base2);
  const ph=new THREE.Group();g.add(ph);ph.add(new THREE.Mesh(RB(1.1,2.2,.1,.14),new THREE.MeshPhysicalMaterial({color:0x10172e,metalness:.85,roughness:.25,clearcoat:1})));const ps=new THREE.Mesh(new THREE.PlaneGeometry(1,2.05),new THREE.MeshBasicMaterial({map:mobT}));ps.position.z=.055;ph.add(ps);
  const tab=new THREE.Group();g.add(tab);tab.add(new THREE.Mesh(RB(1.9,2.6,.1,.12),new THREE.MeshPhysicalMaterial({color:0x10172e,metalness:.85,roughness:.25,clearcoat:1})));const ts=new THREE.Mesh(new THREE.PlaneGeometry(1.76,2.44),new THREE.MeshBasicMaterial({map:mobT}));ts.position.z=.055;tab.add(ts);
  const badges=['Chuẩn SEO','Tốc độ','Bảo mật'].map((t,i)=>{const s=label('✓ '+t,{w:448,h:110,size:48,weight:800,bg:'rgba(255,255,255,.96)',color:ACCH,scale:.44});g.add(s);return s});g.add(glow(ACCH,10,.3));const cf=p.outro?confetti(g):null;
  return(lt,T)=>{const a=eob((lt-.1)/1.2);lap.scale.setScalar(.001+a);lid.rotation.x=-(1-eo((lt-.3)/1.2))*1.4+.08;lap.rotation.y=-.25+Math.sin(T*.35)*.12+A.mx*.3;lap.rotation.x=.12;
    ph.position.set(2.9,-.6+Math.sin(T*.9)*.1,1.4);ph.rotation.set(.05,-.4+Math.sin(T*.6)*.1,0);ph.scale.setScalar(.001+eob((lt-.7)/.8));tab.position.set(-3,-.2+Math.sin(T*.8+1)*.1,.4);tab.rotation.set(.05,.45+Math.sin(T*.5)*.1,0);tab.scale.setScalar(.001+eob((lt-.9)/.8));
    badges.forEach((s,i)=>{const e=eob((lt-1.3-i*.25)/.6),an=T*.3+i*2.09;s.position.set(Math.cos(an)*1.9,2.3+Math.sin(an*1.4)*.25,1.2+Math.sin(an)*.5);s.material.opacity=e});if(cf)cf(lt-1.3)}};

P.shield=(g,p)=>{const sh=new THREE.Shape();sh.moveTo(0,1.5);sh.bezierCurveTo(.7,1.25,1.2,1.25,1.4,1.2);sh.bezierCurveTo(1.4,.1,1.1,-.9,0,-1.6);sh.bezierCurveTo(-1.1,-.9,-1.4,.1,-1.4,1.2);sh.bezierCurveTo(-1.2,1.25,-.7,1.25,0,1.5);
  const geo=new THREE.ExtrudeGeometry(sh,{depth:.35,bevelEnabled:true,bevelThickness:.14,bevelSize:.12,bevelSegments:5});geo.center();const s=new THREE.Mesh(geo,glassM(ACCH,{metalness:.3}));g.add(s);
  const ck=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-.55,.05,0),new THREE.Vector3(-.15,-.38,0),new THREE.Vector3(.65,.5,0)],false,'catmullrom',0),40,.11,10),emis('#ffffff',3));ck.position.z=.36;s.add(ck);
  const sw=new THREE.Mesh(new THREE.CircleGeometry(3.4,48,0,.9),new THREE.MeshBasicMaterial({map:glowTex,color:SKY,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));sw.position.z=-.6;g.add(sw);
  const rg=rings(g,[2.4,3,3.6]);const lab=label('24/7',{w:256,h:112,size:64,weight:900,bg:'rgba(255,255,255,.95)',color:ACCH,scale:.5});lab.position.set(1.7,1.6,.6);g.add(lab);const sp=sparkOrbit(g,14,2.8,[SKYH,MINT]);const cf=p.outro?confetti(g):null;
  return(lt,T)=>{const a=eob((lt-.1)/1.2);s.scale.setScalar(.001+a);s.rotation.y=Math.sin(T*.6)*.4+A.mx*.5;s.rotation.x=-A.my*.3;s.position.y=Math.sin(T*.9)*.1;sw.rotation.z=-T*1.2;sw.scale.setScalar(.001+a);
    rg.forEach((m,i)=>{m.scale.setScalar(.2+.8*eo((lt-.3)/1.4));m.rotation.x=1.3+Math.sin(T*.3+i)*.3;m.rotation.y=T*.2*(i%2?-1:1)});lab.material.opacity=eo((lt-1)/.6);sp(T,a);if(cf)cf(lt-1.3)}};

P.monitor=(g,p,sc)=>{const panel=new THREE.Mesh(RB(5.4,2.6,.14,.14),new THREE.MeshPhysicalMaterial({color:0x0b1638,metalness:.4,roughness:.3,clearcoat:1,transparent:true,opacity:.92}));g.add(panel);
  const NPT=220,lp=new Float32Array(NPT*3),lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.BufferAttribute(lp,3));const ecg=new THREE.Line(lg,new THREE.LineBasicMaterial({color:C(MINT)}));ecg.position.z=.09;g.add(ecg);
  const head=glow(MINT,1,1);g.add(head);const live=label('● LIVE · uptime 99,9%',{w:640,h:96,size:42,weight:800,color:'#3EDBAA',scale:.36});live.position.set(-1.1,1,.12);g.add(live);
  const names=['UPTIME','SSL','BACKUP','FIREWALL'],lamps=names.map((t,i)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.2,24,16),emis('#3a4a7a',1));m.position.set(-1.9+i*1.27,-1.75,.3);g.add(m);const gl=glow(MINT,1.3,0);m.add(gl);const lb=label(t,{w:320,h:80,size:40,weight:800,scale:.28});lb.position.set(m.position.x,-2.2,.3);g.add(lb);return{m,gl}});
  const beat=x=>{const f=x%1;return f<.08?Math.sin(f/.08*Math.PI)*.12:f<.12?-(f-.08)/.04*.3:f<.16?((f-.12)/.04)*1.3-.3:f<.2?1-(f-.16)/.04*1.5:f<.24?-.5+(f-.2)/.04*.5:f>.4&&f<.55?Math.sin((f-.4)/.15*Math.PI)*.22:0};
  return(lt,T,c)=>{const a=eob((lt-.1)/1.1);g.scale.setScalar(.001+a);g.rotation.y=-.25+Math.sin(T*.35)*.12+A.mx*.3;g.rotation.x=.06;
    for(let i=0;i<NPT;i++){const x=-2.5+5*i/(NPT-1);lp[i*3]=x;lp[i*3+1]=-.15+beat(i/NPT*3-T*.9)*.85;lp[i*3+2]=0}lg.attributes.position.needsUpdate=true;head.position.set(2.5,-.15+beat(3-T*.9)*.85,.12);
    live.material.opacity=Math.sin(T*3)>-.4?1:.45;lamps.forEach((o,i)=>{const w=c.iw[i],on=w&&lt>=w[0]?1:0,act=actW(w,lt);o.m.material.emissive.set(on?MINT:'#3a4a7a');o.m.material.emissiveIntensity=on?2.5+act*2:1;o.gl.material.opacity=on*(.5+act*.6)})}};

// ---------- dựng cảnh ----------
const LAY={hero:{L:[0,2.05,0,.72],P:[0,2.15,0,.48]},split:{L:[4.4,-.1,0,.95],P:[1.7,2.9,-3,.2]},grid:{L:[4.7,2.25,-2.5,.5],P:[1.6,3.0,-4,.2]},steps:{L:[0,.55,-1,.92],P:[0,.95,-1,.8]},
  stats:{L:[4.2,.9,-2.5,.62],P:[0,.9,-4,.32]},pricing:{L:[4.3,2.5,-3,.66],P:[1.4,3.4,-4,.34]},outro:{L:[0,-2.45,0,.46],P:[0,-3.25,0,.3]}};
const S=[];
ST.scenes.forEach((sc,k)=>{const grp=new THREE.Group();scene.add(grp);const [name,par]=sc.prop||['plogo',{}];let o={};
  try{const r=P[name](grp,par||{},sc,k);o=typeof r==='function'?{update:r}:r}catch(e){console.error('3D',name,e)}
  o.g=grp;o.k=k;o.lay=Object.assign({},LAY[sc.t]||LAY.split,par&&par.lay||{});S.push(o)});
function place(o){const L=A.portrait?o.lay.P:o.lay.L;o.g.position.set(L[0],-o.k*U+L[1],L[2]);o.g.scale.setScalar(L[3]);if(o.relayout)o.relayout(A.portrait)}
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();S.forEach(place)}
addEventListener('resize',resize);resize();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{redraws.forEach(f=>f());anims.forEach(a=>a.last=-1)});

// ---------- vòng vẽ ----------
let camY=0,T=0,prevY=0,lastPortrait=A.portrait,ft=0,fn=0,good=0;
const ctxs=S.map(o=>({iw:[],lw:[]}));
A.on3d=(dt)=>{T+=dt;if(A.visible===false)return;if(A.portrait!==lastPortrait){lastPortrait=A.portrait;resize()}
  const target=-A.pos*U;camY+=(target-camY)*Math.min(1,dt*14);const v=(camY-prevY)/Math.max(dt,1e-3);prevY=camY;
  camera.position.set(A.mx*.9,camY-A.my*.5,D+Math.min(2.2,Math.abs(v)*.1));camera.lookAt(A.mx*.25,camY,0);camera.rotation.z+=THREE.MathUtils.clamp(v*.0035,-.04,.04);
  paintBg(A.pos);dust.rotation.y=Math.sin(T*.05)*.05;dust.position.y=Math.sin(T*.2)*.3;bokeh.forEach(b=>b.material.opacity=.06+.1*(.5+.5*Math.sin(T*.5+b.userData.ph)));beams.forEach(b=>b.rotation.z+=Math.sin(T*.3+b.userData.ph)*.0008);
  S.forEach((o,i)=>{const near=Math.abs(i-A.pos)<1.25;o.g.visible=near;if(!near||!o.update)return;const c=ctxs[i];c.iw=A.SCN[i].iw;c.lw=A.SCN[i].lw;const lt=A.lt(i);
    try{o.update(lt,T,c)}catch(e){console.error(e);o.update=null}});
  anims.forEach(a=>{if(Math.abs(a.k-A.pos)>1.25)return;if(T-a.last<1/a.fps&&a.last>=0)return;a.last=T;a.t.userData.run(A.lt(a.k),T)});
  renderer.render(scene,camera);
  // tự điều chỉnh độ phân giải để giữ khung hình ổn định
  ft+=dt;fn++;if(fn>=45){const avg=ft/fn;ft=0;fn=0;if(avg>1/45&&dpr>.75){dpr=Math.max(.75,dpr-.2);renderer.setPixelRatio(dpr);resize();good=0}else if(avg<1/58){if(++good>4&&dpr<DPR_CAP){dpr=Math.min(DPR_CAP,dpr+.1);renderer.setPixelRatio(dpr);resize();good=0}}else good=0}
};
})();
