import * as THREE from "three";
import type { CharacterCustomization } from "@/src/data/characterCustomization";

export type FaceMood = "neutral" | "softSmile" | "bigSmile";

const PLAYER_SHELL_RENDER_ORDER = 2000;
const SHOE_BASE_Y = 0.088;
const SHOE_BASE_Z = 0.035;

type MaterialWithColor = THREE.Material & {
  color?: THREE.Color;
};

export function animateVisiblePlayerShell(root: THREE.Group, isMoving: boolean, walkTime: number, faceMood: FaceMood) {
  const armLeft = root.getObjectByName("shell-arm-left");
  const armRight = root.getObjectByName("shell-arm-right");
  const legLeft = root.getObjectByName("shell-leg-left");
  const legRight = root.getObjectByName("shell-leg-right");
  const shoeLeft = root.getObjectByName("shell-shoe-left");
  const shoeRight = root.getObjectByName("shell-shoe-right");
  const torso = root.getObjectByName("shell-torso");
  const faceGroup = root.getObjectByName("shell-face-group");
  const mouthNeutral = root.getObjectByName("shell-mouth-neutral");
  const mouthSmile = root.getObjectByName("shell-mouth-smile");
  const mouthTeeth = root.getObjectByName("shell-mouth-teeth");
  const stride = isMoving ? Math.sin(walkTime) : 0;
  const idle = isMoving ? 0 : Math.sin(walkTime) * 0.018;
  const leftLift = isMoving ? Math.max(0, stride) * 0.052 : 0;
  const rightLift = isMoving ? Math.max(0, -stride) * 0.052 : 0;

  if (armLeft) {
    armLeft.rotation.x = stride * 0.34;
  }

  if (armRight) {
    armRight.rotation.x = -stride * 0.34;
  }

  if (legLeft) {
    legLeft.rotation.x = -stride * 0.24;
    legLeft.position.y = 0.41 + leftLift * 0.12;
    legLeft.position.z = Math.max(0, stride) * 0.026;
  }

  if (legRight) {
    legRight.rotation.x = stride * 0.24;
    legRight.position.y = 0.41 + rightLift * 0.12;
    legRight.position.z = Math.max(0, -stride) * 0.026;
  }

  if (shoeLeft) {
    shoeLeft.position.y = SHOE_BASE_Y + leftLift * 0.46;
    shoeLeft.position.z = SHOE_BASE_Z + Math.max(0, stride) * 0.026 - Math.max(0, -stride) * 0.006;
    shoeLeft.rotation.x = -stride * 0.055;
  }

  if (shoeRight) {
    shoeRight.position.y = SHOE_BASE_Y + rightLift * 0.46;
    shoeRight.position.z = SHOE_BASE_Z + Math.max(0, -stride) * 0.026 - Math.max(0, stride) * 0.006;
    shoeRight.rotation.x = stride * 0.055;
  }

  if (torso) {
    torso.position.y = 1.06 + (isMoving ? Math.abs(stride) * 0.025 : idle);
  }

  if (faceGroup) {
    faceGroup.position.y = isMoving ? Math.abs(stride) * 0.018 : idle;
  }

  if (mouthNeutral && mouthSmile && mouthTeeth) {
    mouthNeutral.visible = faceMood === "neutral";
    mouthSmile.visible = faceMood === "softSmile";
    mouthTeeth.visible = faceMood === "bigSmile";
  }
}

export function getCustomizationKey(customization: CharacterCustomization) {
  return [
    customization.shirtColor,
    customization.shortsColor,
    customization.capColor,
    customization.capEnabled ? "cap-on" : "cap-off",
    customization.eyeStyle,
    customization.browStyle,
    customization.hairStyle
  ].join("|");
}

export function applyPlayerCustomization(root: THREE.Group, customization: CharacterCustomization) {
  setMeshColor(root, "shell-torso", customization.shirtColor);
  setMeshColor(root, "shell-shorts", customization.shortsColor);
  setMeshColor(root, "shell-cap-crown", customization.capColor);
  applyEyeStyle(root, customization.eyeStyle);
  applyBrowStyle(root, customization.browStyle);
  applyHairStyle(root, customization.hairStyle, customization.capEnabled);
}

