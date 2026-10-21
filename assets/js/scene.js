/* PMedia site — hero 3D scenes for the light theme (three.js r160).
   Loaded as a classic script that imports three with dynamic import(), so pages also open from disk.
   <canvas class="gl" data-scene="home|content|website|branding|ecommerce|outsource|fanpage|media|restaurant|seo|webcare|pr|training|services|contact|about|projects|sme"> */
(async()=>{
const canvas=document.querySelector('canvas.gl');
if(!canvas)return;
let THREE,RoomEnvironment,RoundedBoxGeometry;
try{
  THREE=await import('three');
  [{RoomEnvironment},{RoundedBoxGeometry}]=await Promise.all([import('three/addons/environments/RoomEnvironment.js'),import('three/addons/geometries/RoundedBoxGeometry.js')]);
  boot(canvas);
}catch(e){console.warn('3D disabled:',e)}

function boot(canvas){
const PM=window.PM||(window.PM={heroP:0,mx:0,my:0});
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.setClearColor(0x000000,0);
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(38,1,.1,200);camera.position.set(0,0,11);
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;
scene.add(new THREE.HemisphereLight(0xffffff,0xc9d7ff,1.3));
const key=new THREE.DirectionalLight(0xffffff,2.4);key.position.set(4,9,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.radius=8;
Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:1,far:30});scene.add(key);
const fill=new THREE.DirectionalLight(0xa9c6ff,1.1);fill.position.set(-6,-2,5);scene.add(fill);

/* helpers */
let seed=11;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
const C=h=>new THREE.Color(h);
const BLUE=canvas.dataset.acc?parseInt(canvas.dataset.acc.slice(1),16):0x1f5bff,BLUE2=new THREE.Color(BLUE).lerp(new THREE.Color(0xffffff),.35).getHex(),SKY=0x8ccbff,INK=0x0a1433,WHITE=0xffffff;
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function ctex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;t.userData.draw=()=>{g.clearRect(0,0,w,h);draw(g,w,h);t.needsUpdate=true};return t}
const dotTex=ctex(64,64,g=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.55,'rgba(255,255,255,.9)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64)});
const halo=(c,s,o=.25)=>{const m=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color:C(c),transparent:true,opacity:o,depthWrite:false}));m.scale.setScalar(s);return m};
const mat=(c,o={})=>new THREE.MeshPhysicalMaterial(Object.assign({color:c,roughness:.22,metalness:.05,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1},o));
const glass=(c=BLUE,o={})=>mat(c,Object.assign({roughness:.06,iridescence:.6,iridescenceIOR:1.5},o));
const flat=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.5},o));
const RB=(w,h,d,r=.08)=>new RoundedBoxGeometry(w,h,d,4,r);
const rr=(g,x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()};
const FONT=(w,s)=>`${w} ${s}px "Be Vietnam Pro", system-ui, sans-serif`;
const labels=[];
function label(text,{size=52,w=512,h=128,color='#1F5BFF',bg='#ffffff',scale=.46,weight=800}={}){const t=ctex(w,h,g=>{if(bg){g.shadowColor='rgba(10,20,51,.18)';g.shadowBlur=14;g.shadowOffsetY=4;g.fillStyle=bg;rr(g,10,10,w-20,h-24,(h-24)/2);g.fill();g.shadowColor='transparent'}g.font=FONT(weight,size);g.fillStyle=color;g.textAlign='center';g.textBaseline='middle';g.fillText(text,w/2,h/2-4)});
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,toneMapped:false}));s.scale.set(scale*w/h,scale,1);labels.push(t);return s}
if(document.fonts)document.fonts.ready.then(()=>labels.forEach(t=>t.userData.draw()));
const cast=o=>{o.traverse(m=>{if(m.isMesh){m.castShadow=true}});return o};

/* soft floating dots */
{const N=420,p=new Float32Array(N*3);for(let i=0;i<N;i++){p[i*3]=(rnd()-.5)*30;p[i*3+1]=(rnd()-.5)*18;p[i*3+2]=-12+rnd()*12}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
 var dust=new THREE.Points(g,new THREE.PointsMaterial({size:.07,map:dotTex,color:BLUE2,transparent:true,opacity:.45,depthWrite:false}));scene.add(dust)}

