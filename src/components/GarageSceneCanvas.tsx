"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { defaultCharacterCustomization, type CharacterCustomization } from "@/src/data/characterCustomization";
import {
  animateVisiblePlayerShell,
  applyPlayerCustomization,
  createVisiblePlayerShell,
  getCustomizationKey,
  type FaceMood
} from "@/src/components/playerShell";
import { decorativePhotos } from "@/src/data/story";

type GarageSceneCanvasProps = {
  isAnalyzing: boolean;
  customization?: CharacterCustomization;
  onAnalysisStart?: () => void;
  onPhotoOpen?: (photoId: string) => void;
  onCustomizerOpen?: () => void;
};

type DeviceOrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<PermissionState>;
};

type MaterialWithMap = THREE.Material & {
  color?: THREE.Color;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
  map?: THREE.Texture | null;
  metalness?: number;
  roughness?: number;
};

type PhotoPlacement = {
  id: string;
  label: string;
  src?: string;
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
  height: number;
  accent: string;
};

type VectorTuple = readonly [number, number, number];
type FloorPoint = readonly [number, number];
type BlockedFloorArea = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

type InteractionPrompt = "photo" | "analysis" | "ball" | "carriedBall" | "mirror" | null;
type HairPartName = "cap" | "crown" | "front" | "bridge" | "bun";
type HairTransformPatch = {
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  scale?: number;
  sx?: number;
  sy?: number;
  sz?: number;
  visible?: boolean;
};

type GarageDebugApi = {
  setHair: (part: HairPartName, patch: HairTransformPatch) => void;
  getHair: () => Record<HairPartName, Record<string, number | boolean>>;
  printHairControls: () => void;
};

type SportsBallKind = "football" | "basketball";
type SportsBallState = {
  id: string;
  kind: SportsBallKind;
  root: THREE.Group;
  radius: number;
  velocity: THREE.Vector3;
  currentScale: number;
  isCarried: boolean;
};

declare global {
  interface Window {
    __garageDebug?: GarageDebugApi;
  }
}

const TEXTURE_FILES = new Set([
  "background.png",
  "cable-dark.png",
  "cable-light.png",
  "ceiling.png",
  "floor.png",
  "interior.png",
  "wall.png",
  "wood.png"
]);

const TEXTURE_ASSETS = {
  background: "Background.png",
  cableDark: "Cable-Dark.png",
  cableLight: "Cable-Light.png",
  ceiling: "Ceiling.png",
  floor: "Floor.png",
  interior: "Interior.png",
  wall: "Wall.png",
  wood: "Wood.png"
} as const;

type GarageTextureKey = keyof typeof TEXTURE_ASSETS;

const MIRROR_TEXTURE_ASSETS: Record<string, string> = {
  "mirrora_mirrora_mat_basecolor.1001.png": "mirrorA_mirrorA_Mat_BaseColor.1001.png",
  "mirrora_mirrora_mat_metalness.1001.png": "mirrorA_mirrorA_Mat_Metalness.1001.png",
  "mirrora_mirrora_mat_normal.1001.png": "mirrorA_mirrorA_Mat_Normal.1001.png",
  "mirrora_mirrora_mat_roughness.1001.png": "mirrorA_mirrorA_Mat_Roughness.1001.png"
};

const CAMERA_HOME = new THREE.Vector3(0, 1.36, 0.08);
const FIXED_CAMERA_PITCH = -0.04;
const ROOM_WIDTH = 9.7;
const ROOM_DEPTH = 9.2;
const ROOM_HEIGHT = 3.95;
const PLAYER_MODEL_URL = "/assets/models/cartoon-runner-v2.glb";
const SNEAKER_MODEL_URL = "/assets/models/stylized-air-jordan/stylized-air-jordan.fbx";
const ENABLE_SNEAKER_FBX_OVERLAY = false;
const MIRROR_MODEL_URL = "/assets/models/mirror-a/source/mirrorA.fbx";
const PLAYER_START = new THREE.Vector3(-1.76, 0.02, 0.98);
const PLAYER_HEIGHT = 1.26;
const PLAYER_WALK_SPEED = 1.15;
const PLAYER_RUN_SPEED = 1.72;
const PLAYER_JUMP_SPEED = 2.55;
const PLAYER_GRAVITY = 7.4;
const PLAYER_CAMERA_DISTANCE = 2.18;
const PLAYER_CAMERA_HEIGHT = 1.25;
const PLAYER_LOOK_HEIGHT = 0.92;
const CAMERA_COLLISION_CLEARANCE = 0.14;
const CAMERA_MIN_DISTANCE = 0.72;
const PHOTO_INTERACTION_RADIUS = 1.62;
const PHOTO_SMILE_RADIUS = 2.5;
const ANALYSIS_INTERACTION_RADIUS = 1.55;
const PLAYER_COLLISION_RADIUS = 0.24;
const PLAYER_RENDER_ORDER = 2000;
const BALL_INTERACTION_RADIUS = 0.96;
const BALL_THROW_SPEED = 3.1;
const BALL_KICK_SPEED = 3.35;
const BALL_FRICTION = 2.2;
const BALL_GRAVITY = 4.8;
const BALL_RENDER_ORDER = 80;
const MIRROR_INTERACTION_RADIUS = 1.16;
const MIRROR_RENDER_ORDER = 70;
const ANALYSIS_LABEL_RENDER_ORDER = 180;
const INTERACTION_PROMPT_LABELS: Record<Exclude<InteractionPrompt, null>, string> = {
  analysis: "Press E",
  photo: "Press E",
  ball: "Press E / F",
  carriedBall: "Press E",
  mirror: "Press E"
};
const WALKABLE_FLOOR: FloorPoint[] = [
  [-4.42, 3.62],
  [4.28, 3.62],
  [4.28, -3.68],
  [-4.42, -3.68]
];
const BLOCKED_FLOOR_AREAS: BlockedFloorArea[] = [
  { minX: -4.42, maxX: -3.22, minZ: -3.46, maxZ: -0.2 },
  { minX: -4.42, maxX: -2.82, minZ: -0.12, maxZ: 1.46 },
  { minX: -4.42, maxX: -3.04, minZ: 1.44, maxZ: 3.5 },
  { minX: -3.28, maxX: 4.08, minZ: -3.62, maxZ: -1.52 },
  { minX: 3.3, maxX: 4.22, minZ: -2.24, maxZ: 3.26 },
  { minX: -0.18, maxX: 4.16, minZ: 1.82, maxZ: 3.52 },
  { minX: -1.4, maxX: 1.08, minZ: -2.24, maxZ: -1.08 },
  { minX: -0.26, maxX: 0.92, minZ: 2.06, maxZ: 3.52 },
  { minX: 0.08, maxX: 0.98, minZ: 0.1, maxZ: 0.86 }
];
const ANALYSIS_STATION_TUNING = {
  // Edit this block to fine-tune the START chemistry station.
  // x: left/right on the visible workbench, y: tabletop height, z: depth from the camera.
  position: [-3.5, 0.9, 0.8] as VectorTuple,
  rotation: [0, 1.6, 0] as VectorTuple,
  scale: 0.85,
  hitboxPosition: [0, 0.34, 0.02] as VectorTuple,
  hitboxSize: [1.85, 0.9, 0.92] as VectorTuple
} as const;

const MIRROR_STATION_TUNING = {
  position: [0.52, 0, 0.44] as VectorTuple,
  rotation: [0, -0.22, 0] as VectorTuple,
  scale: 1,
  hitboxPosition: [0, 0.84, 0.08] as VectorTuple,
  hitboxSize: [0.84, 1.68, 0.56] as VectorTuple
} as const;

const PHOTO_ACCENTS = ["#9dff22", "#28f0d2", "#8b4dff", "#ff4cab", "#dcff3f", "#47f7ff"] as const;
const PHOTO_HIGHLIGHT_COLOR = "#fff36a";

const PHOTO_LAYOUTS_BY_ID: Record<string, Omit<PhotoPlacement, "id" | "label" | "src" | "accent">> = {
  "memory-01": {
    position: [3.84, 1.88, 0.26],
    rotation: [0, -Math.PI / 2, 0.02],
    width: 0.68,
    height: 0.96
  },
  "memory-02": {
    position: [-0.72, 2.24, -2.38],
    rotation: [0, 0.01, 0.07],
    width: 0.74,
    height: 1.04
  },
  "memory-03": {
    position: [0.86, 2.24, -2.38],
    rotation: [0, 0.01, -0.05],
    width: 0.78,
    height: 1.1
  },
  "memory-04": {
    position: [2.2, 2.24, -2.38],
    rotation: [0, -0.02, 0.06],
    width: 0.74,
    height: 1.04
  },
  "memory-05": {
    position: [4.12, 1.68, -1.55],
    rotation: [0, -Math.PI / 2, 0.04],
    width: 0.78,
    height: 1.1
  },
  "memory-06": {
    position: [3.5, 1.92, 2.05],
    rotation: [0, -Math.PI / 2, -0.03],
    width: 0.74,
    height: 1.04
  },
  "memory-07": {
    position: [4, 1.82, -0.66],
    rotation: [0, -Math.PI / 2, -0.04],
    width: 0.68,
    height: 0.96
  },
  "memory-08": {
    position: [3.66, 1.82, 1.18],
    rotation: [0, -Math.PI / 2, 0.04],
    width: 0.68,
    height: 0.96
  }
};

const PHOTO_FALLBACK_LAYOUTS = Object.values(PHOTO_LAYOUTS_BY_ID);

const PHOTO_PLACEMENTS: PhotoPlacement[] = decorativePhotos.map((photo, index) => {
  const explicitLayout = PHOTO_LAYOUTS_BY_ID[photo.id];
  const layout = explicitLayout ?? PHOTO_FALLBACK_LAYOUTS[index % PHOTO_FALLBACK_LAYOUTS.length];
  const cycle = explicitLayout ? 0 : Math.floor(index / PHOTO_FALLBACK_LAYOUTS.length);
  const cycleOffset = cycle * 0.16;

  return {
    id: photo.id,
    label: photo.label,
    src: photo.src,
    position: [layout.position[0], layout.position[1] + cycleOffset, layout.position[2] - cycleOffset * 0.3],
    rotation: [layout.rotation[0], layout.rotation[1], layout.rotation[2]],
    width: layout.width,
    height: layout.height,
    accent: PHOTO_ACCENTS[index % PHOTO_ACCENTS.length]
  };
});

