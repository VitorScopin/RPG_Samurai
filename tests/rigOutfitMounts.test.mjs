import test from 'node:test';
import assert from 'node:assert/strict';
import { selectOutfitBone } from '../src/rigOutfitMounts.js';

test('headwear follows head bone',()=>{
  assert.equal(selectOutfitBone(0,2.68),'head');
  assert.equal(selectOutfitBone(.24,2.19),'head');
});
test('shoulder pieces follow animated upper arms',()=>{
  assert.equal(selectOutfitBone(-.43,1.92),'leftarm');
  assert.equal(selectOutfitBone(.43,1.92),'rightarm');
});
test('waist guards follow hips and torso decor follows spine',()=>{
  assert.equal(selectOutfitBone(.30,.96),'hips');
  assert.equal(selectOutfitBone(0,1.35),'spine1');
});
