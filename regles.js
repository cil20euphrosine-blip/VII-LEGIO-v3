// VII Legio Solo — moteur de règles (sans affichage).
// Chaque table reprend la transcription française cellule par cellule (dépliant des tableaux).
// Une table absente de ce fichier n'est PAS encore transcrite : elle n'est pas remplacée par une formule.

export const COL_A = ['<=-4', '-3', '-2..-1', '0', '+1..+2', '+3..+5', '>=+6'];

// Colonnes du tableau A et du tableau B : écart F.C. (Légion − Extrasolaire) ou (Extrasolaire − Légion)
export function colonneEcart(ecart) {
  if (ecart <= -4) return 0;
  if (ecart === -3) return 1;
  if (ecart >= -2 && ecart <= -1) return 2;
  if (ecart === 0) return 3;
  if (ecart >= 1 && ecart <= 2) return 4;
  if (ecart >= 3 && ecart <= 5) return 5;
  return 6; // >= +6
}

// Tableau A — Tir de la Légion (U.C.). F = blessés, U = tués, null = aucun effet.
// Transcription : dépliant des tableaux, colonnes ..-4 | -3 | -2..-1 | 0 | +1..+2 | +3..+5 | +6..
const TABLEAU_A = [
  [null, null, null, null, null, null, 'F'],
  [null, null, null, null, null, 'F', 'F'],
  [null, null, null, 'F', 'F', 'F', 'U'],
  [null, null, 'F', 'F', 'F', 'U', 'U'],
  [null, 'F', 'F', 'F', 'U', 'U', 'U'],
  ['F', 'F', 'F', 'U', 'U', 'U', 'U'],
];

// Tableau B — Tir des Extrasolaires (S.C.). Nombre de dégâts ou d'hommes tués.
const TABLEAU_B = [
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1],
  [0, 0, 0, 1, 1, 1, 2],
  [0, 0, 1, 1, 2, 2, 3],
  [0, 1, 1, 2, 2, 2, 3],
  [1, 1, 2, 2, 3, 3, 4],
];

// Tableau G — Points de vénération (après une intimidation réussie).
const TABLEAU_G = [2, 2, 3, 3, 4, 4]; // indexé par dé − 1

export function tirA(ecart, de) {
  return TABLEAU_A[de - 1][colonneEcart(ecart)];
}

export function tirB(ecart, de) {
  return TABLEAU_B[de - 1][colonneEcart(ecart)];
}

export function pointsVeneration(de) {
  return TABLEAU_G[de - 1];
}

// Poussée : un réservoir fournit 5 parsecs ; un changement de niveau (HAUT ou BAS) coûte 4 parsecs.
export function coutSegment(seg) {
  return (seg.dir === 'HAUT' || seg.dir === 'BAS') ? 4 * seg.n : seg.n;
}
export function coutRoute(segs) {
  return segs.reduce((total, s) => total + coutSegment(s), 0);
}
export function autonomie(reservoirs, parsecsParReservoir = 5) {
  return reservoirs * parsecsParReservoir;
}

// ===== Atterrissage : zone (tableau P) et risque (tableau O) =====
// Ils doivent être déterminés AVANT toute autre action du tour (décision du joueur).

// Tableau O — masse (valeur) par type de planète. null = « — » (aucun risque).
export const MASSE = { A: 2, B: 1, C: null, D: 1, E: null, F: 1, G: 3, H: 4 };

// Lecture retenue (règlement U.C. 5G, décision du projet) : si le dé 6 est ≤ à la masse,
// le résultat du dé indique le nombre de dégâts. Divergence avec le S.C. encore ouverte.
export function risqueAtterrissage(typePlanete, de6) {
  if (!(typePlanete in MASSE)) throw new Error(`Type de planète inconnu : ${typePlanete}`);
  const masse = MASSE[typePlanete];
  if (masse === null) return { degats: 0 };
  return { degats: de6 <= masse ? de6 : 0 };
}

// Tableau P — zones d'atterrissage. Les faces 8, 9 et 0 (= 10) laissent le choix à l'U.C.
export const ZONES = { 1: 'Désert', 2: 'Pyramides', 3: 'Village', 4: 'Marais', 5: 'Forêt', 6: 'Eau', 7: 'Glace' };

export function zoneDuDe(de10) {
  const face = de10 === 0 ? 10 : de10;
  if (face >= 8) return { choixUC: true };
  return { choixUC: false, zone: ZONES[face] };
}

// Gate : tant que zone et risque ne sont pas déterminés, aucune autre action n'est permise.
// etat : { atterrissagePrevu: bool, risque: null | {degats}, zone: null | string }
export function actionsPermises(etat) {
  if (etat.atterrissagePrevu && (etat.risque === null || etat.zone === null)) {
    return ['determiner_zone_et_risque'];
  }
  return ['toutes'];
}

