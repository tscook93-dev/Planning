let ctx: AudioContext | null = null
let muted = false

export function setMuted(value: boolean) {
  muted = value
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function unlockAudio() {
  getCtx()
}

function tone(freq: number, duration: number, type: OscillatorType, gainPeak = 0.18, delay = 0) {
  if (muted) return
  const audio = getCtx()
  if (!audio) return
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, audio.currentTime + delay)
  gain.gain.setValueAtTime(0, audio.currentTime + delay)
  gain.gain.linearRampToValueAtTime(gainPeak, audio.currentTime + delay + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + delay + duration)
  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(audio.currentTime + delay)
  osc.stop(audio.currentTime + delay + duration + 0.02)
  return osc
}

export function playJump() {
  tone(420, 0.14, 'square', 0.14)
  tone(680, 0.1, 'square', 0.09, 0.04)
}

export function playSlide() {
  tone(160, 0.18, 'sawtooth', 0.12)
}

export function playCollect() {
  tone(880, 0.09, 'sine', 0.12)
  tone(1320, 0.12, 'sine', 0.1, 0.05)
}

export function playCrash() {
  if (muted) return
  const audio = getCtx()
  if (!audio) return
  const bufferSize = audio.sampleRate * 0.35
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
  }
  const noise = audio.createBufferSource()
  noise.buffer = buffer
  const gain = audio.createGain()
  gain.gain.setValueAtTime(0.28, audio.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.35)
  noise.connect(gain)
  gain.connect(audio.destination)
  noise.start()
  tone(90, 0.3, 'sawtooth', 0.16)
}

export function playFlush() {
  if (muted) return
  const audio = getCtx()
  if (!audio) return
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(700, audio.currentTime)
  osc.frequency.exponentialRampToValueAtTime(90, audio.currentTime + 1.1)
  gain.gain.setValueAtTime(0.16, audio.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 1.15)
  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start()
  osc.stop(audio.currentTime + 1.2)
}
