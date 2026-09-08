// Application : boucle à 4 Hz, rendu DOM, sauvegarde immédiate.
// Toute la logique de jeu est dans moteur.js ; ici on ne fait que l'afficher et relayer les clics.

import * as M from './moteur.js';

// ——— Options de développement (URL) ———
//   ?vitesse=10   accélère le temps (test du prototype)
//   ?graine=123   fixe le tirage
//   ?debug        affiche les mesures de saturation (§14)
const params = new URLSearchParams(location.search);
const VITESSE = Math.max(0.1, Number(params.get('vitesse')) || 1);
const DEBUG = params.has('debug');
const GRAINE = params.has('graine') ? Number(params.get('graine')) >>> 0 : undefined;

const $registre = document.getElementById('registre');
const $panneau = document.getElementById('panneau');
const $jeu = document.getElementById('jeu');
const $fin = document.getElementById('fin');
const $lecture = document.getElementById('lecture');

const fmtEntier = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const fmtDecimal = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nombre = (n) => fmtEntier.format(n);
const decimal = (n) => fmtDecimal.format(n);
const horodatage = (ms) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

// ——— État ———

let etat = M.charger();
if (!etat) etat = M.nouvelEtat(GRAINE);
let rng = M.creerRng(etat.graine);
let arme = null; // { cle, delai } — bouton « oublier » armé (deux clics, aucun retour en arrière)
let ecranCourant = null;

function sauver() {
  M.sauvegarder(etat);
}

// ——— Son : un seul clic, identique, à volume constant (§12) ———

let audio = null;
function clic() {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1800, t);
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + 0.03);
  } catch {
    /* pas de son disponible : le jeu continue sans */
  }
}

// ——— Bouton « oublier » à deux clics ———
// Ce n'est pas une confirmation qui rassure (R2) : c'est une garde contre le clic accidentel.
// Après le second clic, rien ne revient.

function boutonOublier(cle, action, libelle = 'oublier') {
  const b = document.createElement('button');
  b.className = 'oublier';
  b.type = 'button';
  const estArme = arme && arme.cle === cle;
  b.textContent = estArme ? 'sûr ?' : libelle;
  if (estArme) b.classList.add('arme');
  b.addEventListener('click', () => {
    if (arme && arme.cle === cle) {
      desarmer();
      clic();
      action();
      sauver();
      rendre();
    } else {
      armer(cle);
      rendre();
    }
  });
  return b;
}

function armer(cle) {
  desarmer();
  arme = { cle, delai: setTimeout(() => { arme = null; rendre(); }, 2500) };
}

function desarmer() {
  if (arme) clearTimeout(arme.delai);
  arme = null;
}

// ——— Rendu : le registre (gauche) ———

function el(tag, className, texte) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (texte != null) e.textContent = texte;
  return e;
}

function meta(cout, rendement, cle, action) {
  const m = el('div', 'meta');
  m.append(el('span', 'cout', `${cout}`));
  if (rendement != null) m.append(el('span', 'rendement', `${decimal(rendement)} A/s`));
  m.append(boutonOublier(cle, action));
  return m;
}

function rendreRegistre() {
  $registre.replaceChildren();
  const attente = etat.enAttente;

  if (etat.phrase) {
    const p = el('p', 'phrase');
    p.append(el('span', null, M.PHRASE_INITIALE));
    p.append(meta(M.COUT_PHRASE, null, 'phrase', () => M.oublierPhrase(etat)));
    $registre.append(p);
  }

  if (attente) {
    const a = el('div', 'arrivee');
    a.append(el('p', 'titre-bloc', 'Un souvenir arrive'));
    a.append(el('p', 'texte', attente.texte));
    const reste = M.libre(etat);
    a.append(el('p', 'place', `Il occupe ${attente.cout} unités. Il en reste ${reste}.`));
    const actions = el('div', 'actions');
    const ecarter = el('button', null, 'Écarter');
    ecarter.type = 'button';
    ecarter.addEventListener('click', () => {
      desarmer();
      M.ecarter(etat);
      sauver();
      rendre();
    });
    actions.append(ecarter, el('span', 'ou', 'ou oublier autre chose, ci-dessous'));
    a.append(actions);
    $registre.append(a);
  }

  if (etat.aide) {
    const b = el('div', 'bloc aide');
    const ligne = el('div', 'ligne-bloc');
    ligne.append(el('span', 'titre-bloc', 'Aide'), meta(M.COUT_AIDE, null, 'aide', () => M.oublierAide(etat)));
    b.append(ligne);
    for (const t of M.TEXTE_AIDE) b.append(el('p', null, t));
    $registre.append(b);
  }

  const liste = el('ol', 'liste');
  if (etat.entrees.length === 0) {
    $registre.append(el('p', 'vide', 'Rien encore.'));
  }
  const indexe = M.aOutil(etat, 'indexation');
  for (const e of etat.entrees) {
    const li = el('li', 'entree');
    li.append(el('p', 'texte', e.texte));
    li.append(meta(e.cout, M.rendementDe(etat, e), e.id, () => M.oublier(etat, e.id)));
    if (indexe) {
      const motifs = el('div', 'motifs');
      for (const m of e.motifs) motifs.append(el('span', null, m));
      li.append(motifs);
    }
    liste.append(li);
  }
  $registre.append(liste);

  if (etat.historique.length > 0) {
    const h = el('div', 'bloc historique');
    const ligne = el('div', 'ligne-bloc');
    ligne.append(
      el('span', 'titre-bloc', 'Historique'),
      meta(etat.historique.length, null, 'historique', () => M.oublierHistorique(etat)),
    );
    h.append(ligne);
    for (const l of etat.historique) h.append(el('p', null, l.texte));
    $registre.append(h);
  }
}

