// Invariants d'équilibrage du MVP, vérifiés en jouant des parties entières avec scripts/simuler.mjs.
// Si un changement du corpus ou des coûts casse l'un d'eux, relancer `npm run simuler` pour voir où.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulerTout, simulerPartie, GRAINES, STRATEGIES } from '../scripts/simuler.mjs';

const parties = simulerTout();

test('le simulateur joue chaque stratégie sur chaque graine, jusqu’au bout', () => {
  assert.equal(parties.length, GRAINES.length * Object.keys(STRATEGIES).length);
  for (const p of parties) assert.ok(p.termine, `${p.strategie} / ${p.graine}`);
});

test('la première saturation arrive avant la fin du corpus, quelle que soit la stratégie', () => {
  for (const p of parties) {
    assert.ok(p.premiereSaturationMs != null, `${p.strategie} / ${p.graine} : jamais saturé`);
    assert.ok(p.restantsALaPremiereSaturation >= 8, `${p.strategie} / ${p.graine} : saturé trop tard`);
  }
});

test('avec la stratégie de base, les deux outils sont achetables avant la fin', () => {
  for (const p of parties.filter((p) => p.strategie === 'moins-rentable')) {
    assert.ok(p.indexationMs != null && p.indexationMs < p.finMs, `graine ${p.graine} : Indexation`);
    assert.ok(p.extensionMs != null && p.extensionMs < p.finMs, `graine ${p.graine} : Extension`);
  }
});

test('le corpus ne tient jamais : au moins trois choix forcés par partie', () => {
  // Le premier playtest avait fini sans un seul oubli, parce que tout tenait dans 768.
  for (const p of parties) assert.ok(p.choix >= 3, `${p.strategie} / ${p.graine} : ${p.choix} choix`);
});

test('l’occupation ne dépasse jamais la capacité', () => {
  for (const p of parties) assert.ok(p.depassementMax <= 0, `${p.strategie} / ${p.graine} : +${p.depassementMax}`);
});

test('une simulation est déterministe', () => {
  assert.deepEqual(simulerPartie({ graine: 42 }), simulerPartie({ graine: 42 }));
});
