import type { Avantage, Etape, Fiabilite, Profil, Resultat } from './types.ts';
import { regles2026 } from './regles/ei2026.ts';
import { euros } from './format.ts';

export type Regles = typeof regles2026;

/** Arrondi au centime. */
export const arrondi = (n: number): number => Math.round(n * 100) / 100;


/** Applique le barème progressif à un montant. */
export function appliquerBareme(montant: number, bareme: Regles['bareme']): number {
  let impot = 0;
  let plancher = 0;
  for (const tranche of bareme) {
    const plafond = tranche.jusqua ?? Infinity;
    if (montant <= plancher) break;
    const partie = Math.min(montant, plafond) - plancher;
    impot += partie * tranche.taux;
    plancher = plafond;
  }
  return arrondi(impot);
}

/** Frais professionnels forfaitaires des salariés. */
export function fraisForfaitaires(salaires: number, regles: Regles = regles2026): number {
  const f = regles.fraisProfessionnelsForfaitaires.salaries;
  return arrondi(Math.min(salaires * f.taux, f.maximum));
}

/** Quotité du revenu exemptée d'impôt (base + suppléments). */
export function quotiteExemptee(profil: Profil, regles: Regles = regles2026): { total: number; detail: string[] } {
  const q = regles.quotiteExemptee;
  const detail: string[] = [`base : ${euros(q.base)}`];
  let total = q.base;

  if (profil.handicape) {
    total += q.handicap;
    detail.push(`handicap : ${euros(q.handicap)}`);
  }

  const enfants = profil.enfants ?? [];
  // Un enfant handicapé compte pour deux.
  const nbEnfants = enfants.reduce((n, e) => n + (e.handicape ? 2 : 1), 0);
  if (nbEnfants > 0) {
    const cumul = q.enfantsCumul;
    const supplement =
      nbEnfants < cumul.length
        ? cumul[nbEnfants]
        : cumul[cumul.length - 1] + (nbEnfants - (cumul.length - 1)) * q.enfantSupplementaire;
    total += supplement;
    detail.push(`${nbEnfants} enfant(s) à charge : ${euros(supplement)}`);

    // Enfants de moins de 3 ans pour lesquels aucun frais de garde n'est déduit.
    const gardeGlobale = (profil.fraisGardeDeclares ?? 0) > 0;
    const petitsSansGarde = gardeGlobale
      ? 0
      : enfants.filter((e) => e.age < 3 && !(e.fraisGarde && e.fraisGarde > 0)).length;
    if (petitsSansGarde > 0) {
      const s = petitsSansGarde * q.enfantMoinsDe3AnsSansFraisDeGarde;
      total += s;
      detail.push(`${petitsSansGarde} enfant(s) de moins de 3 ans sans frais de garde : ${euros(s)}`);
    }

    if (profil.isoleAvecEnfants) {
      total += q.isoleAvecEnfants;
      detail.push(`parent seul : ${euros(q.isoleAvecEnfants)}`);
    }
  }

  return { total, detail };
}

function avantageGardeEnfants(profil: Profil, regles: Regles): Avantage | null {
  const r = regles.reductions.gardeEnfants;
  let deductible = 0;
  if (profil.fraisGardeDeclares && profil.fraisGardeDeclares > 0) {
    // Montant repris tel quel du code 1384 : il est déjà limité par jour sur l'attestation.
    deductible = profil.fraisGardeDeclares;
  } else for (const e of profil.enfants ?? []) {
    const ageMax = e.handicape ? r.ageMaximumHandicap : r.ageMaximum;
    if (!e.fraisGarde || e.fraisGarde <= 0 || e.age >= ageMax) continue;
    const plafond = (e.joursGarde ?? Infinity) * r.maximumParJourParEnfant;
    deductible += Math.min(e.fraisGarde, plafond);
  }
  if (deductible <= 0) return null;
  deductible = arrondi(deductible);
  return {
    id: 'garde-enfants',
    libelle: "Frais de garde d'enfants",
    code: r.code,
    montantADeclarer: deductible,
    gain: arrondi(deductible * r.taux),
    explication: `${r.taux * 100} % des frais de garde, limités à ${euros(r.maximumParJourParEnfant)} par jour et par enfant de moins de ${r.ageMaximum} ans.`,
  };
}

function avantageDons(profil: Profil, revenuNet: number, regles: Regles): Avantage | null {
  const r = regles.reductions.dons;
  const valables = (profil.dons ?? []).filter((d) => d >= r.minimumParOrganisme);
  const total = valables.reduce((s, d) => s + d, 0);
  if (total <= 0) return null;
  const plafond = Math.min(revenuNet * r.plafondPourcentageRevenuNet, r.plafondAbsolu);
  const retenu = arrondi(Math.min(total, plafond));
  return {
    id: 'dons',
    libelle: 'Dons à des organismes agréés',
    code: r.code,
    montantADeclarer: arrondi(total),
    gain: arrondi(retenu * r.taux),
    explication: `${r.taux * 100} % des dons d'au moins ${r.minimumParOrganisme} € par organisme, dans la limite de 10 % du revenu net.`,
  };
}

