import { HIGH_SCORE_KEY, MUTE_KEY } from './constants'

export function loadHighScore(): number {
  try {
    const raw = window.localStorage.getItem(HIGH_SCORE_KEY)
    return raw ? Math.max(0, parseInt(raw, 10) || 0) : 0
  } catch {
    return 0
  }
}

export function saveHighScore(value: number) {
  try {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(Math.floor(value)))
  } catch {
    // ignore
  }
}

export function loadMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function saveMuted(value: boolean) {
  try {
    window.localStorage.setItem(MUTE_KEY, value ? '1' : '0')
  } catch {
    // ignore
  }
}
