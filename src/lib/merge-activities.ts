// Shared semantic activity-merge logic used by DashboardClient and ActivitiesPage.

const SYNONYM_MAP: Record<string, string> = {
  avaliacao: 'PROVA', prova: 'PROVA', teste: 'PROVA', exame: 'PROVA',
  atividade: 'TAREFA', licao: 'TAREFA', tarefa: 'TAREFA', exercicio: 'TAREFA',
  consulta: 'CONSULTA', retorno: 'CONSULTA', sessao: 'CONSULTA',
}
const STOP_WORDS = new Set(['de', 'da', 'do', 'dos', 'das', 'a', 'o', 'e', 'em', 'um', 'uma'])

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim()
    .split(' ')
    .filter(w => !STOP_WORDS.has(w))
    .map(w => SYNONYM_MAP[w] ?? w)
    .join(' ')
}

export function titlesSimilar(a: string, b: string): boolean {
  const na = normalizeTitle(a)
  const nb = normalizeTitle(b)
  if (na === nb) return true
  const [shorter, longer] = na.length <= nb.length ? [na, nb] : [nb, na]
  if (longer.startsWith(shorter) || longer.endsWith(shorter) || longer.includes(shorter)) return true
  const wordsA = na.split(' ')
  const wordsB = new Set(nb.split(' '))
  const overlap = wordsA.filter(w => wordsB.has(w)).length
  return overlap / wordsA.length >= 0.80
}

export function mergeActivities<T extends { title: string; date: string; category: string }>(
  acts: T[]
): T[][] {
  const groups: T[][] = []
  for (const a of acts) {
    const existing = groups.find(g =>
      g[0].date === a.date &&
      g[0].category === a.category &&
      titlesSimilar(g[0].title, a.title)
    )
    if (existing) existing.push(a)
    else groups.push([a])
  }
  return groups
}
