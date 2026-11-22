import * as THREE from 'three';
import { D2, PIER_X, L } from './dimensions.js';
import { T, limb, rng } from './helpers.js';

// Les quatre groupes sculptés des grandes faces, posés sur leurs piédestaux :
//  côté Champs-Élysées (z > 0) : Le Départ de 1792, dit « La Marseillaise » (Rude), à droite ;
//                                Le Triomphe de 1810 (Cortot), à gauche ;
//  côté avenue de la Grande-Armée (z < 0) : La Résistance de 1814 et La Paix de 1815 (Étex).
// Modélisation volontairement stylisée : masse de fond + personnages en volumes simples.

const GROUPS = [
  { name: 'La Marseillaise', x: PIER_X, side: 1, seed: 1, wings: 1.25 },
  { name: 'Le Triomphe de 1810', x: -PIER_X, side: 1, seed: 2, wings: 0.95 },
  { name: 'La Résistance de 1814', x: -PIER_X, side: -1, seed: 3, wings: 1.05 },
  { name: 'La Paix de 1815', x: PIER_X, side: -1, seed: 4, wings: 0.8 },
];

const PED_HALF = 4.4; // piédestal de 8,8 m de large
const PED_OUT = 2.3; // saillie du piédestal

// Personnage debout (pieds en 0, face vers +z) de hauteur h
function figure(add, h, r, opts = {}) {
  const lean = (opts.lean ?? (r() - 0.5) * 0.25) * h;
  const st = (0.05 + r() * 0.08) * h;
  const hip = [lean * 0.3, 0.48 * h, 0];
  const neck = [lean, 0.8 * h, 0.03 * h];
  add(limb([-0.07 * h, hip[1], 0], [-0.09 * h - st, 0.05 * h, st * 0.6], 0.07 * h));
  add(limb([0.07 * h, hip[1], 0], [0.09 * h + st, 0.05 * h, -st * 0.3], 0.07 * h));
  const robe = new THREE.CylinderGeometry(0.14 * h, 0.21 * h, 0.44 * h, 12);
  robe.translate(hip[0], 0.42 * h, 0);
  add(robe);
  add(limb(hip, neck, 0.13 * h));
  const head = new THREE.SphereGeometry(0.075 * h, 12, 10);
  head.translate(neck[0], 0.9 * h, neck[2] + 0.01 * h);
  add(head);
  // bras le long du corps ou levés (jamais à l'horizontale), légèrement vers l'avant
  const pick = (up, down) => (r() < 0.45 ? up : down) + (r() - 0.5) * 0.35;
  const arms = opts.arms ?? [[pick(-0.4, -2.75), 0.6 + r() * 0.6], [pick(0.45, 2.75), 0.6 + r() * 0.6]];
  for (const [k, [a, f]] of arms.entries()) {
    const sx = neck[0] + (k ? 1 : -1) * 0.12 * h;
    const s = [sx, 0.77 * h, neck[2]];
    const e = [sx + Math.sin(a) * 0.36 * h, 0.77 * h + Math.cos(a) * 0.36 * h, neck[2] + f * 0.12 * h];
    add(limb(s, e, 0.055 * h));
    if (opts.weapon === k) add(limb(e, [e[0] + Math.sin(a) * 0.42 * h, e[1] + Math.cos(a) * 0.42 * h, e[2]], 0.03 * h));
  }
  if (opts.shield) {
    const sh = new THREE.CylinderGeometry(0.15 * h, 0.15 * h, 0.03 * h, 14);
    sh.rotateX(Math.PI / 2);
    sh.translate(neck[0] - 0.2 * h, 0.55 * h, 0.14 * h);
    add(sh);
  }
}

// Génie ailé qui domine chaque groupe
function genius(add, h, span, r) {
  const lean = 0.1;
  figure(add, h, r, { lean, arms: [[-0.55, 0.7], [0.95, 0.9]] });
  for (const s of [-1, 1]) {
    const w = new THREE.Shape();
    const pts = [[0, 0], [1.0, 0.35], [2.0, 0.75], [2.9, 1.2], [3.3, 1.35], [2.9, 0.95], [2.6, 0.6], [2.1, 0.45], [1.9, 0.1], [1.3, 0.05], [1.0, -0.3], [0.4, -0.2]];
    w.moveTo(0, 0);
    for (const [x, y] of pts.slice(1)) w.lineTo(s * x * span, y * span);
    w.closePath();
    const g = new THREE.ExtrudeGeometry(w, { depth: 0.22, bevelEnabled: false });
    g.rotateY(s * 0.35);
    g.translate(lean * h + s * 0.12 * h, 0.74 * h, -0.15 * h);
    add(g);
  }
}

