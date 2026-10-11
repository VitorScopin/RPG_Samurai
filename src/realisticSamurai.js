/**
 * High-fidelity, skinned samurai characters with real authored skeletal animations.
 *
 * Source: dark_igorek, "Shadowflame Samurai" (CC BY 4.0), via MIT-licensed
 * SamuraiThirdPersonTemplateThreeJS FBX export. Motion clips: Mixamo.
 * See ASSET_CREDITS.md for the author and exact source URLs.
 *
 * The old procedural characters remain visible unless the full rig and at
 * least the idle motion load successfully.
 */
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { decorateEnemyRig, ENEMY_ARCHETYPES } from './enemyArchetypes.js';

const DIRECTORY='/character/';
const ANIMATION_PATHS={
  idle:'Idle.fbx',
  walk:'Walk.fbx',
  run:'Run.fbx',
  attack:'Slash.fbx',
  heavy:'CrouchSlash.fbx',
  block:'Block.fbx',
  dodge:'Dodge.fbx'
};
const TARGET_HEIGHT=2.48;
const reusable={promise:null};
const nameKey=name=>String(name||'').toLowerCase().replace(/(\.\d{3}|\s*\(\d+\))$/,'').replace(/[^a-z0-9]/g,'').replace(/^mixamorig/,'');
const materialKey=name=>nameKey(name).replace(/^material|^mat|material$|mat$/g,'');
const interp=(x,y,dt,sharpness=11)=>x+(y-x)*(1-Math.exp(-dt*sharpness));
function indexRigBones(rig){
  const bones=new Map();
  rig.traverse(node=>{
    if(!node.isBone)return;
    bones.set(nameKey(node.name),node);
  });
  return bones;
}
function retargetClip(source,name,bones){
  const clip=source?.animations?.[0];
  if(!clip)return null;
  const hips=bones.get('hips');
  const ratios=[];
  for(const track of clip.tracks){
    if(!track.name.endsWith('.position')||track.values.length<3)continue;
    const parsed=THREE.PropertyBinding.parseTrackName(track.name);
    const target=bones.get(nameKey(parsed.nodeName));
    if(!target||target===hips)continue;
    const a=Math.hypot(...track.values.slice(0,3));
    const b=target.position.length();
    if(a>1e-6&&b>1e-6)ratios.push(b/a);
  }
  ratios.sort((a,b)=>a-b);
  const rawRatio=ratios.length?ratios[ratios.length>>1]:1;
  const ratio=rawRatio>.5&&rawRatio<2?1:rawRatio;
  const tracks=[];
  for(const sourceTrack of clip.tracks){
    const parsed=THREE.PropertyBinding.parseTrackName(sourceTrack.name);
    const target=bones.get(nameKey(parsed.nodeName));
    if(!target)continue;
    const track=sourceTrack.clone();
    const property=track.name.slice(parsed.nodeName.length);
    track.name=target.name+property;
    if(property==='.position'){
      for(let i=0;i<track.values.length;i++)track.values[i]*=ratio;
      if(target===hips){
        for(let i=0;i<track.values.length;i+=3){
          track.values[i]=hips.position.x;
          track.values[i+2]=hips.position.z;
        }
      }
    }
    tracks.push(track);
  }
  return tracks.length?new THREE.AnimationClip(name,clip.duration,tracks):null;
}
function materialsFromGltf(gltf){
  const source=new Map();
  gltf.scene.traverse(node=>{
    if(!node.isMesh)return;
    for(const mat of Array.isArray(node.material)?node.material:[node.material]){
      if(mat&&!source.has(materialKey(mat.name)))source.set(materialKey(mat.name),mat);
    }
  });
  for(const material of new Set(source.values())){
    for(const key of Object.keys(material)){
      const tex=material[key];
      if(!tex?.isTexture)continue;
      // glTF textures have a top-left origin; FBX UVs have a bottom-left one.
      tex.repeat.y=-1;
      tex.offset.y=1;
      tex.anisotropy=4;
    }
  }
  return source;
}
async function prepareAsset(){
  const loader=new FBXLoader();
  const motionNames=Object.keys(ANIMATION_PATHS);
  const [rig,motionResults,glbResult]=await Promise.all([
    loader.loadAsync(DIRECTORY+'ronin.fbx'),
    Promise.allSettled(motionNames.map(key=>loader.loadAsync(DIRECTORY+ANIMATION_PATHS[key]))),
    new GLTFLoader().loadAsync(DIRECTORY+'materials.glb').catch(()=>null)
  ]);
  const bodyBones=indexRigBones(rig);
  if(!bodyBones.has('hips')||!bodyBones.has('righthand'))throw new Error('Arquivo FBX sem o esqueleto humanoide esperado.');
  const clips={};
  for(let i=0;i<motionNames.length;i++){
    const result=motionResults[i];
    if(result.status==='fulfilled'){
      const clip=retargetClip(result.value,motionNames[i],bodyBones);
      if(clip)clips[motionNames[i]]=clip;
    }
  }
  if(!clips.idle||!clips.walk||!clips.run)throw new Error('Faltam animações de locomoção compatíveis.');
  const palette=glbResult?materialsFromGltf(glbResult):new Map();
  rig.traverse(node=>{
    if(!node.isMesh&&!node.isSkinnedMesh)return;
    node.castShadow=true;
    node.receiveShadow=true;
    node.frustumCulled=false;
    const convert=material=>{
      const authored=palette.get(materialKey(material.name));
      if(authored)return authored;
      const result=new THREE.MeshStandardMaterial({
        name:material.name,
        map:material.map||null,
        normalMap:material.normalMap||null,
        color:material.color||new THREE.Color(0xbbb4aa),
        metalness:.33,
        roughness:.8,
        side:material.side
      });
      if(result.map)result.map.colorSpace=THREE.SRGBColorSpace;
      return result;
    };
    node.material=Array.isArray(node.material)?node.material.map(convert):convert(node.material);
  });
  return {rig,clips};
}
function getAsset(){
  if(!reusable.promise)reusable.promise=prepareAsset();
  return reusable.promise;
}
function swordModel(){
  const g=new THREE.Group();
  const steel=new THREE.MeshStandardMaterial({color:0xdde1db,metalness:.94,roughness:.19,side:THREE.DoubleSide});
  const back=new THREE.MeshStandardMaterial({color:0x6a7377,metalness:.9,roughness:.31});
  const handle=new THREE.MeshStandardMaterial({color:0x26252b,roughness:.72});
  const silk=new THREE.MeshStandardMaterial({color:0xa28462,metalness:.18,roughness:.53});
  const brass=new THREE.MeshStandardMaterial({color:0xa68c59,metalness:.78,roughness:.26});
  const bladeShape=new THREE.Shape();
  bladeShape.moveTo(-.036,.01);
  bladeShape.lineTo(-.036,.76);
  bladeShape.quadraticCurveTo(-.032,1.03,.022,1.12);
  bladeShape.quadraticCurveTo(.065,1.02,.052,.86);
  bladeShape.lineTo(.047,.01);
  bladeShape.closePath();
  const blade=new THREE.Mesh(new THREE.ExtrudeGeometry(bladeShape,{
    depth:.018,bevelEnabled:true,bevelSegments:1,steps:1,bevelThickness:.005,bevelSize:.003,curveSegments:7
  }),steel);
  blade.castShadow=true;g.add(blade);
  const ridge=new THREE.Mesh(new THREE.BoxGeometry(.008,.92,.022),back);
  ridge.position.set(-.026,.47,.012);g.add(ridge);
  const tsuba=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.02,12),brass);
  tsuba.rotation.z=Math.PI/2;tsuba.position.y=.01;tsuba.castShadow=true;g.add(tsuba);
  const grip=new THREE.Mesh(new THREE.CylinderGeometry(.037,.043,.28,9),handle);
  grip.position.y=-.15;grip.castShadow=true;g.add(grip);
  for(let i=0;i<6;i++){
    const wrap=new THREE.Mesh(new THREE.TorusGeometry(.038,.008,4,8),silk);
    wrap.rotation.x=Math.PI/2;wrap.position.y=-.025-i*.045;g.add(wrap);
  }
  const end=new THREE.Mesh(new THREE.CylinderGeometry(.04,.05,.046,9),brass);
  end.position.y=-.31;g.add(end);
  return g;
}
function mountSword(rig,bones,rootScale){
  const hand=bones.get('righthand');
  if(!hand)return;
  // Keep weapon dimensions in world metres despite the source rig being in cm.
  const mount=new THREE.Group();
  mount.name='Katana';
  const worldScale=new THREE.Vector3();
  hand.getWorldScale(worldScale);
  mount.scale.set(1/Math.max(1e-6,worldScale.x),1/Math.max(1e-6,worldScale.y),1/Math.max(1e-6,worldScale.z));
  mount.rotation.set(.08,0,-.3);
  mount.add(swordModel());
  hand.add(mount);
}
function makeRig(asset,actor,{role='hero'}={}){
  const fbx=cloneSkinned(asset.rig);
  const pivot=new THREE.Group();
  pivot.name='DetailedSamurai';
  pivot.add(fbx);
  // FBX exports centimetres. Normalize heights for existing world collision boxes.
  fbx.scale.setScalar(.01);
  fbx.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(fbx);
  const desired=role==='mentor'?2.65:role==='shinobi'?2.37:role==='ashigaru'?2.55:role==='cursed'?2.92:role==='bandit'?2.42:TARGET_HEIGHT;
  const height=Math.max(.1,bounds.max.y-bounds.min.y);
  fbx.scale.multiplyScalar(desired/height);
  fbx.updateMatrixWorld(true);
  bounds.setFromObject(fbx);
  const center=new THREE.Vector3();
  bounds.getCenter(center);
  fbx.position.set(-center.x,-bounds.min.y,-center.z);
  fbx.updateMatrixWorld(true);
  const bones=indexRigBones(fbx);
  const foot=bones.get('leftfoot'),toe=bones.get('lefttoebase');
  let forwardYaw=0;
  if(foot&&toe){
    const footP=foot.getWorldPosition(new THREE.Vector3());
    const tip=toe.getWorldPosition(new THREE.Vector3()).sub(footP);
    if(Math.hypot(tip.x,tip.z)>.00001)forwardYaw=Math.atan2(tip.x,tip.z);
  }
  // The game controller defines the forward direction as -Z at yaw=0.
  pivot.rotation.y=Math.PI-forwardYaw;
  // Avoid changing the cached skinned mesh's material between NPC variants.
  fbx.traverse(node=>{
    if(!node.isMesh&&!node.isSkinnedMesh)return;
    const colorTint={shinobi:0x7698a2,ashigaru:0xa9a183,cursed:0xab7775};
    const tint=colorTint[role]?new THREE.Color(colorTint[role]):role==='bandit'?new THREE.Color(0xd2a0a0):role==='mentor'?new THREE.Color(0xd0d4d4):new THREE.Color(0xffffff);
    const recolor=material=>{
      const m=material.clone();
      m.color.multiply(tint);
      return m;
    };
    node.material=Array.isArray(node.material)?node.material.map(recolor):recolor(node.material);
    node.castShadow=true;node.receiveShadow=true;node.frustumCulled=false;
  });
  mountSword(fbx,bones,fbx.scale.x);
  // Three materially distinct enemy armor/weapon meshes follow the actual
  // Mixamo bones; NPCs therefore animate instead of moving as static statues.
  if(ENEMY_ARCHETYPES[role])decorateEnemyRig(fbx,bones,role);
  const mixer=new THREE.AnimationMixer(fbx);
  const actions={};
  for(const [name,clip] of Object.entries(asset.clips)){
    const action=mixer.clipAction(clip);
    action.enabled=true;
    action.setEffectiveWeight(0);
    action.setLoop(['attack','heavy','dodge'].includes(name)?THREE.LoopOnce:THREE.LoopRepeat,Infinity);
    action.clampWhenFinished=false;
    actions[name]=action;
    if(['idle','walk','run'].includes(name))action.play();
  }
  actions.idle?.setEffectiveWeight(1);
  const weight={idle:1,walk:0,run:0};
  let lastPose='idle';
  let currentStrike=null;
  let overlayWeight=0;
  function update(dt,speed,pose='idle'){
    const moving=clamp01(speed/4.3),running=clamp01((speed-4.3)/3);
    const goals={idle:1-moving,walk:moving*(1-running),run:moving*running};
    if(role==='mentor'){goals.idle=1;goals.walk=0;goals.run=0;}
    if(role==='bandit'||role==='ashigaru'||role==='cursed'){
      goals.run=0;
      goals.walk=clamp01(speed/(role==='ashigaru'?2.05:role==='cursed'?1.75:2.4));
      goals.idle=1-goals.walk;
    }
    for(const key of ['idle','walk','run'])weight[key]=interp(weight[key],goals[key],dt,10);
    let overlayName=null;
    if(pose==='attack')overlayName='attack';
    if(pose==='heavy')overlayName='heavy';
    if(pose==='block')overlayName='block';
    if(pose==='dodge')overlayName='dodge';
    if(overlayName&&!actions[overlayName])overlayName=null;
    if(overlayName&&lastPose!==overlayName){
      const action=actions[overlayName];
      if(currentStrike&&currentStrike!==action)currentStrike.stop();
      action.reset();
      action.setEffectiveTimeScale(action.getClip().duration/(overlayName==='attack'?.70:overlayName==='heavy'?.97:overlayName==='dodge'?.36:1.2));
      action.setLoop(['attack','heavy','dodge'].includes(overlayName)?THREE.LoopOnce:THREE.LoopRepeat,Infinity);
      action.play();currentStrike=action;
    }
    if(overlayName&&currentStrike?.getClip().name===overlayName)overlayWeight=interp(overlayWeight,1,dt,18);
    else overlayWeight=interp(overlayWeight,0,dt,10);
    if(currentStrike){
      currentStrike.setEffectiveWeight(overlayWeight);
      if(overlayWeight<.014){currentStrike.stop();currentStrike=null;}
    }
    for(const key of ['idle','walk','run'])actions[key]?.setEffectiveWeight(weight[key]*(1-overlayWeight));
    const walk=actions.walk,run=actions.run;
    if(walk&&run&&walk.getClip().duration>0){
      run.time=(walk.time%walk.getClip().duration)/walk.getClip().duration*run.getClip().duration;
    }
    if(walk)walk.setEffectiveTimeScale(clamp(speed/4.3,.75,1.8));
    if(run)run.setEffectiveTimeScale(clamp(speed/7.3,.75,1.7));
    mixer.update(dt);
    lastPose=overlayName||'idle';
  }
  // Switch atomically: a failed load never removes the working placeholder.
  for(const child of actor.model.children)child.visible=false;
  actor.model.add(pivot);
  actor.rigged=true;
  actor.updateRig=update;
  return pivot;
}
function clamp01(x){return Math.min(1,Math.max(0,x));}
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
/** Load once and reuse the rig, geometry and textures for the player's allies/enemies. */
export async function installRealisticSamurai(actors){
  const asset=await getAsset();
  let installed=0;
  for(const item of actors){
    try{makeRig(asset,item.actor,{role:item.role});installed++;}
    catch(error){console.warn('Visual detalhado indisponível para '+item.role,error);}
  }
  return installed;
}
