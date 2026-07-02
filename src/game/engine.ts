import {
  BASE_SPEED,
  COLLIDE_Z,
  DESPAWN_Z,
  GRAVITY,
  JUMP_VELOCITY,
  LANE_CHANGE_SPEED,
  LANE_COUNT,
  MAX_SPAWN_GAP,
  MAX_SPEED_ADD,
  MIN_SPAWN_GAP,
  SCORE_PER_METER,
  SLIDE_DURATION,
  SPAWN_Z,
  SPEED_ACCEL_PER_SEC,
} from './constants'
import type { Action, GameState, ObstacleType } from './types'

function nextId(state: GameState): number {
  state.nextId += 1
  return state.nextId
}

export function createGameState(highScore: number, muted: boolean): GameState {
  return {
    phase: 'intro',
    distance: 0,
    speed: BASE_SPEED,
    elapsed: 0,
    score: 0,
    highScore,
    fliesCollected: 0,
    player: {
      lane: 1,
      targetLane: 1,
      x: 1,
      jumpHeight: 0,
      jumpVelocity: 0,
      isJumping: false,
      isSliding: false,
      slideTimer: 0,
      anim: 'run',
      hitTimer: 0,
      leanTilt: 0,
    },
    obstacles: [],
    collectibles: [],
    particles: [],
    distanceSinceSpawn: 0,
    nextSpawnGap: MIN_SPAWN_GAP,
    nextId: 0,
    flushT: 0,
    shake: 0,
    muted,
  }
}

export function resetRun(state: GameState) {
  state.distance = 0
  state.speed = BASE_SPEED
  state.elapsed = 0
  state.score = 0
  state.fliesCollected = 0
  state.obstacles = []
  state.collectibles = []
  state.particles = []
  state.distanceSinceSpawn = 0
  state.nextSpawnGap = MIN_SPAWN_GAP
  state.shake = 0
  state.player.lane = 1
  state.player.targetLane = 1
  state.player.x = 1
  state.player.jumpHeight = 0
  state.player.jumpVelocity = 0
  state.player.isJumping = false
  state.player.isSliding = false
  state.player.slideTimer = 0
  state.player.anim = 'run'
  state.player.hitTimer = 0
  state.player.leanTilt = 0
}

// ---- Obstacle patterns: each covers all 3 lanes, always leaves a way through ----
type PatternObstacle = { lane: number; type: ObstacleType }

const PATTERNS: PatternObstacle[][] = [
  [{ lane: 0, type: 'rat' }, { lane: 2, type: 'tallBlock' }],
  [{ lane: 2, type: 'rat' }, { lane: 0, type: 'tallBlock' }],
  [{ lane: 1, type: 'tallBlock' }],
  [{ lane: 0, type: 'tallBlock' }],
  [{ lane: 2, type: 'tallBlock' }],
  [{ lane: 0, type: 'overheadPipe' }, { lane: 1, type: 'overheadPipe' }, { lane: 2, type: 'overheadPipe' }],
  [{ lane: 0, type: 'lowPipe' }, { lane: 1, type: 'lowPipe' }, { lane: 2, type: 'lowPipe' }],
  [{ lane: 0, type: 'rat' }, { lane: 1, type: 'tallBlock' }],
  [{ lane: 2, type: 'rat' }, { lane: 1, type: 'tallBlock' }],
  [{ lane: 1, type: 'rat' }],
  [{ lane: 1, type: 'overheadPipe' }],
  [{ lane: 0, type: 'lowPipe' }, { lane: 2, type: 'tallBlock' }],
]

function spawnPattern(state: GameState) {
  const pattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)]
  for (const p of pattern) {
    state.obstacles.push({ id: nextId(state), lane: p.lane, z: SPAWN_Z, type: p.type, hit: false, resolved: false })
  }

  // Collectible arc: guide through a lane that's safe for this pattern
  const blockedLanes = new Set(pattern.map(p => p.lane))
  let safeLane = 1
  for (let l = 0; l < LANE_COUNT; l++) {
    if (!blockedLanes.has(l)) {
      safeLane = l
      break
    }
  }
  if (Math.random() < 0.7) {
    const count = 4 + Math.floor(Math.random() * 3)
    for (let i = 0; i < count; i++) {
      state.collectibles.push({
        id: nextId(state),
        lane: safeLane,
        z: SPAWN_Z + 6 + i * 2.6,
        yWave: Math.random() * Math.PI * 2,
        collected: false,
      })
    }
  }
}

