"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import type { BugRecord } from "@/lib/types";
import { createScene } from "@/three/scene";
import { createControls } from "@/three/controls";
import { createAtmosphere } from "@/three/atmosphere";
import { createLighting } from "@/three/lighting";
import { buildGraveyard } from "@/three/graveyard";
import {
  updateMouse,
  getHoveredBugId,
  getScreenPosition,
} from "@/three/raycaster";
import GraveyardOverlay from "@/components/GraveyardOverlay";
import ObituaryModal from "@/components/ObituaryModal";

interface GraveyardSceneProps {
  bugs: BugRecord[];
}

/** Full-viewport Three.js canvas + 2D overlay + obituary modal. */
export default function GraveyardScene({ bugs }: GraveyardSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Hover state exposed to the 2D overlay.
  const [hoveredBug, setHoveredBug] = useState<BugRecord | null>(null);
  const [screenPos, setScreenPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [selectedBug, setSelectedBug] = useState<BugRecord | null>(null);

  // Mutable refs for values needed inside the animation loop without causing
  // re-renders when they change.
  const hoveredIdRef = useRef<string | null>(null);
  const meshMapRef = useRef<Map<string, THREE.Group>>(new Map());
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    updateMouse(event);
  }, []);

  const handleCanvasClick = useCallback(() => {
    const id = hoveredIdRef.current;
    if (!id) return;
    const bug = bugs.find((b) => b.id === id) ?? null;
    setSelectedBug(bug);
  }, [bugs]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { renderer, scene, camera } = createScene(canvas);
    rendererRef.current = renderer;
    cameraRef.current = camera;

    // Orbit Controls — drag to rotate, scroll to zoom, right-click to pan.
    const controls = createControls(camera, canvas);

    createLighting(scene);
    createAtmosphere(scene);

    const meshMap = buildGraveyard(bugs, scene);
    meshMapRef.current = meshMap;

    let rafId = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);

      // Required for damping interpolation to work each frame.
      controls.update();

      // Raycasting — detect hovered gravestone.
      const newHoveredId = getHoveredBugId(camera, meshMap);

      if (newHoveredId !== hoveredIdRef.current) {
        // Reset emissive on previously hovered group.
        if (hoveredIdRef.current) {
          const prev = meshMap.get(hoveredIdRef.current);
          if (prev) {
            prev.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                (child.material as THREE.MeshToonMaterial).emissive.set(
                  0x000000,
                );
              }
            });
          }
        }

        // Apply highlight to newly hovered group.
        if (newHoveredId) {
          const next = meshMap.get(newHoveredId);
          if (next) {
            next.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                (child.material as THREE.MeshToonMaterial).emissive.set(
                  0x332244,
                );
              }
            });
          }
        }

        hoveredIdRef.current = newHoveredId;

        // Update cursor to signal interactivity.
        canvas.style.cursor = newHoveredId ? "pointer" : "grab";

        // Sync React state for the overlay (triggers re-render outside loop).
        if (newHoveredId) {
          const bug = bugs.find((b) => b.id === newHoveredId) ?? null;
          const group = meshMap.get(newHoveredId);
          const pos =
            group ? getScreenPosition(group, camera, renderer) : null;
          setHoveredBug(bug);
          setScreenPos(pos);
        } else {
          setHoveredBug(null);
          setScreenPos(null);
        }
      }

      renderer.render(scene, camera);
    };

    // Set initial cursor so the user knows they can drag.
    canvas.style.cursor = "grab";
    animate();

    // Handle resize.
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleCanvasClick);

    return () => {
      cancelAnimationFrame(rafId);
      controls.dispose();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleCanvasClick);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        }
      });
    };
  }, [bugs, handleMouseMove, handleCanvasClick]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%", cursor: "grab" }}
      />
      <GraveyardOverlay
        bug={hoveredBug}
        screenPosition={screenPos}
        onSelect={setSelectedBug}
      />
      <ObituaryModal
        bug={selectedBug}
        onClose={() => setSelectedBug(null)}
      />
    </>
  );
}
