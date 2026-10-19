/* PMedia site — hero 3D scenes (three.js r160, loaded with dynamic import so pages also work when opened from disk)
   <canvas class="gl" data-scene="home|content|website|branding|ecommerce|outsource|fanpage|media|restaurant|seo|webcare|pr|training|services|contact"> */
(async()=>{
const canvas=document.querySelector('canvas.gl');
if(!canvas)return;
let THREE,EffectComposer,RenderPass,UnrealBloomPass,OutputPass,RoomEnvironment,RoundedBoxGeometry;
try{
  THREE=await import('three');
  [{EffectComposer},{RenderPass},{UnrealBloomPass},{OutputPass},{RoomEnvironment},{RoundedBoxGeometry}]=await Promise.all([
    import('three/addons/postprocessing/EffectComposer.js'),import('three/addons/postprocessing/RenderPass.js'),
    import('three/addons/postprocessing/UnrealBloomPass.js'),import('three/addons/postprocessing/OutputPass.js'),
    import('three/addons/environments/RoomEnvironment.js'),import('three/addons/geometries/RoundedBoxGeometry.js')]);
  boot(canvas);
}catch(e){console.warn('3D disabled:',e)}

function boot(canvas){
const PM=window.PM||(window.PM={heroP:0,mx:0,my:0});
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(40,1,.1,200);camera.position.set(0,0,10);
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;
scene.add(new THREE.HemisphereLight(0xb0d8ff,0x0a1440,1.2));
const key=new THREE.DirectionalLight(0xffffff,1.6);key.position.set(5,8,8);scene.add(key);
const rim=new THREE.PointLight(0x5b93ff,30,30,1.5);rim.position.set(-6,-2,4);scene.add(rim);

/* helpers */
let seed=11;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
const C=h=>new THREE.Color(h);
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const eob=x=>{x=cl(x);const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)};
function ctex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;t.userData.g=g;t.userData.draw=()=>{g.clearRect(0,0,w,h);draw(g,w,h);t.needsUpdate=true};return t}
const glowTex=ctex(128,128,g=>{const r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.5)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,128,128)});glowTex.colorSpace=THREE.NoColorSpace;
const glow=(c,s,o=1)=>{const m=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:C(c),transparent:true,opacity:o,blending:THREE.AdditiveBlending,depthWrite:false}));m.scale.setScalar(s);return m};
const emis=(c,i=2.5)=>new THREE.MeshStandardMaterial({color:0,emissive:C(c),emissiveIntensity:i});
const glass=(c=0x6fa8ff,o={})=>new THREE.MeshPhysicalMaterial(Object.assign({color:c,metalness:.15,roughness:.08,clearcoat:1,clearcoatRoughness:.05,iridescence:.5,envMapIntensity:.6},o));
const RB=(w,h,d,r=.08)=>new RoundedBoxGeometry(w,h,d,4,r);
const rr=(g,x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()};
const FONT=(w,s)=>`${w} ${s}px "Be Vietnam Pro", system-ui, sans-serif`;
const labels=[];
function label(text,{size=56,w=512,h=128,color='#fff',bg=null,scale=.5,weight=800}={}){const t=ctex(w,h,g=>{if(bg){g.fillStyle=bg;rr(g,4,4,w-8,h-8,(h-8)/2);g.fill()}g.font=FONT(weight,size);g.fillStyle=color;g.textAlign='center';g.textBaseline='middle';g.fillText(text,w/2,h/2+2)});
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(scale*w/h,scale,1);labels.push(t);return s}
if(document.fonts)document.fonts.ready.then(()=>labels.forEach(t=>t.userData.draw()));

