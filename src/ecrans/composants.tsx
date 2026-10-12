import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useTheme } from './theme';

interface BoutonProps {
  libelle: string;
  onPress: () => void;
  principal?: boolean;
  desactive?: boolean;
  sousTitre?: string;
  style?: ViewStyle;
}

/** Grand bouton facile à toucher (au moins 56 px de haut). */
export function Bouton({ libelle, onPress, principal, desactive, sousTitre, style }: BoutonProps) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={sousTitre ? `${libelle}. ${sousTitre}` : libelle}
      accessibilityState={{ disabled: !!desactive }}
      disabled={desactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.bouton,
        {
          backgroundColor: principal ? t.accentFond : t.carte,
          borderColor: principal ? t.accent : t.bordure,
          borderWidth: principal ? 2 : 1,
          opacity: desactive ? 0.45 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.boutonTexte, { color: t.texte }]}>{libelle}</Text>
      {sousTitre ? <Text style={[styles.boutonSous, { color: t.texteDoux }]}>{sousTitre}</Text> : null}
    </Pressable>
  );
}

export function Carte({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return (
    <View style={[styles.carte, { backgroundColor: t.carte, borderColor: t.bordure }, style]}>{children}</View>
  );
}

export function Barre({ progression }: { progression: number }) {
  const t = useTheme();
  const pct = Math.max(0, Math.min(1, progression)) * 100;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      style={[styles.barre, { backgroundColor: t.bordure }]}
    >
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: t.accent, borderRadius: 4 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  bouton: {
    minHeight: 56,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
  },
  boutonTexte: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  boutonSous: { fontSize: 14, marginTop: 2, textAlign: 'center' },
  carte: { borderRadius: 16, borderWidth: 1, padding: 18, marginVertical: 8 },
  barre: { height: 8, borderRadius: 4, overflow: 'hidden' },
});
