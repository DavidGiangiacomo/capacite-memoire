// Moteur du jeu — logique pure, sans DOM. Testable en Node.
//
// État (§15) : { capacite, entrees[], outils[], A, journal[] } plus ce qu'il faut
// pour la sauvegarde (ids bannis, tirages, historique, mesures).
//
// Règles portées ici :
//  - tout occupe de la place (souvenirs, phrase initiale, aide, historique, outils) ;
//  - oublier retire l'entrée du tableau : le texte n'existe plus nulle part ;
//  - le jeu ne supprime jamais rien de lui-même.

import { CORPUS, estLong } from './corpus.js';

export const VERSION_SAUVEGARDE = 1;

export const PHRASE_INITIALE = 'garde ce qui compte';
export const COUT_PHRASE = 12;
export const COUT_AIDE = 60;
export const TRANCHE_HISTORIQUE = 5; // lignes retirées par « oublier une tranche »

export const CAPACITE_INITIALE = 512;
export const CAPACITE_ETENDUE = 768;

// Rendement (§6) : A/s = Σ souvenirs × 0,3 + Σ liens × 2,4
export const RENDEMENT_SOUVENIR = 0.3;
export const RENDEMENT_LIEN = 2.4;
export const BONUS_LIENS_INDEXATION = 1.2; // +20 % liens

// Cadence d'arrivée par acte (§9). Le MVP ne couvre que les actes I et II.
export const ACTES = {
  1: { nom: 'Le registre', intervalleMs: 25_000 },
  2: { nom: 'Le tri', intervalleMs: 9_000 },
};
export const TIRAGES_AVANT_ACTE_2 = 12;

// Outils (§7). Comme dans le doc, l'Indexation est le premier vrai upgrade ;
// l'Extension vient après. Les coûts en A sont calibrés sur ce corpus de 40 souvenirs
// (voir test/moteur.test.mjs, « équilibrage ») pour que l'Indexation soit abordable
// autour de la première saturation, et l'Extension après plusieurs oublis.
export const OUTILS = {
  indexation: {
    nom: 'Indexation',
    description: 'Rend les motifs visibles. Les liens produisent 20 % de plus. Occupe 120 unités en permanence.',
    coutA: 6_000,
    espace: 120,
    acte: 2,
  },
  extension: {
    nom: 'Extension',
    description: `La capacité passe de ${CAPACITE_INITIALE} à ${CAPACITE_ETENDUE}.`,
    coutA: 10_000,
    espace: 0,
    acte: 2,
  },
};

export const TEXTE_AIDE = [
  'Tout occupe de la place : les souvenirs, cette aide, la phrase du début, l’historique, les outils.',
  'Oublier libère de la place et supprime réellement le texte. Il ne revient pas.',
  'Le jeu ne supprime jamais rien de lui-même.',
  'Ce qui est retenu produit des associations. Deux souvenirs qui se ressemblent produisent plus que deux souvenirs isolés.',
];

// ——— Générateur pseudo-aléatoire (mulberry32), pour que la sauvegarde reste déterministe ———

export function creerRng(graine) {
  let a = graine >>> 0;
  return {
    suivant() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    get graine() {
      return a;
    },
  };
}

// ——— État ———

export function nouvelEtat(graine = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0) {
  return {
    version: VERSION_SAUVEGARDE,
    graine,
    capacite: CAPACITE_INITIALE,
    entrees: [], // { id, texte, cout, motifs, arriveeMs }
    outils: [],
    A: 0,
    journal: [], // { t, texte } — une ligne par suppression, identique pour tous les cas (I4)
    bannis: [], // ids qui ne peuvent plus jamais être tirés
    tires: [], // ids tirés, dans l'ordre
    phrase: true,
    aide: true,
    historique: [], // { t, texte } — croît de 1 par minute
    acte: 1,
    temps: 0, // ms de jeu écoulées sous le regard du joueur
    prochaineArriveeMs: ACTES[1].intervalleMs,
    prochaineLigneHistoriqueMs: 60_000,
    enAttente: null, // souvenir arrivé sans place : { id, texte, cout, motifs, depuisMs }
    mesures: { saturations: [] }, // le test falsifiable du §14
    termine: false,
  };
}