// ——— Rendu : le panneau (droite) ———

let $chiffres, $barre, $plein, $A, $debit, $journalLignes, $outilsBoutons;

function rendrePanneau() {
  $panneau.replaceChildren();

  const espace = el('div', 'espace');
  $chiffres = el('div', 'chiffres');
  $barre = el('div', 'barre');
  $plein = el('div', 'plein');
  $barre.append($plein);
  espace.append($chiffres, $barre, el('div', 'legende', 'Espace'));
  $panneau.append(espace);

  const assoc = el('div', 'assoc');
  $A = el('div', 'valeur');
  $debit = el('div', 'debit');
  assoc.append(el('p', 'etiquette', 'Associations'), $A, $debit);
  $panneau.append(assoc);

  $outilsBoutons = [];
  const disponibles = M.outilsDisponibles(etat);
  const pris = etat.outils.map((cle) => ({ cle, ...M.OUTILS[cle] }));
  if (disponibles.length > 0 || pris.length > 0) {
    const outils = el('div', 'outils');
    outils.append(el('p', 'etiquette', 'Outils'));
    for (const o of pris) {
      const d = el('div', 'outil');
      d.append(el('span', 'nom', o.nom), el('span', 'desc', o.description), el('span', 'pris', 'en place'));
      if (o.espace) d.append(el('span', 'cout', `${o.espace} unités occupées`));
      outils.append(d);
    }
    for (const o of disponibles) {
      const d = el('div', 'outil');
      const b = el('button', null, 'Acquérir');
      b.type = 'button';
      b.addEventListener('click', () => {
        const r = M.acheter(etat, o.cle);
        if (!r.ok) return;
        sauver();
        rendre();
      });
      d.append(
        el('span', 'nom', o.nom),
        el('span', 'desc', o.description),
        el('span', 'cout', `${nombre(o.coutA)} A${o.espace ? ` · ${o.espace} unités` : ''}`),
        b,
      );
      $outilsBoutons.push({ cle: o.cle, bouton: b });
      outils.append(d);
    }
    $panneau.append(outils);
  }

  const journal = el('div', 'journal');
  journal.append(el('p', 'etiquette', 'Journal'));
  $journalLignes = el('div', 'lignes');
  journal.append($journalLignes);
  $panneau.append(journal);

  const pied = el('div', 'pied');
  pied.append(el('span', null, `Acte ${etat.acte === 1 ? 'I' : 'II'} — ${M.ACTES[etat.acte].nom}`));
  const effacer = el('button', null, 'tout effacer');
  effacer.type = 'button';
  effacer.title = 'Détruire ce qui reste et recommencer.';
  effacer.addEventListener('click', () => {
    if (effacer.classList.contains('arme')) {
      M.effacerTout();
      location.href = location.pathname;
    } else {
      effacer.classList.add('arme');
      effacer.textContent = 'détruire ce qui reste ?';
      setTimeout(() => { effacer.classList.remove('arme'); effacer.textContent = 'tout effacer'; }, 3000);
    }
  });
  pied.append(effacer);
  $panneau.append(pied);

  rendreJournal();
  rafraichirCompteurs();
}

function rendreJournal() {
  $journalLignes.replaceChildren();
  for (const l of etat.journal) {
    const p = el('p');
    p.append(el('span', 't', horodatage(l.t)), document.createTextNode(l.texte));
    $journalLignes.append(p);
  }
  $journalLignes.scrollTop = $journalLignes.scrollHeight;
}

