"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { GamePhase } from "@/src/data/story";

type PortalVerseCanvasProps = {
  phase: GamePhase;
  analysisComplete: boolean;
  portalCharging?: boolean;
  portalReady?: boolean;
  onPortalGunClick?: () => void;
  onPortalClick?: () => void;
};

type Rig = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  portalGroup: THREE.Group;
  portalModelGroup: THREE.Group;
  portalGunGroup: THREE.Group;
  beam: THREE.Mesh;
  core: THREE.Mesh;
  particles: THREE.Points;
};

type PortalMaterial = THREE.Material & {
  map?: THREE.Texture | null;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
};

type VectorTuple = readonly [number, number, number];

const PORTAL_GUN_TUNING = {
  // Edit these values to move/aim the 3D portal gun.
  position: [-1.72, -1.2, 1.16] as VectorTuple,
  rotation: [-Math.PI / 2 + 0.03, -0.5, Math.PI + 0.82] as VectorTuple,
  scale: 0.92,
  clickBoxPosition: [-1.72, -1.18, 1.12] as VectorTuple,
  clickBoxRotation: [-Math.PI / 2 + 0.03, -0.5, Math.PI + 0.82] as VectorTuple,
  clickBoxSize: [2.45, 1.3, 1.34] as VectorTuple
} as const;

const PORTAL_BEAM_TUNING = {
  // Beam starts at the gun barrel and ends at the portal center.
  start: [-1.03, -0.54, 1.02] as VectorTuple,
  end: [0.02, -0.11, 0.16] as VectorTuple,
  radius: 0.045
} as const;

const PORTAL_CLICK_TUNING = {
  radius: 2.35,
  position: [0, -0.18, 0.16] as VectorTuple
} as const;

