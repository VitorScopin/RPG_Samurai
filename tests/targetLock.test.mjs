import test from 'node:test';
import assert from 'node:assert/strict';
import { selectLockTarget, targetHeading } from '../src/targetLock.js';

const enemy = (x,z,dead=false,visible=true) => ({dead,actor:{model:{visible,position:{x,z}}}});

test('selects nearest living visible target within range',()=>{
  const far = enemy(0,-12), near = enemy(0,-3);
  assert.equal(selectLockTarget([far,enemy(0,-1,true),near],{x:0,z:0}),near);
});
test('ignores dead, invisible and distant targets',()=>{
  assert.equal(selectLockTarget([enemy(2,0,true),enemy(1,0,false,false),enemy(19,0)],{x:0,z:0}),null);
});
test('attack heading points toward a locked target',()=>{
  assert(Math.abs(targetHeading({x:0,z:0},{x:0,z:-2}))<1e-10);
  assert.equal(targetHeading({x:0,z:0},{x:2,z:0}),-Math.PI/2);
});
