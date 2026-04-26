import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Ref } from 'vue';

export function initThreeScene(canvas: HTMLCanvasElement, isPlaying: Ref<boolean>) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new Scene();
  const camera = new PerspectiveCamera(
    35,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    100,
  );
  camera.position.set(0, 5, 7);
  camera.lookAt(0, 0, 0);

  // Studio environment map so metallic surfaces have something to reflect.
  const pmremGenerator = new PMREMGenerator(renderer);
  const envMap = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envMap;
  pmremGenerator.dispose();

  const ambientLight = new AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new DirectionalLight(0xffffff, 3);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  // Decay 0 disables physically-correct distance falloff so these lights
  // behave like the original r128 setup at the same intensity scale.
  const pointLight = new PointLight(0x00f0ff, 4, 20, 0);
  pointLight.position.set(-3, 3, 3);
  scene.add(pointLight);

  const backLight = new PointLight(0xff00ff, 2, 20, 0);
  backLight.position.set(3, 2, -3);
  scene.add(backLight);

  const metalMat = new MeshStandardMaterial({
    color: 0x999999,
    metalness: 1.0,
    roughness: 0.15,
  });

  const darkMat = new MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.8,
    roughness: 0.6,
  });

  const body = new Mesh(new BoxGeometry(5.5, 0.5, 4.5), metalMat);
  scene.add(body);

  const top = new Mesh(new BoxGeometry(5.3, 0.1, 4.3), darkMat);
  top.position.y = 0.3;
  scene.add(top);

  const cdGeo = new CylinderGeometry(1.8, 1.8, 0.02, 64);
  const cdCanvas = document.createElement('canvas');
  cdCanvas.width = 512;
  cdCanvas.height = 512;
  const ctx = cdCanvas.getContext('2d')!;

  const gradient = ctx.createConicGradient(0, 256, 256);
  gradient.addColorStop(0, '#00f0ff');
  gradient.addColorStop(0.2, '#ff00ff');
  gradient.addColorStop(0.4, '#ffff00');
  gradient.addColorStop(0.6, '#00ff00');
  gradient.addColorStop(0.8, '#0000ff');
  gradient.addColorStop(1, '#00f0ff');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(256, 256, 50, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(256, 256, 120, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AERO', 256, 230);
  ctx.fillText('DIAL', 256, 280);

  const cdTexture = new CanvasTexture(cdCanvas);
  cdTexture.colorSpace = SRGBColorSpace;
  const cdMat = new MeshStandardMaterial({
    map: cdTexture,
    metalness: 1.0,
    roughness: 0.05,
  });

  const cd = new Mesh(cdGeo, cdMat);
  cd.position.y = 0.4;
  scene.add(cd);

  const spindle = new Mesh(new CylinderGeometry(0.2, 0.2, 0.4, 32), metalMat);
  spindle.position.y = 0.6;
  scene.add(spindle);

  let targetSpeed = 0;
  let currentSpeed = 0;

  const resizeRendererToDisplaySize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  };

  const animate = () => {
    requestAnimationFrame(animate);
    resizeRendererToDisplaySize();

    targetSpeed = isPlaying.value ? 0.25 : 0;
    currentSpeed += (targetSpeed - currentSpeed) * 0.015;
    cd.rotation.y += currentSpeed;

    if (isPlaying.value) {
      pointLight.intensity = 4 + Math.sin(Date.now() * 0.005) * 2;
    } else {
      pointLight.intensity = 1;
    }

    renderer.render(scene, camera);
  };

  animate();
}
