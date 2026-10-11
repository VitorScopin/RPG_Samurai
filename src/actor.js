import * as THREE from 'three';

const material=(c,metalness=0)=>new THREE.MeshStandardMaterial({color:c,roughness:.78,metalness});
const skin=material(0xc19a7e);
const hair=material(0x191d22);
const cloth=material(0x202a31);
const red=material(0x88352f);
const blue=material(0x243c47);
const armor=material(0x34373b,.3);
const gold=material(0xb99a68,.65);
const steel=material(0xc8d0d1,.88);
const wraps=material(0x8d806b);
const dark=material(0x171a1e);
const horn=material(0xd9cdb2);
const eyeGlow=new THREE.MeshStandardMaterial({color:0xff6b4d,emissive:0xf3391a,emissiveIntensity:2});
const swordGeo=new THREE.BoxGeometry(.09,1.35,.10);
const boxGeo=new THREE.BoxGeometry(1,1,1);
const ballGeo=new THREE.SphereGeometry(1,9,7);
const coneGeo=new THREE.ConeGeometry(1,1,10);
function part(parent,geo,mat,x,y,z,sx=1,sy=1,sz=1) {
  const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function block(parent,mat,x,y,z,sx,sy,sz){return part(parent,boxGeo,mat,x,y,z,sx,sy,sz);}
export function createActor({type='hero',name='Ronin'}={}) {
  const model=new THREE.Group();
  const isEnemy=type==='bandit',isBoss=type==='oni',isMentor=type==='mentor';
  const outfit=isEnemy?red:isMentor?blue:isBoss?dark:cloth;
  const accent=isEnemy?dark:isMentor?gold:isBoss?red:blue;
  const body=new THREE.Group();model.add(body);
  block(body,outfit,0,1.72,0,.8,1.1,.46);
  block(body,accent,0,1.12,0,.85,.2,.5);
  // The hanging haori moves with the hips and reads well at a distance.
  block(body,outfit,-.31,1.04,.02,.28,.63,.44);
  block(body,outfit,.31,1.04,.02,.28,.63,.44);
  block(body,wraps,0,2.13,-.245,.19,.75,.035);
  block(body,armor,0,2.17,.02,.78,.28,.55);
  const neck=part(body,ballGeo,skin,0,2.45,0,.13,.18,.13);
  part(body,ballGeo,isBoss?red:skin,0,2.72,0,.28,.35,.28);
  part(body,ballGeo,hair,0,2.92,.03,.30,.19,.31);
  block(body,hair,0,2.76,.285,.43,.09,.06);
  if(isBoss) {
    for(const x of [-.22,.22]){
      const h=part(body,coneGeo,horn,x,3.17,0,.12,.55,.12);h.rotation.z=x<0?.28:-.28;
      part(body,ballGeo,eyeGlow,x*.65,2.73,-.25,.07,.052,.04);
    }
  } else if(isMentor) {
    const hat=part(body,coneGeo,wraps,0,3.16,0,.8,.62,.8);
    hat.rotation.z=.04;
    part(body,ballGeo,hair,0,2.73,.26,.12,.1,.05);
  } else {
    block(body,wraps,0,2.82,-.29,.47,.1,.04);
  }
  const armL=new THREE.Group(),armR=new THREE.Group();
  armL.position.set(-.53,2.19,0);armR.position.set(.53,2.19,0);
  body.add(armL,armR);
  block(armL,armor,-.02,-.15,0,.39,.44,.42);
  block(armL,outfit,0,-.48,0,.25,.67,.28);
  block(armL,skin,0,-.87,0,.22,.2,.23);
  block(armR,armor,.02,-.15,0,.39,.44,.42);
  block(armR,outfit,0,-.48,0,.25,.67,.28);
  block(armR,skin,0,-.87,0,.22,.2,.23);
  const legL=new THREE.Group(),legR=new THREE.Group();
  legL.position.set(-.22,.91,0);legR.position.set(.22,.91,0);
  model.add(legL,legR);
  block(legL,outfit,0,-.30,0,.31,.77,.33);
  block(legR,outfit,0,-.30,0,.31,.77,.33);
  block(legL,wraps,0,-.66,0,.31,.25,.35);
  block(legR,wraps,0,-.66,0,.31,.25,.35);
  block(legL,dark,0,-.83,-.14,.34,.15,.56);
  block(legR,dark,0,-.83,-.14,.34,.15,.56);
  // The weapon hangs off the right hand so swing animations affect hit silhouette.
  const katana=new THREE.Group();
  katana.position.set(0,-.92,-.08);armR.add(katana);
  block(katana,dark,0,-.22,0,.1,.46,.11);
  block(katana,gold,0,0,0,.38,.09,.23);
  const blade=part(katana,swordGeo,steel,0,.68,0,1,1,1);
  const tip=part(katana,coneGeo,steel,0,1.42,0,.055,.22,.06);
  tip.rotation.z=Math.PI;
  katana.rotation.z=.32;
  if(isMentor) {katana.visible=false;}
  const shadow=part(model,new THREE.CircleGeometry(.64,20),new THREE.MeshBasicMaterial({color:0x0a1513,transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide}),0,.028,0);
  shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;shadow.receiveShadow=false;
  if(isBoss)model.scale.setScalar(1.65);
  return {model,body,armL,armR,legL,legR,katana,type,name,isBoss,animTime:0};
}
export function animateActor(a,elapsed,speed,action='idle',hurt=false) {
  a.animTime += elapsed;
  const walk=Math.min(speed/5.5,1);
  const phase=a.animTime*(6.8+walk*5.7);
  const stride=Math.sin(phase)*walk*.57;
  a.legL.rotation.x=stride;
  a.legR.rotation.x=-stride;
  a.armL.rotation.x=-stride*.4;
  a.armR.rotation.x=stride*.24-.2;
  a.body.position.y=Math.abs(Math.sin(phase))*walk*.07;
  a.body.rotation.z=Math.sin(phase*.5)*walk*.028;
  a.katana.rotation.set(0,0,.28);
  if(action==='attack') {
    a.armR.rotation.x=-1.55;
    a.armR.rotation.z=-.9;
    a.katana.rotation.x=-.65;
    a.body.rotation.y=-.34;
  } else if(action==='block') {
    a.armR.rotation.x=-1.6;
    a.armR.rotation.z=-.30;
    a.katana.rotation.x=-.3;
    a.armL.rotation.x=-.5;
    a.body.rotation.y=0;
  } else {
    a.body.rotation.y=0;
  }
  if(hurt) a.body.rotation.z=.18*Math.sin(a.animTime*20);
}
