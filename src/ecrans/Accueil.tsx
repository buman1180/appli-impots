import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bouton } from './composants';
import { useTheme } from './theme';

interface Props {
  onCommencer: () => void;
  onDemo: () => void;
}

export function Accueil({ onCommencer, onDemo }: Props) {
  const t = useTheme();
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.entete}>
        <Text accessibilityRole="header" style={[styles.titre, { color: t.texte }]}>
          Votre impôt,{'\n'}simplement
        </Text>
        <Text style={[styles.sous, { color: t.texteDoux }]}>Gratuit, sans compte, pour tous les Belges</Text>
      </View>

      <Bouton
        principal
        libelle="Photographier ma déclaration"
        sousTitre="Bientôt disponible"
        desactive
        onPress={() => {}}
      />
      <Bouton libelle="Coller ou importer" sousTitre="Bientôt disponible" desactive onPress={() => {}} />
      <Bouton
        principal
        libelle="Répondre aux questions"
        sousTitre="Environ 5 à 15 minutes"
        onPress={onCommencer}
      />
      <Bouton libelle="Essayer avec un exemple" sousTitre="Sophie, maman solo à Liège" onPress={onDemo} />

      <Text style={[styles.note, { color: t.texteDoux }]}>
        Vos réponses restent sur votre téléphone.{'\n'}
        Simulation à titre informatif : seul l'avertissement-extrait de rôle du SPF Finances fait foi. Appli
        indépendante, non liée au SPF Finances.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 24, paddingTop: 48 },
  entete: { alignItems: 'center', marginBottom: 28 },
  titre: { fontSize: 34, fontWeight: '700', textAlign: 'center', lineHeight: 42 },
  sous: { fontSize: 17, marginTop: 10, textAlign: 'center' },
  note: { fontSize: 14, textAlign: 'center', marginTop: 28, lineHeight: 20 },
});