const root=new THREE.Group();scene.add(root);
const shadow=new THREE.Mesh(new THREE.PlaneGeometry(16,16),new THREE.ShadowMaterial({opacity:.13}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-2.7;shadow.receiveShadow=true;root.add(shadow);
const name=canvas.dataset.scene||'home';

function pShape(){ // PMedia "P" mark, simplified
  const s=new THREE.Shape();s.moveTo(-1.05,-1.9);s.lineTo(-1.05,.35);s.absarc(.15,.35,1.2,Math.PI,-Math.PI/2,true);s.lineTo(-.35,-.85);s.lineTo(-.35,-1.9);s.closePath();
  const h=new THREE.Path();h.absarc(.15,.35,.52,0,Math.PI*2,true);s.holes.push(h);return s}

const B={
home(g){
  const P=new THREE.Mesh(new THREE.ExtrudeGeometry(pShape(),{depth:.55,bevelEnabled:true,bevelThickness:.16,bevelSize:.12,bevelSegments:8,curveSegments:48}),glass(BLUE,{iridescence:.35}));P.geometry.center();g.add(cast(P));
  const pts=[[1.9,1.4,.6,.32,WHITE],[-1.8,-1,.8,.22,SKY],[1.5,-1.6,-.4,.18,BLUE2],[-1.6,1.6,-.6,.14,WHITE]].map(([x,y,z,r,c])=>{const m=new THREE.Mesh(new THREE.SphereGeometry(r,48,32),mat(c));m.position.set(x,y,z);g.add(cast(m));return m});
  const tor=new THREE.Mesh(new THREE.TorusGeometry(2.55,.04,16,200),mat(WHITE,{roughness:.2}));g.add(tor);
  const tor2=new THREE.Mesh(new THREE.TorusGeometry(2.9,.012,8,200),flat(BLUE2,{transparent:true,opacity:.5}));g.add(tor2);
  return t=>{P.rotation.y=Math.sin(t*.5)*.55+PM.mx*.6;P.rotation.x=Math.sin(t*.4)*.12-PM.my*.3;P.position.y=Math.sin(t*.9)*.12;
    pts.forEach((m,i)=>{m.position.y+=Math.sin(t*1.2+i)*.003});tor.rotation.set(1.25+Math.sin(t*.3)*.15,t*.15,0);tor2.rotation.set(1.1,-t*.1,.3)}},
content(g){
  const cols=['#1F5BFF','#8CCBFF','#FFB547','#20C997','#0A1433','#B9A8FF'];
  const cards=cols.map((col,i)=>{const tx=ctex(256,320,c=>{c.fillStyle='#fff';c.fillRect(0,0,256,320);const gr=c.createLinearGradient(0,40,256,200);gr.addColorStop(0,col);gr.addColorStop(1,'#E8EEFC');c.fillStyle=gr;c.fillRect(14,46,228,150);
      c.fillStyle='#1F5BFF';c.beginPath();c.arc(32,24,12,0,7);c.fill();c.fillStyle='#0A1433';c.fillRect(52,16,90,8);c.fillStyle='#C9D3EA';c.fillRect(52,28,60,6);
      c.fillStyle='#0A1433';c.fillRect(14,212,200,10);c.fillStyle='#C9D3EA';c.fillRect(14,232,228,8);c.fillRect(14,248,170,8);c.fillStyle='#FF4D7E';c.font=FONT(700,22);c.fillText('♥ '+(1.2+i*.7).toFixed(1)+'K',14,296)});
    const side=flat(0xe3e9f7);const m=new THREE.Mesh(RB(1.6,2,.06,.08),[side,side,side,side,new THREE.MeshStandardMaterial({map:tx,roughness:.55}),side]);g.add(cast(m));return m});
  const hearts=[];for(let i=0;i<8;i++){const h=label('♥',{w:128,h:128,size:86,color:i%2?'#FF4D7E':'#1F5BFF',bg:null,scale:.32});g.add(h);hearts.push({h,ph:rnd(),x:(rnd()-.5)*4})}
  return t=>{cards.forEach((m,i)=>{const a=(i-2.5)*.28+Math.sin(t*.5)*.08;m.position.set(Math.sin(a)*3.2,-.6+Math.cos(a)*.6-.4+Math.sin(t+i)*.08,Math.cos(a)-1+i*.05);m.rotation.set(-.1,a*.9,-a*.5)});
    hearts.forEach(o=>{const u=(t*.18+o.ph)%1;o.h.position.set(o.x+Math.sin(u*8)*.2,-1.6+u*4,1.2);o.h.material.opacity=Math.sin(u*Math.PI)})}},
website(g){
  const mk=i=>ctex(512,340,c=>{c.fillStyle='#fff';c.fillRect(0,0,512,340);c.fillStyle='#EEF2FB';c.fillRect(0,0,512,34);['#FF6B6B','#FFC24B','#3DDC97'].forEach((col,k)=>{c.fillStyle=col;c.beginPath();c.arc(20+k*18,17,6,0,7);c.fill()});c.fillStyle='#E1E8F7';rr(c,90,9,300,16,8);c.fill();
    if(i===0){const gr=c.createLinearGradient(0,34,512,200);gr.addColorStop(0,'#1F5BFF');gr.addColorStop(1,'#8CCBFF');c.fillStyle=gr;c.fillRect(0,34,512,170);c.fillStyle='#fff';c.font=FONT(800,30);c.fillText('Website chuẩn SEO',28,110);c.fillStyle='rgba(255,255,255,.8)';c.fillRect(28,128,220,10);c.fillStyle='#fff';rr(c,28,152,120,32,16);c.fill();for(let k=0;k<3;k++){c.fillStyle='#EEF2FB';rr(c,20+k*164,220,152,100,12);c.fill();c.fillStyle='#1F5BFF';c.fillRect(36+k*164,240,40,40)}}
    else if(i===1){for(let k=0;k<6;k++){c.fillStyle=k%2?'#EEF2FB':'#DCE6FB';rr(c,20+(k%3)*164,52+Math.floor(k/3)*140,152,124,12);c.fill()}}
    else{c.fillStyle='#0A1433';c.font=FONT(800,26);c.fillText('Landing Page',28,90);for(let k=0;k<5;k++){c.fillStyle='#E1E8F7';c.fillRect(28,120+k*24,420-k*50,10)}c.fillStyle='#1F5BFF';rr(c,28,260,170,44,22);c.fill()}});
  const wins=[0,1,2].map(i=>{const m=new THREE.Mesh(RB(3.4,2.26,.08,.08),flat(0xdfe6f5));const f=new THREE.Mesh(new THREE.PlaneGeometry(3.3,2.18),new THREE.MeshBasicMaterial({map:mk(i)}));f.position.z=.045;m.add(f);g.add(cast(m));return m});
  const code=label('</>',{w:256,h:128,size:64,scale:.5,weight:900});g.add(code);
  return t=>{wins.forEach((m,i)=>{m.position.set(-.6+i*.9,.8-i*.8+Math.sin(t*.8+i)*.08,-i*1.1);m.rotation.set(-.08,-.35+Math.sin(t*.3)*.06,0)});code.position.set(1.9,1.9+Math.sin(t)*.1,-.5)}},
branding(g){
  const cols=['#1F5BFF','#5B8CFF','#8CCBFF','#20C997','#FFB547','#FF6B81','#0A1433','#E8EEFC'];
  const sw=cols.map(c=>{const m=new THREE.Mesh(RB(.7,3,.05,.06),mat(C(c).getHex(),{roughness:.3}));m.geometry.translate(0,1.3,0);g.add(cast(m));return m});
  const knot=new THREE.Mesh(new THREE.TorusKnotGeometry(.75,.24,220,32,2,3),glass(BLUE));g.add(cast(knot));
  return t=>{const o=.5+.5*Math.sin(t*.6);sw.forEach((m,i)=>{m.position.set(-.5,-1.9,-.6+i*.02);m.rotation.z=((i-3.5)*.22)*(.35+o*.9)});knot.position.set(1,.5,.6);knot.rotation.set(t*.4,t*.6,0)}},
ecommerce(g){
  const bag=new THREE.Group();g.add(bag);bag.add(new THREE.Mesh(RB(1.8,2,1,.12),mat(BLUE)));const h=new THREE.Mesh(new THREE.TorusGeometry(.5,.07,16,48,Math.PI),mat(WHITE));h.position.y=1;bag.add(h);
  const tag=label('SALE',{w:256,h:128,size:60,scale:.46,weight:900});tag.position.set(0,0,.56);bag.add(tag);cast(bag);
  const coinM=mat(0xffc24b,{metalness:.9,roughness:.25});const coins=[];for(let i=0;i<9;i++){const m=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,.07,32),coinM);g.add(cast(m));coins.push({m,ph:rnd()*6,r:1.8+rnd()*1.2,y:(rnd()-.5)*2.4})}
  const boxes=[];for(let i=0;i<4;i++){const m=new THREE.Mesh(RB(.6,.6,.6,.06),flat(i%2?0xd8b48a:SKY));g.add(cast(m));boxes.push(m)}
  return t=>{bag.rotation.y=Math.sin(t*.5)*.4;bag.position.y=Math.sin(t*.9)*.12;coins.forEach(o=>{const a=t*.5+o.ph;o.m.position.set(Math.cos(a)*o.r,o.y+Math.sin(t+o.ph)*.2,Math.sin(a)*o.r);o.m.rotation.set(t*2+o.ph,0,Math.PI/2.4)});
    boxes.forEach((m,i)=>{const a=-t*.3+i*1.57;m.position.set(Math.cos(a)*2.6,-1.5+Math.sin(t+i)*.15,Math.sin(a)*1.4);m.rotation.set(t*.3+i,t*.4,0)})}},
outsource(g){
  const N=26,pts=[];for(let i=0;i<N;i++){const y=1-(i/(N-1))*2,r=Math.sqrt(1-y*y),th=i*2.399;pts.push(new THREE.Vector3(Math.cos(th)*r*2.4,y*2.1,Math.sin(th)*r*2.4))}
  const nodes=pts.map((p,i)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(i%5?.1:.17,20,14),mat(i%5?BLUE2:BLUE));m.position.copy(p);g.add(m);return m});
  const segs=[];for(let i=0;i<N;i++)for(let j=i+1;j<N;j++)if(pts[i].distanceTo(pts[j])<1.6)segs.push(pts[i],pts[j]);
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segs),new THREE.LineBasicMaterial({color:BLUE,transparent:true,opacity:.28})));
  const core=new THREE.Mesh(new THREE.SphereGeometry(.75,64,48),glass(BLUE));g.add(cast(core));
  const lab=label('Phòng Marketing',{size:42,w:640,scale:.42});lab.position.y=-1.15;g.add(lab);
  const pulses=[];for(let i=0;i<14;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),flat(BLUE,{emissive:BLUE,emissiveIntensity:.6}));g.add(m);pulses.push({m,s:Math.floor(rnd()*segs.length/2)*2,ph:rnd()})}
  return t=>{g.rotation.y=t*.15;pulses.forEach(o=>{const u=(t*.4+o.ph)%1;o.m.position.lerpVectors(segs[o.s],segs[o.s+1],u)});nodes.forEach((m,i)=>m.scale.setScalar(1+.25*Math.sin(t*2+i)))}},