export function createVisiblePlayerShell(customization: CharacterCustomization) {
  const shell = new THREE.Group();
  const skin = createPlayerShellMaterial(0xf0a960);
  const shirt = createPlayerShellMaterial(colorStringToNumber(customization.shirtColor));
  const shorts = createPlayerShellMaterial(colorStringToNumber(customization.shortsColor));
  const hair = createPlayerShellMaterial(0x2c1608);
  const capMaterial = createPlayerShellMaterial(colorStringToNumber(customization.capColor));
  const capBrimMaterial = createPlayerShellMaterial(0x090909);
  const shoeSole = createPlayerShellMaterial(0xf5f2e9);
  const shoeUpper = createPlayerShellMaterial(0xfff5e6);
  const shoeRed = createPlayerShellMaterial(0xd92323);
  const shoeBlack = createPlayerShellMaterial(0x111111);
  const shoeLace = createPlayerShellMaterial(0xf9f9f9);
  const eye = createPlayerShellMaterial(0xfff7e6);
  const pupil = createPlayerShellMaterial(0x070707);
  const mouth = createPlayerShellMaterial(0x3b1114);
  const teeth = createPlayerShellMaterial(0xfff3d8);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.55, 0.26), shirt);
  torso.name = "shell-torso";
  torso.position.set(0, 1.06, 0);

  const shortsMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.24, 0.28), shorts);
  shortsMesh.name = "shell-shorts";
  shortsMesh.position.set(0, 0.7, 0);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.16, 18), skin);
  neck.position.set(0, 1.42, 0);

  const faceGroup = new THREE.Group();
  faceGroup.name = "shell-face-group";

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 18), skin);
  head.name = "shell-head";
  head.scale.set(0.92, 1.16, 0.84);
  head.position.set(0, 1.67, 0.04);

  const hairCap = new THREE.Mesh(new THREE.CapsuleGeometry(0.108, 0.38, 8, 24), hair);
  hairCap.name = "shell-hair-cap";
  hairCap.scale.set(1.06, 0.34, 1.52);
  hairCap.rotation.x = Math.PI / 2;
  hairCap.position.set(0, 1.865, 0.025);

  const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.205, 24, 12), hair);
  hairCrown.name = "shell-hair-crown";
  hairCrown.scale.set(0.92, 0.58, 1.22);
  hairCrown.position.set(0, 1.84, -0.12);

  const hairFront = new THREE.Mesh(new THREE.CapsuleGeometry(0.046, 0.22, 6, 18), hair);
  hairFront.name = "shell-hair-front";
  hairFront.scale.set(0.78, 0.4, 0.46);
  hairFront.rotation.set(0.16, 0, Math.PI / 2);
  hairFront.position.set(0.012, 1.823, 0.205);

  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.11, 18, 12), hair);
  bun.name = "shell-hair-bun";
  bun.scale.set(1.18, 0.96, 1.02);
  bun.position.set(0.05, 1.76, -0.25);

  const hairBackBridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.074, 0.24, 6, 18), hair);
  hairBackBridge.name = "shell-hair-back-bridge";
  hairBackBridge.rotation.x = Math.PI / 2;
  hairBackBridge.position.set(0.025, 1.765, -0.16);

  const capGroup = new THREE.Group();
  capGroup.name = "shell-cap-group";
  const capCrown = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 12), capMaterial);
  capCrown.name = "shell-cap-crown";
  capCrown.scale.set(1.1, 0.62, 1);
  capCrown.position.set(0, 1.9, 0);
  const capBrim = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.035, 0.16), capBrimMaterial);
  capBrim.name = "shell-cap-brim";
  capBrim.position.set(0, 1.855, 0.215);
  capBrim.rotation.x = -0.16;
  capGroup.add(capCrown, capBrim);

  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.052, 16, 10), eye);
  const rightEye = leftEye.clone();
  leftEye.name = "shell-eye-left";
  rightEye.name = "shell-eye-right";
  leftEye.scale.z = 0.32;
  rightEye.scale.z = 0.32;
  leftEye.position.set(-0.07, 1.69, 0.235);
  rightEye.position.set(0.07, 1.69, 0.235);

  const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.017, 12, 8), pupil);
  const rightPupil = leftPupil.clone();
  leftPupil.name = "shell-pupil-left";
  rightPupil.name = "shell-pupil-right";
  leftPupil.scale.z = 0.2;
  rightPupil.scale.z = 0.2;
  leftPupil.position.set(-0.07, 1.69, 0.252);
  rightPupil.position.set(0.07, 1.69, 0.252);

  const browMaterial = createPlayerShellMaterial(0x2c1608);
  const leftBrow = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.018, 0.014), browMaterial);
  const rightBrow = leftBrow.clone();
  leftBrow.name = "shell-brow-left";
  rightBrow.name = "shell-brow-right";
  leftBrow.position.set(-0.07, 1.77, 0.254);
  rightBrow.position.set(0.07, 1.77, 0.254);

  const mouthNeutral = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.024, 0.014), mouth);
  mouthNeutral.name = "shell-mouth-neutral";
  mouthNeutral.position.set(0, 1.585, 0.274);

  const mouthSmile = new THREE.Mesh(new THREE.TorusGeometry(0.083, 0.01, 8, 24, Math.PI), mouth);
  mouthSmile.name = "shell-mouth-smile";
  mouthSmile.scale.y = 0.46;
  mouthSmile.rotation.z = Math.PI;
  mouthSmile.position.set(0, 1.596, 0.276);

  const mouthTeeth = new THREE.Group();
  mouthTeeth.name = "shell-mouth-teeth";
  const mouthTeethBack = new THREE.Mesh(new THREE.CircleGeometry(0.09, 24), mouth);
  mouthTeethBack.scale.y = 0.46;
  mouthTeethBack.position.set(0, 1.588, 0.274);
  const teethPatch = new THREE.Mesh(new THREE.BoxGeometry(0.128, 0.04, 0.014), teeth);
  teethPatch.position.set(0, 1.604, 0.282);
  mouthTeeth.add(mouthTeethBack, teethPatch);
  mouthTeeth.visible = false;

  faceGroup.add(
    head,
    hairCrown,
    hairCap,
    hairFront,
    hairBackBridge,
    bun,
    capGroup,
    leftEye,
    rightEye,
    leftPupil,
    rightPupil,
    leftBrow,
    rightBrow,
    mouthNeutral,
    mouthSmile,
    mouthTeeth
  );

  const armLeft = createShellLimb(0.07, 0.5, skin);
  const armRight = createShellLimb(0.07, 0.5, skin);
  armLeft.name = "shell-arm-left";
  armRight.name = "shell-arm-right";
  armLeft.position.set(-0.34, 1.0, 0);
  armRight.position.set(0.34, 1.0, 0);
  armLeft.rotation.z = 0.1;
  armRight.rotation.z = -0.1;

  const legLeft = createShellLimb(0.076, 0.5, skin);
  const legRight = createShellLimb(0.076, 0.5, skin);
  legLeft.name = "shell-leg-left";
  legRight.name = "shell-leg-right";
  legLeft.position.set(-0.12, 0.41, 0);
  legRight.position.set(0.12, 0.41, 0);

  const shoeMaterials = { sole: shoeSole, upper: shoeUpper, red: shoeRed, black: shoeBlack, lace: shoeLace };
  const shoeLeft = createStylizedSneaker("left", shoeMaterials);
  const shoeRight = createStylizedSneaker("right", shoeMaterials);
  shoeLeft.name = "shell-shoe-left";
  shoeRight.name = "shell-shoe-right";
  shoeLeft.position.set(-0.12, SHOE_BASE_Y, SHOE_BASE_Z);
  shoeRight.position.set(0.12, SHOE_BASE_Y, SHOE_BASE_Z);

  shell.name = "visible-player-shell";
  shell.add(torso, shortsMesh, neck, faceGroup, armLeft, armRight, legLeft, legRight, shoeLeft, shoeRight);
  shell.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    child.castShadow = false;
    child.receiveShadow = false;
    child.frustumCulled = false;
    child.renderOrder = PLAYER_SHELL_RENDER_ORDER;
  });
  applyPlayerCustomization(shell, customization);

  return shell;
}

