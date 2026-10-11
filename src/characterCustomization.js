import * as THREE from 'three';

/**
 * Player appearance is independent of quest progress and never modifies the
 * source rig or shared materials used by enemies and the mentor.
 */
export const CHARACTER_KEY = 'kage-no-michi-character-v1';
export const PRESETS = Object.freeze([
  {id:'ronin',name:'Ronin Errante',subtitle:'O caminho da liberdade',armor:'#303a43',accent:'#a84f48',headwear:'band',build:1,mark:'浪'},
  {id:'kensei',name:'Kensei',subtitle:'Mestre da lâmina',armor:'#283d48',accent:'#d2b37c',headwear:'none',build:1,mark:'剣'},
  {id:'shadow',name:'Sombra',subtitle:'Assassino silencioso',armor:'#1c262d',accent:'#6b8996',headwear:'mask',build:.94,mark:'影'},
  {id:'crimson',name:'Guarda Escarlate',subtitle:'Honra e disciplina',armor:'#722d35',accent:'#e0b376',headwear:'hat',build:1.07,mark:'武'},
  {id:'forest',name:'Guardião Hayashi',subtitle:'Protetor da floresta',armor:'#354c3d',accent:'#b5c296',headwear:'band',build:1.03,mark:'森'},
  {id:'moon',name:'Lua Prateada',subtitle:'O duelo ao luar',armor:'#5b6974',accent:'#dfd2bb',headwear:'none',build:.96,mark:'月'}
]);
const HEADWEAR = new Set(['none','band','hat','mask']);
const ARMOR_COLORS = ['#303a43','#283d48','#1c262d','#722d35','#354c3d','#5b6974','#725345','#47444f'];
const ACCENT_COLORS = ['#a84f48','#d2b37c','#6b8996','#e0b376','#b5c296','#dfd2bb','#b07d99','#5f9a9f'];
export const COLOR_OPTIONS = {armor:ARMOR_COLORS,accent:ACCENT_COLORS};
export const DEFAULT_CHARACTER = Object.freeze({...PRESETS[0],name:'Akira',preset:'ronin'});

function sanitizeHex(v,options,fallback){return options.includes(v)?v:fallback;}
export function normalizeCharacter(value={}){
  const preset=PRESETS.find(p=>p.id===value.preset)||PRESETS[0];
  const rawName=typeof value.name==='string'?value.name.trim().replace(/[<>]/g,'').slice(0,18):'';
  return {
    preset:preset.id,
    name:rawName||'Akira',
    armor:sanitizeHex(value.armor,ARMOR_COLORS,preset.armor),
    accent:sanitizeHex(value.accent,ACCENT_COLORS,preset.accent),
    headwear:HEADWEAR.has(value.headwear)?value.headwear:preset.headwear,
    build:Number.isFinite(Number(value.build))?THREE.MathUtils.clamp(Number(value.build),.88,1.12):preset.build
  };
}
export function loadCharacter(){
  try{
    const serialized=localStorage.getItem(CHARACTER_KEY);
    return serialized?normalizeCharacter(JSON.parse(serialized)):null;
  }catch{return null;}
}
export function saveCharacter(character){
  const valid=normalizeCharacter(character);
  try{localStorage.setItem(CHARACTER_KEY,JSON.stringify(valid));}catch{}
  return valid;
}

