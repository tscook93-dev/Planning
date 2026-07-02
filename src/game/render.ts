import {
  BASELINE_Y_FRAC,
  COLLIDE_Z,
  HORIZON_Y_FRAC,
  MAX_ROAD_WIDTH_FRAC,
  MAX_SPRITE_SCALE,
  MIN_ROAD_WIDTH_FRAC,
  MIN_SPRITE_SCALE,
  PERSPECTIVE_POWER,
  RUN_BOB_FREQ,
  SPAWN_Z,
} from './constants'
import type { GameState, ObstacleType, PlayerAnim } from './types'

// ---------- projection helpers ----------

function depthT(z: number): number {
  const t = 1 - z / SPAWN_Z
  return Math.max(0, Math.min(1.35, t))
}

function ease(t: number): number {
  return Math.pow(Math.max(0, Math.min(1.35, t)), PERSPECTIVE_POWER)
}

function screenY(tProj: number, height: number): number {
  const horizonY = height * HORIZON_Y_FRAC
  const baselineY = height * BASELINE_Y_FRAC
  return horizonY + (baselineY - horizonY) * tProj
}

function roadHalfWidth(tProj: number, width: number): number {
  const minW = width * MIN_ROAD_WIDTH_FRAC
  const maxW = width * MAX_ROAD_WIDTH_FRAC
  return (minW + (maxW - minW) * tProj) / 2
}

function laneX(lane: number, tProj: number, width: number): number {
  const half = roadHalfWidth(tProj, width)
  const centerX = width / 2
  return centerX + (lane - 1) * (half * (2 / 3))
}

function spriteScale(tProj: number): number {
  return MIN_SPRITE_SCALE + (MAX_SPRITE_SCALE - MIN_SPRITE_SCALE) * tProj
}

export function projectPoint(lane: number, z: number, width: number, height: number) {
  const t = ease(depthT(z))
  return {
    x: laneX(lane, t, width),
    y: screenY(t, height),
    scale: spriteScale(t),
  }
}

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string) {
  if (rx <= 0 || ry <= 0) return
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
}

// ---------- background / tunnel ----------

