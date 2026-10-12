import { useColorScheme } from 'react-native';

export interface Theme {
  fond: string;
  carte: string;
  texte: string;
  texteDoux: string;
  bordure: string;
  accent: string;
  accentFond: string;
  succes: string;
  attention: string;
  attentionFond: string;
}

const clair: Theme = {
  fond: '#F7F5F0',
  carte: '#FFFFFF',
  texte: '#1F2A24',
  texteDoux: '#5B655F',
  bordure: '#D9DED9',
  accent: '#2F6B4F',
  accentFond: '#E3F0E8',
  succes: '#1E8A4C',
  attention: '#9A6400',
  attentionFond: '#FFF3DC',
};

const sombre: Theme = {
  fond: '#141A17',
  carte: '#1E2622',
  texte: '#EEF2EF',
  texteDoux: '#A9B4AD',
  bordure: '#33403A',
  accent: '#7CC7A0',
  accentFond: '#22382D',
  succes: '#6FD39A',
  attention: '#F2C46B',
  attentionFond: '#3A3020',
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? sombre : clair;
}