/* ambient particles */
{const N=900,p=new Float32Array(N*3),c=new Float32Array(N*3);const pal=[C('#ffffff'),C('#8cd2ff'),C('#3b7bff')];
 for(let i=0;i<N;i++){p[i*3]=(rnd()-.5)*30;p[i*3+1]=(rnd()-.5)*18;p[i*3+2]=-14+rnd()*16;const k=pal[i%3];c.set([k.r,k.g,k.b],i*3)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));
 var dust=new THREE.Points(g,new THREE.PointsMaterial({size:.09,map:glowTex,vertexColors:true,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(dust)}

const root=new THREE.Group();scene.add(root);
const name=canvas.dataset.scene||'home';
const B={
home(g){ // ecosystem core + 6 capability satellites
  const core=new THREE.Mesh(new THREE.IcosahedronGeometry(1.15,4),glass(0x5b8cff,{emissive:0x1e4fd8,emissiveIntensity:.5}));g.add(core);
  const wire=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.6,1)),new THREE.LineBasicMaterial({color:0x8cd2ff,transparent:true,opacity:.55}));g.add(wire);
  g.add(glow('#3b7bff',7,.7));
  const rings=[2.4,2.9,3.4].map((r,i)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(r,.012,8,160),emis(i===1?'#ffffff':'#8cd2ff',2));g.add(m);return m});
  const names=['Marketing','Content','Branding','Video','PR','Website'];
  const sats=names.map((n,i)=>{const s=new THREE.Group();const b=new THREE.Mesh(new THREE.SphereGeometry(.2,24,16),emis(i%2?'#8cd2ff':'#ffffff',3));s.add(b);s.add(glow('#8cd2ff',1.2,.8));const l=label(n,{size:46,scale:.42,bg:'rgba(10,26,74,.75)',weight:700});l.position.y=.48;s.add(l);g.add(s);return s});
  const lines=sats.map(()=>{const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);const l=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0x8cd2ff,transparent:true,opacity:.35}));g.add(l);return l});
  return(t)=>{core.rotation.set(t*.2,t*.3,0);wire.rotation.set(-t*.1,t*.15,0);
    rings.forEach((m,i)=>{m.rotation.x=1.2+Math.sin(t*.3+i)*.2;m.rotation.y=t*.12*(i%2?-1:1)});
    sats.forEach((s,i)=>{const a=t*.25+i*Math.PI/3;s.position.set(Math.cos(a)*2.9,Math.sin(a)*1.1,Math.sin(a)*1.6);const pa=lines[i].geometry.attributes.position;pa.setXYZ(1,s.position.x,s.position.y,s.position.z);pa.needsUpdate=true;lines[i].material.opacity=.2+.25*Math.abs(Math.sin(t*1.5+i))})}},
content(g){ // fan of social post cards
  const cards=[];for(let i=0;i<6;i++){const tx=ctex(256,320,c=>{c.fillStyle='#fff';c.fillRect(0,0,256,320);const gr=c.createLinearGradient(0,0,256,170);gr.addColorStop(0,['#3B7BFF','#8CD2FF','#FFB766','#34D6A4','#1E4FD8','#B9A8FF'][i]);gr.addColorStop(1,'#0A1A4A');c.fillStyle=gr;c.fillRect(14,46,228,150);
      c.fillStyle='#2459E6';c.beginPath();c.arc(32,24,12,0,7);c.fill();c.fillStyle='#0B1533';c.fillRect(52,16,90,8);c.fillStyle='#C9D3EA';c.fillRect(52,28,60,6);
      c.fillStyle='#0B1533';c.fillRect(14,212,200,10);c.fillStyle='#C9D3EA';c.fillRect(14,232,228,8);c.fillRect(14,248,170,8);c.fillStyle='#FF5C8A';c.font=FONT(700,22);c.fillText('♥ '+(1.2+i*.7).toFixed(1)+'K',14,296)});
    const m=new THREE.Mesh(RB(1.6,2,.06,.08),[0,0,0,0,new THREE.MeshStandardMaterial({map:tx,roughness:.6,color:0xc9d2e6,envMapIntensity:.4}),new THREE.MeshStandardMaterial({color:0x9fb0d6})].map(x=>x||new THREE.MeshStandardMaterial({color:0xb8c4e0,roughness:.5})));g.add(m);cards.push(m)}
  const hearts=[];for(let i=0;i<10;i++){const h=label('♥',{w:128,h:128,size:90,color:i%2?'#ff7aa2':'#ffffff',scale:.3});g.add(h);hearts.push({h,ph:rnd(),x:(rnd()-.5)*4})}
  return t=>{cards.forEach((m,i)=>{const a=(i-2.5)*.28+Math.sin(t*.5)*.08;m.position.set(.6+Math.sin(a)*3.2,-.4+Math.cos(a)*.6-.6+Math.sin(t+i)*.08,Math.cos(a)*1-1+i*.05);m.rotation.set(-.1,a*.9,-a*.5)});
    hearts.forEach(o=>{const u=(t*.18+o.ph)%1;o.h.position.set(o.x+Math.sin(u*8)*.2,-1.6+u*4,1.2);o.h.material.opacity=Math.sin(u*Math.PI)})}},
