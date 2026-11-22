import * as THREE from 'three';
import { rng } from './helpers.js';

// Toutes les textures sont dessinées en code (CanvasTexture) : aucune image téléchargée.

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function tex(c, { repeat = true, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Appareil de pierre : assises de 0,5 m, carreaux de 1,1 à 2,2 m (la texture couvre 8 × 8 m)
export function stoneTexture() {
  const [c, g] = canvas(512, 512);
  const r = rng(11);
  g.fillStyle = '#e8ddc6';
  g.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 16; row++) {
    const y = row * 32;
    let x = -r() * 120;
    while (x < 512) {
      const w = 70 + r() * 70;
      const l = 227 + Math.floor((r() - 0.5) * 9);
      g.fillStyle = `rgb(${l + 6},${l - 2},${l - 22})`;
      g.fillRect(x, y, w, 32);
      g.fillStyle = 'rgba(120,105,80,0.32)';
      g.fillRect(x, y, 1.4, 32);
      x += w;
    }
    g.fillStyle = 'rgba(120,105,80,0.38)';
    g.fillRect(0, y, 512, 1.6);
  }
  for (let i = 0; i < 5000; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '90,80,60' : '255,250,235'},${0.04 + r() * 0.08})`;
    g.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2);
  }
  const t = tex(c);
  t.repeat.set(1 / 8, 1 / 8);
  return t;
}

// Personnage stylisé en bas-relief (ombre portée puis silhouette claire)
function figure(g, x, y, h, r, light = '#efe5cf') {
  const lean = (r() - 0.5) * 0.35 * h;
  const stride = (0.06 + r() * 0.12) * h;
  const armA = [-0.4 - r() * 1.8, 0.2 + r() * 1.9];
  const hip = [x + lean * 0.3, y - 0.48 * h];
  const neck = [x + lean, y - 0.8 * h];
  const spear = r() < 0.35;
  const flag = !spear && r() < 0.2;
  const shield = r() < 0.3;
  for (const pass of [0, 1]) {
    const ox = pass ? 0 : h * 0.018;
    const oy = pass ? 0 : h * 0.022;
    g.strokeStyle = g.fillStyle = pass ? light : 'rgba(70,55,35,0.6)';
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.lineWidth = h * 0.085;
    g.beginPath();
    g.moveTo(x - stride + ox, y + oy);
    g.lineTo(hip[0] + ox, hip[1] + oy);
    g.lineTo(x + stride + ox, y + oy);
    g.stroke();
    g.lineWidth = h * 0.16;
    g.beginPath();
    g.moveTo(hip[0] + ox, hip[1] + oy);
    g.lineTo(neck[0] + ox, neck[1] + oy);
    g.stroke();
    // drapé
    g.beginPath();
    g.moveTo(hip[0] - h * 0.14 + ox, hip[1] + h * 0.16 + oy);
    g.lineTo(hip[0] + h * 0.14 + ox, hip[1] + h * 0.16 + oy);
    g.lineTo(neck[0] + h * 0.07 + ox, neck[1] + h * 0.12 + oy);
    g.lineTo(neck[0] - h * 0.07 + ox, neck[1] + h * 0.12 + oy);
    g.fill();
    g.lineWidth = h * 0.055;
    for (const [k, a] of armA.entries()) {
      const sx = neck[0] + (k ? 1 : -1) * h * 0.06;
      g.beginPath();
      g.moveTo(sx + ox, neck[1] + h * 0.04 + oy);
      g.lineTo(sx + Math.sin(a) * h * 0.34 + ox, neck[1] + h * 0.04 - Math.cos(a) * h * 0.34 + oy);
      g.stroke();
    }
    g.beginPath();
    g.arc(neck[0] + ox, neck[1] - h * 0.08 + oy, h * 0.07, 0, Math.PI * 2);
    g.fill();
    if (spear || flag) {
      const hx = neck[0] + Math.sin(armA[1]) * h * 0.34;
      const hy = neck[1] + h * 0.04 - Math.cos(armA[1]) * h * 0.34;
      g.lineWidth = h * 0.02;
      g.beginPath();
      g.moveTo(hx + ox, hy + h * 0.5 + oy);
      g.lineTo(hx + ox, hy - h * 0.45 + oy);
      g.stroke();
      if (flag) g.fillRect(hx + ox, hy - h * 0.45 + oy, h * 0.3, h * 0.2);
    }
    if (shield) {
      g.beginPath();
      g.ellipse(neck[0] - h * 0.2 + ox, neck[1] + h * 0.25 + oy, h * 0.1, h * 0.14, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
}

function horse(g, x, y, h, r, light = '#efe5cf') {
  const dir = r() < 0.5 ? -1 : 1;
  for (const pass of [0, 1]) {
    const ox = pass ? 0 : h * 0.02;
    const oy = pass ? 0 : h * 0.025;
    g.strokeStyle = g.fillStyle = pass ? light : 'rgba(70,55,35,0.6)';
    g.lineCap = 'round';
    g.lineWidth = h * 0.07;
    g.beginPath();
    g.ellipse(x + ox, y - h * 0.55 + oy, h * 0.42, h * 0.17, 0, 0, Math.PI * 2);
    g.fill();
    for (const lx of [-0.3, -0.18, 0.2, 0.32]) {
      g.beginPath();
      g.moveTo(x + lx * h + ox, y - h * 0.5 + oy);
      g.lineTo(x + lx * h + (r() - 0.5) * h * 0.25 + ox, y + oy);
      g.stroke();
    }
    g.lineWidth = h * 0.13;
    g.beginPath();
    g.moveTo(x + dir * h * 0.3 + ox, y - h * 0.6 + oy);
    g.lineTo(x + dir * h * 0.5 + ox, y - h * 0.95 + oy);
    g.stroke();
    g.beginPath();
    g.ellipse(x + dir * h * 0.58 + ox, y - h * 0.95 + oy, h * 0.13, h * 0.07, dir * 0.5, 0, Math.PI * 2);
    g.fill();
  }
  figure(g, x - dir * h * 0.05, y - h * 0.62, h * 0.75, r, light);
}

// Grand bas-relief encadré (scène de bataille stylisée)
export function reliefTexture(seed = 3) {
  const [c, g] = canvas(1024, 512);
  const r = rng(seed);
  const bg = g.createLinearGradient(0, 0, 0, 512);
  bg.addColorStop(0, '#d9ccb1');
  bg.addColorStop(1, '#cbbd9f');
  g.fillStyle = bg;
  g.fillRect(0, 0, 1024, 512);
  g.fillStyle = 'rgba(80,65,45,0.25)';
  g.fillRect(0, 452, 1024, 60);
  for (let i = 0; i < 26; i++) {
    const x = 30 + r() * 964;
    const back = i < 10;
    const h = back ? 170 + r() * 60 : 250 + r() * 90;
    const y = back ? 330 + r() * 40 : 450 - r() * 10;
    if (!back && r() < 0.16) horse(g, x, y, h * 0.75, r);
    else figure(g, x, y, h, r, back ? '#e2d7bf' : '#f1e8d3');
  }
  return tex(c, { repeat: false });
}

// Grande frise : procession continue (la texture couvre 22,2 m × 2,9 m)
export function friezeTexture() {
  const [c, g] = canvas(2048, 268);
  const r = rng(29);
  g.fillStyle = '#d3c5a8';
  g.fillRect(0, 0, 2048, 268);
  g.fillStyle = 'rgba(80,65,45,0.2)';
  g.fillRect(0, 236, 2048, 32);
  for (let i = 0; i < 70; i++) {
    const x = (i / 70) * 2048 + r() * 20;
    if (r() < 0.12) horse(g, x, 236, 150, r);
    else figure(g, x, 236, 190 + r() * 30, r);
  }
  const t = tex(c);
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

// Caisson à rosace (motif répété dans les voûtes)
export function cofferTexture() {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#ddd1b7';
  g.fillRect(0, 0, 256, 256);
  const steps = [['#cdbf9f', 22], ['#bfb091', 40], ['#ad9e7f', 58]];
  for (const [col, inset] of steps) {
    g.fillStyle = col;
    g.fillRect(inset, inset, 256 - inset * 2, 256 - inset * 2);
  }
  g.fillStyle = '#efe5cf';
  g.save();
  g.translate(128, 128);
  for (let i = 0; i < 8; i++) {
    g.rotate(Math.PI / 4);
    g.beginPath();
    g.ellipse(0, -26, 9, 22, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.beginPath();
  g.arc(0, 0, 13, 0, Math.PI * 2);
  g.fillStyle = '#d8ccb1';
  g.fill();
  g.restore();
  return tex(c);
}

// Panneaux gravés (noms des batailles et des généraux)
export function inscriptionTexture() {
  const [c, g] = canvas(256, 1024);
  const r = rng(5);
  g.fillStyle = '#ddd2ba';
  g.fillRect(0, 0, 256, 1024);
  g.strokeStyle = '#b4a685';
  g.lineWidth = 8;
  g.strokeRect(10, 10, 236, 1004);
  g.fillStyle = '#7c6d52';
  g.fillRect(40, 40, 176, 14);
  for (let col = 0; col < 2; col++) {
    for (let y = 80; y < 990; y += 15) {
      const w = 40 + r() * 54;
      g.fillRect(30 + col * 104 + (98 - w) / 2, y, w, 6);
    }
  }
  return tex(c, { repeat: false });
}

// Renommée ailée couchée dans l'écoinçon (fond transparent)
export function spandrelTexture(px, archCx, archCy, archR) {
  const [c, g] = canvas(512, 448);
  const light = '#e9dec7';
  for (const pass of [0, 1]) {
    const o = pass ? 0 : 5;
    g.fillStyle = g.strokeStyle = pass ? light : 'rgba(60,45,28,0.3)';
    g.lineCap = 'round';
    g.lineJoin = 'round';
    // repère local qui suit la tangente de l'arc (x vers le bas de l'écoinçon, -y vers l'extérieur)
    g.save();
    g.translate(352 + o, 200 + o);
    g.rotate(0.78);
    // grande aile déployée vers l'angle supérieur
    for (let i = 0; i < 9; i++) {
      const a = -1.95 + i * 0.12;
      const len = 190 - i * 11;
      g.beginPath();
      g.ellipse(-40 + Math.cos(a) * len * 0.5, -40 + Math.sin(a) * len * 0.5, len * 0.5, 17, a, 0, Math.PI * 2);
      g.fill();
    }
    // corps couché enveloppé d'un drapé
    g.beginPath();
    g.moveTo(-175, -48);
    g.quadraticCurveTo(-60, -88, 60, -58);
    g.quadraticCurveTo(180, -34, 225, 12);
    g.quadraticCurveTo(175, 56, 40, 54);
    g.quadraticCurveTo(-90, 52, -180, 24);
    g.closePath();
    g.fill();
    // buste relevé et tête
    g.beginPath();
    g.ellipse(-160, -22, 46, 34, -0.4, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(-212, -58, 30, 0, Math.PI * 2);
    g.fill();
    // bras tendu tenant une couronne
    g.lineWidth = 20;
    g.beginPath();
    g.moveTo(-170, -30);
    g.lineTo(-250, -120);
    g.stroke();
    g.lineWidth = 9;
    g.beginPath();
    g.arc(-262, -150, 26, 0, Math.PI * 2);
    g.stroke();
    // palme / trompette le long du corps
    g.lineWidth = 10;
    g.beginPath();
    g.moveTo(-110, 34);
    g.lineTo(200, 60);
    g.stroke();
    g.restore();
  }
  // plis du drapé
  g.strokeStyle = 'rgba(80,62,40,0.45)';
  g.lineWidth = 3;
  g.save();
  g.translate(352, 200);
  g.rotate(0.78);
  for (let i = 0; i < 6; i++) {
    g.beginPath();
    g.moveTo(-100 + i * 45, -40);
    g.quadraticCurveTo(-80 + i * 45, 0, -110 + i * 45, 38);
    g.stroke();
  }
  g.restore();
  // découpe le long de l'extrados de l'archivolte
  g.globalCompositeOperation = 'destination-out';
  g.beginPath();
  g.arc(archCx * px, archCy * px, archR * px, 0, Math.PI * 2);
  g.fill();
  return tex(c, { repeat: false });
}

// Façade haussmannienne (module de 5 travées × 6 niveaux) et fenêtres éclairées la nuit
export function facadeTextures() {
  const [c, g] = canvas(512, 512);
  const [e, ge] = canvas(512, 512);
  const r = rng(41);
  g.fillStyle = '#ece5d6';
  g.fillRect(0, 0, 512, 512);
  ge.fillStyle = '#000';
  ge.fillRect(0, 0, 512, 512);
  g.fillStyle = '#b9ae9a';
  g.fillRect(0, 0, 512, 10);
  // rez-de-chaussée : arcades de boutiques
  g.fillStyle = '#6a5f53';
  for (let i = 0; i < 5; i++) {
    g.fillRect(18 + i * 100, 430, 64, 82);
    if (r() < 0.8) {
      ge.fillStyle = '#ffd59a';
      ge.fillRect(18 + i * 100, 436, 64, 76);
    }
  }
  g.fillStyle = '#cfc5b2';
  g.fillRect(0, 418, 512, 10);
  for (let f = 0; f < 5; f++) {
    const y = 40 + f * 76;
    for (let i = 0; i < 5; i++) {
      const x = 28 + i * 100;
      g.fillStyle = '#d9d0bf';
      g.fillRect(x - 5, y - 5, 54, 66);
      g.fillStyle = '#4c5563';
      g.fillRect(x, y, 44, 58);
      g.fillStyle = 'rgba(255,255,255,0.18)';
      g.fillRect(x + 21, y, 2, 58);
      if (r() < 0.38) {
        ge.fillStyle = r() < 0.5 ? '#ffcf7a' : '#ffe2a8';
        ge.fillRect(x, y, 44, 58);
      }
    }
    if (f === 1 || f === 4) {
      g.fillStyle = '#2f3237';
      g.fillRect(0, y + 58, 512, 6);
    }
  }
  return { map: tex(c), emissive: tex(e) };
}

// Pavés de l'anneau (la texture couvre ~3,7 m)
export function cobbleTexture() {
  const [c, g] = canvas(256, 256);
  const r = rng(17);
  g.fillStyle = '#4f4b46';
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 12) {
    let x = (y / 12) % 2 ? -8 : 0;
    while (x < 256) {
      const w = 13 + r() * 6;
      const l = 108 + Math.floor(r() * 34);
      g.fillStyle = `rgb(${l + 4},${l},${l - 6})`;
      g.fillRect(x + 1, y + 1, w - 2, 10);
      x += w;
    }
  }
  return tex(c);
}

// Dalles claires du terre-plein (la texture couvre 4 m)
export function slabTexture() {
  const [c, g] = canvas(256, 256);
  const r = rng(23);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const l = 196 + Math.floor(r() * 18);
      g.fillStyle = `rgb(${l},${l - 6},${l - 16})`;
      g.fillRect(x * 64, y * 64, 64, 64);
    }
  }
  g.fillStyle = 'rgba(90,80,65,0.45)';
  for (let i = 0; i <= 4; i++) {
    g.fillRect(i * 64 - 1, 0, 2, 256);
    g.fillRect(0, i * 64 - 1, 256, 2);
  }
  return tex(c);
}