function avantageEpargnePension(profil: Profil, regles: Regles): Avantage | null {
  const verse = profil.epargnePension ?? 0;
  if (verse <= 0) return null;
  const regime = regles.reductions.epargnePension[profil.epargnePensionRegime ?? 'standard'];
  const retenu = Math.min(verse, regime.plafond);
  return {
    id: 'epargne-pension',
    libelle: 'Épargne-pension',
    code: regles.reductions.epargnePension.code,
    montantADeclarer: arrondi(verse),
    gain: arrondi(retenu * regime.taux),
    explication: `${regime.taux * 100} % des versements, sur maximum ${euros(regime.plafond)}.`,
  };
}

function avantageTitresServices(profil: Profil, regles: Regles): Avantage | null {
  const ts = profil.titresServices;
  if (!ts || ts.nombre <= 0) return null;
  const r = regles.reductions.titresServices;
  if (profil.region === 'wallonie') {
    const nb = Math.min(ts.nombre, r.wallonie.titresMaximum);
    return {
      id: 'titres-services',
      libelle: 'Titres-services (Wallonie)',
      code: r.wallonie.code,
      montantADeclarer: arrondi(ts.montant),
      gain: arrondi(nb * r.wallonie.montantParTitre),
      explication: `${euros(r.wallonie.montantParTitre)} par titre, sur maximum ${r.wallonie.titresMaximum} titres.`,
    };
  }
  if (profil.region === 'bruxelles') {
    const retenu = Math.min(ts.montant, r.bruxelles.depensesMaximum);
    return {
      id: 'titres-services',
      libelle: 'Titres-services (Bruxelles)',
      code: r.bruxelles.code,
      montantADeclarer: arrondi(ts.montant),
      gain: arrondi(retenu * r.bruxelles.taux),
      explication: `${r.bruxelles.taux * 100} % des dépenses, sur maximum ${euros(r.bruxelles.depensesMaximum)}.`,
    };
  }
  return null; // Flandre : avantage supprimé.
}

