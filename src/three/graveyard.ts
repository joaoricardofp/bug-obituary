import * as THREE from "three";
import type { BugRecord } from "@/lib/types";
import { createGravestone, hashId } from "./gravestone";

/**
 * Place one gravestone per BugRecord using scattered polar placement.
 *
 * Stones are distributed across a wide arc (~126°) around the camera's focal
 * point, at varied depths that increase for older bugs. All randomness is
 * seeded from the bug's id hash so positions are stable across re-renders.
 *
 * Returns a Map from bugId → Group for use by the raycaster.
 */
export function buildGraveyard(
  bugs: BugRecord[],
  scene: THREE.Scene,
): Map<string, THREE.Group> {
  const meshMap = new Map<string, THREE.Group>();

  // Sort newest-first — newer bugs appear closer to the camera.
  const sorted = [...bugs].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  sorted.forEach((bug, i) => {
    const seed = hashId(bug.id);

    // Cheap LCG keyed per offset so each dimension gets its own stream.
    const pseudoRand = (offset: number): number =>
      (((seed + offset) * 1664525 + 1013904223) >>> 0) / 0xffffffff;

    // ── Angular placement ──────────────────────────────────────────────────
    // Distribute across a 126° fan centred on the camera's look-at point.
    // We use the Golden Ratio to scatter the angles evenly and organically,
    // breaking the linear queue that occurs when angle is tied directly to `i`.
    const totalAngle = Math.PI * 0.7;
    const goldenRatio = 0.61803398875;
    const angleFraction = (i * goldenRatio) % 1;
    const baseAngle = -totalAngle / 2 + angleFraction * totalAngle;
    const angleJitter = (pseudoRand(1) - 0.5) * 0.2;
    const finalAngle = baseAngle + angleJitter;

    // ── Depth placement ────────────────────────────────────────────────────
    // Newer bugs: z ≈ −2 to −5.  Older bugs: z ≈ −5 to −14, fading into fog.
    const depthFraction = sorted.length > 1 ? i / (sorted.length - 1) : 0;
    const baseDepth = 2 + depthFraction * 10;
    const depthJitter = (pseudoRand(2) - 0.5) * 2.5;
    const finalDepth = Math.max(1.5, baseDepth + depthJitter);

    // ── Polar → Cartesian ─────────────────────────────────────────────────
    const x =
      Math.sin(finalAngle) * finalDepth + (pseudoRand(3) - 0.5) * 1.2;
    const z =
      -Math.cos(finalAngle) * finalDepth + (pseudoRand(4) - 0.5) * 1.0;

    const stone = createGravestone(bug);
    stone.position.set(x, 0, z);

    // ── Facing ────────────────────────────────────────────────────────────
    // Rotate stones to face roughly toward the camera position (0, y, 12)
    // with a small random offset so they don't all look perfectly aligned.
    const angleToCamera = Math.atan2(-x, 12 - z);
    stone.rotation.y = angleToCamera + (pseudoRand(5) - 0.5) * 0.4;

    // ── Non-uniform scale ─────────────────────────────────────────────────
    // Each axis scaled independently for a hand-carved, organic feel.
    stone.scale.set(
      0.85 + pseudoRand(6) * 0.3,
      0.9 + pseudoRand(7) * 0.45,
      0.9 + pseudoRand(8) * 0.15,
    );

    scene.add(stone);
    meshMap.set(bug.id, stone);
  });

  return meshMap;
}
