"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { CharacterCustomization } from "@/src/data/characterCustomization";
import {
  animateVisiblePlayerShell,
  applyPlayerCustomization,
  createVisiblePlayerShell
} from "@/src/components/playerShell";

type CharacterPreviewCanvasProps = {
  customization: CharacterCustomization;
};

const PREVIEW_CENTER_Y = 0.88;
const PREVIEW_VIEW_HEIGHT = 1.9;
const PREVIEW_PLAYER_OFFSET_X = -0.16;
const PREVIEW_PLAYER_OFFSET_Y = 0.11;

export default function CharacterPreviewCanvas({ customization }: CharacterPreviewCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<THREE.Group | null>(null);
  const pivotRef = useRef<THREE.Group | null>(null);
  const customizationRef = useRef(customization);

  useEffect(() => {
    customizationRef.current = customization;

    if (playerRef.current) {
      applyPlayerCustomization(playerRef.current, customization);
    }
  }, [customization]);

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.05, 12);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    const clock = new THREE.Clock();

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    host.appendChild(renderer.domElement);

    camera.position.set(0, PREVIEW_CENTER_Y, 5);
    camera.lookAt(0, PREVIEW_CENTER_Y, 0);

    const pivot = new THREE.Group();
    pivot.name = "customizer-preview-pivot";
    pivot.position.set(PREVIEW_PLAYER_OFFSET_X, PREVIEW_PLAYER_OFFSET_Y, 0);
    const player = createVisiblePlayerShell(customizationRef.current);
    player.name = "customizer-preview-player";
    player.scale.setScalar(0.68);
    normalizePlayerForPreview(player);
    playerRef.current = player;
    pivotRef.current = pivot;
    pivot.add(player);
    scene.add(pivot);

    const floor = new THREE.Group();
    const floorDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.96, 72),
      new THREE.MeshBasicMaterial({
        color: 0x05202a,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide
      })
    );
    const floorRing = new THREE.Mesh(
      new THREE.RingGeometry(0.82, 0.86, 72),
      new THREE.MeshBasicMaterial({
        color: 0x9dff22,
        transparent: true,
        opacity: 0.58,
        side: THREE.DoubleSide
      })
    );

    floorDisc.rotation.x = -Math.PI / 2;
    floorRing.rotation.x = -Math.PI / 2;
    floor.position.y = -0.025;
    floor.add(floorDisc, floorRing);
    scene.add(floor);

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      const aspect = width / height;
      const viewHeight = PREVIEW_VIEW_HEIGHT;

      renderer.setSize(width, height, false);
      camera.left = (-viewHeight * aspect) / 2;
      camera.right = (viewHeight * aspect) / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let animationFrame = 0;
    const render = () => {
      const time = clock.getElapsedTime();

      animationFrame = window.requestAnimationFrame(render);
      pivot.rotation.y = Math.sin(time * 0.5) * 0.16;
      floorRing.rotation.z = time * 0.22;
      animateVisiblePlayerShell(player, false, time * 2.8, "bigSmile");
      renderer.render(scene, camera);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      playerRef.current = null;
      pivotRef.current = null;
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="customizer-preview-canvas" ref={hostRef} aria-hidden="true" />;
}

function normalizePlayerForPreview(player: THREE.Group) {
  player.position.set(0, 0, 0);
  player.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(player);
  const center = box.getCenter(new THREE.Vector3());

  player.position.x -= center.x;
  player.position.y -= box.min.y;
  player.position.z -= center.z;
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => material.dispose());
  });
}
