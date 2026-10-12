/**
 * Lecture d'un texte collé (Tax-on-web, proposition de déclaration simplifiée, fiche 281.10, e-mail...).
 * Repère les codes de la déclaration et le montant qui les suit.
 * Tout se fait sur le téléphone ; aucun texte n'est envoyé ailleurs.
 */
import type { Reponses } from '../questionnaire/questions.ts';

export interface CodeConnu {
  code: string;
  libelle: string;
  /** Réponse du questionnaire remplie par ce code. */
  champ: string;
  /** Région déduite du code, s'il y en a une. */
  region?: 'wallonie' | 'bruxelles';
}

/** Codes reconnus (contribuable principal : codes 1xxx). */
export const CODES: CodeConnu[] = [
  { code: '1250', libelle: 'Salaires imposables', champ: 'salaires' },
  { code: '1286', libelle: 'Précompte professionnel retenu', champ: 'precompte' },
  { code: '1384', libelle: "Frais de garde d'enfants", champ: 'fraisGardeDeclares' },
  { code: '1394', libelle: 'Dons à des organismes agréés', champ: 'dons' },
  { code: '1361', libelle: 'Épargne-pension', champ: 'epargnePension' },
  { code: '1364', libelle: 'Titres-services (Bruxelles)', champ: 'titresServicesMontant', region: 'bruxelles' },
  { code: '1366', libelle: 'Titres-services (Wallonie)', champ: 'titresServicesMontant', region: 'wallonie' },
];

export interface MontantLu {
  code: string;
  libelle: string;
  champ: string;
  montant: number;
  /** Ligne d'origine, pour que la personne vérifie. */
  ligne: string;
  /** Lecture moins sûre (montant sans centimes, ou trouvé sur la ligne suivante). */
  incertain: boolean;
}

export interface Lecture {
  montants: MontantLu[];
  /** Codes du partenaire (2xxx) ou inconnus, signalés mais pas utilisés. */
  ignores: { code: string; raison: string }[];
  region?: 'wallonie' | 'bruxelles';
}

// Un code : 4 chiffres commençant par 1 ou 2, éventuellement suivi de « -NN » (chiffres de contrôle).
const RE_CODE = /(?:\bcode\s*:?\s*)?\b([12]\d{3})(?:\s?-\s?(\d{2}))?\b/gi;
// Un montant : 1.234,56 / 1 234,56 / 1234,56 / 1234.56 / 32 480 (avec € facultatif).
const RE_MONTANT = /(\d{1,3}(?:[ .  ]\d{3})+(?:,\d{1,2})?|\d+[,.]\d{1,2}|\d+)\s*(?:€|eur(?:os?)?)?/gi;

function versNombre(brut: string): { valeur: number; avecDecimales: boolean } {
  let t = brut.replace(/[\s  ]/g, '');
  let avecDecimales = false;
  if (/,\d{1,2}$/.test(t)) {
    t = t.replace(/\./g, '').replace(',', '.');
    avecDecimales = true;
  } else if (/^\d+\.\d{1,2}$/.test(t)) {
    avecDecimales = true;
  } else {
    t = t.replace(/[.,]/g, '');
  }
  return { valeur: Number(t), avecDecimales };
}

/** Cherche le premier montant dans un morceau de texte. */
function premierMontant(texte: string): { valeur: number; avecDecimales: boolean } | null {
  RE_MONTANT.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RE_MONTANT.exec(texte)) !== null) {
    const brut = m[1];
    // On ignore ce qui ressemble à un autre code (4 chiffres seuls commençant par 1 ou 2, sans €).
    if (/^[12]\d{3}$/.test(brut) && !/€|eur/i.test(m[0])) continue;
    // On ignore les années et les petits numéros isolés sans décimales (ex. « 281.10 », « 2025 »).
    if (/^\d{3}\.\d{2}$/.test(brut) && /^(281|325)/.test(brut)) continue;
    const n = versNombre(brut);
    if (Number.isFinite(n.valeur)) return n;
  }
  return null;
}

export function lireTexte(texte: string): Lecture {
  const lignes = texte.split(/\r?\n/);
  const montants: MontantLu[] = [];
  const ignores: Lecture['ignores'] = [];
  const dejaVus = new Set<string>();

  lignes.forEach((ligne, i) => {
    RE_CODE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = RE_CODE.exec(ligne)) !== null) {
      const code = m[1];
      const avecSuffixe = m[2] !== undefined;
      const avecMotCode = /code/i.test(m[0]);
      const enDebut = ligne.slice(0, m.index).trim() === '';
      // Un nombre de 4 chiffres n'est un code que s'il est clairement présenté comme tel.
      if (!avecSuffixe && !avecMotCode && !enDebut) continue;

      const connu = CODES.find((c) => c.code === code);
      if (!connu) {
        if (!dejaVus.has(code)) {
          ignores.push({
            code,
            raison: code.startsWith('2')
              ? 'Code du partenaire : la déclaration commune n’est pas encore prise en charge.'
              : 'Code pas encore pris en charge par l’appli.',
          });
          dejaVus.add(code);
        }
        continue;
      }
      if (dejaVus.has(code)) continue;

      const suite = ligne.slice(m.index + m[0].length);
      let trouve = premierMontant(suite);
      let incertain = false;
      if (!trouve && i + 1 < lignes.length) {
        trouve = premierMontant(lignes[i + 1]);
        incertain = true;
      }
      if (!trouve) continue;
      if (!trouve.avecDecimales) incertain = true;

      montants.push({
        code,
        libelle: connu.libelle,
        champ: connu.champ,
        montant: trouve.valeur,
        ligne: ligne.trim(),
        incertain,
      });
      dejaVus.add(code);
    }
  });

  const avecRegion = montants.map((x) => CODES.find((c) => c.code === x.code)?.region).find(Boolean);
  return { montants, ignores, region: avecRegion };
}

/** Transforme une lecture (vérifiée par la personne) en réponses pour le questionnaire. */
export function lectureVersReponses(lecture: Lecture): Reponses {
  const r: Reponses = {};
  if (lecture.region) r.region = lecture.region;
  for (const m of lecture.montants) {
    r[m.champ] = m.montant;
  }
  if (typeof r.titresServicesMontant === 'number') {
    // Le nombre de titres n'apparaît pas dans la déclaration : estimation à 9 € le titre.
    r.titresServicesNombre = Math.round(r.titresServicesMontant / 9);
  }
  return r;
}