export default function PortalVerseCanvas({
  phase,
  analysisComplete,
  portalCharging = false,
  portalReady = false,
  onPortalGunClick,
  onPortalClick
}: PortalVerseCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rigRef = useRef<Rig | null>(null);
  const frameRef = useRef<number | null>(null);
  const phaseRef = useRef(phase);
  const analysisCompleteRef = useRef(analysisComplete);
  const portalChargingRef = useRef(portalCharging);
  const portalReadyRef = useRef(portalReady);
  const onPortalGunClickRef = useRef(onPortalGunClick);
  const onPortalClickRef = useRef(onPortalClick);

  useEffect(() => {
    phaseRef.current = phase;
    analysisCompleteRef.current = analysisComplete;
    portalChargingRef.current = portalCharging;
    portalReadyRef.current = portalReady;
    onPortalGunClickRef.current = onPortalGunClick;
    onPortalClickRef.current = onPortalClick;
  }, [analysisComplete, onPortalClick, onPortalGunClick, phase, portalCharging, portalReady]);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, mount.clientWidth / mount.clientHeight, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    const portalGroup = new THREE.Group();
    const portalModelGroup = new THREE.Group();
    const portalGunGroup = new THREE.Group();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const beamStart = vectorFromTuple(PORTAL_BEAM_TUNING.start);
    const beamEnd = vectorFromTuple(PORTAL_BEAM_TUNING.end);
    const gunClickBoxPosition = vectorFromTuple(PORTAL_GUN_TUNING.clickBoxPosition);
    const gunClickBoxRotation = vectorFromTuple(PORTAL_GUN_TUNING.clickBoxRotation);
    const gunClickBoxSize = vectorFromTuple(PORTAL_GUN_TUNING.clickBoxSize);
    const currentBeamEnd = new THREE.Vector3();
    const beamDirection = new THREE.Vector3();
    const beamMidpoint = new THREE.Vector3();
    const cylinderUp = new THREE.Vector3(0, 1, 0);
    let pointerStartX = 0;
    let pointerStartY = 0;

    camera.position.set(0, 0.1, 7.3);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xeafff2, 1.18));

    const greenLight = new THREE.PointLight(0x92ff2d, 36, 24);
    greenLight.position.set(0.4, 0.6, 3.4);
    scene.add(greenLight);

    const blueLight = new THREE.PointLight(0x249dff, 22, 18);
    blueLight.position.set(-3.3, 2, 2);
    scene.add(blueLight);

    const gunKeyLight = new THREE.PointLight(0xffffff, 9, 12);
    gunKeyLight.position.set(-3.2, -0.9, 4.2);
    scene.add(gunKeyLight);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(1.42, 64, 36),
      new THREE.MeshBasicMaterial({
        color: 0xa7ff32,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );

    const outerRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.35, 0.14, 22, 180),
      new THREE.MeshStandardMaterial({
        color: 0x8fff20,
        emissive: 0x78ff1c,
        emissiveIntensity: 2.1,
        roughness: 0.18,
        transparent: true,
        opacity: 0.34,
        depthWrite: false
      })
    );
    outerRing.scale.set(0.72, 0.83, 1);
    outerRing.position.y = -0.18;

    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.82, 0.075, 18, 150),
      new THREE.MeshStandardMaterial({
        color: 0xd8ff3f,
        emissive: 0xa4ff24,
        emissiveIntensity: 1.8,
        roughness: 0.14,
        transparent: true,
        opacity: 0.4,
        depthWrite: false
      })
    );
    innerRing.scale.set(0.75, 0.87, 1);
    innerRing.position.y = -0.18;

    const portalClickTarget = new THREE.Mesh(
      new THREE.CircleGeometry(PORTAL_CLICK_TUNING.radius, 72),
      createInvisibleHotspotMaterial()
    );
    portalClickTarget.position.set(...PORTAL_CLICK_TUNING.position);
    portalClickTarget.userData.portalClickTarget = true;

    const gunClickTarget = new THREE.Mesh(
      new THREE.BoxGeometry(gunClickBoxSize.x, gunClickBoxSize.y, gunClickBoxSize.z),
      createInvisibleHotspotMaterial()
    );
    gunClickTarget.position.copy(gunClickBoxPosition);
    gunClickTarget.rotation.set(gunClickBoxRotation.x, gunClickBoxRotation.y, gunClickBoxRotation.z);
    gunClickTarget.userData.portalGunClickTarget = true;

    portalGroup.add(core, outerRing, innerRing, portalModelGroup, portalClickTarget);
    scene.add(portalGroup);
    scene.add(portalGunGroup);
    scene.add(gunClickTarget);

    const particles = createParticles();
    scene.add(particles);

    const gltfLoader = new GLTFLoader();
    const fbxLoader = new FBXLoader();

    gltfLoader.load("/assets/portal-3d/green-portal.glb", (gltf) => {
      const model = gltf.scene;
      const uprightPortal = new THREE.Group();
      preparePortalModel(model);
      normalizePortalAsset(model, 4.05);
      uprightPortal.rotation.x = Math.PI / 2;
      uprightPortal.position.set(0, -0.18, -0.12);
      uprightPortal.add(model);
      portalModelGroup.add(uprightPortal);
    });

    fbxLoader.load("/assets/portal-gun/portal-gun.fbx", (model) => {
      preparePortalGun(model);
      normalizeAsset(model, PORTAL_GUN_TUNING.scale, vectorFromTuple(PORTAL_GUN_TUNING.position));
      model.rotation.set(...PORTAL_GUN_TUNING.rotation);
      portalGunGroup.add(model);
    });

    const beam = new THREE.Mesh(
      createBeamGeometry(PORTAL_BEAM_TUNING.radius),
      new THREE.MeshBasicMaterial({
        color: 0x9dff22,
        transparent: true,
        opacity: 0.52,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      })
    );
    beam.renderOrder = 8;
    scene.add(beam);

    const rig: Rig = { renderer, scene, camera, portalGroup, portalModelGroup, portalGunGroup, beam, core, particles };
    rigRef.current = rig;

    const clock = new THREE.Clock();
    let lastPhase: GamePhase = phaseRef.current;
    let phaseStartedAt = 0;
    let lastCharging = portalChargingRef.current;
    let chargingStartedAt = 0;

    const animate = () => {
      const time = clock.getElapsedTime();
      const currentPhase = phaseRef.current;
      const isCharging = portalChargingRef.current;
      const isReady = portalReadyRef.current;
      if (currentPhase !== lastPhase) {
        lastPhase = currentPhase;
        phaseStartedAt = time;
      }

      if (isCharging !== lastCharging) {
        lastCharging = isCharging;
        chargingStartedAt = time;
      }

      const phaseAge = time - phaseStartedAt;
      const chargingAge = time - chargingStartedAt;
      const isPortal = currentPhase === "portal";
      const isTravel = currentPhase === "travel";
      const isFinal = currentPhase === "final";
      const travelProgress = isTravel ? easeOutCubic(THREE.MathUtils.clamp(phaseAge / 1.35, 0, 1)) : 0;
      const chargeProgress = isPortal && isCharging ? easeOutCubic(THREE.MathUtils.clamp(chargingAge / 1.15, 0, 1)) : 0;
      const showPortal = (isPortal && (isReady || isCharging)) || isFinal || (isTravel && phaseAge < 1.42);
      const pulse = 1 + Math.sin(time * 5.6) * 0.055;
      const portalOpenScale = isCharging ? THREE.MathUtils.lerp(0.08, 0.92, chargeProgress) : 0.92;
      const baseScale = isFinal ? 0.54 : isTravel ? 0.92 + travelProgress * 3.85 : portalOpenScale;

      portalGroup.visible = showPortal;
      portalGunGroup.visible = isPortal;
      particles.visible = showPortal;
      portalGroup.rotation.z = isTravel ? time * 0.48 : Math.sin(time * 0.78) * 0.028;
      portalGroup.rotation.x = Math.sin(time * 0.7) * (isTravel ? 0.12 : 0.035);
      portalGroup.position.x = 0;
      portalGroup.position.y = isFinal ? -0.26 : isTravel ? -0.36 + travelProgress * 0.18 : -0.36;
      portalGroup.scale.setScalar(baseScale * (isTravel ? 1 : pulse));

      portalModelGroup.rotation.z = time * (isTravel ? 1.12 : 0.42);
      core.scale.setScalar(1 + Math.sin(time * 7.2) * 0.1 + (analysisCompleteRef.current ? 0.12 : 0));
      particles.rotation.y = time * 0.05;
      particles.rotation.z = -time * 0.04;
      beam.visible = isPortal && isCharging;
      currentBeamEnd.lerpVectors(beamStart, beamEnd, chargeProgress);
      beamDirection.subVectors(currentBeamEnd, beamStart);
      const beamLengthRaw = beamDirection.length();
      const beamLength = Math.max(beamLengthRaw, 0.001);
      beamMidpoint.copy(beamStart).addScaledVector(beamDirection, 0.5);
      beam.position.copy(beamMidpoint);
      if (beamLengthRaw < 0.001) {
        beamDirection.subVectors(beamEnd, beamStart);
      }
      beam.quaternion.setFromUnitVectors(cylinderUp, beamDirection.normalize());
      beam.scale.setScalar(1 + Math.sin(time * 36) * 0.08);
      beam.scale.y = beamLength;
      (beam.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(0.08, 0.66, Math.sin(chargeProgress * Math.PI));

      camera.position.x = isTravel ? 0 : Math.sin(time * 0.35) * 0.08;
      camera.position.y = isTravel ? 0.1 : 0.1 + Math.sin(time * 0.42) * 0.04;
      camera.position.z = isFinal ? 7.8 : isTravel ? 7.3 - travelProgress * 2.4 : 7.3;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);

    const updatePointer = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);
    };

    const hasHit = (object: THREE.Object3D) => raycaster.intersectObject(object, true).length > 0;

    const handlePointerDown = (event: PointerEvent) => {
      if (phaseRef.current !== "portal") {
        return;
      }

      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      event.preventDefault();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (phaseRef.current !== "portal") {
        mount.dataset.hotspot = "none";
        return;
      }

      updatePointer(event);

      const canFireGun = !portalChargingRef.current && !portalReadyRef.current;
      const canEnterPortal = portalReadyRef.current;
      const isOverGun = canFireGun && hasHit(gunClickTarget);
      const isOverPortal = canEnterPortal && hasHit(portalClickTarget);
      mount.dataset.hotspot = isOverGun ? "gun" : isOverPortal ? "portal" : "none";
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (phaseRef.current !== "portal") {
        return;
      }

      const moved = Math.hypot(event.clientX - pointerStartX, event.clientY - pointerStartY);

      if (moved > 10) {
        return;
      }

      updatePointer(event);

      if (!portalChargingRef.current && !portalReadyRef.current && hasHit(gunClickTarget)) {
        onPortalGunClickRef.current?.();
        event.preventDefault();
        return;
      }

      if (portalReadyRef.current && hasHit(portalClickTarget)) {
        onPortalClickRef.current?.();
        event.preventDefault();
      }
    };

    const resize = () => {
      if (!mountRef.current || !rigRef.current) {
        return;
      }

      const { clientWidth, clientHeight } = mountRef.current;
      rigRef.current.camera.aspect = clientWidth / clientHeight;
      rigRef.current.camera.updateProjectionMatrix();
      rigRef.current.renderer.setSize(clientWidth, clientHeight);
    };

    window.addEventListener("resize", resize);
    mount.addEventListener("pointerdown", handlePointerDown);
    mount.addEventListener("pointermove", handlePointerMove);
    mount.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("resize", resize);
      mount.removeEventListener("pointerdown", handlePointerDown);
      mount.removeEventListener("pointermove", handlePointerMove);
      mount.removeEventListener("pointerup", handlePointerUp);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();

          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      renderer.domElement.remove();
      rigRef.current = null;
    };
  }, []);

  return <div className="portal-canvas" ref={mountRef} aria-hidden="true" data-phase={phase} />;
}

