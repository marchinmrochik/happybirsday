"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type CharacterModelsCanvasProps = {
  isClosed: boolean;
};

export default function CharacterModelsCanvas({ isClosed }: CharacterModelsCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const isClosedRef = useRef(isClosed);

  useEffect(() => {
    isClosedRef.current = isClosed;
  }, [isClosed]);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, mount.clientWidth / mount.clientHeight, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    const stage = new THREE.Group();
    const scientistGroup = new THREE.Group();
    const buddyGroup = new THREE.Group();
    const clock = new THREE.Clock();

    camera.position.set(0, 0.52, 8.4);
    camera.lookAt(0, -0.42, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    scientistGroup.position.set(-4.05, -1.32, 0.05);
    buddyGroup.position.set(4.18, -1.32, 0.16);
    stage.add(scientistGroup, buddyGroup);
    scene.add(stage);
    scene.add(new THREE.AmbientLight(0xffffff, 2.8));

    const keyLight = new THREE.DirectionalLight(0xb8ffd4, 3.2);
    keyLight.position.set(2.5, 4.4, 4);
    scene.add(keyLight);

    const violetLight = new THREE.PointLight(0x8b4dff, 14, 16);
    violetLight.position.set(-3.4, 1.8, 2.6);
    scene.add(violetLight);

    const acidLight = new THREE.PointLight(0x9dff22, 20, 18);
    acidLight.position.set(0, 1.2, 3.2);
    scene.add(acidLight);

    const gltfLoader = new GLTFLoader();
    const fbxLoader = new FBXLoader();

    gltfLoader.load("/assets/models/rick-sanchez.glb", (gltf) => {
      const model = gltf.scene;
      prepareModel(model);
      normalizeModel(model, 2.96);
      model.rotation.y = 0.24;
      scientistGroup.add(model);
    });

    fbxLoader.load("/assets/models/morty-new.fbx", (model) => {
      prepareMortyModel(model);
      normalizeModel(model, 2.4);
      model.rotation.y = -0.18;
      buddyGroup.add(model);
    });

    const animate = () => {
      const time = clock.getElapsedTime();
      const exitScale = isClosedRef.current ? 0.08 : 1;

      stage.position.y = Math.sin(time * 1.4) * 0.055;
      stage.rotation.y = Math.sin(time * 0.72) * 0.035;
      stage.scale.setScalar(exitScale);
      scientistGroup.rotation.z = Math.sin(time * 1.18) * 0.014;
      buddyGroup.rotation.z = Math.sin(time * 1.35 + 0.6) * 0.018;
      camera.lookAt(0, -0.42, 0);
      renderer.render(scene, camera);
      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);

    const resize = () => {
      if (!mountRef.current) {
        return;
      }

      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();

          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="character-models-canvas" ref={mountRef} aria-hidden="true" data-closed={isClosed} />;
}

function prepareModel(model: THREE.Object3D) {
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = false;
      child.receiveShadow = false;
      child.frustumCulled = false;

      if (Array.isArray(child.material)) {
        child.material.forEach((material) => {
          material.side = THREE.DoubleSide;
        });
      } else {
        child.material.side = THREE.DoubleSide;
      }
    }
  });
}

function prepareMortyModel(model: THREE.Object3D) {
  const palette: Record<string, number> = {
    "Clay Doh": 0xffdf38,
    "Clay Doh.001": 0x5a3217,
    "Clay Doh.002": 0xffc08a,
    "Clay Doh.003": 0x17110d,
    "Clay Doh.004": 0x245f9f,
    "Clay Doh.005": 0x5a3217,
    "Clay Doh.006": 0x5b181c
  };

  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    child.castShadow = false;
    child.receiveShadow = false;
    child.frustumCulled = false;

    const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
    const toonMaterials = sourceMaterials.map((material) => {
      const color = palette[material.name] ?? 0xffc08a;

      return new THREE.MeshStandardMaterial({
        color,
        emissive: color === 0xffdf38 ? 0x1a1400 : 0x080604,
        emissiveIntensity: color === 0xffdf38 ? 0.16 : 0.08,
        roughness: 0.74,
        metalness: 0,
        side: THREE.DoubleSide
      });
    });

    child.material = Array.isArray(child.material) ? toonMaterials : toonMaterials[0];
  });
}

function normalizeModel(model: THREE.Object3D, targetHeight: number) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = targetHeight / Math.max(size.y, 0.001);

  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
}