export default function GarageSceneCanvas({
  isAnalyzing,
  customization = defaultCharacterCustomization,
  onAnalysisStart,
  onPhotoOpen,
  onCustomizerOpen
}: GarageSceneCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const analyzingRef = useRef(isAnalyzing);
  const customizationRef = useRef(customization);
  const onAnalysisStartRef = useRef(onAnalysisStart);
  const onPhotoOpenRef = useRef(onPhotoOpen);
  const onCustomizerOpenRef = useRef(onCustomizerOpen);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [interactionPrompt, setInteractionPrompt] = useState<InteractionPrompt>(null);

  useEffect(() => {
    analyzingRef.current = isAnalyzing;
  }, [isAnalyzing]);

  useEffect(() => {
    customizationRef.current = customization;
  }, [customization]);

  useEffect(() => {
    onAnalysisStartRef.current = onAnalysisStart;
  }, [onAnalysisStart]);

  useEffect(() => {
    onPhotoOpenRef.current = onPhotoOpen;
  }, [onPhotoOpen]);

  useEffect(() => {
    onCustomizerOpenRef.current = onCustomizerOpen;
  }, [onCustomizerOpen]);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(88, mount.clientWidth / mount.clientHeight, 0.05, 80);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    const garageGroup = new THREE.Group();
    const roomGroup = new THREE.Group();
    const photoGroup = new THREE.Group();
    const analysisGroup = new THREE.Group();
    const sportsGroup = new THREE.Group();
    const mirrorGroup = new THREE.Group();
    const playerScene = new THREE.Scene();
    const interactivePhotos: THREE.Object3D[] = [];
    const interactiveAnalysisObjects: THREE.Object3D[] = [];
    const interactiveSportsObjects: THREE.Object3D[] = [];
    const interactiveMirrorObjects: THREE.Object3D[] = [];
    const raycaster = new THREE.Raycaster();
    const cameraRaycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const clock = new THREE.Clock();
    const targetLook = { yaw: 0 };
    const currentLook = { yaw: 0 };
    const pressedKeys = new Set<string>();
    const virtualMove = new THREE.Vector2();
    const moveVector = new THREE.Vector3();
    const cameraForward = new THREE.Vector3();
    const cameraRight = new THREE.Vector3();
    const cameraCollisionDirection = new THREE.Vector3();
    const desiredCamera = new THREE.Vector3();
    const desiredTarget = new THREE.Vector3();
    const photoWorldPosition = new THREE.Vector3();
    const ballWorldPosition = new THREE.Vector3();
    const ballActionForward = new THREE.Vector3();
    const playerState = {
      root: null as THREE.Group | null,
      modelRoot: null as THREE.Group | null,
      mixer: null as THREE.AnimationMixer | null,
      actions: {} as Record<string, THREE.AnimationAction>,
      activeAction: null as THREE.AnimationAction | null,
      position: PLAYER_START.clone(),
      yaw: Math.PI,
      nearestPhotoId: null as string | null,
      nearestBallId: null as string | null,
      carriedBallId: null as string | null,
      nearestAnalysis: false,
      nearestMirror: false,
      walkTime: 0,
      jumpOffset: 0,
      jumpVelocity: 0,
      faceMood: "neutral" as FaceMood
    };
    let pointerActive = false;
    let pointerMode: "look" | "move" | null = null;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let lastPointerX = 0;
    let orientationPermissionRequested = false;
    let appliedCustomizationKey = "";

    camera.position.copy(CAMERA_HOME);
    camera.rotation.order = "YXZ";

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14;
    renderer.autoClear = false;
    mount.appendChild(renderer.domElement);

    scene.fog = new THREE.Fog(0x06111f, 6.2, 13.5);
    scene.add(roomGroup);
    scene.add(garageGroup);
    scene.add(photoGroup);
    scene.add(analysisGroup);
    scene.add(sportsGroup);
    scene.add(mirrorGroup);
    scene.add(new THREE.AmbientLight(0xd8f7e4, 2.35));

    const playableCharacter = createVisiblePlayerShell(customizationRef.current);
    playableCharacter.scale.setScalar(0.72);
    playableCharacter.position.copy(playerState.position);
    playableCharacter.rotation.y = playerState.yaw;
    playableCharacter.renderOrder = PLAYER_RENDER_ORDER;
    playerState.root = playableCharacter;
    playerScene.add(playableCharacter);
    installGarageDebugControls(playableCharacter);
    mount.dataset.player = "shell";

    const overhead = new THREE.DirectionalLight(0xe9fff0, 3.3);
    overhead.position.set(1.8, 4.7, 2.8);
    scene.add(overhead);

    const acidLight = new THREE.PointLight(0xa6ff26, 9.2, 14);
    acidLight.position.set(-2.8, 1.35, 2.1);
    scene.add(acidLight);

    const cyanLight = new THREE.PointLight(0x21f1d5, 7.4, 13);
    cyanLight.position.set(3.2, 1.5, 1.2);
    scene.add(cyanLight);

    const violetLight = new THREE.PointLight(0x8b4dff, 5.8, 12);
    violetLight.position.set(0.4, 2.5, -3.7);
    scene.add(violetLight);

    const manager = new THREE.LoadingManager();
    manager.setURLModifier((url) => {
      const normalized = url.replaceAll("\\", "/");
      const filename = normalized.split("/").pop()?.toLowerCase();

      if (filename && TEXTURE_FILES.has(filename)) {
        return `/assets/garage-fan-art/textures/${filenameToAssetName(filename)}`;
      }

      if (filename && MIRROR_TEXTURE_ASSETS[filename]) {
        return `/assets/models/mirror-a/textures/${MIRROR_TEXTURE_ASSETS[filename]}`;
      }

      return url;
    });

    const loader = new FBXLoader(manager);
    const characterLoader = new GLTFLoader(manager);
    const textureLoader = new THREE.TextureLoader(manager);
    const garageTextures = loadGarageTextures(textureLoader, renderer);
    const sportsBalls = createSportsBalls();

    roomGroup.add(createInteriorRoom(garageTextures));
    photoGroup.add(createPhotoRope());
    const photoPanels = PHOTO_PLACEMENTS.map((placement, index) => createPhotoPanel(placement, index, textureLoader, renderer));
    interactivePhotos.push(...photoPanels);
    photoGroup.add(...photoPanels);
    const analysisStation = createAnalysisStation();
    collectAnalysisTriggers(analysisStation, interactiveAnalysisObjects);
    analysisGroup.add(analysisStation);
    const mirrorStation = createMirrorStation();
    collectMirrorTriggers(mirrorStation, interactiveMirrorObjects);
    mirrorGroup.add(mirrorStation);
    const cameraColliders = [roomGroup, garageGroup, analysisGroup, mirrorGroup];
    loadMirrorAsset(loader, mirrorStation);
    sportsGroup.add(...sportsBalls.map((ball) => ball.root));
    interactiveSportsObjects.push(...sportsBalls.map((ball) => ball.root));
    if (ENABLE_SNEAKER_FBX_OVERLAY) {
      loadSneakerAsset(loader, playableCharacter);
    }

    loader.load(
      "/assets/garage-fan-art/source/Rick%20and%20Morty%20Garage.fbx",
      (model) => {
        prepareGarageModel(model, garageTextures);
        normalizeGarageModel(model);
        garageGroup.add(model);
        setStatus("ready");
      },
      undefined,
      () => {
        setStatus("failed");
      }
    );

    characterLoader.load(
      PLAYER_MODEL_URL,
      (gltf) => {
        const player = gltf.scene;
        const playerPivot = new THREE.Group();

        preparePlayerCharacter(player);
        playerPivot.position.copy(playerState.position);
        playerPivot.rotation.y = playerState.yaw;
        playerPivot.visible = false;
        playerPivot.add(player);
        playerState.modelRoot = playerPivot;
        playerState.mixer = new THREE.AnimationMixer(player);
        playerState.actions = Object.fromEntries(
          gltf.animations.map((clip) => [clip.name, playerState.mixer?.clipAction(clip) as THREE.AnimationAction])
        );
        playPlayerAction(playerState, "Idle");
        scene.add(playerPivot);
        mount.dataset.player = "ready";
      },
      undefined,
      () => {
        mount.dataset.player = "failed";
      }
    );

    const requestOrientationPermission = () => {
      if (orientationPermissionRequested) {
        return;
      }

      orientationPermissionRequested = true;
      const orientationEvent = window.DeviceOrientationEvent as DeviceOrientationEventWithPermission | undefined;

      if (orientationEvent?.requestPermission) {
        void orientationEvent.requestPermission().catch(() => undefined);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointerActive = true;
      pointerMode = event.clientY > rect.top + rect.height * 0.56 ? "move" : "look";
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      lastPointerX = event.clientX;
      mount.setPointerCapture(event.pointerId);
      mount.dataset.grabbing = "true";
      requestOrientationPermission();
      event.preventDefault();
    };

    const getPhotoIdAtPoint = (clientX: number, clientY: number, relaxed = false) => {
      const rect = mount.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      pointer.y = -(((clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);

      const hit = raycaster.intersectObjects(interactivePhotos, true).find((entry) => findPhotoId(entry.object));

      if (hit) {
        return findPhotoId(hit.object);
      }

      return findNearestProjectedPhotoId(interactivePhotos, camera, rect, clientX, clientY, relaxed);
    };

    const getAnalysisHitAtPoint = (clientX: number, clientY: number, relaxed = false) => {
      const rect = mount.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      pointer.y = -(((clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);

      const hit = raycaster.intersectObjects(interactiveAnalysisObjects, true).find((entry) => findAnalysisTrigger(entry.object));

      if (hit) {
        return true;
      }

      return findNearestProjectedAnalysisTrigger(interactiveAnalysisObjects, camera, rect, clientX, clientY, relaxed);
    };

    const getSportsBallIdAtPoint = (clientX: number, clientY: number, relaxed = false) => {
      const rect = mount.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      pointer.y = -(((clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);

      const hit = raycaster.intersectObjects(interactiveSportsObjects, true).find((entry) => findSportsBallId(entry.object));

      if (hit) {
        return findSportsBallId(hit.object);
      }

      return findNearestProjectedSportsBallId(interactiveSportsObjects, camera, rect, clientX, clientY, relaxed);
    };

    const getMirrorHitAtPoint = (clientX: number, clientY: number, relaxed = false) => {
      const rect = mount.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      pointer.y = -(((clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);

      const hit = raycaster.intersectObjects(interactiveMirrorObjects, true).find((entry) => findMirrorTrigger(entry.object));

      if (hit) {
        return true;
      }

      return findNearestProjectedMirrorTrigger(interactiveMirrorObjects, camera, rect, clientX, clientY, relaxed);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerActive) {
        mount.dataset.hoverPhoto =
          getAnalysisHitAtPoint(event.clientX, event.clientY) ||
          getSportsBallIdAtPoint(event.clientX, event.clientY) ||
          getMirrorHitAtPoint(event.clientX, event.clientY) ||
          getPhotoIdAtPoint(event.clientX, event.clientY)
            ? "true"
            : "false";
        return;
      }

      if (pointerMode === "move") {
        virtualMove.x = THREE.MathUtils.clamp((event.clientX - pointerStartX) / 90, -1, 1);
        virtualMove.y = THREE.MathUtils.clamp((pointerStartY - event.clientY) / 90, -1, 1);
        event.preventDefault();
        return;
      }

      const deltaX = event.clientX - lastPointerX;
      lastPointerX = event.clientX;
      targetLook.yaw -= deltaX * 0.0048;
      event.preventDefault();
    };

    const handlePointerUp = (event: PointerEvent) => {
      const moved = Math.hypot(event.clientX - pointerStartX, event.clientY - pointerStartY);

      pointerActive = false;
      pointerMode = null;
      virtualMove.set(0, 0);
      mount.dataset.grabbing = "false";

      if (mount.hasPointerCapture(event.pointerId)) {
        mount.releasePointerCapture(event.pointerId);
      }

      if (moved < 8) {
        const analysisHit = getAnalysisHitAtPoint(event.clientX, event.clientY, event.pointerType === "touch");

        if (analysisHit) {
          if (!analyzingRef.current) {
            onAnalysisStartRef.current?.();
          }

          event.preventDefault();
          return;
        }

        if (playerState.carriedBallId) {
          throwCarriedSportsBall(sportsBalls, playerState, getPlayerActionForward(playerState.yaw, ballActionForward));
          event.preventDefault();
          return;
        }

        const sportsBallId = getSportsBallIdAtPoint(event.clientX, event.clientY, event.pointerType === "touch");

        if (sportsBallId) {
          pickUpSportsBall(sportsBalls, playerState, sportsBallId);
          event.preventDefault();
          return;
        }

        if (getMirrorHitAtPoint(event.clientX, event.clientY, event.pointerType === "touch")) {
          onCustomizerOpenRef.current?.();
          event.preventDefault();
          return;
        }

        const photoId = getPhotoIdAtPoint(event.clientX, event.clientY, event.pointerType === "touch");

        if (photoId) {
          onPhotoOpenRef.current?.(photoId);
          event.preventDefault();
        }
      }
    };

    const handlePointerLeave = (event: PointerEvent) => {
      if (!pointerActive) {
        return;
      }

      virtualMove.set(0, 0);
      const moved = Math.hypot(event.clientX - pointerStartX, event.clientY - pointerStartY);

      if (moved < 4) {
        targetLook.yaw += 0.02;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const code = event.code;

      if (isMovementKey(code)) {
        pressedKeys.add(code);
        event.preventDefault();
      }

      if (code === "Space" && playerState.jumpOffset <= 0.001) {
        playerState.jumpVelocity = PLAYER_JUMP_SPEED;
        event.preventDefault();
      }

      if ((code === "KeyE" || code === "Enter") && !event.repeat) {
        if (playerState.nearestAnalysis && !analyzingRef.current) {
          onAnalysisStartRef.current?.();
          event.preventDefault();
          return;
        }

        if (playerState.carriedBallId) {
          throwCarriedSportsBall(sportsBalls, playerState, getPlayerActionForward(playerState.yaw, ballActionForward));
          event.preventDefault();
          return;
        }

        if (playerState.nearestBallId) {
          pickUpSportsBall(sportsBalls, playerState, playerState.nearestBallId);
          event.preventDefault();
          return;
        }

        if (playerState.nearestMirror) {
          onCustomizerOpenRef.current?.();
          event.preventDefault();
          return;
        }

        if (playerState.nearestPhotoId) {
          onPhotoOpenRef.current?.(playerState.nearestPhotoId);
          event.preventDefault();
          return;
        }
      }

      if (code === "KeyF" && !event.repeat && playerState.nearestBallId) {
        kickSportsBall(sportsBalls, playerState.nearestBallId, getPlayerActionForward(playerState.yaw, ballActionForward));
        event.preventDefault();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (isMovementKey(event.code)) {
        pressedKeys.delete(event.code);
        event.preventDefault();
      }

      if (event.code === "Space") {
        event.preventDefault();
      }
    };

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (pointerActive) {
        return;
      }

      if (typeof event.gamma === "number") {
        targetLook.yaw = THREE.MathUtils.clamp(event.gamma / 25, -1.28, 1.28);
      }
    };

    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.05);
      const time = clock.elapsedTime;
      const analyzingBoost = analyzingRef.current ? 1.4 : 1;

      currentLook.yaw += (targetLook.yaw - currentLook.yaw) * 0.09;

      if (playerState.root) {
        const customizationKey = getCustomizationKey(customizationRef.current);

        if (customizationKey !== appliedCustomizationKey) {
          applyPlayerCustomization(playerState.root, customizationRef.current);
          appliedCustomizationKey = customizationKey;
        }

        updatePlayerMovement(playerState, pressedKeys, virtualMove, currentLook.yaw, delta, moveVector, cameraForward, cameraRight);
        const isAnalysisNear = updateAnalysisProximity(analysisStation, playerState.position, photoWorldPosition, analyzingRef.current);
        const sportsFocus = updateSportsBalls(sportsBalls, playerState, delta, ballWorldPosition, isAnalysisNear);
        const isMirrorNear = updateMirrorProximity(
          mirrorStation,
          playerState.position,
          photoWorldPosition,
          isAnalysisNear || Boolean(sportsFocus.activeBallId || playerState.carriedBallId)
        );
        const photoProximity = updatePhotoProximity(
          photoPanels,
          playerState.position,
          photoWorldPosition,
          isAnalysisNear || isMirrorNear || Boolean(sportsFocus.activeBallId || playerState.carriedBallId)
        );
        const nextInteractionPrompt: InteractionPrompt = isAnalysisNear
          ? "analysis"
          : playerState.carriedBallId
            ? "carriedBall"
            : sportsFocus.activeBallId
              ? "ball"
              : isMirrorNear
                ? "mirror"
                : photoProximity.nearestPhotoId
                  ? "photo"
                  : null;
        playerState.nearestPhotoId = photoProximity.nearestPhotoId;
        playerState.nearestBallId = sportsFocus.activeBallId;
        playerState.nearestAnalysis = isAnalysisNear;
        playerState.nearestMirror = isMirrorNear;
        playerState.faceMood = isMirrorNear ? "softSmile" : photoProximity.faceMood;
        setInteractionPrompt((current) => (current === nextInteractionPrompt ? current : nextInteractionPrompt));
        updateChaseCamera(
          camera,
          playerState.position,
          currentLook.yaw,
          desiredCamera,
          desiredTarget,
          cameraForward,
          cameraCollisionDirection,
          cameraRaycaster,
          cameraColliders
        );
      } else {
        setInteractionPrompt((current) => (current === null ? current : null));
        camera.position.copy(CAMERA_HOME);
        camera.rotation.x = FIXED_CAMERA_PITCH;
        camera.rotation.y = currentLook.yaw;
        camera.rotation.z = 0;
      }

      acidLight.intensity = (8.8 + Math.sin(time * 2.2) * 0.85) * analyzingBoost;
      cyanLight.intensity = 7.2 + Math.sin(time * 1.7 + 0.7) * 0.55;
      violetLight.intensity = 5.5 + Math.sin(time * 1.4 + 1.5) * 0.5;

      photoGroup.children.forEach((panel, index) => {
        if (typeof panel.userData.baseY !== "number" || typeof panel.userData.baseRotationZ !== "number") {
          return;
        }

        panel.position.y = panel.userData.baseY + Math.sin(time * 0.9 + index * 0.84) * 0.012;
        panel.rotation.z = panel.userData.baseRotationZ + Math.sin(time * 1.04 + index) * 0.012;
      });

      analysisGroup.children.forEach((station) => {
        if (typeof station.userData.baseY === "number") {
          station.position.y = station.userData.baseY + Math.sin(time * 1.2) * 0.01;
        }

        const pulseMaterials = station.userData.pulseMaterials as THREE.MeshStandardMaterial[] | undefined;
        const isNearAnalysis = station.userData.isNear === true;
        pulseMaterials?.forEach((material, materialIndex) => {
          material.emissiveIntensity =
            (analyzingRef.current ? 1.55 : isNearAnalysis ? 1.08 : 0.78) + Math.sin(time * 2.4 + materialIndex * 0.7) * 0.18;
        });

        const lever = station.userData.lever as THREE.Object3D | undefined;
        if (lever) {
          lever.rotation.z = analyzingRef.current ? -0.78 + Math.sin(time * 4.8) * 0.035 : -0.32 + Math.sin(time * 1.5) * 0.02;
        }
      });

      roomGroup.position.y = analyzingRef.current ? Math.sin(time * 3.2) * 0.008 : 0;

      renderer.clear();
      renderer.render(scene, camera);
      renderer.clearDepth();
      renderer.render(playerScene, camera);
      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);

    const resize = () => {
      if (!mountRef.current) {
        return;
      }

      camera.aspect = mountRef.current.clientWidth / Math.max(mountRef.current.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    mount.addEventListener("pointerdown", handlePointerDown);
    mount.addEventListener("pointermove", handlePointerMove);
    mount.addEventListener("pointerup", handlePointerUp);
    mount.addEventListener("pointercancel", handlePointerUp);
    mount.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("deviceorientation", handleOrientation);
    window.addEventListener("resize", resize);

    return () => {
      mount.removeEventListener("pointerdown", handlePointerDown);
      mount.removeEventListener("pointermove", handlePointerMove);
      mount.removeEventListener("pointerup", handlePointerUp);
      mount.removeEventListener("pointercancel", handlePointerUp);
      mount.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("deviceorientation", handleOrientation);
      window.removeEventListener("resize", resize);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      [scene, playerScene].forEach((targetScene) => {
        targetScene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            disposeMaterial(object.material);
          }
        });
      });

      delete window.__garageDebug;
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="garage-scene-canvas" ref={mountRef} data-status={status} data-analyzing={isAnalyzing} aria-hidden="true">
      <span className="garage-scene-loader">LOADING 360 GARAGE</span>
      <span className="garage-interaction-prompt" data-visible={interactionPrompt !== null}>
        {interactionPrompt ? INTERACTION_PROMPT_LABELS[interactionPrompt] : "Press E"}
      </span>
    </div>
  );
}

function updatePlayerMovement(
  playerState: {
    root: THREE.Group | null;
    modelRoot: THREE.Group | null;
    mixer: THREE.AnimationMixer | null;
    actions: Record<string, THREE.AnimationAction>;
    activeAction: THREE.AnimationAction | null;
    position: THREE.Vector3;
    yaw: number;
    walkTime: number;
    jumpOffset: number;
    jumpVelocity: number;
    faceMood: FaceMood;
  },
  pressedKeys: Set<string>,
  virtualMove: THREE.Vector2,
  cameraYaw: number,
  delta: number,
  moveVector: THREE.Vector3,
  cameraForward: THREE.Vector3,
  cameraRight: THREE.Vector3
) {
  if (!playerState.root) {
    return;
  }

  cameraForward.set(Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
  cameraRight.set(Math.cos(cameraYaw), 0, Math.sin(cameraYaw));
  moveVector.set(0, 0, 0);

  if (pressedKeys.has("KeyW") || pressedKeys.has("ArrowUp")) {
    moveVector.add(cameraForward);
  }

  if (pressedKeys.has("KeyS") || pressedKeys.has("ArrowDown")) {
    moveVector.sub(cameraForward);
  }

  if (pressedKeys.has("KeyA") || pressedKeys.has("ArrowLeft")) {
    moveVector.sub(cameraRight);
  }

  if (pressedKeys.has("KeyD") || pressedKeys.has("ArrowRight")) {
    moveVector.add(cameraRight);
  }

  if (virtualMove.lengthSq() > 0.002) {
    moveVector.addScaledVector(cameraForward, virtualMove.y);
    moveVector.addScaledVector(cameraRight, virtualMove.x);
  }

  const isMoving = moveVector.lengthSq() > 0.001;

  if (isMoving) {
    moveVector.normalize();
    const isRunning = pressedKeys.has("ShiftLeft") || pressedKeys.has("ShiftRight");
    const speed = isRunning ? PLAYER_RUN_SPEED : PLAYER_WALK_SPEED;
    movePlayerOnFloor(playerState.position, moveVector, speed * delta);
    playerState.yaw = Math.atan2(moveVector.x, moveVector.z);
    playerState.root.rotation.y = lerpAngle(playerState.root.rotation.y, playerState.yaw, 0.22);
    playerState.modelRoot?.rotation.set(0, playerState.root.rotation.y, 0);
    playerState.walkTime += delta * (isRunning ? 8.4 : 6.2);
    animateVisiblePlayerShell(playerState.root, true, playerState.walkTime, playerState.faceMood);
    playPlayerAction(playerState, isRunning ? "Run" : "Walk");
  } else {
    playerState.walkTime += delta * 3.2;
    animateVisiblePlayerShell(playerState.root, false, playerState.walkTime, playerState.faceMood);
    playPlayerAction(playerState, "Idle");
  }

  if (playerState.jumpOffset > 0 || playerState.jumpVelocity > 0) {
    playerState.jumpVelocity -= PLAYER_GRAVITY * delta;
    playerState.jumpOffset = Math.max(0, playerState.jumpOffset + playerState.jumpVelocity * delta);

    if (playerState.jumpOffset === 0) {
      playerState.jumpVelocity = 0;
    }
  }

  playerState.root.position.copy(playerState.position);
  playerState.root.position.y += playerState.jumpOffset;
  playerState.modelRoot?.position.copy(playerState.position);
  if (playerState.modelRoot) {
    playerState.modelRoot.position.y += playerState.jumpOffset;
  }
  playerState.mixer?.update(delta);
}

function updateChaseCamera(
  camera: THREE.PerspectiveCamera,
  playerPosition: THREE.Vector3,
  cameraYaw: number,
  desiredCamera: THREE.Vector3,
  desiredTarget: THREE.Vector3,
  cameraForward: THREE.Vector3,
  collisionDirection: THREE.Vector3,
  collisionRaycaster: THREE.Raycaster,
  colliders: THREE.Object3D[]
) {
  cameraForward.set(Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
  desiredCamera
    .copy(playerPosition)
    .addScaledVector(cameraForward, -PLAYER_CAMERA_DISTANCE)
    .add(new THREE.Vector3(0, PLAYER_CAMERA_HEIGHT, 0));
  desiredTarget
    .copy(playerPosition)
    .addScaledVector(cameraForward, 0.86)
    .add(new THREE.Vector3(0, PLAYER_LOOK_HEIGHT, 0));

  const intendedDistance = desiredCamera.distanceTo(desiredTarget);
  collisionDirection.subVectors(desiredCamera, desiredTarget).normalize();
  collisionRaycaster.set(desiredTarget, collisionDirection);
  collisionRaycaster.near = 0.08;
  collisionRaycaster.far = intendedDistance;

  const collision = collisionRaycaster.intersectObjects(colliders, true).find(({ object }) => isCameraBlockingMesh(object));

  if (collision) {
    const safeDistance = THREE.MathUtils.clamp(
      collision.distance - CAMERA_COLLISION_CLEARANCE,
      CAMERA_MIN_DISTANCE,
      intendedDistance
    );
    desiredCamera.copy(desiredTarget).addScaledVector(collisionDirection, safeDistance);
  }

  if (collision) {
    camera.position.copy(desiredCamera);
  } else {
    camera.position.lerp(desiredCamera, 0.14);
  }
  camera.lookAt(desiredTarget);
}

function isCameraBlockingMesh(object: THREE.Object3D) {
  if (!(object instanceof THREE.Mesh) || !object.visible) {
    return false;
  }

  const materials = Array.isArray(object.material) ? object.material : [object.material];
  return materials.some((material) => material.visible && material.opacity > 0.2);
}

function updatePhotoProximity(
  photos: THREE.Object3D[],
  playerPosition: THREE.Vector3,
  photoWorldPosition: THREE.Vector3,
  isFocusBlocked = false
) {
  let nearestPhotoId: string | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  photos.forEach((photo) => {
    const photoId = findPhotoId(photo);

    if (!photoId) {
      return;
    }

    photo.getWorldPosition(photoWorldPosition);
    const distance = Math.hypot(photoWorldPosition.x - playerPosition.x, photoWorldPosition.z - playerPosition.z);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestPhotoId = photoId;
    }
  });

  const activePhotoId = !isFocusBlocked && nearestDistance <= PHOTO_INTERACTION_RADIUS ? nearestPhotoId : null;

  photos.forEach((photo) => {
    const photoId = findPhotoId(photo);
    const isActive = Boolean(activePhotoId && photoId === activePhotoId);
    const glowMaterial = photo.userData.highlightGlow as THREE.MeshBasicMaterial | undefined;
    const targetOpacity = isActive ? 0.86 : 0.12;
    const targetScale = isActive ? 1.16 : 1;
    const currentScale = typeof photo.userData.currentScale === "number" ? photo.userData.currentScale : 1;

    if (glowMaterial) {
      glowMaterial.opacity += (targetOpacity - glowMaterial.opacity) * 0.18;
    }

    photo.userData.currentScale = currentScale + (targetScale - currentScale) * 0.18;
    photo.scale.setScalar(photo.userData.currentScale);
  });

  return {
    nearestPhotoId: activePhotoId,
    faceMood:
      !isFocusBlocked && nearestDistance <= PHOTO_INTERACTION_RADIUS
        ? "bigSmile"
        : !isFocusBlocked && nearestDistance <= PHOTO_SMILE_RADIUS
          ? "softSmile"
          : "neutral"
  } as const;
}

function updateAnalysisProximity(
  station: THREE.Object3D,
  playerPosition: THREE.Vector3,
  stationWorldPosition: THREE.Vector3,
  isAnalyzing: boolean
) {
  station.getWorldPosition(stationWorldPosition);
  const distance = Math.hypot(stationWorldPosition.x - playerPosition.x, stationWorldPosition.z - playerPosition.z);
  const isNear = !isAnalyzing && distance <= ANALYSIS_INTERACTION_RADIUS;
  const glow = station.userData.highlightGlow as THREE.Mesh | undefined;

  station.userData.isNear = isNear;

  if (glow) {
    const material = glow.material instanceof THREE.MeshBasicMaterial ? glow.material : null;
    const targetOpacity = isNear ? 0.78 : 0.16;
    const targetScale = isNear ? 1.26 : 1;
    const currentScale = typeof station.userData.currentGlowScale === "number" ? station.userData.currentGlowScale : 1;

    if (material) {
      material.opacity += (targetOpacity - material.opacity) * 0.2;
    }

    station.userData.currentGlowScale = currentScale + (targetScale - currentScale) * 0.18;
    glow.scale.setScalar(station.userData.currentGlowScale);
  }

  return isNear;
}

function updateMirrorProximity(
  mirror: THREE.Object3D,
  playerPosition: THREE.Vector3,
  mirrorWorldPosition: THREE.Vector3,
  isFocusBlocked = false
) {
  mirror.getWorldPosition(mirrorWorldPosition);
  const distance = Math.hypot(mirrorWorldPosition.x - playerPosition.x, mirrorWorldPosition.z - playerPosition.z);
  const isNear = !isFocusBlocked && distance <= MIRROR_INTERACTION_RADIUS;

  mirror.userData.isNear = isNear;

  return isNear;
}

function createSportsBalls(): SportsBallState[] {
  return [
    createSportsBall("football", "football", new THREE.Vector3(-2.55, 0.17, -0.28), 0.17, createFootballMesh()),
    createSportsBall("basketball", "basketball", new THREE.Vector3(2.15, 0.19, 0.84), 0.19, createBasketballMesh())
  ];
}

function createSportsBall(
  id: string,
  kind: SportsBallKind,
  position: THREE.Vector3,
  radius: number,
  ballMesh: THREE.Object3D
): SportsBallState {
  const root = new THREE.Group();

  root.name = `sports-ball-${id}`;
  root.userData.sportsBallId = id;
  root.position.copy(position);
  root.renderOrder = BALL_RENDER_ORDER;
  ballMesh.userData.sportsBallId = id;
  ballMesh.renderOrder = BALL_RENDER_ORDER;
  root.add(ballMesh);
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    child.castShadow = false;
    child.receiveShadow = false;
    child.frustumCulled = false;
  });

  return {
    id,
    kind,
    root,
    radius,
    velocity: new THREE.Vector3(),
    currentScale: 1,
    isCarried: false
  };
}

function createFootballMesh() {
  const group = new THREE.Group();
  const ballMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4f0dc,
    emissive: 0xffffff,
    emissiveIntensity: 0.03,
    roughness: 0.68,
    metalness: 0.02
  });
  const seamMaterial = new THREE.MeshBasicMaterial({
    color: 0x101010,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.17, 42, 24), ballMaterial);
  const patchNormals = [
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0.62, 0.42, 0.66),
    new THREE.Vector3(-0.66, 0.32, 0.68),
    new THREE.Vector3(0.58, -0.44, 0.62),
    new THREE.Vector3(-0.52, -0.52, 0.64),
    new THREE.Vector3(0, 0.82, 0.58),
    new THREE.Vector3(0, -0.86, 0.5)
  ];

  patchNormals.forEach((normal, index) => {
    const patch = createFootballPatch(normal.normalize(), index === 0 ? 0.052 : 0.042, seamMaterial);
    group.add(patch);
  });

  group.add(ball);
  return group;
}

function createFootballPatch(normal: THREE.Vector3, radius: number, material: THREE.Material) {
  const patch = new THREE.Mesh(new THREE.CircleGeometry(radius, 5), material);
  patch.position.copy(normal).multiplyScalar(0.173);
  patch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  patch.renderOrder = BALL_RENDER_ORDER + 1;
  return patch;
}

function createBasketballMesh() {
  const group = new THREE.Group();
  const ballMaterial = new THREE.MeshStandardMaterial({
    color: 0xe27625,
    emissive: 0x321000,
    emissiveIntensity: 0.12,
    roughness: 0.64,
    metalness: 0.02
  });
  const seamMaterial = new THREE.MeshBasicMaterial({ color: 0x17110d });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.19, 42, 24), ballMaterial);
  const seams = [
    new THREE.Mesh(new THREE.TorusGeometry(0.191, 0.006, 8, 72), seamMaterial),
    new THREE.Mesh(new THREE.TorusGeometry(0.191, 0.006, 8, 72), seamMaterial),
    new THREE.Mesh(new THREE.TorusGeometry(0.191, 0.006, 8, 72), seamMaterial),
    new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.005, 8, 48), seamMaterial),
    new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.005, 8, 48), seamMaterial)
  ];

  seams[0].rotation.x = Math.PI / 2;
  seams[1].rotation.y = Math.PI / 2;
  seams[2].rotation.z = Math.PI / 2;
  seams[3].rotation.set(Math.PI / 2, 0, 0.65);
  seams[3].position.x = 0.095;
  seams[4].rotation.set(Math.PI / 2, 0, -0.65);
  seams[4].position.x = -0.095;
  group.add(ball, ...seams);
  return group;
}

