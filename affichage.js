// VII Legio Solo — affichage (aucune règle ici : tout passe par regles.js).
import { coutRoute, autonomie, risqueAtterrissage, zoneDuDe, actionsPermises, ZONES,
  tirA, tirD, tirE, tirF, pointsCommerceInterne, tirLInterne, elementTouche } from './regles.js';

// Caractéristiques de démonstration (le cahier des charges : une seule valeur par partie)
const DEMO = { fcLegion: 6, fcExtra: 5, fAll: 2, personnalite: 3 };
const de6 = () => 1 + Math.floor(Math.random() * 6);

const etat = {
  segs: [], dir: 'N', n: 1,
  reservoirs: 3, parsecsParReservoir: 5, maxParsecs: 0,
  planeteRepere: false, typePlanete: 'G',
  atterrissagePrevu: false, boucliers: null,
  risque: null, zone: null, choixZoneEnAttente: false,
  fil: [], filNiveau: 'repos',
};
etat.maxParsecs = autonomie(etat.reservoirs, etat.parsecsParReservoir);

const $ = (id) => document.getElementById(id);
const DIRS = ['NO', 'N', 'NE', 'O', null, 'E', 'SO', 'S', 'SE'];

function log(who, texte) { etat.fil.push({ who, texte }); }

// ----- Route : une direction choisie s'ajoute tout de suite -----
function choisirDirection(d) {
  const cout = (d === 'HAUT' || d === 'BAS') ? 4 : etat.n;
  if (coutRoute(etat.segs) + cout > etat.maxParsecs) return;
  etat.segs.push({ dir: d, n: (d === 'HAUT' || d === 'BAS') ? 1 : etat.n });
  rendre();
}
function retirerSegment(i) { etat.segs.splice(i, 1); rendre(); }
function changerDistance(delta) {
  const restant = etat.maxParsecs - coutRoute(etat.segs);
  etat.n = Math.max(1, Math.min(restant, etat.n + delta));
  rendre();
}

function annoncerRoute() {
  const total = coutRoute(etat.segs);
  log('uc', 'Route : ' + etat.segs.map(s => s.n + ' ' + s.dir).join(' + ') + ` — ${total} parsecs.`);
  if (!etat.planeteRepere) {
    etat.planeteRepere = true;
    log('sc', `Planète repérée au ${Math.min(total, 3)}e parsec. Type ${etat.typePlanete}.`);
  } else {
    log('sc', 'Déplacement effectué.');
  }
  etat.segs = [];
  etat.n = 1;
  rendre();
}

// ----- Atterrissage : boucliers, puis zone et risque (verrou) -----
function demanderAtterrissage() {
  etat.atterrissagePrevu = true;
  log('uc', 'Route d’atterrissage.');
  log('sc', 'Décidez de l’état des boucliers avant tout autre ordre.');
  rendre();
}
function choisirBoucliers(actif) {
  etat.boucliers = actif;
  log('uc', actif ? 'Boucliers activés.' : 'Boucliers éteints.');
  // Tirages O et P, au moment de la décision des boucliers (règle du projet)
  const de6 = 1 + Math.floor(Math.random() * 6);
  const de10 = 1 + Math.floor(Math.random() * 10);
  etat.risque = risqueAtterrissage(etat.typePlanete, de6);
  const z = zoneDuDe(de10);
  log('sc', `Risque d’atterrissage : ${etat.risque.degats} dégât(s) (dé 6 = ${de6}).`);
  if (z.choixUC) {
    etat.zone = null; etat.choixZoneEnAttente = true;
    log('sc', 'Zone : à choisir par l’U.C. (dé 8, 9 ou 0).');
  } else {
    etat.zone = z.zone; etat.choixZoneEnAttente = false;
    log('sc', `Zone d’atterrissage : ${z.zone}.`);
  }
  rendre();
}
function choisirZone(z) {
  etat.zone = z; etat.choixZoneEnAttente = false;
  log('uc', `Zone choisie : ${z}.`);
  rendre();
}

