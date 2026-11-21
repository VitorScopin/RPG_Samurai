export function selectLockTarget(enemies, player, maxDistance = 18) {
  let best = null;
  let bestDistanceSquared = maxDistance * maxDistance;
  for (const enemy of enemies) {
    if (enemy.dead || !enemy.actor?.model?.visible) continue;
    const position = enemy.actor.model.position;
    const dx = position.x - player.x;
    const dz = position.z - player.z;
    const distanceSquared = dx * dx + dz * dz;
    if (distanceSquared < bestDistanceSquared) {
      best = enemy;
      bestDistanceSquared = distanceSquared;
    }
  }
  return best;
}

export function targetHeading(player, target) {
  const dx = target.x - player.x;
  const dz = target.z - player.z;
  return Math.atan2(-dx, -dz);
}