// ——— Lectures ———

export function aOutil(etat, cle) {
  return etat.outils.includes(cle);
}

export function occupation(etat) {
  let total = 0;
  for (const e of etat.entrees) total += e.cout;
  if (etat.phrase) total += COUT_PHRASE;
  if (etat.aide) total += COUT_AIDE;
  total += etat.historique.length;
  for (const cle of etat.outils) total += OUTILS[cle].espace;
  return total;
}

export function libre(etat) {
  return etat.capacite - occupation(etat);
}

export function partagentUnMotif(a, b) {
  for (const m of a.motifs) if (b.motifs.includes(m)) return true;
  return false;
}

/** Liens d'une entrée : les autres entrées retenues qui partagent au moins un motif. */
export function liensDe(etat, entree) {
  return etat.entrees.filter((autre) => autre.id !== entree.id && partagentUnMotif(entree, autre));
}

/** Nombre total de liens (paires non ordonnées). */
export function nombreDeLiens(etat) {
  let n = 0;
  const es = etat.entrees;
  for (let i = 0; i < es.length; i++) {
    for (let j = i + 1; j < es.length; j++) {
      if (partagentUnMotif(es[i], es[j])) n++;
    }
  }
  return n;
}

export function facteurLiens(etat) {
  return aOutil(etat, 'indexation') ? BONUS_LIENS_INDEXATION : 1;
}

/** Rendement global en A/s (§6). */
export function rendement(etat) {
  return etat.entrees.length * RENDEMENT_SOUVENIR + nombreDeLiens(etat) * RENDEMENT_LIEN * facteurLiens(etat);
}

/** Rendement d'une entrée : sa part propre + la moitié de chacun de ses liens. */
export function rendementDe(etat, entree) {
  return RENDEMENT_SOUVENIR + liensDe(etat, entree).length * (RENDEMENT_LIEN / 2) * facteurLiens(etat);
}

export function souvenirsRestants(etat) {
  const exclus = new Set([...etat.tires, ...etat.bannis]);
  return CORPUS.filter((s) => !exclus.has(s.id));
}

export function outilsDisponibles(etat) {
  return Object.entries(OUTILS)
    .filter(([cle, o]) => o.acte <= etat.acte && !aOutil(etat, cle))
    .map(([cle, o]) => ({ cle, ...o }));
}

// ——— Journal (I4 : la ligne est identique pour tous les cas) ———

function ligneJournal(etat, unites) {
  etat.journal.push({ t: etat.temps, texte: `oublié · ${unites} ${unites > 1 ? 'unités' : 'unité'}` });
}

// ——— Tirage ———

function tirer(etat, rng) {
  let candidats = souvenirsRestants(etat);
  if (etat.acte < 2) candidats = candidats.filter((s) => !estLong(s));
  if (candidats.length === 0) return null;
  const i = Math.floor(rng.suivant() * candidats.length);
  return candidats[i];
}

function retenir(etat, souvenir) {
  etat.entrees.push({
    id: souvenir.id,
    texte: souvenir.texte,
    cout: souvenir.cout,
    motifs: [...souvenir.motifs],
    arriveeMs: etat.temps,
  });
}

function intervalleArrivee(etat, rng) {
  const base = ACTES[etat.acte].intervalleMs;
  return Math.round(base * (0.8 + 0.4 * rng.suivant()));
}

function clore(etat) {
  etat.termine = true;
}

/** Après un changement d'espace : si un souvenir attendait et qu'il tient, il est retenu. */
function reessayerAttente(etat, decision) {
  if (!etat.enAttente) return null;
  if (libre(etat) < etat.enAttente.cout) return null;
  const s = etat.enAttente;
  etat.enAttente = null;
  retenir(etat, s);
  terminerMesure(etat, decision);
  if (souvenirsRestants(etat).length === 0) clore(etat);
  return { type: 'retenu', id: s.id };
}

