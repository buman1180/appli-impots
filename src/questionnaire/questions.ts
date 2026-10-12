/**
 * Questionnaire de vie : une question par écran, en langage simple.
 * La liste s'adapte aux réponses (pas d'enfants = pas de questions sur la crèche).
 * Ce fichier ne contient aucun affichage : il est testé sans téléphone.
 */
import type { Profil, Region } from '../moteur/types.ts';

export type Reponse = string | number | boolean | null;
export type Reponses = Record<string, Reponse>;

export interface Choix {
  valeur: string | boolean;
  libelle: string;
}

export interface Question {
  id: string;
  /** Titre de la partie, affiché au-dessus de la question. */
  partie: string;
  texte: string;
  /** « Pourquoi cette question ? » */
  pourquoi: string;
  /** Où trouver l'information (bouton « Je ne sais pas »). */
  ouTrouver?: string;
  type: 'choix' | 'montant' | 'nombre';
  choix?: Choix[];
  /** Valeur utilisée si la personne ne sait pas. */
  parDefaut?: Reponse;
  min?: number;
  max?: number;
}

const OUI_NON: Choix[] = [
  { valeur: true, libelle: 'Oui' },
  { valeur: false, libelle: 'Non' },
];

export function construireQuestions(r: Reponses): Question[] {
  const q: Question[] = [];

  q.push({
    id: 'region',
    partie: 'Vous',
    texte: 'Où habitiez-vous au 1er janvier ?',
    pourquoi: 'Certains avantages, comme les titres-services, dépendent de la Région.',
    type: 'choix',
    choix: [
      { valeur: 'wallonie', libelle: 'En Wallonie' },
      { valeur: 'bruxelles', libelle: 'À Bruxelles' },
      { valeur: 'flandre', libelle: 'En Flandre' },
    ],
  });

  q.push({
    id: 'tauxCommunal',
    partie: 'Vous',
    texte: 'Quel est le taux de la taxe communale de votre commune ?',
    pourquoi:
      "Votre commune prend un petit pourcentage de votre impôt, en général entre 6 et 8,5 %. S'il n'est pas connu, l'appli utilise 7 %.",
    ouTrouver:
      "Sur votre avertissement-extrait de rôle de l'an dernier (« taxe communale »), ou sur le site de votre commune.",
    type: 'nombre',
    parDefaut: null,
    min: 0,
    max: 10,
  });

  q.push({
    id: 'salaires',
    partie: 'Vos revenus',
    texte: 'Combien avez-vous gagné en salaires imposables pendant l’année ?',
    pourquoi: "C'est la base du calcul de votre impôt.",
    ouTrouver: 'Code 1250 de votre fiche de salaire 281.10, envoyée par votre employeur, ou dans Tax-on-web.',
    type: 'montant',
  });

  q.push({
    id: 'precompte',
    partie: 'Vos revenus',
    texte: 'Combien de précompte a déjà été retenu sur vos salaires ?',
    pourquoi: "C'est l'impôt déjà payé chaque mois. Il permet de savoir si vous allez payer ou être remboursé.",
    ouTrouver: 'Code 1286 de votre fiche 281.10.',
    type: 'montant',
    parDefaut: null,
  });

  q.push({
    id: 'aFraisReels',
    partie: 'Vos revenus',
    texte: 'Avez-vous calculé vos frais professionnels réels (trajets, télétravail, matériel) ?',
    pourquoi:
      "Par défaut, un forfait de 30 % (maximum 5 930 €) est déduit. Si vos vrais frais sont plus élevés, vous payez moins d'impôt.",
    type: 'choix',
    choix: OUI_NON,
    parDefaut: false,
  });
  if (r.aFraisReels === true) {
    q.push({
      id: 'fraisReels',
      partie: 'Vos revenus',
      texte: 'À combien s’élèvent vos frais professionnels réels ?',
      pourquoi: "L'appli compare avec le forfait et garde automatiquement le plus avantageux.",
      ouTrouver: 'Total de vos trajets domicile-travail, frais de télétravail, matériel et formations, avec justificatifs.',
      type: 'montant',
    });
  }

  q.push({
    id: 'handicape',
    partie: 'Votre famille',
    texte: 'Êtes-vous reconnu(e) handicapé(e) à au moins 66 % ?',
    pourquoi: "Cela augmente la partie de vos revenus qui n'est pas imposée.",
    type: 'choix',
    choix: OUI_NON,
    parDefaut: false,
  });

  q.push({
    id: 'nbEnfants',
    partie: 'Votre famille',
    texte: 'Combien d’enfants avez-vous à charge ?',
    pourquoi: "Chaque enfant à charge augmente la partie de vos revenus qui n'est pas imposée.",
    ouTrouver: 'Les enfants qui vivent chez vous et ne gagnent pas trop (jobs étudiants compris dans certaines limites).',
    type: 'nombre',
    min: 0,
    max: 12,
    parDefaut: 0,
  });

  const nb = typeof r.nbEnfants === 'number' ? Math.min(r.nbEnfants, 12) : 0;
  if (nb > 0) {
    q.push({
      id: 'isoleAvecEnfants',
      partie: 'Votre famille',
      texte: 'Élevez-vous seul(e) vos enfants (sans conjoint ni cohabitant légal) ?',
      pourquoi: 'Les parents seuls ont droit à un supplément.',
      type: 'choix',
      choix: OUI_NON,
      parDefaut: false,
    });
    for (let i = 1; i <= nb; i++) {
      const qui = nb === 1 ? 'votre enfant' : `l’enfant n° ${i}`;
      q.push({
        id: `enfant${i}_age`,
        partie: `Enfant ${i}`,
        texte: `Quel âge avait ${qui} au 1er janvier ?`,
        pourquoi: 'Les frais de garde comptent pour les enfants de moins de 14 ans, et un supplément existe avant 3 ans.',
        type: 'nombre',
        min: 0,
        max: 30,
      });
      q.push({
        id: `enfant${i}_handicape`,
        partie: `Enfant ${i}`,
        texte: `${qui.charAt(0).toUpperCase() + qui.slice(1)} est-il reconnu handicapé ?`,
        pourquoi: 'Un enfant handicapé compte double pour la partie non imposée.',
        type: 'choix',
        choix: OUI_NON,
        parDefaut: false,
      });
      const age = r[`enfant${i}_age`];
      const ageMax = r[`enfant${i}_handicape`] === true ? 21 : 14;
      if (typeof age === 'number' && age < ageMax) {
        q.push({
          id: `enfant${i}_fraisGarde`,
          partie: `Enfant ${i}`,
          texte: `Combien avez-vous payé pour la garde de ${qui} (crèche, accueillante, garderie, stages) ?`,
          pourquoi: '45 % de ces frais sont déduits de votre impôt, jusqu’à 16,90 € par jour.',
          ouTrouver: "Attestation fiscale 281.86 remise par la crèche, l'école ou le mouvement de jeunesse.",
          type: 'montant',
          parDefaut: 0,
        });
        const frais = r[`enfant${i}_fraisGarde`];
        if (typeof frais === 'number' && frais > 0) {
          q.push({
            id: `enfant${i}_joursGarde`,
            partie: `Enfant ${i}`,
            texte: 'Pour combien de jours de garde ?',
            pourquoi: 'Le montant pris en compte est limité à 16,90 € par jour.',
            ouTrouver: "Indiqué sur l'attestation 281.86.",
            type: 'nombre',
            min: 0,
            max: 366,
            parDefaut: null,
          });
        }
      }
    }
  }

  q.push({
    id: 'dons',
    partie: 'Vos dépenses',
    texte: 'Combien avez-vous donné à des associations agréées (au moins 40 € par association) ?',
    pourquoi: '30 % de ces dons sont déduits de votre impôt.',
    ouTrouver: 'Attestations fiscales envoyées par les associations, souvent déjà dans Tax-on-web.',
    type: 'montant',
    parDefaut: 0,
  });

  q.push({
    id: 'epargnePension',
    partie: 'Vos dépenses',
    texte: 'Combien avez-vous versé en épargne-pension ?',
    pourquoi: 'Vous récupérez 25 à 30 % du montant versé.',
    ouTrouver: 'Attestation de votre banque ou de votre assureur (épargne-pension, fonds de pension).',
    type: 'montant',
    parDefaut: 0,
  });
  if (typeof r.epargnePension === 'number' && r.epargnePension > 1050) {
    q.push({
      id: 'epargnePensionRegime',
      partie: 'Vos dépenses',
      texte: 'Avez-vous choisi le plafond majoré (1 350 €) auprès de votre banque ?',
      pourquoi: 'Au-delà de 1 050 €, le taux passe à 25 %, sur maximum 1 350 €.',
      type: 'choix',
      choix: [
        { valeur: 'majore', libelle: 'Oui, plafond majoré' },
        { valeur: 'standard', libelle: 'Non / je ne sais pas' },
      ],
      parDefaut: 'standard',
    });
  }

  if (r.region !== 'flandre') {
    q.push({
      id: 'titresServicesNombre',
      partie: 'Vos dépenses',
      texte: 'Combien de titres-services avez-vous achetés ?',
      pourquoi: 'Une partie du prix des titres-services est déduite de votre impôt en Wallonie et à Bruxelles.',
      ouTrouver: "Attestation fiscale de l'émetteur (Pluxee / Sodexo), souvent déjà dans Tax-on-web.",
      type: 'nombre',
      min: 0,
      max: 2000,
      parDefaut: 0,
    });
    if (typeof r.titresServicesNombre === 'number' && r.titresServicesNombre > 0) {
      q.push({
        id: 'titresServicesMontant',
        partie: 'Vos dépenses',
        texte: 'Pour quel montant total ?',
        pourquoi: 'À Bruxelles, la réduction est calculée sur le montant payé.',
        ouTrouver: "Indiqué sur l'attestation fiscale des titres-services.",
        type: 'montant',
      });
    }
  }

  return q;
}

