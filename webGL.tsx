import { createEffect } from "solid-js";
import * as THREE from "three";
import { FontLoader, TextGeometry } from "three/examples/jsm/Addons.js";

const colors = [0xef4444, 0xf97316, 0x3b82f6, 0xa855f7, 0x22c55e, 0xeab308];
const randomColor = () => colors[Math.floor(Math.random() * colors.length)];

class Cube extends THREE.Mesh {
  constructor(geometry: THREE.BoxGeometry, material: THREE.MeshBasicMaterial) {
    super(geometry, material);
  }
  changeColor() {
    (this.material as THREE.MeshBasicMaterial).color.set(randomColor());
  }
  rotate() {
    this.rotateX(0.01);
    this.rotateY(0.01);
  }
}

const getCubeMaterial = () => {
  return new THREE.MeshBasicMaterial({
    color: randomColor(),
  });
};

const setupCube = (
  geometry: THREE.BoxGeometry,
  material: THREE.MeshBasicMaterial,
  position: THREE.Vector3Tuple,
  scene: THREE.Scene
) => {
  const cube = new Cube(geometry, material);
  scene.add(cube);
  cube.position.set(...position);
  return cube;
};

const WebGlIndex = () => {
  let container: HTMLDivElement | undefined;
  createEffect(() => {
    if (!container) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(75, 1024 / 720, 0.1, 1000);
    camera.position.z = 10;
    const renderer = new THREE.WebGLRenderer();

    renderer.setSize(1024, 720);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry(1, 1, 1);

    const cubeLeftMaterial = getCubeMaterial();
    const cubeMiddleMaterial = getCubeMaterial();
    const cubeRightMaterial = getCubeMaterial();

    const cubeLeft = setupCube(geometry, cubeLeftMaterial, [-2.5, 0, 5], scene);
    const cubeMiddle = setupCube(
      geometry,
      cubeMiddleMaterial,
      [0, 0, 5],
      scene
    );
    const cubeRight = setupCube(
      geometry,
      cubeRightMaterial,
      [2.5, 0, 5],
      scene
    );

    const fontLoader = new FontLoader();
    fontLoader.load("./Inter_Regular.json", (font) => {
      const textGeometry = new TextGeometry("Hello", {
        font: font,
        size: 1.75,
        height: 0,
        bevelEnabled: true,
        bevelThickness: 0.07,
        bevelSize: 0.03,
        bevelSegments: 5,
      });
      const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      scene.add(textMesh);
      textMesh.position.set(-3, 3, 0);
    });

    let lastColorChange = 0;
    const colorChangeInterval = 2000;

    const animate = (time: number) => {
      if (time - lastColorChange > colorChangeInterval) {
        cubeLeft.changeColor();
        cubeMiddle.changeColor();
        cubeRight.changeColor();
        lastColorChange = time;
      }
      cubeLeft.rotate();
      cubeMiddle.rotate();
      cubeRight.rotate();
      renderer.render(scene, camera);
    };
    renderer.setAnimationLoop(animate);
  });
  return <div ref={container} class="w-[1024px] h-[720px] mx-auto"></div>;
};

export default WebGlIndex;