function setMeshColor(root: THREE.Object3D, objectName: string, color: string) {
  const object = root.getObjectByName(objectName);

  if (!(object instanceof THREE.Mesh)) {
    return;
  }

  const materials = Array.isArray(object.material) ? object.material : [object.material];
  materials.forEach((material) => {
    const materialWithColor = material as MaterialWithColor;
    materialWithColor.color?.set(color);
    material.needsUpdate = true;
  });
}

function applyEyeStyle(root: THREE.Object3D, eyeStyle: CharacterCustomization["eyeStyle"]) {
  const leftEye = root.getObjectByName("shell-eye-left");
  const rightEye = root.getObjectByName("shell-eye-right");
  const leftPupil = root.getObjectByName("shell-pupil-left");
  const rightPupil = root.getObjectByName("shell-pupil-right");
  const configs = {
    wide: { eyeScale: [1, 1, 0.32], eyeY: 1.69, pupilScale: [1, 1, 0.2], pupilY: 1.69 },
    focused: { eyeScale: [1.05, 0.78, 0.32], eyeY: 1.695, pupilScale: [0.9, 0.9, 0.2], pupilY: 1.692 },
    sleepy: { eyeScale: [1.06, 0.52, 0.32], eyeY: 1.685, pupilScale: [0.84, 0.84, 0.2], pupilY: 1.68 }
  } as const;
  const config = configs[eyeStyle];

  [leftEye, rightEye].forEach((eye) => {
    if (eye) {
      eye.scale.set(config.eyeScale[0], config.eyeScale[1], config.eyeScale[2]);
      eye.position.y = config.eyeY;
    }
  });

  [leftPupil, rightPupil].forEach((pupil) => {
    if (pupil) {
      pupil.scale.set(config.pupilScale[0], config.pupilScale[1], config.pupilScale[2]);
      pupil.position.y = config.pupilY;
    }
  });
}

