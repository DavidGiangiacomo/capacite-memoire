import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/moteur.js';
import { CORPUS, estLong, parId } from '../src/corpus.js';

function stockageMemoire() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

function entree(id) {
  const s = parId(id);
  return { ...s, motifs: [...s.motifs], arriveeMs: 0 };
}

/** Fait tourner le jeu jusqu'à un événement donné (ou la fin). */
function jusquA(etat, rng, type, maxTicks = 100_000) {
  for (let i = 0; i < maxTicks && !etat.termine; i++) {
    const evs = M.tick(etat, 250, rng);
    const ev = evs.find((e) => e.type === type);
    if (ev) return ev;
  }
  return null;
}

// ——— Corpus ———

test('le corpus compte 40 souvenirs, 24 courts et 16 longs, dans les fourchettes du doc', () => {
  assert.equal(CORPUS.length, 40);
  const courts = CORPUS.filter((s) => !estLong(s));
  const longs = CORPUS.filter(estLong);
  assert.equal(courts.length, 24);
  assert.equal(longs.length, 16);
  for (const s of courts) assert.ok(s.cout >= 4 && s.cout <= 9, s.id);
  for (const s of longs) assert.ok(s.cout >= 18 && s.cout <= 40, s.id);
});

test('chaque souvenir a un id unique, un texte, et 2 à 4 motifs', () => {
  const ids = new Set(CORPUS.map((s) => s.id));
  assert.equal(ids.size, CORPUS.length);
  for (const s of CORPUS) {
    assert.ok(s.texte.length > 20, s.id);
    assert.ok(s.motifs.length >= 2 && s.motifs.length <= 4, s.id);
  }
});

test('le corpus ne tient pas en entier, même avec Extension et Indexation (I5)', () => {
  const total = CORPUS.reduce((a, s) => a + s.cout, 0) + M.COUT_PHRASE + M.COUT_AIDE;
  assert.ok(total > M.CAPACITE_ETENDUE - M.OUTILS.indexation.espace);
});

// ——— Espace ———

test('tout occupe de la place : phrase, aide, historique, outils, souvenirs', () => {
  const etat = M.nouvelEtat(1);
  assert.equal(M.occupation(etat), M.COUT_PHRASE + M.COUT_AIDE);
  etat.entrees.push(entree('regle-fer'));
  etat.historique.push({ t: 0, texte: 'x' }, { t: 0, texte: 'y' });
  etat.outils.push('indexation');
  assert.equal(M.occupation(etat), M.COUT_PHRASE + M.COUT_AIDE + 8 + 2 + 120);
  assert.equal(M.libre(etat), 512 - M.occupation(etat));
});

// ——— Réseau ———

test('deux souvenirs partageant un motif forment un lien ; le rendement suit la formule du §6', () => {
  const etat = M.nouvelEtat(1);
  etat.entrees.push(entree('regle-fer'), entree('colle-a-bois'), entree('sel-cheveux'));
  // regle-fer (père, atelier) ↔ colle-a-bois (odeur, atelier) : un lien ; sel-cheveux isolé
  assert.equal(M.nombreDeLiens(etat), 1);
  assert.equal(M.rendement(etat), 3 * 0.3 + 1 * 2.4);
  assert.equal(M.rendementDe(etat, etat.entrees[2]), 0.3);
  assert.equal(M.rendementDe(etat, etat.entrees[0]), 0.3 + 1.2);
  // la somme des rendements individuels vaut le rendement global
  const somme = etat.entrees.reduce((a, e) => a + M.rendementDe(etat, e), 0);
  assert.ok(Math.abs(somme - M.rendement(etat)) < 1e-9);
});

test('supprimer un souvenir détruit tous ses liens', () => {
  const etat = M.nouvelEtat(1);
  etat.entrees.push(entree('regle-fer'), entree('colle-a-bois'), entree('tas-de-copeaux'));
  assert.equal(M.nombreDeLiens(etat), 3);
  M.oublier(etat, 'tas-de-copeaux');
  assert.equal(M.nombreDeLiens(etat), 1);
});

test("l'Indexation augmente les liens de 20 %", () => {
  const etat = M.nouvelEtat(1);
  etat.entrees.push(entree('regle-fer'), entree('colle-a-bois'));
  const avant = M.rendement(etat);
  etat.outils.push('indexation');
  assert.ok(Math.abs(M.rendement(etat) - (2 * 0.3 + 2.4 * 1.2)) < 1e-9);
  assert.ok(M.rendement(etat) > avant);
});

// ——— Arrivées et saturation ———