fanpage(g){
  const tiers=[['BASIC',1.1,SKY],['STANDARD',1.8,BLUE2],['VIP',2.6,BLUE]];
  const ps=tiers.map(([n,h,c],i)=>{const grp=new THREE.Group();g.add(grp);const m=new THREE.Mesh(RB(1.1,h,1.1,.1),glass(c,{iridescence:.3}));m.position.y=h/2;grp.add(m);
    const l=label(n,{size:46,scale:.38,weight:900});l.position.y=h+.5;grp.add(l);grp.position.set((i-1)*1.55,-2.7,0);cast(grp);return grp});
  return t=>{g.rotation.y=-.35+Math.sin(t*.3)*.2;ps.forEach((p,i)=>p.position.y=-2.7+Math.abs(Math.sin(t*1.1+i))*.08)}},
media(g){
  const lens=new THREE.Group();g.add(lens);const metal=mat(INK,{metalness:.7,roughness:.25});
  [[1.7,.5],[1.5,.4],[1.3,.6]].forEach(([r,d],i)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d,64,1,true),metal);m.rotation.x=Math.PI/2;m.position.z=-i*.45;lens.add(m);const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.035,8,96),mat(i?BLUE2:WHITE));ring.position.z=-i*.45+d/2;lens.add(ring)});
  const gd=new THREE.Mesh(new THREE.CircleGeometry(1.25,64),mat(BLUE,{roughness:.02,iridescence:1,envMapIntensity:1.6}));gd.position.z=-.2;lens.add(gd);
  const blades=[];for(let i=0;i<7;i++){const b=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.5),flat(INK,{metalness:.6,roughness:.3,side:THREE.DoubleSide}));lens.add(b);blades.push(b)}
  const rec=label('● REC',{w:256,h:110,size:44,color:'#FF4D5E',scale:.36});rec.position.set(-1.8,1.9,0);g.add(rec);cast(lens);
  return t=>{lens.rotation.set(Math.sin(t*.4)*.25,-.5+Math.sin(t*.3)*.3,0);const ap=.35+.25*(.5+.5*Math.sin(t*.8));blades.forEach((b,i)=>{const a=i/7*Math.PI*2;b.position.set(Math.cos(a)*(ap+.45),Math.sin(a)*(ap+.45),-.18);b.rotation.z=a+1.2});rec.material.opacity=Math.sin(t*4)>0?1:.35}},
