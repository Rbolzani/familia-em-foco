// Validação e formatação de CPF (server + client).

/** Remove tudo que não for dígito. */
export function onlyDigits(v: string): string {
  return (v ?? '').replace(/\D/g, '')
}

/** Valida um CPF pelos dígitos verificadores. Aceita com ou sem máscara. */
export function isValidCPF(value: string): boolean {
  const cpf = onlyDigits(value)
  if (cpf.length !== 11) return false
  // Rejeita sequências repetidas (000..., 111..., etc.)
  if (/^(\d)\1{10}$/.test(cpf)) return false

  const calcCheck = (len: number): number => {
    let sum = 0
    for (let i = 0; i < len; i++) {
      sum += parseInt(cpf[i], 10) * (len + 1 - i)
    }
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }

  return calcCheck(9) === parseInt(cpf[9], 10) &&
         calcCheck(10) === parseInt(cpf[10], 10)
}

/** Formata como 000.000.000-00 (parcial enquanto digita). */
export function formatCPF(value: string): string {
  const d = onlyDigits(value).slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

/** Formata celular BR como (00) 00000-0000 (parcial enquanto digita). */
export function formatPhoneBR(value: string): string {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Celular BR válido: 10 ou 11 dígitos (DDD + número). */
export function isValidPhoneBR(value: string): boolean {
  const d = onlyDigits(value)
  return d.length === 10 || d.length === 11
}
