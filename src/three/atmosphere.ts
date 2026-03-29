import * as THREE from "three";

// ---------------------------------------------------------------------------
// Ground
// ---------------------------------------------------------------------------

function createGround(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(60, 60);
  const mat = new THREE.MeshToonMaterial({ color: new THREE.Color("#1a1520") });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

// ---------------------------------------------------------------------------
// Moon
// ---------------------------------------------------------------------------

function createMoon(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(1.5, 16, 16);
  const mat = new THREE.MeshToonMaterial({ color: new THREE.Color("#dde8f0") });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = false;
  mesh.position.set(-8, 12, -20);
  return mesh;
}

// ---------------------------------------------------------------------------
// Stars
// ---------------------------------------------------------------------------

function createStars(): THREE.Points {
  const count = 300;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Distribute uniformly inside a sphere of radius 40 using rejection sampling.
    let x: number, y: number, z: number;
    do {
      x = (Math.random() - 0.5) * 80;
      y = (Math.random() - 0.5) * 80;
      z = (Math.random() - 0.5) * 80;
    } while (x * x + y * y + z * z > 40 * 40);
    positions[i * 3] = x;
    positions[i * 3 + 1] = Math.abs(y); // keep stars in upper hemisphere
    positions[i * 3 + 2] = z;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.08,
    sizeAttenuation: true,
  });
  return new THREE.Points(geo, mat);
}

// ---------------------------------------------------------------------------
// Dead trees
// ---------------------------------------------------------------------------

function createTree(
  x: number,
  z: number,
  scale: number,
  rotY: number,
): THREE.Group {
  const group = new THREE.Group();
  const darkBark = new THREE.MeshToonMaterial({
    color: new THREE.Color("#1c1624"),
  });

  // Trunk — thin cylinder
  const trunkGeo = new THREE.CylinderGeometry(0.06, 0.12, 2.4, 5);
  const trunk = new THREE.Mesh(trunkGeo, darkBark);
  trunk.castShadow = true;
  trunk.position.y = 1.2;
  group.add(trunk);

  // Bare branch clusters — several small cones pointing in different directions.
  const branchDirections: Array<[number, number, number, number]> = [
    [0.5, 2.1, -0.2, 0.4],
    [-0.4, 1.8, 0.15, 0.35],
    [0.2, 2.4, 0.3, 0.3],
    [-0.15, 2.2, -0.3, 0.25],
  ];

  for (const [bx, by, bz, br] of branchDirections) {
    const branchGeo = new THREE.ConeGeometry(br, 0.9, 4);
    const branch = new THREE.Mesh(branchGeo, darkBark);
    branch.castShadow = true;
    branch.position.set(bx, by, bz);
    // Tilt outward so branches splay like bare winter twigs.
    branch.rotation.z = bx * 1.2;
    branch.rotation.x = bz * 1.2;
    group.add(branch);
  }

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  group.scale.setScalar(scale);
  return group;
}

function createDeadTrees(): THREE.Group[] {
  const treeData: Array<[number, number, number, number]> = [
    [-16, -6, 1.1, 0.4],
    [15, -4, 0.9, -0.6],
    [-14, -14, 1.3, 1.1],
    [18, -12, 1.0, -1.3],
    [-10, -22, 1.2, 0.8],
  ];
  return treeData.map(([x, z, scale, rotY]) => createTree(x, z, scale, rotY));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Add ground, moon, stars, and dead trees to the scene. */
export function createAtmosphere(scene: THREE.Scene): void {
  scene.add(createGround());
  scene.add(createMoon());
  scene.add(createStars());
  for (const tree of createDeadTrees()) {
    scene.add(tree);
  }
}
