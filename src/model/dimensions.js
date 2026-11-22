// Dimensions de l'Arc de triomphe de l'Étoile — 1 unité = 1 mètre.
//
// Cotes officielles : Wikipédia, « Arc de triomphe de l'Étoile » (fr) et « Arc de Triomphe » (en),
// d'après le Centre des monuments nationaux (paris-arc-de-triomphe.fr) :
//   hauteur 49,54 m · largeur 44,82 m · profondeur 22,21 m
//   grande voûte 29,19 m de haut × 14,62 m de large
//   petites voûtes 18,68 m de haut × 8,44 m de large
//
// Niveaux intermédiaires : relevés sur l'élévation et la coupe publiées par
// l'Allgemeine Bauzeitung (Vienne, 1838), Wikimedia Commons
// (Arc_de_Triomphe_ABZ_Wien_1838_Plan_180.jpg et Plan_182.jpg), recalées sur les cotes ci-dessus.

export const ARC = {
  height: 49.54,
  width: 44.82,
  depth: 22.21,
  greatArch: { width: 14.62, height: 29.19 },
  smallArch: { width: 8.44, height: 18.68 },
  shields: 30, // 11 + 11 sur les grandes faces, 4 + 4 sur les petites
};

export const W2 = ARC.width / 2; // 22,41
export const D2 = ARC.depth / 2; // 11,105
export const GR = ARC.greatArch.width / 2; // rayon de la grande voûte : 7,31
export const GSPRING = ARC.greatArch.height - GR; // naissance de la grande voûte : 21,88
export const SR = ARC.smallArch.width / 2; // rayon des petites voûtes : 4,22
export const SSPRING = ARC.smallArch.height - SR; // naissance des petites voûtes : 14,46
export const PIER_W = W2 - GR; // largeur d'une pile : 15,10
export const PIER_X = (W2 + GR) / 2; // axe d'une pile : 14,86

// Niveaux (m au-dessus du terre-plein)
export const L = {
  socle: 1.7,
  pedestal: 6.6, // dessus des piédestaux des groupes sculptés
  groupTop: 18.6,
  impost0: 19.9, // bandeau d'imposte
  impost1: GSPRING,
  panel0: 23.8, // grands bas-reliefs encadrés
  panel1: 30.0,
  wallTop: 32.0,
  architrave: 33.0,
  frieze: 36.4, // grande frise
  cornice: 39.4, // corniche à modillons
  atticPlinth: 40.6,
  atticBody: 46.6, // attique aux 30 boucliers
  atticCornice: 48.7,
  top: ARC.height,
};

// Contexte urbain (stylisé, d'après les vues aériennes)
export const PLACE = {
  island: 36, // terre-plein pavé autour de l'arc
  ring: 112, // bord extérieur de l'anneau de circulation
  facades: 124, // premières façades
  avenues: 12,
};