function preparePortalModel(model: THREE.Object3D) {
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    child.castShadow = false;
    child.receiveShadow = false;
    child.frustumCulled = false;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    const mappedMaterial = materials.map((material) => material as PortalMaterial).find((material) => material.map);
    const map = mappedMaterial?.map ?? null;

    if (map) {
      map.colorSpace = THREE.SRGBColorSpace;
      map.needsUpdate = true;
    }

    child.material = new THREE.MeshBasicMaterial({
      map,
      color: map ? 0xffffff : 0xa6ff22,
      vertexColors: !map && !!child.geometry.getAttribute("color"),
      transparent: true,
      opacity: map ? 1 : 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: map ? THREE.NormalBlending : THREE.AdditiveBlending
    });
  });
}

function normalizePortalAsset(model: THREE.Object3D, targetSize: number) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = targetSize / Math.max(size.x, size.y, size.z, 0.001);

  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
}

function vectorFromTuple(tuple: VectorTuple) {
  return new THREE.Vector3(tuple[0], tuple[1], tuple[2]);
}

function createBeamGeometry(radius: number) {
  return new THREE.CylinderGeometry(radius * 0.42, radius, 1, 22, 1, true);
}

function createInvisibleHotspotMaterial() {
  return new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide
  });
}

function preparePortalGun(model: THREE.Object3D) {
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    child.castShadow = false;
    child.receiveShadow = false;
    child.frustumCulled = false;

    const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
    const styledMaterials = sourceMaterials.map((material) => createPortalGunMaterial(child.name, material));
    child.material = Array.isArray(child.material) ? styledMaterials : styledMaterials[0];
  });
}

