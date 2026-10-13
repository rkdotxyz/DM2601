import { create } from 'zustand'

export type Headwear = 'none' | 'beanie' | 'nightcap' | 'party' | 'crown' | 'bow' | 'flower'
export type Eyewear = 'none' | 'round' | 'sunglasses' | 'heart' | 'sleepmask'
export type Extra = 'scarf' | 'backpack' | 'moon' | 'balloon'
export type StickerKind = 'star' | 'moon' | 'heart' | 'flower' | 'cloud' | 'sparkle' | 'rainbow' | 'zzz'
export type Place = 'studio' | 'bedside' | 'bed' | 'window' | 'shelf' | 'desk' | 'sofa' | 'suitcase'
export type Tab = 'colour' | 'head' | 'eyes' | 'extras' | 'stickers' | 'sketch' | 'heart'

export interface Sticker {
  id: number
  kind: StickerKind
  /** In the body mesh's local space. */
  position: [number, number, number]
  size: number
  spin: number
}

export const DEFAULT_COLOUR = '#a9a9a7'

interface DollState {
  tab: Tab
  bodyColour: string
  headwear: Headwear
  eyewear: Eyewear
  extras: Extra[]
  stickers: Sticker[]
  stickerKind: StickerKind
  stickerSize: number
  brushColour: string
  brushSize: number
  eraser: boolean
  /** Bumped whenever the drawing is cleared, so the canvas resets. */
  paintVersion: number
  hasPaint: boolean
  /**
   * The two people. You are the one with the doll (Heart button); they are
   * far away, with the phone app. The heart's light follows both, like the firmware.
   */
  them: boolean
  you: boolean
  night: boolean
  /** Where the doll is sitting. */
  place: Place

  setTab: (tab: Tab) => void
  setBodyColour: (c: string) => void
  setHeadwear: (h: Headwear) => void
  setEyewear: (e: Eyewear) => void
  toggleExtra: (x: Extra) => void
  setStickerKind: (k: StickerKind) => void
  setStickerSize: (s: number) => void
  addSticker: (position: [number, number, number]) => void
  undoSticker: () => void
  clearStickers: () => void
  setBrushColour: (c: string) => void
  setBrushSize: (s: number) => void
  setEraser: (on: boolean) => void
  markPainted: () => void
  clearPaint: () => void
  setThem: (on: boolean) => void
  setYou: (on: boolean) => void
  setNight: (on: boolean) => void
  setPlace: (place: Place) => void
  reset: () => void
}

const initial = {
  bodyColour: DEFAULT_COLOUR,
  headwear: 'none' as Headwear,
  eyewear: 'none' as Eyewear,
  extras: [] as Extra[],
  stickers: [] as Sticker[],
  them: true,
  you: true,
}

let nextId = 1

export const useDoll = create<DollState>((set) => ({
  ...initial,
  tab: 'colour',
  stickerKind: 'star',
  stickerSize: 0.26,
  brushColour: '#3b2a2a',
  brushSize: 0.035,
  eraser: false,
  paintVersion: 0,
  hasPaint: false,
  night: false,
  place: 'studio',

  setTab: (tab) => set({ tab }),
  setBodyColour: (bodyColour) => set({ bodyColour }),
  setHeadwear: (headwear) => set({ headwear }),
  setEyewear: (eyewear) => set({ eyewear }),
  toggleExtra: (x) =>
    set((s) => ({ extras: s.extras.includes(x) ? s.extras.filter((e) => e !== x) : [...s.extras, x] })),
  setStickerKind: (stickerKind) => set({ stickerKind }),
  setStickerSize: (stickerSize) => set({ stickerSize }),
  addSticker: (position) =>
    set((s) => ({
      stickers: [
        ...s.stickers,
        { id: nextId++, kind: s.stickerKind, position, size: s.stickerSize, spin: (Math.random() - 0.5) * 0.6 },
      ],
    })),
  undoSticker: () => set((s) => ({ stickers: s.stickers.slice(0, -1) })),
  clearStickers: () => set({ stickers: [] }),
  setBrushColour: (brushColour) => set({ brushColour, eraser: false }),
  setBrushSize: (brushSize) => set({ brushSize }),
  setEraser: (eraser) => set({ eraser }),
  markPainted: () => set((s) => (s.hasPaint ? s : { hasPaint: true })),
  clearPaint: () => set((s) => ({ paintVersion: s.paintVersion + 1, hasPaint: false })),
  setThem: (them) => set({ them }),
  setYou: (you) => set({ you }),
  setNight: (night) => set({ night }),
  setPlace: (place) => set({ place }),
  reset: () => set((s) => ({ ...initial, paintVersion: s.paintVersion + 1, hasPaint: false })),
}))

/** The doll's state, named as in the firmware (prototype/docs/architecture.md). */
export function dollState(them: boolean, you: boolean) {
  if (them && you) return 'together'
  if (you) return 'waiting' // only you, the doll person, pressed Heart
  if (them) return 'connected' // only they, on the phone, are available
  return 'idle'
}
