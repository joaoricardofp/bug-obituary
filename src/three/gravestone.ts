import * as THREE from "three";
import type { BugRecord } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Clamp a value between min and max (inclusive). */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Hash the full id string to a stable unsigned 32-bit integer.
 * Used for deterministic type selection and per-stone randomness.
 * Exported so graveyard.ts can use the same hash for position seeding.
 */
export function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0; // unsigned 32-bit
  }
  return hash;
}

/**
 * Return a deterministic pseudo-random number in [0, 1) derived from a
 * string seed. Used so that per-bug randomness is stable across re-renders.
 */
function seededRandom(seed: string): () => number {
  let state = seed
    .split("")
    .reduce((acc, ch) => acc ^ ch.charCodeAt(0), 0x9e3779b9);
  return () => {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    return (state >>> 0) / 0xffffffff;
  };
}

// ---------------------------------------------------------------------------
// Material factory
// ---------------------------------------------------------------------------

/**
 * Create the `MeshToonMaterial` stone colour for a given gravestone.
 * Hue: 0.75 (purple) ± 0.028 (≈ ±10° of hue), saturation and lightness
 * stay close to the palette defined in AGENTS.md §10.
 */
function createStoneMaterial(rng: () => number): THREE.MeshToonMaterial {
  const hue = clamp(0.75 + (rng() - 0.5) * 0.056, 0.68, 0.82);
  const sat = 0.1 + rng() * 0.05;
  const lit = 0.26 + rng() * 0.04;

  return new THREE.MeshToonMaterial({
    color: new THREE.Color().setHSL(hue, sat, lit),
  });
}

// ---------------------------------------------------------------------------
// Type 0 — Classic arch
// ---------------------------------------------------------------------------

/**
 * Rectangular slab (1.0 × 1.8 × 0.22) with a half-cylinder arch cap on top.
 *
 * The arch is a CylinderGeometry with thetaLength = Math.PI (half-ring).
 * Default cylinder axis is Y. To get a semicircle that caps the slab:
 *   rotation.x = Math.PI / 2  → stands the cylinder upright (curved top, flat bottom)
 *   rotation.y = Math.PI / 2  → aligns the flat cut along the body's width axis
 * The flat diameter of the half-cylinder must be horizontal and match the body width.
 */
function buildClassicArch(mat: THREE.MeshToonMaterial): THREE.Group {
  const group = new THREE.Group();

  // Body — centred at y = 0.9 so its base sits at y = 0.
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.8, 0.22), mat);
  body.position.y = 0.9;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Arch cap — correct orientation: curved surface facing up, flat face down.
  const arch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.22, 16, 1, false, 0, Math.PI),
    mat,
  );
  arch.rotation.x = Math.PI / 2; // stand upright so curved surface faces up
  arch.rotation.y = Math.PI / 2; // align flat cut along the body width axis
  arch.position.set(0, 1.8, 0); // sit exactly on top of the body's top edge
  arch.castShadow = true;
  group.add(arch);

  return group;
}

// ---------------------------------------------------------------------------
// Type 1 — Cross
// ---------------------------------------------------------------------------

/**
 * Standalone cross gravestone: vertical beam + horizontal crossbar + base block.
 * More dramatic and recognisable at a distance than the arch type.
 */
function buildCross(mat: THREE.MeshToonMaterial): THREE.Group {
  const group = new THREE.Group();

  // Vertical beam — tall and slightly wider than it is deep.
  const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.2, 0.2), mat);
  vertical.position.y = 1.1;
  vertical.castShadow = true;
  group.add(vertical);

  // Horizontal crossbar — placed at ~70 % of total height.
  const horizontal = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.28, 0.2),
    mat,
  );
  horizontal.position.y = 1.6;
  horizontal.castShadow = true;
  group.add(horizontal);

  // Small base block — gives weight, stops it looking like it floats.
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.3), mat);
  base.position.y = 0.09;
  base.castShadow = true;
  group.add(base);

  return group;
}

// ---------------------------------------------------------------------------
// Type 2 — Obelisk
// ---------------------------------------------------------------------------

/**
 * Tall tapering rectangular monolith with a pyramid cap. Imposing and easy to
 * spot across the graveyard. Built from a custom BufferGeometry (8 vertices)
 * since Three.js has no built-in taper primitive.
 */
