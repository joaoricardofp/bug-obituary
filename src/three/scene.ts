import * as THREE from "three";

/**
 * Initialise the WebGL renderer, scene (background + fog), and perspective
 * camera. Returns all three so the caller can store refs for the animation loop.
 */
export function createScene(canvas: HTMLCanvasElement): {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
} {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0f);
  scene.fog = new THREE.FogExp2(0x0a0a0f, 0.035);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  );
  // Lowered for a cinematic, candle-level view looking into the graveyard
  camera.position.set(0, 1.5, 12);
  camera.lookAt(0, 1.5, -2);

  return { renderer, scene, camera };
}
