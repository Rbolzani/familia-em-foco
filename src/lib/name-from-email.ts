/** Extrai nome amigável a partir de um endereço de email.
 *  vanessa.enju@yahoo.com.br → "Vanessa Enju"
 *  rbolzanic@gmail.com       → "Rbolzanic"
 */
export function nameFromEmail(email: string): string {
  if (!email) return 'Parceiro(a)'
  const local = email.split('@')[0]
  return local
    .replace(/[._-]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}
