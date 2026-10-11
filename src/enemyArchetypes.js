import * as THREE from 'three';

/**
 * Three distinctive field enemy archetypes. They share the same licensed,
 * skinned FBX base (and author-provided motion clips), with separate rig-bound
 * headgear, armor, weapons, silhouettes and combat behavior.
 *
 * Neither enemy nor boss meshes are copied from the player-customization UI.
 */
export const ENEMY_ARCHETYPES=Object.freeze({
  shinobi:{
    id:'shinobi',name:'Shinobi das Sombras',title:'ASSASSINO SHINOBI',
    type:'assassin',color:0x486f80,health:58,speed:4.7,vision:20,
    preferred:1.65,range:2.15,damage:13,windup:.29,recovery:.42,cooldown:1.14,
    radius:.32,animation:'attack',coins:26,xp:52
  },
  ashigaru:{
    id:'ashigaru',name:'Lanceiro Ashigaru',title:'LANCEIRO ASHIGARU',
    type:'lancer',color:0xa89a6c,health:93,speed:2.05,vision:16,
    preferred:3.05,range:3.85,damage:22,windup:.60,recovery:.66,cooldown:1.98,
    radius:.46,animation:'heavy',coins:34,xp:64
  },
  cursed:{
    id:'cursed',name:'Ronin Corrompido',title:'RONIN CORROMPIDO',
    type:'brute',color:0xb24d4b,health:145,speed:1.75,vision:15,
    preferred:2.35,range:3.15,damage:34,windup:.78,recovery:.84,cooldown:2.65,
    radius:.64,animation:'heavy',coins:52,xp:90,armor:.23
  }
});
export const ENEMY_ORDER=['shinobi','ashigaru','cursed'];
export const archetypeFor=(id)=>ENEMY_ARCHETYPES[id]||ENEMY_ARCHETYPES.shinobi;

