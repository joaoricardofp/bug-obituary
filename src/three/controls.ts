import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * Initialise Orbit Controls for free exploration of the graveyard.
 * Settings follow AGENTS.md §10: slow/weighty feel, zoom clamped so the
 * user can't clip inside a stone or fly to infinity, vertical angle
 * clamped so ground and sky remain visible at all times.
 */
export function createControls(
  camera: THREE.PerspectiveCamera,
  domElement: HTMLElement,
): OrbitControls {
  const controls = new OrbitControls(camera, domElement);

  // Feel — slow, weighty, like walking through thick fog.
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 0.8;
  controls.panSpeed = 0.6;

  // Zoom limits — prevent clipping inside stones or flying to infinity.
  controls.minDistance = 3;
  controls.maxDistance = 30;

  // Vertical angle — keep ground and sky always in frame.
  controls.minPolarAngle = Math.PI * 0.1; // ~18° — can't look straight up
  controls.maxPolarAngle = Math.PI * 0.72; // ~130° — can't go below ground

  // Orbit around the centre of the graveyard, not the raw world origin.
  controls.target.set(0, 0.5, 0);
  controls.update();

  return controls;
}