const nombre = (v: Reponse | undefined): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

/** Transforme les réponses du questionnaire en profil pour le moteur de calcul. */
export function reponsesVersProfil(r: Reponses): Profil {
  const region = (r.region as Region) ?? 'wallonie';
  const taux = nombre(r.tauxCommunal);
  const nb = Math.min(nombre(r.nbEnfants) ?? 0, 12);

  const enfants = Array.from({ length: nb }, (_, k) => {
    const i = k + 1;
    return {
      age: nombre(r[`enfant${i}_age`]) ?? 10,
      handicape: r[`enfant${i}_handicape`] === true,
      fraisGarde: nombre(r[`enfant${i}_fraisGarde`]),
      joursGarde: nombre(r[`enfant${i}_joursGarde`]),
    };
  });

  const nbTitres = nombre(r.titresServicesNombre) ?? 0;

  return {
    region,
    tauxCommunal: taux !== undefined ? taux / 100 : undefined,
    salaires: nombre(r.salaires) ?? 0,
    precompte: nombre(r.precompte),
    fraisReels: r.aFraisReels === true ? nombre(r.fraisReels) : undefined,
    handicape: r.handicape === true,
    isoleAvecEnfants: nb > 0 && r.isoleAvecEnfants === true,
    enfants,
    dons: nombre(r.dons) ? [nombre(r.dons) as number] : undefined,
    epargnePension: nombre(r.epargnePension),
    epargnePensionRegime: r.epargnePensionRegime === 'majore' ? 'majore' : 'standard',
    titresServices:
      region !== 'flandre' && nbTitres > 0
        ? { nombre: nbTitres, montant: nombre(r.titresServicesMontant) ?? nbTitres * 9 }
        : undefined,
  };
}

/** Lit un montant tapé par la personne : accepte « 1 234,50 », « 1234.5 », « 1.234,50 ». */
export function lireMontant(texte: string): number | null {
  let t = texte.replace(/[\s €]/g, '');
  if (t === '') return null;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