website(g){ // layered browser windows + cursor
  const mk=(i)=>ctex(512,340,c=>{c.fillStyle='#fff';c.fillRect(0,0,512,340);c.fillStyle='#EEF2FB';c.fillRect(0,0,512,34);['#FF6B6B','#FFC24B','#3DDC97'].forEach((col,k)=>{c.fillStyle=col;c.beginPath();c.arc(20+k*18,17,6,0,7);c.fill()});
    c.fillStyle='#E1E8F7';rr(c,90,9,300,16,8);c.fill();
    if(i===0){const gr=c.createLinearGradient(0,34,512,200);gr.addColorStop(0,'#1E4FD8');gr.addColorStop(1,'#8CD2FF');c.fillStyle=gr;c.fillRect(0,34,512,170);c.fillStyle='#fff';c.font=FONT(800,30);c.fillText('Website chuẩn SEO',28,110);c.fillStyle='rgba(255,255,255,.8)';c.fillRect(28,128,220,10);c.fillStyle='#fff';rr(c,28,152,120,32,16);c.fill();
      for(let k=0;k<3;k++){c.fillStyle='#EEF2FB';rr(c,20+k*164,220,152,100,12);c.fill();c.fillStyle='#3B7BFF';c.fillRect(36+k*164,240,40,40)}}
    else if(i===1){for(let k=0;k<6;k++){c.fillStyle=k%2?'#EEF2FB':'#DCE6FB';rr(c,20+(k%3)*164,52+Math.floor(k/3)*140,152,124,12);c.fill()}}
    else{c.fillStyle='#0B1533';c.font=FONT(800,26);c.fillText('Landing Page',28,90);for(let k=0;k<5;k++){c.fillStyle='#E1E8F7';c.fillRect(28,120+k*24,420-k*50,10)}c.fillStyle='#3B7BFF';rr(c,28,260,170,44,22);c.fill()}});
  const wins=[0,1,2].map(i=>{const m=new THREE.Mesh(RB(3.4,2.26,.08,.08),new THREE.MeshStandardMaterial({color:0x8fa3d0,roughness:.4}));const f=new THREE.Mesh(new THREE.PlaneGeometry(3.3,2.18),new THREE.MeshBasicMaterial({map:mk(i),color:0xc8d0e0}));f.position.z=.045;m.add(f);g.add(m);return m});
  const cur=label('➤',{w:128,h:128,size:80,color:'#ffffff',scale:.4});g.add(cur);const code=label('</>',{w:256,h:128,size:70,color:'#8cd2ff',scale:.5,weight:900});g.add(code);
  return t=>{wins.forEach((m,i)=>{m.position.set(-.6+i*.9,.7-i*.75+Math.sin(t*.8+i)*.08,-i*1.1);m.rotation.set(-.08,-.35+Math.sin(t*.3)*.06,0)});cur.position.set(-.4+Math.sin(t*.9)*1.2,.4+Math.cos(t*1.3)*.6,.4);code.position.set(1.9,1.8+Math.sin(t)*.1,-.5)}},
branding(g){ // swatch fan + glossy mark
  const cols=['#1E4FD8','#3B7BFF','#8CD2FF','#34D6A4','#FFB766','#FF7A8A','#0B1533','#FFFFFF'];
  const sw=cols.map((c,i)=>{const m=new THREE.Mesh(RB(.7,3,.05,.06),new THREE.MeshPhysicalMaterial({color:C(c),roughness:.25,clearcoat:1}));m.geometry.translate(0,1.3,0);g.add(m);return m});
  const knot=new THREE.Mesh(new THREE.TorusKnotGeometry(.75,.24,220,32,2,3),glass(0x3b7bff,{metalness:.4,roughness:.12}));g.add(knot);g.add(glow('#5b93ff',5,.5));
  return t=>{const open=.5+.5*Math.sin(t*.6);sw.forEach((m,i)=>{m.position.set(-.4,-1.6,-.6+i*.02);m.rotation.z=((i-3.5)*.22)*(.35+open*.9)});knot.position.set(.9,.6,.6);knot.rotation.set(t*.4,t*.6,0)}},
