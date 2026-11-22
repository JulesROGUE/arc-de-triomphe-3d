import * as THREE from 'three';
import { W2, D2, L } from './dimensions.js';

// Attique : 30 boucliers (11 + 11 sur les grandes faces, 4 + 4 sur les petites),
// panneaux à glaive entre les boucliers, fenêtre centrale des petites faces,
// corniche d'attique, crête de palmettes et garde-corps de la terrasse.
export function buildAttic(b) {
  const { stone, dark } = b;

  // Plinthe
  stone.ring(W2, D2, L.cornice, L.atticPlinth - 0.25, 0.22);
  stone.ring(W2, D2, L.atticPlinth - 0.25, L.atticPlinth, 0.34);

  const yc = (L.atticPlinth + L.atticBody) / 2 + 0.1; // axe des boucliers ≈ 43,7 m

  // Place un élément sur une face : t = position le long de la face, n = sortie
  const onFace = (face, t, geo, out = 0) => {
    const { ry, x, z } = face;
    geo.rotateY(ry);
    const nx = Math.sin(ry);
    const nz = Math.cos(ry);
    // axe le long de la face (tangente)
    const tx = Math.cos(ry);
    const tz = -Math.sin(ry);
    geo.translate(x + nx * out + tx * t, 0, z + nz * out + tz * t);
    return geo;
  };
  const faces = [
    { ry: 0, x: 0, z: D2, len: W2 * 2, shields: 11 },
    { ry: Math.PI, x: 0, z: -D2, len: W2 * 2, shields: 11 },
    { ry: Math.PI / 2, x: W2, z: 0, len: D2 * 2, shields: 4 },
    { ry: -Math.PI / 2, x: -W2, z: 0, len: D2 * 2, shields: 4 },
  ];

  for (const f of faces) {
    const step = 3.8;
    const slots = [];
    if (f.shields === 11) {
      for (let i = 0; i < 11; i++) slots.push({ kind: 'shield', t: (i - 5) * step });
      for (let i = 0; i < 12; i++) slots.push({ kind: 'panel', t: (i - 5.5) * step });
    } else {
      for (const t of [-7.6, -3.8, 3.8, 7.6]) slots.push({ kind: 'shield', t });
      for (const t of [-9.5, -5.7, 5.7, 9.5]) slots.push({ kind: 'panel', t });
      slots.push({ kind: 'window', t: 0 });
    }
    for (const s of slots) {
      if (s.kind === 'shield') {
        const disc = new THREE.CylinderGeometry(0.95, 0.95, 0.22, 28);
        disc.rotateX(Math.PI / 2);
        disc.translate(0, yc, 0.11);
        stone.add(onFace(f, s.t, disc));
        const wreath = new THREE.TorusGeometry(1.08, 0.13, 6, 28);
        wreath.translate(0, yc, 0.12);
        stone.add(onFace(f, s.t, wreath));
        const boss = new THREE.SphereGeometry(0.28, 12, 8);
        boss.scale(1, 1, 0.5);
        boss.translate(0, yc, 0.24);
        stone.add(onFace(f, s.t, boss));
      } else if (s.kind === 'panel') {
        const p = new THREE.BoxGeometry(0.95, 4.2, 0.14);
        p.translate(0, yc, 0.07);
        stone.add(onFace(f, s.t, p));
        const blade = new THREE.BoxGeometry(0.16, 3.0, 0.28);
        blade.translate(0, yc - 0.2, 0.14);
        stone.add(onFace(f, s.t, blade));
        const guard = new THREE.BoxGeometry(0.62, 0.14, 0.3);
        guard.translate(0, yc + 1.05, 0.15);
        stone.add(onFace(f, s.t, guard));
      } else {
        const frame = new THREE.BoxGeometry(1.7, 3.0, 0.2);
        frame.translate(0, yc, 0.1);
        stone.add(onFace(f, s.t, frame));
        const win = new THREE.BoxGeometry(1.1, 2.3, 0.1);
        win.translate(0, yc - 0.1, 0.22);
        dark.add(onFace(f, s.t, win));
      }
    }
  }

  // Bandeau sous la corniche d'attique
  stone.ring(W2, D2, L.atticBody - 0.5, L.atticBody, 0.12);
  // Corniche d'attique
  stone.ring(W2, D2, L.atticBody, L.atticBody + 0.5, 0.32);
  stone.ring(W2, D2, L.atticBody + 0.5, 47.9, 0.78);
  stone.ring(W2, D2, 47.9, L.atticCornice, 0.55);

  // Crête de palmettes (antéfixes) sur le pourtour
  const palm = new THREE.Shape();
  palm.moveTo(-0.32, 0);
  palm.lineTo(0.32, 0);
  palm.quadraticCurveTo(0.5, 0.35, 0.3, 0.6);
  palm.quadraticCurveTo(0.12, 0.84, 0, 0.84);
  palm.quadraticCurveTo(-0.12, 0.84, -0.3, 0.6);
  palm.quadraticCurveTo(-0.5, 0.35, -0.32, 0);
  const palmGeo = new THREE.ExtrudeGeometry(palm, { depth: 0.14, bevelEnabled: false, curveSegments: 4 });
  for (const f of faces) {
    const n = Math.floor(f.len / 1.6);
    for (let i = 0; i <= n; i++) {
      const t = -f.len / 2 + 0.4 + (i * (f.len - 0.8)) / n;
      const g = palmGeo.clone();
      g.translate(0, L.atticCornice, 0.1);
      stone.add(onFace(f, t, g));
    }
  }
  // Parapet bas de la terrasse
  stone.ring(W2 - 0.25, D2 - 0.25, L.atticCornice, L.atticCornice + 0.3, 0);

  // Garde-corps métallique de la terrasse (en retrait)
  const inset = 1.3;
  const hx = W2 - inset;
  const hz = D2 - inset;
  const y0 = L.atticCornice + 0.3;
  for (const [ax, az, len, alongX] of [[0, hz, hx * 2, true], [0, -hz, hx * 2, true], [hx, 0, hz * 2, false], [-hx, 0, hz * 2, false]]) {
    const rail = new THREE.BoxGeometry(alongX ? len : 0.06, 0.06, alongX ? 0.06 : len);
    rail.translate(ax, y0 + 1.0, az);
    dark.add(rail);
    const n = Math.floor(len / 1.2);
    for (let i = 0; i <= n; i++) {
      const t = -len / 2 + (i * len) / n;
      const post = new THREE.BoxGeometry(0.05, 1.0, 0.05);
      post.translate(alongX ? t : ax, y0 + 0.5, alongX ? az : t);
      dark.add(post);
    }
  }
}
