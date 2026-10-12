/**
 * Règles fiscales de l'exercice d'imposition 2026 (revenus 2025).
 * Données uniquement : aucun calcul ici. Une règle = un montant + sa source.
 * Mettre à jour chaque année, puis relancer les tests.
 */
export const regles2026 = {
  "exercice": 2026,
  "revenus": 2025,
  "verifieLe": "2026-10-12",
  "statut": "à vérifier contre Tax-Calc avant publication",
  "sources": {
    "indexation": "SPF Finances – montants indexés exercice d'imposition 2026 (via pyxis.be/Documents/Document/202503241543072685-Exercice_dimposition_2026-Copier.pdf)",
    "bareme": "billy.tech – Tranches d'imposition IPP 2026",
    "reductions": "test-achats.be – dépenses à déclarer (2026) ; blog.degandpartners.com – avantages fiscaux 2025"
  },
  "bareme": [
    {
      "jusqua": 16320,
      "taux": 0.25
    },
    {
      "jusqua": 28800,
      "taux": 0.4
    },
    {
      "jusqua": 49840,
      "taux": 0.45
    },
    {
      "jusqua": null,
      "taux": 0.5
    }
  ],
  "quotiteExemptee": {
    "base": 10910,
    "handicap": 1980,
    "isoleAvecEnfants": 1980,
    "enfantsCumul": [
      0,
      1980,
      5110,
      11440,
      18510
    ],
    "enfantSupplementaire": 7070,
    "enfantMoinsDe3AnsSansFraisDeGarde": 740
  },
  "fraisProfessionnelsForfaitaires": {
    "salaries": {
      "taux": 0.3,
      "maximum": 5930
    }
  },
  "reductions": {
    "gardeEnfants": {
      "code": "1384",
      "taux": 0.45,
      "maximumParJourParEnfant": 16.9,
      "ageMaximum": 14,
      "ageMaximumHandicap": 21
    },
    "dons": {
      "code": "1394",
      "taux": 0.3,
      "minimumParOrganisme": 40,
      "plafondPourcentageRevenuNet": 0.1,
      "plafondAbsolu": 420930
    },
    "epargnePension": {
      "code": "1361",
      "standard": {
        "plafond": 1050,
        "taux": 0.3
      },
      "majore": {
        "plafond": 1350,
        "taux": 0.25
      }
    },
    "titresServices": {
      "wallonie": {
        "code": "1366",
        "montantParTitre": 0.9,
        "titresMaximum": 150
      },
      "bruxelles": {
        "code": "1364",
        "taux": 0.15,
        "depensesMaximum": 1850
      },
      "flandre": {
        "code": null,
        "supprime": true
      }
    }
  },
  "additionnelsCommunaux": {
    "tauxParDefaut": 0.07,
    "remarque": "Taux moyen indicatif ; le taux exact dépend de la commune de résidence au 1er janvier 2026."
  }
};
