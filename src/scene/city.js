import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PLACE } from '../model/dimensions.js';
import { rng } from '../model/helpers.js';
import { facadeTextures } from '../model/textures.js';
import { AVENUES } from './ground.js';

const Y0 = -0.15;

// Immeubles haussmanniens (façade crème, toit mansardé en zinc), platanes et voitures.
// Tout est instancié : quelques draw calls pour plusieurs milliers d'objets.
export function createCity(scene) {
  const r = rng(2024);
  const blocks = [];

  // Remplit chaque secteur entre deux avenues par anneaux concentriques d'immeubles
  for (let k = 0; k < AVENUES.length; k++) {
    const a = AVENUES[k];
    const b = AVENUES[(k + 1) % AVENUES.length];
    const bAngle = k === AVENUES.length - 1 ? b.angle + Math.PI * 2 : b.angle;
    for (let rIn = PLACE.facades, ring = 0; rIn < 720; rIn += 27, ring++) {
      const depth = 18;
      const rc = rIn + depth / 2;
      const a0 = a.angle + Math.asin(Math.min(1, (a.width / 2 + 3) / rIn));
      const a1 = bAngle - Math.asin(Math.min(1, (b.width / 2 + 3) / rIn));
      if (a1 <= a0) continue;
      const span = a1 - a0;
      const n = Math.max(1, Math.round((rc * span) / 17));
      for (let i = 0; i < n; i++) {
        if (ring > 0 && n > 3 && i % 5 === 4) continue; // rues transversales
        const t = a0 + ((i + 0.5) / n) * span;
        const len = 2 * rIn * Math.sin(span / n / 2) * 0.99;
        const h = ring === 0 ? 15 + r() * 2 : 18 + r() * 5;
        blocks.push({ t, rc, len, depth, h });
      }
    }
  }

  const { map, emissive } = facadeTextures();
  const facadeMat = new THREE.MeshStandardMaterial({ map, emissiveMap: emissive, emissive: 0xffc773, emissiveIntensity: 0, roughness: 0.9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0.15 });
  const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), facadeMat, blocks.length);
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-0.5, 0);
  roofShape.lineTo(0.5, 0);
  roofShape.lineTo(0.32, 1);
  roofShape.lineTo(-0.32, 1);
  roofShape.closePath();
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 1, bevelEnabled: false });
  roofGeo.translate(0, 0, -0.5);
  roofGeo.rotateY(Math.PI / 2); // profil dans le plan (z, y), extrudé le long de x
  const roofs = new THREE.InstancedMesh(roofGeo, roofMat, blocks.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const c = new THREE.Color();
  blocks.forEach((bk, i) => {
    q.setFromAxisAngle(up, bk.t);
    const pos = new THREE.Vector3(Math.sin(bk.t) * bk.rc, Y0, Math.cos(bk.t) * bk.rc);
    m.compose(pos, q, new THREE.Vector3(bk.len, bk.h, bk.depth));
    bodies.setMatrixAt(i, m);
    const l = 0.93 + r() * 0.07;
    bodies.setColorAt(i, c.setRGB(l, l * (0.97 + r() * 0.03), l * (0.92 + r() * 0.05)));
    pos.y = Y0 + bk.h;
    m.compose(pos, q, new THREE.Vector3(bk.len, 4.2 + r() * 1.2, bk.depth));
    roofs.setMatrixAt(i, m);
    const g = 0.42 + r() * 0.08;
    roofs.setColorAt(i, c.setRGB(g, g + 0.03, g + 0.08));
  });
  for (const mesh of [bodies, roofs]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  // Platanes le long des avenues et autour de la place
  const trees = [];
  for (const a of AVENUES) {
    const rows = a.width >= 56 ? [a.width / 2 - 4, a.width / 2 - 10] : [a.width / 2 - 4];
    for (const off of rows) {
      for (let d = PLACE.facades + 4; d < 560; d += 10) {
        for (const s of [-1, 1]) {
          const x = s * off + (r() - 0.5);
          trees.push([Math.cos(a.angle) * x + Math.sin(a.angle) * d, Math.cos(a.angle) * d - Math.sin(a.angle) * x]);
        }
      }
    }
  }
  for (let i = 0; i < 72; i++) {
    const t = (i / 72) * Math.PI * 2;
    const near = AVENUES.some((av) => Math.abs(Math.atan2(Math.sin(t - av.angle), Math.cos(t - av.angle))) < (av.width / 2 + 3) / 118);
    if (!near) trees.push([Math.sin(t) * 118.5, Math.cos(t) * 118.5]);
  }
  const trunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.22, 0.32, 4.4, 6).translate(0, 2.2, 0),
    new THREE.MeshStandardMaterial({ color: 0x7a7060, roughness: 1 }),
    trees.length,
  );
  const crowns = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 1),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, flatShading: true }),
    trees.length,
  );
  trees.forEach(([x, z], i) => {
    const s = 0.85 + r() * 0.35;
    m.compose(new THREE.Vector3(x, Y0, z), q.identity(), new THREE.Vector3(s, s, s));
    trunks.setMatrixAt(i, m);
    m.compose(new THREE.Vector3(x, Y0 + 6.6 * s, z), q.setFromAxisAngle(up, r() * 6), new THREE.Vector3(3.6 * s, 3.2 * s, 3.6 * s));
    crowns.setMatrixAt(i, m);
    crowns.setColorAt(i, c.setHSL(0.24 + r() * 0.05, 0.38 + r() * 0.12, 0.3 + r() * 0.08));
  });
  for (const mesh of [trunks, crowns]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  // Voitures sur l'anneau et sur les avenues
  const cars = [];
  for (let i = 0; i < 80; i++) {
    const rad = 44 + r() * 62;
    const t = r() * Math.PI * 2;
    const deg = (Math.atan2(Math.sin(t), Math.cos(t)) * 180) / Math.PI;
    if (deg > -70 && deg < -8) continue; // dégage le premier plan du point de vue « Façade »
    cars.push({ x: Math.sin(t) * rad, z: Math.cos(t) * rad, rot: t + Math.PI / 2 });
  }
  for (const a of AVENUES) {
    for (let j = 0; j < 9; j++) {
      const d = PLACE.ring + 10 + r() * 420;
      const lane = (r() < 0.5 ? -1 : 1) * (2 + r() * (a.width / 2 - 10));
      cars.push({ x: Math.cos(a.angle) * lane + Math.sin(a.angle) * d, z: Math.cos(a.angle) * d - Math.sin(a.angle) * lane, rot: a.angle });
    }
  }
  const palette = [0xf2f2f2, 0x1d1f24, 0x8a9099, 0xc5c9cf, 0x23395d, 0x9b1e24, 0x5a5f66, 0xe8e2d4];
  // carrosserie (couleur par instance) + habitacle vitré et roues (sombres)
  const shell = new THREE.Shape();
  shell.moveTo(-2.15, 0.32);
  shell.lineTo(2.15, 0.32);
  shell.lineTo(2.2, 0.75);
  shell.lineTo(1.2, 0.9);
  shell.lineTo(-1.9, 0.92);
  shell.lineTo(-2.2, 0.7);
  shell.closePath();
  const bodyGeo = new THREE.ExtrudeGeometry(shell, { depth: 1.76, bevelEnabled: false });
  bodyGeo.translate(0, 0, -0.88);
  bodyGeo.rotateY(Math.PI / 2);
  const cab = new THREE.Shape();
  cab.moveTo(-1.5, 0.9);
  cab.lineTo(0.95, 0.9);
  cab.lineTo(0.35, 1.42);
  cab.lineTo(-1.25, 1.42);
  cab.closePath();
  const cabGeo = new THREE.ExtrudeGeometry(cab, { depth: 1.5, bevelEnabled: false });
  cabGeo.translate(0, 0, -0.75);
  cabGeo.rotateY(Math.PI / 2);
  const wheels = new THREE.BoxGeometry(1.8, 0.5, 3.0).translate(0, 0.25, 0);
  const darkGeo = mergeGeometries([cabGeo, wheels.toNonIndexed()].map((g) => { g.deleteAttribute('uv'); return g; }));
  const carBody = new THREE.InstancedMesh(bodyGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.4 }), cars.length);
  const carTop = new THREE.InstancedMesh(darkGeo, new THREE.MeshStandardMaterial({ color: 0x1c2229, roughness: 0.25, metalness: 0.5 }), cars.length);
  cars.forEach((car, i) => {
    m.compose(new THREE.Vector3(car.x, Y0, car.z), q.setFromAxisAngle(up, car.rot), new THREE.Vector3(1, 1, 1));
    carBody.setMatrixAt(i, m);
    carTop.setMatrixAt(i, m);
    carBody.setColorAt(i, c.set(palette[Math.floor(r() * palette.length)]));
  });
  for (const mesh of [carBody, carTop]) {
    mesh.castShadow = true;
    scene.add(mesh);
  }

  return {
    setNight(night) {
      facadeMat.emissiveIntensity = night ? 1.1 : 0;
    },
  };
}
