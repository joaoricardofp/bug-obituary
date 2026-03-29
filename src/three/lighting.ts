import * as THREE from "three";

/**
 * Add ambient light, cold directional moonlight, two warm candle point lights,
 * and a cool rim fill to the scene.
 *
 * Returns both PointLight references so the animation loop can animate their
 * intensities for a candle-flicker effect.
 */
export function createLighting(scene: THREE.Scene): {
  candle1: THREE.PointLight;
  candle2: THREE.PointLight;
} {
  // Low ambient — prevents shadows from going pure black.
  const ambient = new THREE.AmbientLight(0x1a1a2e, 0.5);
  scene.add(ambient);

  // Moonlight — cold blue-white directional from top-left.
  const moon = new THREE.DirectionalLight(0x8899cc, 1.4);
  moon.position.set(-10, 14, -5);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.camera.near = 0.5;
  moon.shadow.camera.far = 60;
  moon.shadow.camera.left = -20;
  moon.shadow.camera.right = 20;
  moon.shadow.camera.top = 20;
  moon.shadow.camera.bottom = -20;
  scene.add(moon);

  // Warm candle-glow — placed near the front gravestones, left side.
  const candle1 = new THREE.PointLight(0xff6a00, 2.0, 7);
  candle1.position.set(-2, 0.4, 4);
  scene.add(candle1);

  // Second candle — right side, creates asymmetric warmth.
  const candle2 = new THREE.PointLight(0xff8c00, 1.4, 5);
  candle2.position.set(3.5, 0.4, 2);
  scene.add(candle2);

  // Subtle cool rim from behind — separates distant stones from the fog.
  const rim = new THREE.DirectionalLight(0x334466, 0.4);
  rim.position.set(5, 3, -15);
  scene.add(rim);

  return { candle1, candle2 };
}
