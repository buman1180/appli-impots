import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lectureVersReponses, lireTexte } from '../src/lecture/lireTexte.ts';
import { construireQuestions, prochaineSansReponse, reponsesVersProfil } from '../src/questionnaire/questions.ts';
import { calculerImpot } from '../src/moteur/index.ts';

// Exemples de textes tels qu'ils peuvent être copiés (formats variés, montants fictifs).
const TAX_ON_WEB = `
Cadre IV. Traitements, salaires...
1250-11   Rémunérations ordinaires                 32.480,00
1286-81   Précompte professionnel                   6.120,45
Cadre X. Réductions d'impôt
1384-55   Dépenses pour la garde d'enfants         1.350,00
1394-45   Libéralités                                 120,00
1361-48   Épargne-pension                           1.050,00
1366-81   Titres-services (Région wallonne)          720,00
2250-80   Rémunérations ordinaires (partenaire)   28.000,00
`;

const EMAIL = `Bonjour,
Voici les montants de votre fiche 281.10 pour l'année 2025 :
Code 1250 : 41 250,30 €
Code 1286 : 9 870 €
Cordialement`;

const SUR_DEUX_LIGNES = `1250-11 Rémunérations
32 000,00
1286-81 Précompte
5 500,00`;

test('texte Tax-on-web : codes et montants reconnus', () => {
  const l = lireTexte(TAX_ON_WEB);
  const m = Object.fromEntries(l.montants.map((x) => [x.code, x.montant]));
  assert.deepEqual(m, {
    '1250': 32480,
    '1286': 6120.45,
    '1384': 1350,
    '1394': 120,
    '1361': 1050,
    '1366': 720,
  });
  assert.equal(l.region, 'wallonie');
  assert.ok(l.ignores.some((i) => i.code === '2250'));
  assert.ok(l.montants.every((x) => !x.incertain));
});

test('e-mail : « Code 1250 : 41 250,30 € » et montant sans centimes', () => {
  const l = lireTexte(EMAIL);
  assert.equal(l.montants.find((x) => x.code === '1250')?.montant, 41250.3);
  const pp = l.montants.find((x) => x.code === '1286');
  assert.equal(pp?.montant, 9870);
  assert.equal(pp?.incertain, true); // pas de centimes : à vérifier
  // « 281.10 » et « 2025 » ne sont pas pris pour des codes.
  assert.equal(l.montants.length, 2);
});

test('montant sur la ligne suivante : lu mais marqué incertain', () => {
  const l = lireTexte(SUR_DEUX_LIGNES);
  assert.equal(l.montants.find((x) => x.code === '1250')?.montant, 32000);
  assert.equal(l.montants.find((x) => x.code === '1286')?.montant, 5500);
  assert.ok(l.montants.every((x) => x.incertain));
});

test('un nombre au milieu d’une phrase n’est pas un code', () => {
  const l = lireTexte('Nous avons reçu 1250 demandes cette année, total 2.500,00 €');
  assert.equal(l.montants.length, 0);
});

test('texte vide ou sans code', () => {
  assert.equal(lireTexte('').montants.length, 0);
  assert.equal(lireTexte('Bonjour, rien à signaler.').montants.length, 0);
});

test('import complet : seules les questions manquantes restent', () => {
  const reponses = lectureVersReponses(lireTexte(TAX_ON_WEB));
  assert.equal(reponses.region, 'wallonie');
  assert.equal(reponses.titresServicesNombre, 80);
  const questions = construireQuestions(reponses);
  const restantes = questions.filter((q) => reponses[q.id] === undefined).map((q) => q.id);
  assert.ok(!restantes.includes('salaires'));
  assert.ok(!restantes.includes('region'));
  assert.ok(restantes.includes('nbEnfants'));
  assert.equal(questions[prochaineSansReponse(questions, reponses)].id, 'tauxCommunal');
});

test('import : garde reprise du code 1384, sans questions par enfant', () => {
  const reponses = { ...lectureVersReponses(lireTexte(TAX_ON_WEB)), nbEnfants: 1, enfant1_age: 2 };
  const ids = construireQuestions(reponses).map((q) => q.id);
  assert.ok(!ids.includes('enfant1_fraisGarde'));
  const r = calculerImpot(reponsesVersProfil({ ...reponses, tauxCommunal: 7 }));
  assert.equal(r.avantages.find((a) => a.id === 'garde-enfants')?.gain, 607.5); // 1 350 × 45 %
});