restaurant(g){
  const bowl=new THREE.Group();g.add(bowl);const prof=[[0,-.95],[.75,-.95],[.8,-.85],[1.35,-.55],[1.8,0],[1.92,.32],[1.86,.36],[1.72,.05],[1.25,-.45],[.7,-.75],[0,-.8]].map(p=>new THREE.Vector2(p[0],p[1]));
  bowl.add(new THREE.Mesh(new THREE.LatheGeometry(prof,96),mat(WHITE,{roughness:.2,side:THREE.DoubleSide})));
  const band=new THREE.Mesh(new THREE.TorusGeometry(1.86,.04,12,120),mat(BLUE));band.rotation.x=Math.PI/2;band.position.y=.18;bowl.add(band);
  const broth=new THREE.Mesh(new THREE.CircleGeometry(1.68,64),flat(0xd98a3a,{roughness:.15,emissive:0xff9a40,emissiveIntensity:.15}));broth.rotation.x=-Math.PI/2;broth.position.y=.12;bowl.add(broth);
  const nm=flat(0xfff1d6,{roughness:.4});for(let i=0;i<8;i++){const p=[];const a0=rnd()*6.28,r0=.2+rnd()*1.1;for(let j=0;j<10;j++){const a=a0+j*.35,r=Math.min(1.45,r0+Math.sin(j*.9)*.25);p.push(new THREE.Vector3(Math.cos(a)*r,.15+Math.sin(j*1.3)*.04,Math.sin(a)*r))}bowl.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p),40,.045,6),nm))}
  const herb=flat(0x3fbf6a);for(let i=0;i<12;i++){const h=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),herb);h.scale.set(1,.25,.6);const a=rnd()*6.28,r=rnd()*1.3;h.position.set(Math.cos(a)*r,.2,Math.sin(a)*r);bowl.add(h)}
  const chop=flat(0xc58a52);[0,.18].forEach(o=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,4.4,10),chop);c.rotation.z=Math.PI/2-.22;c.rotation.y=.5;c.position.set(.6,.62+o*.4,.3+o);bowl.add(c)});cast(bowl);
  const steam=[];for(let i=0;i<22;i++){const s=halo('#b9c8e6',1.4+rnd()*1.2,0);bowl.add(s);steam.push({s,ph:rnd(),x:(rnd()-.5)*2,z:(rnd()-.5)*1.2})}
  return t=>{bowl.rotation.set(.45,t*.25,0);steam.forEach(o=>{const u=(t*.22+o.ph)%1;o.s.position.set(o.x+Math.sin(u*6+o.ph*9)*.3,.3+u*3.6,o.z);o.s.material.opacity=Math.sin(u*Math.PI)*.35;o.s.scale.setScalar(1+u*2)})}},