export function buildSculptures(b) {
  const { stone, sculpt } = b;

  for (const grp of GROUPS) {
    const r = rng(grp.seed * 97);
    const base = T(grp.x, L.pedestal, grp.side * D2, 0, grp.side > 0 ? 0 : Math.PI, 0);
    const add = (g, m) => {
      if (m) g.applyMatrix4(m);
      g.applyMatrix4(base);
      sculpt.add(g);
    };

    // Piédestal mouluré
    const fz = grp.side * D2;
    const zIn = Math.min(fz, fz + grp.side * PED_OUT);
    const zOut = Math.max(fz, fz + grp.side * PED_OUT);
    stone.box(grp.x - PED_HALF - 0.3, 0, zIn - (grp.side < 0 ? 0.3 : 0), grp.x + PED_HALF + 0.3, 1.0, zOut + (grp.side > 0 ? 0.3 : 0));
    stone.box(grp.x - PED_HALF, 1.0, zIn, grp.x + PED_HALF, L.pedestal - 0.5, zOut);
    stone.box(grp.x - PED_HALF - 0.25, L.pedestal - 0.5, zIn - (grp.side < 0 ? 0.25 : 0), grp.x + PED_HALF + 0.25, L.pedestal, zOut + (grp.side > 0 ? 0.25 : 0));

    // Masse de fond (silhouette du groupe en haut-relief)
    const sil = new THREE.Shape();
    const pts = [[-3.9, 0], [-4.1, 2.6], [-3.7, 5.4], [-3.3, 7.6], [-3.6, 9.4], [-2.5, 11.0], [-0.7, 11.95], [1.1, 11.7], [2.8, 10.9], [3.6, 9.3], [3.2, 7.4], [3.9, 5.1], [4.1, 2.3], [3.9, 0]];
    sil.moveTo(...pts[0]);
    sil.splineThru(pts.slice(1).map(([x, y]) => new THREE.Vector2(x, y)));
    sil.closePath();
    const back = new THREE.ExtrudeGeometry(sil, { depth: 0.9, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.2, bevelSegments: 2, curveSegments: 6 });
    add(back);

    // Personnages du bas
    const xs = [-2.5, 0.0, 2.5];
    for (const [i, x] of xs.entries()) {
      const g = [];
      figure((geo) => g.push(geo), 5.0 + r() * 0.8, r, { weapon: i === 1 ? 1 : -1, shield: i === 0 });
      const m = T(x + (r() - 0.5) * 0.6, 0, 1.25 + r() * 0.4, 0, (r() - 0.5) * 0.7, (r() - 0.5) * 0.15);
      for (const geo of g) add(geo, m);
    }
    // Personnages du second plan (plus haut)
    for (const x of [-1.4, 1.6]) {
      const g = [];
      figure((geo) => g.push(geo), 4.2 + r() * 0.6, r, { lean: (r() - 0.5) * 0.5 });
      const m = T(x, 3.6 + r() * 0.8, 0.9, 0, (r() - 0.5) * 0.6, (r() - 0.5) * 0.3);
      for (const geo of g) add(geo, m);
    }
    // Drapés et volumes de remplissage (le groupe se lit comme une masse sculptée)
    for (let i = 0; i < 9; i++) {
      const blob = new THREE.SphereGeometry(1, 10, 8);
      blob.scale(0.7 + r() * 0.6, 0.5 + r() * 0.6, 0.35 + r() * 0.2);
      blob.rotateZ((r() - 0.5) * 1.2);
      blob.translate((r() - 0.5) * 6.0, 0.8 + r() * 6.0, 1.0 + r() * 0.4);
      add(blob);
    }
    // Génie ailé
    {
      const g = [];
      genius((geo) => g.push(geo), 4.6, grp.wings, r);
      const m = T(-0.3, 6.6, 1.2, 0.25, 0, (r() - 0.5) * 0.2);
      for (const geo of g) add(geo, m);
    }
  }
}