const mat=(color,metal=.24,rough=.68,emissive=0x000000)=>new THREE.MeshStandardMaterial({
  color,roughness:rough,metalness:metal,emissive,emissiveIntensity:emissive?1.3:0,
  side:THREE.DoubleSide
});
const piece=(group,geometry,material,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>{
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.set(x,y,z);
  mesh.rotation.set(rx,ry,rz);
  mesh.castShadow=true; mesh.receiveShadow=true;
  group.add(mesh);return mesh;
};
const box=(x,y,z)=>new THREE.BoxGeometry(x,y,z);
const cyl=(radius1,radius2,length,sides=12)=>new THREE.CylinderGeometry(radius1,radius2,length,sides);
const con=(radius,height,sides=11)=>new THREE.ConeGeometry(radius,height,sides);
function attachToBone(bone,object){
  if(!bone)return false;
  // The source FBX rig is in centimetres. Invert the parent world scale so
  // attached equipment has real-world dimensions in metres and follows poses.
  bone.updateWorldMatrix(true,false);
  const scale=bone.getWorldScale(new THREE.Vector3());
  object.scale.set(1/Math.max(.0001,Math.abs(scale.x)),1/Math.max(.0001,Math.abs(scale.y)),1/Math.max(.0001,Math.abs(scale.z)));
  bone.add(object);
  return true;
}
function katanaLength(length,metal,handle,guard){
  const g=new THREE.Group();
  piece(g,cyl(.035,.042,.27,9),handle,0,-.18,0);
  piece(g,cyl(.082,.082,.024,10),guard,0,-.02,0);
  // Narrow curved sword: distinct silhouettes depend on length and blade shape.
  const shape=new THREE.Shape();
  shape.moveTo(-.034,0);shape.lineTo(-.025,length*.67);
  shape.quadraticCurveTo(-.01,length*.94,.055,length);
  shape.quadraticCurveTo(.070,length*.84,.045,length*.67);
  shape.lineTo(.043,0);shape.closePath();
  piece(g,new THREE.ExtrudeGeometry(shape,{depth:.015,bevelEnabled:true,bevelSegments:1,bevelSize:.002,bevelThickness:.002,steps:1,curveSegments:8}),metal,0,0,-.015);
  return g;
}
function shinobiEquipment(bones,fbx){
  const charcoal=mat('#131e26',.18),blue=mat('#2b6575',.36),silver=mat('#afb8b7',.88,.25),obsidian=mat('#161b20',.5),crimson=mat('#912e3c');
  // Close-fitting cloth hood and masked face remain attached to head joint.
  const hood=new THREE.Group();hood.position.set(0,.11,0);
  piece(hood,new THREE.SphereGeometry(.31,16,12,0,Math.PI*2,0,Math.PI*.68),charcoal,0,.10,0);
  piece(hood,box(.51,.22,.16),obsidian,0,-.075,-.255);
  piece(hood,box(.46,.045,.20),blue,0,.014,-.26);
  for(const x of [-.145,.145]){
    piece(hood,box(.09,.035,.013),silver,x,-.035,-.344);
  }
  piece(hood,box(.09,.34,.065),crimson,.22,-.17,.22,0,0,-.30);
  attachToBone(bones.get('head'),hood);
  for(const side of [-1,1]){
    const shoulder=new THREE.Group();shoulder.position.y=-.09;
    piece(shoulder,box(.22,.34,.32),charcoal,side*.035,-.12,0,0,0,side*.08);
    piece(shoulder,box(.16,.04,.35),blue,side*.04,.08,0);
    attachToBone(bones.get(side<0?'leftarm':'rightarm'),shoulder);
  }
  // Both blades are joint-bound and move naturally with Mixamo upper-body poses.
  fbx.getObjectByName('Katana')?.traverse(o=>{o.visible=false;});
  const left=new THREE.Group();left.position.set(0,-.12,0);left.rotation.set(0,.15,-.28);
  left.add(katanaLength(.64,silver,obsidian,blue));
  attachToBone(bones.get('lefthand'),left);
  const right=new THREE.Group();right.position.set(0,-.12,0);right.rotation.set(0,-.2,.18);
  right.add(katanaLength(.77,silver,obsidian,blue));
  attachToBone(bones.get('righthand'),right);
  // A short cape trailing from upper spine, rather than a static floating skirt.
  const scarf=new THREE.Group();scarf.position.set(0,.18,.10);
  piece(scarf,box(.55,.32,.08),charcoal,0,-.11,.29,-.19);
  piece(scarf,box(.12,.59,.08),blue,.19,-.44,.39,-.12);
  attachToBone(bones.get('spine2')||bones.get('spine1'),scarf);
}
function ashigaruEquipment(bones,fbx){
  const ochre=mat('#887545',.26),green=mat('#3f5142'),iron=mat('#596369',.73,.36),straw=mat('#b09a66'),wood=mat('#503527'),steel=mat('#d8ddd4',.86,.18);
  const head=new THREE.Group();head.position.set(0,.21,0);
  // Broad jingasa: tapered straw helmet with metal rim and visible crest.
  piece(head,cyl(.52,.55,.038,24),iron,0,.05,0);
  piece(head,con(.59,.32,24),straw,0,.22,0);
  piece(head,cyl(.11,.12,.035),ochre,0,.408,0);
  piece(head,box(.10,.18,.03),iron,0,.22,-.55,0,0,.13);
  attachToBone(bones.get('head'),head);
  for(const side of [-1,1]){
    const arm=new THREE.Group();arm.position.y=-.14;
    piece(arm,box(.35,.20,.48),green,0,-.12,0,0,0,side*.08);
    piece(arm,box(.35,.06,.48),ochre,0,.005,0,0,0,side*.08);
    attachToBone(bones.get(side<0?'leftarm':'rightarm'),arm);
  }
  const torso=new THREE.Group();
  for(let i=0;i<4;i++)piece(torso,box(.68,.18,.38),i%2?iron:ochre,0,.26-i*.14,-.04);
  torso.position.set(0,.08,-.02);
  attachToBone(bones.get('spine1')||bones.get('spine'),torso);
  fbx.getObjectByName('Katana')?.traverse(o=>{o.visible=false;});
  const yari=new THREE.Group();yari.position.set(0,-.20,0);yari.rotation.set(.03,.07,-.16);
  piece(yari,cyl(.027,.029,2.62,9),wood,0,.88,0);
  piece(yari,cyl(.053,.053,.105),iron,0,2.20,0);
  const blade=piece(yari,con(.105,.52,6),steel,0,2.53,0);
  blade.scale.z=.39;
  for(let j=0;j<3;j++)piece(yari,cyl(.032,.032,.019,8),ochre,0,-.29+j*.11,0);
  attachToBone(bones.get('righthand'),yari);
}
function cursedEquipment(bones,fbx){
  const dark=mat('#211c22',.45),blood=mat('#862c39',.43),oldGold=mat('#927556',.68,.39),bone=mat('#c5b396',.16),
        glow=mat('#f24f36',.12,.5,0xe83224),blade=mat('#d8a69c',.92,.19);
  const kabuto=new THREE.Group();kabuto.position.set(0,.19,0);
  piece(kabuto,new THREE.SphereGeometry(.35,16,12,0,Math.PI*2,0,Math.PI*.63),dark,0,.04,0);
  piece(kabuto,cyl(.385,.375,.09,14),blood,0,-.06,0);
  piece(kabuto,box(.45,.27,.13),blood,0,-.12,-.305);
  for(const side of [-1,1]){
    const horn=piece(kabuto,con(.13,.62,10),bone,side*.32,.28,0,0,0,side*-.39);
    horn.castShadow=true;
    piece(kabuto,new THREE.SphereGeometry(.075,8,6),glow,side*.16,-.065,-.365);
  }
  piece(kabuto,box(.19,.42,.10),oldGold,0,.10,-.32,0,0,.04);
  attachToBone(bones.get('head'),kabuto);
  for(const side of [-1,1]){
    const arm=new THREE.Group();arm.position.y=-.09;
    piece(arm,box(.58,.24,.58),dark,0,-.04,0,0,0,side*.09);
    piece(arm,box(.52,.10,.57),blood,0,.055,0,0,0,side*.09);
    for(let i=0;i<3;i++)piece(arm,box(.48,.065,.55),oldGold,0,-.14-i*.105,.01);
    attachToBone(bones.get(side<0?'leftarm':'rightarm'),arm);
  }
  const torso=new THREE.Group();torso.position.set(0,.10,0);
  for(let i=0;i<4;i++){
    piece(torso,box(.91,.17,.63),i%2?dark:blood,0,.29-i*.20,-.005);
    piece(torso,box(.92,.04,.66),oldGold,0,.37-i*.20,-.005);
  }
  attachToBone(bones.get('spine1')||bones.get('spine'),torso);
  fbx.getObjectByName('Katana')?.traverse(o=>{o.visible=false;});
  const odachi=new THREE.Group();odachi.position.set(0,-.17,0);odachi.rotation.set(-.18,.1,-.08);
  odachi.add(katanaLength(1.57,blade,dark,oldGold));
  attachToBone(bones.get('righthand'),odachi);
}
const DECORATORS={shinobi:shinobiEquipment,ashigaru:ashigaruEquipment,cursed:cursedEquipment};
export function decorateEnemyRig(fbx,bones,kind){
  const type=DECORATORS[kind];if(!type)return;
  type(bones,fbx);
  fbx.userData.enemyKind=kind;
}