seo(g){
  const bars=[];for(let i=0;i<7;i++){const m=new THREE.Mesh(RB(.55,1,.55,.06),glass(i===6?BLUE:BLUE2,{iridescence:.2}));g.add(cast(m));bars.push({m,h:.5+i*.42,i})}
  const mag=new THREE.Group();g.add(mag);mag.add(new THREE.Mesh(new THREE.TorusGeometry(.75,.12,20,64),mat(WHITE,{metalness:.4})));
  mag.add(new THREE.Mesh(new THREE.CircleGeometry(.7,48),mat(SKY,{transparent:true,opacity:.35,roughness:0})));
  const hd=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,1.2,16),mat(INK));hd.position.set(.75,-.75,0);hd.rotation.z=Math.PI/4;mag.add(hd);cast(mag);
  const top=label('#1 Google',{w:512,h:128,size:52,scale:.44,weight:900});g.add(top);
  return t=>{bars.forEach(o=>{const s=.75+.25*Math.sin(t*.9+o.i*.5);const h=o.h*s;o.m.scale.y=h;o.m.position.set(-2+o.i*.66,-2.7+h/2,-o.i*.08)});mag.position.set(.9+Math.sin(t*.7)*.4,.9+Math.cos(t*.9)*.25,1);mag.rotation.set(0,Math.sin(t*.5)*.4,0);top.position.set(1.95,.6+.2*Math.sin(t*.9),.4)}},