function updateSportsBalls(
  balls: SportsBallState[],
  playerState: {
    position: THREE.Vector3;
    yaw: number;
    carriedBallId: string | null;
  },
  delta: number,
  ballWorldPosition: THREE.Vector3,
  isFocusBlocked: boolean
) {
  let nearestBallId: string | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  const focusBlocked = isFocusBlocked || Boolean(playerState.carriedBallId);

  balls.forEach((ball) => {
    if (ball.isCarried) {
      positionCarriedSportsBall(ball, playerState, ballWorldPosition);
    } else {
      simulateFreeSportsBall(ball, delta);
    }

    ball.root.getWorldPosition(ballWorldPosition);
    const distance = Math.hypot(ballWorldPosition.x - playerState.position.x, ballWorldPosition.z - playerState.position.z);

    if (!focusBlocked && distance < nearestDistance) {
      nearestDistance = distance;
      nearestBallId = ball.id;
    }
  });

  const activeBallId = !focusBlocked && nearestDistance <= BALL_INTERACTION_RADIUS ? nearestBallId : null;

  balls.forEach((ball) => {
    const isActive = activeBallId === ball.id;
    const targetScale = isActive ? 1.16 : 1;

    ball.currentScale += (targetScale - ball.currentScale) * 0.18;
    ball.root.scale.setScalar(ball.currentScale);
  });

  return { activeBallId } as const;
}