/** Calcule l'impôt d'un contribuable isolé salarié. */
export function calculerImpot(profil: Profil, regles: Regles = regles2026): Resultat {
  const etapes: Etape[] = [];
  const avertissements: string[] = [];
  let fiabilite: Fiabilite = 'fiable';

  // 1. Frais professionnels : le plus avantageux entre forfait et frais réels.
  const forfait = fraisForfaitaires(profil.salaires, regles);
  const reels = profil.fraisReels ?? 0;
  const fraisRetenus =
    reels > forfait
      ? { type: 'reels' as const, montant: arrondi(reels) }
      : { type: 'forfait' as const, montant: forfait };
  if (reels > 0 && reels <= forfait) {
    avertissements.push(
      `Vos frais réels (${euros(reels)}) sont inférieurs au forfait (${euros(forfait)}) : le forfait est retenu.`,
    );
  }
  etapes.push({
    libelle: 'Salaires imposables',
    montant: arrondi(profil.salaires),
    explication: 'Montant du code 1250 de votre fiche de salaire 281.10.',
  });
  etapes.push({
    libelle: fraisRetenus.type === 'forfait' ? 'Frais professionnels forfaitaires' : 'Frais professionnels réels',
    montant: -fraisRetenus.montant,
    explication:
      fraisRetenus.type === 'forfait'
        ? `30 % des salaires, maximum ${euros(regles.fraisProfessionnelsForfaitaires.salaries.maximum)}.`
        : 'Vos frais réels sont plus élevés que le forfait : ils sont retenus.',
  });

  // 2. Revenu net imposable.
  const revenuNetImposable = arrondi(Math.max(0, profil.salaires - fraisRetenus.montant));
  etapes.push({
    libelle: 'Revenu net imposable',
    montant: revenuNetImposable,
    explication: 'Salaires moins frais professionnels.',
  });

  // 3. Impôt de base selon le barème.
  const impotDeBase = appliquerBareme(revenuNetImposable, regles.bareme);
  etapes.push({
    libelle: 'Impôt selon le barème',
    montant: impotDeBase,
    explication: '25 % jusqu’à 16 320 €, 40 % jusqu’à 28 800 €, 45 % jusqu’à 49 840 €, 50 % au-delà.',
  });

  // 4. Quotité exemptée.
  const qe = quotiteExemptee(profil, regles);
  const qeUtile = Math.min(qe.total, revenuNetImposable);
  const reductionQuotiteExemptee = appliquerBareme(qeUtile, regles.bareme);
  if (qe.total > revenuNetImposable && (profil.enfants?.length ?? 0) > 0) {
    avertissements.push(
      "Une partie de votre quotité exemptée pour enfants n'est pas utilisée : vous pourriez avoir droit à un crédit d'impôt remboursable pour enfants, pas encore calculé par l'appli.",
    );
    fiabilite = 'a_verifier';
  }
  const impotApresQuotite = arrondi(Math.max(0, impotDeBase - reductionQuotiteExemptee));
  etapes.push({
    libelle: 'Réduction pour la partie exemptée',
    montant: -reductionQuotiteExemptee,
    explication: `Une partie du revenu n'est pas imposée (${qe.detail.join(', ')}).`,
  });

  // 5. Réductions pour dépenses.
  const avantages = [
    avantageGardeEnfants(profil, regles),
    avantageDons(profil, revenuNetImposable, regles),
    avantageEpargnePension(profil, regles),
    avantageTitresServices(profil, regles),
  ].filter((a): a is Avantage => a !== null);

  const totalAvantages = arrondi(avantages.reduce((s, a) => s + a.gain, 0));
  const totalReductions = Math.min(totalAvantages, impotApresQuotite);
  if (totalAvantages > impotApresQuotite) {
    avertissements.push(
      "Vos réductions dépassent l'impôt dû : la partie qui dépasse est perdue (sauf crédits d'impôt remboursables, non calculés ici).",
    );
  }
  if (profil.region === 'flandre' && profil.titresServices && profil.titresServices.nombre > 0) {
    avertissements.push('En Flandre, les titres-services ne donnent plus de réduction d’impôt depuis 2025.');
  }
  if (totalReductions > 0) {
    etapes.push({
      libelle: 'Réductions pour dépenses',
      montant: -totalReductions,
      explication: avantages.map((a) => `${a.libelle} : ${euros(a.gain)}`).join(' ; '),
    });
  }

  const impotEtat = arrondi(impotApresQuotite - totalReductions);

  // 6. Additionnels communaux.
  const taux = profil.tauxCommunal ?? regles.additionnelsCommunaux.tauxParDefaut;
  if (profil.tauxCommunal === undefined) {
    avertissements.push(
      `Taux communal inconnu : un taux moyen de ${taux * 100} % est utilisé. Indiquez votre commune pour un calcul exact.`,
    );
    if (fiabilite === 'fiable') fiabilite = 'a_verifier';
  }
  const additionnelsCommunaux = arrondi(impotEtat * taux);
  etapes.push({
    libelle: 'Taxe communale',
    montant: additionnelsCommunaux,
    explication: `${arrondi(taux * 100)} % de l'impôt, verses à votre commune.`,
  });

  const impotTotal = arrondi(impotEtat + additionnelsCommunaux);
  const precompte = arrondi(profil.precompte ?? 0);
  const solde = arrondi(impotTotal - precompte);
  etapes.push({
    libelle: 'Impôt total',
    montant: impotTotal,
    explication: 'Impôt après réductions, taxe communale comprise.',
  });
  if (profil.precompte !== undefined) {
    etapes.push({
      libelle: 'Précompte déjà retenu sur vos salaires',
      montant: -precompte,
      explication: 'Code 1286 de votre fiche 281.10.',
    });
    etapes.push({
      libelle: solde >= 0 ? 'À payer' : 'À recevoir',
      montant: Math.abs(solde),
      explication: solde >= 0 ? 'Montant estimé à payer.' : 'Montant estimé qui vous sera remboursé.',
    });
  }

  return {
    exercice: regles.exercice,
    revenuNetImposable,
    fraisRetenus,
    impotDeBase,
    reductionQuotiteExemptee,
    impotApresQuotite,
    avantages,
    totalReductions,
    impotEtat,
    additionnelsCommunaux,
    impotTotal,
    precompte,
    solde,
    etapes,
    fiabilite,
    avertissements,
  };
}

/**
 * Gain total des avantages trouvés : différence entre l'impôt sans avantages
 * et l'impôt avec avantages (c'est le « Vous récupérez X € » de l'écran résultat).
 */
export function gainTotal(profil: Profil, regles: Regles = regles2026): number {
  const sans: Profil = {
    ...profil,
    fraisReels: undefined,
    dons: undefined,
    epargnePension: undefined,
    titresServices: undefined,
    fraisGardeDeclares: undefined,
    enfants: profil.enfants?.map((e) => ({ ...e, fraisGarde: undefined, joursGarde: undefined })),
  };
  return arrondi(calculerImpot(sans, regles).impotTotal - calculerImpot(profil, regles).impotTotal);
}
