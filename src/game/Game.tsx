import { useCallback, useEffect, useRef, useState } from 'react'
import { applyAction, createGameState, resetRun, stepGame } from './engine'
import { drawScene, drawToiletScene, projectPoint } from './render'
import { spawnBurst } from './particles'
import { useSwipeControls } from './input'
import * as audio from './audio'
import { loadHighScore, loadMuted, saveHighScore, saveMuted } from './storage'
import type { Action, GamePhase } from './types'

const FLUSH_DURATION = 1.15

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scoreRef = useRef<HTMLDivElement>(null)
  const fliesRef = useRef<HTMLDivElement>(null)

  const stateRef = useRef(createGameState(loadHighScore(), loadMuted()))
  const [phase, setPhase] = useState<GamePhase>('intro')
  const [muted, setIsMuted] = useState(() => loadMuted())
  const [gameOverStats, setGameOverStats] = useState({ score: 0, best: 0, isNewBest: false })

  useEffect(() => {
    audio.setMuted(muted)
  }, [muted])

  const handleAction = useCallback((action: Action) => {
    const state = stateRef.current
    if (state.phase !== 'playing') return
    const wasJumping = state.player.isJumping
    const wasSliding = state.player.isSliding
    applyAction(state, action)
    if (action === 'jump' && !wasJumping && state.player.isJumping) {
      audio.playJump()
      if (navigator.vibrate) navigator.vibrate(10)
    } else if (action === 'slide' && !wasSliding && state.player.isSliding) {
      audio.playSlide()
      if (navigator.vibrate) navigator.vibrate(10)
    }
  }, [])

  useSwipeControls(canvasRef, handleAction)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let dpr = 1
    let raf = 0
    let last = performance.now()
    let running = true

    const resize = () => {
      width = container.clientWidth
      height = container.clientHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2.5)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }
    resize()
    window.addEventListener('resize', resize)

    const onCrash = () => {
      const state = stateRef.current
      audio.playCrash()
      if (navigator.vibrate) navigator.vibrate([30, 40, 60])
      const { x, y } = projectPoint(state.player.x, 1.6, width, height)
      spawnBurst(state, x, y, 'rgba(120,90,50,ALPHA)', 22, 1.3)
      saveHighScore(state.highScore)
      setGameOverStats({
        score: state.score,
        best: state.highScore,
        isNewBest: state.score >= state.highScore,
      })
    }

    const onCollect = (count: number) => {
      const state = stateRef.current
      audio.playCollect()
      if (navigator.vibrate) navigator.vibrate(6)
      const { x, y } = projectPoint(state.player.x, 1.6, width, height)
      spawnBurst(state, x, y, 'rgba(255,230,120,ALPHA)', 8 * count, 0.7)
    }

    const loop = (now: number) => {
      if (!running) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = now / 1000
      const state = stateRef.current

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      if (state.phase === 'playing') {
        const events = stepGame(state, dt)
        if (events.collected > 0) onCollect(events.collected)
        if (events.crashed) onCrash()
        drawScene(ctx, width, height, state, t)
        if (scoreRef.current) scoreRef.current.textContent = String(state.score)
        if (fliesRef.current) fliesRef.current.textContent = String(state.fliesCollected)
      } else if (state.phase === 'flushing') {
        state.flushT += dt / FLUSH_DURATION
        drawToiletScene(ctx, width, height, t, Math.min(1, state.flushT))
        if (state.flushT >= 1) {
          resetRun(state)
          state.phase = 'playing'
          setPhase('playing')
        }
      } else if (state.phase === 'intro') {
        drawToiletScene(ctx, width, height, t, 0)
      } else if (state.phase === 'gameover') {
        drawScene(ctx, width, height, state, t)
      }

      setPhase(prev => (prev === state.phase ? prev : state.phase))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const startFlush = () => {
    audio.unlockAudio()
    audio.playFlush()
    const state = stateRef.current
    state.phase = 'flushing'
    state.flushT = 0
    setPhase('flushing')
  }

  const backToIntro = () => {
    const state = stateRef.current
    resetRun(state)
    state.phase = 'intro'
    setPhase('intro')
  }

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev
      audio.setMuted(next)
      saveMuted(next)
      return next
    })
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden bg-black select-none"
      style={{ touchAction: 'none' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block" />

      <div className="absolute inset-0 pointer-events-none flex flex-col">
        <button
          onClick={toggleMute}
          className="pointer-events-auto absolute top-3 right-3 w-10 h-10 rounded-full bg-black/40 backdrop-blur text-white text-lg flex items-center justify-center border border-white/10 active:scale-95 transition-transform"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '🔇' : '🔊'}
        </button>

        {phase === 'playing' && (
          <div className="p-3 pt-4 flex items-center gap-3">
            <div className="bg-black/40 backdrop-blur rounded-2xl px-4 py-2 border border-white/10">
              <div className="text-[10px] tracking-wider text-lime-300/80 font-semibold uppercase">Score</div>
              <div ref={scoreRef} className="text-2xl font-black text-white tabular-nums leading-tight">
                0
              </div>
            </div>
            <div className="bg-black/40 backdrop-blur rounded-2xl px-4 py-2 border border-white/10 flex items-center gap-2">
              <span className="text-lg">🪰</span>
              <div ref={fliesRef} className="text-lg font-bold text-white tabular-nums">
                0
              </div>
            </div>
          </div>
        )}

        {phase === 'intro' && (
          <div className="flex-1 flex flex-col items-center justify-end pb-10 px-6 pointer-events-auto">
            <h1 className="text-4xl font-black text-emerald-900 drop-shadow-sm tracking-tight text-center">
              SEWER SURFER
            </h1>
            <p className="text-emerald-900/70 text-sm font-medium mt-1 mb-6 text-center">
              Flush it, dodge rats, chase flies down the pipes
            </p>
            <button
              onClick={startFlush}
              className="w-full max-w-xs py-4 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 text-white font-black text-lg shadow-lg shadow-emerald-900/30 active:scale-95 transition-transform border-2 border-emerald-300"
            >
              🚽 FLUSH TO START
            </button>
            <p className="text-emerald-900/60 text-xs mt-4 text-center max-w-xs">
              Swipe left/right to switch pipes · swipe up to jump · swipe down to slide
            </p>
          </div>
        )}

        {phase === 'gameover' && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 pointer-events-auto bg-black/50">
            <div className="bg-[#1a2016] border border-lime-500/20 rounded-3xl px-8 py-7 flex flex-col items-center max-w-xs w-full shadow-2xl">
              <div className="text-3xl mb-1">💩🕳️</div>
              <h2 className="text-xl font-black text-white mb-1">FLUSHED OUT!</h2>
              {gameOverStats.isNewBest && (
                <div className="text-amber-400 text-xs font-bold uppercase tracking-wide mb-2">New best!</div>
              )}
              <div className="text-4xl font-black text-lime-300 tabular-nums mt-1">{gameOverStats.score}</div>
              <div className="text-white/50 text-xs font-medium mb-6">Best: {gameOverStats.best}</div>
              <button
                onClick={backToIntro}
                className="w-full py-3.5 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 text-white font-black shadow-lg active:scale-95 transition-transform border-2 border-emerald-300"
              >
                🚽 FLUSH AGAIN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
