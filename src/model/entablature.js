import * as THREE from 'three';
import { W2, D2, L } from './dimensions.js';

// Entablement : architrave à deux fasces, grande frise sculptée, corniche à denticules et modillons.
export function buildEntablature(b) {
  const { stone, frieze } = b;

  // Architrave
  stone.ring(W2, D2, L.wallTop, 32.5, 0.08);
  stone.ring(W2, D2, 32.5, L.architrave, 0.16);

  // Frise : 4 bandeaux en bas-relief (texture de procession) entre deux listels
  stone.ring(W2, D2, L.architrave, L.architrave + 0.25, 0.22);
  stone.ring(W2, D2, L.frieze - 0.25, L.frieze, 0.22);
  const h = L.frieze - L.architrave - 0.5;
  const y = (L.architrave + L.frieze) / 2;
  const faces = [
    [W2 * 2, 0, D2, 0],
    [W2 * 2, Math.PI, -D2, 0],
    [D2 * 2, Math.PI / 2, 0, W2],
    [D2 * 2, -Math.PI / 2, 0, -W2],
  ];
  for (const [len, ry, z, x] of faces) {
    const p = new THREE.PlaneGeometry(len, h);
    const uv = p.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (len / 22.2));
    p.rotateY(ry);
    p.translate(x + Math.sign(x) * 0.06, y, z + Math.sign(z) * 0.06);
    frieze.add(p);
  }

  // Corniche
  const c0 = L.frieze;
  stone.ring(W2, D2, c0, c0 + 0.4, 0.35); // moulure de lit
  stone.ring(W2, D2, c0 + 0.4, c0 + 0.8, 0.3);
  // denticules
  const dent = (len, along, fixed, axis, sign) => {
    for (let t = -len / 2 + 0.2; t < len / 2 - 0.1; t += 0.5) {
      const a = axis === 'x' ? [t, fixed] : [fixed, t];
      const g = new THREE.BoxGeometry(axis === 'x' ? 0.26 : 0.55, 0.4, axis === 'x' ? 0.55 : 0.26);
      g.translate(a[0] + (axis === 'z' ? sign * 0.27 : 0), c0 + 0.6, a[1] + (axis === 'x' ? sign * 0.27 : 0));
      stone.add(g);
    }
  };
  dent(W2 * 2, 'x', D2 + 0.3, 'x', 1);
  dent(W2 * 2, 'x', -D2 - 0.3, 'x', -1);
  dent(D2 * 2, 'z', W2 + 0.3, 'z', 1);
  dent(D2 * 2, 'z', -W2 - 0.3, 'z', -1);
  stone.ring(W2, D2, c0 + 0.8, c0 + 1.0, 0.62);
  // modillons (consoles sous le larmier)
  const mod = (len, fixed, axis, sign) => {
    for (let t = -len / 2 + 0.6; t < len / 2 - 0.3; t += 1.1) {
      const g = new THREE.BoxGeometry(axis === 'x' ? 0.42 : 1.35, 0.55, axis === 'x' ? 1.35 : 0.42);
      if (axis === 'x') g.translate(t, c0 + 1.28, fixed + sign * 0.67);
      else g.translate(fixed + sign * 0.67, c0 + 1.28, t);
      stone.add(g);
    }
  };
  mod(W2 * 2, D2, 'x', 1);
  mod(W2 * 2, -D2, 'x', -1);
  mod(D2 * 2, W2, 'z', 1);
  mod(D2 * 2, -W2, 'z', -1);
  stone.ring(W2, D2, c0 + 1.0, c0 + 1.55, 0.7);
  stone.ring(W2, D2, c0 + 1.55, c0 + 2.4, 1.45); // larmier
  stone.ring(W2, D2, c0 + 2.4, L.cornice, 1.2); // cimaise
}
