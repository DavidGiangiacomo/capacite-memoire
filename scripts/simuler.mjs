// Simulateur d'équilibrage : joue des parties entières sans interface, avec le vrai moteur.
//
//   npm run simuler
//   node scripts/simuler.mjs --graines 1,42,2024 --hesitation 5
//
// Chaque partie suit une stratégie de joueur fixe. Le joueur simulé hésite un temps
// donné à chaque choix, puis décide. Il achète chaque outil dès que possible et, pour
// l'Indexation, libère les 120 unités nécessaires en oubliant le moins rentable.
//
// Les fonctions sont exportées pour test/equilibrage.test.mjs.

import { pathToFileURL } from 'node:url';
import * as M from '../src/moteur.js';

export const GRAINES = [1, 42, 2024, 7, 99];
export const PAS_MS = 250; // 4 Hz, comme le jeu
export const HESITATION_MS = 10_000;

/** Le souvenir retenu qui rapporte le moins par unité occupée. */
function moinsRentable(etat) {
  let pire = null;
  let pireRatio = Infinity;
  for (const e of etat.entrees) {
    const ratio = M.rendementDe(etat, e) / e.cout;
    if (ratio < pireRatio) {
      pire = e;
      pireRatio = ratio;
    }
  }
  return pire;
}

function plusGros(etat) {
  let gros = null;
  for (const e of etat.entrees) if (!gros || e.cout > gros.cout) gros = e;
  return gros;
}

/** Oublie un souvenir après l'autre, choisi par `choisir`, jusqu'à ce que le souvenir en attente tienne. */
function oublierJusquaPlace(etat, choisir) {
  while (etat.enAttente && etat.entrees.length > 0) M.oublier(etat, choisir(etat).id);
}

export const STRATEGIES = {
  'moins-rentable': {
    description: 'oublie le souvenir qui rapporte le moins par unité',
    decider: (etat) => oublierJusquaPlace(etat, moinsRentable),
  },
  'plus-gros': {
    description: 'oublie le souvenir le plus gros',
    decider: (etat) => oublierJusquaPlace(etat, plusGros),
  },
  ecarter: {
    description: 'écarte toujours le souvenir qui arrive',
    decider: (etat) => M.ecarter(etat),
  },
};

function acheterSiPossible(etat, temps) {
  if (etat.enAttente) return;
  const index = M.OUTILS.indexation;
  if (temps.indexation == null && etat.acte >= index.acte && etat.A >= index.coutA) {
    while (M.libre(etat) < index.espace && etat.entrees.length > 0) M.oublier(etat, moinsRentable(etat).id);
    if (M.acheter(etat, 'indexation').ok) temps.indexation = etat.temps;
  }
  if (temps.extension == null && M.acheter(etat, 'extension').ok) temps.extension = etat.temps;
}

/**
 * Joue une partie jusqu'à la fin du corpus.
 * Renvoie les moments clés en ms de jeu (hésitations comprises) et les comptes de la partie.
 */
export function simulerPartie({ graine, strategie = 'moins-rentable', hesitationMs = HESITATION_MS, pasMs = PAS_MS } = {}) {
  const decider = STRATEGIES[strategie]?.decider;
  if (!decider) throw new Error(`stratégie inconnue : ${strategie}`);

  const etat = M.nouvelEtat(graine);
  const rng = M.creerRng(graine);
  const temps = { premiereSaturation: null, indexation: null, extension: null };
  let restantsALaPremiereSaturation = null;
  let depassementMax = -Infinity; // occupation − capacité, ne doit jamais être positif

  for (let i = 0; i < 1_000_000 && !etat.termine; i++) {
    const evenements = M.tick(etat, pasMs, rng);
    if (temps.premiereSaturation == null && evenements.some((e) => e.type === 'saturation')) {
      temps.premiereSaturation = etat.temps;
      restantsALaPremiereSaturation = M.souvenirsRestants(etat).length;
    }
    acheterSiPossible(etat, temps);
    if (etat.enAttente && etat.temps - etat.enAttente.depuisMs >= hesitationMs) decider(etat);
    depassementMax = Math.max(depassementMax, M.occupation(etat) - etat.capacite);
  }

  const saturations = etat.mesures.saturations;
  return {
    graine,
    strategie,
    termine: etat.termine,
    premiereSaturationMs: temps.premiereSaturation,
    restantsALaPremiereSaturation,
    indexationMs: temps.indexation,
    extensionMs: temps.extension,
    finMs: etat.temps,
    choix: saturations.length,
    oublis: etat.journal.length,
    ecarts: saturations.filter((s) => s.decision === 'ecart').length,
    retenus: etat.entrees.length,
    occupation: M.occupation(etat),
    capacite: etat.capacite,
    depassementMax,
  };
}