export function drawTunnel(ctx: CanvasRenderingContext2D, width: number, height: number, distance: number) {
  const horizonY = height * HORIZON_Y_FRAC

  const bg = ctx.createLinearGradient(0, 0, 0, height)
  bg.addColorStop(0, '#0a0f0a')
  bg.addColorStop(0.35, '#141c14')
  bg.addColorStop(1, '#26301f')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  // vanishing point glow
  const glow = ctx.createRadialGradient(width / 2, horizonY, 4, width / 2, horizonY, width * 0.5)
  glow.addColorStop(0, 'rgba(140,170,90,0.35)')
  glow.addColorStop(1, 'rgba(140,170,90,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height)

  // side walls (trapezoid) with brick banding
  const wallColorFar = '#232c22'
  const wallColorNear = '#3b3226'
  const t0 = ease(0)
  const t1 = ease(1)
  const halfFar = roadHalfWidth(t0, width)
  const halfNear = roadHalfWidth(t1, width)
  const yFar = screenY(t0, height)
  const yNear = screenY(t1, height)
  const centerX = width / 2

  ctx.fillStyle = wallColorNear
  ctx.beginPath()
  ctx.moveTo(0, yNear)
  ctx.lineTo(centerX - halfFar, yFar)
  ctx.lineTo(0, yFar)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(width, yNear)
  ctx.lineTo(centerX + halfFar, yFar)
  ctx.lineTo(width, yFar)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = wallColorFar
  ctx.beginPath()
  ctx.moveTo(centerX - halfNear, yNear)
  ctx.lineTo(centerX - halfFar, yFar)
  ctx.lineTo(0, yFar)
  ctx.lineTo(0, yNear)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(centerX + halfNear, yNear)
  ctx.lineTo(centerX + halfFar, yFar)
  ctx.lineTo(width, yFar)
  ctx.lineTo(width, yNear)
  ctx.closePath()
  ctx.fill()

  // ceiling
  ctx.fillStyle = '#0d120c'
  ctx.fillRect(0, 0, width, yFar)

  // road / channel
  const road = ctx.createLinearGradient(0, yFar, 0, yNear)
  road.addColorStop(0, '#3a4a2a')
  road.addColorStop(1, '#57462c')
  ctx.fillStyle = road
  ctx.beginPath()
  ctx.moveTo(centerX - halfFar, yFar)
  ctx.lineTo(centerX + halfFar, yFar)
  ctx.lineTo(centerX + halfNear, yNear)
  ctx.lineTo(centerX - halfNear, yNear)
  ctx.closePath()
  ctx.fill()

  // lane divider guides
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'
  ctx.lineWidth = 2
  for (const laneEdge of [0.33, 0.67] as const) {
    ctx.beginPath()
    ctx.moveTo(centerX - halfFar + halfFar * 2 * laneEdge, yFar)
    ctx.lineTo(centerX - halfNear + halfNear * 2 * laneEdge, yNear)
    ctx.stroke()
  }

  // scrolling floor rivets/markers for motion feel
  const ringSpeedFactor = 0.045
  const phase = (distance * ringSpeedFactor) % 1
  ctx.fillStyle = 'rgba(20,25,15,0.55)'
  for (let i = 0; i < 7; i++) {
    const tf = (phase + i / 7) % 1
    const tp = ease(tf)
    const y = screenY(tp, height)
    const half = roadHalfWidth(tp, width)
    const scale = spriteScale(tp)
    ctx.beginPath()
    ctx.ellipse(centerX - half * 0.36, y, 10 * scale, 3 * scale, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(centerX + half * 0.36, y, 10 * scale, 3 * scale, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // hanging pipes on ceiling for ambience
  ctx.fillStyle = '#1c231a'
  for (let i = 0; i < 4; i++) {
    const px = width * (0.15 + i * 0.24)
    ctx.fillRect(px, 0, width * 0.03, yFar * (0.5 + 0.5 * Math.sin(i)))
  }
}

// ---------- obstacles & collectibles ----------

function obstacleColor(type: ObstacleType): string {
  switch (type) {
    case 'rat':
      return '#6b6b6b'
    case 'lowPipe':
      return '#8a6d3b'
    case 'overheadPipe':
      return '#5c7a5c'
    case 'tallBlock':
      return '#4a3f2c'
  }
}

export function drawObstacle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  type: ObstacleType,
) {
  const s = scale * 90
  ctx.save()
  ctx.translate(x, y)
  const color = obstacleColor(type)

  if (type === 'rat') {
    ellipse(ctx, 0, 0, 0.55 * s, 0.32 * s, color)
    ellipse(ctx, 0.42 * s, -0.12 * s, 0.22 * s, 0.16 * s, color)
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(0.55 * s, -0.22 * s)
    ctx.lineTo(0.68 * s, -0.4 * s)
    ctx.lineTo(0.48 * s, -0.28 * s)
    ctx.fill()
    ctx.strokeStyle = '#b5b5b5'
    ctx.lineWidth = Math.max(1, 0.03 * s)
    ctx.beginPath()
    ctx.moveTo(-0.5 * s, 0)
    ctx.quadraticCurveTo(-0.9 * s, 0.1 * s, -1.05 * s, -0.15 * s)
    ctx.stroke()
    ellipse(ctx, 0.52 * s, -0.16 * s, 0.045 * s, 0.045 * s, '#c81c1c')
  } else if (type === 'lowPipe') {
    ctx.fillStyle = color
    roundRect(ctx, -0.75 * s, -0.22 * s, 1.5 * s, 0.4 * s, 0.18 * s)
    ctx.fill()
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    roundRect(ctx, -0.75 * s, -0.22 * s, 1.5 * s, 0.12 * s, 0.06 * s)
    ctx.fill()
    ctx.fillStyle = '#3f3320'
    for (let i = -2; i <= 2; i++) ellipse(ctx, i * 0.28 * s, -0.05 * s, 0.04 * s, 0.04 * s, '#3f3320')
  } else if (type === 'overheadPipe') {
    ctx.fillStyle = color
    roundRect(ctx, -0.85 * s, -1.6 * s, 1.7 * s, 0.42 * s, 0.16 * s)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = Math.max(1, 0.03 * s)
    ctx.beginPath()
    ctx.moveTo(-0.6 * s, -1.15 * s)
    ctx.lineTo(-0.6 * s, -0.05 * s)
    ctx.moveTo(0.6 * s, -1.15 * s)
    ctx.lineTo(0.6 * s, -0.05 * s)
    ctx.stroke()
    ctx.fillStyle = 'rgba(120,170,220,0.55)'
    ellipse(ctx, -0.6 * s, -0.02 * s, 0.05 * s, 0.08 * s, 'rgba(120,170,220,0.55)')
  } else {
    ctx.fillStyle = color
    roundRect(ctx, -0.5 * s, -1.65 * s, 1.0 * s, 1.65 * s, 0.12 * s)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = Math.max(1, 0.03 * s)
    for (let row = 1; row < 4; row++) {
      ctx.beginPath()
      ctx.moveTo(-0.5 * s, -row * 0.4 * s)
      ctx.lineTo(0.5 * s, -row * 0.4 * s)
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(120,170,90,0.5)'
    ellipse(ctx, 0.15 * s, -1.5 * s, 0.12 * s, 0.06 * s, 'rgba(120,170,90,0.5)')
  }
  ctx.restore()
}

export function drawCollectible(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number) {
  const s = scale * 34
  const bob = Math.sin(time * 6 + x) * 0.08 * s
  ctx.save()
  ctx.translate(x, y - 0.35 * s + bob)
  const wingFlap = Math.sin(time * 30) * 0.4
  ctx.fillStyle = 'rgba(230,230,255,0.55)'
  ellipse(ctx, -0.2 * s, -0.05 * s, 0.32 * s, 0.16 * s * (0.6 + Math.abs(wingFlap)), 'rgba(230,230,255,0.55)')
  ellipse(ctx, 0.2 * s, -0.05 * s, 0.32 * s, 0.16 * s * (0.6 + Math.abs(wingFlap)), 'rgba(230,230,255,0.55)')
  ellipse(ctx, 0, 0, 0.26 * s, 0.2 * s, '#1c1c1c')
  ellipse(ctx, 0, -0.18 * s, 0.14 * s, 0.12 * s, '#1c1c1c')
  ellipse(ctx, -0.05 * s, -0.2 * s, 0.03 * s, 0.03 * s, '#e63946')
  ellipse(ctx, 0.05 * s, -0.2 * s, 0.03 * s, 0.03 * s, '#e63946')
  ctx.restore()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// ---------- player ----------

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  scale: number,
  anim: PlayerAnim,
  jumpHeight: number,
  leanTilt: number,
  time: number,
  hitFlash: number,
) {
  const s = scale * 95
  const jumpPixels = jumpHeight * s * 1.4

  // shadow
  const shadowAlpha = Math.max(0.12, 0.4 - jumpHeight * 0.3)
  ellipse(ctx, x, groundY, 0.5 * s, 0.14 * s * (1 - Math.min(0.6, jumpHeight * 0.4)), `rgba(0,0,0,${shadowAlpha})`)

  const bob = anim === 'run' ? Math.sin(time * RUN_BOB_FREQ) * 0.045 * s : 0
  const cy = groundY - jumpPixels - 0.45 * s + bob

  ctx.save()
  ctx.translate(x, cy)
  ctx.rotate(leanTilt * 0.35)

  let squashX = 1
  let squashY = 1
  if (anim === 'slide') {
    squashX = 1.25
    squashY = 0.52
  } else if (anim === 'jump') {
    squashX = 0.92
    squashY = 1.12
  } else if (anim === 'hit') {
    squashX = 1.1
    squashY = 0.85
  }

  const baseColor = hitFlash > 0 ? '#d84343' : '#8a5a2b'
  const midColor = hitFlash > 0 ? '#e46a6a' : '#a5713a'
  const topColor = hitFlash > 0 ? '#f09a9a' : '#c68f52'

  ellipse(ctx, 0, 0.28 * s * squashY, 0.46 * s * squashX, 0.26 * s * squashY, baseColor)
  ellipse(ctx, 0, -0.02 * s * squashY, 0.36 * s * squashX, 0.22 * s * squashY, midColor)
  ellipse(ctx, 0, -0.3 * s * squashY, 0.24 * s * squashX, 0.16 * s * squashY, topColor)
  ellipse(ctx, -0.08 * s, -0.36 * s * squashY, 0.08 * s, 0.05 * s, 'rgba(255,255,255,0.5)')

  // eyes
  const eyeY = -0.06 * s * squashY
  if (anim === 'hit') {
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = Math.max(1, 0.03 * s)
    drawX(ctx, -0.14 * s, eyeY, 0.06 * s)
    drawX(ctx, 0.14 * s, eyeY, 0.06 * s)
  } else {
    ellipse(ctx, -0.15 * s, eyeY, 0.09 * s, 0.1 * s, '#ffffff')
    ellipse(ctx, 0.15 * s, eyeY, 0.09 * s, 0.1 * s, '#ffffff')
    const lookX = leanTilt * 0.06 * s
    ellipse(ctx, -0.15 * s + lookX, eyeY, 0.045 * s, 0.05 * s, '#1a1a1a')
    ellipse(ctx, 0.15 * s + lookX, eyeY, 0.045 * s, 0.05 * s, '#1a1a1a')
    ctx.strokeStyle = '#3a2415'
    ctx.lineWidth = Math.max(1, 0.035 * s)
    ctx.beginPath()
    if (anim === 'jump') {
      ctx.arc(0, 0.08 * s * squashY, 0.12 * s, 0.15 * Math.PI, 0.85 * Math.PI)
    } else {
      ctx.arc(0, -0.02 * s * squashY, 0.1 * s, 0.15 * Math.PI, 0.85 * Math.PI)
    }
    ctx.stroke()
  }

  ctx.restore()
}

function drawX(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x - r, y - r)
  ctx.lineTo(x + r, y + r)
  ctx.moveTo(x + r, y - r)
  ctx.lineTo(x - r, y + r)
  ctx.stroke()
}

// ---------- particles ----------

export function drawParticles(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const p of state.particles) {
    const alpha = 1 - p.life / p.maxLife
    ctx.fillStyle = p.color.replace('ALPHA', alpha.toFixed(2))
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * (1 - p.life / p.maxLife * 0.4), 0, Math.PI * 2)
    ctx.fill()
  }
}

// ---------- full scene ----------

export function drawScene(ctx: CanvasRenderingContext2D, width: number, height: number, state: GameState, time: number) {
  ctx.save()
  if (state.shake > 0) {
    const mag = state.shake * 10
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag)
  }

  drawTunnel(ctx, width, height, state.distance)

  const entities: { z: number; draw: () => void }[] = []

  for (const c of state.collectibles) {
    const { x, y, scale } = projectPoint(c.lane, c.z, width, height)
    entities.push({ z: c.z, draw: () => drawCollectible(ctx, x, y, scale, time) })
  }

  for (const o of state.obstacles) {
    const { x, y, scale } = projectPoint(o.lane, o.z, width, height)
    entities.push({ z: o.z, draw: () => drawObstacle(ctx, x, y, scale, o.type) })
  }

  entities.sort((a, b) => b.z - a.z)
  for (const e of entities) e.draw()

  const { x: playerX, y: playerY, scale: playerScale } = projectPoint(state.player.x, COLLIDE_Z, width, height)
  drawPlayer(
    ctx,
    playerX,
    playerY,
    playerScale,
    state.player.anim,
    state.player.jumpHeight,
    state.player.leanTilt,
    time,
    state.player.hitTimer,
  )

  drawParticles(ctx, state)

  // vignette
  const vg = ctx.createRadialGradient(width / 2, height / 2, height * 0.3, width / 2, height / 2, height * 0.85)
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, 'rgba(0,0,0,0.45)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, width, height)

  ctx.restore()
}