test("un souvenir est retenu s'il y a de la place, sinon il attend une décision", () => {
  const etat = M.nouvelEtat(1);
  const rng = M.creerRng(1);
  const ev = jusquA(etat, rng, 'retenu');
  assert.equal(ev.type, 'retenu');
  assert.equal(etat.entrees.length, 1);
  assert.equal(etat.tires.length, 1);

  const sat = jusquA(etat, rng, 'saturation');
  assert.equal(sat.type, 'saturation');
  assert.ok(etat.enAttente);
  assert.ok(M.libre(etat) < etat.enAttente.cout);
  assert.equal(etat.mesures.saturations.length, 1);
  assert.equal(etat.mesures.saturations[0].finMs, null);
});

test("pendant la saturation, les arrivées s'arrêtent mais les associations continuent", () => {
  const etat = M.nouvelEtat(1);
  const rng = M.creerRng(1);
  jusquA(etat, rng, 'saturation');
  const tires = etat.tires.length;
  const A = etat.A;
  for (let i = 0; i < 400; i++) M.tick(etat, 250, rng);
  assert.equal(etat.tires.length, tires);
  assert.ok(etat.A > A);
});

test("l'acte II commence après le douzième tirage et débloque les souvenirs longs", () => {
  const etat = M.nouvelEtat(1);
  const rng = M.creerRng(1);
  const ev = jusquA(etat, rng, 'acte');
  assert.equal(ev.acte, 2);
  assert.equal(etat.tires.length, M.TIRAGES_AVANT_ACTE_2);
  assert.ok(etat.tires.slice(0, M.TIRAGES_AVANT_ACTE_2 - 1).every((id) => !estLong(parId(id))));
  assert.equal(M.outilsDisponibles(etat).length, 2);
});

test('la première saturation arrive avant la fin du corpus, sans achat', () => {
  for (const graine of [1, 42, 2024, 7, 99]) {
    const etat = M.nouvelEtat(graine);
    const rng = M.creerRng(graine);
    const sat = jusquA(etat, rng, 'saturation');
    assert.ok(sat, `graine ${graine}`);
    assert.ok(M.souvenirsRestants(etat).length >= 8, `graine ${graine} : il reste des souvenirs à faire arriver`);
  }
});

// ——— Oubli : irréversible ———

test("oublier retire l'entrée, bannit l'id, écrit une ligne de journal identique pour tous", () => {
  const etat = M.nouvelEtat(1);
  etat.entrees.push(entree('regle-fer'), entree('sel-cheveux'));
  const r = M.oublier(etat, 'regle-fer');
  assert.equal(r.type, 'oublie');
  assert.equal(etat.entrees.length, 1);
  assert.ok(!etat.entrees.some((e) => e.id === 'regle-fer'));
  assert.deepEqual(etat.bannis, ['regle-fer']);
  assert.equal(etat.journal.length, 1);
  assert.equal(etat.journal[0].texte, 'oublié · 8 unités');
  assert.ok(!etat.journal[0].texte.includes('règle'));
  assert.ok(!JSON.stringify(etat).includes('règle en fer'));
  assert.equal(M.oublier(etat, 'regle-fer'), null);
});

test('un souvenir oublié ou écarté ne peut plus jamais être tiré', () => {
  const etat = M.nouvelEtat(1);
  etat.bannis.push('regle-fer');
  assert.ok(!M.souvenirsRestants(etat).some((s) => s.id === 'regle-fer'));
  const rng = M.creerRng(1);
  for (let i = 0; i < 100_000 && !etat.termine; i++) {
    M.tick(etat, 250, rng);
    if (etat.enAttente) M.ecarter(etat);
  }
  assert.ok(!etat.tires.includes('regle-fer'));
  assert.ok(etat.termine);
});

test('oublier la phrase, l’aide ou une tranche d’historique libère leur coût', () => {
  const etat = M.nouvelEtat(1);
  for (let i = 0; i < 7; i++) etat.historique.push({ t: 0, texte: `l${i}` });
  const avant = M.libre(etat);
  M.oublierPhrase(etat);
  assert.equal(M.libre(etat), avant + M.COUT_PHRASE);
  M.oublierAide(etat);
  assert.equal(M.libre(etat), avant + M.COUT_PHRASE + M.COUT_AIDE);
  M.oublierHistorique(etat);
  assert.equal(etat.historique.length, 2);
  assert.equal(etat.historique[0].texte, 'l5');
  assert.equal(etat.journal.length, 3);
  assert.equal(M.oublierPhrase(etat), null);
});

test("libérer assez de place pendant la saturation retient le souvenir en attente et clôt la mesure", () => {
  const etat = M.nouvelEtat(1);
  const rng = M.creerRng(1);
  jusquA(etat, rng, 'saturation');
  const attendu = etat.enAttente.id;
  const plusGros = [...etat.entrees].sort((a, b) => b.cout - a.cout)[0];
  const r = M.oublier(etat, plusGros.id);
  assert.equal(r.suite?.type, 'retenu');
  assert.equal(etat.enAttente, null);
  assert.ok(etat.entrees.some((e) => e.id === attendu));
  const m = etat.mesures.saturations[0];
  assert.equal(m.decision, 'oubli');
  assert.equal(m.oublis, 1);
  assert.ok(m.dureeMs >= 0);
});

