import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { euros, type Resultat as R } from '../moteur/index.ts';
import { Bouton, Carte } from './composants';
import { useTheme } from './theme';

interface Props {
  resultat: R;
  gain: number;
  onRecommencer: () => void;
  onModifier: () => void;
}

const FIABILITE = {
  fiable: { libelle: 'Calcul fiable', detail: 'Votre situation est entièrement couverte par l’appli.' },
  a_verifier: { libelle: 'À vérifier', detail: 'Une partie du calcul repose sur une estimation (voir ci-dessous).' },
  faites_vous_aider: {
    libelle: 'Faites-vous aider',
    detail: 'Votre situation dépasse ce que l’appli sait calculer. Bureaux du SPF Finances, syndicats, mutualités et CPAS aident gratuitement.',
  },
} as const;

export function Resultat({ resultat: r, gain, onRecommencer, onModifier }: Props) {
  const t = useTheme();
  const [detail, setDetail] = useState(false);
  const f = FIABILITE[r.fiabilite];

  return (
    <ScrollView contentContainerStyle={styles.page}>
      {gain > 0 ? (
        <View style={styles.centre}>
          <Text style={[styles.petit, { color: t.texteDoux }]}>Grâce aux avantages trouvés, vous économisez</Text>
          <Text accessibilityRole="header" style={[styles.gros, { color: t.succes }]}>
            {euros(gain, 0)}
          </Text>
        </View>
      ) : (
        <View style={styles.centre}>
          <Text accessibilityRole="header" style={[styles.titre, { color: t.texte }]}>
            Votre estimation
          </Text>
        </View>
      )}

      <Carte>
        <Ligne libelle="Impôt total estimé" valeur={euros(r.impotTotal)} fort />
        {r.precompte > 0 ? <Ligne libelle="Déjà payé (précompte)" valeur={euros(r.precompte)} /> : null}
        {r.precompte > 0 ? (
          <Ligne
            libelle={r.solde >= 0 ? 'Reste à payer' : 'Vous serez remboursé(e)'}
            valeur={euros(Math.abs(r.solde))}
            fort
            couleur={r.solde >= 0 ? t.texte : t.succes}
          />
        ) : null}
      </Carte>

      <Carte style={{ backgroundColor: r.fiabilite === 'fiable' ? t.accentFond : t.attentionFond }}>
        <Text style={[styles.badge, { color: t.texte }]}>{f.libelle}</Text>
        <Text style={[styles.texte, { color: t.texte }]}>{f.detail}</Text>
      </Carte>

      {r.avantages.length > 0 ? (
        <>
          <Text style={[styles.section, { color: t.texte }]}>Ce qu’il faut déclarer</Text>
          {r.avantages.map((a) => (
            <Carte key={a.id}>
              <View style={styles.ligne}>
                <Text style={[styles.libelle, { color: t.texte }]}>{a.libelle}</Text>
                <Text style={[styles.gain, { color: t.succes }]}>−{euros(a.gain, 0)}</Text>
              </View>
              {a.code ? (
                <Text style={[styles.code, { color: t.texte }]}>
                  Code {a.code} : {euros(a.montantADeclarer)}
                </Text>
              ) : null}
              <Text style={[styles.petitTexte, { color: t.texteDoux }]}>{a.explication}</Text>
            </Carte>
          ))}
        </>
      ) : null}

      {r.avertissements.length > 0 ? (
        <>
          <Text style={[styles.section, { color: t.texte }]}>À savoir</Text>
          {r.avertissements.map((a, i) => (
            <Text key={i} style={[styles.texte, { color: t.texte, marginBottom: 8 }]}>
              • {a}
            </Text>
          ))}
        </>
      ) : null}

      <Bouton libelle={detail ? 'Masquer le calcul' : 'Montre-moi le calcul'} onPress={() => setDetail(!detail)} />
      {detail ? (
        <Carte>
          {r.etapes.map((e, i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <View style={styles.ligne}>
                <Text style={[styles.libelle, { color: t.texte }]}>{e.libelle}</Text>
                <Text style={[styles.montant, { color: t.texte }]}>{euros(e.montant)}</Text>
              </View>
              <Text style={[styles.petitTexte, { color: t.texteDoux }]}>{e.explication}</Text>
            </View>
          ))}
        </Carte>
      ) : null}

      <Bouton libelle="Modifier mes réponses" onPress={onModifier} />
      <Bouton libelle="Recommencer" onPress={onRecommencer} />

      <Text style={[styles.note, { color: t.texteDoux }]}>
        Simulation à titre informatif pour l’exercice d’imposition {r.exercice}, basée sur vos réponses. Seul
        l’avertissement-extrait de rôle du SPF Finances fait foi.
      </Text>
    </ScrollView>
  );
}

function Ligne({ libelle, valeur, fort, couleur }: { libelle: string; valeur: string; fort?: boolean; couleur?: string }) {
  const t = useTheme();
  return (
    <View style={[styles.ligne, { marginVertical: 4 }]}>
      <Text style={[styles.libelle, { color: t.texte, fontWeight: fort ? '700' : '400' }]}>{libelle}</Text>
      <Text style={[styles.montant, { color: couleur ?? t.texte, fontWeight: fort ? '700' : '400' }]}>{valeur}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 24, paddingTop: 48, paddingBottom: 48 },
  centre: { alignItems: 'center', marginBottom: 12 },
  petit: { fontSize: 17, textAlign: 'center' },
  gros: { fontSize: 52, fontWeight: '800', marginTop: 4 },
  titre: { fontSize: 30, fontWeight: '700' },
  section: { fontSize: 20, fontWeight: '700', marginTop: 20, marginBottom: 4 },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  libelle: { fontSize: 17, flex: 1, paddingRight: 12 },
  montant: { fontSize: 17 },
  gain: { fontSize: 19, fontWeight: '700' },
  code: { fontSize: 16, fontWeight: '600', marginTop: 6 },
  badge: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  texte: { fontSize: 16, lineHeight: 23 },
  petitTexte: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  note: { fontSize: 13, textAlign: 'center', marginTop: 24, lineHeight: 19 },
});
