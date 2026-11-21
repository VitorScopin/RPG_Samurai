import test from 'node:test';
import assert from 'node:assert/strict';
import { MODEL_FILES, selectEquipment, isAllowedAssetName } from '../src/characterAssetRegistry.js';

test('premium sword is an authored glb with pinned verified source',()=>{
  assert.equal(MODEL_FILES.katana.file,'weapons/sword.glb');
  assert.equal(MODEL_FILES.katana.bytes,4745912);
  assert.equal(MODEL_FILES.scabbard.file,'attachments/Scabbard.glb');
  assert.equal(MODEL_FILES.scabbard.bytes,4741640);
  assert(MODEL_FILES.katana.source.includes('/496862cda55bfba3be6d02eec5aee3ca808a31a3/'));
});
test('equipment changes are role aware and do not alter enemy weapon ownership',()=>{
  assert.equal(selectEquipment('hero').weapon,'katana');
  assert.equal(selectEquipment('mentor').weapon,null);
  assert.equal(selectEquipment('shinobi').weapon,null);
  assert.equal(selectEquipment('ashigaru').weapon,null);
  assert.equal(selectEquipment('cursed').weapon,null);
});
test('rejects arbitrary file paths from asset selection',()=>{
  assert.equal(isAllowedAssetName('weapons/sword.glb'),true);
  assert.equal(isAllowedAssetName('weapons/../../thing.glb'),false);
  assert.equal(isAllowedAssetName('http://thirdparty.com/a.glb'),false);
});