function positionCarriedSportsBall(
  ball: SportsBallState,
  playerState: {
    position: THREE.Vector3;
    yaw: number;
  },
  target: THREE.Vector3
) {
  getPlayerActionForward(playerState.yaw, target);
  ball.root.position.copy(playerState.position).addScaledVector(target, 0.42);
  ball.root.position.y = 0.96;
  ball.velocity.set(0, 0, 0);
}

function simulateFreeSportsBall(ball: SportsBallState, delta: number) {
  const position = ball.root.position;
  const nextX = position.x + ball.velocity.x * delta;
  const nextZ = position.z + ball.velocity.z * delta;

  if (isWalkableFloorPoint(nextX, position.z)) {
    position.x = nextX;
  } else {
    ball.velocity.x *= -0.35;
  }

  if (isWalkableFloorPoint(position.x, nextZ)) {
    position.z = nextZ;
  } else {
    ball.velocity.z *= -0.35;
  }

  if (!isWalkableFloorPoint(position.x, position.z)) {
    moveToNearestWalkableFloorPoint(position);
    ball.velocity.multiplyScalar(0.25);
  }

  if (position.y > ball.radius || ball.velocity.y > 0) {
    position.y += ball.velocity.y * delta;
    ball.velocity.y -= BALL_GRAVITY * delta;
  }

  if (position.y <= ball.radius) {
    position.y = ball.radius;

    if (Math.abs(ball.velocity.y) > 0.28) {
      ball.velocity.y = Math.abs(ball.velocity.y) * 0.32;
    } else {
      ball.velocity.y = 0;
    }
  }

  const damping = Math.max(0, 1 - BALL_FRICTION * delta);
  ball.velocity.x *= damping;
  ball.velocity.z *= damping;

  if (Math.hypot(ball.velocity.x, ball.velocity.z) < 0.025) {
    ball.velocity.x = 0;
    ball.velocity.z = 0;
  }

  ball.root.rotation.x += (ball.velocity.z * delta) / Math.max(ball.radius, 0.001);
  ball.root.rotation.z -= (ball.velocity.x * delta) / Math.max(ball.radius, 0.001);
}