webcare(g){
  const sh=new THREE.Shape();sh.moveTo(0,1.5);sh.bezierCurveTo(.7,1.25,1.2,1.25,1.4,1.2);sh.bezierCurveTo(1.4,.1,1.1,-.9,0,-1.6);sh.bezierCurveTo(-1.1,-.9,-1.4,.1,-1.4,1.2);sh.bezierCurveTo(-1.2,1.25,-.7,1.25,0,1.5);
  const shield=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.3,bevelEnabled:true,bevelThickness:.12,bevelSize:.1,bevelSegments:6}),glass(BLUE));shield.geometry.center();g.add(cast(shield));
  const ck=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-.55,0,.35),new THREE.Vector3(-.15,-.4,.35),new THREE.Vector3(.6,.5,.35)],false,'catmullrom',0),40,.1,12),mat(WHITE));shield.add(ck);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.3,.02,8,160),flat(BLUE2));g.add(ring);const dot=new THREE.Mesh(new THREE.SphereGeometry(.1,16,12),mat(0x20c997));g.add(dot);
  const N=120,lp=new Float32Array(N*3);const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.BufferAttribute(lp,3));const line=new THREE.Line(lg,new THREE.LineBasicMaterial({color:0x20c997}));line.position.set(0,-2.3,.4);g.add(line);
  const up=label('Uptime 24/7',{w:512,h:128,size:46,scale:.4});up.position.set(1.9,1.7,0);g.add(up);
  return t=>{shield.rotation.y=Math.sin(t*.6)*.5;ring.rotation.set(1.2,0,t*.2);const a=t*.8;dot.position.set(Math.cos(a)*2.3,Math.sin(a)*2.3*Math.cos(1.2),Math.sin(a)*2.3*Math.sin(1.2));
    for(let i=0;i<N;i++){const x=-2.6+i/N*5.2;const k=(((i/N*3-t*.8)%1)+1)%1;const y=k>.45&&k<.5?.5:k>.5&&k<.55?-.35:k>.55&&k<.6?.2:0;lp.set([x,y*.9,0],i*3)}lg.attributes.position.needsUpdate=true}},
