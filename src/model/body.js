import * as THREE from 'three';
import { ARC, W2, D2, GR, GSPRING, SR, SSPRING, PIER_W, PIER_X, L } from './dimensions.js';
import { archRing } from './helpers.js';

// Corps de l'arc : deux piles percées des petites voûtes, bloc supérieur évidé par la grande voûte,
// socle, bandeau d'imposte, archivoltes, clés de voûte et cadres des grands bas-reliefs.
export function buildBody(b) {
  const { stone, relief, spandrel } = b;

  // --- Piles : profil (z, y) avec la petite voûte, extrudé sur la largeur de la pile (axe x)
  for (const sx of [-1, 1]) {
    const s = new THREE.Shape();
    s.moveTo(-D2, 0);
    s.lineTo(-SR, 0);
    s.lineTo(-SR, SSPRING);
    s.absarc(0, SSPRING, SR, Math.PI, 0, true);
    s.lineTo(SR, 0);
    s.lineTo(D2, 0);
    s.lineTo(D2, GSPRING);
    s.lineTo(-D2, GSPRING);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: PIER_W, bevelEnabled: false, curveSegments: 20 });
    g.rotateY(-Math.PI / 2); // profil x → z monde, extrusion → -x
    g.translate(sx > 0 ? W2 : -GR, 0, 0);
    stone.add(g);
  }

  // --- Bloc supérieur : façade (x, y) avec le cintre de la grande voûte, extrudé sur la profondeur
  const up = new THREE.Shape();
  up.moveTo(-W2, GSPRING);
  up.lineTo(-GR, GSPRING);
  up.absarc(0, GSPRING, GR, Math.PI, 0, true);
  up.lineTo(W2, GSPRING);
  up.lineTo(W2, L.wallTop);
  up.lineTo(-W2, L.wallTop);
  up.closePath();
  const ug = new THREE.ExtrudeGeometry(up, { depth: ARC.depth, bevelEnabled: false, curveSegments: 40 });
  ug.translate(0, 0, -D2);
  stone.add(ug);

  // Noyau plein de l'entablement et de l'attique
  stone.box(-W2, L.wallTop, -D2, W2, L.atticBody, D2);

  // --- Socle (interrompu au passage des petites voûtes)
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? GR : -W2;
    const x1 = sx > 0 ? W2 : -GR;
    for (const [p, y0, y1] of [[0.5, 0, 1.3], [0.32, 1.3, L.socle]]) {
      stone.box(x0 - p, y0, -D2 - p, x1 + p, y1, -SR);
      stone.box(x0 - p, y0, SR, x1 + p, y1, D2 + p);
    }
    // Bandeau d'imposte : trois moulures qui font le tour de chaque pile
    const cx = sx * PIER_X;
    for (const [p, y0, y1] of [[0.2, L.impost0, 20.6], [0.38, 20.6, 21.3], [0.55, 21.3, L.impost1]]) {
      const g = new THREE.BoxGeometry(PIER_W + p * 2, y1 - y0, ARC.depth + p * 2);
      g.translate(cx, (y0 + y1) / 2, 0);
      stone.add(g);
    }
    // Petite imposte à la naissance des petites voûtes (face extérieure et face sur le passage)
    for (const fx of [sx * W2, sx * GR]) {
      const out = fx === sx * W2 ? sx : -sx;
      for (const sz of [-1, 1]) {
        stone.box(
          Math.min(fx, fx + out * 0.32), SSPRING - 0.6, sz > 0 ? SR : -SR - 1.3,
          Math.max(fx, fx + out * 0.32), SSPRING, sz > 0 ? SR + 1.3 : -SR,
        );
        // piédroits encadrant la petite voûte
        stone.box(
          Math.min(fx, fx + out * 0.18), L.socle, sz > 0 ? SR : -SR - 0.8,
          Math.max(fx, fx + out * 0.18), SSPRING - 0.6, sz > 0 ? SR + 0.8 : -SR,
        );
      }
      // archivolte de la petite voûte
      const ring = archRing(SR, SR + 0.75, 0.3, 20);
      ring.rotateY(out > 0 ? Math.PI / 2 : -Math.PI / 2);
      ring.translate(fx, SSPRING, 0);
      stone.add(ring);
      // clé
      stone.box(Math.min(fx, fx + out * 0.45), ARC.smallArch.height - 0.3, -0.5, Math.max(fx, fx + out * 0.45), 19.7, 0.5);
    }
  }

  // --- Grandes faces (z = ±D2)
  for (const sz of [-1, 1]) {
    const fz = sz * D2;
    const zr = (p) => [Math.min(fz, fz + sz * p), Math.max(fz, fz + sz * p)];
    // piédroits de la grande voûte
    for (const sx of [-1, 1]) {
      const [z0, z1] = zr(0.25);
      stone.box(sx > 0 ? GR : -GR - 1.1, L.socle, z0, sx > 0 ? GR + 1.1 : -GR, L.impost0, z1);
    }
    // archivolte en deux moulures
    for (const [r0, r1, t] of [[GR, GR + 1.0, 0.35], [GR + 1.0, GR + 1.35, 0.2]]) {
      const ring = archRing(r0, r1, t, 48);
      if (sz < 0) ring.rotateY(Math.PI);
      ring.translate(0, GSPRING, fz);
      stone.add(ring);
    }
    // clé de voûte en console, jusqu'à l'architrave
    {
      const [z0, z1] = zr(0.7);
      stone.box(-0.85, ARC.greatArch.height - 0.4, z0, 0.85, L.wallTop, z1);
    }
    // cadres des grands bas-reliefs sur les piles
    for (const sx of [-1, 1]) {
      const cx = sx * PIER_X;
      const hw = 5.55;
      const [z0, z1] = zr(0.32);
      stone.box(cx - hw, L.panel0, z0, cx + hw, L.panel0 + 0.4, z1);
      stone.box(cx - hw, L.panel1 - 0.4, z0, cx + hw, L.panel1, z1);
      stone.box(cx - hw, L.panel0, z0, cx - hw + 0.4, L.panel1, z1);
      stone.box(cx + hw - 0.4, L.panel0, z0, cx + hw, L.panel1, z1);
      const p = new THREE.PlaneGeometry(hw * 2 - 0.8, L.panel1 - L.panel0 - 0.8);
      if (sz < 0) p.rotateY(Math.PI);
      p.translate(cx, (L.panel0 + L.panel1) / 2, fz + sz * 0.05);
      relief.add(p);
    }
    // Renommées des écoinçons
    for (const sx of [-1, 1]) {
      const p = new THREE.PlaneGeometry(8.3, 7.3);
      const uv = p.attributes.uv;
      const mirror = sx * sz < 0;
      if (mirror) for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
      if (sz < 0) p.rotateY(Math.PI);
      p.translate(sx * (0.9 + 4.15), 24.5 + 3.65, fz + sz * 0.08);
      spandrel.add(p);
    }
  }

  // --- Petites faces (x = ±W2) : bas-relief au-dessus de la petite voûte
  for (const sx of [-1, 1]) {
    const fx = sx * W2;
    const x0 = Math.min(fx, fx + sx * 0.32);
    const x1 = Math.max(fx, fx + sx * 0.32);
    const hw = 6.8;
    stone.box(x0, L.panel0, -hw, x1, L.panel0 + 0.4, hw);
    stone.box(x0, L.panel1 - 0.4, -hw, x1, L.panel1, hw);
    stone.box(x0, L.panel0, -hw, x1, L.panel1, -hw + 0.4);
    stone.box(x0, L.panel0, hw - 0.4, x1, L.panel1, hw);
    const p = new THREE.PlaneGeometry(hw * 2 - 0.8, L.panel1 - L.panel0 - 0.8);
    p.rotateY(sx > 0 ? Math.PI / 2 : -Math.PI / 2);
    p.translate(fx + sx * 0.05, (L.panel0 + L.panel1) / 2, 0);
    relief.add(p);
  }
}