// Détermine le risque et la zone. choixZone n'est exigé que si le dé 10 laisse le choix à l'U.C.
export function determinerAtterrissage(etat, { typePlanete, de6, de10, choixZone }) {
  const risque = risqueAtterrissage(typePlanete, de6);
  const z = zoneDuDe(de10);
  let zone;
  if (z.choixUC) {
    if (!choixZone) throw new Error('Zone à choisir par l\'U.C. (dé 8, 9 ou 0)');
    zone = choixZone;
  } else {
    zone = z.zone;
  }
  return { ...etat, risque, zone };
}

// ===== Tableaux des missions (transcription du projet) =====

// Tableau C — élément touché par un dégât (dé 6)
const ELEMENTS_C = ['bouclier', 'laser', 'radar', 'ordinateur', 'reservoir', 'coque'];
export function elementTouche(de6) { return ELEMENTS_C[de6 - 1]; }

// Tableau D — capture d'un Non Sapiens. 'oui' = capture, 'aucun' = rien, 'non' = attaque immédiate.
const TABLEAU_D = [
  ['non', 'non', 'non', 'non', 'aucun'],
  ['non', 'non', 'aucun', 'aucun', 'oui'],
  ['non', 'aucun', 'aucun', 'oui', 'oui'],
  ['aucun', 'aucun', 'oui', 'oui', 'oui'],
  ['aucun', 'oui', 'oui', 'oui', 'oui'],
  ['oui', 'oui', 'oui', 'oui', 'oui'],
];
// colonnes : ..-4 | -3 | -2..-1 | 0 | +1..
export function tirD(ecart, de) {
  const col = ecart <= -4 ? 0 : ecart === -3 ? 1 : ecart <= -1 ? 2 : ecart === 0 ? 3 : 4;
  return TABLEAU_D[de - 1][col];
}

// Tableau E — alliance. colonnes F. All. 4 | 3 | 2 | 1
const TABLEAU_E = [
  ['aucun', 'aucun', 'non', 'non'],
  ['oui', 'aucun', 'aucun', 'non'],
  ['oui', 'oui', 'oui', 'aucun'],
  ['oui', 'oui', 'oui', 'oui'],
  ['oui', 'oui', 'oui', 'oui'],
  ['oui', 'oui', 'oui', 'oui'],
];
export function tirE(fAll, de) {
  if (fAll < 1 || fAll > 4) throw new Error('Facteur d’alliance hors tableau (1 à 4)');
  return TABLEAU_E[de - 1][4 - fAll];
}

// Tableau F — intimidation (combat théorique). colonnes ..-1 | 0 | +1 | +2 | +3..+5 | +6..
const TABLEAU_F = [
  ['non', 'non', 'non', 'non', 'aucun', 'aucun'],
  ['non', 'non', 'non', 'aucun', 'aucun', 'oui'],
  ['non', 'non', 'aucun', 'aucun', 'oui', 'oui'],
  ['non', 'aucun', 'aucun', 'oui', 'oui', 'oui'],
  ['aucun', 'aucun', 'oui', 'oui', 'oui', 'oui'],
  ['oui', 'oui', 'oui', 'oui', 'oui', 'oui'],
];
export function tirF(ecart, de) {
  const col = ecart <= -1 ? 0 : ecart === 0 ? 1 : ecart === 1 ? 2 : ecart === 2 ? 3 : ecart <= 5 ? 4 : 5;
  return TABLEAU_F[de - 1][col];
}

// Tableau H — commerce (espace interne) : points par dé
const TABLEAU_H = [-2, -1, 0, 0, 2, 3];
export function pointsCommerceInterne(de) { return TABLEAU_H[de - 1]; }

// Tableau I — commerce (espace externe) : colonnes = points de personnalité 0..5
const TABLEAU_I = [
  [-1, -1, -1, -2, -3, -3],
  [null, 0, 0, -1, -2, -2],
  [null, 1, 1, 0, null, -1],
  [1, 2, 2, 0, 2, null],
  [2, 3, 2, 2, 3, 4],
  [2, 4, 3, 3, 4, 5],
];
export function pointsCommerceExterne(personnalite, de) {
  if (personnalite < 0 || personnalite > 5) throw new Error('Personnalité hors tableau (0 à 5)');
  return TABLEAU_I[de - 1][personnalite]; // null = « — » : aucun échange
}

// Tableau L — lancement de Tot 100 %. 'oui' = tir possible, 'non' = impossible.
// Interne : personnalité fixée à 3 (règlement U.C. 4 VI).
const TABLEAU_L = [
  ['non', 'non', 'non', 'non', 'non', 'non'],
  ['non', 'non', 'non', 'non', 'non', 'non'],
  ['non', 'non', 'non', 'non', 'oui', 'oui'],
  ['non', 'non', 'non', 'oui', 'oui', 'oui'],
  ['non', 'oui', 'oui', 'oui', 'oui', 'oui'],
  ['oui', 'oui', 'oui', 'oui', 'oui', 'oui'],
];
export function tirL(personnalite, de) { return TABLEAU_L[de - 1][personnalite]; }
export function tirLInterne(de) { return tirL(3, de); }
