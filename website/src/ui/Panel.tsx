import type { ReactNode } from 'react'
import { DEFAULT_COLOUR, dollState, useDoll, type Extra, type Eyewear, type Headwear, type Tab } from '../store'
import { STICKERS, stickerImage } from '../doll/textures'

const TABS: { id: Tab; label: string }[] = [
  { id: 'colour', label: 'Colour' },
  { id: 'head', label: 'Head' },
  { id: 'eyes', label: 'Eyes' },
  { id: 'extras', label: 'Extras' },
  { id: 'stickers', label: 'Stickers' },
  { id: 'sketch', label: 'Sketch' },
  { id: 'heart', label: 'Heart' },
]

const COLOURS = [
  { name: 'Heather grey', value: DEFAULT_COLOUR },
  { name: 'Cloud blue', value: '#aac7e4' },
  { name: 'Blush', value: '#efc3c1' },
  { name: 'Sage', value: '#b5c9ad' },
  { name: 'Lavender', value: '#c8bde3' },
  { name: 'Butter', value: '#f0dca4' },
  { name: 'Oat', value: '#ddd1bd' },
  { name: 'Night', value: '#4d5577' },
]

const HEADWEAR: { id: Headwear; label: string; note: string }[] = [
  { id: 'none', label: 'Nothing', note: 'Just the doll' },
  { id: 'beanie', label: 'Beanie', note: 'Knitted, with a pom-pom' },
  { id: 'nightcap', label: 'Nightcap', note: 'For bedtime' },
  { id: 'party', label: 'Party hat', note: 'Striped' },
  { id: 'crown', label: 'Crown', note: 'Gold, three gems' },
  { id: 'bow', label: 'Bow', note: 'On one side' },
  { id: 'flower', label: 'Flower', note: 'Tucked behind an ear' },
]

const EYEWEAR: { id: Eyewear; label: string; note: string }[] = [
  { id: 'none', label: 'Nothing', note: 'Embroidered eyes' },
  { id: 'round', label: 'Round glasses', note: 'Tortoiseshell' },
  { id: 'sunglasses', label: 'Sunglasses', note: 'Dark lenses' },
  { id: 'heart', label: 'Heart glasses', note: 'Pink' },
  { id: 'sleepmask', label: 'Sleep mask', note: 'Eyes closed' },
]

const EXTRAS: { id: Extra; label: string; note: string }[] = [
  { id: 'scarf', label: 'Scarf', note: 'Striped knit' },
  { id: 'backpack', label: 'Backpack', note: 'For travelling' },
  { id: 'moon', label: 'Moon buddy', note: 'A plush to sleep with' },
  { id: 'balloon', label: 'Heart balloon', note: 'Tied to one side' },
]

const INKS = ['#3b2a2a', '#ffffff', '#ef4b6b', '#f7a948', '#f7d948', '#5fb37a', '#4f8fd9', '#8a6cd6']

const STATES = {
  idle: { name: 'Idle', light: 'The heart is dark.', why: 'Nobody is available.' },
  waiting: { name: 'Waiting', light: 'The heart breathes slowly.', why: "You pressed Heart; you're waiting for them." },
  connected: { name: 'Connected', light: 'The heart beats at 60%.', why: "They're there for you; you haven't answered yet." },
  together: { name: 'Together', light: 'The heart beats at full brightness.', why: "You're both available." },
}

function Option({ selected, onClick, label, note, children }: { selected: boolean; onClick: () => void; label: string; note?: string; children?: ReactNode }) {
  return (
    <button type="button" className="option" aria-pressed={selected} onClick={onClick}>
      {children}
      <span className="option-text">
        <span className="option-label">{label}</span>
        {note && <span className="option-note">{note}</span>}
      </span>
    </button>
  )
}

function Switch({ checked, onChange, label, note }: { checked: boolean; onChange: (v: boolean) => void; label: string; note: string }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch-track" aria-hidden="true" />
      <span className="option-text">
        <span className="option-label">{label}</span>
        <span className="option-note">{note}</span>
      </span>
    </label>
  )
}

function ColourTab() {
  const { bodyColour, setBodyColour } = useDoll()
  const custom = !COLOURS.some((c) => c.value === bodyColour)
  return (
    <section>
      <h2>Fabric colour</h2>
      <p className="hint">The doll in the photos is heather grey jersey. Pick another, or mix your own.</p>
      <div className="swatches">
        {COLOURS.map((c) => (
          <button
            key={c.value}
            type="button"
            className="swatch"
            style={{ background: c.value }}
            aria-pressed={bodyColour === c.value}
            aria-label={c.name}
            title={c.name}
            onClick={() => setBodyColour(c.value)}
          />
        ))}
        <label className="swatch swatch-custom" aria-pressed={custom} title="Any colour">
          <input type="color" value={bodyColour} onChange={(e) => setBodyColour(e.target.value)} aria-label="Any colour" />
        </label>
      </div>
      <p className="current">{COLOURS.find((c) => c.value === bodyColour)?.name ?? `Custom ${bodyColour}`}</p>
    </section>
  )
}

