import { test } from 'node:test';
import assert from 'node:assert/strict';
import { construireQuestions, lireMontant, reponsesVersProfil } from '../src/questionnaire/questions.ts';
import { PROFIL_DEMO } from '../src/questionnaire/demo.ts';
import { calculerImpot, gainTotal } from '../src/moteur/index.ts';

test('lecture des montants tapés à la belge', () => {
  assert.equal(lireMontant('1 234,50'), 1234.5);
  assert.equal(lireMontant('1.234,50'), 1234.5);
  assert.equal(lireMontant('1234.5'), 1234.5);
  assert.equal(lireMontant('32.000'), 32000);
  assert.equal(lireMontant('7,5'), 7.5);
  assert.equal(lireMontant('2 800 €'), 2800);
  assert.equal(lireMontant(''), null);
  assert.equal(lireMontant('abc'), null);
});

test('pas d’enfants : pas de questions sur la garde', () => {
  const ids = construireQuestions({ nbEnfants: 0 }).map((q) => q.id);
  assert.ok(!ids.some((id) => id.startsWith('enfant')));
  assert.ok(!ids.includes('isoleAvecEnfants'));
});

test('enfant de 16 ans : pas de question sur la garde', () => {
  const ids = construireQuestions({ nbEnfants: 1, enfant1_age: 16 }).map((q) => q.id);
  assert.ok(ids.includes('enfant1_age'));
  assert.ok(!ids.includes('enfant1_fraisGarde'));
});

test('Flandre : pas de question sur les titres-services', () => {
  const ids = construireQuestions({ region: 'flandre' }).map((q) => q.id);
  assert.ok(!ids.includes('titresServicesNombre'));
});

test('identifiants de questions uniques', () => {
  const ids = construireQuestions(PROFIL_DEMO).map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('profil de démonstration : calcul complet sans erreur', () => {
  const p = reponsesVersProfil(PROFIL_DEMO);
  assert.equal(p.enfants?.length, 2);
  assert.equal(p.tauxCommunal, undefined);
  const r = calculerImpot(p);
  assert.equal(r.avantages.length, 4);
  assert.ok(r.impotTotal > 0);
  assert.ok(gainTotal(p) > 0);
  assert.equal(r.fiabilite, 'a_verifier'); // taux communal inconnu
});

test('taux communal en pourcentage converti', () => {
  const p = reponsesVersProfil({ region: 'bruxelles', tauxCommunal: 6.5, salaires: 30000 });
  assert.equal(p.tauxCommunal, 0.065);
});
