import {
  ACESFilmicToneMapping,
  NoToneMapping,
  AmbientLight,
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
  // -- CD Design Configuration --
  // Change this to 'full-cover', 'center-label', or 'text-only' to see different styles
  let CD_STYLE = 'full-cover' as 'full-cover' | 'center-label' | 'text-only';
  const COVER_IMAGE_URL = `${import.meta.env.BASE_URL}cd-cover.png`;

  const isFullCover = CD_STYLE === 'full-cover';

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = isFullCover ? NoToneMapping : ACESFilmicToneMapping;
  renderer.toneMappingExposure = isFullCover ? 1.0 : 1.2;

  const scene = new Scene();
  const camera = new PerspectiveCamera(
    35,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    100,
  );
  camera.up.set(0, 0, -1);

  const FRAME_RADIUS = 2.0; // CD radius 1.8 + small margin
  const frameCD = () => {
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const fovY = (camera.fov * Math.PI) / 180;
    const fovX = 2 * Math.atan(aspect * Math.tan(fovY / 2));
    const limiting = Math.min(fovX, fovY);
    const distance = FRAME_RADIUS / Math.tan(limiting / 2);
    camera.position.set(0, 0.4 + distance, 0);
    camera.lookAt(0, 0, 0);
  };
  frameCD();

  // Studio environment map so metallic surfaces have something to reflect.
  const pmremGenerator = new PMREMGenerator(renderer);
  const envMap = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envMap;
  pmremGenerator.dispose();

  const ambientLight = new AmbientLight(0xffffff, isFullCover ? 1.0 : 0.6);
  scene.add(ambientLight);

  const dirLight = new DirectionalLight(0xffffff, isFullCover ? 0.0 : 3);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  // Decay 0 disables physically-correct distance falloff so these lights
  // behave like the original r128 setup at the same intensity scale.
  const pointLight = new PointLight(0x00f0ff, isFullCover ? 0.5 : 4, 20, 0);
  pointLight.position.set(-3, 3, 3);
  scene.add(pointLight);

  const backLight = new PointLight(0xff00ff, isFullCover ? 0.5 : 2, 20, 0);
  backLight.position.set(3, 2, -3);
  scene.add(backLight);

  const cdGeo = new CylinderGeometry(1.8, 1.8, 0.02, 64);
  const cdCanvas = document.createElement('canvas');
  cdCanvas.width = 512;
  cdCanvas.height = 512;
  const ctx = cdCanvas.getContext('2d')!;

  const drawCDTexture = (img?: HTMLImageElement) => {
    ctx.clearRect(0, 0, 512, 512);

    if (CD_STYLE === 'full-cover' && img) {
      // 1. The "Full Print" CD: Image covers the entire disc
      ctx.save();
      ctx.beginPath();
      ctx.arc(256, 256, 256, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, 0, 0, 512, 512);
      ctx.restore();
    } else {
      // 2. Base metallic surface with diffraction (used for center-label or text-only)
      ctx.fillStyle = '#b4b4bd'; // Light cool silver
      ctx.fillRect(0, 0, 512, 512);

      const gradient = ctx.createConicGradient(0, 256, 256);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(0.1, 'rgba(255, 0, 255, 0.4)');
      gradient.addColorStop(0.15, 'rgba(0, 255, 255, 0.4)');
      gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(0.4, 'rgba(255, 255, 0, 0.4)');
      gradient.addColorStop(0.45, 'rgba(0, 255, 0, 0.4)');
      gradient.addColorStop(0.55, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(0.65, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(0.7, 'rgba(0, 255, 255, 0.4)');
      gradient.addColorStop(0.75, 'rgba(255, 0, 255, 0.4)');
      gradient.addColorStop(0.85, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(0.9, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(0.95, 'rgba(0, 255, 0, 0.4)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);

      // Concentric data grooves
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      for (let r = 110; r < 256; r += 4) {
        ctx.beginPath();
        ctx.arc(256, 256, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (CD_STYLE === 'center-label' && img) {
        // The "Hybrid Canvas" CD: Metallic outer, printed center label
        ctx.save();
        ctx.beginPath();
        ctx.arc(256, 256, 110, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, 256 - 110, 256 - 110, 220, 220);
        ctx.restore();
      } else {
        // Text-only fallback
        ctx.fillStyle = '#222222';
        ctx.beginPath();
        ctx.arc(256, 256, 110, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 54px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('AERO', 256, 220);
        ctx.fillText('DIAL', 256, 285);
      }
    }

    // Inner hole (always transparent/dark)
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(256, 256, 40, 0, Math.PI * 2);
    ctx.fill();
  };

  // Draw initial state
  drawCDTexture();

  // Try to load the custom image cover
  const img = new Image();
  img.src = COVER_IMAGE_URL;
  img.onload = () => {
    drawCDTexture(img);
    cdTexture.needsUpdate = true;
  };

  const cdTexture = new CanvasTexture(cdCanvas);
  cdTexture.colorSpace = SRGBColorSpace;
  const cdMat = new MeshStandardMaterial({
    map: cdTexture,
    metalness: CD_STYLE === 'full-cover' ? 0.0 : 1.0,
    roughness: CD_STYLE === 'full-cover' ? 0.9 : 0.15,
    envMapIntensity: CD_STYLE === 'full-cover' ? 0.0 : 1.0,
  });

  const cd = new Mesh(cdGeo, cdMat);
  cd.position.y = 0.4;
  cd.rotation.y = Math.PI / 2; // Rotate 90 degrees the other way
  scene.add(cd);

  const metalMat = new MeshStandardMaterial({
    color: 0x999999,
    metalness: 1.0,
    roughness: 0.15,
  });

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
      frameCD();
    }
  };

  const animate = () => {
    requestAnimationFrame(animate);
    resizeRendererToDisplaySize();

    targetSpeed = isPlaying.value ? 0.25 : 0;
    currentSpeed += (targetSpeed - currentSpeed) * 0.015;
    cd.rotation.y += currentSpeed;

    if (isPlaying.value) {
      const baseIntensity = isFullCover ? 0.5 : 4;
      const pulse = isFullCover ? 0.2 : 2;
      pointLight.intensity = baseIntensity + Math.sin(Date.now() * 0.005) * pulse;
    } else {
      pointLight.intensity = isFullCover ? 0.3 : 1;
    }

    renderer.render(scene, camera);
  };

  animate();
}
