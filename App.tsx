import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { calculerImpot, gainTotal } from './src/moteur/index.ts';
import {
  construireQuestions,
  reponsesVersProfil,
  type Reponse,
  type Reponses,
} from './src/questionnaire/questions.ts';
import { PROFIL_DEMO } from './src/questionnaire/demo.ts';
import { Accueil } from './src/ecrans/Accueil';
import { QuestionEcran } from './src/ecrans/QuestionEcran';
import { Resultat } from './src/ecrans/Resultat';
import { useTheme } from './src/ecrans/theme';

type Ecran = { nom: 'accueil' } | { nom: 'question'; index: number } | { nom: 'resultat' };

export default function App() {
  const t = useTheme();
  const [ecran, setEcran] = useState<Ecran>({ nom: 'accueil' });
  const [reponses, setReponses] = useState<Reponses>({});

  // La liste des questions dépend des réponses déjà données.
  const questions = useMemo(() => construireQuestions(reponses), [reponses]);
  const profil = useMemo(() => reponsesVersProfil(reponses), [reponses]);
  const resultat = useMemo(() => (ecran.nom === 'resultat' ? calculerImpot(profil) : null), [ecran, profil]);
  const gain = useMemo(() => (ecran.nom === 'resultat' ? gainTotal(profil) : 0), [ecran, profil]);

  const repondre = (index: number, valeur: Reponse) => {
    const id = questions[index].id;
    const nouvelles = { ...reponses, [id]: valeur };
    setReponses(nouvelles);
    const suivantes = construireQuestions(nouvelles);
    const suivant = suivantes.findIndex((q) => q.id === id) + 1;
    setEcran(suivant >= suivantes.length ? { nom: 'resultat' } : { nom: 'question', index: suivant });
  };

  let contenu: React.ReactNode = null;
  if (ecran.nom === 'accueil') {
    contenu = (
      <Accueil
        onCommencer={() => {
          setReponses({});
          setEcran({ nom: 'question', index: 0 });
        }}
        onDemo={() => {
          setReponses(PROFIL_DEMO);
          setEcran({ nom: 'resultat' });
        }}
      />
    );
  } else if (ecran.nom === 'question') {
    const index = Math.min(ecran.index, questions.length - 1);
    const q = questions[index];
    contenu = (
      <QuestionEcran
        question={q}
        valeur={reponses[q.id]}
        progression={index / questions.length}
        onRepondre={(v) => repondre(index, v)}
        onRetour={() => setEcran(index === 0 ? { nom: 'accueil' } : { nom: 'question', index: index - 1 })}
      />
    );
  } else if (resultat) {
    contenu = (
      <Resultat
        resultat={resultat}
        gain={gain}
        onModifier={() => setEcran({ nom: 'question', index: 0 })}
        onRecommencer={() => {
          setReponses({});
          setEcran({ nom: 'accueil' });
        }}
      />
    );
  }

  return (
    <View style={[styles.racine, { backgroundColor: t.fond }]}>
      <StatusBar style="auto" />
      {contenu}
    </View>
  );
}

const styles = StyleSheet.create({
  racine: { flex: 1 },
});
