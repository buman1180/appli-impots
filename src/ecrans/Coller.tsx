import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { lireTexte, type Lecture } from '../lecture/lireTexte.ts';
import { Bouton, Carte } from './composants';
import { useTheme } from './theme';

interface Props {
  onLu: (lecture: Lecture) => void;
  onRetour: () => void;
}

export function Coller({ onLu, onRetour }: Props) {
  const t = useTheme();
  const [texte, setTexte] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  const analyser = () => {
    if (texte.trim() === '') {
      setErreur('Collez d’abord le texte de votre déclaration dans la zone ci-dessus.');
      return;
    }
    const lecture = lireTexte(texte);
    if (lecture.montants.length === 0) {
      setErreur(
        'Aucun code reconnu dans ce texte. Vérifiez que le texte contient les codes de la déclaration (par ex. « 1250 ») et les montants, ou répondez aux questions.',
      );
      return;
    }
    onLu(lecture);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" style={[styles.titre, { color: t.texte }]}>
          Collez votre déclaration
        </Text>
        <Text style={[styles.texte, { color: t.texteDoux }]}>
          Dans Tax-on-web, votre fiche de salaire ou un e-mail : sélectionnez tout le texte, copiez-le, puis
          collez-le ici (appui long dans la zone, puis « Coller »).
        </Text>

        <TextInput
          accessibilityLabel="Texte de la déclaration"
          value={texte}
          onChangeText={(v) => {
            setTexte(v);
            setErreur(null);
          }}
          multiline
          textAlignVertical="top"
          placeholder="Collez ici le texte de votre déclaration…"
          placeholderTextColor={t.texteDoux}
          style={[styles.zone, { color: t.texte, borderColor: erreur ? t.attention : t.bordure, backgroundColor: t.carte }]}
        />
        {erreur ? <Text style={[styles.erreur, { color: t.attention }]}>{erreur}</Text> : null}

        <Bouton principal libelle="Lire les montants" onPress={analyser} />
        {texte !== '' ? <Bouton libelle="Effacer" onPress={() => setTexte('')} /> : null}

        <Carte style={{ backgroundColor: t.accentFond }}>
          <Text style={[styles.astuceTitre, { color: t.texte }]}>Vous avez un PDF ?</Text>
          <Text style={[styles.texte, { color: t.texte }]}>
            Ouvrez-le, sélectionnez tout le texte (sur ordinateur : Ctrl + A), copiez-le et collez-le ici. L’import
            direct des PDF et la photo arrivent dans une prochaine version.
          </Text>
        </Carte>

        <Text style={[styles.note, { color: t.texteDoux }]}>
          Le texte est lu sur votre téléphone et n’est envoyé nulle part.
        </Text>
        <Text accessibilityRole="button" onPress={onRetour} style={[styles.lien, { color: t.texteDoux }]}>
          ← Retour
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 24, paddingTop: 48, paddingBottom: 48 },
  titre: { fontSize: 28, fontWeight: '700' },
  texte: { fontSize: 16, lineHeight: 23, marginTop: 8 },
  zone: { minHeight: 200, borderWidth: 2, borderRadius: 14, padding: 14, fontSize: 15, marginTop: 16 },
  erreur: { fontSize: 15, marginTop: 6 },
  astuceTitre: { fontSize: 16, fontWeight: '700' },
  note: { fontSize: 14, textAlign: 'center', marginTop: 16 },
  lien: { fontSize: 16, textAlign: 'center', marginTop: 10, paddingVertical: 8 },
});
