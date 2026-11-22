import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PLACE } from '../model/dimensions.js';
import { cobbleTexture, slabTexture } from '../model/textures.js';

// Les 12 avenues de l'Étoile (angles depuis l'axe des Champs-Élysées, largeur stylisée en m)
export const AVENUES = Array.from({ length: PLACE.avenues }, (_, i) => ({
  angle: (i * Math.PI * 2) / PLACE.avenues,
  width: i === 0 || i === 6 ? 70 : i === 8 ? 56 : 36, // Champs-Élysées, Grande-Armée, Foch
}));

const ROAD_Y = -0.15;

// Sol : terre-plein dallé, anneau pavé, trottoirs, avenues, bornes et réverbères.
export function createGround(scene) {
  const city = new THREE.Mesh(
    new THREE.CircleGeometry(2200, 48).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x8b867e, roughness: 1 }),
  );
  city.position.y = ROAD_Y - 0.06;
  city.receiveShadow = true;
  scene.add(city);

  // Anneau pavé
  const cob = cobbleTexture();
  cob.repeat.set(62, 62);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(PLACE.island - 0.5, PLACE.ring, 128, 1).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: cob, roughness: 0.95 }),
  );
  ring.position.y = ROAD_Y;
  ring.receiveShadow = true;
  scene.add(ring);

  // Terre-plein dallé + bordure
  const slab = slabTexture();
  slab.repeat.set(18, 18);
  const island = new THREE.Mesh(
    new THREE.CylinderGeometry(PLACE.island, PLACE.island + 0.1, -ROAD_Y, 128),
    new THREE.MeshStandardMaterial({ map: slab, roughness: 0.9 }),
  );
  island.position.y = ROAD_Y / 2;
  island.receiveShadow = true;
  scene.add(island);

  // Avenues (chaussée + trottoirs) et trottoir circulaire
  const asphalt = [];
  const walks = [];
  for (const a of AVENUES) {
    const len = 1600;
    const road = new THREE.PlaneGeometry(a.width - 12, len).rotateX(-Math.PI / 2);
    road.translate(0, 0, PLACE.ring - 0.5 + len / 2);
    road.rotateY(a.angle);
    asphalt.push(road);
    for (const s of [-1, 1]) {
      const w = new THREE.PlaneGeometry(6, len).rotateX(-Math.PI / 2);
      w.translate(s * (a.width / 2 - 3), 0, PLACE.ring + len / 2);
      w.rotateY(a.angle);
      walks.push(w);
    }
  }
  walks.push(new THREE.RingGeometry(PLACE.ring, PLACE.facades - 1, 128, 1).rotateX(-Math.PI / 2));
  const roads = new THREE.Mesh(mergeGeometries(asphalt), new THREE.MeshStandardMaterial({ color: 0x4d4d52, roughness: 0.95 }));
  roads.position.y = ROAD_Y + 0.08;
  roads.receiveShadow = true;
  scene.add(roads);
  const pave = new THREE.Mesh(mergeGeometries(walks), new THREE.MeshStandardMaterial({ color: 0xb9b2a6, roughness: 0.95 }));
  pave.position.y = ROAD_Y + 0.04;
  pave.receiveShadow = true;
  scene.add(pave);

  // Bornes en pierre autour du terre-plein
  const m4 = new THREE.Matrix4();
  const nB = 120;
  const bollards = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.17, 0.22, 0.85, 8).translate(0, 0.42, 0),
    new THREE.MeshStandardMaterial({ color: 0xd9cfbc, roughness: 0.9 }),
    nB,
  );
  for (let i = 0; i < nB; i++) {
    const a = (i / nB) * Math.PI * 2;
    m4.makeTranslation(Math.sin(a) * (PLACE.island - 0.6), 0, Math.cos(a) * (PLACE.island - 0.6));
    bollards.setMatrixAt(i, m4);
  }
  bollards.castShadow = true;
  scene.add(bollards);

  // Réverbères : bord du terre-plein, pourtour de la place, Champs-Élysées
  const spots = [];
  for (let i = 0; i < 20; i++) {
    const a = ((i + 0.5) / 20) * Math.PI * 2;
    spots.push([Math.sin(a) * (PLACE.island + 1.2), Math.cos(a) * (PLACE.island + 1.2)]);
  }
  for (let i = 0; i < 36; i++) {
    const a = ((i + 0.5) / 36) * Math.PI * 2;
    const near = AVENUES.some((av) => Math.abs(Math.atan2(Math.sin(a - av.angle), Math.cos(a - av.angle))) < (av.width / 2 + 4) / PLACE.ring);
    if (!near) spots.push([Math.sin(a) * (PLACE.ring + 2), Math.cos(a) * (PLACE.ring + 2)]);
  }
  for (let d = PLACE.ring + 20; d < 700; d += 32) for (const s of [-1, 1]) spots.push([s * 31, d]);
  const posts = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.08, 0.13, 5.2, 6).translate(0, 2.6, 0),
    new THREE.MeshStandardMaterial({ color: 0x23272a, roughness: 0.5, metalness: 0.4 }),
    spots.length,
  );
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xf3ead6, emissive: 0xffc46b, emissiveIntensity: 0, roughness: 0.4 });
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.34, 10, 8).translate(0, 5.4, 0), lampMat, spots.length);
  spots.forEach(([x, z], i) => {
    m4.makeTranslation(x, ROAD_Y, z);
    posts.setMatrixAt(i, m4);
    heads.setMatrixAt(i, m4);
  });
  posts.castShadow = true;
  scene.add(posts, heads);

  return {
    setNight(night) {
      lampMat.emissiveIntensity = night ? 3.5 : 0;
    },
  };
}
