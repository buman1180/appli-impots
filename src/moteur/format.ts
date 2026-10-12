/** Formate un montant en euros à la belge : 1 234,56 €. Sans dépendre d'Intl (compatible téléphone). */
export function euros(n: number, decimales = 2): string {
  const signe = n < 0 ? '-' : '';
  const fixe = Math.abs(n).toFixed(decimales);
  const [entier, dec] = fixe.split('.');
  const groupes = entier.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${signe}${groupes}${dec ? ',' + dec : ''} €`;
}
