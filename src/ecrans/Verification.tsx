import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { euros } from '../moteur/index.ts';
import type { Lecture } from '../lecture/lireTexte.ts';
import { lireMontant } from '../questionnaire/questions.ts';
import { Bouton, Carte } from './composants';
import { useTheme } from './theme';

interface Props {
  lecture: Lecture;
  onValider: (lecture: Lecture) => void;
  onRetour: () => void;
}

/** La personne voit chaque montant lu et peut le corriger avant qu'il soit utilisé. */
export function Verification({ lecture, onValider, onRetour }: Props) {
  const t = useTheme();
  const [montants, setMontants] = useState(lecture.montants);
  const [edition, setEdition] = useState<string | null>(null);
  const [saisie, setSaisie] = useState('');

  const enregistrer = (code: string) => {
    const n = lireMontant(saisie);
    if (n === null) return;
    setMontants(montants.map((m) => (m.code === code ? { ...m, montant: n, incertain: false } : m)));
    setEdition(null);
  };

  const incertains = montants.filter((m) => m.incertain).length;

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={[styles.titre, { color: t.texte }]}>
        {montants.length} montant{montants.length > 1 ? 's' : ''} lu{montants.length > 1 ? 's' : ''}
      </Text>
      <Text style={[styles.texte, { color: t.texteDoux }]}>
        Vérifiez chaque montant. Touchez une ligne pour la corriger.
        {incertains > 0 ? ` ${incertains} montant(s) surligné(s) sont à vérifier en priorité.` : ''}
      </Text>

      {montants.map((m) => (
        <Carte
          key={m.code}
          style={m.incertain ? { backgroundColor: t.attentionFond, borderColor: t.attention } : undefined}
        >
          {edition === m.code ? (
            <View>
              <Text style={[styles.libelle, { color: t.texte }]}>{m.libelle}</Text>
              <TextInput
                accessibilityLabel={`Corriger ${m.libelle}`}
                value={saisie}
                onChangeText={setSaisie}
                keyboardType="decimal-pad"
                autoFocus
                onSubmitEditing={() => enregistrer(m.code)}
                style={[styles.saisie, { color: t.texte, borderColor: t.bordure }]}
              />
              <Bouton principal libelle="Enregistrer" onPress={() => enregistrer(m.code)} />
            </View>
          ) : (
            <Text
              accessibilityRole="button"
              accessibilityHint="Touchez pour corriger ce montant"
              onPress={() => {
                setEdition(m.code);
                setSaisie(String(m.montant).replace('.', ','));
              }}
            >
              <Text style={[styles.libelle, { color: t.texte }]}>{m.libelle}</Text>
              {'\n'}
              <Text style={[styles.montant, { color: t.texte }]}>{euros(m.montant)}</Text>
              {'\n'}
              <Text style={[styles.petit, { color: t.texteDoux }]}>
                Code {m.code}
                {m.incertain ? ' · à vérifier' : ''}
              </Text>
            </Text>
          )}
        </Carte>
      ))}

      {lecture.ignores.length > 0 ? (
        <Carte>
          <Text style={[styles.libelle, { color: t.texte }]}>Codes non utilisés</Text>
          {lecture.ignores.map((i) => (
            <Text key={i.code} style={[styles.petit, { color: t.texteDoux, marginTop: 4 }]}>
              Code {i.code} : {i.raison}
            </Text>
          ))}
        </Carte>
      ) : null}

      <Bouton principal libelle="C’est correct" onPress={() => onValider({ ...lecture, montants })} />
      <Text accessibilityRole="button" onPress={onRetour} style={[styles.lien, { color: t.texteDoux }]}>
        ← Recoller un autre texte
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 24, paddingTop: 48, paddingBottom: 48 },
  titre: { fontSize: 28, fontWeight: '700' },
  texte: { fontSize: 16, lineHeight: 23, marginTop: 8, marginBottom: 8 },
  libelle: { fontSize: 17, fontWeight: '600' },
  montant: { fontSize: 22, fontWeight: '700' },
  petit: { fontSize: 14 },
  saisie: { fontSize: 24, borderWidth: 2, borderRadius: 12, padding: 12, marginTop: 8 },
  lien: { fontSize: 16, textAlign: 'center', marginTop: 14, paddingVertical: 8 },
});
