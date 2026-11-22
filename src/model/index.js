import * as THREE from 'three';
import { Batch } from './helpers.js';
import { buildBody } from './body.js';
import { buildEntablature } from './entablature.js';
import { buildAttic } from './attic.js';
import { buildSculptures } from './sculptures.js';
import { buildVaults } from './vaults.js';
import { GR, GSPRING, W2 } from './dimensions.js';
import {
  stoneTexture, reliefTexture, friezeTexture, cofferTexture, inscriptionTexture, spandrelTexture,
} from './textures.js';

// Assemble l'arc : chaque matériau = un seul maillage fusionné.
export function buildArc(scene) {
  const stoneTex = stoneTexture();
  const px = 512 / 8.3;
  const mats = {
    stone: new THREE.MeshStandardMaterial({ map: stoneTex, bumpMap: stoneTex, bumpScale: 1.5, roughness: 0.92 }),
    sculpt: new THREE.MeshStandardMaterial({ color: 0xe4d9c2, roughness: 0.88 }),
    relief: null,
    frieze: null,
    coffers: null,
    inscriptions: null,
    spandrel: null,
    dark: new THREE.MeshStandardMaterial({ color: 0x2c2c30, roughness: 0.55, metalness: 0.3 }),
    bronze: new THREE.MeshStandardMaterial({ color: 0x7a6236, roughness: 0.4, metalness: 0.8 }),
    flame: new THREE.MeshBasicMaterial({ color: 0xff9a3a, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
  };
  const relief = reliefTexture(3);
  mats.relief = new THREE.MeshStandardMaterial({ map: relief, bumpMap: relief, bumpScale: 4, roughness: 0.9 });
  const frieze = friezeTexture();
  mats.frieze = new THREE.MeshStandardMaterial({ map: frieze, bumpMap: frieze, bumpScale: 4, roughness: 0.9 });
  const coffer = cofferTexture();
  mats.coffers = new THREE.MeshStandardMaterial({ map: coffer, bumpMap: coffer, bumpScale: 4, roughness: 0.9, side: THREE.DoubleSide });
  const ins = inscriptionTexture();
  mats.inscriptions = new THREE.MeshStandardMaterial({ map: ins, bumpMap: ins, bumpScale: 2, roughness: 0.9 });
  const sp = spandrelTexture(px, -0.9, 31.8 - GSPRING, GR + 1.5);
  mats.spandrel = new THREE.MeshStandardMaterial({ map: sp, bumpMap: sp, bumpScale: 2.5, roughness: 0.9, alphaTest: 0.5 });

  const b = {
    stone: new Batch(),
    sculpt: new Batch(),
    dark: new Batch(),
    bronze: new Batch(),
    flame: new Batch({ keepUV: true }),
    relief: new Batch({ keepUV: true }),
    frieze: new Batch({ keepUV: true }),
    coffers: new Batch({ keepUV: true }),
    inscriptions: new Batch({ keepUV: true }),
    spandrel: new Batch({ keepUV: true }),
  };

  buildBody(b);
  buildEntablature(b);
  buildAttic(b);
  buildSculptures(b);
  buildVaults(b);

  const group = new THREE.Group();
  group.name = 'arc-de-triomphe';
  for (const [k, batch] of Object.entries(b)) {
    if (!batch.list.length) continue;
    const mesh = batch.mesh(mats[k], { cast: k !== 'flame', receive: k !== 'flame' });
    mesh.name = k;
    group.add(mesh);
  }
  scene.add(group);

  // Lueur de la flamme du Soldat inconnu
  const flameLight = new THREE.PointLight(0xff9a40, 0, 14, 2);
  flameLight.position.set(0, 1.0, 2.55);
  scene.add(flameLight);

  return {
    group,
    width: W2 * 2,
    setNight(night) {
      flameLight.intensity = night ? 30 : 2;
      mats.flame.color.set(night ? 0xffb050 : 0xff8a30);
    },
  };
}