function rafraichirCompteurs() {
  if (!$chiffres) return;
  const occ = M.occupation(etat);
  $chiffres.replaceChildren(
    el('span', 'occ', nombre(occ)),
    el('span', 'cap', ` / ${nombre(etat.capacite)}`),
  );
  $plein.style.width = `${Math.min(100, (occ / etat.capacite) * 100)}%`;
  $A.textContent = nombre(Math.floor(etat.A));
  $debit.textContent = `${decimal(M.rendement(etat))} A/s`;
  for (const { cle, bouton } of $outilsBoutons) {
    const v = M.peutAcheter(etat, cle);
    bouton.disabled = !v.ok;
    bouton.title = v.ok ? '' : v.raison === 'espace' ? 'Pas assez de place.' : 'Pas assez d’associations.';
  }
  if (DEBUG) rendreDebug();
}

// ——— Fin (§11) : lire, ou fermer. Aucun décompte. ———

function rendreFin() {
  $fin.replaceChildren();
  $fin.append(el('p', null, 'Il n’arrive plus rien.'));
  $fin.append(el('p', null, 'Le prototype s’arrête ici.'));
  const actions = el('div', 'actions');
  const lire = el('button', null, 'Lire');
  lire.type = 'button';
  lire.addEventListener('click', () => { ecran('lecture'); });
  const fermer = el('button', null, 'Fermer');
  fermer.type = 'button';
  fermer.addEventListener('click', () => { window.close(); $fin.replaceChildren(el('p', null, 'Tu peux fermer cette page.')); });
  actions.append(lire, fermer);
  $fin.append(actions);
}

function rendreLecture() {
  $lecture.replaceChildren();
  const ordre = [...etat.entrees].sort((a, b) => a.arriveeMs - b.arriveeMs);
  if (etat.phrase) $lecture.append(el('p', null, M.PHRASE_INITIALE));
  for (const e of ordre) $lecture.append(el('p', null, e.texte));
  const fermer = el('button', 'fermer', 'Fermer');
  fermer.type = 'button';
  fermer.addEventListener('click', () => { ecran('fin'); });
  $lecture.append(fermer);
}

// ——— Debug (§14 : combien de temps sur le premier écran de choix ?) ———

let $debug;
function rendreDebug() {
  if (!$debug) {
    $debug = el('div', 'debug');
    document.body.append($debug);
  }
  const lignes = [`t=${horodatage(etat.temps)} ×${VITESSE} acte=${etat.acte} tirés=${etat.tires.length} liens=${M.nombreDeLiens(etat)} graine=${etat.graine}`];
  for (const s of etat.mesures.saturations) {
    lignes.push(`saturation ${s.n} (${s.id}, ${s.cout}u, libre ${s.libre}) : ${s.dureeMs == null ? 'en cours' : `${(s.dureeMs / 1000).toFixed(1)} s, ${s.decision}, ${s.oublis} oubli(s)`}`);
  }
  $debug.textContent = lignes.join('\n');
}

// ——— Écrans ———

function ecran(nom) {
  ecranCourant = nom;
  $jeu.hidden = nom !== 'jeu';
  $fin.hidden = nom !== 'fin';
  $lecture.hidden = nom !== 'lecture';
  if ($debug) $debug.hidden = nom !== 'jeu';
  if (nom === 'fin') rendreFin();
  if (nom === 'lecture') rendreLecture();
}

function rendre() {
  if (etat.termine) {
    if (ecranCourant === 'jeu' || ecranCourant === null) ecran('fin');
    return;
  }
  if (ecranCourant !== 'jeu') ecran('jeu');
  rendreRegistre();
  rendrePanneau();
}

// ——— Boucle : 4 Hz, seulement sous le regard (pas de hors-ligne) ———

let dernier = performance.now();
setInterval(() => {
  const maintenant = performance.now();
  const dtReel = Math.min(1000, maintenant - dernier);
  dernier = maintenant;
  if (document.hidden || etat.termine) return;

  const historiqueAvant = etat.historique.length;
  const evenements = M.tick(etat, dtReel * VITESSE, rng);
  const plein = evenements.length > 0 || etat.historique.length !== historiqueAvant;
  if (plein) {
    sauver();
    rendre();
  } else {
    rafraichirCompteurs();
  }
}, 250);

document.addEventListener('visibilitychange', () => { dernier = performance.now(); });

if (M.dejaJoue() && etat.tires.length === 0) {
  etat.journal.push({ t: 0, texte: 'tu as déjà joué. cette fois, sans découverte.' });
}
sauver();
rendre();
