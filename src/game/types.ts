export type GamePhase = 'intro' | 'flushing' | 'playing' | 'gameover'

export type ObstacleType = 'rat' | 'lowPipe' | 'overheadPipe' | 'tallBlock'

export type Action = 'left' | 'right' | 'jump' | 'slide'

export interface Obstacle {
  id: number
  lane: number
  z: number
  type: ObstacleType
  hit: boolean
  resolved: boolean
}

export interface Collectible {
  id: number
  lane: number
  z: number
  yWave: number
  collected: boolean
}

export interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export type PlayerAnim = 'run' | 'jump' | 'slide' | 'hit'

export interface PlayerState {
  lane: number
  targetLane: number
  x: number // current screen-space lane interpolation (0..2, fractional)
  jumpHeight: number // 0 = ground
  jumpVelocity: number
  isJumping: boolean
  isSliding: boolean
  slideTimer: number
  anim: PlayerAnim
  hitTimer: number
  leanTilt: number
}

export interface GameState {
  phase: GamePhase
  distance: number
  speed: number
  elapsed: number
  score: number
  highScore: number
  fliesCollected: number
  player: PlayerState
  obstacles: Obstacle[]
  collectibles: Collectible[]
  particles: Particle[]
  distanceSinceSpawn: number
  nextSpawnGap: number
  nextId: number
  flushT: number
  shake: number
  muted: boolean
}
