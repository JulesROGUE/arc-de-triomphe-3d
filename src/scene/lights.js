import * as THREE from 'three';
import { W2, D2 } from '../model/dimensions.js';

// Jour : soleil (ombres) + lumière d'hémisphère.
// Nuit : clair de lune, projecteurs dorés au pied des quatre faces, lueur sous la voûte.
export function createLights(scene) {
  const hemi = new THREE.HemisphereLight(0xdde8ff, 0xb8a888, 1.25);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff1dc, 3.0);
  sun.position.set(-95, 125, 85);
  sun.target.position.set(0, 12, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -80;
  sc.right = 80;
  sc.top = 80;
  sc.bottom = -80;
  sc.near = 20;
  sc.far = 420;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.05;
  scene.add(sun, sun.target);

  // Projecteurs (toujours présents, intensité nulle le jour : pas de recompilation des shaders)
  const floods = [];
  const spec = [
    [[0, 0.5, D2 + 52], [0, 24, D2], 0.68, 9500],
    [[0, 0.5, -D2 - 52], [0, 24, -D2], 0.68, 9500],
    [[W2 + 40, 0.5, 0], [W2, 24, 0], 0.72, 6000],
    [[-W2 - 40, 0.5, 0], [-W2, 24, 0], 0.72, 6000],
  ];
  for (const [pos, target, angle, power] of spec) {
    const s = new THREE.SpotLight(0xffb45c, 0, 0, angle, 0.7, 2);
    s.position.set(...pos);
    s.target.position.set(...target);
    s.userData.power = power;
    scene.add(s, s.target);
    floods.push(s);
  }
  const vault = new THREE.PointLight(0xffc070, 0, 45, 2);
  vault.position.set(0, 10, 0);
  scene.add(vault);

  return {
    setNight(night) {
      if (night) {
        hemi.color.set(0x3a5596);
        hemi.groundColor.set(0x1d1710);
        hemi.intensity = 0.45;
        sun.color.set(0x9db4ff);
        sun.intensity = 0.35;
        sun.position.set(-130, 140, -210);
      } else {
        hemi.color.set(0xdde8ff);
        hemi.groundColor.set(0xb8a888);
        hemi.intensity = 1.25;
        sun.color.set(0xfff1dc);
        sun.intensity = 3.0;
        sun.position.set(-95, 125, 85);
      }
      for (const f of floods) f.intensity = night ? f.userData.power : 0;
      vault.intensity = night ? 900 : 0;
    },
  };
}