function pickUpSportsBall(
  balls: SportsBallState[],
  playerState: {
    carriedBallId: string | null;
  },
  ballId: string
) {
  const ball = balls.find((entry) => entry.id === ballId);

  if (!ball || playerState.carriedBallId) {
    return;
  }

  ball.isCarried = true;
  ball.velocity.set(0, 0, 0);
  playerState.carriedBallId = ball.id;
}

function throwCarriedSportsBall(
  balls: SportsBallState[],
  playerState: {
    carriedBallId: string | null;
  },
  forward: THREE.Vector3
) {
  const ball = balls.find((entry) => entry.id === playerState.carriedBallId);

  if (!ball) {
    playerState.carriedBallId = null;
    return;
  }

  ball.isCarried = false;
  ball.velocity.copy(forward).multiplyScalar(BALL_THROW_SPEED);
  ball.velocity.y = 1.05;
  playerState.carriedBallId = null;
}

function kickSportsBall(balls: SportsBallState[], ballId: string, forward: THREE.Vector3) {
  const ball = balls.find((entry) => entry.id === ballId);

  if (!ball || ball.isCarried) {
    return;
  }

  ball.velocity.copy(forward).multiplyScalar(BALL_KICK_SPEED);
  ball.velocity.y = Math.max(ball.velocity.y, 0.34);
}

function getPlayerActionForward(yaw: number, target: THREE.Vector3) {
  target.set(Math.sin(yaw), 0, Math.cos(yaw));

  if (target.lengthSq() < 0.001) {
    target.set(0, 0, 1);
  }

  return target.normalize();
}

function findSportsBallId(object: THREE.Object3D): string | null {
  let current: THREE.Object3D | null = object;

  while (current) {
    if (typeof current.userData.sportsBallId === "string") {
      return current.userData.sportsBallId;
    }

    current = current.parent;
  }

  return null;
}

function findNearestProjectedSportsBallId(
  balls: THREE.Object3D[],
  camera: THREE.PerspectiveCamera,
  rect: DOMRect,
  clientX: number,
  clientY: number,
  relaxed: boolean
) {
  const projected = new THREE.Vector3();
  const target = new THREE.Vector3();
  const maxDistance = relaxed || rect.width < 760 ? 116 : 64;
  let bestBallId: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  balls.forEach((ball) => {
    const ballId = findSportsBallId(ball);

    if (!ballId) {
      return;
    }

    ball.getWorldPosition(projected);
    target.copy(projected).project(camera);

    if (target.z < -1 || target.z > 1) {
      return;
    }

    const screenX = rect.left + ((target.x + 1) / 2) * rect.width;
    const screenY = rect.top + ((1 - target.y) / 2) * rect.height;
    const distance = Math.hypot(clientX - screenX, clientY - screenY);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestBallId = ballId;
    }
  });

  return bestDistance <= maxDistance ? bestBallId : null;
}

function movePlayerOnFloor(position: THREE.Vector3, direction: THREE.Vector3, distance: number) {
  if (!isWalkableFloorPoint(position.x, position.z)) {
    moveToNearestWalkableFloorPoint(position);
  }

  const nextX = position.x + direction.x * distance;
  const nextZ = position.z + direction.z * distance;

  if (isWalkableFloorPoint(nextX, position.z)) {
    position.x = nextX;
  }

  if (isWalkableFloorPoint(position.x, nextZ)) {
    position.z = nextZ;
  }
}

function moveToNearestWalkableFloorPoint(position: THREE.Vector3) {
  const originX = position.x;
  const originZ = position.z;

  for (let radius = 0.14; radius <= 2.8; radius += 0.14) {
    for (let step = 0; step < 32; step += 1) {
      const angle = (step / 32) * Math.PI * 2;
      const candidateX = originX + Math.cos(angle) * radius;
      const candidateZ = originZ + Math.sin(angle) * radius;

      if (isWalkableFloorPoint(candidateX, candidateZ)) {
        position.x = candidateX;
        position.z = candidateZ;
        return;
      }
    }
  }
}

function isWalkableFloorPoint(x: number, z: number) {
  return isPointInPolygon(x, z, WALKABLE_FLOOR) && !BLOCKED_FLOOR_AREAS.some((area) => isInsideBlockedArea(x, z, area));
}

function isInsideBlockedArea(x: number, z: number, area: BlockedFloorArea) {
  return (
    x >= area.minX - PLAYER_COLLISION_RADIUS &&
    x <= area.maxX + PLAYER_COLLISION_RADIUS &&
    z >= area.minZ - PLAYER_COLLISION_RADIUS &&
    z <= area.maxZ + PLAYER_COLLISION_RADIUS
  );
}

function isPointInPolygon(x: number, z: number, polygon: FloorPoint[]) {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, zi] = polygon[i];
    const [xj, zj] = polygon[j];
    const intersects = zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function playPlayerAction(
  playerState: {
    actions: Record<string, THREE.AnimationAction>;
    activeAction: THREE.AnimationAction | null;
  },
  actionName: "Idle" | "Walk" | "Run"
) {
  const nextAction = playerState.actions[actionName];

  if (!nextAction || playerState.activeAction === nextAction) {
    return;
  }

  nextAction.reset().fadeIn(0.16).play();
  playerState.activeAction?.fadeOut(0.16);
  playerState.activeAction = nextAction;
}

function lerpAngle(from: number, to: number, amount: number) {
  return from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * amount;
}

function isMovementKey(code: string) {
  return (
    code === "KeyW" ||
    code === "KeyA" ||
    code === "KeyS" ||
    code === "KeyD" ||
    code === "ArrowUp" ||
    code === "ArrowDown" ||
    code === "ArrowLeft" ||
    code === "ArrowRight" ||
    code === "ShiftLeft" ||
    code === "ShiftRight"
  );
}

function preparePlayerCharacter(player: THREE.Group) {
  player.visible = true;

  player.traverse((child) => {
    child.visible = true;

    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    child.castShadow = false;
    child.receiveShadow = true;
    child.frustumCulled = false;
    child.renderOrder = PLAYER_RENDER_ORDER - 10;
    child.material = cloneAndStylePlayerMaterial(child.material, child.name);
  });

  tunePlayerFaceAndHair(player);
  const box = new THREE.Box3().setFromObject(player);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = size.y > 0 ? PLAYER_HEIGHT / size.y : 1;

  player.scale.setScalar(scale);
  player.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
}

function cloneAndStylePlayerMaterial(material: THREE.Material | THREE.Material[], meshName: string) {
  const materials = Array.isArray(material) ? material : [material];
  const styledMaterials = materials.map((entry) => {
    const marker = `${entry.name} ${meshName}`.toLowerCase();
    let color = 0xf0a960;

    if (marker.includes("sleeveless") || marker.includes("torso_shirt") || marker.includes("shouldercloth") || marker.includes("shirt")) {
      color = 0xf7f3e7;
    }

    if (marker.includes("shorts")) {
      color = 0x07090b;
    }

    if (marker.includes("hair")) {
      color = 0x2c1608;
    }

    if (marker.includes("hair_highlight")) {
      color = 0x4a260f;
    }

    if (marker.includes("eye_white")) {
      color = 0xfff9e8;
    }

    if (marker.includes("pupil")) {
      color = 0x08090a;
    }

    if (marker.includes("mouth")) {
      color = 0x5a1420;
    }

    if (marker.includes("teeth")) {
      color = 0xfff0c6;
    }

    if (marker.includes("sneaker")) {
      color = 0xf4f2ea;
    }

    if (marker.includes("sole")) {
      color = 0xbcc3c3;
    }

    if (marker.includes("tattoo")) {
      color = 0x28231f;
    }

    if (marker.includes("tongue")) {
      color = 0xc13b35;
    }

    return new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false,
      fog: false,
      toneMapped: false
    });
  });

  return Array.isArray(material) ? styledMaterials : styledMaterials[0];
}

function tunePlayerFaceAndHair(player: THREE.Group) {
  const head = player.getObjectByName("Head");
  const headMesh = player.getObjectByName("Head_Mesh");
  const hairBun = player.getObjectByName("Hair_Bun");
  const hairTie = player.getObjectByName("Hair_Tie");
  const leftSide = player.getObjectByName("Hair_Side_L");
  const rightSide = player.getObjectByName("Hair_Side_R");

  head?.scale.set(1.08, 1.03, 1.04);
  headMesh?.scale.multiply(new THREE.Vector3(1.06, 1.02, 1.04));
  hairBun?.scale.multiply(new THREE.Vector3(1.48, 1.32, 1.32));
  hairTie?.scale.multiply(new THREE.Vector3(1.2, 1.1, 1.2));
  leftSide?.scale.multiply(new THREE.Vector3(0.48, 0.72, 0.58));
  rightSide?.scale.multiply(new THREE.Vector3(0.48, 0.72, 0.58));

  ["Hair_Lock_1", "Hair_Lock_2", "Hair_Lock_3", "Hair_Lock_4", "Hair_Lock_5"].forEach((name, index) => {
    const lock = player.getObjectByName(name);

    if (!lock) {
      return;
    }

    lock.position.z -= 0.035 + index * 0.006;
    lock.position.y += 0.01;
    lock.rotation.x -= 0.28;
    lock.scale.multiplyScalar(0.78);
  });

}

function loadSneakerAsset(loader: FBXLoader, playerRoot: THREE.Group) {
  loader.load(
    SNEAKER_MODEL_URL,
    (model) => {
      const leftAnchor = playerRoot.getObjectByName("shell-shoe-left");
      const rightAnchor = playerRoot.getObjectByName("shell-shoe-right");

      if (!leftAnchor || !rightAnchor) {
        return;
      }

      const leftSneaker = prepareLoadedSneakerModel(model.clone(true), "left");
      const rightSneaker = prepareLoadedSneakerModel(model.clone(true), "right");

      leftAnchor.add(leftSneaker);
      rightAnchor.add(rightSneaker);
    },
    undefined,
    () => undefined
  );
}