function applyBrowStyle(root: THREE.Object3D, browStyle: CharacterCustomization["browStyle"]) {
  const leftBrow = root.getObjectByName("shell-brow-left");
  const rightBrow = root.getObjectByName("shell-brow-right");

  if (!leftBrow || !rightBrow) {
    return;
  }

  const config = {
    soft: { leftY: 1.77, rightY: 1.77, leftZ: 0.256, rightZ: 0.256, leftRz: 0.12, rightRz: -0.12 },
    raised: { leftY: 1.79, rightY: 1.782, leftZ: 0.256, rightZ: 0.256, leftRz: 0.04, rightRz: -0.24 },
    serious: { leftY: 1.758, rightY: 1.758, leftZ: 0.258, rightZ: 0.258, leftRz: -0.24, rightRz: 0.24 }
  }[browStyle];

  leftBrow.position.set(-0.07, config.leftY, config.leftZ);
  rightBrow.position.set(0.07, config.rightY, config.rightZ);
  leftBrow.rotation.set(0, 0, config.leftRz);
  rightBrow.rotation.set(0, 0, config.rightRz);
}

function applyHairStyle(root: THREE.Object3D, hairStyle: CharacterCustomization["hairStyle"], capEnabled: boolean) {
  const hairCap = root.getObjectByName("shell-hair-cap");
  const hairCrown = root.getObjectByName("shell-hair-crown");
  const hairFront = root.getObjectByName("shell-hair-front");
  const bridge = root.getObjectByName("shell-hair-back-bridge");
  const bun = root.getObjectByName("shell-hair-bun");
  const capGroup = root.getObjectByName("shell-cap-group");
  const capVisible = capEnabled || hairStyle === "cap";

  if (capGroup) {
    capGroup.visible = capVisible;
  }

  if (hairCap) {
    hairCap.visible = hairStyle !== "cap";
    hairCap.position.set(0, 1.865, 0.025);
    hairCap.rotation.set(Math.PI / 2, 0, 0);
    hairCap.scale.set(hairStyle === "shortTop" ? 0.82 : 1.06, hairStyle === "shortTop" ? 0.22 : 0.34, hairStyle === "shortTop" ? 0.72 : 1.52);
  }

  if (hairCrown) {
    hairCrown.visible = hairStyle === "bun";
    hairCrown.position.set(0, 1.84, -0.12);
    hairCrown.rotation.set(0, 0, 0);
    hairCrown.scale.set(0.92, 0.58, 1.22);
  }

  if (hairFront) {
    hairFront.visible = hairStyle === "shortTop";
    hairFront.position.set(0.012, hairStyle === "shortTop" ? 1.846 : 1.823, hairStyle === "shortTop" ? 0.178 : 0.205);
    hairFront.rotation.set(0.16, 0, Math.PI / 2);
    hairFront.scale.set(hairStyle === "shortTop" ? 0.64 : 0.78, hairStyle === "shortTop" ? 0.34 : 0.4, hairStyle === "shortTop" ? 0.42 : 0.46);
  }

  if (bridge) {
    bridge.visible = hairStyle === "bun";
    bridge.position.set(0.025, 1.775, -0.2);
    bridge.rotation.set(Math.PI / 2, 0, 0);
    bridge.scale.set(0.92, 0.86, 1);
  }

  if (bun) {
    bun.visible = hairStyle === "bun";
    bun.position.set(0.05, 1.75, -0.32);
    bun.rotation.set(0, 0, 0);
    bun.scale.set(1.04, 0.92, 0.96);
  }
}