const box=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
const cylinder=(top,bottom,height,edges=12)=>new THREE.CylinderGeometry(top,bottom,height,edges);
const material=(color,metalness=.08)=>new THREE.MeshStandardMaterial({color,roughness:.79,metalness,side:THREE.DoubleSide});
function place(parent,geometry,mat,x,y,z,rx=0,ry=0,rz=0){
  const item=new THREE.Mesh(geometry,mat);
  item.position.set(x,y,z);item.rotation.set(rx,ry,rz);
  item.castShadow=true;item.receiveShadow=true;parent.add(item);
  return item;
}
function createOrnaments(profile){
  const group=new THREE.Group();group.name='CharacterOutfit';
  const primary=material(profile.armor,.16);
  const accent=material(profile.accent,.22);
  const edge=material('#161b1d',.18);
  const brass=material('#cbb28b',.58);
  const cloth=material(profile.accent);
  // Floating world-space armor accessories: the existing detailed skinned
  // character remains intact and fully animates underneath these pieces.
  place(group,box(.72,.15,.54),edge,0,1.28,-.02);
  place(group,box(.68,.115,.565),accent,0,1.30,-.025);
  for(const side of [-1,1]){
    const plate=place(group,box(.30,.12,.53),primary,side*.43,1.92,-.02,0,0,side*.18);
    place(group,box(.31,.036,.55),brass,side*.43,1.98,-.02,0,0,side*.18);
    for(let i=0;i<3;i++){
      const skirt=place(group,box(.26,.44,.11),i===0?accent:primary,side*(.16+i*.14),.96,-.26);
      skirt.rotation.z=side*(.07+i*.10);
    }
  }
  // Waist tassels visibly distinguish silhouette without changing the rig.
  place(group,box(.115,.53,.07),cloth,-.28,1.00,-.30,0,0,-.12);
  place(group,box(.115,.36,.07),cloth,.27,1.08,-.30,0,0,.15);
  const crest=place(group,new THREE.CylinderGeometry(.09,.09,.035,14),brass,0,1.35,-.33,Math.PI/2);
  place(group,new THREE.CylinderGeometry(.047,.047,.038,14),edge,0,1.35,-.354,Math.PI/2);
  // Hat/hachimaki/mask sit at actual head height of normalised character.
  if(profile.headwear==='band'){
    place(group,cylinder(.276,.278,.085,16),accent,0,2.31,-.015);
    place(group,box(.095,.26,.035),cloth,.24,2.18,.16,0,0,-.24);
  } else if(profile.headwear==='hat'){
    place(group,cylinder(.49,.49,.037,20),edge,0,2.47,0);
    const kasa=place(group,new THREE.ConeGeometry(.73,.40,26),primary,0,2.66,0);
    kasa.castShadow=true;
    place(group,cylinder(.10,.10,.07,12),accent,0,2.84,0);
  }else if(profile.headwear==='mask'){
    place(group,box(.43,.23,.12),edge,0,2.17,-.24);
    place(group,box(.44,.047,.13),accent,0,2.29,-.24);
  }
  return group;
}
function cleanOutfit(actor){
  if(actor.customOutfit){
    actor.model.remove(actor.customOutfit);
    actor.customOutfit.traverse(o=>{
      if(o.isMesh){o.geometry.dispose();o.material?.dispose();}
    });
    actor.customOutfit=null;
  }
}
export function applyCharacterAppearance(actor,character){
  const profile=normalizeCharacter(character);
  cleanOutfit(actor);
  // Children of the rig are already independent material clones; do not recolor
  // mentor, bandits or cached FBX assets. Preserve each original color for editing.
  if(actor.rigged){
    const detailed=actor.model.getObjectByName('DetailedSamurai');
    detailed?.traverse(node=>{
      if(!node.isMesh&&!node.isSkinnedMesh)return;
      for(const mat of Array.isArray(node.material)?node.material:[node.material]){
        if(!mat?.color)continue;
        if(!mat.userData.baseColor)mat.userData.baseColor=mat.color.clone();
        const name=(mat.name+' '+node.name).toLowerCase();
        // Keep skin, eyes and steel from acquiring unnatural tints.
        if(/skin|face|body|hand|eye|hair|metal|steel|blade|katana|sword/.test(name)){
          mat.color.copy(mat.userData.baseColor);continue;
        }
        mat.color.copy(mat.userData.baseColor).lerp(new THREE.Color(profile.armor),.53);
      }
    });
    // These are visual proportions only, not reach/hitbox changes.
    if(detailed)detailed.scale.set(profile.build,1,profile.build);
  }
  const outfit=createOrnaments(profile);
  if(!actor.rigged)outfit.scale.setScalar(1.17);
  actor.model.add(outfit);actor.customOutfit=outfit;
  actor.characterAppearance=profile;
}
export function createCharacterPreviewScene(){
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#111a1d');
  scene.fog=new THREE.Fog('#111a1d',10,30);
  scene.add(new THREE.HemisphereLight(0xb6cfda,0x323339,2.7));
  const key=new THREE.DirectionalLight(0xffd7aa,4.1);
  key.position.set(3,7,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);
  key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;
  scene.add(key);
  const rim=new THREE.PointLight(0x5b8eab,50,12,2);rim.position.set(-2,3,-2);scene.add(rim);
  const floor=new THREE.Mesh(new THREE.CylinderGeometry(2.1,2.2,.24,56),material('#303b3b',.32));
  floor.position.y=-.17;floor.receiveShadow=true;scene.add(floor);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.93,.018,5,80),new THREE.MeshBasicMaterial({color:0xbf9871}));
  ring.rotation.x=-Math.PI/2;ring.position.y=-.027;scene.add(ring);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(1.1,40),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.32,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=-.02;scene.add(shadow);
  const camera=new THREE.PerspectiveCamera(38,1,.1,100);
  camera.position.set(0,2.85,7.7);camera.lookAt(0,1.4,0);
  return {scene,camera};
}
