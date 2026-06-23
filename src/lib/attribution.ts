// Atribuição de aquisição (UTM + referrer), capturada no signup e enviada
// ao completar o cadastro. "Primeiro toque vence" — não sobrescreve.
const KEY = 'fef_attribution'
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

export interface Attribution {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  referrer?: string
  landing_path?: string
  captured_at?: string
}

/** Captura UTM/referrer da URL atual e guarda no localStorage (uma única vez). */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return
  try {
    if (localStorage.getItem(KEY)) return // primeiro toque vence
    const params = new URLSearchParams(window.location.search)
    const data: Attribution = {}
    for (const k of UTM_KEYS) {
      const v = params.get(k)
      if (v) data[k] = v
    }
    if (document.referrer) data.referrer = document.referrer
    if (Object.keys(data).length === 0) return // nada útil para guardar
    data.landing_path = window.location.pathname + window.location.search
    data.captured_at = new Date().toISOString()
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch { /* localStorage indisponível */ }
}

export function readAttribution(): Attribution | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Attribution) : null
  } catch { return null }
}

export function clearAttribution(): void {
  try { localStorage.removeItem(KEY) } catch { /* noop */ }
}