// ---------- toilet intro / flush transition ----------

export function drawToiletScene(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, flushT: number) {
  const bg = ctx.createLinearGradient(0, 0, 0, height)
  bg.addColorStop(0, '#dff3ff')
  bg.addColorStop(1, '#aee0f5')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  for (let i = 0; i < 5; i++) {
    ellipse(ctx, (width * (0.15 + i * 0.2)) % width, height * 0.12 + (i % 2) * 30, 40, 16, 'rgba(255,255,255,0.5)')
  }

  const cx = width / 2
  const bowlTop = height * 0.42
  const bowlW = Math.min(width * 0.62, 340)
  const bowlH = bowlW * 0.62

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.15)'
  ctx.shadowBlur = 20
  ctx.shadowOffsetY = 12
  ctx.fillStyle = '#f4f7fa'
  roundRect(ctx, cx - bowlW * 0.62, bowlTop + bowlH * 0.55, bowlW * 1.24, bowlH * 1.1, 26)
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = '#e8edf2'
  roundRect(ctx, cx - bowlW * 0.5, bowlTop, bowlW, bowlH * 0.55, 18)
  ctx.fill()

  const waterClip = () => {
    ctx.beginPath()
    ctx.ellipse(cx, bowlTop + bowlH * 0.32, bowlW * 0.38, bowlH * 0.22, 0, 0, Math.PI * 2)
    ctx.clip()
  }

  ctx.save()
  waterClip()
  const water = ctx.createRadialGradient(cx, bowlTop + bowlH * 0.32, 4, cx, bowlTop + bowlH * 0.32, bowlW * 0.4)
  water.addColorStop(0, '#bfe8f7')
  water.addColorStop(1, '#8fcfe8')
  ctx.fillStyle = water
  ctx.fillRect(cx - bowlW, bowlTop - bowlH, bowlW * 2, bowlH * 2)

  if (flushT > 0) {
    ctx.translate(cx, bowlTop + bowlH * 0.32)
    ctx.rotate(flushT * Math.PI * 10)
    ctx.scale(1 - flushT * 0.85, 1 - flushT * 0.85)
    ctx.translate(-cx, -(bowlTop + bowlH * 0.32))
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 6
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.arc(cx, bowlTop + bowlH * 0.32, bowlW * (0.1 + i * 0.09), 0, Math.PI * 1.5)
      ctx.stroke()
    }
  }
  ctx.restore()

  ctx.strokeStyle = '#c7d0d8'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.ellipse(cx, bowlTop + bowlH * 0.32, bowlW * 0.38, bowlH * 0.22, 0, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = '#e8edf2'
  roundRect(ctx, cx - bowlW * 0.72, bowlTop - 22, bowlW * 1.44, 26, 13)
  ctx.fill()
  ctx.fillStyle = '#dbe2e8'
  roundRect(ctx, cx - bowlW * 0.35, bowlTop - 70, bowlW * 0.7, 55, 12)
  ctx.fill()
  ctx.fillStyle = '#c7d0d8'
  roundRect(ctx, cx + bowlW * 0.4, bowlTop - 45, 22, 20, 6)
  ctx.fill()

  if (flushT <= 0.05) {
    const bob = Math.sin(time * 3) * 6
    ctx.save()
    ctx.translate(cx, bowlTop + bowlH * 0.24 + bob)
    ctx.scale(0.9, 0.9)
    drawPlayer(ctx, 0, 40, 1, 'run', 0, 0, time, 0)
    ctx.restore()
  } else {
    ctx.save()
    waterClip()
    ctx.translate(cx, bowlTop + bowlH * 0.32)
    ctx.rotate(flushT * Math.PI * 10)
    const sc = Math.max(0.02, 1 - flushT * 1.05)
    ctx.scale(sc, sc)
    ctx.globalAlpha = Math.max(0, 1 - flushT * 1.1)
    drawPlayer(ctx, 0, 40, 1, 'run', 0, 0, time, 0)
    ctx.restore()
  }
}