/** Toutes les parties : chaque stratégie sur chaque graine. */
export function simulerTout({ graines = GRAINES, strategies = Object.keys(STRATEGIES), hesitationMs = HESITATION_MS } = {}) {
  const parties = [];
  for (const strategie of strategies) {
    for (const graine of graines) parties.push(simulerPartie({ graine, strategie, hesitationMs }));
  }
  return parties;
}

// ——— Sortie en ligne de commande ———

const minutes = (ms) => (ms == null ? 'jamais' : (ms / 60_000).toFixed(1).replace('.', ','));

function fourchette(valeurs, format = String) {
  if (valeurs.some((v) => v == null)) {
    const connues = valeurs.filter((v) => v != null);
    return connues.length ? `${fourchette(connues, format)} ou jamais` : 'jamais';
  }
  const min = Math.min(...valeurs);
  const max = Math.max(...valeurs);
  return min === max ? format(min) : `${format(min)} à ${format(max)}`;
}

function tableau(entetes, lignes) {
  const largeurs = entetes.map((e, i) => Math.max(e.length, ...lignes.map((l) => String(l[i]).length)));
  const ligne = (cells) => cells.map((c, i) => String(c).padEnd(largeurs[i])).join('  ');
  return [ligne(entetes), largeurs.map((l) => '-'.repeat(l)).join('  '), ...lignes.map(ligne)].join('\n');
}

function lireArguments(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    const [cle, valeurEnLigne] = argv[i].replace(/^--/, '').split('=');
    const valeur = valeurEnLigne ?? argv[++i];
    if (cle === 'graines') options.graines = valeur.split(',').map(Number);
    else if (cle === 'hesitation') options.hesitationMs = Number(valeur) * 1000;
    else if (cle === 'strategie') options.strategies = valeur.split(',');
    else throw new Error(`option inconnue : --${cle}`);
  }
  return options;
}

function principal() {
  const options = lireArguments(process.argv.slice(2));
  const parties = simulerTout(options);

  console.log(`Hésitation simulée à chaque choix : ${(options.hesitationMs ?? HESITATION_MS) / 1000} s. Temps en minutes de jeu, hésitations comprises.\n`);
  console.log(
    tableau(
      ['stratégie', 'graine', '1re saturation', 'Indexation', 'Extension', 'fin', 'choix', 'oublis', 'écarts', 'retenus', 'occupation'],
      parties.map((p) => [
        p.strategie,
        p.graine,
        minutes(p.premiereSaturationMs),
        minutes(p.indexationMs),
        minutes(p.extensionMs),
        minutes(p.finMs),
        p.choix,
        p.oublis,
        p.ecarts,
        p.retenus,
        `${p.occupation} / ${p.capacite}`,
      ]),
    ),
  );

  console.log('\nRésumé par stratégie\n');
  const resume = Object.keys(STRATEGIES)
    .map((s) => [s, parties.filter((p) => p.strategie === s)])
    .filter(([, ps]) => ps.length > 0)
    .map(([s, ps]) => [
      s,
      fourchette(ps.map((p) => p.premiereSaturationMs), minutes),
      fourchette(ps.map((p) => p.indexationMs), minutes),
      fourchette(ps.map((p) => p.extensionMs), minutes),
      fourchette(ps.map((p) => p.finMs), minutes),
      fourchette(ps.map((p) => p.choix)),
    ]);
  console.log(tableau(['stratégie', '1re saturation', 'Indexation', 'Extension', 'fin', 'choix forcés'], resume));

  const depasse = parties.filter((p) => p.depassementMax > 0);
  if (depasse.length > 0) {
    console.log(`\nATTENTION : l'occupation a dépassé la capacité dans ${depasse.length} partie(s).`);
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) principal();