function prepareLoadedSneakerModel(model: THREE.Object3D, side: "left" | "right") {
  model.name = `loaded-${side}-sneaker`;
  model.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z, 0.001);
  const wrapper = new THREE.Group();
  const scale = 0.24 / maxDimension;

  model.position.sub(center);
  model.scale.setScalar(scale);
  model.rotation.set(0, side === "left" ? Math.PI : 0, 0);
  model.position.set(0, 0.065, 0.015);
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    child.renderOrder = PLAYER_RENDER_ORDER + 1;
    child.frustumCulled = false;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      stripLoadedSneakerTextureMaps(material);
      material.depthTest = true;
      material.depthWrite = true;
      material.transparent = false;
      material.needsUpdate = true;
    });
  });

  wrapper.add(model);
  wrapper.scale.set(side === "left" ? -1 : 1, 1, 1);
  return wrapper;
}

function stripLoadedSneakerTextureMaps(material: THREE.Material) {
  const materialWithMaps = material as THREE.Material & {
    map?: THREE.Texture | null;
    normalMap?: THREE.Texture | null;
    roughnessMap?: THREE.Texture | null;
    metalnessMap?: THREE.Texture | null;
    emissiveMap?: THREE.Texture | null;
    aoMap?: THREE.Texture | null;
  };

  materialWithMaps.map = null;
  materialWithMaps.normalMap = null;
  materialWithMaps.roughnessMap = null;
  materialWithMaps.metalnessMap = null;
  materialWithMaps.emissiveMap = null;
  materialWithMaps.aoMap = null;
}

const HAIR_PART_OBJECTS: Record<HairPartName, string> = {
  cap: "shell-hair-cap",
  crown: "shell-hair-crown",
  front: "shell-hair-front",
  bridge: "shell-hair-back-bridge",
  bun: "shell-hair-bun"
};

function installGarageDebugControls(playerRoot: THREE.Group) {
  const api: GarageDebugApi = {
    setHair(part, patch) {
      const object = playerRoot.getObjectByName(HAIR_PART_OBJECTS[part]);

      if (!object) {
        console.warn(`Hair part "${part}" was not found.`);
        return;
      }

      applyDebugTransform(object, patch);
      console.table(api.getHair());
    },
    getHair() {
      return (Object.keys(HAIR_PART_OBJECTS) as HairPartName[]).reduce(
        (result, part) => {
          const object = playerRoot.getObjectByName(HAIR_PART_OBJECTS[part]);
          result[part] = object ? readDebugTransform(object) : { visible: false };

          return result;
        },
        {} as Record<HairPartName, Record<string, number | boolean>>
      );
    },
    printHairControls() {
      console.info(
        [
          "Hair debug controls:",
          'window.__garageDebug.setHair("crown", { y: 1.84, z: -0.12, sx: 0.92, sy: 0.58, sz: 1.22 })',
          'window.__garageDebug.setHair("cap", { y: 1.865, z: 0.025, sx: 1.06, sy: 0.34, sz: 1.52 })',
          'window.__garageDebug.setHair("front", { y: 1.846, z: 0.178, sx: 0.64, sy: 0.34, sz: 0.42 })',
          'window.__garageDebug.setHair("bridge", { y: 1.775, z: -0.2, sx: 0.92, sy: 0.86, sz: 1 })',
          'window.__garageDebug.setHair("bun", { x: 0.05, y: 1.75, z: -0.32, sx: 1.04, sy: 0.92, sz: 0.96 })',
          "Use getHair() to copy the current values."
        ].join("\n")
      );
    }
  };

  window.__garageDebug = api;
  window.__garageDebug.printHairControls();
}

function applyDebugTransform(object: THREE.Object3D, patch: HairTransformPatch) {
  if (typeof patch.x === "number") object.position.x = patch.x;
  if (typeof patch.y === "number") object.position.y = patch.y;
  if (typeof patch.z === "number") object.position.z = patch.z;
  if (typeof patch.rx === "number") object.rotation.x = patch.rx;
  if (typeof patch.ry === "number") object.rotation.y = patch.ry;
  if (typeof patch.rz === "number") object.rotation.z = patch.rz;

  if (typeof patch.scale === "number") {
    object.scale.setScalar(patch.scale);
  }

  if (typeof patch.sx === "number") object.scale.x = patch.sx;
  if (typeof patch.sy === "number") object.scale.y = patch.sy;
  if (typeof patch.sz === "number") object.scale.z = patch.sz;
  if (typeof patch.visible === "boolean") object.visible = patch.visible;
}

function readDebugTransform(object: THREE.Object3D) {
  return {
    x: Number(object.position.x.toFixed(3)),
    y: Number(object.position.y.toFixed(3)),
    z: Number(object.position.z.toFixed(3)),
    rx: Number(object.rotation.x.toFixed(3)),
    ry: Number(object.rotation.y.toFixed(3)),
    rz: Number(object.rotation.z.toFixed(3)),
    sx: Number(object.scale.x.toFixed(3)),
    sy: Number(object.scale.y.toFixed(3)),
    sz: Number(object.scale.z.toFixed(3)),
    visible: object.visible
  };
}

function filenameToAssetName(filename: string) {
  const exactNames: Record<string, string> = {
    "background.png": "Background.png",
    "cable-dark.png": "Cable-Dark.png",
    "cable-light.png": "Cable-Light.png",
    "ceiling.png": "Ceiling.png",
    "floor.png": "Floor.png",
    "interior.png": "Interior.png",
    "wall.png": "Wall.png",
    "wood.png": "Wood.png"
  };

  return exactNames[filename] ?? filename;
}

function loadGarageTextures(textureLoader: THREE.TextureLoader, renderer: THREE.WebGLRenderer) {
  return Object.fromEntries(
    Object.entries(TEXTURE_ASSETS).map(([key, filename]) => {
      const texture = textureLoader.load(`/assets/garage-fan-art/textures/${filename}`);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return [key, texture];
    })
  ) as Record<GarageTextureKey, THREE.Texture>;
}

function createInteriorRoom(textures: Record<GarageTextureKey, THREE.Texture>) {
  const room = new THREE.Group();
  const floorY = -0.08;
  const wallY = ROOM_HEIGHT / 2 + floorY;
  const floorMaterial = createRoomMaterial(textures.floor, 4, 4);
  const wallMaterial = createRoomMaterial(textures.wall, 3, 2);
  const interiorMaterial = createRoomMaterial(textures.interior, 2, 2);
  const ceilingMaterial = createRoomMaterial(textures.ceiling, 3, 2);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = floorY;
  room.add(floor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH), ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = ROOM_HEIGHT + floorY;
  room.add(ceiling);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT), interiorMaterial);
  backWall.position.set(0, wallY, -ROOM_DEPTH / 2);
  room.add(backWall);

  const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT), wallMaterial.clone());
  frontWall.rotation.y = Math.PI;
  frontWall.position.set(0, wallY, ROOM_DEPTH / 2);
  room.add(frontWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT), wallMaterial.clone());
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-ROOM_WIDTH / 2, wallY, 0);
  room.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT), wallMaterial.clone());
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(ROOM_WIDTH / 2, wallY, 0);
  room.add(rightWall);

  addRoomTrim(room);

  return room;
}

function createRoomMaterial(texture: THREE.Texture, repeatX: number, repeatY: number) {
  const roomTexture = texture.clone();
  roomTexture.colorSpace = THREE.SRGBColorSpace;
  roomTexture.wrapS = THREE.RepeatWrapping;
  roomTexture.wrapT = THREE.RepeatWrapping;
  roomTexture.repeat.set(repeatX, repeatY);

  return new THREE.MeshBasicMaterial({
    map: roomTexture,
    color: 0xffffff,
    transparent: false,
    depthWrite: true,
    side: THREE.FrontSide
  });
}

function addRoomTrim(room: THREE.Group) {
  const trimMaterial = new THREE.MeshBasicMaterial({
    color: 0x15291e,
    transparent: true,
    opacity: 0.68,
    side: THREE.DoubleSide
  });
  const railMaterial = new THREE.MeshBasicMaterial({
    color: 0x8d622f,
    transparent: true,
    opacity: 0.58,
    side: THREE.DoubleSide
  });
  const baseY = 0.02;
  const railY = 2.52;

  [
    { width: ROOM_WIDTH, position: [0, baseY, -ROOM_DEPTH / 2 + 0.02], rotation: [0, 0, 0] },
    { width: ROOM_WIDTH, position: [0, railY, -ROOM_DEPTH / 2 + 0.025], rotation: [0, 0, 0], rail: true },
    { width: ROOM_WIDTH, position: [0, baseY, ROOM_DEPTH / 2 - 0.02], rotation: [0, Math.PI, 0] },
    { width: ROOM_DEPTH, position: [-ROOM_WIDTH / 2 + 0.02, baseY, 0], rotation: [0, Math.PI / 2, 0] },
    { width: ROOM_DEPTH, position: [ROOM_WIDTH / 2 - 0.02, baseY, 0], rotation: [0, -Math.PI / 2, 0] }
  ].forEach((trim) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(trim.width, trim.rail ? 0.1 : 0.08), trim.rail ? railMaterial : trimMaterial);
    mesh.position.set(trim.position[0], trim.position[1], trim.position[2]);
    mesh.rotation.set(trim.rotation[0], trim.rotation[1], trim.rotation[2]);
    room.add(mesh);
  });
}

function createPhotoPanel(placement: PhotoPlacement, index: number, textureLoader: THREE.TextureLoader, renderer: THREE.WebGLRenderer) {
  const panel = new THREE.Group();
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(placement.width * 1.08, placement.height * 1.08),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(PHOTO_HIGHLIGHT_COLOR),
      opacity: 0.12,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      side: THREE.FrontSide
    })
  );
  const card = new THREE.Mesh(
    new THREE.PlaneGeometry(placement.width, placement.height),
    placement.src
      ? new THREE.MeshBasicMaterial({ color: 0xfff8d8, depthTest: true, depthWrite: true, side: THREE.FrontSide })
      : new THREE.MeshBasicMaterial({
          map: createPhotoTexture(placement.label, placement.accent, index === 0),
          depthTest: true,
          depthWrite: false,
          transparent: true,
          side: THREE.FrontSide
        })
  );
  const tape = new THREE.Mesh(
    new THREE.PlaneGeometry(placement.width * 0.48, placement.height * 0.08),
    new THREE.MeshBasicMaterial({
      color: 0xeaff7a,
      opacity: 0.88,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      side: THREE.FrontSide
    })
  );
  const pinMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(PHOTO_HIGHLIGHT_COLOR),
    depthTest: true,
    depthWrite: false,
    side: THREE.FrontSide
  });

  tape.position.set(0, placement.height * 0.45, 0.024);
  tape.rotation.z = index % 2 === 0 ? -0.11 : 0.09;

  [-0.34, 0.34].forEach((x) => {
    const pin = new THREE.Mesh(new THREE.CircleGeometry(0.034, 18), pinMaterial);
    pin.position.set(placement.width * x, placement.height * 0.42, 0.028);
    panel.add(pin);
  });

  glow.position.z = -0.012;
  card.position.z = 0.012;
  panel.add(glow, card);

  if (placement.src) {
    const photoTexture = createLoadedPhotoTexture(placement.src, renderer, textureLoader);
    const photo = new THREE.Mesh(
      new THREE.PlaneGeometry(placement.width * 0.84, placement.height * 0.72),
      new THREE.MeshBasicMaterial({ map: photoTexture, depthTest: true, depthWrite: false, side: THREE.FrontSide })
    );
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(placement.width * 0.72, placement.height * 0.12),
      new THREE.MeshBasicMaterial({
        map: createPhotoLabelTexture(placement.label, placement.accent),
        transparent: true,
        depthTest: true,
        depthWrite: false,
        side: THREE.FrontSide
      })
    );

    photo.position.set(0, placement.height * 0.08, 0.026);
    label.position.set(0, -placement.height * 0.38, 0.03);
    panel.add(photo, label);
  }

  panel.add(tape);
  panel.position.set(...placement.position);
  panel.rotation.set(...placement.rotation);
  panel.renderOrder = 20;
  panel.userData.photoId = placement.id;
  panel.userData.baseY = placement.position[1];
  panel.userData.baseRotationZ = placement.rotation[2];
  keepPhotoPanelVisible(panel);

  return panel;
}

