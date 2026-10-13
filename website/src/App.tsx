import { Scene } from './Scene'
import { Panel } from './ui/Panel'
import { useEffect, useRef, useState } from 'react'
import { useDoll } from './store'
import { PLACES, placeInfo } from './places/list'

const HINTS: Record<string, string> = {
  stickers: 'Tap the doll to place a sticker',
  sketch: 'Drag on the doll to draw · drag around it to turn',
}

function saveImage() {
  const canvas = document.querySelector<HTMLCanvasElement>('.stage canvas')
  if (!canvas) return
  const link = document.createElement('a')
  link.download = 'heart-doll.png'
  link.href = canvas.toDataURL('image/png')
  link.click()
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

const ICONS = {
  sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z',
  save: 'M12 3v12M7 10l5 5 5-5M5 21h14',
  reset: 'M4 4v6h6M4.5 15a8 8 0 1 0 1.9-8.3L4 10',
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  place: 'M3 11l9-7 9 7M5 10v10h14V10',
}

/** Where the doll is sitting: arrows to step through, or tap the name for the list. */
function PlacePicker() {
  const { place, setPlace } = useDoll()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  // close the list when you tap or click anywhere else
  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])
  const index = PLACES.findIndex((p) => p.id === place)
  const step = (by: number) => setPlace(PLACES[(index + by + PLACES.length) % PLACES.length].id)
  return (
    <div className="places" ref={root}>
      {open && (
        <div className="place-menu" role="listbox" aria-label="Places">
          {PLACES.map((p) => (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={p.id === place}
              className="place-option"
              onClick={() => {
                setPlace(p.id)
                setOpen(false)
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
      <div className="place-bar">
        <button type="button" className="icon-button" onClick={() => step(-1)} aria-label="Previous place">
          <Icon d={ICONS.left} />
        </button>
        <button type="button" className="place-name" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen(!open)}>
          <Icon d={ICONS.place} />
          <span>{placeInfo(place).name}</span>
          <span className="place-count">
            {index + 1}/{PLACES.length}
          </span>
        </button>
        <button type="button" className="icon-button" onClick={() => step(1)} aria-label="Next place">
          <Icon d={ICONS.right} />
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const { night, setNight, tab, reset } = useDoll()
  const hint = HINTS[tab]
  return (
    <div className="app" data-night={night}>
      <main className="stage">
        <Scene />
        <div className="toolbar">
          <button type="button" className="icon-button" onClick={() => setNight(!night)} aria-label={night ? 'Switch to day' : 'Switch to night'} title={night ? 'Day' : 'Night'}>
            <Icon d={night ? ICONS.sun : ICONS.moon} />
          </button>
          <button type="button" className="icon-button" onClick={saveImage} aria-label="Save an image" title="Save image">
            <Icon d={ICONS.save} />
          </button>
          <button type="button" className="icon-button" onClick={reset} aria-label="Start over" title="Start over">
            <Icon d={ICONS.reset} />
          </button>
        </div>
        {hint && <p className="stage-hint">{hint}</p>}
        <PlacePicker />
      </main>
      <Panel />
    </div>
  )
}