// ----- Rendu -----
function rendre() {
  const restant = etat.maxParsecs - coutRoute(etat.segs);
  $('pts').textContent = '0 pts';
  $('boutons-dir').innerHTML = DIRS.map(d => d === null
    ? '<span class="centre">vaisseau</span>'
    : `<button onclick="window.choisirDirection('${d}')">${d}</button>`).join('') +
    `<button onclick="window.choisirDirection('HAUT')">▲ HAUT (4)</button><button onclick="window.choisirDirection('BAS')">▼ BAS (4)</button>`;
  $('segments').innerHTML = etat.segs.map((s, i) =>
    `<span class="seg" onclick="window.retirerSegment(${i})">${s.n} ${s.dir} ×</span>`).join('');
  $('total').textContent = `${coutRoute(etat.segs)} / ${etat.maxParsecs} parsecs`;
  $('distance').textContent = etat.n;
  $('annoncer').disabled = etat.segs.length === 0;

  const perm = actionsPermises({ atterrissagePrevu: etat.atterrissagePrevu, risque: etat.risque, zone: etat.zone });
  const verrou = perm[0] !== 'toutes';
  $('verrou').style.display = verrou ? 'block' : 'none';
  $('zones').innerHTML = etat.choixZoneEnAttente
    ? Object.values(ZONES).map(z => `<button onclick="window.choisirZone('${z}')">${z}</button>`).join('') : '';
  $('boucliers').style.display = (etat.atterrissagePrevu && etat.boucliers === null) ? 'block' : 'none';
  $('mission').style.display = (!verrou && etat.atterrissagePrevu && etat.zone) ? 'block' : 'none';
  $('mission-resultats').innerHTML = etat.resultatMission ? `<p>${etat.resultatMission}</p>` : '';
  $('atterrir').disabled = !etat.planeteRepere || etat.atterrissagePrevu;

  $('fil').className = etat.filNiveau;
  $('fil-corps').innerHTML = etat.fil.slice().reverse().map(m =>
    `<div class="msg ${m.who}">${m.texte}</div>`).join('');
  $('fil-badge').textContent = etat.fil.length;
}
function basculerFil() { etat.filNiveau = etat.filNiveau === 'repos' ? 'mi' : 'repos'; rendre(); }

// ----- Missions : chaque mission lit son tableau (regles.js) -----
// Les effets (points, pertes, dégâts) seront branchés à l'étape suivante.
function mission(nom) {
  const d = de6();
  let texte;
  if (nom === 'elim') {
    const r = tirA(DEMO.fcLegion - DEMO.fcExtra, d);
    texte = r === 'U' ? 'Extrasolaire tué.' : r === 'F' ? 'Extrasolaire blessé (50 % de son F.C.).' : 'Aucun effet.';
  } else if (nom === 'capture') {
    const r = tirD(DEMO.fcLegion - DEMO.fcExtra, d);
    texte = r === 'oui' ? 'Capture réussie.' : r === 'aucun' ? 'Capture nulle.' : 'Non : l’Extrasolaire attaque immédiatement (tableau B).';
  } else if (nom === 'alliance') {
    const r = tirE(DEMO.fAll, d);
    texte = r === 'oui' ? 'Alliance conclue.' : r === 'aucun' ? 'Rien ne se passe ; nouvel essai possible.' : 'Non : l’Extrasolaire attaque.';
  } else if (nom === 'intim') {
    const r = tirF(DEMO.fcLegion - DEMO.fcExtra, d);
    texte = r === 'oui' ? 'Intimidation réussie : tableau G pour la vénération.' : r === 'aucun' ? 'Rien ; nouvelle tentative possible.' : 'Non : contre-attaque réelle.';
  } else if (nom === 'commerce') {
    const p = pointsCommerceInterne(d);
    texte = `Échange : ${p > 0 ? '+' : ''}${p} point(s)${p < 0 ? ` (${-p} dégât(s), tableau C)` : ''}.`;
  } else if (nom === 'tot') {
    const r = tirLInterne(d);
    texte = r === 'oui' ? 'Tir de Tot 100 % autorisé : la planète disparaît.' : 'Tir refusé : scrupules de l’U.C.';
  }
  etat.resultatMission = texte;
  log('sc', texte);
  rendre();
}

// Exposition pour les boutons inline
Object.assign(window, { mission, choisirDirection, retirerSegment, changerDistance, annoncerRoute,
  demanderAtterrissage, choisirBoucliers, choisirZone, basculerFil });

log('sc', 'Vaisseau à la base. Votre route, Décurion ?');

rendre();