ecommerce(g){ // shopping bag, coins, parcels
  const bag=new THREE.Group();g.add(bag);bag.add(new THREE.Mesh(RB(1.8,2,1,.12),new THREE.MeshPhysicalMaterial({color:0x3b7bff,roughness:.3,clearcoat:1})));
  const h=new THREE.Mesh(new THREE.TorusGeometry(.5,.06,12,40,Math.PI),new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.2}));h.position.y=1;bag.add(h);
  const tag=label('SALE',{w:256,h:128,size:64,color:'#1E4FD8',bg:'#ffffff',scale:.45,weight:900});tag.position.set(0,0,.55);bag.add(tag);
  const coin=new THREE.MeshPhysicalMaterial({color:0xffc24b,metalness:.9,roughness:.25});
  const coins=[];for(let i=0;i<9;i++){const m=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,.07,32),coin);g.add(m);coins.push({m,ph:rnd()*6,r:1.8+rnd()*1.2,y:(rnd()-.5)*2.4})}
  const boxes=[];for(let i=0;i<4;i++){const m=new THREE.Mesh(RB(.6,.6,.6,.06),new THREE.MeshStandardMaterial({color:i%2?0xd8b48a:0x8cd2ff,roughness:.6}));g.add(m);boxes.push(m)}
  return t=>{bag.rotation.y=Math.sin(t*.5)*.4;bag.position.y=Math.sin(t*.9)*.12;coins.forEach(o=>{const a=t*.5+o.ph;o.m.position.set(Math.cos(a)*o.r,o.y+Math.sin(t+o.ph)*.2,Math.sin(a)*o.r);o.m.rotation.set(t*2+o.ph,0,Math.PI/2.4)});
    boxes.forEach((m,i)=>{const a=-t*.3+i*1.57;m.position.set(Math.cos(a)*2.6,-1.4+Math.sin(t+i)*.15,Math.sin(a)*1.4);m.rotation.set(t*.3+i,t*.4,0)})}},
outsource(g){ // team network graph
  const N=26,pts=[];for(let i=0;i<N;i++){const y=1-(i/(N-1))*2,r=Math.sqrt(1-y*y),th=i*2.399;pts.push(new THREE.Vector3(Math.cos(th)*r*2.4,y*2.1,Math.sin(th)*r*2.4))}
  const nodes=pts.map((p,i)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(i%5?.09:.16,16,12),emis(i%5?'#8cd2ff':'#ffffff',3));m.position.copy(p);g.add(m);return m});
  const segs=[];for(let i=0;i<N;i++)for(let j=i+1;j<N;j++)if(pts[i].distanceTo(pts[j])<1.6)segs.push(pts[i],pts[j]);
  const lg=new THREE.BufferGeometry().setFromPoints(segs);g.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0x5b93ff,transparent:true,opacity:.45})));
  const core=new THREE.Mesh(new THREE.SphereGeometry(.7,48,32),glass(0x3b7bff,{emissive:0x1e4fd8,emissiveIntensity:.6}));g.add(core);g.add(glow('#3b7bff',5,.6));
  const lab=label('Phòng Marketing',{size:44,w:640,scale:.4,bg:'rgba(10,26,74,.8)',weight:700});lab.position.y=-1.1;g.add(lab);
  const pulses=[];for(let i=0;i<14;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),emis('#ffffff',4));g.add(m);pulses.push({m,s:Math.floor(rnd()*segs.length/2)*2,ph:rnd()})}
  return t=>{g.rotation.y=t*.15;pulses.forEach(o=>{const u=(t*.4+o.ph)%1;o.m.position.lerpVectors(segs[o.s],segs[o.s+1],u)});nodes.forEach((m,i)=>m.scale.setScalar(1+.3*Math.sin(t*2+i)))}},