pr(g){
  const core=new THREE.Mesh(new THREE.SphereGeometry(.75,64,48),glass(BLUE));g.add(cast(core));
  const waves=[0,1,2,3].map(()=>{const m=new THREE.Mesh(new THREE.TorusGeometry(1,.025,8,120),flat(BLUE2,{transparent:true}));g.add(m);return m});
  const cards=['Báo chí','KOL','KOC','TV','Hot page'].map(n=>{const l=label(n,{w:384,h:128,size:46,scale:.44});g.add(l);return l});
  return t=>{core.rotation.y=t*.4;waves.forEach((m,i)=>{const u=(t*.3+i/4)%1;m.scale.setScalar(.8+u*2.6);m.material.opacity=(1-u)*.8;m.rotation.set(1.1,0,0)});cards.forEach((c,i)=>{const a=t*.3+i/5*Math.PI*2;c.position.set(Math.cos(a)*2.6,Math.sin(a*1.3)*.5+(i%2?.6:-.6),Math.sin(a)*1.2)})}},
training(g){
  const steps=[];for(let i=0;i<5;i++){const h=.35+i*.45;const m=new THREE.Mesh(RB(1,h,1,.06),glass(i===4?BLUE:BLUE2,{iridescence:.3}));m.position.set(-2+i,-2.7+h/2,0);g.add(cast(m));steps.push(m)}
  const orb=new THREE.Mesh(new THREE.SphereGeometry(.24,32,24),mat(0xffb547));g.add(cast(orb));
  const topics=['Digital','Content','Social','Ads','SEO','Coaching'].map(n=>{const l=label(n,{w:384,h:112,size:40,scale:.36});g.add(l);return l});
  return t=>{const u=(t*.35)%5;const i=Math.floor(u),f=u-i;const h0=-2.7+.35+i*.45,h1=-2.7+.35+Math.min(4,i+1)*.45;orb.position.set(-2+i+f*(i<4?1:0),h0+(h1-h0)*f+.26+Math.sin(f*Math.PI)*.6,0);
    topics.forEach((l,k)=>{const a=t*.25+k/6*Math.PI*2;l.position.set(Math.cos(a)*3,1.3+Math.sin(a*2)*.3,Math.sin(a)*1.2)});g.rotation.y=-.3+Math.sin(t*.3)*.15}},
services(g){
  const tiles=[];for(let i=0;i<20;i++){const m=new THREE.Mesh(RB(.9,.9,.14,.14),glass(i%3===0?WHITE:i%3===1?BLUE:BLUE2,{iridescence:.4}));g.add(cast(m));tiles.push({m,x:(i%5-2)*1.1,y:(Math.floor(i/5)-1.5)*1.1})}
  return t=>{tiles.forEach(o=>{const w=Math.sin(t*1.2-(o.x+o.y)*.8);o.m.position.set(o.x,o.y+.2,w*.5);o.m.rotation.set(w*.4,w*.3,0)});g.rotation.set(-.35,-.45,0)}},
contact(g){
  const N=1400,p=new Float32Array(N*3);for(let i=0;i<N;i++){const y=1-(i/(N-1))*2,r=Math.sqrt(1-y*y),th=i*2.39996;p.set([Math.cos(th)*r*2,y*2,Math.sin(th)*r*2],i*3)}
  const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.BufferAttribute(p,3));const globe=new THREE.Points(gg,new THREE.PointsMaterial({size:.06,map:dotTex,color:BLUE,transparent:true,depthWrite:false}));g.add(globe);
  g.add(new THREE.Mesh(new THREE.SphereGeometry(1.94,48,32),flat(0x1b3d9a,{transparent:true,opacity:.55,emissive:0x0a2470,emissiveIntensity:.4})));
  const ll=(lat,lon,r=2.02)=>{const phi=(90-lat)*Math.PI/180,th=(lon+180)*Math.PI/180;return new THREE.Vector3(-r*Math.sin(phi)*Math.cos(th),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(th))};
  [ll(10.8,106.68),ll(10.95,106.82)].forEach(v=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.1,16,12),mat(0xffb547));m.position.copy(v);globe.add(m)});
  const lb=label('TP.HCM · Biên Hòa',{w:640,h:120,size:42,scale:.42});lb.position.set(0,2.55,0);g.add(lb);
  return t=>{globe.rotation.y=-Math.PI/2-1.86+Math.sin(t*.25)*.35;globe.rotation.x=.2}},