function terminerMesure(etat, decision) {
  const m = etat.mesures.saturations.at(-1);
  if (m && m.finMs == null) {
    m.finMs = etat.temps;
    m.dureeMs = m.finMs - m.debutMs;
    m.decision = decision;
  }
}

// ——— Tick (4 Hz suffit, §15) ———

export function tick(etat, dtMs, rng = creerRng(etat.graine)) {
  const evenements = [];
  if (etat.termine) return evenements;

  etat.temps += dtMs;

  if (etat.enAttente) {
    // Pendant le choix, le temps du jeu s'arrête : rien n'est produit, rien n'arrive.
    // Seule la durée de l'hésitation est mesurée (§14). Hésiter ne rapporte rien.
    etat.prochaineLigneHistoriqueMs += dtMs;
    return evenements;
  }

  etat.A += (rendement(etat) * dtMs) / 1000;

  if (etat.temps >= etat.prochaineLigneHistoriqueMs) {
    const minute = Math.round(etat.prochaineLigneHistoriqueMs / 60_000);
    // Tout ce qui entre doit tenir : sans place, la ligne n'est pas écrite.
    if (libre(etat) >= 1) {
      etat.historique.push({
        t: etat.temps,
        texte: `min ${minute} — ${etat.entrees.length} retenus, ${occupation(etat)} / ${etat.capacite}`,
      });
    }
    etat.prochaineLigneHistoriqueMs += 60_000;
  }

  etat.prochaineArriveeMs -= dtMs;
  if (etat.prochaineArriveeMs > 0) return evenements;

  const souvenir = tirer(etat, rng);
  if (!souvenir) {
    clore(etat);
    evenements.push({ type: 'fin' });
    return evenements;
  }

  etat.tires.push(souvenir.id);
  if (etat.acte < 2 && etat.tires.length >= TIRAGES_AVANT_ACTE_2) {
    etat.acte = 2;
    evenements.push({ type: 'acte', acte: 2 });
  }
  etat.prochaineArriveeMs = intervalleArrivee(etat, rng);
  etat.graine = rng.graine;

  if (libre(etat) >= souvenir.cout) {
    retenir(etat, souvenir);
    evenements.push({ type: 'retenu', id: souvenir.id });
    if (souvenirsRestants(etat).length === 0) {
      clore(etat);
      evenements.push({ type: 'fin' });
    }
  } else {
    etat.enAttente = { ...souvenir, motifs: [...souvenir.motifs], depuisMs: etat.temps };
    etat.mesures.saturations.push({
      n: etat.mesures.saturations.length + 1,
      id: souvenir.id,
      cout: souvenir.cout,
      libre: libre(etat),
      debutMs: etat.temps,
      finMs: null,
      dureeMs: null,
      decision: null,
      oublis: 0,
    });
    evenements.push({ type: 'saturation', id: souvenir.id });
  }
  return evenements;
}

// ——— Actions du joueur ———

function compterOubli(etat) {
  const m = etat.mesures.saturations.at(-1);
  if (etat.enAttente && m && m.finMs == null) m.oublis++;
}

/** Oublier un souvenir. Irréversible : il quitte le tableau, son id est banni. */
export function oublier(etat, id) {
  const i = etat.entrees.findIndex((e) => e.id === id);
  if (i < 0) return null;
  const [e] = etat.entrees.splice(i, 1);
  etat.bannis.push(e.id);
  ligneJournal(etat, e.cout);
  compterOubli(etat);
  const suite = reessayerAttente(etat, 'oubli');
  return { type: 'oublie', unites: e.cout, suite };
}

export function oublierPhrase(etat) {
  if (!etat.phrase) return null;
  etat.phrase = false;
  ligneJournal(etat, COUT_PHRASE);
  compterOubli(etat);
  return { type: 'oublie', unites: COUT_PHRASE, suite: reessayerAttente(etat, 'oubli') };
}

