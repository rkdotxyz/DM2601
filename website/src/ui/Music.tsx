import { useEffect, useState } from 'react'

/*
  Background music: one track, looping forever, with a button to play and
  pause it. The file is public/music/background.mp3.

  Browsers don't let a page start sound by itself, so the music starts on
  the first press of the button. If you left it playing last time, it
  starts again on your first tap or click anywhere. It fades in and out
  instead of cutting.
*/

const SRC = `${import.meta.env.BASE_URL}music/background.mp3`
const KEY = 'heartdoll.music'
const VOLUME = 0.5
const FADE_MS = 600

function wantsMusic() {
  try {
    return localStorage.getItem(KEY) === 'on'
  } catch {
    return false
  }
}

function remember(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    /* private mode: just don't remember */
  }
}

/** Glide the volume to a target, then call done. */
function fade(audio: HTMLAudioElement, to: number, done?: () => void) {
  const from = audio.volume
  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / FADE_MS)
    audio.volume = from + (to - from) * t
    if (t < 1) requestAnimationFrame(step)
    else done?.()
  }
  requestAnimationFrame(step)
}

// One player for the whole page, made the first time it's needed.
let audio: HTMLAudioElement | null = null
function player() {
  if (!audio) {
    audio = new Audio(SRC)
    audio.loop = true // always loops: it starts again by itself when it ends
    audio.preload = 'none'
    audio.volume = 0
  }
  return audio
}

const NOTE = 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'
const NOTE_OFF = 'M9 18V9M9 5.5V5l11-2v9M20 16a3 3 0 0 1-3.6 2.9M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM3 3l18 18'

export function MusicButton() {
  const [playing, setPlaying] = useState(false)
  const [missing, setMissing] = useState(false)

  const play = () => {
    const a = player()
    a.volume = 0
    a.play()
      .then(() => {
        setPlaying(true)
        fade(a, VOLUME)
      })
      .catch(() => {
        /* blocked until a tap, or the file is missing: see onerror */
      })
  }

  const pause = () => {
    const a = player()
    setPlaying(false)
    fade(a, 0, () => a.pause())
  }

  useEffect(() => {
    const a = player()
    a.onerror = () => {
      setMissing(true)
      setPlaying(false)
    }
    // Left playing last time? Start again on the first tap anywhere.
    const resume = () => {
      if (!wantsMusic() || !a.paused) return
      a.volume = 0
      a.play()
        .then(() => {
          setPlaying(true)
          fade(a, VOLUME)
        })
        .catch(() => {})
    }
    document.addEventListener('pointerdown', resume, { once: true })
    return () => document.removeEventListener('pointerdown', resume)
  }, [])

  const toggle = () => {
    if (playing) {
      pause()
      remember(false)
    } else {
      play()
      remember(true)
    }
  }

  const label = missing ? 'Music unavailable' : playing ? 'Pause the music' : 'Play music'
  return (
    <button
      type="button"
      className="icon-button"
      onClick={(e) => {
        e.stopPropagation()
        toggle()
      }}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={label}
      aria-pressed={playing}
      title={label}
      disabled={missing}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={playing ? NOTE : NOTE_OFF} />
      </svg>
    </button>
  )
}
