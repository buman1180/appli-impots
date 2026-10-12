# Appli impôts citoyenne

Application gratuite et open source pour aider chaque citoyen belge à comprendre sa déclaration d'impôt, à ne rater aucun avantage fiscal légal et à payer le juste impôt, dans l'égalité.

L'appli ne remplace pas Tax-on-web : elle prépare, explique et vérifie. La personne valide et dépose elle-même sa déclaration. Les calculs se font sur le téléphone ; aucune donnée personnelle n'est envoyée sur un serveur.

> Simulation à titre informatif. Seul l'avertissement-extrait de rôle du SPF Finances fait foi. Appli indépendante, non liée au SPF Finances.

## État du projet

| Étape | État |
| --- | --- |
| 1. Comptes GitHub et Expo | Fait |
| 2. Moteur de calcul (exercice 2026, revenus 2025) | Première version |
| 3. Questionnaire et écrans (Expo) | Première version |
| 4. Lecture des documents | Copier-coller : fait. Import PDF et photo : à faire (version de développement) |
| 5. Publication sur les stores | À faire |

## Moteur de calcul

Dossier `src/moteur` :

- `regles/ei2026.ts` : les montants officiels de l'exercice 2026 (barème, quotité exemptée, forfaits, réductions), chacun avec sa source. Aucun calcul dans ce fichier.
- `calcul.ts` : le calcul, étape par étape, avec une explication en français pour chaque étape (« montre-moi le calcul »).
- `types.ts` : la description d'un profil et d'un résultat.

**Couvert dans cette version :** salarié isolé ; frais forfaitaires ou réels (le plus avantageux est choisi) ; quotité exemptée avec suppléments (enfants, enfant handicapé, enfant de moins de 3 ans, parent seul, handicap) ; garde d'enfants ; dons ; épargne-pension ; titres-services (Wallonie, Bruxelles ; supprimés en Flandre) ; taxe communale ; précompte et solde ; indicateur de fiabilité et avertissements.

**Pas encore couvert :** déclaration commune (couples), pensions et revenus de remplacement, crédits d'impôt remboursables (enfants, bas revenus), revenus immobiliers, indépendants, détail entre impôt fédéral et régional.

## Essayer l'appli sur son téléphone (Windows)

1. Installer **Node.js LTS** depuis https://nodejs.org (une seule fois).
2. Double-cliquer sur **installer.bat** (une seule fois, 3 à 5 minutes).
3. Double-cliquer sur **demarrer.bat**.
4. Scanner le QR code avec **Expo Go** (Android) ou l'appareil photo (iPhone). Le téléphone et l'ordinateur doivent être sur le même Wi-Fi.

## Lecture des documents

`src/lecture/lireTexte.ts` repère dans un texte collé (Tax-on-web, fiche 281.10, e-mail) les codes de la déclaration et leurs montants : 1250 (salaires), 1286 (précompte), 1384 (garde), 1394 (dons), 1361 (épargne-pension), 1364 et 1366 (titres-services). Chaque montant est montré à la personne, qui le vérifie ou le corrige ; les montants incertains sont surlignés. L'appli ne pose ensuite que les questions dont la réponse manque.

## Écrans

- `App.tsx` : enchaînement accueil → questions → résultat.
- `src/questionnaire/questions.ts` : les questions (une par écran, « Pourquoi cette question ? », « Je ne sais pas »), qui s'adaptent aux réponses.
- `src/questionnaire/demo.ts` : profil fictif pour le mode démonstration.
- `src/ecrans/` : accueil, question, résultat (gain, cases à remplir, fiabilité, « Montre-moi le calcul »).

## Lancer les tests

Avec Node.js 22 ou plus récent, sans rien installer :

```
npm test
```

Les résultats attendus sont calculés à la main dans `tests/calcul.test.ts`. Avant toute publication, chaque profil doit aussi être vérifié avec le simulateur officiel Tax-Calc du SPF Finances.

## Licence

MIT : chacun peut lire, vérifier et améliorer le code.