fanpage(g){ // tiered packages
  const tiers=[['BASIC',1.1,'#8cd2ff'],['STANDARD',1.8,'#3b7bff'],['VIP',2.6,'#ffffff']];
  const ps=tiers.map(([n,h,c],i)=>{const grp=new THREE.Group();g.add(grp);const m=new THREE.Mesh(RB(1.1,h,1.1,.1),glass(C(c).getHex(),{transmission:0,opacity:1}));m.position.y=h/2;grp.add(m);
    const cap=new THREE.Mesh(new THREE.BoxGeometry(1.12,.05,1.12),emis(c,2.6));cap.position.y=h+.03;grp.add(cap);const l=label(n,{size:50,scale:.38,weight:900});l.position.y=h+.5;grp.add(l);grp.position.set((i-1)*1.55,-1.8,0);return grp});
  const floor=new THREE.Mesh(new THREE.CircleGeometry(3.4,64),new THREE.MeshBasicMaterial({map:glowTex,color:0x3b7bff,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.8;g.add(floor);
  return t=>{g.rotation.y=-.35+Math.sin(t*.3)*.2;ps.forEach((p,i)=>p.position.y=-1.8+Math.sin(t*1.1+i)*.06)}},
media(g){ // camera lens
  const lens=new THREE.Group();g.add(lens);const metal=new THREE.MeshPhysicalMaterial({color:0x1a2340,metalness:.9,roughness:.25,clearcoat:1});
  [[1.7,.5],[1.5,.4],[1.3,.6]].forEach(([r,d],i)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d,64,1,true),metal);m.rotation.x=Math.PI/2;m.position.z=-i*.45;lens.add(m);const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.03,8,96),emis(i?'#8cd2ff':'#ffffff',2));ring.position.z=-i*.45+d/2;lens.add(ring)});
  const glassD=new THREE.Mesh(new THREE.CircleGeometry(1.25,64),new THREE.MeshPhysicalMaterial({color:0x1e4fd8,metalness:.2,roughness:.02,clearcoat:1,iridescence:1,envMapIntensity:2}));glassD.position.z=-.2;lens.add(glassD);
  const blades=[];for(let i=0;i<7;i++){const b=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.5),new THREE.MeshStandardMaterial({color:0x0b1533,metalness:.7,roughness:.3,side:THREE.DoubleSide}));lens.add(b);blades.push(b)}
  const flare=glow('#ffffff',1.6,.9);flare.position.set(.4,.4,.3);lens.add(flare);
  const rec=label('● REC',{w:256,h:96,size:44,color:'#ff5c6c',scale:.32,weight:800});rec.position.set(-1.7,1.9,0);g.add(rec);
  return t=>{lens.rotation.set(Math.sin(t*.4)*.25,-.5+Math.sin(t*.3)*.3,0);const ap=.35+.25*(.5+.5*Math.sin(t*.8));blades.forEach((b,i)=>{const a=i/7*Math.PI*2;b.position.set(Math.cos(a)*(ap+.45),Math.sin(a)*(ap+.45),-.18);b.rotation.z=a+1.2});rec.material.opacity=Math.sin(t*4)>0?1:.25}},
restaurant(g){ // steaming bowl
  const bowl=new THREE.Group();g.add(bowl);const prof=[[0,-.95],[.75,-.95],[.8,-.85],[1.35,-.55],[1.8,0],[1.92,.32],[1.86,.36],[1.72,.05],[1.25,-.45],[.7,-.75],[0,-.8]].map(p=>new THREE.Vector2(p[0],p[1]));
  bowl.add(new THREE.Mesh(new THREE.LatheGeometry(prof,96),new THREE.MeshPhysicalMaterial({color:0xe6edfa,roughness:.25,clearcoat:1,envMapIntensity:.6,side:THREE.DoubleSide})));
  const band=new THREE.Mesh(new THREE.TorusGeometry(1.86,.035,12,120),emis('#3b7bff',1.2));band.rotation.x=Math.PI/2;band.position.y=.18;bowl.add(band);
  const broth=new THREE.Mesh(new THREE.CircleGeometry(1.68,64),new THREE.MeshStandardMaterial({color:0xd98a3a,emissive:0xff9a40,emissiveIntensity:.3,roughness:.15}));broth.rotation.x=-Math.PI/2;broth.position.y=.12;bowl.add(broth);
  const nm=new THREE.MeshStandardMaterial({color:0xfff1d6,roughness:.4});for(let i=0;i<8;i++){const pts=[];const a0=rnd()*6.28,r0=.2+rnd()*1.1;for(let j=0;j<10;j++){const a=a0+j*.35,r=Math.min(1.45,r0+Math.sin(j*.9)*.25);pts.push(new THREE.Vector3(Math.cos(a)*r,.15+Math.sin(j*1.3)*.04,Math.sin(a)*r))}bowl.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),40,.045,6),nm))}
  const herb=new THREE.MeshStandardMaterial({color:0x3fbf6a,roughness:.5});for(let i=0;i<12;i++){const h=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),herb);h.scale.set(1,.25,.6);const a=rnd()*6.28,r=rnd()*1.3;h.position.set(Math.cos(a)*r,.2,Math.sin(a)*r);bowl.add(h)}
  const chop=new THREE.MeshStandardMaterial({color:0xc58a52,roughness:.5});[0,.18].forEach(o=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,4.4,10),chop);c.rotation.z=Math.PI/2-.22;c.rotation.y=.5;c.position.set(.6,.62+o*.4,.3+o);bowl.add(c)});
  const warm=new THREE.PointLight(0xffa860,14,8,1.4);warm.position.set(0,1.4,1.2);bowl.add(warm);
  const steam=[];for(let i=0;i<26;i++){const s=glow('#fff3e4',1.4+rnd()*1.2,0);bowl.add(s);steam.push({s,ph:rnd(),x:(rnd()-.5)*2,z:(rnd()-.5)*1.2})}
  return t=>{bowl.rotation.set(.45,t*.25,0);steam.forEach(o=>{const u=(t*.22+o.ph)%1;o.s.position.set(o.x+Math.sin(u*6+o.ph*9)*.3,.3+u*3.6,o.z);o.s.material.opacity=Math.sin(u*Math.PI)*.22;o.s.scale.setScalar(1+u*2)})}},