export interface FrameEvents {
  collected: number
  crashed: boolean
}

export function applyAction(state: GameState, action: Action) {
  const p = state.player
  if (state.phase !== 'playing') return
  if (action === 'left') {
    p.targetLane = Math.max(0, p.targetLane - 1)
  } else if (action === 'right') {
    p.targetLane = Math.min(LANE_COUNT - 1, p.targetLane + 1)
  } else if (action === 'jump') {
    if (!p.isJumping && !p.isSliding) {
      p.isJumping = true
      p.jumpVelocity = JUMP_VELOCITY
    }
  } else if (action === 'slide') {
    if (!p.isJumping) {
      p.isSliding = true
      p.slideTimer = SLIDE_DURATION
    }
  }
}

export function stepGame(state: GameState, dt: number): FrameEvents {
  const events: FrameEvents = { collected: 0, crashed: false }
  if (state.phase !== 'playing') return events

  state.elapsed += dt
  state.speed = BASE_SPEED + Math.min(state.elapsed * SPEED_ACCEL_PER_SEC, MAX_SPEED_ADD)
  const advance = state.speed * dt
  state.distance += advance
  state.score = Math.floor(state.distance * SCORE_PER_METER) + state.fliesCollected * 25

  const p = state.player

  // Lane interpolation
  p.lane = p.targetLane
  const diff = p.targetLane - p.x
  p.x += diff * Math.min(1, LANE_CHANGE_SPEED * dt)
  p.leanTilt = diff * 0.5

  // Jump physics
  if (p.isJumping) {
    p.jumpHeight += p.jumpVelocity * dt
    p.jumpVelocity -= GRAVITY * dt
    if (p.jumpHeight <= 0) {
      p.jumpHeight = 0
      p.isJumping = false
      p.jumpVelocity = 0
    }
  }

  // Slide timer
  if (p.isSliding) {
    p.slideTimer -= dt
    if (p.slideTimer <= 0) {
      p.isSliding = false
      p.slideTimer = 0
    }
  }

  if (p.hitTimer > 0) p.hitTimer -= dt

  p.anim = p.isSliding ? 'slide' : p.isJumping ? 'jump' : 'run'

  // Move obstacles & collectibles toward player
  for (const o of state.obstacles) o.z -= advance
  for (const c of state.collectibles) c.z -= advance

  // Spawn logic
  state.distanceSinceSpawn += advance
  if (state.distanceSinceSpawn >= state.nextSpawnGap) {
    state.distanceSinceSpawn = 0
    state.nextSpawnGap = MIN_SPAWN_GAP + Math.random() * (MAX_SPAWN_GAP - MIN_SPAWN_GAP)
    spawnPattern(state)
  }

  // Collision detection
  for (const o of state.obstacles) {
    if (o.resolved) continue
    if (o.z <= COLLIDE_Z) {
      o.resolved = true
      if (Math.abs(o.lane - p.x) < 0.55) {
        const avoided = isAvoided(o.type, p.isJumping, p.isSliding, p.jumpHeight)
        if (!avoided) {
          o.hit = true
          events.crashed = true
          state.phase = 'gameover'
          p.hitTimer = 0.6
          p.anim = 'hit'
          state.shake = 1
          if (state.score > state.highScore) state.highScore = state.score
        }
      }
    }
  }

  // Collectible pickup
  for (const c of state.collectibles) {
    if (c.collected) continue
    if (c.z <= COLLIDE_Z && c.z > COLLIDE_Z - 2.2 && Math.abs(c.lane - p.x) < 0.55) {
      c.collected = true
      state.fliesCollected += 1
      events.collected += 1
    }
  }

  // Cull passed entities
  state.obstacles = state.obstacles.filter(o => o.z > DESPAWN_Z && !o.hit)
  state.collectibles = state.collectibles.filter(c => c.z > DESPAWN_Z && !c.collected)

  // Particles
  for (const particle of state.particles) {
    particle.life += dt
    particle.x += particle.vx * dt
    particle.y += particle.vy * dt
    particle.vy += 160 * dt
  }
  state.particles = state.particles.filter(pt => pt.life < pt.maxLife)

  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 2.2)

  return events
}

function isAvoided(type: ObstacleType, isJumping: boolean, isSliding: boolean, jumpHeight: number): boolean {
  switch (type) {
    case 'rat':
    case 'lowPipe':
      return isJumping && jumpHeight > 0.35
    case 'overheadPipe':
      return isSliding
    case 'tallBlock':
      return false
    default:
      return false
  }
}
