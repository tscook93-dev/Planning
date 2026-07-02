import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { SWIPE_MIN_DISTANCE } from './constants'
import type { Action } from './types'

export function useSwipeControls(target: RefObject<HTMLElement | null>, onAction: (action: Action) => void) {
  const onActionRef = useRef(onAction)
  onActionRef.current = onAction

  useEffect(() => {
    const el = target.current
    if (!el) return

    let startX = 0
    let startY = 0
    let tracking = false

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0]
      startX = t.clientX
      startY = t.clientY
      tracking = true
    }

    const onTouchMove = (e: TouchEvent) => {
      if (tracking) e.preventDefault()
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return
      tracking = false
      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      resolveSwipe(dx, dy, onActionRef.current)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          onActionRef.current('left')
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          onActionRef.current('right')
          break
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          e.preventDefault()
          onActionRef.current('jump')
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          onActionRef.current('slide')
          break
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKeyDown)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [target])
}

function resolveSwipe(dx: number, dy: number, onAction: (action: Action) => void) {
  const absX = Math.abs(dx)
  const absY = Math.abs(dy)
  if (Math.max(absX, absY) < SWIPE_MIN_DISTANCE) return

  if (absX > absY) {
    onAction(dx > 0 ? 'right' : 'left')
  } else {
    onAction(dy > 0 ? 'slide' : 'jump')
  }
}