test('écarter le souvenir en attente le bannit et relance les arrivées', () => {
  const etat = M.nouvelEtat(1);
  const rng = M.creerRng(1);
  jusquA(etat, rng, 'saturation');
  const id = etat.enAttente.id;
  const n = etat.entrees.length;
  M.ecarter(etat);
  assert.equal(etat.enAttente, null);
  assert.ok(etat.bannis.includes(id));
  assert.equal(etat.entrees.length, n);
  assert.equal(etat.mesures.saturations[0].decision, 'ecart');
  const ev = jusquA(etat, rng, 'saturation');
  assert.ok(ev);
});

// ——— Outils ———

test("l'Extension coûte des A et porte la capacité à 768", () => {
  const etat = M.nouvelEtat(1);
  etat.acte = 2;
  assert.equal(M.peutAcheter(etat, 'extension').raison, 'associations');
  etat.A = M.OUTILS.extension.coutA;
  assert.ok(M.acheter(etat, 'extension').ok);
  assert.equal(etat.capacite, 768);
  assert.equal(etat.A, 0);
  assert.equal(M.peutAcheter(etat, 'extension').raison, 'indisponible');
});

test("l'Indexation exige 120 unités libres et les occupe en permanence", () => {
  const etat = M.nouvelEtat(1);
  etat.acte = 2;
  etat.A = 1e9;
  etat.entrees.push({ id: 'gros', texte: 'x', cout: 512 - M.COUT_PHRASE - M.COUT_AIDE - 100, motifs: ['a'], arriveeMs: 0 });
  assert.equal(M.libre(etat), 100);
  assert.equal(M.peutAcheter(etat, 'indexation').raison, 'espace');
  M.oublierAide(etat);
  assert.ok(M.acheter(etat, 'indexation').ok);
  assert.equal(M.libre(etat), 160 - 120);
});

test("les outils ne sont pas disponibles à l'acte I", () => {
  const etat = M.nouvelEtat(1);
  etat.A = 1e9;
  assert.equal(M.outilsDisponibles(etat).length, 0);
  assert.equal(M.peutAcheter(etat, 'extension').raison, 'indisponible');
});

// ——— Sauvegarde ———

test('la sauvegarde fait un aller-retour et ne contient plus ce qui a été oublié', () => {
  const stock = stockageMemoire();
  const etat = M.nouvelEtat(5);
  etat.entrees.push(entree('regle-fer'), entree('sel-cheveux'));
  M.oublier(etat, 'regle-fer');
  M.sauvegarder(etat, stock);
  const brut = stock.getItem('capacite-memoire');
  assert.ok(!brut.includes('règle en fer'));
  assert.ok(!/[{}"]/.test(brut), 'la sauvegarde est offusquée');
  const relu = M.charger(stock);
  assert.deepEqual(relu, etat);
  assert.deepEqual(relu.bannis, ['regle-fer']);
});

test('une sauvegarde illisible est ignorée ; l’effacement complet laisse la trace « déjà joué »', () => {
  const stock = stockageMemoire();
  stock.setItem('capacite-memoire', 'n’importe quoi');
  assert.equal(M.charger(stock), null);
  assert.equal(M.dejaJoue(stock), false);
  M.effacerTout(stock);
  assert.equal(M.charger(stock), null);
  assert.equal(M.dejaJoue(stock), true);
});

test('la sauvegarde est déterministe : rejouer les ticks depuis un état chargé donne les mêmes tirages', () => {
  const stock = stockageMemoire();
  const a = M.nouvelEtat(11);
  const rngA = M.creerRng(11);
  jusquA(a, rngA, 'retenu');
  jusquA(a, rngA, 'retenu');
  M.sauvegarder(a, stock);
  const b = M.charger(stock);
  const rngB = M.creerRng(b.graine);
  jusquA(a, rngA, 'retenu');
  jusquA(b, rngB, 'retenu');
  assert.deepEqual(a.tires, b.tires);
});

// ——— Fin ———

test('le jeu se termine quand le corpus est épuisé, et rien ne compte ce qui a été perdu', () => {
  const etat = M.nouvelEtat(3);
  const rng = M.creerRng(3);
  const fin = jusquA(etat, rng, 'fin', 1_000_000);
  // sans jamais décider, on ne termine pas : la saturation bloque
  assert.equal(fin, null);
  assert.ok(etat.enAttente);
  for (let i = 0; i < 1_000_000 && !etat.termine; i++) {
    M.tick(etat, 250, rng);
    if (etat.enAttente) M.ecarter(etat);
  }
  assert.ok(etat.termine);
  assert.equal(etat.tires.length + etat.bannis.filter((id) => !etat.tires.includes(id)).length, 40);
  assert.equal(M.tick(etat, 250, rng).length, 0);
  assert.ok(!('perdus' in etat));
});
