// Tests d'acceptation : exemples du règlement et cellules des tableaux transcrits.
import { tirA, tirB, pointsVeneration, coutRoute, autonomie } from './regles.js';

let ok = 0, ko = 0;
function verifie(nom, obtenu, attendu) {
  if (obtenu === attendu) { ok++; console.log('OK   ', nom); }
  else { ko++; console.log('ÉCART', nom, '| attendu :', attendu, '| obtenu :', obtenu); }
}

// Règlement U.C., exemple de la Frombola (chapitre 6, tour I et suivants)
verifie('Route 10 N + 5 E, 3 réservoirs : total 15 parsecs', coutRoute([{dir:'N',n:10},{dir:'E',n:5}]), 15);
verifie('Frombola : 3 réservoirs = 15 parsecs', autonomie(3, 5), 15);
// Règlement 3F a : « 5 NORD + 5 N.E. + 1 S.E. + 4 vers le HAUT, route totale de 15 parsecs ».
// Lecture retenue : « 4 vers le HAUT » = 1 changement de niveau = 4 parsecs (règle du projet).
verifie('Route 5 N + 5 NE + 1 SE + 1 niveau HAUT (= 4 parsecs) : total 15 (règlement 3F a)',
  coutRoute([{dir:'N',n:5},{dir:'NE',n:5},{dir:'SE',n:1},{dir:'HAUT',n:1}]), 15);

// Table A (transcription) : exemple du tour V du règlement U.C.
verifie('Table A, écart −4, dé 6 : F (blessés)', tirA(-4, 6), 'F');
verifie('Table A, écart 0, dé 3 : F (transcription)', tirA(0, 3), 'F');
verifie('Table A, écart +3, dé 1 : aucun effet', tirA(3, 1), null);
verifie('Table A, écart +6, dé 1 : F', tirA(6, 1), 'F');

// Table B (transcription) : exemple du tour V (survivant F.C. 5 contre équipage F.C. Dif. 3, écart +2, dé 1)
verifie('Table B, écart +2, dé 1 : 0 (il ne l\'a pas touché)', tirB(2, 1), 0);
// Exemple du tour VI : 2 Sevolventes (F.C. 10) contre 2 équipages (F.C. Dif. 6), écart +4, perte annoncée : 2 hommes
verifie('Table B, écart +4, dé 4 : 2 hommes (tour VI)', tirB(4, 4), 2);
verifie('Table B, écart +4, dé 5 : 2 hommes (compatible tour VI)', tirB(4, 5), 2);

// Table G (transcription) : 2, 2, 3, 3, 4, 4
verifie('Table G, dé 1 : 2 points', pointsVeneration(1), 2);
verifie('Table G, dé 6 : 4 points', pointsVeneration(6), 4);

console.log(`\n${ok} OK, ${ko} écart(s)`);
process.exitCode = ko ? 1 : 0;

// ===== Atterrissage : zone et risque (tableaux O et P) =====
import { risqueAtterrissage, zoneDuDe, actionsPermises, determinerAtterrissage } from './regles.js';
verifie('O, planète G (masse 3), dé 2 : 2 dégâts', risqueAtterrissage('G', 2).degats, 2);
verifie('O, planète G (masse 3), dé 4 : aucun dégât', risqueAtterrissage('G', 4).degats, 0);
verifie('O, planète C (« — »), dé 1 : aucun dégât', risqueAtterrissage('C', 1).degats, 0);
verifie('P, dé 5 : Forêt', zoneDuDe(5).zone, 'Forêt');
verifie('P, dé 8 : choix de l\'U.C.', zoneDuDe(8).choixUC, true);
verifie('P, dé 0 (= 10) : choix de l\'U.C.', zoneDuDe(0).choixUC, true);
const attente = { atterrissagePrevu: true, risque: null, zone: null };
verifie('Gate : sans zone ni risque, seule l\'action de détermination est permise', actionsPermises(attente)[0], 'determiner_zone_et_risque');
const fait = determinerAtterrissage(attente, { typePlanete: 'G', de6: 2, de10: 5 });
verifie('Gate : après détermination, les autres actions sont permises', actionsPermises(fait)[0], 'toutes');
const choix = determinerAtterrissage(attente, { typePlanete: 'G', de6: 4, de10: 8, choixZone: 'Marais' });
verifie('Dé 8 : la zone choisie par l\'U.C. est retenue', choix.zone, 'Marais');

// ===== Tableaux des missions : cellules tirées de la transcription =====
import { elementTouche, tirD, tirE, tirF, pointsCommerceInterne, pointsCommerceExterne, tirL, tirLInterne } from './regles.js';
// A (corrigé)
verifie('A, écart −2, dé 4 : F (transcription, ligne 4)', tirA(-2, 4), 'F');
verifie('A, écart −3, dé 5 : F (transcription, ligne 5)', tirA(-3, 5), 'F');
verifie('A, écart −4, dé 6 : F (transcription, ligne 6)', tirA(-4, 6), 'F');
verifie('A, écart 0, dé 6 : U', tirA(0, 6), 'U');
verifie('A, écart +3, dé 5 : U', tirA(3, 5), 'U');
// C
verifie('C, dé 1 : bouclier', elementTouche(1), 'bouclier');
verifie('C, dé 6 : coque', elementTouche(6), 'coque');
// D (capture)
verifie('D, écart +1, dé 1 : aucun', tirD(1, 1), 'aucun');
verifie('D, écart −4, dé 1 : non (attaque)', tirD(-4, 1), 'non');
verifie('D, écart 0, dé 4 : oui', tirD(0, 4), 'oui');
// E (alliance)
verifie('E, F. All. 4, dé 2 : oui', tirE(4, 2), 'oui');
verifie('E, F. All. 1, dé 1 : non', tirE(1, 1), 'non');
verifie('E, F. All. 2, dé 3 : oui', tirE(2, 3), 'oui');
// F (intimidation)
verifie('F, écart 0, dé 1 : non', tirF(0, 1), 'non');
verifie('F, écart +6, dé 1 : aucun', tirF(6, 1), 'aucun');
verifie('F, écart +2, dé 4 : oui', tirF(2, 4), 'oui');
// H et I (commerce)
verifie('H, dé 1 : −2 points', pointsCommerceInterne(1), -2);
verifie('H, dé 6 : +3 points', pointsCommerceInterne(6), 3);
verifie('I, personnalité 0, dé 2 : aucun échange', pointsCommerceExterne(0, 2), null);
verifie('I, personnalité 3, dé 4 : 0 point', pointsCommerceExterne(3, 4), 0);
verifie('I, personnalité 5, dé 6 : +5 points', pointsCommerceExterne(5, 6), 5);
// L (Tot 100 %)
verifie('L, interne, dé 3 : non (colonne 3 : ▲)', tirLInterne(3), 'non');
verifie('L, interne, dé 4 : oui', tirLInterne(4), 'oui');
verifie('L, personnalité 4, dé 3 : oui', tirL(4, 3), 'oui');