function createStylizedSneaker(
  side: "left" | "right",
  materials: {
    sole: THREE.Material;
    upper: THREE.Material;
    red: THREE.Material;
    black: THREE.Material;
    lace: THREE.Material;
  }
) {
  const sneaker = new THREE.Group();
  const sideSign = side === "left" ? -1 : 1;
  const sole = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.046, 0.3), materials.sole);
  const toe = new THREE.Mesh(new THREE.SphereGeometry(0.082, 18, 10), materials.upper);
  const upper = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.12, 0.22), materials.upper);
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.19, 0.24), materials.upper);
  const heel = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.15, 0.04), materials.black);
  const sidePanel = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.09, 0.15), materials.red);
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.074, 0.125, 0.028), materials.red);
  const laceOne = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.016), materials.lace);
  const laceTwo = laceOne.clone();
  const laceThree = laceOne.clone();

  sole.position.set(0, 0, 0);
  toe.scale.set(1, 0.56, 0.82);
  toe.position.set(0, 0.036, 0.13);
  upper.position.set(0, 0.078, 0.025);
  collar.position.set(0, 0.148, -0.045);
  heel.position.set(0, 0.126, -0.178);
  sidePanel.position.set(sideSign * 0.096, 0.103, 0.0);
  tongue.position.set(0, 0.142, 0.054);
  tongue.rotation.x = -0.26;
  laceOne.position.set(0, 0.138, 0.108);
  laceTwo.position.set(0, 0.151, 0.066);
  laceThree.position.set(0, 0.164, 0.026);
  laceOne.rotation.y = 0.2 * sideSign;
  laceTwo.rotation.y = -0.14 * sideSign;
  laceThree.rotation.y = 0.12 * sideSign;

  [sole, toe, upper, collar, heel, sidePanel, tongue, laceOne, laceTwo, laceThree].forEach((mesh) => {
    mesh.name = `shell-sneaker-${side}`;
    mesh.renderOrder = PLAYER_SHELL_RENDER_ORDER;
  });

  sneaker.userData.proceduralSneaker = true;
  sneaker.add(sole, toe, upper, collar, heel, sidePanel, tongue, laceOne, laceTwo, laceThree);
  return sneaker;
}

function createShellLimb(radius: number, height: number, material: THREE.Material) {
  const limb = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.92, height, 18), material);
  limb.position.y = 0;
  return limb;
}

function createPlayerShellMaterial(color: number) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: false,
    opacity: 1,
    depthTest: true,
    depthWrite: true,
    side: THREE.DoubleSide,
    fog: false,
    toneMapped: false
  });
}

function colorStringToNumber(color: string) {
  return new THREE.Color(color).getHex();
}
