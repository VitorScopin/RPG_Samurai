import * as THREE from 'three';
import { scatterPositions, seededRandom } from './environmentLayout.js';

/** Generate compact, repeatable terrain textures offline: no runtime CDN dependency. */
function terrainTexture(kind='forest'){
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=512;
  const context=canvas.getContext('2d');
  const pixels=context.createImageData(512,512);
  const random=seededRandom(kind==='forest'?91445:82821);
  // Earth, leaf litter and moss introduce multiple scales of ground detail.
  const palette=kind==='forest'?[[55,68,45],[69,77,49],[48,60,41],[88,74,51],[104,88,61],[81,94,56]]:
    [[101,86,65],[117,99,75],[81,75,60],[130,113,88],[73,75,62]];
  const coarse=new Float32Array(32*32);
  for(let i=0;i<coarse.length;i++)coarse[i]=random();
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){
    const u=x/16,v=y/16,ix=Math.floor(u),iy=Math.floor(v),fx=u-ix,fy=v-iy;
    const smooth=t=>t*t*(3-2*t);
    const fade=(a,b,t)=>a+(b-a)*smooth(t);
    const c=(a,b)=>coarse[((b+32)%32)*32+(a+32)%32];
    const noise=fade(fade(c(ix,iy),c(ix+1,iy),fx),fade(c(ix,iy+1),c(ix+1,iy+1),fx),fy);
    const grit=random();
    const variant=Math.min(palette.length-1,Math.floor((noise*.73+grit*.27)*palette.length));
    const base=palette[variant],delta=(grit-.5)*20+(noise-.5)*12;
    const i=(y*512+x)*4;
    pixels.data[i]=Math.max(0,base[0]+delta);
    pixels.data[i+1]=Math.max(0,base[1]+delta);
    pixels.data[i+2]=Math.max(0,base[2]+delta);
    pixels.data[i+3]=255;
  }
  context.putImageData(pixels,0,0);
  // Fine elongated leaf fragments on top of larger, organically shaded patches.
  for(let i=0;i<(kind==='forest'?9000:4800);i++){
    const x=random()*512,y=random()*512;
    const w=1+random()*4;
    context.fillStyle=kind==='forest'?(random()>.5?'#9c8051':'#263c31'):(random()>.5?'#b2a078':'#544e40');
    context.globalAlpha=.12+random()*.31;
    context.save();context.translate(x,y);context.rotate(random()*Math.PI*2);
    context.fillRect(0,0,w,.45+random()*1.2);context.restore();
  }
  context.globalAlpha=1;
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(kind==='forest'?54:2,kind==='forest'?54:5);
  texture.anisotropy=8;
  return texture;
}
export function createTerrainMaterials(){
  const forest=terrainTexture('forest'),trail=terrainTexture('trail');
  return {
    ground:new THREE.MeshStandardMaterial({map:forest,color:0xd8e2d3,roughness:.99,metalness:0}),
    path:new THREE.MeshStandardMaterial({map:trail,color:0xf0e6d6,roughness:1,metalness:0,polygonOffset:true,polygonOffsetFactor:-1})
  };
}
function tuftGeometry(){
  // Three crossed, tapered blades make a full tuft with one draw call per patch.
  const geometry=new THREE.BufferGeometry(),vertices=[];
  for(const angle of [0,Math.PI/3,Math.PI*2/3]){
    const dx=Math.cos(angle),dz=Math.sin(angle);
    const x=dx*.18,z=dz*.18;
    vertices.push(-x,0,-z, x,0,z, dx*.075,.68,dz*.075);
    vertices.push(x,0,z, -x,0,-z, -dx*.075,.68,-dz*.075);
  }
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.computeVertexNormals();
  return geometry;
}
function createGrassField(scene,positions){
  const material=new THREE.MeshStandardMaterial({color:0x8b9d63,roughness:1,side:THREE.DoubleSide,depthWrite:true});
  const grass=new THREE.InstancedMesh(tuftGeometry(),material,positions.length);
  const dummy=new THREE.Object3D(),color=new THREE.Color();
  const colors=[0x64854c,0x809457,0x9a995c,0x556f48,0x869b68];
  positions.forEach((p,i)=>{
    dummy.position.set(p.x,-.055,p.z);
    dummy.rotation.set(0,p.angle,0);
    dummy.scale.set(p.scale*(.7+p.variant*.65),.65+p.variant*.55,p.scale);
    dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);
    color.setHex(colors[Math.min(4,Math.floor(p.variant*5))]);
    grass.setColorAt(i,color);
  });
  grass.instanceMatrix.needsUpdate=true;
  if(grass.instanceColor)grass.instanceColor.needsUpdate=true;
  grass.receiveShadow=true;grass.castShadow=false;
  grass.frustumCulled=false;
  scene.add(grass);
  return grass;
}
function createForestDebris(scene,positions){
  const rockGeometry=new THREE.DodecahedronGeometry(1,1);
  const stones=new THREE.InstancedMesh(rockGeometry,new THREE.MeshStandardMaterial({color:0x7d8370,roughness:1,flatShading:true}),positions.length);
  const object=new THREE.Object3D(),color=new THREE.Color();
  for(let i=0;i<positions.length;i++){
    const p=positions[i];
    object.position.set(p.x,.01,p.z);
    object.rotation.set(p.variant*.25,p.angle,p.variant*.11);
    object.scale.set(p.scale*.32,p.scale*.10,p.scale*.28);
    object.updateMatrix();stones.setMatrixAt(i,object.matrix);
    color.setHSL(.20+p.variant*.08,.08,.30+p.variant*.16);
    stones.setColorAt(i,color);
  }
  stones.instanceMatrix.needsUpdate=true;
  if(stones.instanceColor)stones.instanceColor.needsUpdate=true;
  stones.receiveShadow=true;stones.castShadow=false;stones.frustumCulled=false;
  scene.add(stones);
  return stones;
}
export function installEnvironmentalDetails(scene,{trail,exclusions=[]}={}){
  const flowersAndGrasses=scatterPositions({seed:42711,count:1900,boundary:65,clearance:3.6,trail,exclusions});
  const stones=scatterPositions({seed:66713,count:190,boundary:65,clearance:4.2,trail,exclusions});
  const grass=createGrassField(scene,flowersAndGrasses);
  const rocks=createForestDebris(scene,stones);
  // Scattered flowerheads offer bloom color without a costly transparent sprite forest.
  const heads=scatterPositions({seed:7230,count:220,boundary:61,clearance:5.1,trail,exclusions});
  const blossom=new THREE.InstancedMesh(new THREE.TetrahedronGeometry(.105,0),
    new THREE.MeshStandardMaterial({color:0xf6cbca,roughness:1,flatShading:true}),heads.length);
  const item=new THREE.Object3D();
  heads.forEach((p,i)=>{
    item.position.set(p.x,.38+p.variant*.19,p.z);
    item.rotation.set(p.angle,p.angle*.5,p.angle*.3);
    item.scale.setScalar(.65+p.scale*.65);item.updateMatrix();blossom.setMatrixAt(i,item.matrix);
  });
  blossom.instanceMatrix.needsUpdate=true;
  blossom.frustumCulled=false;scene.add(blossom);
  return {grass,rocks,blossom,counts:{grass:flowersAndGrasses.length,rocks:stones.length,flowers:heads.length}};
}
