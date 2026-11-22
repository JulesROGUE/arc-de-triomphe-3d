import * as THREE from 'three';
import { rng } from '../model/helpers.js';

const DAY = { top: '#4f86cf', horizon: '#d6e4f0', bottom: '#b9c3c9', fog: '#cfdbe6' };
const NIGHT = { top: '#050b22', horizon: '#1d3570', bottom: '#0c1020', fog: '#16284f' };

// Ciel en dégradé (sphère), brouillard léger, lune et étoiles pour la nuit.
export function createSky(scene) {
  const uniforms = {
    top: { value: new THREE.Color(DAY.top) },
    horizon: { value: new THREE.Color(DAY.horizon) },
    bottom: { value: new THREE.Color(DAY.bottom) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 top;
      uniform vec3 horizon;
      uniform vec3 bottom;
      varying vec3 vDir;
      void main() {
        float h = vDir.y;
        vec3 c = h > 0.0
          ? mix(horizon, top, pow(smoothstep(0.0, 0.75, h), 0.55))
          : mix(horizon, bottom, smoothstep(0.0, -0.15, h));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(3500, 32, 16), mat);
  sky.name = 'ciel';
  sky.renderOrder = -1;
  scene.add(sky);

  scene.fog = new THREE.Fog(DAY.fog, 320, 1700);
  scene.background = new THREE.Color(DAY.horizon);

  // Étoiles
  const r = rng(77);
  const pts = [];
  for (let i = 0; i < 700; i++) {
    const a = r() * Math.PI * 2;
    const y = 0.12 + r() * 0.88;
    const k = Math.sqrt(1 - y * y);
    pts.push(Math.cos(a) * k * 3000, y * 3000, Math.sin(a) * k * 3000);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xdfe6ff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 }));
  stars.visible = false;
  scene.add(stars);

  // Lune
  const moon = new THREE.Mesh(new THREE.CircleGeometry(38, 32), new THREE.MeshBasicMaterial({ color: 0xf3efdc, fog: false }));
  moon.position.set(-1300, 1150, -2100);
  moon.lookAt(0, 0, 0);
  moon.visible = false;
  scene.add(moon);

  return {
    setNight(night) {
      const p = night ? NIGHT : DAY;
      uniforms.top.value.set(p.top);
      uniforms.horizon.value.set(p.horizon);
      uniforms.bottom.value.set(p.bottom);
      scene.fog.color.set(p.fog);
      scene.fog.near = night ? 250 : 320;
      scene.fog.far = night ? 1400 : 1700;
      scene.background.set(p.horizon);
      stars.visible = night;
      moon.visible = night;
    },
  };
}
