import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  Scene,
  WebGLRenderer,
} from 'three';
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

  // Virtual "Photo Studio" environment map for realistic metal reflections.
  const pmremGenerator = new PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const envScene = new Scene();
  envScene.background = new Color(0x111111);

  const envLight1 = new Mesh(
    new PlaneGeometry(10, 10),
    new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide }),
  );
  envLight1.position.set(0, 8, 0);
  envLight1.rotation.x = Math.PI / 2;
  envScene.add(envLight1);

  const envLight2 = new Mesh(
    new PlaneGeometry(2, 8),
    new MeshBasicMaterial({ color: 0x00f0ff, side: DoubleSide }),
  );
  envLight2.position.set(8, 4, 0);
  envLight2.rotation.y = -Math.PI / 2;
  envScene.add(envLight2);

  const envMap = pmremGenerator.fromScene(envScene, 0.04).texture;
  scene.environment = envMap;

  const ambientLight = new AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const dirLight = new DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  const pointLight = new PointLight(0x00f0ff, 2, 20);
  pointLight.position.set(-3, 3, 3);
  scene.add(pointLight);

  const backLight = new PointLight(0xff00ff, 1, 20);
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
      pointLight.intensity = 2 + Math.sin(Date.now() * 0.005) * 1;
    } else {
      pointLight.intensity = 0.5;
    }

    renderer.render(scene, camera);
  };

  animate();
}