function HeadTab() {
  const { headwear, setHeadwear } = useDoll()
  return (
    <section>
      <h2>Headwear</h2>
      <div className="options">
        {HEADWEAR.map((h) => (
          <Option key={h.id} selected={headwear === h.id} onClick={() => setHeadwear(h.id)} label={h.label} note={h.note} />
        ))}
      </div>
    </section>
  )
}

function EyesTab() {
  const { eyewear, setEyewear } = useDoll()
  return (
    <section>
      <h2>Eyewear</h2>
      <div className="options">
        {EYEWEAR.map((e) => (
          <Option key={e.id} selected={eyewear === e.id} onClick={() => setEyewear(e.id)} label={e.label} note={e.note} />
        ))}
      </div>
    </section>
  )
}

function ExtrasTab() {
  const { extras, toggleExtra } = useDoll()
  return (
    <section>
      <h2>Extras</h2>
      <p className="hint">Add as many as you like.</p>
      <div className="options">
        {EXTRAS.map((x) => (
          <Option key={x.id} selected={extras.includes(x.id)} onClick={() => toggleExtra(x.id)} label={x.label} note={x.note}>
            <span className="check" aria-hidden="true" />
          </Option>
        ))}
      </div>
    </section>
  )
}

function StickersTab() {
  const { stickerKind, setStickerKind, stickerSize, setStickerSize, stickers, undoSticker, clearStickers } = useDoll()
  return (
    <section>
      <h2>Stickers</h2>
      <p className="hint">Pick one, then tap the doll to stick it on.</p>
      <div className="stickers">
        {STICKERS.map((s) => (
          <button key={s.kind} type="button" className="sticker" aria-pressed={stickerKind === s.kind} onClick={() => setStickerKind(s.kind)} title={s.label}>
            <img src={stickerImage(s.kind)} alt={s.label} />
          </button>
        ))}
      </div>
      <label className="slider">
        <span>Size</span>
        <input type="range" min={0.14} max={0.45} step={0.01} value={stickerSize} onChange={(e) => setStickerSize(Number(e.target.value))} />
      </label>
      <div className="row">
        <button type="button" className="ghost" onClick={undoSticker} disabled={!stickers.length}>Undo</button>
        <button type="button" className="ghost" onClick={clearStickers} disabled={!stickers.length}>Remove all</button>
      </div>
    </section>
  )
}

function SketchTab() {
  const { brushColour, setBrushColour, brushSize, setBrushSize, eraser, setEraser, clearPaint, hasPaint } = useDoll()
  return (
    <section>
      <h2>Sketch</h2>
      <p className="hint">Draw straight onto the fabric. Drag anywhere off the doll to turn the view and reach its back.</p>
      <div className="swatches">
        {INKS.map((c) => (
          <button
            key={c}
            type="button"
            className="swatch swatch-small"
            style={{ background: c }}
            aria-pressed={!eraser && brushColour === c}
            aria-label={`Ink ${c}`}
            onClick={() => setBrushColour(c)}
          />
        ))}
        <label className="swatch swatch-small swatch-custom" title="Any colour">
          <input type="color" value={brushColour} onChange={(e) => setBrushColour(e.target.value)} aria-label="Any ink colour" />
        </label>
      </div>
      <label className="slider">
        <span>Brush</span>
        <input type="range" min={0.012} max={0.09} step={0.002} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
      </label>
      <div className="row">
        <button type="button" className="ghost" aria-pressed={eraser} onClick={() => setEraser(!eraser)}>Eraser</button>
        <button type="button" className="ghost" onClick={clearPaint} disabled={!hasPaint}>Clear drawing</button>
      </div>
    </section>
  )
}

function HeartTab() {
  const { them, you, setThem, setYou } = useDoll()
  const state = STATES[dollState(them, you)]
  return (
    <section>
      <h2>The heart</h2>
      <p className="hint">
        You have the doll; the person far away has a phone app. The heart shows who is there, with the same light patterns as the real prototype.
      </p>
      <div className="options">
        <Switch checked={you} onChange={setYou} label="You're available" note="You pressed Heart on the doll" />
        <Switch checked={them} onChange={setThem} label="They're available" note="They tapped in their phone app" />
      </div>
      <div className="state" role="status">
        <span className="state-name">{state.name}</span>
        <span>{state.light}</span>
        <span className="option-note">{state.why}</span>
      </div>
    </section>
  )
}

export function Panel() {
  const tab = useDoll((s) => s.tab)
  const setTab = useDoll((s) => s.setTab)
  return (
    <aside className="panel">
      <header className="panel-head">
        <p className="eyebrow">DM2601 · Heart Doll</p>
        <h1>Make it yours</h1>
        <p className="lede">A soft doll by the bed whose heart glows when someone far away is there for you. Dress it up, stick things on, draw on it.</p>
      </header>
      <nav className="tabs" aria-label="Customise">
        {TABS.map((t) => (
          <button key={t.id} type="button" className="tab" aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <div className="panel-body">
        {tab === 'colour' && <ColourTab />}
        {tab === 'head' && <HeadTab />}
        {tab === 'eyes' && <EyesTab />}
        {tab === 'extras' && <ExtrasTab />}
        {tab === 'stickers' && <StickersTab />}
        {tab === 'sketch' && <SketchTab />}
        {tab === 'heart' && <HeartTab />}
      </div>
    </aside>
  )
}
