/**
 * Tests du moteur sur des profils types.
 * Chaque résultat attendu est calculé à la main ci-dessous, étape par étape.
 * Avant publication, ces profils doivent aussi être vérifiés avec Tax-Calc (SPF Finances).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appliquerBareme, calculerImpot, fraisForfaitaires, gainTotal } from '../src/moteur/index.ts';
import { regles2026 } from '../src/moteur/regles/ei2026.ts';

test('barème progressif', () => {
  assert.equal(appliquerBareme(0, regles2026.bareme), 0);
  assert.equal(appliquerBareme(16320, regles2026.bareme), 4080);
  // 4 080 + 12 480 × 40 % = 9 072
  assert.equal(appliquerBareme(28800, regles2026.bareme), 9072);
  // 9 072 + 21 040 × 45 % = 18 540 ; + 10 160 × 50 % = 23 620
  assert.equal(appliquerBareme(60000, regles2026.bareme), 23620);
});

test('frais forfaitaires : 30 % plafonnés à 5 930 €', () => {
  assert.equal(fraisForfaitaires(10000), 3000);
  assert.equal(fraisForfaitaires(30000), 5930);
});

test('profil 1 : salarié isolé, Wallonie, sans dépenses', () => {
  const r = calculerImpot({ region: 'wallonie', tauxCommunal: 0.08, salaires: 30000, precompte: 5000 });
  // 30 000 − 5 930 = 24 070
  assert.equal(r.revenuNetImposable, 24070);
  // 4 080 + 7 750 × 40 % = 7 180
  assert.equal(r.impotDeBase, 7180);
  // 10 910 × 25 % = 2 727,50
  assert.equal(r.reductionQuotiteExemptee, 2727.5);
  assert.equal(r.impotEtat, 4452.5);
  // 8 % de 4 452,50 = 356,20
  assert.equal(r.additionnelsCommunaux, 356.2);
  assert.equal(r.impotTotal, 4808.7);
  assert.equal(r.solde, -191.3); // remboursement
  assert.equal(r.fiabilite, 'fiable');
});

test('profil 2 : parent seul à Bruxelles, deux enfants, plusieurs dépenses', () => {
  const r = calculerImpot({
    region: 'bruxelles',
    tauxCommunal: 0.065,
    salaires: 35000,
    isoleAvecEnfants: true,
    enfants: [
      { age: 2, fraisGarde: 3000, joursGarde: 200 },
      { age: 7 },
    ],
    titresServices: { nombre: 100, montant: 1000 },
    dons: [50, 30], // le don de 30 € est sous le minimum de 40 €
    epargnePension: 1050,
  });
  // 35 000 − 5 930 = 29 070
  assert.equal(r.revenuNetImposable, 29070);
  // 4 080 + 4 992 + 270 × 45 % = 9 193,50
  assert.equal(r.impotDeBase, 9193.5);
  // Quotité : 10 910 + 5 110 (2 enfants) + 1 980 (parent seul) = 18 000 → 4 752
  assert.equal(r.reductionQuotiteExemptee, 4752);

  const gain = (id: string) => r.avantages.find((a) => a.id === id)?.gain;
  assert.equal(gain('garde-enfants'), 1350); // 3 000 × 45 %
  assert.equal(gain('dons'), 15); // 50 × 30 %
  assert.equal(gain('epargne-pension'), 315); // 1 050 × 30 %
  assert.equal(gain('titres-services'), 150); // 1 000 × 15 %
  assert.equal(r.totalReductions, 1830);

  // 9 193,50 − 4 752 − 1 830 = 2 611,50 ; + 6,5 % = 169,75
  assert.equal(r.impotEtat, 2611.5);
  assert.equal(r.additionnelsCommunaux, 169.75);
  assert.equal(r.impotTotal, 2781.25);
});

test('profil 2 : gain total grâce aux avantages', () => {
  // Sans avantages : la garde n'est plus déduite, donc +740 € de quotité pour l'enfant de 2 ans.
  // Quotité 18 740 → 5 048 ; impôt 4 145,50 + 6,5 % = 4 414,96. Avec avantages : 2 781,25.
  const g = gainTotal({
    region: 'bruxelles',
    tauxCommunal: 0.065,
    salaires: 35000,
    isoleAvecEnfants: true,
    enfants: [{ age: 2, fraisGarde: 3000, joursGarde: 200 }, { age: 7 }],
    titresServices: { nombre: 100, montant: 1000 },
    dons: [50, 30],
    epargnePension: 1050,
  });
  assert.equal(g, 1633.71);
});

test('profil 3 : frais réels plus élevés que le forfait', () => {
  const r = calculerImpot({ region: 'wallonie', tauxCommunal: 0.07, salaires: 20000, fraisReels: 7000 });
  assert.deepEqual(r.fraisRetenus, { type: 'reels', montant: 7000 });
  // 13 000 × 25 % = 3 250 − 2 727,50 = 522,50 ; + 7 % = 36,58
  assert.equal(r.impotTotal, 559.08);
});

test('profil 4 : titres-services en Flandre (supprimés)', () => {
  const r = calculerImpot({
    region: 'flandre',
    tauxCommunal: 0.07,
    salaires: 30000,
    titresServices: { nombre: 100, montant: 900 },
  });
  assert.equal(r.avantages.length, 0);
  assert.ok(r.avertissements.some((a) => a.includes('Flandre')));
});

test('profil 5 : petit revenu sous la quotité exemptée', () => {
  const r = calculerImpot({ region: 'wallonie', tauxCommunal: 0.07, salaires: 12000 });
  // 12 000 − 3 600 = 8 400, entièrement exempté
  assert.equal(r.revenuNetImposable, 8400);
  assert.equal(r.impotTotal, 0);
});

test('taux communal inconnu : résultat marqué « à vérifier »', () => {
  const r = calculerImpot({ region: 'wallonie', salaires: 30000 });
  assert.equal(r.fiabilite, 'a_verifier');
});
