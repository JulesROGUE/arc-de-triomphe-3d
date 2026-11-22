import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createRenderer } from './renderer.js';
import { createSky } from './sky.js';
import { createLights } from './lights.js';
import { createGround } from './ground.js';
import { createCity } from './city.js';
import { buildArc } from '../model/index.js';
import { VIEWPOINTS, viewFromHash } from '../viewpoints.js';

const MIN_EYE = 1.2; // la caméra ne descend jamais sous le sol
const TRANSITION_MS = 1300; // transitions courtes (1,5 s max), qui s'arrêtent seules

// Scène rendue à la demande : aucune boucle requestAnimationFrame permanente.
export function createScene(host, { onView, onNight, onTour } = {}) {
  const renderer = createRenderer(host);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 1, 6000);

  const parts = [createSky(scene), createLights(scene), createGround(scene), createCity(scene), buildArc(scene)];

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  controls.minDistance = 5;
  controls.maxDistance = 650;
  controls.maxPolarAngle = Math.PI * 0.96;
  controls.screenSpacePanning = true;
  controls.zoomSpeed = 0.9;

  const render = () => renderer.render(scene, camera);
  let queued = false;
  const requestRender = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      render();
    });
  };

  const clamp = () => {
    const t = controls.target;
    t.y = THREE.MathUtils.clamp(t.y, 0, 60);
    const d = Math.hypot(t.x, t.z);
    if (d > 320) t.multiplyScalar(320 / d);
    if (camera.position.y < MIN_EYE) {
      camera.position.y = MIN_EYE;
      camera.lookAt(t);
    }
  };
  controls.addEventListener('change', () => {
    clamp();
    requestRender();
  });

  // --- Taille
  const resize = () => {
    const w = host.clientWidth || window.innerWidth;
    const h = host.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    render();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  window.addEventListener('resize', resize);

  // --- Points de vue
  let current = null;
  let anim = 0;
  const setView = (vp) => {
    current = vp.id;
    camera.position.set(...vp.position);
    controls.target.set(...vp.target);
    camera.fov = vp.fov ?? 45;
    camera.updateProjectionMatrix();
    controls.update();
    onView?.(vp.id);
  };
  const flyTo = (vp) => {
    stopTour();
    cancelAnimationFrame(anim);
    current = vp.id;
    onView?.(vp.id);
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    const p1 = new THREE.Vector3(...vp.position);
    const t1 = new THREE.Vector3(...vp.target);
    const f0 = camera.fov;
    const f1 = vp.fov ?? 45;
    const start = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - start) / TRANSITION_MS);
      const e = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
      camera.position.lerpVectors(p0, p1, e);
      controls.target.lerpVectors(t0, t1, e);
      camera.fov = f0 + (f1 - f0) * e;
      camera.updateProjectionMatrix();
      camera.lookAt(controls.target);
      render();
      if (k < 1) anim = requestAnimationFrame(step);
      else {
        anim = 0;
        controls.update();
      }
    };
    anim = requestAnimationFrame(step);
  };
  const goTo = (id) => {
    const vp = VIEWPOINTS.find((v) => v.id === id);
    if (!vp) return;
    if (location.hash === `#${id}`) flyTo(vp);
    else location.hash = id;
  };
  const onHash = () => {
    const vp = viewFromHash(location.hash);
    if (vp) flyTo(vp);
  };
  window.addEventListener('hashchange', onHash);
  const onKey = (e) => {
    if (e.target instanceof HTMLInputElement) return;
    const n = Number(e.key);
    if (n >= 1 && n <= VIEWPOINTS.length) goTo(VIEWPOINTS[n - 1].id);
  };
  window.addEventListener('keydown', onKey);

  // --- Visite (rotation lente), désactivée par défaut
  let tour = 0;
  const startTour = () => {
    cancelAnimationFrame(anim);
    let last = performance.now();
    const axis = new THREE.Vector3(0, 1, 0);
    const step = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const off = camera.position.clone().sub(controls.target).applyAxisAngle(axis, dt * 0.14);
      camera.position.copy(controls.target).add(off);
      camera.lookAt(controls.target);
      render();
      tour = requestAnimationFrame(step);
    };
    tour = requestAnimationFrame(step);
    onTour?.(true);
  };
  function stopTour() {
    if (!tour) return;
    cancelAnimationFrame(tour);
    tour = 0;
    controls.update();
    onTour?.(false);
  }
  controls.addEventListener('start', stopTour);
  const toggleTour = () => (tour ? stopTour() : startTour());

  // --- Jour / nuit (suit data-theme sur <html>)
  const applyTheme = () => {
    const night = document.documentElement.dataset.theme === 'dark';
    for (const p of parts) p.setNight?.(night);
    renderer.toneMappingExposure = night ? 1.1 : 1.0;
    onNight?.(night);
    requestRender();
  };
  const mo = new MutationObserver(applyTheme);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const toggleNight = () => {
    const html = document.documentElement;
    html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
  };

  // --- Première image, complète dès le chargement
  const night = document.documentElement.dataset.theme === 'dark';
  for (const p of parts) p.setNight?.(night);
  renderer.toneMappingExposure = night ? 1.1 : 1.0;
  onNight?.(night);
  const w = host.clientWidth || window.innerWidth;
  const h = host.clientHeight || window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  setView(viewFromHash(location.hash) || VIEWPOINTS[0]);
  render();

  return {
    goTo,
    toggleNight,
    toggleTour,
    get view() {
      return current;
    },
    dispose() {
      stopTour();
      cancelAnimationFrame(anim);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('keydown', onKey);
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
