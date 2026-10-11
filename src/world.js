import * as THREE from 'three';

const C = {
  ground: 0x355249, grass: 0x47634e, grassLight: 0x637453,
  path: 0x77715d, bark: 0x59453f, blossom: [0xe5a0b0, 0xf4c7cd, 0xdb8b9f, 0xf4d5cf],
  wood: 0x4b312b, red: 0x973e3a, roof: 0x262e34, tile: 0x343c41,
  paper: 0xd5c3a4, lantern: 0xffcb78, stone: 0x777c75
};
const mats = Object.fromEntries(Object.entries(C).filter(([, v]) => typeof v === 'number').map(([k, v]) => [k, new THREE.MeshStandardMaterial({ color: v, roughness: .93 })]));
const geo = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(1, 8, 6),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 7),
  cone: new THREE.ConeGeometry(1, 1, 7)
};
let seed = 49127;
function rnd() { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }
function random(a, b) { return a + (b - a) * rnd(); }
function mesh(g, material, parent, x, y, z, sx=1, sy=1, sz=1) {
  const o = new THREE.Mesh(g, material);
  o.position.set(x, y, z);
  o.scale.set(sx, sy, sz);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}
function box(parent, material, x, y, z, sx, sy, sz) { return mesh(geo.box, material, parent, x, y, z, sx, sy, sz); }
function cylinder(parent, material, x, y, z, radius, height) { return mesh(geo.cylinder, material, parent, x, y, z, radius, height, radius); }
function sphere(parent, material, x, y, z, sx, sy=sx, sz=sx) { return mesh(geo.sphere, material, parent, x, y, z, sx, sy, sz); }
function house(scene, x, z, rot=0, scale=1) {
  const group = new THREE.Group(); group.position.set(x,0,z); group.rotation.y=rot; group.scale.setScalar(scale); scene.add(group);
  box(group, mats.stone, 0,.18,0, 7,.36,5.6);
  box(group, mats.wood,0,1.75,0, 6.6,3,5.1);
  box(group,mats.paper,0,1.55,2.56, 5.1,2.2,.08);
  for (const i of [-2,-1,0,1,2]) box(group,mats.wood,i*1.1,1.55,2.65,.09,2.4,.15);
  box(group,mats.wood,0,2.74,2.64,6.5,.16,.18);
  box(group,mats.wood,0,.46,2.64,6.5,.15,.18);
  const roof=box(group,mats.roof,0,3.55,0,7.8,.65,6.4);
  roof.rotation.z=0;
  box(group,mats.tile,0,3.9,0,8.35,.12,6.6);
  for(const i of [-3.7,3.7]) box(group,mats.wood,i,3.48,0,.18,.4,6.55);
  box(group,mats.wood,2.25,1.2,2.72,1.4,1.7,.1);
  return group;
}
function torii(scene,x,z,scale=1) {
  const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);scene.add(g);
  for(const px of [-2.3,2.3]) {
    cylinder(g,mats.red,px,2.45,0,.20,4.9);
    cylinder(g,mats.stone,px,.3,0,.34,.6);
  }
  box(g,mats.red,0,4.45,0,6,.5,.65);
  box(g,mats.wood,0,4.75,0,6.4,.16,.75);
  box(g,mats.red,0,3.72,0,5.25,.19,.4);
  box(g,mats.roof,0,4.93,0,6.75,.14,.8);
}
function lantern(scene,x,z,scale=1) {
  const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);scene.add(g);
  cylinder(g,mats.stone,0,.25,0,.37,.5);
  cylinder(g,mats.stone,0,1.15,0,.12,1.6);
  box(g,mats.stone,0,2.05,0,.9,.13,.9);
  box(g,new THREE.MeshStandardMaterial({color:C.lantern,emissive:0xe89042,emissiveIntensity:1.25}),0,1.67,0,.56,.62,.56);
  const cap=mesh(new THREE.ConeGeometry(.8,.36,4),mats.roof,g,0,2.34,0);cap.rotation.y=Math.PI/4;
}
function bamboo(scene,x,z,scale=1) {
  const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);scene.add(g);
  const leaf=new THREE.MeshStandardMaterial({color:0x476b4d,side:THREE.DoubleSide,roughness:1});
  for(let i=0;i<3;i++){
    const dx=random(-.4,.4),dz=random(-.4,.4),height=random(4.2,7.5);
    const stalk=mesh(new THREE.CylinderGeometry(.065,.085,height,5),new THREE.MeshStandardMaterial({color: i===0?0x8eaa70:0x779669,roughness:.9}),g,dx,height/2,dz);
    stalk.rotation.z=random(-.05,.05);
    for(let j=1;j<5;j++){
      const side=j%2?1:-1, at=height*(.42+j*.115);
      const blade=mesh(new THREE.ConeGeometry(.3,1.45,3),leaf,g,dx+side*.35,at,dz+random(-.2,.2));
      blade.rotation.z=side*1.05;blade.rotation.y=random(-2,2);
    }
  }
}
function pine(scene,x,z,s=1){
  const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);scene.add(g);
  cylinder(g,mats.bark,0,2.1,0,.25,4.2);
  for(let i=0;i<3;i++){
    const crown=mesh(new THREE.ConeGeometry(2.25-i*.35,3.3,7),mats.grass,g,0,4.1+i*1.35,0);
    crown.rotation.y=i*.23;
  }
}
function sakura(scene,x,z,s=1) {
  const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);scene.add(g);
  cylinder(g,mats.bark,0,2.6,0,.34,5.2);
  for (const side of [-1,1]) {
    const limb=cylinder(g,mats.bark,side*1.05,4.6,0,.19,2.8);
    limb.rotation.z=side*.67;
  }
  for(let i=0;i<12;i++){
    const a=i*2.4,r=i<4?1.25:2.1;
    sphere(g,new THREE.MeshStandardMaterial({color:C.blossom[i%4],roughness:1}),Math.cos(a)*r,5.45+random(-.5,.95),Math.sin(a)*r,random(1.05,1.65),random(.85,1.3),random(1,1.5));
  }
}
function rock(scene,x,z,s=1) {
  const b=mesh(new THREE.DodecahedronGeometry(1,0),mats.stone,scene,x,.38*s,z,s,.6*s,s*1.15);
  b.rotation.y=random(0,3); b.rotation.z=random(-.15,.15);
}
function route(scene, coords, width=3.3) {
  for(let i=1;i<coords.length;i++){
    const [x1,z1]=coords[i-1],[x2,z2]=coords[i];
    const d=Math.hypot(x2-x1,z2-z1);
    const p=mesh(new THREE.PlaneGeometry(width,d+.8),mats.path,scene,(x1+x2)/2,.035,(z1+z2)/2);
    p.rotation.x=-Math.PI/2;
    p.rotation.z=-Math.atan2(x2-x1,z2-z1);
    p.castShadow=false;
  }
}
function sign(scene,x,z,label) {
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  cylinder(g,mats.wood,0,1.05,0,.12,2.1);
  box(g,mats.wood,0,1.85,0,2,.9,.15);
  // Sign boards intentionally use iconography rather than texture assets.
  for(let i=-1;i<=1;i++)box(g,mats.paper,i*.44,1.85,.09,.05,.42,.03);
}
export function createWorld(scene) {
  seed=49127;
  const solids=[];
  const cameraObstacles=[];
  scene.background=new THREE.Color(0x9aa8a8);
  scene.fog=new THREE.FogExp2(0x98a8a6,.0115);
  const hemi=new THREE.HemisphereLight(0xd7e5e6,0x3b493e,2.05);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffd8a2,2.7);
  sun.position.set(-40,80,-60);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-86;sun.shadow.camera.right=86;sun.shadow.camera.top=86;sun.shadow.camera.bottom=-86;
  sun.shadow.normalBias=.02;sun.shadow.bias=-.00015;scene.add(sun);
  const ground=mesh(new THREE.PlaneGeometry(240,240),mats.ground,scene,0,-.1,0);
  ground.rotation.x=-Math.PI/2;ground.castShadow=false;
  // Distant silhouettes provide depth without downloaded models.
  const mountainMat=new THREE.MeshStandardMaterial({color:0x58716c,roughness:1,flatShading:true});
  const peakMat=new THREE.MeshStandardMaterial({color:0x748c86,roughness:1,flatShading:true});
  for(let i=0;i<24;i++){
    const a=i*Math.PI*2/24,r=random(84,115),h=random(17,46);
    const m=mesh(new THREE.ConeGeometry(random(15,30),h,5),i%3?mountainMat:peakMat,scene,Math.cos(a)*r,h*.32-.2,Math.sin(a)*r);
    m.rotation.y=random(0,3);
  }
  route(scene,[[0,17],[0,7],[0,-6],[3,-14],[7,-23],[9,-37],[11,-49]],3.5);
  route(scene,[[0,4],[-8,2],[-15,-5]],2.55);
  // Main village.
  for(const [x,z,rot,s] of [[-10,10,.18,.95],[11,9,-.14,1],[12,-2,.5,.74],[-12,-1,-.35,.82]]) {
    const building=house(scene,x,z,rot,s);
    building.traverse(part=>{if(part.isMesh)cameraObstacles.push(part);});
    solids.push({x,z,r:3.9*s});
  }
  torii(scene,0,-5,.98);torii(scene,9,-31,1.08);
  for(const [x,z] of [[-3,-4],[3,-4],[7,-30],[12,-30],[-4,11],[4,11]])lantern(scene,x,z,.95);
  sign(scene,-4,3);
  for(const [x,z,s] of [[-16,13,1.12],[16,16,1.2],[-17,-8,1.1],[17,-12,1.3],[-9,-20,1.1],[19,-34,1.4],[-5,-40,1],[23,5,1],[4,20,1]]) {
    sakura(scene,x,z,s);solids.push({x,z,r:1.0*s});
  }
  // Small shrine uphill, the Oni's domain.
  const shrine=new THREE.Group();shrine.position.set(12,0,-45);scene.add(shrine);
  const sanctuary=house(scene,12,-46,0,.66);
  sanctuary.traverse(part=>{if(part.isMesh)cameraObstacles.push(part);});
  for(let i=0;i<6;i++) {
    const s=box(scene,mats.stone,11,.07+i*.12,-37-i*1.5,4.8,.14,.86);
    s.position.y=.06+i*.12;
  }
  lantern(scene,6,-44,1);lantern(scene,18,-44,1);
  // Pond and stepping stones in the west.
  const waterMat=new THREE.MeshStandardMaterial({color:0x557d7c,metalness:.35,roughness:.21,transparent:true,opacity:.88,side:THREE.DoubleSide});
  const pond=mesh(new THREE.CircleGeometry(10,40),waterMat,scene,-25,.025,-21,1,.76,1);
  pond.rotation.x=-Math.PI/2;pond.castShadow=false;
  for(let i=0;i<10;i++)rock(scene,-33+random(0,17),-29+random(0,14),random(.35,.9));
  for(let i=0;i<36;i++){
    const a=rnd()*Math.PI*2,r=random(18,66),x=Math.cos(a)*r,z=Math.sin(a)*r;
    if((Math.abs(x)<17&&z>-10&&z<21)|| (x>2&&x<17&&z<-25&&z>-52)||Math.hypot(x+25,z+21)<12)continue;
    if(rnd()<.44){pine(scene,x,z,random(.65,1.25));solids.push({x,z,r:.7});}
    else{sakura(scene,x,z,random(.55,.85));solids.push({x,z,r:.65});}
  }
  for(let i=0;i<68;i++){
    const x=random(-70,70),z=random(-68,68);
    if(Math.abs(x)<9&&z>-50&&z<20 || Math.hypot(x+25,z+21)<12)continue;
    bamboo(scene,x,z,random(.75,1.2));
  }
  for(let i=0;i<85;i++){
    const x=random(-76,76),z=random(-72,72);
    if(Math.abs(x)<6 && z>-49 && z<20)continue;
    if(rnd()<.4)rock(scene,x,z,random(.2,.72));
    else{
      const tuft=mesh(new THREE.ConeGeometry(.3,random(.35,.8),3),mats.grassLight,scene,x,.2,z);
      tuft.rotation.z=random(-.5,.5);
    }
  }
  const petals=[];
  const petalMat=new THREE.MeshBasicMaterial({color:0xf4b6c2,side:THREE.DoubleSide,transparent:true,opacity:.72,depthWrite:false});
  for(let i=0;i<75;i++) {
    const p=mesh(new THREE.PlaneGeometry(.12,.18),petalMat,scene,random(-35,35),random(.8,11),random(-55,25));
    p.castShadow=false;
    petals.push({o:p,s:random(.25,.68),phase:random(0,6.28),base:p.position.y});
  }
  const boundary=68;
  return {
    solids,cameraObstacles,boundary,
    mentor:{x:2,z:8},
    enemies:[{x:-7,z:-17},{x:13,z:-21},{x:-8,z:-38}],
    boss:{x:11,z:-55},
    update(t,dt) {
      for(const {o,s,phase} of petals){
        o.position.x+=dt*(.18+Math.sin(t*.6+phase)*.3);
        o.position.z+=dt*.27;
        o.position.y-=dt*s;
        o.rotation.y+=dt*1.5;
        o.rotation.z+=dt*.9;
        if(o.position.y<.15){o.position.y=random(5,11);o.position.x=random(-30,30);o.position.z=random(-53,24);}
      }
      waterMat.opacity=.85+Math.sin(t*1.5)*.025;
    },
    collides(x,z,r=.65) {
      if(Math.abs(x)>boundary||Math.abs(z)>boundary) return true;
      return solids.some(o=>Math.hypot(o.x-x,o.z-z)<o.r+r);
    }
  };
}
