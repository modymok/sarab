// 360° room viewer: an equirectangular image painted on the inside of a sphere.
// Loaded on demand (dynamic import) so three.js never weighs on the video views.
import { MathUtils, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, SphereGeometry, SRGBColorSpace, TextureLoader, WebGLRenderer } from 'three';

const { clamp, degToRad, radToDeg } = MathUtils;
const FOV = 75;
const calm = matchMedia('(prefers-reduced-motion: reduce)');

export function createPano(canvas) {
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 1, 1100);
  const material = new MeshBasicMaterial();
  const sphere = new Mesh(new SphereGeometry(), material);
  scene.add(sphere);
  const loader = new TextureLoader();

  let yaw = 0; // degrees from the image centre; ±180 is the left/right edge seam
  let pitch = 0;
  let vSpan = 180; // vertical degrees the image covers (less than 180 for short panoramas)
  let drift = 1;
  let lastInput = 0;
  let running = false;

  new ResizeObserver(() => {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    camera.aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    camera.updateProjectionMatrix();
  }).observe(canvas);

  // Keep the view on the picture: the seam stays behind the viewer, and short panoramas
  // never show their missing top/bottom.
  // ponytail: every image so far has a seam; add a per-image `wraps` flag when true 360° renders arrive.
  function limit() {
    const halfV = camera.fov / 2;
    const halfH = radToDeg(Math.atan(Math.tan(degToRad(halfV)) * camera.aspect));
    const maxYaw = Math.max(0, 180 - halfH - 2);
    const maxPitch = vSpan >= 180 ? 85 : Math.max(0, vSpan / 2 - halfV);
    if (Math.abs(yaw) >= maxYaw) drift = -Math.sign(yaw);
    yaw = clamp(yaw, -maxYaw, maxYaw);
    pitch = clamp(pitch, -maxPitch, maxPitch);
  }

  function frame(now) {
    if (!running) return;
    if (!calm.matches && now - lastInput > 3500) yaw += 0.035 * drift; // slow idle look-around
    limit();
    const phi = degToRad(90 - pitch);
    const theta = degToRad(yaw + 180); // u = 0.5 (image centre) sits at theta 180° on the flipped sphere
    camera.lookAt(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  // ---- input: drag to look, wheel/pinch to zoom, arrows for keyboard users ----
  const pointers = new Map();
  let pinch = null;
  const touch = () => (lastInput = performance.now());
  const zoom = (fov) => { camera.fov = clamp(fov, 35, 90); camera.updateProjectionMatrix(); };

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), fov: camera.fov };
    }
    touch();
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    if (pointers.size === 1) {
      const k = camera.fov / canvas.clientHeight; // degrees per pixel, so the picture follows the finger
      yaw -= (e.clientX - p.x) * k;
      pitch += (e.clientY - p.y) * k;
    }
    p.x = e.clientX;
    p.y = e.clientY;
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      zoom((pinch.fov * pinch.d) / Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)));
    }
    touch();
  });
  const release = (e) => { pointers.delete(e.pointerId); if (pointers.size < 2) pinch = null; };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); zoom(camera.fov + e.deltaY * 0.04); touch(); }, { passive: false });
  canvas.addEventListener('keydown', (e) => {
    const keys = { ArrowLeft: [-6, 0], ArrowRight: [6, 0], ArrowUp: [0, 5], ArrowDown: [0, -5] };
    if (!keys[e.key]) return;
    e.preventDefault();
    yaw += keys[e.key][0];
    pitch += keys[e.key][1];
    touch();
  });

  return {
    async load(src) {
      const tex = await loader.loadAsync(src);
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      vSpan = Math.min(180, (360 * tex.image.height) / tex.image.width);
      // Short panoramas only cover a band around the horizon, so build just that band of the sphere.
      const geo = new SphereGeometry(500, 72, 36, 0, Math.PI * 2, degToRad(90 - vSpan / 2), degToRad(vSpan));
      geo.scale(-1, 1, 1); // view from inside
      sphere.geometry.dispose();
      sphere.geometry = geo;
      material.map?.dispose();
      material.map = tex;
      material.needsUpdate = true;
      yaw = 0;
      pitch = 0;
      zoom(FOV);
      lastInput = performance.now();
    },
    start() { if (!running) { running = true; requestAnimationFrame(frame); } },
    stop() { running = false; pointers.clear(); pinch = null; },
  };
}