function keepPhotoPanelVisible(panel: THREE.Group) {
  panel.traverse((child) => {
    child.renderOrder = 20;

    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material];

    materials.forEach((material) => {
      material.depthTest = true;
      material.needsUpdate = true;
    });
  });
}

function createLoadedPhotoTexture(src: string, renderer: THREE.WebGLRenderer, textureLoader: THREE.TextureLoader) {
  const texture = textureLoader.load(src);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function findPhotoId(object: THREE.Object3D): string | null {
  let current: THREE.Object3D | null = object;

  while (current) {
    if (typeof current.userData.photoId === "string") {
      return current.userData.photoId;
    }

    current = current.parent;
  }

  return null;
}

function findNearestProjectedPhotoId(
  photos: THREE.Object3D[],
  camera: THREE.PerspectiveCamera,
  rect: DOMRect,
  clientX: number,
  clientY: number,
  relaxed: boolean
) {
  const projected = new THREE.Vector3();
  const target = new THREE.Vector3();
  const maxDistance = relaxed || rect.width < 760 ? 128 : 72;
  let bestPhotoId: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  photos.forEach((photo) => {
    const photoId = findPhotoId(photo);

    if (!photoId) {
      return;
    }

    photo.getWorldPosition(projected);
    target.copy(projected).project(camera);

    if (target.z < -1 || target.z > 1) {
      return;
    }

    const screenX = rect.left + ((target.x + 1) / 2) * rect.width;
    const screenY = rect.top + ((1 - target.y) / 2) * rect.height;
    const distance = Math.hypot(clientX - screenX, clientY - screenY);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestPhotoId = photoId;
    }
  });

  return bestDistance <= maxDistance ? bestPhotoId : null;
}

function createAnalysisStation() {
  const station = new THREE.Group();
  const pulseMaterials: THREE.MeshStandardMaterial[] = [];
  const trayMaterial = new THREE.MeshStandardMaterial({
    color: 0x405057,
    emissive: 0x10261f,
    emissiveIntensity: 0.3,
    roughness: 0.62,
    metalness: 0.12
  });
  const rubberMaterial = new THREE.MeshStandardMaterial({
    color: 0x06100d,
    emissive: 0x164326,
    emissiveIntensity: 0.34,
    roughness: 0.82
  });
  const acidMaterial = new THREE.MeshStandardMaterial({
    color: 0x9dff22,
    emissive: 0x6cff00,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.78,
    roughness: 0.22
  });
  const magentaMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4cab,
    emissive: 0xff1b8c,
    emissiveIntensity: 0.7,
    transparent: true,
    opacity: 0.72,
    roughness: 0.28
  });
  const cyanMaterial = new THREE.MeshStandardMaterial({
    color: 0x28f0d2,
    emissive: 0x15d9c5,
    emissiveIntensity: 0.7,
    transparent: true,
    opacity: 0.72,
    roughness: 0.28
  });

  station.name = "analysis-flask-station";
  station.position.set(...ANALYSIS_STATION_TUNING.position);
  station.rotation.set(...ANALYSIS_STATION_TUNING.rotation);
  station.scale.setScalar(ANALYSIS_STATION_TUNING.scale);
  station.userData.analysisTrigger = true;
  station.userData.baseY = station.position.y;
  station.userData.pulseMaterials = pulseMaterials;
  pulseMaterials.push(acidMaterial, magentaMaterial, cyanMaterial);

  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(0.8, 42),
    new THREE.MeshBasicMaterial({
      color: 0xfff36a,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.012;
  station.userData.highlightGlow = glow;
  station.userData.currentGlowScale = 1;

  const tray = markAnalysisTrigger(new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.08, 0.52), trayMaterial));
  tray.position.y = 0.04;

  const label = markAnalysisTrigger(
    new THREE.Mesh(
      new THREE.PlaneGeometry(0.52, 0.16),
      new THREE.MeshBasicMaterial({
        map: createAnalysisLabelTexture("START"),
        transparent: true,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    )
  );
  label.position.set(0.02, 0.24, 0.35);
  label.renderOrder = ANALYSIS_LABEL_RENDER_ORDER;

  const rack = markAnalysisTrigger(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.12), rubberMaterial));
  rack.position.set(0.34, 0.16, -0.12);

  station.add(glow, tray, label, rack);
  station.add(createWideFlask(-0.39, -0.11, acidMaterial));
  station.add(createRoundFlask(-0.07, -0.13, magentaMaterial));
  station.add(createTubeSet(0.27, -0.13, cyanMaterial));

  const leverBase = markAnalysisTrigger(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.24), rubberMaterial));
  leverBase.position.set(0.58, 0.12, 0.02);

  const leverPivot = new THREE.Group();
  const leverStick = markAnalysisTrigger(new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.42, 0.052), acidMaterial));
  const leverCap = markAnalysisTrigger(new THREE.Mesh(new THREE.SphereGeometry(0.07, 18, 12), acidMaterial));
  leverStick.position.y = 0.18;
  leverCap.position.y = 0.4;
  leverPivot.position.set(0.58, 0.17, 0.02);
  leverPivot.rotation.z = -0.32;
  leverPivot.userData.analysisTrigger = true;
  leverPivot.add(leverStick, leverCap);
  station.userData.lever = leverPivot;
  station.add(leverBase, leverPivot);

  const hitbox = markAnalysisTrigger(
    new THREE.Mesh(
      new THREE.BoxGeometry(...ANALYSIS_STATION_TUNING.hitboxSize),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false
      })
    )
  );
  hitbox.position.set(...ANALYSIS_STATION_TUNING.hitboxPosition);
  station.add(hitbox);

  return station;
}

function createWideFlask(x: number, z: number, liquidMaterial: THREE.MeshStandardMaterial) {
  const flask = new THREE.Group();
  const glassMaterial = createGlassMaterial();
  const body = markAnalysisTrigger(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.26, 22), glassMaterial));
  const liquid = markAnalysisTrigger(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.17, 0.12, 22), liquidMaterial));
  const neck = markAnalysisTrigger(new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.062, 0.24, 18), glassMaterial));
  const rim = markAnalysisTrigger(new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.01, 8, 18), glassMaterial));

  body.position.y = 0.22;
  liquid.position.y = 0.15;
  neck.position.y = 0.43;
  rim.position.y = 0.55;
  rim.rotation.x = Math.PI / 2;
  flask.position.set(x, 0.02, z);
  flask.userData.analysisTrigger = true;
  flask.add(body, liquid, neck, rim);

  return flask;
}

function createRoundFlask(x: number, z: number, liquidMaterial: THREE.MeshStandardMaterial) {
  const flask = new THREE.Group();
  const glassMaterial = createGlassMaterial();
  const body = markAnalysisTrigger(new THREE.Mesh(new THREE.SphereGeometry(0.17, 22, 16), glassMaterial));
  const liquid = markAnalysisTrigger(new THREE.Mesh(new THREE.SphereGeometry(0.145, 22, 12), liquidMaterial));
  const neck = markAnalysisTrigger(new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.054, 0.2, 16), glassMaterial));
  const cork = markAnalysisTrigger(new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.055, 14), new THREE.MeshStandardMaterial({ color: 0x172322, roughness: 0.86 })));

  body.position.y = 0.22;
  body.scale.y = 0.86;
  liquid.position.y = 0.16;
  liquid.scale.set(0.92, 0.46, 0.92);
  neck.position.y = 0.4;
  cork.position.y = 0.52;
  flask.position.set(x, 0.02, z);
  flask.userData.analysisTrigger = true;
  flask.add(body, liquid, neck, cork);

  return flask;
}

function createTubeSet(x: number, z: number, liquidMaterial: THREE.MeshStandardMaterial) {
  const tubes = new THREE.Group();
  const glassMaterial = createGlassMaterial();

  [-0.08, 0.02, 0.12].forEach((offset, index) => {
    const tube = new THREE.Group();
    const glass = markAnalysisTrigger(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.34 - index * 0.035, 14), glassMaterial));
    const liquid = markAnalysisTrigger(new THREE.Mesh(new THREE.CylinderGeometry(0.029, 0.029, 0.16, 14), liquidMaterial));

    glass.position.y = 0.25 - index * 0.015;
    liquid.position.y = 0.17;
    tube.position.set(offset, 0.02, index === 1 ? -0.02 : 0.04);
    tube.rotation.z = (index - 1) * 0.14;
    tube.userData.analysisTrigger = true;
    tube.add(glass, liquid);
    tubes.add(tube);
  });

  tubes.position.set(x, 0.04, z);
  tubes.userData.analysisTrigger = true;

  return tubes;
}

function createGlassMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xeaffff,
    emissive: 0x2be9d7,
    emissiveIntensity: 0.08,
    transparent: true,
    opacity: 0.36,
    roughness: 0.14,
    metalness: 0.02
  });
}

function createAnalysisLabelTexture(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.fillStyle = "#06100b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#9dff22";
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  ctx.fillStyle = "#9dff22";
  ctx.font = "900 58px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  return texture;
}

function markAnalysisTrigger<T extends THREE.Object3D>(object: T) {
  object.userData.analysisTrigger = true;
  return object;
}

function collectAnalysisTriggers(root: THREE.Object3D, targets: THREE.Object3D[]) {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh && findAnalysisTrigger(child)) {
      targets.push(child);
    }
  });
}

function findAnalysisTrigger(object: THREE.Object3D) {
  let current: THREE.Object3D | null = object;

  while (current) {
    if (current.userData.analysisTrigger === true) {
      return true;
    }

    current = current.parent;
  }

  return false;
}

function findNearestProjectedAnalysisTrigger(
  objects: THREE.Object3D[],
  camera: THREE.PerspectiveCamera,
  rect: DOMRect,
  clientX: number,
  clientY: number,
  relaxed: boolean
) {
  const projected = new THREE.Vector3();
  const target = new THREE.Vector3();
  const maxDistance = relaxed || rect.width < 760 ? 148 : 86;
  let bestDistance = Number.POSITIVE_INFINITY;

  objects.forEach((object) => {
    object.getWorldPosition(projected);
    target.copy(projected).project(camera);

    if (target.z < -1 || target.z > 1) {
      return;
    }

    const screenX = rect.left + ((target.x + 1) / 2) * rect.width;
    const screenY = rect.top + ((1 - target.y) / 2) * rect.height;
    const distance = Math.hypot(clientX - screenX, clientY - screenY);

    if (distance < bestDistance) {
      bestDistance = distance;
    }
  });

  return bestDistance <= maxDistance;
}

