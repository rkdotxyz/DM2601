import type { Place } from '../store'

export interface PlaceInfo {
  id: Place
  name: string
  /** How far the camera may swing round, each way, in radians. Infinity = all the way. */
  azimuth: number
}

/*
  Every place is a small 3D room built in code. The surface the doll sits
  on is always at y = 0 and everything else is built around it, so the doll,
  the camera and the controls never move; only the room changes.
*/
export const PLACES: PlaceInfo[] = [
  { id: 'studio', name: 'Studio', azimuth: Infinity },
  { id: 'bedside', name: 'Bedside table', azimuth: 1.3 },
  { id: 'bed', name: 'On the bed', azimuth: 1.25 },
  { id: 'window', name: 'Window sill', azimuth: 1.2 },
  { id: 'shelf', name: 'Bookshelf', azimuth: 0.85 },
  { id: 'desk', name: 'Desk', azimuth: 1.3 },
  { id: 'sofa', name: 'Sofa', azimuth: 1.2 },
  { id: 'suitcase', name: 'Suitcase', azimuth: 1.4 },
]

export function placeInfo(id: Place): PlaceInfo {
  return PLACES.find((p) => p.id === id) ?? PLACES[0]
}