seo(g){ // rising ranking bars + magnifier + #1
  const bars=[];for(let i=0;i<7;i++){const h=.5+i*.42;const m=new THREE.Mesh(RB(.55,1,.55,.06),glass(i===6?0xffffff:0x3b7bff,{iridescence:.3}));g.add(m);const cap=new THREE.Mesh(new THREE.BoxGeometry(.56,.04,.56),emis(i===6?'#ffffff':'#8cd2ff',2.4));g.add(cap);bars.push({m,cap,h,i})}
  const mag=new THREE.Group();g.add(mag);mag.add(new THREE.Mesh(new THREE.TorusGeometry(.75,.11,20,64),new THREE.MeshPhysicalMaterial({color:0xffffff,metalness:.6,roughness:.15,clearcoat:1})));
  const lensM=new THREE.Mesh(new THREE.CircleGeometry(.7,48),new THREE.MeshPhysicalMaterial({color:0x8cd2ff,transparent:true,opacity:.25,roughness:0,clearcoat:1}));mag.add(lensM);
  const hd=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,1.2,16),new THREE.MeshPhysicalMaterial({color:0x1e4fd8,roughness:.3}));hd.position.set(.75,-.75,0);hd.rotation.z=Math.PI/4;mag.add(hd);
  const top=label('#1 Google',{w:512,h:128,size:56,color:'#1E4FD8',bg:'#ffffff',scale:.42,weight:900});g.add(top);
  return t=>{bars.forEach(o=>{const s=.75+.25*Math.sin(t*.9+o.i*.5);const h=o.h*s;o.m.scale.y=h;o.m.position.set(-2+o.i*.66,-1.9+h/2,-o.i*.08);o.cap.position.set(o.m.position.x,-1.9+h+.02,o.m.position.z)});
    mag.position.set(.9+Math.sin(t*.7)*.4,.9+Math.cos(t*.9)*.25,1);mag.rotation.set(0,Math.sin(t*.5)*.4,0);top.position.set(1.95,1.2+.25*Math.sin(t*.9)+bars[6].h*.25,0)}},
