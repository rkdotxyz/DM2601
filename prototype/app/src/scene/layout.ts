// Where everything sits in the scene, in scene units. The picture is a
// column: Them at the top, the heart in the middle, You at the bottom.
import * as THREE from "three";
import { HEART_NOTCH_Y, HEART_TIP_Y } from "./heartShape";

export const HEART_POS = new THREE.Vector3(0, 0.05, 0);
export const THEM_DISC = new THREE.Vector3(0, 2.05, 0);
export const YOU_DISC = new THREE.Vector3(0, -2.35, 0);
export const DISC_R = 0.44;

/** The whole composition, for fitting the camera: width, height, centre y. */
export const FRAME = { w: 3.3, h: 6.25, cy: 0.28 };

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

export const TUBE_YOU = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, YOU_DISC.y + 0.02, -DISC_R + 0.06),
  new THREE.Vector3(0, YOU_DISC.y + 0.3, -DISC_R - 0.02),
  new THREE.Vector3(-0.3, -1.75, -0.3),
  new THREE.Vector3(0.24, -1.42, -0.14),
  new THREE.Vector3(0.0, HEART_POS.y + HEART_TIP_Y - 0.22, 0.0),
  new THREE.Vector3(0, HEART_POS.y + HEART_TIP_Y + 0.12, 0),
], false, "catmullrom", 0.5);
