import * as THREE from "three";

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

/** Convert a mouse event to normalised device coordinates stored in `mouse`. */
export function updateMouse(event: MouseEvent): void {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

/**
 * Cast a ray from the current mouse position and return the bugId of the first
 * intersected gravestone group, or null if nothing is hit.
 *
 * We collect all meshes from every group and intersect against them, then walk
 * up the Object3D hierarchy to find the group's userData.bugId.
 */
export function getHoveredBugId(
  camera: THREE.Camera,
  meshMap: Map<string, THREE.Group>,
): string | null {
  // Flatten all child meshes into a single array for the raycaster.
  const objects: THREE.Object3D[] = [];
  meshMap.forEach((group) => {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) objects.push(child);
    });
  });

  raycaster.setFromCamera(mouse, camera);
  const intersections = raycaster.intersectObjects(objects, false);

  if (intersections.length === 0) return null;

  // Walk up to find a parent with bugId in userData.
  let obj: THREE.Object3D | null = intersections[0].object;
  while (obj) {
    if (typeof obj.userData.bugId === "string") {
      return obj.userData.bugId as string;
    }
    obj = obj.parent;
  }
  return null;
}

/**
 * Project a mesh's world position to 2D screen coordinates so the overlay
 * component can be positioned directly above the hovered gravestone.
 */
export function getScreenPosition(
  mesh: THREE.Object3D,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
): { x: number; y: number } {
  const pos = new THREE.Vector3();
  mesh.getWorldPosition(pos);
  pos.project(camera);
  return {
    x: (pos.x * 0.5 + 0.5) * renderer.domElement.clientWidth,
    y: (-pos.y * 0.5 + 0.5) * renderer.domElement.clientHeight,
  };
}
