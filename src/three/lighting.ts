import * as THREE from "three";

/**
 * Add ambient light, cold directional moonlight, and a warm candle point light
 * to the scene. All values match the Tim Burton palette defined in AGENTS.md §10.
 */
export function createLighting(scene: THREE.Scene): void {
  // Low ambient — prevents shadows from going pure black.
  const ambient = new THREE.AmbientLight(0x1a1a2e, 0.6);
  scene.add(ambient);

  // Moonlight — cold directional from top-left.
  const moon = new THREE.DirectionalLight(0x8899bb, 1.2);
  moon.position.set(-8, 12, -5);
  moon.castShadow = true;
  scene.add(moon);

  // Warm point light near a few graves — candle / lantern effect.
  const candle = new THREE.PointLight(0xff6a00, 1.5, 6);
  candle.position.set(2, 0.5, 3);
  scene.add(candle);

  // Rim light — subtle blue-violet back-fill that separates dark gravestones
  // from the near-black sky, giving the scene depth without washing it out.
  const rim = new THREE.DirectionalLight(0x4422aa, 0.4);
  rim.position.set(5, 8, -15);
  scene.add(rim);
}
