/**
 * Shared, deterministic scenery placement. Pure functions keep props out of
 * the main traversal path, village and pond while allowing varied landscapes.
 */
export function seededRandom(seed=49127) {
  let state=seed>>>0;
  return () => {
    state=(Math.imul(1664525,state)+1013904223)>>>0;
    return state/4294967296;
  };
}
export function sampleTrailDistance(x,z,trail) {
  if(!Array.isArray(trail)||trail.length===0)return Infinity;
  if(trail.length===1)return Math.hypot(x-trail[0][0],z-trail[0][1]);
  let min=Infinity;
  for(let i=1;i<trail.length;i++){
    const [ax,az]=trail[i-1], [bx,bz]=trail[i];
    const dx=bx-ax,dz=bz-az;
    const t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1)));
    min=Math.min(min,Math.hypot(x-ax-t*dx,z-az-t*dz));
  }
  return min;
}
export function scatterPositions({seed=49127,count=500,boundary=65,clearance=3.5,trail=[],exclusions=[]}={}) {
  const random=seededRandom(seed),positions=[];
  const maxAttempts=Math.max(count*12,100);
  for(let attempt=0;attempt<maxAttempts&&positions.length<count;attempt++){
    const x=(random()*2-1)*boundary;
    const z=(random()*2-1)*boundary;
    if(sampleTrailDistance(x,z,trail)<clearance)continue;
    if(exclusions.some(e=>Math.hypot(e.x-x,e.z-z)<e.r))continue;
    positions.push({x,z,scale:.68+random()*.92,angle:random()*Math.PI*2,variant:random()});
  }
  return positions;
}
