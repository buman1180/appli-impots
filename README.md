# Appli impôts citoyenne

Application gratuite et open source pour aider chaque citoyen belge à comprendre sa déclaration d'impôt, à ne rater aucun avantage fiscal légal et à payer le juste impôt, dans l'égalité.

L'appli ne remplace pas Tax-on-web : elle prépare, explique et vérifie. La personne valide et dépose elle-même sa déclaration. Les calculs se font sur le téléphone ; aucune donnée personnelle n'est envoyée sur un serveur.

> Simulation à titre informatif. Seul l'avertissement-extrait de rôle du SPF Finances fait foi. Appli indépendante, non liée au SPF Finances.

## État du projet

| Étape | État |
| --- | --- |
| 1. Comptes GitHub et Expo | Fait |
| 2. Moteur de calcul (exercice 2026, revenus 2025) | Première version |
| 3. Questionnaire et écrans (Expo) | À faire |
| 4. Lecture des documents (copier-coller, PDF, photo) | À faire |
| 5. Publication sur les stores | À faire |

## Moteur de calcul

Dossier `src/moteur` :

- `regles/ei2026.ts` : les montants officiels de l'exercice 2026 (barème, quotité exemptée, forfaits, réductions), chacun avec sa source. Aucun calcul dans ce fichier.
- `calcul.ts` : le calcul, étape par étape, avec une explication en français pour chaque étape (« montre-moi le calcul »).
- `types.ts` : la description d'un profil et d'un résultat.

**Couvert dans cette version :** salarié isolé ; frais forfaitaires ou réels (le plus avantageux est choisi) ; quotité exemptée avec suppléments (enfants, enfant handicapé, enfant de moins de 3 ans, parent seul, handicap) ; garde d'enfants ; dons ; épargne-pension ; titres-services (Wallonie, Bruxelles ; supprimés en Flandre) ; taxe communale ; précompte et solde ; indicateur de fiabilité et avertissements.

**Pas encore couvert :** déclaration commune (couples), pensions et revenus de remplacement, crédits d'impôt remboursables (enfants, bas revenus), revenus immobiliers, indépendants, détail entre impôt fédéral et régional.

## Lancer les tests

Avec Node.js 22 ou plus récent, sans rien installer :

```
npm test
```

Les résultats attendus sont calculés à la main dans `tests/calcul.test.ts`. Avant toute publication, chaque profil doit aussi être vérifié avec le simulateur officiel Tax-Calc du SPF Finances.

## Licence

MIT : chacun peut lire, vérifier et améliorer le code.
