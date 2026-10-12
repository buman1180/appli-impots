import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { calculerImpot, gainTotal } from './src/moteur/index.ts';
import {
  construireQuestions,
  prochaineSansReponse,
  reponsesVersProfil,
  type Reponse,
  type Reponses,
} from './src/questionnaire/questions.ts';
import { lectureVersReponses, type Lecture } from './src/lecture/lireTexte.ts';
import { Coller } from './src/ecrans/Coller';
import { Verification } from './src/ecrans/Verification';
import { PROFIL_DEMO } from './src/questionnaire/demo.ts';
import { Accueil } from './src/ecrans/Accueil';
import { QuestionEcran } from './src/ecrans/QuestionEcran';
import { Resultat } from './src/ecrans/Resultat';
import { useTheme } from './src/ecrans/theme';

type Ecran =
  | { nom: 'accueil' }
  | { nom: 'coller' }
  | { nom: 'verification'; lecture: Lecture }
  | { nom: 'question'; index: number }
  | { nom: 'resultat' };

export default function App() {
  const t = useTheme();
  const [ecran, setEcran] = useState<Ecran>({ nom: 'accueil' });
  const [reponses, setReponses] = useState<Reponses>({});
  // Après un import, on ne pose que les questions dont la réponse manque.
  const [seulementManquantes, setSeulementManquantes] = useState(false);

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
    const suivant = seulementManquantes
      ? prochaineSansReponse(suivantes, nouvelles, id)
      : suivantes.findIndex((q) => q.id === id) + 1;
    setEcran(
      suivant < 0 || suivant >= suivantes.length ? { nom: 'resultat' } : { nom: 'question', index: suivant },
    );
  };

  let contenu: React.ReactNode = null;
  if (ecran.nom === 'accueil') {
    contenu = (
      <Accueil
        onCommencer={() => {
          setReponses({});
          setSeulementManquantes(false);
          setEcran({ nom: 'question', index: 0 });
        }}
        onColler={() => setEcran({ nom: 'coller' })}
        onDemo={() => {
          setReponses(PROFIL_DEMO);
          setEcran({ nom: 'resultat' });
        }}
      />
    );
  } else if (ecran.nom === 'coller') {
    contenu = (
      <Coller onLu={(lecture) => setEcran({ nom: 'verification', lecture })} onRetour={() => setEcran({ nom: 'accueil' })} />
    );
  } else if (ecran.nom === 'verification') {
    contenu = (
      <Verification
        lecture={ecran.lecture}
        onRetour={() => setEcran({ nom: 'coller' })}
        onValider={(lecture) => {
          const importees = lectureVersReponses(lecture);
          setReponses(importees);
          setSeulementManquantes(true);
          const qs = construireQuestions(importees);
          const premiere = prochaineSansReponse(qs, importees);
          setEcran(premiere < 0 ? { nom: 'resultat' } : { nom: 'question', index: premiere });
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
        onModifier={() => {
          setSeulementManquantes(false);
          setEcran({ nom: 'question', index: 0 });
        }}
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
