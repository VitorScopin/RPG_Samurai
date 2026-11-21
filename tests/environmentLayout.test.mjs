import test from 'node:test';
import assert from 'node:assert/strict';
import { scatterPositions, sampleTrailDistance, seededRandom } from '../src/environmentLayout.js';

test('scatter is deterministic for a given seed', () => {
  const a=scatterPositions({seed:19,count:100,boundary:60,clearance:3});
  const b=scatterPositions({seed:19,count:100,boundary:60,clearance:3});
  assert.deepEqual(a,b);
  assert.equal(a.length,100);
});
test('scatter avoids playable trail and village exclusion circles', () => {
  const trail=[[0,17],[0,7],[0,-6],[3,-14],[7,-23],[9,-37],[11,-49]];
  const points=scatterPositions({seed:11,count:350,boundary:58,clearance:4,trail,exclusions:[{x:2,z:8,r:5},{x:-25,z:-21,r:10}]});
  assert(points.length>220);
  assert(points.every(p=>sampleTrailDistance(p.x,p.z,trail)>=4));
  assert(points.every(p=>Math.hypot(p.x-2,p.z-8)>5));
  assert(points.every(p=>Math.hypot(p.x+25,p.z+21)>10));
});
test('trail distance uses segment projections, not only vertices', () => {
  assert.equal(sampleTrailDistance(2,5,[[0,0],[0,10]]),2);
  assert.equal(sampleTrailDistance(0,13,[[0,0],[0,10]]),3);
});
test('seeded generator values remain within 0 and 1',()=>{
  const rng=seededRandom(49127);
  const sequence=Array.from({length:1000},()=>rng());
  assert(sequence.every(n=>n>=0&&n<1));
  assert(new Set(sequence).size>900);
});
