import * as THREE from 'three';
import { ARC, D2, GR, GSPRING, SR, SSPRING, PIER_W, PIER_X } from './dimensions.js';

// Intrados à caissons (grande voûte et petites voûtes), panneaux gravés des piles
// et tombe du Soldat inconnu (inhumé en 1921, flamme ravivée chaque soir depuis 1923).
export function buildVaults(b) {
  const { coffers, inscriptions, dark, bronze, flame } = b;

  // Demi-cylindre vu de l'intérieur ; UV recalées pour des caissons carrés d'environ 2,3 m
  const vault = (r, len, cells) => {
    const g = new THREE.CylinderGeometry(r, r, len, 48, 1, true, Math.PI / 2, Math.PI);
    const uv = g.attributes.uv;
    const arc = Math.PI * r;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, uv.getX(i) * Math.round(arc / cells), uv.getY(i) * Math.round(len / cells));
    }
    return g;
  };
  const great = vault(GR - 0.02, ARC.depth, 2.3);
  great.rotateX(Math.PI / 2);
  great.translate(0, GSPRING, 0);
  coffers.add(great);
  for (const sx of [-1, 1]) {
    const g = vault(SR - 0.02, PIER_W, 1.7);
    g.rotateX(Math.PI / 2);
    g.rotateY(Math.PI / 2);
    g.translate(sx * PIER_X, SSPRING, 0);
    coffers.add(g);
  }

  // Panneaux gravés sur les faces intérieures des piles, de part et d'autre des petites voûtes
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const z0 = SR + 1.1;
      const z1 = D2 - 0.9;
      const p = new THREE.PlaneGeometry(z1 - z0, 16.2);
      p.rotateY(sx > 0 ? -Math.PI / 2 : Math.PI / 2);
      p.translate(sx * (GR - 0.03), 2.0 + 8.1, sz * (z0 + z1) / 2);
      inscriptions.add(p);
    }
  }

  // Tombe du Soldat inconnu : dalle de granit dans l'axe, flamme côté Champs-Élysées
  dark.box(-0.85, 0, -1.6, 0.85, 0.06, 1.6);
  dark.box(-1.3, 0, -2.0, 1.3, 0.03, 2.0);
  const rim = new THREE.CylinderGeometry(0.62, 0.7, 0.12, 24);
  rim.translate(0, 0.06, 2.55);
  bronze.add(rim);
  const sword = new THREE.BoxGeometry(0.08, 0.04, 1.1);
  sword.translate(0, 0.14, 2.55);
  bronze.add(sword);
  // flamme : profils tournés (LatheGeometry) emboîtés, rendus en additif
  const flameShape = (w, h) => {
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      pts.push(new THREE.Vector2(w * Math.sin(Math.PI * Math.min(1, t * 1.25)) * (1 - t) ** 0.6, t * h));
    }
    return new THREE.LatheGeometry(pts, 12);
  };
  for (const [w, h, dx, dz] of [[0.26, 0.85, 0, 0], [0.18, 1.05, 0.05, 0.03], [0.14, 0.7, -0.08, -0.04]]) {
    const f = flameShape(w, h);
    f.translate(dx, 0.12, 2.55 + dz);
    flame.add(f);
  }
  // chaîne basse autour de la tombe
  for (const [x, z] of [[-1.8, -2.5], [1.8, -2.5], [-1.8, 3.4], [1.8, 3.4]]) dark.box(x - 0.06, 0, z - 0.06, x + 0.06, 0.6, z + 0.06);
  for (const z of [-2.5, 3.4]) dark.box(-1.8, 0.48, z - 0.02, 1.8, 0.52, z + 0.02);
  for (const x of [-1.8, 1.8]) dark.box(x - 0.02, 0.48, -2.5, x + 0.02, 0.52, 3.4);
}