function createPortalGunMaterial(meshName: string, material: THREE.Material) {
  const marker = `${meshName} ${material.name}`.toLowerCase();
  const source = material as PortalMaterial & { color?: THREE.Color };
  const sourceColor = source.color?.getHex() ?? 0xf0f2ea;
  const isMainCapsule = meshName.toLowerCase() === "body28";
  const isGreen = marker.includes("green");
  const isRed = marker.includes("red") || meshName.toLowerCase() === "body15" || meshName.toLowerCase() === "body37";
  const isDarkPlastic = marker.includes("acetal");
  const isSteel = marker.includes("steel");
  const isBodyShell = marker.includes("aluminum");

  if (isMainCapsule) {
    return new THREE.MeshStandardMaterial({
      color: 0x9dff72,
      emissive: 0x69ff28,
      emissiveIntensity: 1.55,
      roughness: 0.16,
      metalness: 0.02,
      transparent: true,
      opacity: 0.84,
      side: THREE.DoubleSide
    });
  }

  if (isGreen) {
    return new THREE.MeshStandardMaterial({
      color: 0x8dff58,
      emissive: 0x58ff20,
      emissiveIntensity: 0.82,
      roughness: 0.22,
      metalness: 0.04,
      side: THREE.DoubleSide
    });
  }

  if (isRed) {
    return new THREE.MeshStandardMaterial({
      color: 0xe56c57,
      emissive: 0x3a0805,
      emissiveIntensity: 0.12,
      roughness: 0.34,
      metalness: 0.04,
      side: THREE.DoubleSide
    });
  }

  if (isDarkPlastic) {
    return new THREE.MeshStandardMaterial({
      color: 0x121714,
      emissive: 0x010302,
      emissiveIntensity: 0.08,
      roughness: 0.62,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
  }

  if (isSteel) {
    return new THREE.MeshStandardMaterial({
      color: 0x5d625f,
      emissive: 0x080a09,
      emissiveIntensity: 0.05,
      roughness: 0.42,
      metalness: 0.58,
      side: THREE.DoubleSide
    });
  }

  if (isBodyShell) {
    return new THREE.MeshStandardMaterial({
      color: 0xf1f2e9,
      emissive: 0x2b3028,
      emissiveIntensity: 0.2,
      roughness: 0.46,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
  }

  return new THREE.MeshStandardMaterial({
    color: sourceColor,
    emissive: 0x101410,
    emissiveIntensity: 0.1,
    roughness: 0.42,
    metalness: 0.08,
    side: THREE.DoubleSide
  });
}

function normalizeAsset(model: THREE.Object3D, targetHeight: number, targetPosition: THREE.Vector3) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = targetHeight / Math.max(size.y, 0.001);

  model.scale.setScalar(scale);
  model.position.set(
    targetPosition.x - center.x * scale,
    targetPosition.y - center.y * scale,
    targetPosition.z - center.z * scale
  );
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

function createParticles() {
  const particleCount = 260;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const palette = [new THREE.Color(0x9aff2d), new THREE.Color(0xd8ff3f), new THREE.Color(0x35f4b8), new THREE.Color(0xffffff)];

  for (let index = 0; index < particleCount; index += 1) {
    const radius = 1.9 + Math.random() * 3.2;
    const angle = Math.random() * Math.PI * 2;
    const color = palette[index % palette.length];

    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = Math.sin(angle) * radius * 0.66;
    positions[index * 3 + 2] = (Math.random() - 0.5) * 1.6;
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 0.038,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    })
  );
}
