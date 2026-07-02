import type { GameState } from './types'

export function spawnBurst(
  state: GameState,
  x: number,
  y: number,
  color: string,
  count = 14,
  spread = 1,
) {
  for (let i = 0; i < count; i++) {
    state.nextId += 1
    const angle = Math.random() * Math.PI * 2
    const speed = (20 + Math.random() * 90) * spread
    state.particles.push({
      id: state.nextId,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40,
      life: 0,
      maxLife: 0.4 + Math.random() * 0.5,
      color,
      size: 2 + Math.random() * 4,
    })
  }
}