webcare(g){ // shield + heartbeat
  const sh=new THREE.Shape();sh.moveTo(0,1.5);sh.bezierCurveTo(.7,1.25,1.2,1.25,1.4,1.2);sh.bezierCurveTo(1.4,.1,1.1,-.9,0,-1.6);sh.bezierCurveTo(-1.1,-.9,-1.4,.1,-1.4,1.2);sh.bezierCurveTo(-1.2,1.25,-.7,1.25,0,1.5);
  const shield=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.3,bevelEnabled:true,bevelThickness:.12,bevelSize:.1,bevelSegments:6}),glass(0x2e6bff,{metalness:.3,roughness:.12,emissive:0x0e2a80,emissiveIntensity:.4}));shield.geometry.center();g.add(shield);
  const ck=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-.55,0,.35),new THREE.Vector3(-.15,-.4,.35),new THREE.Vector3(.6,.5,.35)],false,'catmullrom',0),40,.09,12),emis('#34d6a4',2.6));g.add(ck);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.3,.015,8,160),emis('#8cd2ff',2));g.add(ring);const dot=new THREE.Mesh(new THREE.SphereGeometry(.08,12,8),emis('#ffffff',4));g.add(dot);
  const N=120,lp=new Float32Array(N*3);const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.BufferAttribute(lp,3));const line=new THREE.Line(lg,new THREE.LineBasicMaterial({color:0x34d6a4}));line.position.set(0,-2.3,.4);g.add(line);
  const up=label('Uptime 24/7',{w:512,h:128,size:50,color:'#ffffff',bg:'rgba(10,26,74,.8)',scale:.38,weight:700});up.position.set(1.9,1.7,0);g.add(up);
  return t=>{shield.rotation.y=Math.sin(t*.6)*.5;ck.rotation.y=shield.rotation.y;ring.rotation.set(1.2,0,t*.2);const a=t*.8;dot.position.set(Math.cos(a)*2.3,Math.sin(a)*2.3*Math.cos(1.2),Math.sin(a)*2.3*Math.sin(1.2));
    for(let i=0;i<N;i++){const x=-2.6+i/N*5.2;const ph=(i/N*3-t*.8)%1;const k=((ph%1)+1)%1;const y=k>.45&&k<.5?.5:k>.5&&k<.55?-.35:k>.55&&k<.6?.2:0;lp.set([x,y*.9,0],i*3)}lg.attributes.position.needsUpdate=true}},
pr(g){ // broadcast waves + floating news cards
  const core=new THREE.Mesh(new THREE.SphereGeometry(.7,48,32),glass(0x3b7bff,{emissive:0x1e4fd8,emissiveIntensity:.6}));g.add(core);g.add(glow('#5b93ff',4,.7));
  const waves=[0,1,2,3].map(()=>{const m=new THREE.Mesh(new THREE.TorusGeometry(1,.02,8,120),new THREE.MeshBasicMaterial({color:0x8cd2ff,transparent:true,blending:THREE.AdditiveBlending}));g.add(m);return m});
  const names=['Báo chí','KOL','KOC','TV','Hot page'];const cards=names.map((n,i)=>{const l=label(n,{w:384,h:128,size:50,color:'#1E4FD8',bg:'#ffffff',scale:.42,weight:800});g.add(l);return l});
  return t=>{core.rotation.y=t*.4;waves.forEach((m,i)=>{const u=(t*.3+i/4)%1;m.scale.setScalar(.8+u*2.6);m.material.opacity=1-u;m.rotation.set(1.1,0,0)});cards.forEach((c,i)=>{const a=t*.3+i/names.length*Math.PI*2;c.position.set(Math.cos(a)*2.6,Math.sin(a*1.3)*.5+(i%2?.6:-.6),Math.sin(a)*1.2)})}},
training(g){ // staircase of growth + hopping orb
  const steps=[];for(let i=0;i<5;i++){const m=new THREE.Mesh(RB(1,.35+i*.45,1,.06),glass(i===4?0xffffff:0x3b7bff,{iridescence:.4}));m.position.set(-2+i*1,-1.8+(.35+i*.45)/2,0);g.add(m);const cap=new THREE.Mesh(new THREE.BoxGeometry(1.01,.04,1.01),emis('#8cd2ff',2));cap.position.set(m.position.x,-1.8+.35+i*.45+.02,0);g.add(cap);steps.push(m)}
  const orb=new THREE.Mesh(new THREE.SphereGeometry(.22,32,24),emis('#ffffff',3));g.add(orb);orb.add(glow('#8cd2ff',1.4,.9));
  const topics=['Digital','Content','Social','Ads','SEO','Coaching'].map((n,i)=>{const l=label(n,{w:384,h:112,size:44,color:'#fff',bg:'rgba(10,26,74,.8)',scale:.34,weight:700});g.add(l);return l});
  return t=>{const u=(t*.35)%5;const i=Math.floor(u),f=u-i;const h0=-1.8+.35+i*.45,h1=-1.8+.35+Math.min(4,i+1)*.45;orb.position.set(-2+i+f*(i<4?1:0),(h0+(h1-h0)*f)+.25+Math.sin(f*Math.PI)*.6,0);
    topics.forEach((l,k)=>{const a=t*.25+k/6*Math.PI*2;l.position.set(Math.cos(a)*3,1.3+Math.sin(a*2)*.3,Math.sin(a)*1.2)});g.rotation.y=-.3+Math.sin(t*.3)*.15}},