function buildObelisk(mat: THREE.MeshToonMaterial): THREE.Group {
  const group = new THREE.Group();

  const w0 = 0.35,
    d0 = 0.15; // half-extents at the bottom
  const w1 = 0.125,
    d1 = 0.06; // half-extents at the top
  const h = 2.8;

  // prettier-ignore
  const positions = new Float32Array([
    // bottom face (y = 0)
    -w0, 0,  d0,   w0, 0,  d0,   w0, 0, -d0,  -w0, 0, -d0,
    // top face (y = h)
    -w1, h,  d1,   w1, h,  d1,   w1, h, -d1,  -w1, h, -d1,
  ]);

  // prettier-ignore
  const indices = [
    0, 1, 5,  0, 5, 4, // front
    1, 2, 6,  1, 6, 5, // right
    2, 3, 7,  2, 7, 6, // back
    3, 0, 4,  3, 4, 7, // left
    4, 5, 6,  4, 6, 7, // top
    0, 3, 2,  0, 2, 1, // bottom
  ];

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const obelisk = new THREE.Mesh(geo, mat);
  obelisk.castShadow = true;
  group.add(obelisk);

  // Stepped base block — gives it weight and visual grounding.
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.12, 0.35),
    mat.clone(),
  );
  (base.material as THREE.MeshToonMaterial).color.offsetHSL(0, 0, 0.03);
  base.position.y = 0.06;
  group.add(base);

  // Pyramid cap — four-sided pointed top, rotated 45° so corners align with faces.
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 4), mat);
  cap.position.y = h + 0.15;
  cap.rotation.y = Math.PI / 4;
  cap.castShadow = true;
  group.add(cap);

  return group;
}

// ---------------------------------------------------------------------------
// Weathering helpers
// ---------------------------------------------------------------------------

/**
 * Scatter moss patches on the front face of the stone. Each patch is a thin
 * flat box pressed lightly against the stone surface, tinted dark green.
 */
function addMoss(group: THREE.Group, rng: () => number): void {
  const mossMat = new THREE.MeshToonMaterial({
    color: new THREE.Color(0x2d4a2d),
  });
  const count = 3 + Math.floor(rng() * 3); // 3–5 patches
  for (let i = 0; i < count; i++) {
    const mw = 0.08 + rng() * 0.22;
    const mh = 0.06 + rng() * 0.18;
    const moss = new THREE.Mesh(new THREE.BoxGeometry(mw, mh, 0.01), mossMat);
    moss.position.set(
      (rng() - 0.5) * 0.7,
      0.2 + rng() * 1.2,
      0.12,
    );
    moss.rotation.z = (rng() - 0.5) * 0.4;
    group.add(moss);
  }
}

/**
 * Add thin crack slivers pressed against the front face of the stone.
 * Slightly lighter than the base stone to catch the directional light.
 */
function addCracks(
  group: THREE.Group,
  rng: () => number,
  lightMat: THREE.MeshToonMaterial,
): void {
  const count = 2 + Math.floor(rng() * 2); // 2–3 cracks
  for (let i = 0; i < count; i++) {
    const ch = 0.18 + rng() * 0.45;
    const crack = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, ch, 0.01),
      lightMat,
    );
    crack.position.set(
      (rng() - 0.5) * 0.6,
      0.3 + rng() * 1.0,
      0.12,
    );
    crack.rotation.z = (rng() - 0.5) * 0.3;
    group.add(crack);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create and return a `THREE.Group` representing a single gravestone for the
 * given `BugRecord`.
 *
 * Type selection uses `hashId(bug.id) % 3` — hashing the full UUID string
 * guarantees an even distribution across all three types regardless of UUID
 * format or buffer size.
 *
 * All per-stone randomness (colour, weathering, lean) is driven by a seeded
 * RNG so the result is identical on every render.
 *
 * The group's `userData.bugId` is set so the raycaster can map a hit mesh
 * back to its record without maintaining a separate lookup table.
 */
export function createGravestone(bug: BugRecord): THREE.Group {
  const rng = seededRandom(bug.id);
  const group = new THREE.Group();

  const mat = createStoneMaterial(rng);

  // Slightly lighter clone for name plate and crack details.
  const lightMat = mat.clone();
  lightMat.color.offsetHSL(0, 0, 0.04);

  // Select one of three distinct shapes using the full-id hash.
  const typeIndex = hashId(bug.id) % 3;
  if (typeIndex === 0) {
    group.add(buildClassicArch(mat));
  } else if (typeIndex === 1) {
    group.add(buildCross(mat));
  } else {
    group.add(buildObelisk(mat));
  }

  // Name plate — thin raised panel mimicking an engraved inscription area.
  // Do not attempt to render actual text in 3D — bug name is shown in the
  // 2D GravestoneCard overlay.
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.25, 0.04),
    lightMat,
  );
  plate.position.set(0, 0.6, 0.13);
  group.add(plate);

  // Weathering — all seeded so position is stable across re-renders.
  addMoss(group, rng);
  addCracks(group, rng, lightMat.clone());

  // Small random tilt so stones look hand-placed and slightly weathered.
  group.rotation.z = (rng() - 0.5) * 0.06; // ±1.7° lean left/right
  group.rotation.x = (rng() - 0.5) * 0.04; // ±1.1° lean forward/back

  // Tag the group so raycaster.ts can resolve the hovered bug.
  group.userData.bugId = bug.id;

  // Also tag every child mesh so hits on individual parts bubble up correctly.
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.userData.bugId = bug.id;
    }
  });

  return group;
}