export function oublierAide(etat) {
  if (!etat.aide) return null;
  etat.aide = false;
  ligneJournal(etat, COUT_AIDE);
  compterOubli(etat);
  return { type: 'oublie', unites: COUT_AIDE, suite: reessayerAttente(etat, 'oubli') };
}

export function oublierHistorique(etat, n = TRANCHE_HISTORIQUE) {
  if (etat.historique.length === 0) return null;
  const retire = etat.historique.splice(0, Math.min(n, etat.historique.length)).length;
  ligneJournal(etat, retire);
  compterOubli(etat);
  return { type: 'oublie', unites: retire, suite: reessayerAttente(etat, 'oubli') };
}

/** Écarter le souvenir qui attend : il n'entre pas et ne reviendra pas. */
export function ecarter(etat) {
  if (!etat.enAttente) return null;
  const s = etat.enAttente;
  etat.enAttente = null;
  etat.bannis.push(s.id);
  terminerMesure(etat, 'ecart');
  if (souvenirsRestants(etat).length === 0) clore(etat);
  return { type: 'ecarte', id: s.id };
}

export function peutAcheter(etat, cle) {
  const o = OUTILS[cle];
  if (!o || aOutil(etat, cle) || o.acte > etat.acte) return { ok: false, raison: 'indisponible' };
  if (etat.enAttente) return { ok: false, raison: 'attente' }; // il faut choisir : écarter, ou oublier
  if (etat.A < o.coutA) return { ok: false, raison: 'associations' };
  if (o.espace > 0 && libre(etat) < o.espace) return { ok: false, raison: 'espace' };
  return { ok: true };
}

export function acheter(etat, cle) {
  const verdict = peutAcheter(etat, cle);
  if (!verdict.ok) return verdict;
  const o = OUTILS[cle];
  etat.A -= o.coutA;
  etat.outils.push(cle);
  if (cle === 'extension') etat.capacite = CAPACITE_ETENDUE;
  return { ok: true };
}

// ——— Sauvegarde (R5 : unique, écrasée, offusquée — pas de conception défensive au-delà) ———

const CLE_SAUVEGARDE = 'capacite-memoire';
const CLE_DEJA_JOUE = 'capacite-memoire.deja-joue';

function encoder(texte) {
  if (typeof btoa === 'function') return btoa(unescape(encodeURIComponent(texte)));
  return Buffer.from(texte, 'utf8').toString('base64');
}

function decoder(b64) {
  if (typeof atob === 'function') return decodeURIComponent(escape(atob(b64)));
  return Buffer.from(b64, 'base64').toString('utf8');
}

export function serialiser(etat) {
  return encoder(JSON.stringify(etat));
}

export function deserialiser(chaine) {
  const etat = JSON.parse(decoder(chaine));
  if (etat.version !== VERSION_SAUVEGARDE) throw new Error('version de sauvegarde inconnue');
  return etat;
}

export function sauvegarder(etat, stockage = globalThis.localStorage) {
  if (!stockage) return;
  stockage.setItem(CLE_SAUVEGARDE, serialiser(etat));
}

export function charger(stockage = globalThis.localStorage) {
  if (!stockage) return null;
  const brut = stockage.getItem(CLE_SAUVEGARDE);
  if (!brut) return null;
  try {
    return deserialiser(brut);
  } catch {
    return null;
  }
}

/** Effacement complet : détruire ce qui reste. Le jeu se souvient seulement qu'on a déjà joué. */
export function effacerTout(stockage = globalThis.localStorage) {
  if (!stockage) return;
  stockage.removeItem(CLE_SAUVEGARDE);
  stockage.setItem(CLE_DEJA_JOUE, '1');
}

export function dejaJoue(stockage = globalThis.localStorage) {
  return !!stockage && stockage.getItem(CLE_DEJA_JOUE) === '1';
}