services(g){ // wave of service tiles
  const tiles=[];for(let i=0;i<20;i++){const m=new THREE.Mesh(RB(.9,.9,.12,.12),glass(i%3===0?0xffffff:0x3b7bff,{iridescence:.5}));g.add(m);tiles.push({m,x:(i%5-2)*1.1,y:(Math.floor(i/5)-1.5)*1.1})}
  return t=>{tiles.forEach((o,i)=>{const w=Math.sin(t*1.2-(o.x+o.y)*.8);o.m.position.set(o.x,o.y,w*.5);o.m.rotation.set(w*.4,w*.3,0)});g.rotation.set(-.35,-.45,0)}},
contact(g){ // dotted globe + two office pins
  const N=1400,p=new Float32Array(N*3);for(let i=0;i<N;i++){const y=1-(i/(N-1))*2,r=Math.sqrt(1-y*y),th=i*2.39996;p.set([Math.cos(th)*r*2,y*2,Math.sin(th)*r*2],i*3)}
  const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.BufferAttribute(p,3));const globe=new THREE.Points(gg,new THREE.PointsMaterial({size:.05,color:0x8cd2ff,transparent:true,opacity:.9}));g.add(globe);
  const inner=new THREE.Mesh(new THREE.SphereGeometry(1.95,48,32),new THREE.MeshBasicMaterial({color:0x0a1a4a,transparent:true,opacity:.6}));g.add(inner);
  const ll=(lat,lon,r=2)=>{const phi=(90-lat)*Math.PI/180,th=(lon+180)*Math.PI/180;return new THREE.Vector3(-r*Math.sin(phi)*Math.cos(th),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(th))};
  const a=ll(10.8,106.68),b=ll(10.95,106.82);const pin=v=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.09,16,12),emis('#ffffff',4));m.position.copy(v);globe.add(m);const gl=glow('#8cd2ff',.9,1);gl.position.copy(v);globe.add(gl)};pin(a);pin(b);
  const lb=label('TP.HCM · Biên Hòa',{w:640,h:120,size:46,color:'#1E4FD8',bg:'#ffffff',scale:.4,weight:800});g.add(lb);
  const target=-Math.atan2(a.z,a.x);
  return t=>{globe.rotation.y=-Math.PI/2-1.86+Math.sin(t*.25)*.35;globe.rotation.x=.2;lb.position.set(0,2.5,0)}}
};
const build=B[name]||B.home;const upd=build(root);

/* bloom only on larger screens */
let composer=null;
if(innerWidth>760&&!reduce){try{composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));composer.addPass(new UnrealBloomPass(new THREE.Vector2(256,256),.38,.45,.93));composer.addPass(new OutputPass())}catch(e){composer=null}}
function size(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);if(composer)composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();
  const wide=w/h>1.05;root.position.set(wide?3.9:0,wide?-.1:2.35,0);root.scale.setScalar(wide?1:.55)}
addEventListener('resize',size);size();

let vis=true;new IntersectionObserver(e=>{vis=e[0].isIntersecting},{threshold:0}).observe(canvas);
const clock=new THREE.Clock();let T=0;
function loop(){requestAnimationFrame(loop);if(!vis)return;const dt=Math.min(.05,clock.getDelta());T+=reduce?0:dt;
  try{upd&&upd(T)}catch(e){}
  dust.rotation.y=T*.01;
  const p=PM.heroP||0;
  camera.position.x+=((PM.mx||0)*.8-camera.position.x)*.05;camera.position.y+=(-(PM.my||0)*.5-p*1.5-camera.position.y)*.05;camera.position.z=10+p*3;
  camera.lookAt(root.position.x*.35,-p*1.5,0);root.rotation.z=p*.15;
  if(composer)composer.render();else renderer.render(scene,camera)}
loop();
canvas.classList.add('ready');
}
})();