function createMirrorStation() {
  const station = new THREE.Group();
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x22313a,
    emissive: 0x082424,
    emissiveIntensity: 0.26,
    roughness: 0.46,
    metalness: 0.18
  });
  const mirrorMaterial = new THREE.MeshStandardMaterial({
    color: 0x9bdfff,
    emissive: 0x28f0d2,
    emissiveIntensity: 0.18,
    roughness: 0.18,
    metalness: 0.72,
    transparent: true,
    opacity: 0.78
  });
  const placeholder = new THREE.Group();
  const mirror = markMirrorTrigger(new THREE.Mesh(new THREE.PlaneGeometry(0.58, 1.26), mirrorMaterial));
  const topFrame = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.06, 0.07), frameMaterial);
  const bottomFrame = topFrame.clone();
  const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.36, 0.07), frameMaterial);
  const rightFrame = leftFrame.clone();
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.06, 0.42), frameMaterial);
  const hitbox = markMirrorTrigger(
    new THREE.Mesh(
      new THREE.BoxGeometry(...MIRROR_STATION_TUNING.hitboxSize),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })
    )
  );

  station.name = "customizer-mirror-station";
  station.position.set(...MIRROR_STATION_TUNING.position);
  station.rotation.set(...MIRROR_STATION_TUNING.rotation);
  station.scale.setScalar(MIRROR_STATION_TUNING.scale);
  station.userData.mirrorTrigger = true;

  placeholder.name = "mirror-placeholder";
  mirror.position.y = 0.92;
  mirror.position.z = 0.015;
  topFrame.position.set(0, 1.59, 0);
  bottomFrame.position.set(0, 0.25, 0);
  leftFrame.position.set(-0.38, 0.92, 0);
  rightFrame.position.set(0.38, 0.92, 0);
  foot.position.set(0, 0.05, 0.05);
  hitbox.position.set(...MIRROR_STATION_TUNING.hitboxPosition);
  placeholder.add(mirror, topFrame, bottomFrame, leftFrame, rightFrame, foot);
  station.add(placeholder, hitbox);
  station.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.renderOrder = MIRROR_RENDER_ORDER;
      child.frustumCulled = false;
    }
  });

  return station;
}

function loadMirrorAsset(loader: FBXLoader, station: THREE.Group) {
  loader.load(
    MIRROR_MODEL_URL,
    (model) => {
      prepareMirrorModel(model);
      const placeholder = station.getObjectByName("mirror-placeholder");

      if (placeholder) {
        placeholder.visible = false;
      }

      station.add(model);
    },
    undefined,
    () => undefined
  );
}

function prepareMirrorModel(model: THREE.Object3D) {
  model.name = "loaded-customizer-mirror";
  model.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z, 0.001);
  const scale = 1.62 / maxDimension;

  model.scale.setScalar(scale);
  model.rotation.y = Math.PI;
  model.updateMatrixWorld(true);

  const normalizedBox = new THREE.Box3().setFromObject(model);
  const normalizedCenter = normalizedBox.getCenter(new THREE.Vector3());
  model.position.x -= normalizedCenter.x;
  model.position.y -= normalizedBox.min.y;
  model.position.z -= normalizedCenter.z;
  model.position.y += 0.01;
  model.position.z += 0.02;
  model.traverse((child) => {
    child.userData.mirrorTrigger = true;

    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    child.renderOrder = MIRROR_RENDER_ORDER;
    child.frustumCulled = false;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      material.side = THREE.DoubleSide;
      material.transparent = false;
      material.depthWrite = true;
      material.depthTest = true;
      material.needsUpdate = true;
    });
  });
}

function markMirrorTrigger<T extends THREE.Object3D>(object: T) {
  object.userData.mirrorTrigger = true;
  return object;
}

function collectMirrorTriggers(root: THREE.Object3D, targets: THREE.Object3D[]) {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh && findMirrorTrigger(child)) {
      targets.push(child);
    }
  });
}

function findMirrorTrigger(object: THREE.Object3D) {
  let current: THREE.Object3D | null = object;

  while (current) {
    if (current.userData.mirrorTrigger === true) {
      return true;
    }

    current = current.parent;
  }

  return false;
}

function findNearestProjectedMirrorTrigger(
  objects: THREE.Object3D[],
  camera: THREE.PerspectiveCamera,
  rect: DOMRect,
  clientX: number,
  clientY: number,
  relaxed: boolean
) {
  const projected = new THREE.Vector3();
  const target = new THREE.Vector3();
  const maxDistance = relaxed || rect.width < 760 ? 132 : 74;
  let bestDistance = Number.POSITIVE_INFINITY;

  objects.forEach((object) => {
    object.getWorldPosition(projected);
    target.copy(projected).project(camera);

    if (target.z < -1 || target.z > 1) {
      return;
    }

    const screenX = rect.left + ((target.x + 1) / 2) * rect.width;
    const screenY = rect.top + ((1 - target.y) / 2) * rect.height;
    const distance = Math.hypot(clientX - screenX, clientY - screenY);

    if (distance < bestDistance) {
      bestDistance = distance;
    }
  });

  return bestDistance <= maxDistance;
}

function createPhotoRope() {
  const rope = new THREE.Group();
  const cord = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 0.032),
    new THREE.MeshBasicMaterial({
      color: 0xd6c17b,
      opacity: 0.78,
      transparent: true,
      side: THREE.DoubleSide
    })
  );

  cord.position.set(0.78, 2.92, -2.4);
  cord.rotation.y = 0.02;
  rope.add(cord);

  [-0.72, 0.86, 2.2].forEach((x, index) => {
    const clip = new THREE.Mesh(
      new THREE.PlaneGeometry(0.1, 0.18),
      new THREE.MeshBasicMaterial({
        color: index % 2 === 0 ? 0xfff36a : 0xeaff7a,
        opacity: 0.88,
        transparent: true,
        side: THREE.DoubleSide
      })
    );

    clip.position.set(x, 2.8, -2.38);
    clip.rotation.z = index === 1 ? -0.08 : 0.08;
    rope.add(clip);
  });

  return rope;
}

function createPhotoTexture(label: string, accent: string, isHero: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 640;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.fillStyle = "#fff8d8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#efe2b4";
  ctx.fillRect(18, 18, canvas.width - 36, canvas.height - 36);
  ctx.fillStyle = "#fff8d8";
  ctx.fillRect(28, 28, canvas.width - 56, canvas.height - 56);

  const photoGradient = ctx.createLinearGradient(48, 48, 464, 500);
  photoGradient.addColorStop(0, "#0c4265");
  photoGradient.addColorStop(0.48, "#108d9d");
  photoGradient.addColorStop(1, "#071425");
  ctx.fillStyle = photoGradient;
  ctx.fillRect(52, 54, 408, 426);

  const acidGradient = ctx.createRadialGradient(256, 250, 12, 256, 250, 190);
  acidGradient.addColorStop(0, accent);
  acidGradient.addColorStop(0.18, "#9dff22");
  acidGradient.addColorStop(0.48, "rgba(157,255,34,0.24)");
  acidGradient.addColorStop(1, "rgba(157,255,34,0)");
  ctx.fillStyle = acidGradient;
  ctx.fillRect(52, 54, 408, 426);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(52, 54, 408, 426);

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  for (let i = 0; i < 14; i += 1) {
    const x = 76 + ((i * 71) % 350);
    const y = 86 + ((i * 103) % 330);
    ctx.beginPath();
    ctx.arc(x, y, i % 3 === 0 ? 6 : 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#17242a";
  ctx.font = `${isHero ? 38 : 32}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label.toUpperCase(), 256, 552);

  ctx.fillStyle = accent;
  ctx.fillRect(92, 600, 328, 10);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createPhotoLabelTexture(label: string, accent: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 420;
  canvas.height = 96;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#17242a";
  ctx.font = "900 34px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label.toUpperCase(), canvas.width / 2, 40);
  ctx.fillStyle = accent;
  ctx.fillRect(72, 74, 276, 8);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function prepareGarageModel(model: THREE.Object3D, textures: Record<GarageTextureKey, THREE.Texture>) {
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    const meshName = child.name.toLowerCase();

    if (meshName.includes("background")) {
      child.visible = false;
      return;
    }

    child.castShadow = false;
    child.receiveShadow = true;
    child.frustumCulled = false;

    const materials = Array.isArray(child.material) ? child.material : [child.material];

    materials.forEach((material) => {
      const materialWithMap = material as MaterialWithMap;
      const textureKey = getTextureKey(child.name, material.name);

      material.side = THREE.DoubleSide;

      if (textureKey) {
        materialWithMap.map = textures[textureKey];
        materialWithMap.color?.set(0xffffff);
      }

      const materialName = material.name.toLowerCase();
      const shellOpacity = getShellOpacity(child.name);

      if (materialWithMap.roughness !== undefined) {
        materialWithMap.roughness = 0.82;
      }

      if (materialWithMap.metalness !== undefined) {
        materialWithMap.metalness = 0.04;
      }

      if (materialWithMap.emissive && materialName.includes("cable-light")) {
        materialWithMap.emissive.set(0x9dff22);
        materialWithMap.emissiveIntensity = 0.82;
      }

      if (shellOpacity !== null) {
        material.transparent = false;
        material.opacity = 1;
        material.depthWrite = true;
      }

      material.needsUpdate = true;
    });
  });
}

function getShellOpacity(meshName: string) {
  const marker = meshName.toLowerCase();

  if (marker === "wall") {
    return 0.54;
  }

  if (marker === "ceiling") {
    return 0.42;
  }

  if (marker.startsWith("wood")) {
    return 0.62;
  }

  return null;
}

function getTextureKey(meshName: string, materialName: string): GarageTextureKey | null {
  const marker = `${meshName} ${materialName}`.toLowerCase();

  if (marker.includes("cable-light")) {
    return "cableLight";
  }

  if (marker.includes("cable-dark")) {
    return "cableDark";
  }

  if (marker.includes("background")) {
    return "background";
  }

  if (marker.includes("interior")) {
    return "interior";
  }

  if (marker.includes("ceiling")) {
    return "ceiling";
  }

  if (marker.includes("floor")) {
    return "floor";
  }

  if (marker.includes("wall")) {
    return "wall";
  }

  if (marker.includes("wood")) {
    return "wood";
  }

  return null;
}

function normalizeGarageModel(model: THREE.Object3D) {
  const originalBox = new THREE.Box3().setFromObject(model);
  const size = originalBox.getSize(new THREE.Vector3());
  const maxFloorDimension = Math.max(size.x, size.z, 0.001);
  const scale = 8.8 / maxFloorDimension;

  model.scale.setScalar(scale);
  model.rotation.set(0, 0, 0);
  model.updateMatrixWorld(true);

  const fittedBox = new THREE.Box3().setFromObject(model);
  const fittedCenter = fittedBox.getCenter(new THREE.Vector3());

  model.position.x -= fittedCenter.x;
  model.position.y -= fittedBox.min.y + 0.08;
  model.position.z -= fittedCenter.z + 0.08;
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  const materials = Array.isArray(material) ? material : [material];

  materials.forEach((entry) => {
    const materialWithMaps = entry as THREE.Material & {
      map?: THREE.Texture;
      normalMap?: THREE.Texture;
      roughnessMap?: THREE.Texture;
      metalnessMap?: THREE.Texture;
      emissiveMap?: THREE.Texture;
    };

    materialWithMaps.map?.dispose();
    materialWithMaps.normalMap?.dispose();
    materialWithMaps.roughnessMap?.dispose();
    materialWithMaps.metalnessMap?.dispose();
    materialWithMaps.emissiveMap?.dispose();
    entry.dispose();
  });
}
