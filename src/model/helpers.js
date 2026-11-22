import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Générateur pseudo-aléatoire déterministe (mulberry32) : même scène à chaque lancement.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Projection des UV en mètres selon la normale (les joints de pierre gardent la même taille partout).
function worldUV(g) {
  const p = g.attributes.position;
  const uv = new Float32Array(p.count * 2);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();
  // géométrie non indexée : une projection par triangle (pas de zigzag sur les surfaces courbes)
  for (let i = 0; i + 2 < p.count; i += 3) {
    a.fromBufferAttribute(p, i);
    b.fromBufferAttribute(p, i + 1);
    c.fromBufferAttribute(p, i + 2);
    n.subVectors(c, b).cross(a.clone().sub(b));
    const ax = Math.abs(n.x);
    const ay = Math.abs(n.y);
    const az = Math.abs(n.z);
    for (let k = 0; k < 3; k++) {
      const v = k === 0 ? a : k === 1 ? b : c;
      let u;
      let w;
      if (ax >= ay && ax >= az) { u = v.z; w = v.y; }
      else if (ay >= az) { u = v.x; w = v.z; }
      else { u = v.x; w = v.y; }
      uv[(i + k) * 2] = u;
      uv[(i + k) * 2 + 1] = w;
    }
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

function prep(geo, keepUV) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  for (const k of Object.keys(g.attributes)) {
    if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
  }
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!keepUV || !g.attributes.uv) worldUV(g);
  g.morphAttributes = {};
  return g;
}

// Regroupe beaucoup de pièces en un seul maillage (un seul draw call par matériau).
export class Batch {
  constructor({ keepUV = false } = {}) {
    this.keepUV = keepUV;
    this.list = [];
  }

  add(geo) {
    this.list.push(geo);
    return geo;
  }

  // Boîte définie par ses coins min / max
  box(x0, y0, z0, x1, y1, z1) {
    const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return this.add(g);
  }

  // Bandeau qui fait le tour d'un rectangle (demi-largeurs hx, hz) avec une saillie p
  ring(hx, hz, y0, y1, p) {
    return this.box(-hx - p, y0, -hz - p, hx + p, y1, hz + p);
  }

  mesh(material, { cast = true, receive = true } = {}) {
    const merged = mergeGeometries(this.list.map((g) => prep(g, this.keepUV)), false);
    merged.computeBoundingSphere();
    const m = new THREE.Mesh(merged, material);
    m.castShadow = cast;
    m.receiveShadow = receive;
    return m;
  }
}

// Matrice de placement (position, rotation XYZ, échelle uniforme)
export function T(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(s, s, s),
  );
}

// Demi-anneau (archivolte) dans le plan XY, extrudé selon +Z
export function archRing(r0, r1, depth, segments = 32) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r1, 0, Math.PI, false);
  s.lineTo(-r0, 0);
  s.absarc(0, 0, r0, Math.PI, 0, true);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: segments });
}

// Cylindre (capsule) d'un point A à un point B
const UP = new THREE.Vector3(0, 1, 0);
export function limb(a, b, r) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const dir = B.clone().sub(A);
  const len = Math.max(0.01, dir.length());
  const g = new THREE.CapsuleGeometry(r, len, 3, 8);
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
  g.applyQuaternion(q);
  const mid = A.add(B).multiplyScalar(0.5);
  g.translate(mid.x, mid.y, mid.z);
  return g;
}
