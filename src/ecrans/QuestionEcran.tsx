import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { lireMontant, type Question, type Reponse } from '../questionnaire/questions.ts';
import { Barre, Bouton, Carte } from './composants';
import { useTheme } from './theme';

interface Props {
  question: Question;
  valeur: Reponse | undefined;
  progression: number;
  onRepondre: (valeur: Reponse) => void;
  onRetour: () => void;
}

export function QuestionEcran({ question, valeur, progression, onRepondre, onRetour }: Props) {
  const t = useTheme();
  const [texte, setTexte] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [aide, setAide] = useState(false);

  // Nouvelle question : on reprend la réponse déjà donnée, s'il y en a une.
  useEffect(() => {
    setTexte(typeof valeur === 'number' ? String(valeur).replace('.', ',') : '');
    setErreur(null);
    setAide(false);
  }, [question.id]);

  const valider = () => {
    const n = lireMontant(texte);
    if (n === null) {
      setErreur('Entrez un nombre, ou touchez « Je ne sais pas ».');
      return;
    }
    if (question.type === 'nombre' && !Number.isInteger(n) && question.id !== 'tauxCommunal') {
      setErreur('Entrez un nombre entier.');
      return;
    }
    if (question.min !== undefined && n < question.min) {
      setErreur(`Le minimum est ${question.min}.`);
      return;
    }
    if (question.max !== undefined && n > question.max) {
      setErreur(`Le maximum est ${question.max}.`);
      return;
    }
    onRepondre(n);
  };

  const jeNeSaisPas = () => {
    if (question.parDefaut !== undefined) onRepondre(question.parDefaut);
    else setAide(true);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Barre progression={progression} />
        <Text style={[styles.partie, { color: t.accent }]}>{question.partie}</Text>
        <Text accessibilityRole="header" style={[styles.question, { color: t.texte }]}>
          {question.texte}
        </Text>
        <Text style={[styles.pourquoi, { color: t.texteDoux }]}>{question.pourquoi}</Text>

        {question.type === 'choix' ? (
          <View style={{ marginTop: 16 }}>
            {question.choix?.map((c) => (
              <Bouton
                key={String(c.valeur)}
                principal={valeur === c.valeur}
                libelle={c.libelle}
                onPress={() => onRepondre(c.valeur)}
              />
            ))}
          </View>
        ) : (
          <View style={{ marginTop: 16 }}>
            <View style={[styles.champ, { borderColor: erreur ? t.attention : t.bordure, backgroundColor: t.carte }]}>
              <TextInput
                accessibilityLabel={question.texte}
                value={texte}
                onChangeText={(v) => {
                  setTexte(v);
                  setErreur(null);
                }}
                keyboardType="decimal-pad"
                placeholder={question.type === 'montant' ? '0' : question.id === 'tauxCommunal' ? 'ex. 7,5' : '0'}
                placeholderTextColor={t.texteDoux}
                style={[styles.saisie, { color: t.texte }]}
                returnKeyType="done"
                onSubmitEditing={valider}
                autoFocus
              />
              <Text style={[styles.unite, { color: t.texteDoux }]}>
                {question.type === 'montant' ? '€' : question.id === 'tauxCommunal' ? '%' : ''}
              </Text>
            </View>
            {erreur ? <Text style={[styles.erreur, { color: t.attention }]}>{erreur}</Text> : null}
            <Bouton principal libelle="Continuer" onPress={valider} />
          </View>
        )}

        <Bouton libelle="Je ne sais pas" onPress={jeNeSaisPas} />

        {aide && question.ouTrouver ? (
          <Carte style={{ backgroundColor: t.attentionFond }}>
            <Text style={[styles.aideTitre, { color: t.texte }]}>Où trouver cette information ?</Text>
            <Text style={[styles.aideTexte, { color: t.texte }]}>{question.ouTrouver}</Text>
          </Carte>
        ) : question.ouTrouver ? (
          <Text
            accessibilityRole="button"
            onPress={() => setAide(true)}
            style={[styles.lien, { color: t.accent }]}
          >
            Où trouver cette information ?
          </Text>
        ) : null}

        <Text accessibilityRole="button" onPress={onRetour} style={[styles.lien, { color: t.texteDoux }]}>
          ← Question précédente
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 24, paddingTop: 48 },
  partie: { fontSize: 15, fontWeight: '700', marginTop: 20, textTransform: 'uppercase', letterSpacing: 0.5 },
  question: { fontSize: 26, fontWeight: '700', marginTop: 8, lineHeight: 33 },
  pourquoi: { fontSize: 16, marginTop: 12, lineHeight: 23 },
  champ: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: 14, paddingHorizontal: 16 },
  saisie: { flex: 1, fontSize: 28, paddingVertical: 14 },
  unite: { fontSize: 24, marginLeft: 8 },
  erreur: { fontSize: 15, marginTop: 6 },
  aideTitre: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  aideTexte: { fontSize: 16, lineHeight: 23 },
  lien: { fontSize: 16, textAlign: 'center', marginTop: 14, paddingVertical: 8 },
});
