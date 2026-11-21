/** Source-verified, game-ready assets from the existing character's MIT demo.
 * The derived artwork remains subject to original model attribution (CC BY 4.0).
 */
const REVISION='496862cda55bfba3be6d02eec5aee3ca808a31a3';
const BASE='https://raw.githubusercontent.com/achrefelouafi/SamuraiThirdPersonTemplateThreeJS/'+REVISION+'/public/models/';
export const MODEL_FILES=Object.freeze({
  katana:Object.freeze({
    id:'katana',
    file:'weapons/sword.glb',
    bytes:4745912,
    source:BASE+'weapons/sword.glb',
    credit:'SamuraiThirdPersonTemplateThreeJS weapon export; inherited source artwork credit in ASSET_CREDITS.md'
  })
});
export function isAllowedAssetName(file){
  return Object.values(MODEL_FILES).some(entry=>entry.file===file);
}
export function selectEquipment(role='hero'){
  return {weapon:role==='hero'?'katana':null};
}
