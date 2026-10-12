/**
 * Types du moteur de calcul de l'impôt des personnes physiques (IPP).
 * Tous les montants sont en euros.
 */

export type Region = 'wallonie' | 'bruxelles' | 'flandre';

export interface Enfant {
  /** Âge au 1er janvier de l'exercice d'imposition. */
  age: number;
  handicape?: boolean;
  /** Frais de garde payés pendant l'année (attestation de l'accueil). */
  fraisGarde?: number;
  /** Nombre de jours de garde indiqués sur l'attestation. */
  joursGarde?: number;
}

export interface Profil {
  region: Region;
  /** Taux des additionnels communaux, par ex. 0.07 pour 7 %. */
  tauxCommunal?: number;

  /** Rémunérations imposables (code 1250 de la fiche 281.10). */
  salaires: number;
  /** Frais professionnels réels, si la personne les a calculés. */
  fraisReels?: number;
  /** Précompte professionnel déjà retenu (code 1286). */
  precompte?: number;

  handicape?: boolean;
  /** Personne seule qui a des enfants à charge. */
  isoleAvecEnfants?: boolean;
  enfants?: Enfant[];

  /** Montant de chaque don à un organisme agréé (un élément par organisme). */
  dons?: number[];
  /** Montant versé en épargne-pension pendant l'année. */
  epargnePension?: number;
  /** Régime choisi auprès de la banque : standard (1 050 €) ou majoré (1 350 €). */
  epargnePensionRegime?: 'standard' | 'majore';
  /** Titres-services achetés pendant l'année. */
  titresServices?: { nombre: number; montant: number };
}

export interface Etape {
  libelle: string;
  montant: number;
  explication: string;
}

export interface Avantage {
  id: string;
  libelle: string;
  /** Code Tax-on-web à remplir, quand il existe. */
  code: string | null;
  /** Montant à déclarer dans ce code. */
  montantADeclarer: number;
  /** Réduction d'impôt obtenue, en euros. */
  gain: number;
  explication: string;
}

export type Fiabilite = 'fiable' | 'a_verifier' | 'faites_vous_aider';

export interface Resultat {
  exercice: number;
  revenuNetImposable: number;
  fraisRetenus: { type: 'forfait' | 'reels'; montant: number };
  impotDeBase: number;
  reductionQuotiteExemptee: number;
  impotApresQuotite: number;
  avantages: Avantage[];
  totalReductions: number;
  impotEtat: number;
  additionnelsCommunaux: number;
  impotTotal: number;
  precompte: number;
  /** Positif = à payer ; négatif = remboursement. */
  solde: number;
  etapes: Etape[];
  fiabilite: Fiabilite;
  avertissements: string[];
}
