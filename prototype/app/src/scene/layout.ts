// Where everything sits in the scene, in scene units. The picture is a
// column: Them at the top, the heart in the middle, You at the bottom.
import * as THREE from "three";
import { HEART_NOTCH_Y, HEART_TIP_Y } from "./heartShape";

export const HEART_POS = new THREE.Vector3(0, 0.05, 0);
export const THEM_DISC = new THREE.Vector3(0, 2.05, 0);
export const YOU_DISC = new THREE.Vector3(0, -3.0, 0);
export const DISC_R = 0.44;

/** The whole composition, for fitting the camera: width, height, centre y. */
export const FRAME = { w: 3.3, h: 6.7, cy: 0.08 };

// Tubes run from the person (start) to the heart (end), with a little
// depth so they turn as the phone tilts.
export const TUBE_THEM = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, THEM_DISC.y - 0.06, 0),
  new THREE.Vector3(0.05, THEM_DISC.y - 0.28, 0.06),
  new THREE.Vector3(0.32, 1.58, 0.22),
  new THREE.Vector3(-0.22, 1.28, 0.12),
  new THREE.Vector3(0.0, HEART_POS.y + HEART_NOTCH_Y + 0.26, 0.0),
  new THREE.Vector3(0, HEART_POS.y + HEART_NOTCH_Y - 0.1, 0),
], false, "catmullrom", 0.5);

// Where your locket floats (see Figure and Portrait): its centre, and the
// top of its frame, in scene units.
const LOCKET_Y = YOU_DISC.y + 0.62 * 1.18;
const LOCKET_TOP = LOCKET_Y + 0.52;

// Your tube is fixed to the back of your locket, rises behind it, and
// comes out above the frame. From there it zigzags up into the heart's
// tip, mirroring the top tube.
export const TUBE_YOU = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, LOCKET_Y, -0.16),
  new THREE.Vector3(0, LOCKET_Y + 0.32, -0.17),
  new THREE.Vector3(0, LOCKET_TOP + 0.06, -0.1),
  new THREE.Vector3(0.3, LOCKET_TOP + 0.3, 0.18),
  new THREE.Vector3(-0.22, LOCKET_TOP + 0.53, 0.12),
  new THREE.Vector3(0.0, HEART_POS.y + HEART_TIP_Y - 0.18, 0.0),
  new THREE.Vector3(0, HEART_POS.y + HEART_TIP_Y + 0.12, 0),
], false, "catmullrom", 0.5);
