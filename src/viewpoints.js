// Points de vue nommés, choisis près des angles des photos de référence :
//  facade  : trois-quarts depuis le sol, petite face à gauche, grande face à droite (photo de 2018)
//  aerien  : vue plongeante sur la place de l'Étoile et ses 12 avenues
//  detail  : La Marseillaise, le grand bas-relief et l'entablement
//  voute   : sous la grande voûte à caissons, tombe du Soldat inconnu
export const VIEWPOINTS = [
  { id: 'facade', label: 'Façade', icon: 'account_balance', position: [-66, 6, 84], target: [-2, 22, 0] },
  { id: 'aerien', label: 'Vue aérienne', icon: 'flight', position: [175, 165, 245], target: [0, 8, 0] },
  { id: 'detail', label: 'Détail', icon: 'center_focus_strong', position: [36, 9, 46], target: [12, 18, 11] },
  { id: 'voute', label: 'Sous la voûte', icon: 'arrow_upward', position: [2.4, 2.1, 13.5], target: [0, 6.8, -6], fov: 62 },
];

export function viewFromHash(hash) {
  const id = String(hash || '').replace(/^#/, '');
  return VIEWPOINTS.find((v) => v.id === id) || null;
}
