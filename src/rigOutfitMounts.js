/** Rig-aware placement groups for the existing authored Mixamo-compatible body. */
export function selectOutfitBone(x,y){
  if(y>=2.08)return 'head';
  if(y>1.65&&Math.abs(x)>=.35)return x<0?'leftarm':'rightarm';
  if(y<1.27)return 'hips';
  return 'spine1';
}
const norm=name=>String(name||'').toLowerCase().replace(/^mixamorig:?/,'').replace(/[^a-z0-9]/g,'');
export function mountRiggedOutfit(outfit,rig){
  const bones=new Map();
  rig.traverse(node=>{if(node.isBone)bones.set(norm(node.name),node);});
  const meshes=outfit.children.slice();
  const parts=[];
  outfit.updateWorldMatrix(true,true);
  for(const item of meshes){
    const key=selectOutfitBone(item.position.x,item.position.y);
    const bone=bones.get(key)||bones.get('hips')||null;
    if(!bone)continue;
    bone.updateWorldMatrix(true,false);
    bone.attach(item); // Keeps world-space alignment, then follows bone motion.
    parts.push(item);
  }
  return parts;
}
export function disposeRiggedOutfit(parts){
  for(const mesh of parts||[]){
    mesh.removeFromParent();
    mesh.traverse(node=>{
      if(!node.isMesh)return;
      node.geometry?.dispose();
      const materials=Array.isArray(node.material)?node.material:[node.material];
      for(const material of materials)material?.dispose();
    });
  }
}