about(g){ // core values orbit around the P
  const P=new THREE.Mesh(new THREE.ExtrudeGeometry(pShape(),{depth:.5,bevelEnabled:true,bevelThickness:.14,bevelSize:.1,bevelSegments:6,curveSegments:40}),glass(BLUE));P.geometry.center();P.scale.setScalar(.75);g.add(cast(P));
  const vals=['Thấu hiểu','Sáng tạo','Chuẩn hóa','Cam kết','Đồng hành','Chia sẻ'].map(n=>{const l=label(n,{w:448,h:120,size:42,scale:.4});g.add(l);return l});
  return t=>{P.rotation.y=t*.4;vals.forEach((l,i)=>{const a=t*.22+i/6*Math.PI*2;l.position.set(Math.cos(a)*2.7,Math.sin(a*2)*.35+Math.sin(a)*.6,Math.sin(a)*1.3)})}},
projects(g){ // floating frames
  const fr=[];for(let i=0;i<9;i++){const w=[1.4,1.2,1.6][i%3],h=[1.4,1.6,1.05][i%3];const m=new THREE.Mesh(RB(w,h,.08,.08),i%4===0?glass(BLUE):mat(WHITE));g.add(cast(m));fr.push({m,ph:rnd()*6,x:((i%3)-1)*1.9,y:(Math.floor(i/3)-1)*1.7})}
  return t=>{fr.forEach((o,i)=>{o.m.position.set(o.x+Math.sin(t*.4+o.ph)*.1,o.y+Math.sin(t*.7+o.ph)*.15+.3,Math.sin(t*.5+i)*.6);o.m.rotation.set(Math.sin(t*.3+i)*.2,Math.sin(t*.4+o.ph)*.4,0)});g.rotation.y=-.35}},
sme(g){ // dashboard blocks
  const parts=[[0,.6,3.6,2.2,WHITE],[-1.2,-1.1,1.2,.8,BLUE],[0,-1.1,1.0,.8,SKY],[1.2,-1.1,1.2,.8,BLUE2]].map(([x,y,w,h,c])=>{const m=new THREE.Mesh(RB(w,h,.12,.1),mat(c));m.position.set(x,y,0);g.add(cast(m));return m});
  const bars=[];for(let i=0;i<6;i++){const m=new THREE.Mesh(RB(.32,1,.1,.04),mat(i%2?BLUE:BLUE2));g.add(m);bars.push(m)}
  return t=>{bars.forEach((b,i)=>{const h=.4+.9*(.5+.5*Math.sin(t*1.3+i*.7));b.scale.y=h;b.position.set(-1.25+i*.5,.1+h/2,.1)});g.rotation.set(-.15+Math.sin(t*.3)*.05,-.4+Math.sin(t*.25)*.15,0);parts[1].position.z=Math.sin(t)*.15+.1}},
};
const upd=(B[name]||B.home)(root);

function size(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  const wide=w/h>1.05;const ox=+(canvas.dataset.x||3.7);root.position.set(wide?ox:0,wide?0:2.55,0);root.scale.setScalar(wide?(+canvas.dataset.s||1):.5)}
addEventListener('resize',size);size();
let vis=true;new IntersectionObserver(e=>{vis=e[0].isIntersecting}).observe(canvas);
const clock=new THREE.Clock();let T=0;
(function loop(){requestAnimationFrame(loop);if(!vis)return;const dt=Math.min(.05,clock.getDelta());T+=reduce?0:dt;
  try{upd&&upd(T)}catch(e){}
  dust.rotation.y=T*.01;const p=PM.heroP||0;
  camera.position.x+=((PM.mx||0)*.7-camera.position.x)*.05;camera.position.y+=(-(PM.my||0)*.4-p*1.6-camera.position.y)*.05;camera.position.z=11+p*2.5;
  camera.lookAt(root.position.x*.3,-p*1.6,0);
  renderer.render(scene,camera)})();
canvas.classList.add('ready');
}
})();
